// ============================================================
// Data Context
// ============================================================
// Manages data persistence: save, load, import, export

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { safeLocalStorageGet, safeLocalStorageSet } from '../utils/storageUtils.js';
import { getActualStats, calculatePokemonHP } from '../utils/dataUtils.js';

const DataContext = createContext(null);

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within DataProvider');
    }
    return context;
};

export const DataProvider = ({
    children,
    trainers,
    setTrainers,
    activeTrainerId,
    setActiveTrainerId,
    inventory,
    setInventory,
    customSpecies,
    setCustomSpecies,
    onSaveComplete
}) => {
    // Discord webhook state
    const [discordWebhook, setDiscordWebhook] = useState(() => {
        try {
            const saved = localStorage.getItem('pta-discord-webhook');
            return saved ? JSON.parse(saved) : { url: '', enabled: false, showSettings: false };
        } catch {
            return { url: '', enabled: false, showSettings: false };
        }
    });

    // Auto-save refs
    const dataLoadedRef = useRef(false);
    const lastAutoSaveDataRef = useRef(null);

    // Save Discord webhook settings
    useEffect(() => {
        try {
            localStorage.setItem('pta-discord-webhook', JSON.stringify({
                url: discordWebhook.url,
                enabled: discordWebhook.enabled,
                showSettings: false
            }));
        } catch (e) {
            console.warn('Could not save Discord webhook settings');
        }
    }, [discordWebhook.url, discordWebhook.enabled]);

    // Note: dataLoadedRef is now set in loadData after data is actually loaded

    // Save data to storage
    const saveData = useCallback(async (isAuto = false) => {
        try {
            const savePayload = {
                trainers,
                activeTrainerId,
                inventory,
                customSpecies,
                lastSaved: new Date().toISOString(),
                version: '2.1'
            };

            let saveSuccess = false;

            if (window.storage) {
                const result = await window.storage.set('pta-enhanced-save-data', JSON.stringify(savePayload));
                saveSuccess = !!result;
            } else {
                saveSuccess = safeLocalStorageSet('pta-enhanced-save-data', savePayload);
            }

            if (saveSuccess && onSaveComplete) {
                onSaveComplete(isAuto);
            }
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }, [trainers, activeTrainerId, inventory, customSpecies, onSaveComplete]);

    // Migrate old data format
    const migrateOldData = useCallback((loadedData) => {
        const migrateSkillsToObject = (skills) => {
            if (!skills) return {};
            if (Array.isArray(skills)) {
                return skills.reduce((acc, skill) => {
                    acc[skill] = 1;
                    return acc;
                }, {});
            }
            return skills;
        };

        const migratePokemonToPartyReserve = (trainerData) => {
            if (trainerData.party !== undefined || trainerData.reserve !== undefined) {
                return {
                    ...trainerData,
                    party: trainerData.party || [],
                    reserve: trainerData.reserve || []
                };
            }

            const allPokemon = trainerData.pokemon || [];
            return {
                ...trainerData,
                party: allPokemon.slice(0, 6),
                reserve: allPokemon.slice(6),
                pokemon: undefined
            };
        };

        if (loadedData.trainer && !loadedData.trainers) {
            let trainerData = loadedData.trainer;

            if (!trainerData.classes) {
                const migratedClasses = [];
                if (trainerData.class) migratedClasses.push(trainerData.class);
                if (trainerData.advancedClass) migratedClasses.push(trainerData.advancedClass);
                trainerData = { ...trainerData, classes: migratedClasses };
            }

            trainerData = {
                ...trainerData,
                id: trainerData.id || Date.now(),
                pokemon: loadedData.pokemon || trainerData.pokemon || []
            };

            trainerData = migratePokemonToPartyReserve(trainerData);
            trainerData = {
                ...trainerData,
                skills: migrateSkillsToObject(trainerData.skills)
            };

            return {
                trainers: [trainerData],
                activeTrainerId: trainerData.id,
                inventory: loadedData.inventory || []
            };
        }

        if (loadedData.trainers) {
            return {
                ...loadedData,
                trainers: loadedData.trainers.map(t => ({
                    ...migratePokemonToPartyReserve(t),
                    skills: migrateSkillsToObject(t.skills)
                }))
            };
        }

        return loadedData;
    }, []);

    // Load data from storage
    const loadData = useCallback(async () => {
        try {
            let loadedData = null;

            if (window.storage) {
                try {
                    const result = await window.storage.get('pta-enhanced-save-data');
                    if (result && result.value) {
                        loadedData = JSON.parse(result.value);
                    }
                } catch (storageErr) {
                    console.warn('Cloud storage not available, falling back to localStorage');
                }
            }

            if (!loadedData) {
                loadedData = safeLocalStorageGet('pta-enhanced-save-data', null);
            }

            if (loadedData) {
                if (typeof loadedData !== 'object') {
                    console.error('Invalid data format loaded');
                    return;
                }

                const migratedData = migrateOldData(loadedData);

                if (migratedData.trainers && Array.isArray(migratedData.trainers) && migratedData.trainers.length > 0) {
                    // Validate activeTrainerId exists in trainers array, otherwise use first trainer
                    const validActiveId = migratedData.trainers.some(t => t.id === migratedData.activeTrainerId)
                        ? migratedData.activeTrainerId
                        : migratedData.trainers[0].id;
                    setTrainers(migratedData.trainers);
                    setActiveTrainerId(validActiveId);
                }
                setInventory(Array.isArray(migratedData.inventory) ? migratedData.inventory : []);
                setCustomSpecies(Array.isArray(migratedData.customSpecies) ? migratedData.customSpecies : []);
            }
            // Mark data as loaded AFTER loading completes
            dataLoadedRef.current = true;
        } catch (error) {
            console.error('Error loading data:', error);
            // Still enable auto-save on error so user can save their work
            dataLoadedRef.current = true;
        }
    }, [migrateOldData, setTrainers, setActiveTrainerId, setInventory, setCustomSpecies]);

    // Export all data as JSON file
    const exportAllData = useCallback(() => {
        const exportData = {
            trainers,
            activeTrainerId,
            inventory,
            customSpecies,
            exportedAt: new Date().toISOString(),
            version: '2.1',
            _m: { c: 'leander_rsr', h: '6c65616e6465725f727372' },
            _summary: {
                trainerCount: trainers.length,
                trainerNames: trainers.map(t => t.name || 'Unnamed').join(', '),
                totalMoney: trainers.reduce((sum, t) => sum + (t.money || 0), 0),
                inventoryItemCount: inventory.length,
                totalPokemon: trainers.reduce((sum, t) => sum + (t.party?.length || 0) + (t.reserve?.length || 0), 0)
            }
        };
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pta-all-trainers-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [trainers, activeTrainerId, inventory, customSpecies]);

    // Export single trainer
    const exportSingleTrainer = useCallback((trainerToExport) => {
        const exportData = {
            trainer: {
                ...trainerToExport,
                money: trainerToExport.money || 0,
                party: trainerToExport.party || [],
                reserve: trainerToExport.reserve || []
            },
            pokemon: [...(trainerToExport.party || []), ...(trainerToExport.reserve || [])],
            inventory: inventory,
            exportedAt: new Date().toISOString(),
            version: '1.1',
            _m: { c: 'leander_rsr', h: '6c65616e6465725f727372' },
            _summary: {
                trainerName: trainerToExport.name || 'Unnamed',
                trainerLevel: trainerToExport.level || 0,
                money: trainerToExport.money || 0,
                partyCount: (trainerToExport.party || []).length,
                reserveCount: (trainerToExport.reserve || []).length,
                inventoryItemCount: inventory.length
            }
        };
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${trainerToExport.name || 'trainer'}-pta-data.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [inventory]);

    // Import data from JSON file
    const importData = useCallback((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                const migrateSkills = (skills) => {
                    if (!skills) return {};
                    if (Array.isArray(skills)) {
                        return skills.reduce((acc, s) => ({ ...acc, [s]: 1 }), {});
                    }
                    return skills;
                };

                if (data.trainers) {
                    const migratedTrainers = data.trainers.map(t => ({
                        ...t,
                        money: t.money || 0,
                        party: t.party || t.pokemon?.slice(0, 6) || [],
                        reserve: t.reserve || t.pokemon?.slice(6) || [],
                        skills: migrateSkills(t.skills)
                    }));
                    setTrainers(migratedTrainers);
                    setActiveTrainerId(data.activeTrainerId || migratedTrainers[0]?.id);
                    if (data.inventory) setInventory(data.inventory);
                    if (data.customSpecies) setCustomSpecies(data.customSpecies);

                    const totalMoney = migratedTrainers.reduce((sum, t) => sum + (t.money || 0), 0);
                    const totalPokemon = migratedTrainers.reduce((sum, t) => sum + (t.party?.length || 0) + (t.reserve?.length || 0), 0);
                    const inventoryCount = data.inventory?.length || 0;

                    alert(`Data imported successfully!\n\n` +
                        `• ${migratedTrainers.length} trainer(s) loaded\n` +
                        `• ${totalPokemon} Pokémon total\n` +
                        `• ₽${totalMoney.toLocaleString()} total money\n` +
                        `• ${inventoryCount} inventory item(s)`);
                } else if (data.trainer) {
                    let trainerData = data.trainer;

                    if (!trainerData.classes) {
                        const migratedClasses = [];
                        if (trainerData.class) migratedClasses.push(trainerData.class);
                        if (trainerData.advancedClass) migratedClasses.push(trainerData.advancedClass);
                        trainerData = { ...trainerData, classes: migratedClasses };
                    }

                    trainerData = {
                        ...trainerData,
                        id: trainerData.id || Date.now(),
                        money: trainerData.money || 0,
                        party: trainerData.party || data.pokemon?.slice(0, 6) || trainerData.pokemon?.slice(0, 6) || [],
                        reserve: trainerData.reserve || data.pokemon?.slice(6) || trainerData.pokemon?.slice(6) || [],
                        skills: migrateSkills(trainerData.skills)
                    };

                    if (trainers.length > 0 && trainers[0].name) {
                        const choice = confirm(
                            `You have existing trainers. Do you want to:\n\n` +
                            `OK = Add "${trainerData.name || 'Imported Trainer'}" as a new trainer\n` +
                            `Cancel = Replace all trainers with this import`
                        );
                        if (choice) {
                            trainerData.id = Date.now();
                            setTrainers(prev => [...prev, trainerData]);
                            setActiveTrainerId(trainerData.id);
                        } else {
                            setTrainers([trainerData]);
                            setActiveTrainerId(trainerData.id);
                        }
                    } else {
                        setTrainers([trainerData]);
                        setActiveTrainerId(trainerData.id);
                    }

                    if (data.inventory && data.inventory.length > 0) {
                        if (inventory.length > 0) {
                            const inventoryChoice = confirm(
                                `The import file contains ${data.inventory.length} inventory item(s).\n\n` +
                                `OK = Merge with existing inventory\n` +
                                `Cancel = Replace existing inventory`
                            );
                            if (inventoryChoice) {
                                const mergedInventory = [...inventory];
                                data.inventory.forEach(importItem => {
                                    const existingIndex = mergedInventory.findIndex(i => i.name === importItem.name);
                                    if (existingIndex >= 0) {
                                        mergedInventory[existingIndex] = {
                                            ...mergedInventory[existingIndex],
                                            quantity: (mergedInventory[existingIndex].quantity || 1) + (importItem.quantity || 1)
                                        };
                                    } else {
                                        mergedInventory.push(importItem);
                                    }
                                });
                                setInventory(mergedInventory);
                            } else {
                                setInventory(data.inventory);
                            }
                        } else {
                            setInventory(data.inventory);
                        }
                    }

                    const pokemonCount = (trainerData.party?.length || 0) + (trainerData.reserve?.length || 0);
                    const inventoryCount = data.inventory?.length || 0;

                    alert(`Trainer imported successfully!\n\n` +
                        `• ${trainerData.name || 'Unnamed'} (Level ${trainerData.level || 0})\n` +
                        `• ${pokemonCount} Pokémon\n` +
                        `• ₽${(trainerData.money || 0).toLocaleString()} money\n` +
                        (inventoryCount > 0 ? `• ${inventoryCount} inventory item(s)` : ''));
                } else {
                    alert('Error: No trainer data found in file.');
                }
            } catch (err) {
                console.error('Import error:', err);
                alert('Error importing data: Invalid file format');
            }
        };
        reader.readAsText(file);
    }, [trainers, inventory, setTrainers, setActiveTrainerId, setInventory, setCustomSpecies]);

    // Export text functions
    const exportTrainerText = useCallback((trainer) => {
        const maxHP = (trainer.stats.hp * 4) + (trainer.level * 4);
        const genderSymbol = trainer.gender === 'male' ? '♂' : trainer.gender === 'female' ? '♀' : '';
        const classesDisplay = (trainer.classes && trainer.classes.length > 0) ? trainer.classes.join(' / ') : 'Trainer';

        let text = `**━━━━━━ TRAINER CARD ━━━━━━**\n`;
        text += `**${trainer.name || 'Unnamed'}** ${genderSymbol}\n`;
        text += `Level ${trainer.level} ${classesDisplay}\n\n`;
        text += `**Stats** (Max HP: ${maxHP})\n`;
        text += `HP: ${trainer.stats.hp} | ATK: ${trainer.stats.atk} | DEF: ${trainer.stats.def}\n`;
        text += `SATK: ${trainer.stats.satk} | SDEF: ${trainer.stats.sdef} | SPD: ${trainer.stats.spd}\n\n`;

        const featureNames = trainer.features.map(f => typeof f === 'object' ? f.name : f);
        if (featureNames.length > 0) {
            text += `**Features:** ${featureNames.join(', ')}\n`;
        }

        const skillsForDisplay = Array.isArray(trainer.skills)
            ? trainer.skills
            : Object.entries(trainer.skills || {})
                .filter(([_, rank]) => rank > 0)
                .map(([name, rank]) => rank === 2 ? `${name} (★★)` : name);
        if (skillsForDisplay.length > 0) {
            text += `**Skills:** ${skillsForDisplay.join(', ')}\n`;
        }
        if (trainer.badges?.length > 0) {
            text += `**Badges:** ${trainer.badges.length}\n`;
        }
        text += `**Money:** ₽${(trainer.money || 0).toLocaleString()}\n`;
        text += `**━━━━━━━━━━━━━━━━━━━━━**`;

        return text;
    }, []);

    const exportPokemonText = useCallback((poke) => {
        const actualStats = getActualStats(poke);
        const maxHP = calculatePokemonHP(poke);
        const genderSymbol = poke.gender === 'male' ? '♂' : poke.gender === 'female' ? '♀' : poke.gender === 'genderless' ? '⚪' : '';

        let text = `**━━━━━━ POKÉMON ━━━━━━**\n`;
        text += `**${poke.name}** ${genderSymbol}`;
        if (poke.species && poke.species !== poke.name) {
            text += ` (${poke.species})`;
        }
        text += `\n`;
        text += `Level ${poke.level} | ${poke.types.join('/')} | ${poke.nature} Nature\n`;

        const abilities = [poke.ability, poke.ability2, poke.ability3].filter(a => a);
        text += `**Abilities:** ${abilities.length > 0 ? abilities.join(', ') : 'None'}\n`;

        const skills = (poke.pokemonSkills || []);
        if (skills.length > 0) {
            const skillsStr = skills.map(s => s.value ? `${s.name} ${s.value}` : s.name).join(', ');
            text += `**Skills:** ${skillsStr}\n`;
        }
        text += `\n`;

        text += `**Stats** (Max HP: ${maxHP})\n`;
        text += `HP: ${actualStats.hp} | ATK: ${actualStats.atk} | DEF: ${actualStats.def}\n`;
        text += `SATK: ${actualStats.satk} | SDEF: ${actualStats.sdef} | SPD: ${actualStats.spd}\n\n`;

        if (poke.moves.length > 0) {
            text += `**Moves:**\n`;
            poke.moves.forEach(move => {
                text += `• ${move.name} (${move.type}) - ${move.damage || 'Status'} [${move.frequency}]\n`;
            });
        }

        text += `**━━━━━━━━━━━━━━━━━━━━━**`;

        return text;
    }, []);

    const exportTeamText = useCallback((trainer, party) => {
        const genderSymbol = trainer.gender === 'male' ? '♂' : trainer.gender === 'female' ? '♀' : '';
        const classesDisplay = (trainer.classes && trainer.classes.length > 0) ? trainer.classes.join(' / ') : 'Trainer';

        let text = `**╔══════════════════════════════════════╗**\n`;
        text += `**║     ${trainer.name || 'Unnamed'} ${genderSymbol} - TEAM CARD     ║**\n`;
        text += `**╚══════════════════════════════════════╝**\n\n`;

        text += `📋 **TRAINER INFO**\n`;
        text += `Level ${trainer.level} ${classesDisplay}\n`;
        text += `💰 ₽${(trainer.money || 0).toLocaleString()} | 🎖️ ${trainer.badges?.length || 0} Badges\n\n`;

        text += `⚔️ **ACTIVE PARTY** (${party.length}/6)\n`;
        text += `─────────────────────────────────\n`;

        if (party.length === 0) {
            text += `(No Pokémon in party)\n`;
        } else {
            party.forEach((poke, idx) => {
                const actualStats = getActualStats(poke);
                const maxHP = calculatePokemonHP(poke);
                const currentHP = maxHP - (poke.currentDamage || 0);
                const genderIcon = poke.gender === 'male' ? '♂' : poke.gender === 'female' ? '♀' : '';
                const typeStr = poke.types?.join('/') || 'Normal';

                text += `\n**${idx + 1}. ${poke.name || poke.species || 'Unknown'}** ${genderIcon}\n`;
                text += `   Lv.${poke.level} | ${typeStr} | HP: ${currentHP}/${maxHP}\n`;
                text += `   ATK:${actualStats.atk} DEF:${actualStats.def} SATK:${actualStats.satk} SDEF:${actualStats.sdef} SPD:${actualStats.spd}\n`;

                if (poke.moves && poke.moves.length > 0) {
                    const moveNames = poke.moves.slice(0, 4).map(m => m.name).join(', ');
                    text += `   Moves: ${moveNames}\n`;
                }
            });
        }

        text += `\n─────────────────────────────────\n`;
        text += `📅 ${new Date().toLocaleDateString()} | P:TA Character Manager`;

        return text;
    }, []);

    // Copy to clipboard
    const copyToClipboard = useCallback((text) => {
        navigator.clipboard.writeText(text).then(() => {
            alert('Copied to clipboard! Paste in Discord or anywhere.');
        }).catch(err => {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Copied to clipboard!');
        });
    }, []);

    // Send to Discord
    const sendToDiscord = useCallback(async (roll, trainerName) => {
        if (!discordWebhook.enabled || !discordWebhook.url) return;

        try {
            let embed = {
                timestamp: new Date().toISOString(),
                footer: { text: `${trainerName || 'Trainer'} • PTA Manager` }
            };

            const colors = {
                pokemon: 0xF5A623,
                accuracy: 0x3498DB,
                trainer: 0x667EEA,
                trainer_skill: 0x667EEA,
                trainer_d20: 0x667EEA,
                custom: 0x95A5A6,
                pokemonSkill: 0x9B59B6
            };
            embed.color = colors[roll.type] || 0x667EEA;

            // Build title and description based on roll type
            if (roll.type === 'pokemon') {
                embed.title = `🎲 ${roll.pokemon} used ${roll.move}!`;

                if (roll.isHit === false) {
                    embed.description = `**MISS!** (Rolled ${roll.accRoll}${roll.accModifier ? ` + ${roll.accModifier}` : ''} = ${roll.modifiedAccRoll || roll.accRoll} vs AC ${roll.moveAC})`;
                    embed.color = 0x95A5A6;
                } else {
                    embed.fields = [
                        { name: '📊 Damage Roll', value: `**${roll.total}** damage`, inline: true },
                        { name: '🎯 Accuracy', value: roll.isCrit ? `**${roll.accRoll}** - CRITICAL HIT! 💥` : `**${roll.accRoll}** vs AC ${roll.moveAC}${roll.acWasOverridden ? ' (DM)' : ''}`, inline: true }
                    ];

                    if (roll.dice && roll.rolls) {
                        embed.fields.push({ name: '🎲 Dice', value: `${roll.dice} → [${roll.rolls.join(', ')}] = ${roll.diceTotal}`, inline: false });
                    }

                    let breakdown = [];
                    if (roll.statBonus) breakdown.push(`+${roll.statBonus} stat`);
                    if (roll.stabBonus) breakdown.push(`+${roll.stabBonus} STAB`);
                    if (breakdown.length > 0) {
                        embed.fields.push({ name: '📈 Bonuses', value: breakdown.join(', '), inline: true });
                    }

                    embed.fields.push({ name: '⚔️ Type', value: `${roll.moveType} (${roll.category})`, inline: true });
                }

            } else if (roll.type === 'accuracy') {
                embed.title = `🎯 ${roll.pokemon} - Accuracy Check`;
                embed.description = roll.isCrit
                    ? `**${roll.total}** - CRITICAL HIT! 💥`
                    : `**${roll.total}**`;

            } else if (roll.type === 'trainer_skill' || roll.type === 'trainer') {
                embed.title = `🧑‍🏫 Trainer Skill: ${roll.skill}`;
                embed.fields = [
                    { name: '🎲 Result', value: `**${roll.total}**`, inline: true },
                    { name: '📊 Rolls', value: `[${roll.rolls.join(', ')}]`, inline: true }
                ];
                if (roll.hasSkill) {
                    embed.fields.push({ name: '✅ Trained', value: `+${roll.bonus} bonus`, inline: true });
                }
                if (roll.skillStat) {
                    embed.fields.push({ name: '📈 Stat', value: roll.skillStat, inline: true });
                }

            } else if (roll.type === 'trainer_d20') {
                embed.title = `🎯 Trainer: ${roll.skill}`;
                embed.description = `Rolled **${roll.total}** on d20`;

            } else if (roll.type === 'pokemonSkill') {
                embed.title = `🐾 ${roll.pokemon} - ${roll.skill}`;
                embed.fields = [
                    { name: '🎲 Result', value: `**${roll.total}**`, inline: true },
                    { name: '📊 Dice', value: `${roll.dice} → [${roll.rolls.join(', ')}]`, inline: true }
                ];
                if (roll.modifier) {
                    embed.fields.push({ name: '📈 Modifier', value: `+${roll.modifier}`, inline: true });
                }

            } else if (roll.type === 'custom') {
                embed.title = `🎲 Custom Roll: ${roll.dice}`;
                embed.fields = [
                    { name: '🎲 Result', value: `**${roll.total}**`, inline: true },
                    { name: '📊 Rolls', value: `[${roll.rolls.join(', ')}]`, inline: true }
                ];
            }

            await fetch(discordWebhook.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: 'PTA Dice Roller',
                    avatar_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
                    embeds: [embed]
                })
            });
        } catch (error) {
            console.error('Failed to send to Discord:', error);
        }
    }, [discordWebhook.enabled, discordWebhook.url]);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Debounced auto-save on data changes (1 second delay)
    useEffect(() => {
        if (!dataLoadedRef.current) return;

        const saveTimeout = setTimeout(() => {
            saveData();
        }, 1000);

        return () => clearTimeout(saveTimeout);
    }, [trainers, inventory, activeTrainerId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Interval-based auto-save (every 2 minutes, only if changed)
    useEffect(() => {
        if (!dataLoadedRef.current) return;

        const AUTO_SAVE_INTERVAL = 2 * 60 * 1000;

        const autoSaveInterval = setInterval(() => {
            const currentDataSnapshot = JSON.stringify({
                trainers,
                activeTrainerId,
                inventory,
                customSpecies
            });

            if (lastAutoSaveDataRef.current !== currentDataSnapshot) {
                console.log('Auto-saving...');
                saveData(true);
                lastAutoSaveDataRef.current = currentDataSnapshot;
            }
        }, AUTO_SAVE_INTERVAL);

        lastAutoSaveDataRef.current = JSON.stringify({
            trainers,
            activeTrainerId,
            inventory,
            customSpecies
        });

        return () => clearInterval(autoSaveInterval);
    }, [trainers, activeTrainerId, inventory, customSpecies]); // eslint-disable-line react-hooks/exhaustive-deps

    const value = {
        // Inventory State
        inventory,
        setInventory,

        // Persistence
        saveData,
        loadData,
        exportAllData,
        exportSingleTrainer,
        importData,

        // Export Text
        exportTrainerText,
        exportPokemonText,
        exportTeamText,
        copyToClipboard,

        // Discord
        discordWebhook,
        setDiscordWebhook,
        sendToDiscord
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export default DataContext;
