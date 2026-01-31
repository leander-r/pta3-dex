// ============================================================
// Pokemon Context
// ============================================================
// Manages Pokemon state and actions including move learning

import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { GAME_DATA } from '../data/configs.js';
import { EVOLUTION_CHAINS } from '../data/evolutionChains.js';
import { getActualStats, calculatePokemonHP, calculateSTAB as calcSTAB } from '../utils/dataUtils.js';

const PokemonContext = createContext(null);

export const usePokemonContext = () => {
    const context = useContext(PokemonContext);
    if (!context) {
        throw new Error('usePokemonContext must be used within PokemonProvider');
    }
    return context;
};

// Calculate Pokemon level from experience
const calculatePokemonLevel = (exp) => {
    let level = 1;
    for (let lvl in GAME_DATA.pokemonExpChart) {
        if (exp >= GAME_DATA.pokemonExpChart[lvl]) {
            level = parseInt(lvl);
        } else {
            break;
        }
    }
    return level;
};

export const PokemonProvider = ({
    children,
    party,
    reserve,
    setParty,
    setReserve,
    pokemonView,
    setPokemonView,
    editingPokemon,
    setEditingPokemon,
    pokedex,
    customSpecies,
    pendingMoveLearn,
    setPendingMoveLearn,
    showMoveLearnModal,
    setShowMoveLearnModal,
    setMoveLearnData,
    onLevelUp,
    getMovesForLevelRange,
    inventory,
    setInventory
}) => {
    const pokemon = [...(party || []), ...(reserve || [])];

    // Add new Pokemon
    const addPokemon = useCallback(() => {
        const newPokemon = {
            id: Date.now(),
            name: 'New Pokémon',
            species: '',
            gender: '',
            avatar: '',
            level: 1,
            exp: 0,
            highestLevelReached: 1,
            types: [],
            nature: 'Hardy',
            ability: '',
            baseStats: { hp: 10, atk: 10, def: 10, satk: 10, sdef: 10, spd: 10 },
            addedStats: { hp: 0, atk: 0, def: 0, satk: 0, sdef: 0, spd: 0 },
            statAllocationHistory: [],
            moves: [],
            skills: [],
            notes: '',
            loyalty: 2,
            statPointsAvailable: 0
        };

        if (pokemonView === 'party' && party.length < 6) {
            setParty(prev => [...prev, newPokemon]);
        } else {
            setReserve(prev => [...prev, newPokemon]);
            if (pokemonView === 'party') {
                setPokemonView('reserve');
            }
        }
        setEditingPokemon(newPokemon.id);
        return newPokemon;
    }, [pokemonView, party?.length, setParty, setReserve, setPokemonView, setEditingPokemon]);

    // Learn move function
    const learnMove = useCallback((pokemonId, newMove, replaceIndex = null, inParty = true) => {
        const updateFn = (prev) => prev.map(p => {
            if (p.id !== pokemonId) return p;

            const moveName = newMove.move || newMove.name;
            const alreadyKnows = p.moves.some((m, idx) =>
                m.name?.toLowerCase() === moveName?.toLowerCase() &&
                (replaceIndex === null || idx !== replaceIndex)
            );

            if (alreadyKnows) {
                console.log(`${p.name || p.species} already knows ${moveName}, skipping`);
                return p;
            }

            const moveData = GAME_DATA.moves[moveName] || {};
            const newMoveObj = {
                name: moveName,
                type: moveData.type || newMove.type || 'Normal',
                category: moveData.category || 'Physical',
                frequency: moveData.frequency || 'At-Will',
                damage: moveData.damage || '',
                range: moveData.range || 'Melee',
                effect: moveData.effect || '',
                source: 'natural',
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

    // Forget moves when leveling down
    const forgetMovesAboveLevel = useCallback((pokemonId, newLevel, inParty = true) => {
        const updateFn = (prev) => prev.map(p => {
            if (p.id !== pokemonId) return p;

            let newMoves = [...p.moves];
            let newMoveHistory = [...(p.moveHistory || [])];

            const movesToForget = p.moves.filter(move =>
                move.source === 'natural' &&
                move.learnedAtLevel &&
                move.learnedAtLevel > newLevel
            );

            movesToForget.forEach(moveToForget => {
                const moveIndex = newMoves.findIndex(m => m.name === moveToForget.name);
                if (moveIndex === -1) return;

                const historyIdx = newMoveHistory.findIndex(h =>
                    h.replacedAtLevel >= moveToForget.learnedAtLevel
                );

                if (historyIdx !== -1) {
                    const restoredMove = newMoveHistory[historyIdx];
                    const { replacedAtLevel, slotIndex, ...moveToRestore } = restoredMove;
                    newMoves[moveIndex] = moveToRestore;
                    newMoveHistory.splice(historyIdx, 1);
                } else {
                    newMoves.splice(moveIndex, 1);
                }
            });

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
        const inParty = party.some(p => p.id === id);
        const currentPokemon = inParty
            ? party.find(p => p.id === id)
            : reserve.find(p => p.id === id);

        const updateFn = (prev) => prev.map(p => {
            if (p.id !== id) return p;

            let newLevel = p.level;
            let hasLevelChange = false;

            if (updates.exp !== undefined) {
                newLevel = calculatePokemonLevel(updates.exp);
                updates.level = newLevel;
                hasLevelChange = newLevel !== p.level;
            } else if (updates.level !== undefined && updates.level !== p.level) {
                newLevel = updates.level;
                hasLevelChange = true;
                updates.exp = GAME_DATA.pokemonExpChart[newLevel] || 0;
            }

            if (hasLevelChange) {
                const oldLevel = p.level;
                const highestLevelReached = p.highestLevelReached || oldLevel;

                const totalAddedStats = Object.values(p.addedStats || {}).reduce((sum, val) => sum + (val || 0), 0);

                if (newLevel > highestLevelReached) {
                    const newPointsEarned = newLevel - highestLevelReached;
                    updates.highestLevelReached = newLevel;
                    updates.statPointsAvailable = (p.statPointsAvailable || 0) + newPointsEarned;

                    if (onLevelUp) {
                        onLevelUp({
                            type: 'pokemon',
                            name: p.name,
                            level: newLevel,
                            statPoints: newPointsEarned
                        });
                    }
                } else if (newLevel < oldLevel) {
                    const maxPossiblePoints = Math.max(0, newLevel - 1);

                    if (totalAddedStats > maxPossiblePoints) {
                        const pointsToRemove = totalAddedStats - maxPossiblePoints;
                        const history = [...(p.statAllocationHistory || [])];
                        const newAddedStats = { ...p.addedStats };

                        for (let i = 0; i < pointsToRemove && history.length > 0; i++) {
                            const lastStat = history.pop();
                            if (lastStat && newAddedStats[lastStat] > 0) {
                                newAddedStats[lastStat]--;
                            }
                        }

                        updates.addedStats = newAddedStats;
                        updates.statAllocationHistory = history;
                        updates.statPointsAvailable = 0;
                        updates.highestLevelReached = newLevel;
                    } else {
                        const newAvailable = Math.max(0, maxPossiblePoints - totalAddedStats);
                        updates.statPointsAvailable = newAvailable;
                    }
                } else if (newLevel > oldLevel && newLevel <= highestLevelReached) {
                    const maxPossiblePoints = Math.max(0, newLevel - 1);
                    const currentAddedStats = Object.values(updates.addedStats || p.addedStats || {}).reduce((sum, val) => sum + (val || 0), 0);
                    const newAvailable = Math.max(0, maxPossiblePoints - currentAddedStats);
                    updates.statPointsAvailable = newAvailable;
                }
            }

            return { ...p, ...updates };
        });

        if (inParty) {
            setParty(updateFn);
        } else {
            setReserve(updateFn);
        }

        // Handle move learning/forgetting after state update
        const oldLevel = currentPokemon?.level;
        let newLevel = oldLevel;

        if (updates.exp !== undefined) {
            newLevel = calculatePokemonLevel(updates.exp);
        } else if (updates.level !== undefined) {
            newLevel = updates.level;
        }

        if (currentPokemon?.species && newLevel !== oldLevel && getMovesForLevelRange) {
            const pokemonId = id;
            const pokemonName = currentPokemon.name;
            const pokemonInParty = inParty;
            const startingMoves = currentPokemon.moves || [];

            if (newLevel > oldLevel) {
                const movesToLearn = getMovesForLevelRange(currentPokemon, oldLevel, newLevel);

                if (movesToLearn.length > 0) {
                    const naturalMoves = startingMoves.filter(m => m.source === 'natural');
                    let currentNaturalCount = naturalMoves.length;
                    const movesToQueue = [];
                    const movesToLearnDirectly = [];

                    movesToLearn.forEach(newMove => {
                        const alreadyKnows = startingMoves.some(m =>
                            m.name.toLowerCase() === newMove.move.toLowerCase()
                        );

                        if (!alreadyKnows) {
                            if (currentNaturalCount < 4) {
                                movesToLearnDirectly.push(newMove);
                                currentNaturalCount++;
                            } else {
                                movesToQueue.push({
                                    pokemonId: pokemonId,
                                    pokemonName: pokemonName,
                                    newMove: newMove,
                                    currentMoves: startingMoves,
                                    inParty: pokemonInParty,
                                    needsReplacement: true
                                });
                            }
                        }
                    });

                    if (movesToLearnDirectly.length > 0) {
                        setTimeout(() => {
                            movesToLearnDirectly.forEach(move => {
                                learnMove(pokemonId, move, null, pokemonInParty);
                            });
                        }, 10);
                    }

                    if (movesToQueue.length > 0) {
                        setTimeout(() => {
                            setPendingMoveLearn(prev => [...prev, ...movesToQueue]);
                        }, 20);
                    }
                }
            } else {
                setTimeout(() => {
                    forgetMovesAboveLevel(pokemonId, newLevel, pokemonInParty);
                }, 10);
            }
        }
    }, [party, reserve, setParty, setReserve, onLevelUp, getMovesForLevelRange, learnMove, forgetMovesAboveLevel, setPendingMoveLearn]);

    // Delete Pokemon
    const deletePokemon = useCallback((id) => {
        if (confirm('Are you sure you want to release this Pokémon?')) {
            const inParty = party.some(p => p.id === id);
            if (inParty) {
                setParty(prev => prev.filter(p => p.id !== id));
            } else {
                setReserve(prev => prev.filter(p => p.id !== id));
            }
            setEditingPokemon(null);
        }
    }, [party, setParty, setReserve, setEditingPokemon]);

    // Import Pokemon
    const importPokemon = useCallback((pokemonData, toParty = false) => {
        const importedPokemon = {
            ...pokemonData,
            id: Date.now() + Math.random()
        };

        if (toParty && party.length < 6) {
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
        const level = poke.level || 1;
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
                const isPikachuToAlolanRaichu = species === 'Pikachu' && evo.species === 'Raichu' && evo.regionalForm === 'Alolan';
                const isRockruffToLycanroc = species === 'Rockruff' && evo.species === 'Lycanroc';

                if (evo.regionalForm && evo.regionalForm !== regionalForm && !isPikachuToAlolanRaichu && !isRockruffToLycanroc) {
                    if (regionalForm !== evo.regionalForm) return;
                }

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
                const naturalMoves = freshMoves.filter(m => m.source === 'natural');
                const alreadyKnows = freshMoves.some(m =>
                    m.name.toLowerCase() === nextMove.newMove.move.toLowerCase()
                );

                if (alreadyKnows) {
                    setPendingMoveLearn(prev => prev.slice(1));
                } else if (naturalMoves.length < 4) {
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

    // Calculate Pokemon max HP
    const calculatePokemonMaxHP = useCallback((poke) => {
        const actualStats = getActualStats(poke);
        return poke.level + (actualStats.hp * 3);
    }, []);

    // Calculate STAB bonus
    const calculateSTAB = useCallback((level) => {
        return calcSTAB(level);
    }, []);

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
        deletePokemon,
        importPokemon,

        // Moves
        learnMove,
        forgetMovesAboveLevel,

        // Evolution
        getEvolutionOptions,

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
