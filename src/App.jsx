// ============================================================
// PTA MANAGER - MAIN APPLICATION COMPONENT
// ============================================================
// Created by: leander_rsr | All Rights Reserved
// 
// LEGAL DISCLAIMER & COPYRIGHT NOTICE
// This is an UNOFFICIAL, NON-COMMERCIAL fan-made tool created for personal use
// with the Pokémon Tabletop Adventures (PTA) tabletop role-playing game system.
//
// TRADEMARK NOTICE:
// Pokémon, Pokémon character names, Nintendo, Game Freak, and all related marks
// are trademarks, registered trademarks, or copyrights of Nintendo, Game Freak,
// Creatures Inc., and The Pokémon Company.

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// Data & Configs
import { DATA_CONFIG, POKEDEX_CONFIG, FALLBACK_POKEDEX, GAME_DATA } from './data/configs.js';
import { gameDataLoadPromise } from './data/gameDataLoader.js';
import { getFromPokedexDB, saveToPokedexDB } from './data/pokedexLoader.js';

// Utilities
import { safeLocalStorageGet, safeLocalStorageSet } from './utils/storageUtils.js';
import {
    calculateSTAB,
    getActualStats,
    calculatePokemonHP
} from './utils/dataUtils.js';
import { exportTrainerText as exportTrainerTextUtil } from './utils/exportUtils.js';

// Context
import { AppContext } from './contexts/AppContext.js';

// Tab Components
import { NotesTab } from './components/notes';
import { ReferenceTab } from './components/reference';
import { InventoryTab } from './components/inventory';
import { BattleTab } from './components/battle';
import { TrainerTab } from './components/trainer';
import { PokemonTab } from './components/pokemon';

// Modal Components
import {
    DetailModal,
    CustomFeatureModal,
    CustomMoveModal,
    CustomSpeciesModal,
    MoveLearnModal,
    RegionalFormModal,
    SkillPickerModal,
    CardExportModal
} from './components/modals';

// Common Components
import { Header, SaveIndicator, LevelUpNotification } from './components/common';
import AppProviders from './components/AppProviders.jsx';

