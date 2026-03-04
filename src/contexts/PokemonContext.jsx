// ============================================================
// Pokemon Context
// ============================================================
// Manages Pokemon state and actions including move learning

import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';
import { GAME_DATA } from '../data/configs.js';
import { MAX_PARTY_SIZE, MAX_TOTAL_MOVES, MAX_POKEMON_LEVEL } from '../data/constants.js';
import { EVOLUTION_CHAINS } from '../data/evolutionChains.js';
import { getActualStats, calculatePokemonHP, calculateSTAB as calcSTAB } from '../utils/dataUtils.js';
import toast from '../utils/toast.js';
import { useGameData } from './GameDataContext.jsx';
import { useUI } from './UIContext.jsx';
import { useModal } from './ModalContext.jsx';
import { useTrainerContext } from './TrainerContext.jsx';
import { useData } from './DataContext.jsx';

const PokemonContext = createContext(null);

export const usePokemonContext = () => {
    const context = useContext(PokemonContext);
    if (!context) {
        throw new Error('usePokemonContext must be used within PokemonProvider');
    }
    return context;
};

// Pokédex skill key → display name mappings (shared by apply/evolve/devolve)
const POKEMON_SKILL_MAPPINGS = [
    ['overland', 'Overland'], ['surface', 'Surface'], ['sky', 'Sky'],
    ['burrow', 'Burrow'], ['underwater', 'Underwater'], ['jump', 'Jump'],
    ['power', 'Power'], ['intelligence', 'Intelligence']
];

const POKEMON_CAPABILITY_MAPPINGS = [
    ['phasing', 'Phasing'], ['invisibility', 'Invisibility'], ['zapper', 'Zapper'],
    ['firestarter', 'Firestarter'], ['gilled', 'Gilled'], ['tracker', 'Tracker'],
    ['threaded', 'Threaded'], ['mindLock', 'Mind Lock'], ['telepath', 'Telepath'],
    ['telekinetic', 'Telekinetic'], ['aura', 'Aura'], ['amorphous', 'Amorphous'],
    ['chilled', 'Chilled'], ['climber', 'Climber'], ['stealth', 'Stealth'],
    ['fountain', 'Fountain'], ['freezer', 'Freezer'], ['glow', 'Glow'],
    ['groundshaker', 'Groundshaker'], ['guster', 'Guster'], ['heater', 'Heater'],
    ['magnetic', 'Magnetic'], ['sprouter', 'Sprouter'], ['sinker', 'Sinker'],
    ['packMon', 'Pack Mon'], ['empath', 'Telepath'], ['illusionist', 'Invisibility'],
    ['dreamEater', 'Dream Smoke'], ['warp', 'Phasing'],
    ['extinguisher', 'Extinguisher'], ['impenetrable', 'Impenetrable'],
    ['mindslaver', 'Mindslaver'], ['powerOfTheLand', 'Power of the Land']
];

// Build Pokemon skills array from a Pokédex species.skills value.
// Handles both new PTA3 format (string array) and old format (key-value object).
const buildPokemonSkills = (skills) => {
    if (!skills) return [];
    // New PTA3 format: skills is a string array e.g. ["Sprouter", "Threaded"]
    if (Array.isArray(skills)) {
        return skills.filter(Boolean).map(name => ({ name }));
    }
    // Old format: skills is an object with numeric/boolean values
    const result = [];
    POKEMON_SKILL_MAPPINGS.forEach(([key, name]) => {
        if (skills[key] !== undefined && skills[key] !== null) {
            result.push({ name, value: skills[key] });
        }
    });
    POKEMON_CAPABILITY_MAPPINGS.forEach(([key, name]) => {
        if (skills[key]) result.push({ name });
    });
    if (Array.isArray(skills.naturewalk)) {
        skills.naturewalk.forEach(terrain => result.push({ name: `Naturewalk (${terrain})` }));
    }
    return result;
};

