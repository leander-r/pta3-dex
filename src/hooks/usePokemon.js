// ============================================================
// usePokemon Hook
// ============================================================
// Pokemon party and reserve management

import { useState, useCallback, useMemo } from 'react';
import { GAME_DATA } from '../data/configs.js';
import { EVOLUTION_CHAINS } from '../data/evolutionChains.js';
import { DEFAULT_POKEMON, MAX_PARTY_SIZE } from '../data/constants.js';
import { calculatePokemonLevel, getActualStats, calculatePokemonHP, calculateSTAB } from '../utils/dataUtils.js';

/**
 * Create a new Pokemon with default values
 * @returns {Object} - New Pokemon object
 */
const createNewPokemon = () => ({
    ...DEFAULT_POKEMON,
    id: Date.now() + Math.random(),
    name: 'New Pokemon',
    baseStats: { hp: 10, atk: 10, def: 10, satk: 10, sdef: 10, spd: 10 },
    addedStats: { hp: 0, atk: 0, def: 0, satk: 0, sdef: 0, spd: 0 }
});

/**
 * Custom hook for Pokemon management
 * @param {Function} setTrainer - Function to update trainer
 * @param {Object} trainer - Current trainer object
 * @returns {Object} - Pokemon state and functions
 */
export const usePokemon = (setTrainer, trainer) => {
    const [pokemonView, setPokemonView] = useState('party');
    const [editingPokemonId, setEditingPokemonId] = useState(null);
    const [selectedPokemonId, setSelectedPokemonId] = useState(null);
    const [pokemonEditTab, setPokemonEditTab] = useState({});

    // Get party and reserve from trainer
    const party = useMemo(() => trainer?.party || [], [trainer?.party]);
    const reserve = useMemo(() => trainer?.reserve || [], [trainer?.reserve]);

    // All pokemon combined
    const allPokemon = useMemo(() => [...party, ...reserve], [party, reserve]);

    // Helper to update party
    const setParty = useCallback((updater) => {
        setTrainer(prev => {
            const newParty = typeof updater === 'function' ? updater(prev.party || []) : updater;
            return { ...prev, party: newParty };
        });
    }, [setTrainer]);

    // Helper to update reserve
    const setReserve = useCallback((updater) => {
        setTrainer(prev => {
            const newReserve = typeof updater === 'function' ? updater(prev.reserve || []) : updater;
            return { ...prev, reserve: newReserve };
        });
    }, [setTrainer]);

    // Add new Pokemon
    const addPokemon = useCallback(() => {
        const newPokemon = createNewPokemon();

        if (pokemonView === 'party' && party.length < MAX_PARTY_SIZE) {
            setParty(prev => [...prev, newPokemon]);
        } else {
            setReserve(prev => [...prev, newPokemon]);
            if (pokemonView === 'party') {
                setPokemonView('reserve');
            }
        }

        setEditingPokemonId(newPokemon.id);
        return newPokemon;
    }, [pokemonView, party.length, setParty, setReserve]);

    // Update Pokemon
    const updatePokemon = useCallback((id, updates) => {
        const inParty = party.some(p => p.id === id);
        const updateFn = (prev) => prev.map(p => {
            if (p.id !== id) return p;

            // Handle level changes from exp
            let finalUpdates = { ...updates };

            if (updates.exp !== undefined) {
                const newLevel = calculatePokemonLevel(updates.exp);
                const oldLevel = p.level || 1;

                if (newLevel !== oldLevel) {
                    const levelDiff = newLevel - oldLevel;
                    const highestLevel = Math.max(p.highestLevelReached || oldLevel, newLevel);

                    // Calculate stat points based on highest level reached
                    if (newLevel > (p.highestLevelReached || oldLevel)) {
                        const newStatPoints = (p.statPointsAvailable || 0) + levelDiff;
                        finalUpdates = {
                            ...finalUpdates,
                            level: newLevel,
                            highestLevelReached: highestLevel,
                            statPointsAvailable: Math.max(0, newStatPoints)
                        };
                    } else {
                        finalUpdates.level = newLevel;
                    }
                }
            }

            if (updates.level !== undefined && updates.exp === undefined) {
                const newLevel = updates.level;
                const oldLevel = p.level || 1;
                const highestLevel = Math.max(p.highestLevelReached || oldLevel, newLevel);

                if (newLevel > (p.highestLevelReached || oldLevel)) {
                    const levelDiff = newLevel - oldLevel;
                    finalUpdates = {
                        ...finalUpdates,
                        highestLevelReached: highestLevel,
                        statPointsAvailable: (p.statPointsAvailable || 0) + levelDiff
                    };
                }
            }

            return { ...p, ...finalUpdates };
        });

        if (inParty) {
            setParty(updateFn);
        } else {
            setReserve(updateFn);
        }
    }, [party, setParty, setReserve]);

    // Delete Pokemon
    const deletePokemon = useCallback((id) => {
        const inParty = party.some(p => p.id === id);
        if (inParty) {
            setParty(prev => prev.filter(p => p.id !== id));
        } else {
            setReserve(prev => prev.filter(p => p.id !== id));
        }

        if (editingPokemonId === id) {
            setEditingPokemonId(null);
        }
        if (selectedPokemonId === id) {
            setSelectedPokemonId(null);
        }
    }, [party, setParty, setReserve, editingPokemonId, selectedPokemonId]);

    // Move Pokemon to party
    const moveToParty = useCallback((pokemonId) => {
        if (party.length >= MAX_PARTY_SIZE) {
            return { success: false, message: `Party is full! (Maximum ${MAX_PARTY_SIZE})` };
        }

        const poke = reserve.find(p => p.id === pokemonId);
        if (poke) {
            setReserve(prev => prev.filter(p => p.id !== pokemonId));
            setParty(prev => [...prev, poke]);
            return { success: true };
        }
        return { success: false, message: 'Pokemon not found' };
    }, [party.length, reserve, setParty, setReserve]);

    // Move Pokemon to reserve
    const moveToReserve = useCallback((pokemonId) => {
        const poke = party.find(p => p.id === pokemonId);
        if (poke) {
            setParty(prev => prev.filter(p => p.id !== pokemonId));
            setReserve(prev => [...prev, poke]);
            return { success: true };
        }
        return { success: false, message: 'Pokemon not found' };
    }, [party, setParty, setReserve]);

    // Reorder Pokemon (move up)
    const movePokemonUp = useCallback((pokemonId, isParty) => {
        const setList = isParty ? setParty : setReserve;
        setList(prev => {
            const index = prev.findIndex(p => p.id === pokemonId);
            if (index <= 0) return prev;
            const newList = [...prev];
            [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
            return newList;
        });
    }, [setParty, setReserve]);

    // Reorder Pokemon (move down)
    const movePokemonDown = useCallback((pokemonId, isParty) => {
        const setList = isParty ? setParty : setReserve;
        setList(prev => {
            const index = prev.findIndex(p => p.id === pokemonId);
            if (index < 0 || index >= prev.length - 1) return prev;
            const newList = [...prev];
            [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
            return newList;
        });
    }, [setParty, setReserve]);

    // Get evolution options for a Pokemon
    const getEvolutionOptions = useCallback((pokemon) => {
        if (!pokemon?.species) return { canEvolve: [], canDevolve: null };

        const species = pokemon.species;
        const level = pokemon.level || 1;
        const regionalForm = pokemon.regionalForm || null;

        const evolutionData = EVOLUTION_CHAINS[species];
        if (!evolutionData) return { canEvolve: [], canDevolve: null };

        const canEvolve = [];
        let canDevolve = null;

        // Check evolution options
        if (evolutionData.evolvesTo) {
            evolutionData.evolvesTo.forEach(evo => {
                // Regional Pokémon may only evolve into the matching regional form.
                // Non-regional Pokémon may evolve into any form (including regional variants).
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

        // Check devolution option
        if (evolutionData.evolvesFrom) {
            const devo = evolutionData.evolvesFrom;
            canDevolve = {
                species: devo.species,
                method: devo.method,
                requirement: devo.requirement
            };
        }

        return { canEvolve, canDevolve };
    }, []);

    // Add move to Pokemon
    const addMove = useCallback((pokemonId, move) => {
        updatePokemon(pokemonId, {
            moves: [...(allPokemon.find(p => p.id === pokemonId)?.moves || []), move]
        });
    }, [allPokemon, updatePokemon]);

    // Remove move from Pokemon
    const removeMove = useCallback((pokemonId, moveIndex) => {
        const pokemon = allPokemon.find(p => p.id === pokemonId);
        if (!pokemon) return;

        const newMoves = [...pokemon.moves];
        newMoves.splice(moveIndex, 1);
        updatePokemon(pokemonId, { moves: newMoves });
    }, [allPokemon, updatePokemon]);

    // Replace move at index
    const replaceMove = useCallback((pokemonId, moveIndex, newMove) => {
        const pokemon = allPokemon.find(p => p.id === pokemonId);
        if (!pokemon) return;

        const newMoves = [...pokemon.moves];
        newMoves[moveIndex] = newMove;
        updatePokemon(pokemonId, { moves: newMoves });
    }, [allPokemon, updatePokemon]);

    // Add stat to Pokemon
    const addStat = useCallback((pokemonId, stat) => {
        const pokemon = allPokemon.find(p => p.id === pokemonId);
        if (!pokemon || (pokemon.statPointsAvailable || 0) <= 0) return false;

        const newAddedStats = { ...pokemon.addedStats };
        newAddedStats[stat] = (newAddedStats[stat] || 0) + 1;

        updatePokemon(pokemonId, {
            addedStats: newAddedStats,
            statPointsAvailable: pokemon.statPointsAvailable - 1,
            statAllocationHistory: [...(pokemon.statAllocationHistory || []), stat]
        });

        return true;
    }, [allPokemon, updatePokemon]);

    // Remove stat from Pokemon
    const removeStat = useCallback((pokemonId, stat) => {
        const pokemon = allPokemon.find(p => p.id === pokemonId);
        if (!pokemon || (pokemon.addedStats?.[stat] || 0) <= 0) return false;

        const newAddedStats = { ...pokemon.addedStats };
        newAddedStats[stat] = Math.max(0, (newAddedStats[stat] || 0) - 1);

        updatePokemon(pokemonId, {
            addedStats: newAddedStats,
            statPointsAvailable: (pokemon.statPointsAvailable || 0) + 1
        });

        return true;
    }, [allPokemon, updatePokemon]);

    // Get Pokemon by ID
    const getPokemon = useCallback((id) => {
        return allPokemon.find(p => p.id === id);
    }, [allPokemon]);

    // Calculate Pokemon stats
    const getPokemonStats = useCallback((pokemonId) => {
        const pokemon = getPokemon(pokemonId);
        if (!pokemon) return null;

        const actualStats = getActualStats(pokemon);
        const maxHP = calculatePokemonHP(pokemon);
        const stabBonus = calculateSTAB(pokemon.level || 1);

        return {
            actualStats,
            maxHP,
            stabBonus,
            currentHP: maxHP - (pokemon.currentDamage || 0)
        };
    }, [getPokemon]);

    return {
        // State
        party,
        reserve,
        allPokemon,
        pokemonView,
        setPokemonView,
        editingPokemonId,
        setEditingPokemonId,
        selectedPokemonId,
        setSelectedPokemonId,
        pokemonEditTab,
        setPokemonEditTab,

        // CRUD operations
        addPokemon,
        updatePokemon,
        deletePokemon,
        getPokemon,

        // Party management
        moveToParty,
        moveToReserve,
        movePokemonUp,
        movePokemonDown,

        // Evolution
        getEvolutionOptions,

        // Moves
        addMove,
        removeMove,
        replaceMove,

        // Stats
        addStat,
        removeStat,
        getPokemonStats,

        // Helpers
        setParty,
        setReserve
    };
};

export default usePokemon;