const PTAManager = () => {
// ============================================================
// STATE DECLARATIONS
// ============================================================

// --- Navigation & UI State ---
const [activeTab, setActiveTab] = useState('trainer');
const [showSaveIndicator, setShowSaveIndicator] = useState(false);
const [isAutoSave, setIsAutoSave] = useState(false);
const [lastSaveTime, setLastSaveTime] = useState(null);
const [levelUpNotification, setLevelUpNotification] = useState(null);

// --- Custom Species State ---
const [customSpecies, setCustomSpecies] = useState([]);

// --- Move Learning Modal State ---
const [showMoveLearnModal, setShowMoveLearnModal] = useState(false);
const [moveLearnData, setMoveLearnData] = useState(null);
const [pendingMoveLearn, setPendingMoveLearn] = useState([]);

// --- Pokédex State ---
const [pokedex, setPokedex] = useState([]);
const [pokedexLoading, setPokedexLoading] = useState(true);
const [pokedexError, setPokedexError] = useState(null);
const [gameDataLoaded, setGameDataLoaded] = useState(GAME_DATA._loaded || false);

// ============================================================
// TRAINER DATA STRUCTURE
// ============================================================

const defaultTrainer = {
    id: Date.now(),
    name: '',
    gender: '',
    age: '',
    avatar: '',
    level: 0,
    experience: 0,
    classes: [],
    stats: { hp: 6, atk: 6, def: 6, satk: 6, sdef: 6, spd: 6 },
    statPoints: 30,        // Character creation points (cap at 14 per stat)
    levelStatPoints: 0,    // Level-up stat points (no cap)
    featPoints: 0,         // Feature points
    skills: [],
    features: [],
    notes: '',
    badges: [],
    money: 0,
    pokemon: [],           // Legacy - will be migrated
    party: [],             // Active party - max 6 Pokemon
    reserve: []            // Reserve/PC storage - unlimited
};

// --- Multi-Trainer Management ---
const [trainers, setTrainers] = useState([{ ...defaultTrainer }]);
const [activeTrainerId, setActiveTrainerId] = useState(null);

// Current active trainer (computed)
const trainer = trainers.find(t => t.id === activeTrainerId) || trainers[0] || defaultTrainer;

// Helper to update current trainer
const setTrainer = (updater) => {
    setTrainers(prev => prev.map(t => {
        if (t.id === (activeTrainerId || prev[0]?.id)) {
            return typeof updater === 'function' ? updater(t) : { ...t, ...updater };
        }
        return t;
    }));
};

// Pokemon view state
const [pokemonView, setPokemonView] = useState('party'); // 'party' or 'reserve'

// Get pokemon for current trainer (combined for backward compatibility)
const party = trainer.party || [];
const reserve = trainer.reserve || [];
const pokemon = [...party, ...reserve]; // Combined for functions that need all pokemon

// Helper to update party pokemon
const setParty = (updater) => {
    setTrainers(prev => prev.map(t => {
        if (t.id === (activeTrainerId || prev[0]?.id)) {
            const newParty = typeof updater === 'function' ? updater(t.party || []) : updater;
            return { ...t, party: newParty };
        }
        return t;
    }));
};

// Helper to update reserve pokemon
const setReserve = (updater) => {
    setTrainers(prev => prev.map(t => {
        if (t.id === (activeTrainerId || prev[0]?.id)) {
            const newReserve = typeof updater === 'function' ? updater(t.reserve || []) : updater;
            return { ...t, reserve: newReserve };
        }
        return t;
    }));
};

// Pokemon state (for editing)
const [editingPokemon, setEditingPokemon] = useState(null);

// Inventory state
const [inventory, setInventory] = useState([]);

// Battle calculator state
const [diceRoller, setDiceRoller] = useState({
    mode: 'pokemon',
    selectedPokemon: null,
    selectedMove: null,
    selectedSkill: '',
    customDice: '',
    combatStages: { atk: 0, satk: 0, def: 0, sdef: 0, spd: 0, acc: 0, eva: 0 },
    rollHistory: [],
    stabApplied: false
});

// Discord webhook integration state
const [discordWebhook, setDiscordWebhook] = useState(() => {
    try {
        const saved = localStorage.getItem('pta-discord-webhook');
        return saved ? JSON.parse(saved) : { url: '', enabled: false, showSettings: false };
    } catch {
        return { url: '', enabled: false, showSettings: false };
    }
});

// Save Discord webhook settings to localStorage
useEffect(() => {
    try {
        localStorage.setItem('pta-discord-webhook', JSON.stringify({
            url: discordWebhook.url,
            enabled: discordWebhook.enabled,
            showSettings: false // Don't persist the open state
        }));
    } catch (e) {
        console.warn('Could not save Discord webhook settings');
    }
}, [discordWebhook.url, discordWebhook.enabled]);

// Send roll result to Discord webhook
const sendToDiscord = useCallback(async (roll) => {
    if (!discordWebhook.enabled || !discordWebhook.url) return;

    try {
        // Build the embed based on roll type
        let embed = {
            timestamp: new Date().toISOString(),
            footer: { text: `${trainer?.name || 'Trainer'} • PTA Manager` }
        };

        // Color based on roll type
        const colors = {
            pokemon: 0xF5A623,      // Orange
            accuracy: 0x3498DB,     // Blue
            trainer: 0x667EEA,      // Purple
            trainer_skill: 0x667EEA,
            trainer_d20: 0x667EEA,
            custom: 0x95A5A6,       // Gray
            pokemonSkill: 0x9B59B6  // Purple
        };
        embed.color = colors[roll.type] || 0x667EEA;

        // Build title and description based on roll type
        if (roll.type === 'pokemon') {
            embed.title = `🎲 ${roll.pokemon} used ${roll.move}!`;

            // Handle hit/miss from accuracy check
            if (roll.isHit === false) {
                embed.description = `**MISS!** (Rolled ${roll.accRoll}${roll.accModifier ? ` + ${roll.accModifier}` : ''} = ${roll.modifiedAccRoll || roll.accRoll} vs AC ${roll.moveAC})`;
                embed.color = 0x95A5A6; // Gray for miss
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

        // Send to Discord
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
}, [discordWebhook.enabled, discordWebhook.url, trainer?.name]);

// Initialize activeTrainerId on first load
useEffect(() => {
    if (!activeTrainerId && trainers.length > 0) {
        setActiveTrainerId(trainers[0].id);
    }
}, [trainers]);

// Load data on mount
useEffect(() => {
    loadData();
}, []);

// Auto-save interval (every 2 minutes)
const dataLoadedRef = useRef(false);
const lastAutoSaveDataRef = useRef(null);

useEffect(() => {
    // Mark data as loaded after initial load completes
    if (trainers.length > 0 && trainers[0].id) {
        dataLoadedRef.current = true;
    }
}, [trainers]);

useEffect(() => {
    // Don't start auto-save until data is loaded
    if (!dataLoadedRef.current) return;

    const AUTO_SAVE_INTERVAL = 2 * 60 * 1000; // 2 minutes

    const autoSaveInterval = setInterval(() => {
        // Create a snapshot of current data to compare
        const currentDataSnapshot = JSON.stringify({
            trainers,
            activeTrainerId,
            inventory,
            customSpecies
        });

        // Only auto-save if data has changed since last auto-save
        if (lastAutoSaveDataRef.current !== currentDataSnapshot) {
            console.log('Auto-saving...');
            saveData(true); // true = isAuto
            lastAutoSaveDataRef.current = currentDataSnapshot;
        }
    }, AUTO_SAVE_INTERVAL);

    // Set initial snapshot
    lastAutoSaveDataRef.current = JSON.stringify({
        trainers,
        activeTrainerId,
        inventory,
        customSpecies
    });

    return () => clearInterval(autoSaveInterval);
}, [trainers, activeTrainerId, inventory, customSpecies]);

// ============================================================
// GAME DATA & POKÉDEX FETCH & CACHE
// ============================================================

// Wait for game data to load and update state
useEffect(() => {
    gameDataLoadPromise.then(loaded => {
        setGameDataLoaded(loaded);
        // Force a re-render if game data was loaded
        if (loaded && GAME_DATA._loaded) {
            console.log('Game data ready:', 
                Object.keys(GAME_DATA.moves || {}).length, 'moves,',
                Object.keys(GAME_DATA.abilities || {}).length, 'abilities,',
                Object.keys(GAME_DATA.features || {}).length, 'features');
        }
    });
}, []);

useEffect(() => {
    const fetchPokedex = async () => {
        setPokedexLoading(true);
        setPokedexError(null);
        
        try {
            // 1. Check IndexedDB cache first
            const cachedMeta = await getFromPokedexDB('metadata');
            if (cachedMeta && (Date.now() - cachedMeta.timestamp) < POKEDEX_CONFIG.cacheDuration) {
                const cachedData = await getFromPokedexDB('pokedex');
                if (cachedData && Array.isArray(cachedData)) {
                    console.log('Pokédex loaded from cache:', cachedData.length, 'species');
                    setPokedex(cachedData);
                    setPokedexLoading(false);
                    return;
                }
            }
            
            // 2. Fetch from GitHub
            console.log('Fetching Pokédex from remote...');
            const response = await fetch(POKEDEX_CONFIG.remoteUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Read as ArrayBuffer to inspect the bytes
            const arrayBuffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            
            // Debug: log first few bytes
            console.log('Response size:', uint8Array.length, 'bytes');
            // Debug: console.log('First 10 bytes:', Array.from(uint8Array.slice(0, 10)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
            
            let responseText;
            let encoding = 'utf-8';
            
            // Detect encoding from BOM (Byte Order Mark)
            if (uint8Array.length >= 2) {
                // UTF-16 LE BOM: 0xFF 0xFE
                if (uint8Array[0] === 0xFF && uint8Array[1] === 0xFE) {
                    encoding = 'utf-16le';
                    console.log('Detected UTF-16 LE encoding');
                }
                // UTF-16 BE BOM: 0xFE 0xFF
                else if (uint8Array[0] === 0xFE && uint8Array[1] === 0xFF) {
                    encoding = 'utf-16be';
                    console.log('Detected UTF-16 BE encoding');
                }
                // UTF-8 BOM: 0xEF 0xBB 0xBF
                else if (uint8Array.length >= 3 && uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF) {
                    encoding = 'utf-8';
                    console.log('Detected UTF-8 with BOM');
                }
                // Gzip: 0x1F 0x8B
                else if (uint8Array[0] === 0x1F && uint8Array[1] === 0x8B) {
                    console.log('Detected gzip compression, decompressing...');
                    
                    if (typeof DecompressionStream === 'undefined') {
                        throw new Error('Gzip decompression not supported');
                    }
                    
                    const stream = new ReadableStream({
                        start(controller) {
                            controller.enqueue(uint8Array);
                            controller.close();
                        }
                    });
                    
                    const ds = new DecompressionStream('gzip');
                    const decompressedStream = stream.pipeThrough(ds);
                    const decompressedResponse = new Response(decompressedStream);
                    responseText = await decompressedResponse.text();
                    console.log('Decompressed successfully, length:', responseText.length);
                }
            }
            
            // If not already decompressed (gzip case), decode with detected encoding
            if (!responseText) {
                const decoder = new TextDecoder(encoding);
                responseText = decoder.decode(uint8Array);
                console.log('Decoded as', encoding + ', length:', responseText.length);
            }
            
            // Validate JSON structure
            const trimmed = responseText.trim();
            if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
                console.error('Invalid response (first 100 chars):', trimmed.substring(0, 100));
                console.error('First char code:', trimmed.charCodeAt(0));
                throw new Error('Response is not valid JSON');
            }
            
            // Parse JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Response preview:', responseText.substring(0, 200));
                throw new Error('Failed to parse Pokédex JSON');
            }
            
            const pokemonList = data.pokemon || data;
            
            if (!Array.isArray(pokemonList)) {
                throw new Error('Invalid Pokédex format - expected array');
            }
            
            // 3. Cache in IndexedDB
            await saveToPokedexDB('pokedex', pokemonList);
            await saveToPokedexDB('metadata', { 
                timestamp: Date.now(),
                count: pokemonList.length
            });
            
            console.log('Pokédex loaded:', pokemonList.length, 'species');
            setPokedex(pokemonList);
            
        } catch (error) {
            console.warn('Pokédex fetch failed:', error.message);
            
            // Try stale cache
            const staleCache = await getFromPokedexDB('pokedex');
            if (staleCache && Array.isArray(staleCache)) {
                console.log('Using stale cache');
                setPokedex(staleCache);
                setPokedexError('Using cached data');
            } else if (POKEDEX_CONFIG.fallbackEnabled) {
                // Use embedded fallback
                console.log('Using fallback Pokédex');
                setPokedex(FALLBACK_POKEDEX);
                setPokedexError('Using offline mini-dex (19 Pokémon)');
            } else {
                setPokedexError('Pokédex unavailable - manual entry only');
            }
        } finally {
            setPokedexLoading(false);
        }
    };
    
    fetchPokedex();
}, []);

// Auto-save functionality
useEffect(() => {
    const saveTimeout = setTimeout(() => {
        saveData();
    }, 1000);
    
    return () => clearTimeout(saveTimeout);
}, [trainers, inventory, activeTrainerId]);

// Save data to storage
const saveData = async (isAuto = false) => {
    try {
        const savePayload = {
            trainers,
            activeTrainerId,
            inventory,
            customSpecies,
            lastSaved: new Date().toISOString(),
            version: '2.1' // Added custom species support
        };

        let saveSuccess = false;

        if (window.storage) {
            // Use Claude's persistent storage if available
            const result = await window.storage.set('pta-enhanced-save-data', JSON.stringify(savePayload));
            saveSuccess = !!result;
        } else {
            // Fallback to localStorage with safe wrapper
            saveSuccess = safeLocalStorageSet('pta-enhanced-save-data', savePayload);
        }

        if (saveSuccess) {
            setIsAutoSave(isAuto);
            setLastSaveTime(new Date());
            setShowSaveIndicator(true);
            setTimeout(() => setShowSaveIndicator(false), 2000);
        } else {
            console.warn('Save may not have persisted properly');
        }
    } catch (error) {
        console.error('Error saving data:', error);
    }
};

// Migrate old single-trainer data to multi-trainer format
const migrateOldData = (loadedData) => {
    // Helper to migrate skills from array to object format
    const migrateSkillsToObject = (skills) => {
        if (!skills) return {};
        if (Array.isArray(skills)) {
            // Convert array format to object with rank 1
            return skills.reduce((acc, skill) => {
                acc[skill] = 1;
                return acc;
            }, {});
        }
        // Already object format
        return skills;
    };

    // Helper to migrate pokemon array to party/reserve
    const migratePokemonToPartyReserve = (trainerData) => {
        // If already has party/reserve, just ensure they exist
        if (trainerData.party !== undefined || trainerData.reserve !== undefined) {
            return {
                ...trainerData,
                party: trainerData.party || [],
                reserve: trainerData.reserve || []
            };
        }
        
        // Migrate from old pokemon array
        const allPokemon = trainerData.pokemon || [];
        return {
            ...trainerData,
            party: allPokemon.slice(0, 6),
            reserve: allPokemon.slice(6),
            pokemon: undefined // Remove old field
        };
    };
    
    // Check if it's old format (has trainer instead of trainers)
    if (loadedData.trainer && !loadedData.trainers) {
        let trainerData = loadedData.trainer;
        
        // Migrate old class/advancedClass to classes array
        if (!trainerData.classes) {
            const migratedClasses = [];
            if (trainerData.class) migratedClasses.push(trainerData.class);
            if (trainerData.advancedClass) migratedClasses.push(trainerData.advancedClass);
            trainerData = { ...trainerData, classes: migratedClasses };
        }
        
        // Add ID and pokemon array to trainer
        trainerData = {
            ...trainerData,
            id: trainerData.id || Date.now(),
            pokemon: loadedData.pokemon || trainerData.pokemon || []
        };
        
        // Migrate to party/reserve
        trainerData = migratePokemonToPartyReserve(trainerData);

        // Migrate skills to object format
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

    // Multi-trainer format - migrate each trainer's pokemon to party/reserve and skills
    if (loadedData.trainers) {
        return {
            ...loadedData,
            trainers: loadedData.trainers.map(t => ({
                ...migratePokemonToPartyReserve(t),
                skills: migrateSkillsToObject(t.skills)
            }))
        };
    }
    
    // Already new format
    return loadedData;
};

// Load data from storage
const loadData = async () => {
    try {
        let loadedData = null;
        
        if (window.storage) {
            // Use Claude's persistent storage if available
            try {
                const result = await window.storage.get('pta-enhanced-save-data');
                if (result && result.value) {
                    loadedData = JSON.parse(result.value);
                }
            } catch (storageErr) {
                console.warn('Cloud storage not available, falling back to localStorage');
            }
        }
        
        // Fallback to localStorage if no cloud data
        if (!loadedData) {
            loadedData = safeLocalStorageGet('pta-enhanced-save-data', null);
        }
        
        if (loadedData) {
            // Validate data structure before using
            if (typeof loadedData !== 'object') {
                console.error('Invalid data format loaded');
                return;
            }
            
            // Migrate old format if needed
            const migratedData = migrateOldData(loadedData);
            
            if (migratedData.trainers && Array.isArray(migratedData.trainers) && migratedData.trainers.length > 0) {
                setTrainers(migratedData.trainers);
                setActiveTrainerId(migratedData.activeTrainerId || migratedData.trainers[0].id);
            }
            setInventory(Array.isArray(migratedData.inventory) ? migratedData.inventory : []);
            setCustomSpecies(Array.isArray(migratedData.customSpecies) ? migratedData.customSpecies : []);
        }
    } catch (error) {
        console.error('Error loading data:', error);
        // Don't crash - app will start with default state
    }
};

// Export trainer for Discord/sharing
const exportTrainerText = () => exportTrainerTextUtil(trainer); // Wrapper for local trainer

// ============================================================
// EXPORT/IMPORT FUNCTIONS
// ============================================================

/** Export Pokemon data as formatted text for Discord/sharing */
const exportPokemonText = (poke) => {
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
    
    // Build abilities list
    const abilities = [poke.ability, poke.ability2, poke.ability3].filter(a => a);
    text += `**Abilities:** ${abilities.length > 0 ? abilities.join(', ') : 'None'}\n`;
    
    // Build skills list
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
};

/** Export Team data as formatted text for Discord/sharing */
const exportTeamText = () => {
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
            
            // Show moves (max 4)
            if (poke.moves && poke.moves.length > 0) {
                const moveNames = poke.moves.slice(0, 4).map(m => m.name).join(', ');
                text += `   Moves: ${moveNames}\n`;
            }
        });
    }
    
    text += `\n─────────────────────────────────\n`;
    text += `📅 ${new Date().toLocaleDateString()} | P:TA Character Manager`;
    
    return text;
};

// Copy to clipboard
const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard! Paste in Discord or anywhere.');
    }).catch(err => {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Copied to clipboard!');
    });
};