// Helper: resolve formData and build the common species update fields shared by
// applySpeciesToPokemon, applyEvolutionToPokemon, and applyDevolutionToPokemon.
const buildSpeciesUpdateFields = (speciesData, regionalForm) => {
    const isRegional = regionalForm && !regionalForm.isBase;
    const formData = isRegional ? regionalForm : null;
    return {
        isRegional,
        formData,
        updates: {
            species: speciesData.species,
            types: formData ? [...formData.types] : [...speciesData.types],
            baseStats: formData?.baseStats ? { ...formData.baseStats } : { ...speciesData.baseStats },
            passives: formData?.passives ? [...formData.passives] : (speciesData.passives ? [...speciesData.passives] : []),
            availableAbilities: formData?.abilities ? { ...formData.abilities } : (speciesData.abilities ? { ...speciesData.abilities } : null),
            pokedexId: speciesData.id,
            regionalForm: isRegional ? regionalForm.name : null,
            availableLevelUpMoves: formData?.levelUpMoves || speciesData.levelUpMoves || [],
            availableEggMoves: formData?.eggMoves || speciesData.eggMoves || [],
            availableTutorMoves: formData?.tutorMoves || speciesData.tutorMoves || [],
            pokemonSkills: buildPokemonSkills(speciesData.skills),
        }
    };
};

// Helper: build ability updates that preserve currently-held abilities if still valid
// for the new species. Used during evolution and devolution.
const resolveAbilityUpdates = (currentPoke, newAbilities) => {
    if (!newAbilities) return {};
    const allValid = [
        ...(newAbilities.basic || []),
        ...(newAbilities.adv || []),
        ...(newAbilities.high || [])
    ];
    const updates = {};
    if (!currentPoke.ability || !allValid.includes(currentPoke.ability)) {
        if (newAbilities.basic?.length > 0) updates.ability = newAbilities.basic[0];
    }
    if (currentPoke.ability2 && !allValid.includes(currentPoke.ability2)) updates.ability2 = '';
    if (currentPoke.ability3 && !allValid.includes(currentPoke.ability3)) updates.ability3 = '';
    return updates;
};

// PTA3: No stat allocation helpers needed — stats are fixed from Pokédex