// Export all data as JSON file
const exportAllData = () => {
    const exportData = {
        trainers,
        activeTrainerId,
        inventory,
        exportedAt: new Date().toISOString(),
        version: '2.1',
        _m: { c: 'leander_rsr', h: '6c65616e6465725f727372' },
        // Include summary for user reference
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
};

// Export single trainer
const exportSingleTrainer = (trainerToExport) => {
    const exportData = {
        trainer: {
            ...trainerToExport,
            // Ensure money is explicitly included
            money: trainerToExport.money || 0,
            // Ensure party and reserve are included
            party: trainerToExport.party || [],
            reserve: trainerToExport.reserve || []
        },
        pokemon: [...(trainerToExport.party || []), ...(trainerToExport.reserve || [])], // Legacy compatibility
        inventory: inventory, // Include shared inventory
        exportedAt: new Date().toISOString(),
        version: '1.1',
        _m: { c: 'leander_rsr', h: '6c65616e6465725f727372' },
        // Include summary for user reference
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
};

// Import data from JSON file
const importData = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            // Helper to migrate skills array to object format
            const migrateSkills = (skills) => {
                if (!skills) return {};
                if (Array.isArray(skills)) {
                    return skills.reduce((acc, s) => ({ ...acc, [s]: 1 }), {});
                }
                return skills;
            };

            // Check if it's multi-trainer format (v2.0+)
            if (data.trainers) {
                // Ensure all trainers have proper structure
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
                
                // Build summary message
                const totalMoney = migratedTrainers.reduce((sum, t) => sum + (t.money || 0), 0);
                const totalPokemon = migratedTrainers.reduce((sum, t) => sum + (t.party?.length || 0) + (t.reserve?.length || 0), 0);
                const inventoryCount = data.inventory?.length || 0;
                
                alert(`Data imported successfully!\n\n` +
                    `• ${migratedTrainers.length} trainer(s) loaded\n` +
                    `• ${totalPokemon} Pokémon total\n` +
                    `• ₽${totalMoney.toLocaleString()} total money\n` +
                    `• ${inventoryCount} inventory item(s)`);
            } 
            // Single-trainer format (v1.0+)
            else if (data.trainer) {
                let trainerData = data.trainer;
                
                // Migrate old class format
                if (!trainerData.classes) {
                    const migratedClasses = [];
                    if (trainerData.class) migratedClasses.push(trainerData.class);
                    if (trainerData.advancedClass) migratedClasses.push(trainerData.advancedClass);
                    trainerData = { ...trainerData, classes: migratedClasses };
                }
                
                // Ensure proper structure with money, party, reserve, skills
                trainerData = {
                    ...trainerData,
                    id: trainerData.id || Date.now(),
                    money: trainerData.money || 0,
                    // Handle party/reserve - prefer explicit fields, fall back to pokemon array or separate data
                    party: trainerData.party || data.pokemon?.slice(0, 6) || trainerData.pokemon?.slice(0, 6) || [],
                    reserve: trainerData.reserve || data.pokemon?.slice(6) || trainerData.pokemon?.slice(6) || [],
                    skills: migrateSkills(trainerData.skills)
                };
                
                // Ask if they want to replace all or add to existing
                if (trainers.length > 0 && trainers[0].name) {
                    const choice = confirm(
                        `You have existing trainers. Do you want to:\n\n` +
                        `OK = Add "${trainerData.name || 'Imported Trainer'}" as a new trainer\n` +
                        `Cancel = Replace all trainers with this import`
                    );
                    if (choice) {
                        // Add as new trainer
                        trainerData.id = Date.now();
                        setTrainers(prev => [...prev, trainerData]);
                        setActiveTrainerId(trainerData.id);
                    } else {
                        // Replace all
                        setTrainers([trainerData]);
                        setActiveTrainerId(trainerData.id);
                    }
                } else {
                    // No existing trainers, just set it
                    setTrainers([trainerData]);
                    setActiveTrainerId(trainerData.id);
                }
                
                // Import inventory if present (ask user if they want to merge or replace)
                if (data.inventory && data.inventory.length > 0) {
                    if (inventory.length > 0) {
                        const inventoryChoice = confirm(
                            `The import file contains ${data.inventory.length} inventory item(s).\n\n` +
                            `OK = Merge with existing inventory\n` +
                            `Cancel = Replace existing inventory`
                        );
                        if (inventoryChoice) {
                            // Merge inventories (combine quantities of same items)
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
                
                // Build summary message
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
};

// Download card as image using html2canvas approach
const downloadCardAsImage = async (cardId, filename) => {
    const card = document.getElementById(cardId);
    if (!card) {
        alert('Card element not found. Please try again.');
        return;
    }
    
    try {
        // Use html2canvas library loaded from CDN
        if (typeof html2canvas === 'undefined') {
            // Load html2canvas dynamically
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                script.onload = resolve;
                script.onerror = () => reject(new Error('Failed to load html2canvas'));
                document.head.appendChild(script);
            });
        }
        await captureCard(card, filename);
    } catch (err) {
        console.error('Error loading html2canvas:', err);
        // Offer alternative: copy to clipboard
        if (confirm('Image export failed. Would you like to copy the card data as text instead?')) {
            try {
                const text = card.innerText;
                await navigator.clipboard.writeText(text);
                alert('Card data copied to clipboard!');
            } catch (clipErr) {
                alert('Export failed. Try taking a screenshot manually (Print Screen key).');
            }
        }
    }
};

const captureCard = async (card, filename) => {
    try {
        // Clone the card and apply inline styles for better capture
        const canvas = await html2canvas(card, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            // Fix for some CSS issues
            onclone: (clonedDoc) => {
                const clonedCard = clonedDoc.getElementById(card.id);
                if (clonedCard) {
                    // Ensure fonts are loaded
                    clonedCard.style.fontFamily = 'Segoe UI, Arial, sans-serif';
                }
            }
        });
        
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (err) {
        console.error('Error capturing card:', err);
        alert('Error creating image. Try right-clicking the card and using "Save image as..." or take a screenshot.');
    }
};

// Helper function to get level-up moves for a Pokemon (supports regional forms)
// If pokemon object is passed and has availableLevelUpMoves, use those (for regional forms)
// Otherwise fall back to looking up the species in the pokedex
const getLevelUpMovesForPokemon = (pokemon) => {
    // If Pokemon has stored available moves (from regional form selection), use those
    if (pokemon?.availableLevelUpMoves && pokemon.availableLevelUpMoves.length > 0) {
        return pokemon.availableLevelUpMoves;
    }
    
    // Fall back to looking up species in pokedex or customSpecies
    const species = pokemon?.species;
    if (!species || !pokedex || pokedex.length === 0) return [];

    // First check customSpecies, then pokedex
    let speciesData = customSpecies?.find(p =>
        p.species?.toLowerCase() === species.toLowerCase()
    );
    if (!speciesData) {
        speciesData = pokedex.find(p =>
            p.species?.toLowerCase() === species.toLowerCase()
        );
    }
    
    // If Pokemon has a regional form but no stored moves, try to get form-specific moves
    if (pokemon?.regionalForm && speciesData?.regionalForms) {
        const regionalFormData = speciesData.regionalForms.find(
            rf => rf.name === pokemon.regionalForm
        );
        if (regionalFormData?.levelUpMoves) {
            return regionalFormData.levelUpMoves;
        }
    }
    
    return speciesData?.levelUpMoves || [];
};

// Legacy function for backwards compatibility (when we only have species name)
const getLevelUpMovesForSpecies = (species) => {
    if (!species || !pokedex || pokedex.length === 0) return [];
    // First check customSpecies, then pokedex
    let speciesData = customSpecies?.find(p =>
        p.species?.toLowerCase() === species.toLowerCase()
    );
    if (!speciesData) {
        speciesData = pokedex.find(p =>
            p.species?.toLowerCase() === species.toLowerCase()
        );
    }
    return speciesData?.levelUpMoves || [];
};

// Helper function to check moves learned between two levels
// Now accepts Pokemon object to support regional forms
const getMovesForLevelRange = (pokemon, fromLevel, toLevel) => {
    const levelUpMoves = typeof pokemon === 'object' 
        ? getLevelUpMovesForPokemon(pokemon)
        : getLevelUpMovesForSpecies(pokemon); // backwards compat if string passed
        
    if (fromLevel < toLevel) {
        // Level UP: get moves learned between old level (exclusive) and new level (inclusive)
        return levelUpMoves.filter(m => m.level > fromLevel && m.level <= toLevel);
    } else {
        // Level DOWN: get moves that were learned above the new level
        return levelUpMoves.filter(m => m.level > toLevel && m.level <= fromLevel);
    }
};

return (
    <AppProviders
        customSpecies={customSpecies}
        setCustomSpecies={setCustomSpecies}
        trainers={trainers}
        setTrainers={setTrainers}
        activeTrainerId={activeTrainerId}
        setActiveTrainerId={setActiveTrainerId}
        onLevelUp={(notification) => {
            setLevelUpNotification(notification);
            setTimeout(() => setLevelUpNotification(null), 5000);
        }}
        party={party}
        reserve={reserve}
        setParty={setParty}
        setReserve={setReserve}
        pokemonView={pokemonView}
        setPokemonView={setPokemonView}
        editingPokemon={editingPokemon}
        setEditingPokemon={setEditingPokemon}
        pendingMoveLearn={pendingMoveLearn}
        setPendingMoveLearn={setPendingMoveLearn}
        showMoveLearnModal={showMoveLearnModal}
        setShowMoveLearnModal={setShowMoveLearnModal}
        moveLearnData={moveLearnData}
        setMoveLearnData={setMoveLearnData}
        inventory={inventory}
        setInventory={setInventory}
        getMovesForLevelRange={getMovesForLevelRange}
        onSaveComplete={(isAuto) => {
            setIsAutoSave(isAuto);
            setLastSaveTime(new Date());
            setShowSaveIndicator(true);
            setTimeout(() => setShowSaveIndicator(false), 2000);
        }}
        showNotification={(notification) => {
            setLevelUpNotification(notification);
            setTimeout(() => setLevelUpNotification(null), 3000);
        }}
    >
    <div className="container">
        {/* Save Indicator */}
        <SaveIndicator
            show={showSaveIndicator}
            isAuto={isAutoSave}
            saveTime={lastSaveTime}
        />
        
        {/* Level Up Notification */}
        {levelUpNotification && (
            <div className="level-up-notification">
                <h4>🎉 Level Up!</h4>
                <p>{levelUpNotification.name} reached level {levelUpNotification.level}!</p>
                {levelUpNotification.statPoints > 0 && (
                    <p>+{levelUpNotification.statPoints} stat point(s)!</p>
                )}
                {levelUpNotification.featPoints > 0 && (
                    <p>+{levelUpNotification.featPoints} feature(s)!</p>
                )}
                {levelUpNotification.note && (
                    <p style={{ fontStyle: 'italic', color: '#ffd700' }}>{levelUpNotification.note}</p>
                )}
            </div>
        )}
        
        {/* Header */}
        <Header />


        {/* Main Content */}
        <div className="main-content">
            {/* Sidebar Navigation */}
            <div className="sidebar" role="navigation" aria-label="Main navigation">
                <button
                    className={`nav-button ${activeTab === 'trainer' ? 'active' : ''}`}
                    onClick={() => setActiveTab('trainer')}
                    aria-current={activeTab === 'trainer' ? 'page' : undefined}
                >
                    <span className="nav-icon">👤</span>
                    <span>Trainer</span>
                </button>
                <button
                    className={`nav-button ${activeTab === 'pokemon' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pokemon')}
                    aria-current={activeTab === 'pokemon' ? 'page' : undefined}
                >
                    <span className="nav-icon">🎮</span>
                    <span>Pokémon Team</span>
                </button>
                <button
                    className={`nav-button ${activeTab === 'inventory' ? 'active' : ''}`}
                    onClick={() => setActiveTab('inventory')}
                    aria-current={activeTab === 'inventory' ? 'page' : undefined}
                >
                    <span className="nav-icon">🎒</span>
                    <span>Inventory</span>
                </button>
                <button
                    className={`nav-button ${activeTab === 'battle' ? 'active' : ''}`}
                    onClick={() => setActiveTab('battle')}
                    aria-current={activeTab === 'battle' ? 'page' : undefined}
                >
                    <span className="nav-icon">🎲</span>
                    <span>Dice Roller</span>
                </button>
                <button
                    className={`nav-button ${activeTab === 'reference' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reference')}
                    aria-current={activeTab === 'reference' ? 'page' : undefined}
                >
                    <span className="nav-icon">📚</span>
                    <span>Quick Reference</span>
                </button>
                <button
                    className={`nav-button ${activeTab === 'notes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('notes')}
                    aria-current={activeTab === 'notes' ? 'page' : undefined}
                >
                    <span className="nav-icon">📝</span>
                    <span>Campaign Notes</span>
                </button>
            </div>
            
            {/* ============================================== */}
            {/* MAIN CONTENT AREA                             */}
            {/* ============================================== */}
            <div className="content-area">
            
                {/* ========== TRAINER TAB ========== */}
                {activeTab === 'trainer' && (
                    <TrainerTab />
                )}


                {/* ========== POKEMON TEAM TAB ========== */}
                {activeTab === 'pokemon' && (
                    <PokemonTab />
                )}


                {/* ========== INVENTORY TAB ========== */}
                {activeTab === 'inventory' && (
                    <InventoryTab />
                )}


                {/* ========== DICE ROLLER TAB ========== */}
                {activeTab === 'battle' && (
                    <BattleTab />
                )}


                {/* ========== QUICK REFERENCE TAB ========== */}
                {activeTab === 'reference' && (
                    <ReferenceTab />
                )}


                {/* ========== CAMPAIGN NOTES TAB ========== */}
                {activeTab === 'notes' && (
                    <NotesTab />
                )}
            </div>
        </div>
        
        {/* ========== MODALS ========== */}
        <CustomFeatureModal />

        <CustomMoveModal />

        <CustomSpeciesModal />

        <MoveLearnModal />

        <RegionalFormModal />

        <CardExportModal />

        <SkillPickerModal />

        <DetailModal />


        {/* Footer with Legal Disclaimer */}
        <footer style={{
            marginTop: '40px',
            padding: '20px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '10px',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.8)',
            fontSize: '11px',
            lineHeight: '1.6'
        }}>
            {/* Data Management Section */}
            <div style={{ 
                marginBottom: '20px',
                padding: '15px',
                background: 'rgba(0,0,0,0.15)',
                borderRadius: '8px',
                maxWidth: '600px',
                margin: '0 auto 20px auto'
            }}>
                <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#81d4fa', fontSize: '12px' }}>
                    📊 Data Management
                </div>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '15px',
                    flexWrap: 'wrap',
                    marginBottom: '10px'
                }}>
                    <span style={{ color: pokedex.length > 0 ? '#a5d6a7' : '#ffcc80' }}>
                        {pokedex.length > 0 ? `✓ Pokédex: ${pokedex.length} species` : '⏳ Loading Pokédex...'}
                    </span>
                    <span style={{ color: gameDataLoaded ? '#a5d6a7' : '#ffcc80' }}>
                        {gameDataLoaded ? `✓ Game Data: ${Object.keys(GAME_DATA.moves || {}).length} moves, ${Object.keys(GAME_DATA.features || {}).length} features` : '⏳ Loading Game Data...'}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                        onClick={async () => {
                            if (confirm('Clear cached Pokédex and game data, then reload from the server?\n\nThis is useful if the data has been updated online or if you are experiencing issues with moves, abilities, or Pokémon not appearing correctly.')) {
                                try {
                                    indexedDB.deleteDatabase('PTAPokedex');
                                    indexedDB.deleteDatabase(DATA_CONFIG.dbName);
                                    window.location.reload();
                                } catch (e) {
                                    window.location.reload();
                                }
                            }
                        }}
                        style={{
                            padding: '8px 16px',
                            fontSize: '12px',
                            background: 'linear-gradient(135deg, #42a5f5, #1e88e5)',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: 'white',
                            fontWeight: '500',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                    >
                        🔄 Refresh Game Data
                    </button>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', maxWidth: '300px' }}>
                        Clears cached Pokédex and game data (moves, abilities, items, etc.) and reloads the latest version from the server.
                    </span>
                </div>
            </div>
            
            <div className="mb-10">
                <strong>Created by leander_rsr</strong> • Pokémon Tabletop Adventures Character Manager
            </div>
            <div style={{ 
                padding: '15px', 
                background: 'rgba(0,0,0,0.2)', 
                borderRadius: '8px',
                maxWidth: '800px',
                margin: '0 auto'
            }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#ffd54f' }}>
                    ⚠️ LEGAL DISCLAIMER
                </div>
                <p className="mb-8">
                    This is an <strong>UNOFFICIAL, NON-COMMERCIAL</strong> fan-made tool for personal use only.
                    This tool is <strong>FREE</strong> and no profit is made from its distribution.
                </p>
                <p className="mb-8">
                    <strong>Pokémon</strong>, Pokémon character names, <strong>Nintendo</strong>, <strong>Game Freak</strong>, 
                    and all related marks are trademarks, registered trademarks, or copyrights of 
                    <strong> Nintendo, Game Freak, Creatures Inc., and The Pokémon Company</strong>.
                </p>
                <p className="mb-8">
                    This tool is <strong>NOT</strong> affiliated with, endorsed by, or sponsored by any of these companies.
                    It is intended solely as a companion tool for the fan-made <strong>Pokémon Tabletop Adventures</strong> RPG system.
                </p>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>
                    All original code and design © leander_rsr. Provided "AS IS" without warranty.
                    For personal, non-commercial use only.
                </p>
            </div>
        </footer>
    </div>
    </AppProviders>
);
};

// Export the main component
export default PTAManager;