export const PokemonProvider = ({ children }) => {
    const { pokedex, getMovesForLevelRange, customSpecies } = useGameData();
    const { showLevelUpNotification,
            pokemonView, setPokemonView,
            editingPokemon, setEditingPokemon } = useUI();
    const { showConfirm,
            pendingMoveLearn, setPendingMoveLearn,
            showMoveLearnModal, setShowMoveLearnModal, setMoveLearnData } = useModal();
    const { party, reserve, setParty, setReserve } = useTrainerContext();
    const { inventory, setInventory } = useData();

    const pokemon = [...(party || []), ...(reserve || [])];

    // Keep a ref to party so addPokemon can read its length without depending on it
    const partyRef = useRef(party);
    partyRef.current = party;

    // Add new Pokemon (PTA3: no stat allocation fields)
    const addPokemon = useCallback(() => {
        const newPokemon = {
            id: Date.now() * 1000 + Math.floor(Math.random() * 999),
            name: 'New Pokémon',
            species: '',
            gender: '',
            avatar: '',
            types: [],
            nature: 'Hardy',
            ability: '',
            baseStats: { hp: 30, atk: 5, def: 5, satk: 5, sdef: 5, spd: 5 },
            moves: [],
            skills: [],
            notes: '',
            loyalty: 2
        };

        if (pokemonView === 'party' && partyRef.current.length < MAX_PARTY_SIZE) {
            setParty(prev => [...prev, newPokemon]);
        } else {
            setReserve(prev => [...prev, newPokemon]);
            if (pokemonView === 'party') {
                setPokemonView('reserve');
            }
        }
        setEditingPokemon(newPokemon.id);
        return newPokemon;
    }, [pokemonView, setParty, setReserve, setPokemonView, setEditingPokemon]);

    // Learn move function
    const learnMove = useCallback((pokemonId, newMove, replaceIndex = null, inParty = true) => {
        const updateFn = (prev) => prev.map(p => {
            if (p.id !== pokemonId) return p;

            const moveName = newMove.move || newMove.name;
            if (!moveName) return p;

            const alreadyKnows = p.moves.some((m, idx) =>
                m.name?.toLowerCase() === moveName?.toLowerCase() &&
                (replaceIndex === null || idx !== replaceIndex)
            );

            if (alreadyKnows) {
                return p;
            }

            const moveData = GAME_DATA.moves[moveName] || {};
            const newMoveObj = {
                name: moveName,
                type: moveData.type || newMove.type || 'Normal',
                category: moveData.category || newMove.category || 'Physical',
                frequency: moveData.frequency || newMove.frequency || 'At-Will',
                damage: moveData.damage || newMove.damage || '',
                range: moveData.range || newMove.range || 'Melee',
                effect: moveData.effect || newMove.effect || '',
                source: newMove.source || 'natural',
                learnedAtLevel: newMove.level
            };

            let newMoves;
            let newMoveHistory = [...(p.moveHistory || [])];

            if (replaceIndex !== null && replaceIndex >= 0) {
                const replacedMove = p.moves[replaceIndex];
                if (replacedMove) {
                    newMoveHistory.push({
                        ...replacedMove,
                        replacedAtLevel: newMove.level,
                        slotIndex: replaceIndex
                    });
                }
                newMoves = [...p.moves];
                newMoves[replaceIndex] = newMoveObj;
            } else {
                newMoves = [...p.moves, newMoveObj];
            }

            return { ...p, moves: newMoves, moveHistory: newMoveHistory };
        });

        if (inParty) {
            setParty(updateFn);
        } else {
            setReserve(updateFn);
        }
    }, [setParty, setReserve]);

    // Update Pokemon (works on both party and reserve)
    const updatePokemon = useCallback((id, updates) => {
        // 1. Find where the Pokemon lives
        const inParty = party.some(p => p.id === id);
        const currentPokemon = inParty
            ? party.find(p => p.id === id)
            : reserve.find(p => p.id === id);

        // 2. Build the updater function (PTA3: no stat-point accounting on level change)
        const updateFn = (prev) => prev.map(p => {
            if (p.id !== id) return p;

            return { ...p, ...updates };
        });

        // 3. Apply to party or reserve
        if (inParty) {
            setParty(updateFn);
        } else {
            setReserve(updateFn);
        }

    }, [party, reserve, setParty, setReserve]);

    // Restore Pokemon to a previous snapshot (used by the Cancel button in edit mode).
    // Bypasses updatePokemon's level-change / move-learn logic — it's a direct replace.
    const restorePokemon = useCallback((id, snapshot) => {
        const inParty = party.some(p => p.id === id);
        const replaceFn = (prev) => prev.map(p => p.id === id ? { ...snapshot } : p);
        if (inParty) setParty(replaceFn);
        else setReserve(replaceFn);
    }, [party, setParty, setReserve]);

    // Delete Pokemon (with 5-second undo window)
    const deletePokemon = useCallback((id) => {
        showConfirm({
            title: 'Release Pokémon',
            message: 'Are you sure you want to release this Pokémon?',
            danger: true,
            confirmLabel: 'Release',
            onConfirm: () => {
                const inParty = party.some(p => p.id === id);
                const deleted = inParty
                    ? party.find(p => p.id === id)
                    : reserve.find(p => p.id === id);

                if (inParty) {
                    setParty(prev => prev.filter(p => p.id !== id));
                } else {
                    setReserve(prev => prev.filter(p => p.id !== id));
                }
                setEditingPokemon(null);

                toast.show(
                    `${deleted?.name || 'Pokémon'} was released.`,
                    'warning',
                    5000,
                    {
                        label: 'Undo',
                        onClick: () => {
                            if (inParty) {
                                setParty(prev => [...prev, deleted]);
                            } else {
                                setReserve(prev => [...prev, deleted]);
                            }
                            setEditingPokemon(deleted.id);
                        }
                    }
                );
            }
        });
    }, [party, reserve, setParty, setReserve, setEditingPokemon, showConfirm]);

    // Import Pokemon
    const importPokemon = useCallback((pokemonData, toParty = false) => {
        const importedPokemon = {
            ...pokemonData,
            id: Date.now()
        };

        if (toParty && party.length < MAX_PARTY_SIZE) {
            setParty(prev => [...prev, importedPokemon]);
        } else {
            setReserve(prev => [...prev, importedPokemon]);
            if (toParty && party.length >= 6) {
                setPokemonView('reserve');
            }
        }
    }, [party?.length, setParty, setReserve, setPokemonView]);

    // Get evolution options for a Pokemon
    const getEvolutionOptions = useCallback((poke) => {
        if (!poke?.species) return { canEvolve: [], canDevolve: null };

        const species = poke.species;
        const regionalForm = poke.regionalForm || null;

        // Check for custom species evolution data first
        const customSpeciesData = customSpecies?.find(p =>
            p.species?.toLowerCase() === species.toLowerCase()
        );

        let evolutionData;
        if (customSpeciesData) {
            evolutionData = {
                evolvesTo: customSpeciesData.evolvesTo || [],
                evolvesFrom: customSpeciesData.evolvesFrom || null
            };
            if (evolutionData.evolvesTo.length === 0 && !evolutionData.evolvesFrom) {
                evolutionData = null;
            }
        } else {
            evolutionData = EVOLUTION_CHAINS[species];
        }

        if (!evolutionData) return { canEvolve: [], canDevolve: null };

        const canEvolve = [];
        let canDevolve = null;

        if (evolutionData.evolvesTo) {
            evolutionData.evolvesTo.forEach(evo => {
                // Regional Pokémon only see evolutions matching their form.
                // Non-regional Pokémon see all evolutions (including regional variants like Alolan Raichu).
                if (regionalForm && evo.regionalForm !== regionalForm) return;

                let canEvolveNow = false;
                let reason = '';
                let needsItem = null;

                switch (evo.method) {
                    case 'level':
                        canEvolveNow = level >= evo.requirement;
                        reason = canEvolveNow ? '' : `Needs Level ${evo.requirement}`;
                        break;
                    case 'stone':
                        needsItem = evo.requirement;
                        canEvolveNow = true;
                        reason = `Requires ${evo.requirement}`;
                        break;
                    case 'trade':
                        canEvolveNow = true;
                        reason = evo.requirement === 'Trade' ? 'Trade Evolution' : `Trade with ${evo.requirement}`;
                        if (evo.requirement !== 'Trade') needsItem = evo.requirement;
                        break;
                    case 'happiness':
                        canEvolveNow = true;
                        reason = evo.requirement;
                        break;
                    case 'other':
                        canEvolveNow = true;
                        reason = evo.requirement;
                        break;
                }

                canEvolve.push({
                    species: evo.species,
                    method: evo.method,
                    requirement: evo.requirement,
                    regionalForm: evo.regionalForm || null,
                    note: evo.note || null,
                    canEvolveNow,
                    reason,
                    needsItem
                });
            });
        }

        if (evolutionData.evolvesFrom) {
            const devo = evolutionData.evolvesFrom;
            canDevolve = {
                species: devo.species,
                method: devo.method,
                requirement: devo.requirement
            };
        }

        return { canEvolve, canDevolve };
    }, [customSpecies]);

    // Check if inventory has an item
    const hasItemInInventory = useCallback((itemName) => {
        if (!itemName || !inventory) return true;
        return inventory.some(item =>
            item.name.toLowerCase() === itemName.toLowerCase() &&
            (item.quantity || 1) > 0
        );
    }, [inventory]);

    // Remove item from inventory
    const removeItemFromInventory = useCallback((itemName) => {
        if (!setInventory) return;
        setInventory(prev => {
            const idx = prev.findIndex(item =>
                item.name.toLowerCase() === itemName.toLowerCase()
            );
            if (idx === -1) return prev;

            const newInventory = [...prev];
            if ((newInventory[idx].quantity || 1) <= 1) {
                newInventory.splice(idx, 1);
            } else {
                newInventory[idx] = {
                    ...newInventory[idx],
                    quantity: (newInventory[idx].quantity || 1) - 1
                };
            }
            return newInventory;
        });
    }, [setInventory]);

    // Add item to inventory
    const addItemToInventory = useCallback((itemName) => {
        if (!setInventory) return;
        setInventory(prev => {
            const existingIdx = prev.findIndex(item =>
                item.name.toLowerCase() === itemName.toLowerCase()
            );

            if (existingIdx >= 0) {
                const newInventory = [...prev];
                newInventory[existingIdx] = {
                    ...newInventory[existingIdx],
                    quantity: (newInventory[existingIdx].quantity || 1) + 1
                };
                return newInventory;
            } else {
                return [...prev, { name: itemName, quantity: 1 }];
            }
        });
    }, [setInventory]);

    // Process pending move learns
    useEffect(() => {
        if (pendingMoveLearn && pendingMoveLearn.length > 0 && !showMoveLearnModal) {
            const nextMove = pendingMoveLearn[0];

            const freshPokemon = nextMove.inParty
                ? party.find(p => p.id === nextMove.pokemonId)
                : reserve.find(p => p.id === nextMove.pokemonId);

            if (freshPokemon) {
                const freshMoves = freshPokemon.moves || [];
                const alreadyKnows = freshMoves.some(m =>
                    m.name.toLowerCase() === nextMove.newMove.move.toLowerCase()
                );

                if (alreadyKnows) {
                    setPendingMoveLearn(prev => prev.slice(1));
                } else if (freshMoves.length < MAX_TOTAL_MOVES) {
                    learnMove(nextMove.pokemonId, nextMove.newMove, null, nextMove.inParty);
                    setPendingMoveLearn(prev => prev.slice(1));
                } else {
                    setMoveLearnData({
                        ...nextMove,
                        currentMoves: freshMoves,
                        pokemonName: freshPokemon.name
                    });
                    setShowMoveLearnModal(true);
                    setPendingMoveLearn(prev => prev.slice(1));
                }
            } else {
                setPendingMoveLearn(prev => prev.slice(1));
            }
        }
    }, [pendingMoveLearn, showMoveLearnModal, party, reserve, learnMove, setPendingMoveLearn, setMoveLearnData, setShowMoveLearnModal]);

    // Calculate Pokemon max HP (PTA3: fixed species HP stat, nature ±1 applied)
    const calculatePokemonMaxHP = useCallback((poke) => {
        const actualStats = getActualStats(poke);
        return actualStats.hp;
    }, []);

    // Calculate STAB bonus
    const calculateSTAB = useCallback((level) => {
        return calcSTAB(level);
    }, []);

    // Apply species data to a Pokemon (called directly or after regional form selection)
    const applySpeciesToPokemon = useCallback((pokemonId, speciesData, regionalForm) => {
        const currentPoke = party.find(p => p.id === pokemonId) || reserve.find(p => p.id === pokemonId);
        if (!currentPoke) return;
        const { formData, updates } = buildSpeciesUpdateFields(speciesData, regionalForm);

        // Fresh species assignment — reset abilities unconditionally
        const abilities = formData?.abilities || speciesData.abilities;
        if (abilities) {
            if (abilities.basic?.length > 0) updates.ability = abilities.basic[0];
            updates.ability2 = '';
            updates.ability3 = '';
        }

        // Add starting moves (PTA3: all moves available, no level gate)
        const levelUpMoves = updates.availableLevelUpMoves;
        if (levelUpMoves.length > 0) {
            const seenMoves = new Set();
            const startingMoves = levelUpMoves
                .filter(m => {
                    const moveLower = m.move?.toLowerCase();
                    if (seenMoves.has(moveLower)) return false;
                    seenMoves.add(moveLower);
                    return true;
                })
                .slice(0, MAX_TOTAL_MOVES)
                .map(m => {
                    const moveData = GAME_DATA.moves[m.move] || {};
                    return {
                        name: m.move,
                        type: moveData.type || m.type || 'Normal',
                        category: moveData.category || 'Physical',
                        frequency: moveData.frequency || 'At-Will',
                        damage: moveData.damage || '',
                        range: moveData.range || 'Melee',
                        effect: moveData.effect || '',
                        source: 'natural',
                        learnedAtLevel: m.level
                    };
                });

            const hasNoMoves = !currentPoke.moves || currentPoke.moves.length === 0;
            const hasNoSpecies = !currentPoke.species;
            const speciesIsChanging = currentPoke.species && currentPoke.species !== speciesData.species;

            if (hasNoMoves || hasNoSpecies || speciesIsChanging) {
                updates.moves = startingMoves;
            }
        }

        updatePokemon(pokemonId, updates);
    }, [party, reserve, updatePokemon]);

    // Apply evolution to a Pokemon - preserves moves and only adds evolution (E) moves
    const applyEvolutionToPokemon = useCallback((pokemonId, speciesData, regionalForm, inParty, consumedItem = null, previousSpecies = null) => {
        const currentPoke = party.find(p => p.id === pokemonId) || reserve.find(p => p.id === pokemonId);
        if (!currentPoke) return;

        const { formData, updates } = buildSpeciesUpdateFields(speciesData, regionalForm);
        Object.assign(updates, {
            evolvedFrom: previousSpecies || currentPoke.species,
            evolutionStoneUsed: consumedItem || null,
            ...resolveAbilityUpdates(currentPoke, formData?.abilities || speciesData.abilities),
        });

        updatePokemon(pokemonId, updates);

        // Queue evolution moves (level 0)
        const evolutionMoves = updates.availableLevelUpMoves.filter(m => m.level === 0);
        const currentMoves = currentPoke.moves || [];

        if (evolutionMoves.length > 0) {
            const movesToQueue = [];
            evolutionMoves.forEach(evoMove => {
                const alreadyKnows = currentMoves.some(m =>
                    m.name?.toLowerCase() === evoMove.move?.toLowerCase()
                );
                if (!alreadyKnows) {
                    movesToQueue.push({
                        pokemonId,
                        pokemonName: currentPoke.name || speciesData.species,
                        newMove: { move: evoMove.move, type: evoMove.type || 'Normal', level: 0 },
                        inParty,
                        isEvolutionMove: true
                    });
                }
            });
            if (movesToQueue.length > 0) {
                setPendingMoveLearn(prev => [...prev, ...movesToQueue]);
            }
        }
    }, [party, reserve, updatePokemon, setPendingMoveLearn]);

    // Apply devolution to a Pokemon
    const applyDevolutionToPokemon = useCallback((pokemonId, speciesData, regionalForm, inParty) => {
        const currentPoke = party.find(p => p.id === pokemonId) || reserve.find(p => p.id === pokemonId);
        if (!currentPoke) return;

        const { formData, updates } = buildSpeciesUpdateFields(speciesData, regionalForm);
        Object.assign(updates, {
            evolvedFrom: null,
            evolutionStoneUsed: null,
            ...resolveAbilityUpdates(currentPoke, formData?.abilities || speciesData.abilities),
        });

        updatePokemon(pokemonId, updates);
    }, [party, reserve, updatePokemon]);

    // Handle Pokemon evolution
    const evolvePokemon = useCallback((pokemonId, targetSpecies, targetRegionalForm, consumeItem) => {
        const inParty = party.some(p => p.id === pokemonId);
        const poke = inParty ? party.find(p => p.id === pokemonId) : reserve.find(p => p.id === pokemonId);
        if (!poke) return;

        let targetPokedexEntry = pokedex?.find(p => p.species === targetSpecies);
        if (!targetPokedexEntry) {
            targetPokedexEntry = customSpecies?.find(p => p.species === targetSpecies);
        }
        if (!targetPokedexEntry) {
            toast.error(`Could not find ${targetSpecies} in the Pokedex or Custom Species!`);
            return;
        }

        if (consumeItem) {
            if (!hasItemInInventory(consumeItem)) {
                toast.warning(`You don't have a ${consumeItem} in your inventory!`);
                return;
            }
            removeItemFromInventory(consumeItem);
        }

        let finalRegionalForm = null;
        if (targetRegionalForm) {
            const matchingForm = targetPokedexEntry.regionalForms?.find(rf => rf.name === targetRegionalForm);
            if (matchingForm) {
                finalRegionalForm = { name: targetRegionalForm, isBase: false, ...matchingForm };
            }
        } else if (poke.regionalForm) {
            const matchingForm = targetPokedexEntry.regionalForms?.find(rf => rf.name === poke.regionalForm);
            if (matchingForm) {
                finalRegionalForm = { name: poke.regionalForm, isBase: false, ...matchingForm };
            }
        }

        applyEvolutionToPokemon(pokemonId, targetPokedexEntry, finalRegionalForm, inParty, consumeItem, poke.species);

        const formName = finalRegionalForm?.name || targetRegionalForm;
        showLevelUpNotification({
            pokemon: poke.name || poke.species,
            message: `evolved into ${formName ? formName + ' ' : ''}${targetSpecies}!`,
            type: 'evolution'
        });
    }, [party, reserve, pokedex, customSpecies, hasItemInInventory, removeItemFromInventory, applyEvolutionToPokemon, showLevelUpNotification]);

    // Handle Pokemon devolution
    const devolvePokemon = useCallback((pokemonId, targetSpecies) => {
        const inParty = party.some(p => p.id === pokemonId);
        const poke = inParty ? party.find(p => p.id === pokemonId) : reserve.find(p => p.id === pokemonId);
        if (!poke) return;

        let targetPokedexEntry = pokedex?.find(p => p.species === targetSpecies);
        if (!targetPokedexEntry) {
            targetPokedexEntry = customSpecies?.find(p => p.species === targetSpecies);
        }
        if (!targetPokedexEntry) {
            toast.error(`Could not find ${targetSpecies} in the Pokedex or Custom Species!`);
            return;
        }

        const currentRegionalForm = poke.regionalForm;
        let targetRegionalForm = null;
        if (currentRegionalForm && Array.isArray(targetPokedexEntry.regionalForms)) {
            const matchingForm = targetPokedexEntry.regionalForms.find(rf => rf.name === currentRegionalForm);
            if (matchingForm) {
                targetRegionalForm = { name: currentRegionalForm, isBase: false, ...matchingForm };
            }
        }

        const devolveTargetName = targetRegionalForm ? `${targetRegionalForm.name} ${targetSpecies}` : targetSpecies;
        const stoneToRefund = poke.evolutionStoneUsed;
        const evolvedFromSpecies = poke.evolvedFrom;

        let confirmMsg = `Are you sure you want to devolve ${poke.name || poke.species} back to ${devolveTargetName}?`;
        if (stoneToRefund && evolvedFromSpecies === targetSpecies) {
            confirmMsg += `\n\nYou will receive back: 1x ${stoneToRefund}`;
        }

        showConfirm({
            title: 'Devolve Pokémon',
            message: confirmMsg,
            danger: true,
            confirmLabel: 'Devolve',
            onConfirm: () => {
                if (stoneToRefund && evolvedFromSpecies === targetSpecies) {
                    addItemToInventory(stoneToRefund);
                }

                applyDevolutionToPokemon(pokemonId, targetPokedexEntry, targetRegionalForm, inParty);

                let notificationMsg = `devolved back to ${targetRegionalForm ? targetRegionalForm.name + ' ' : ''}${targetSpecies}!`;
                if (stoneToRefund && evolvedFromSpecies === targetSpecies) {
                    notificationMsg += ` (${stoneToRefund} refunded)`;
                }

                showLevelUpNotification({
                    pokemon: poke.name || poke.species,
                    message: notificationMsg,
                    type: 'devolution'
                });
            }
        });
    }, [party, reserve, pokedex, customSpecies, addItemToInventory, applyDevolutionToPokemon, showLevelUpNotification, showConfirm]);

    const value = {
        // State
        party,
        reserve,
        pokemon,
        pokemonView,
        setPokemonView,
        editingPokemon,
        setEditingPokemon,

        // CRUD
        addPokemon,
        updatePokemon,
        restorePokemon,
        deletePokemon,
        importPokemon,
        applySpeciesToPokemon,

        // Moves
        learnMove,

        // Evolution
        getEvolutionOptions,
        evolvePokemon,
        devolvePokemon,

        // Inventory helpers
        hasItemInInventory,
        removeItemFromInventory,
        addItemToInventory,

        // Calculations
        calculatePokemonMaxHP,
        calculateSTAB,
        getActualStats
    };

    return (
        <PokemonContext.Provider value={value}>
            {children}
        </PokemonContext.Provider>
    );
};

export default PokemonContext;
