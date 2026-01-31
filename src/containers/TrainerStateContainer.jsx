// ============================================================
// Trainer State Container
// ============================================================
// Manages all trainer-related state and logic

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { GAME_DATA } from '../data/configs.js';
import { safeLocalStorageGet, safeLocalStorageSet } from '../utils/storageUtils.js';

/**
 * Default trainer template
 */
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
    statPoints: 30,
    levelStatPoints: 0,
    featPoints: 0,
    skills: {},
    features: [],
    notes: '',
    badges: [],
    money: 0,
    party: [],
    reserve: []
};

/**
 * useTrainerState - Custom hook that provides all trainer state and actions
 * This hook encapsulates the trainer management logic from App.jsx
 */
export const useTrainerState = (onLevelUp) => {
    // Multi-Trainer Management
    const [trainers, setTrainers] = useState([{ ...defaultTrainer }]);
    const [activeTrainerId, setActiveTrainerId] = useState(null);

    // Current active trainer (computed)
    const trainer = useMemo(() => {
        return trainers.find(t => t.id === activeTrainerId) || trainers[0] || defaultTrainer;
    }, [trainers, activeTrainerId]);

    // Helper to update current trainer
    const setTrainer = useCallback((updater) => {
        setTrainers(prev => prev.map(t => {
            if (t.id === (activeTrainerId || prev[0]?.id)) {
                return typeof updater === 'function' ? updater(t) : { ...t, ...updater };
            }
            return t;
        }));
    }, [activeTrainerId]);

    // Pokemon state derived from trainer
    const party = trainer.party || [];
    const reserve = trainer.reserve || [];
    const pokemon = [...party, ...reserve];

    // Helper to update party pokemon
    const setParty = useCallback((updater) => {
        setTrainers(prev => prev.map(t => {
            if (t.id === (activeTrainerId || prev[0]?.id)) {
                const newParty = typeof updater === 'function' ? updater(t.party || []) : updater;
                return { ...t, party: newParty };
            }
            return t;
        }));
    }, [activeTrainerId]);

    // Helper to update reserve pokemon
    const setReserve = useCallback((updater) => {
        setTrainers(prev => prev.map(t => {
            if (t.id === (activeTrainerId || prev[0]?.id)) {
                const newReserve = typeof updater === 'function' ? updater(t.reserve || []) : updater;
                return { ...t, reserve: newReserve };
            }
            return t;
        }));
    }, [activeTrainerId]);

    // Initialize activeTrainerId on first load
    useEffect(() => {
        if (!activeTrainerId && trainers.length > 0) {
            setActiveTrainerId(trainers[0].id);
        }
    }, [trainers, activeTrainerId]);

    // Add a new trainer
    const addNewTrainer = useCallback(() => {
        const newTrainer = {
            ...defaultTrainer,
            id: Date.now(),
            name: 'New Trainer'
        };
        setTrainers(prev => [...prev, newTrainer]);
        setActiveTrainerId(newTrainer.id);
        return newTrainer;
    }, []);

    // Delete a trainer
    const deleteTrainer = useCallback((trainerId) => {
        if (trainers.length <= 1) {
            alert('You must have at least one trainer.');
            return false;
        }
        if (confirm('Are you sure you want to delete this trainer and all their Pokémon? This cannot be undone.')) {
            setTrainers(prev => {
                const filtered = prev.filter(t => t.id !== trainerId);
                if (trainerId === activeTrainerId) {
                    setActiveTrainerId(filtered[0]?.id);
                }
                return filtered;
            });
            return true;
        }
        return false;
    }, [trainers.length, activeTrainerId]);

    // Duplicate a trainer
    const duplicateTrainer = useCallback((trainerId) => {
        const trainerToCopy = trainers.find(t => t.id === trainerId);
        if (trainerToCopy) {
            const newTrainer = {
                ...JSON.parse(JSON.stringify(trainerToCopy)),
                id: Date.now(),
                name: `${trainerToCopy.name} (Copy)`,
                party: (trainerToCopy.party || []).map(p => ({ ...p, id: Date.now() + Math.random() })),
                reserve: (trainerToCopy.reserve || []).map(p => ({ ...p, id: Date.now() + Math.random() }))
            };
            setTrainers(prev => [...prev, newTrainer]);
            setActiveTrainerId(newTrainer.id);
            return newTrainer;
        }
        return null;
    }, [trainers]);

    // Calculate modifier
    const calculateModifier = useCallback((stat) => {
        const value = trainer.stats[stat] || 6;
        if (value === 10) return 0;
        if (value < 10) return -(10 - value);
        return Math.floor((value - 10) / 2);
    }, [trainer.stats]);

    // Calculate max HP
    const calculateMaxHP = useCallback(() => {
        let baseHP = (trainer.stats.hp * 4) + (trainer.level * 4);
        const features = trainer.features || [];

        const hasImprovedMartialEndurance = features.some(f =>
            (typeof f === 'object' ? f.name : f) === 'Improved Martial Endurance'
        );
        const hasMartialEndurance = features.some(f =>
            (typeof f === 'object' ? f.name : f) === 'Martial Endurance'
        );
        const hasMysticVeil = features.some(f =>
            (typeof f === 'object' ? f.name : f) === 'Mystic Veil'
        );

        if (hasImprovedMartialEndurance) {
            const atkMod = calculateModifier('atk');
            const defMod = calculateModifier('def');
            baseHP += Math.max(0, (atkMod + defMod) * 5);
        } else if (hasMartialEndurance) {
            const atkMod = calculateModifier('atk');
            const defMod = calculateModifier('def');
            baseHP += Math.max(0, (Math.floor(atkMod / 2) + Math.floor(defMod / 2)) * 5);
        }

        if (hasMysticVeil) {
            const defMod = calculateModifier('def');
            baseHP += Math.max(0, defMod * 3);
        }

        return baseHP;
    }, [trainer.stats, trainer.level, trainer.features, calculateModifier]);

    // Update trainer stat
    const updateTrainerStat = useCallback((stat, value) => {
        const newValue = parseInt(value) || 6;
        const oldValue = trainer.stats[stat];
        const difference = newValue - oldValue;
        const totalAvailable = trainer.statPoints + (trainer.levelStatPoints || 0);

        if (newValue < 6) return;
        if (totalAvailable - difference < 0) return;

        if (difference > 0) {
            if (newValue > 14 && trainer.statPoints > 0) {
                const pointsToReach14 = Math.max(0, 14 - oldValue);
                const creationPointsToUse = Math.min(trainer.statPoints, pointsToReach14);
                const levelPointsToUse = difference - creationPointsToUse;
                if (levelPointsToUse > (trainer.levelStatPoints || 0)) return;

                setTrainer(prev => ({
                    ...prev,
                    stats: { ...prev.stats, [stat]: newValue },
                    statPoints: prev.statPoints - creationPointsToUse,
                    levelStatPoints: (prev.levelStatPoints || 0) - levelPointsToUse
                }));
            } else if (newValue <= 14 && trainer.statPoints >= difference) {
                setTrainer(prev => ({
                    ...prev,
                    stats: { ...prev.stats, [stat]: newValue },
                    statPoints: prev.statPoints - difference
                }));
            } else if (newValue <= 14 && trainer.statPoints < difference) {
                const creationPointsToUse = trainer.statPoints;
                const levelPointsToUse = difference - creationPointsToUse;
                if (levelPointsToUse > (trainer.levelStatPoints || 0)) return;

                setTrainer(prev => ({
                    ...prev,
                    stats: { ...prev.stats, [stat]: newValue },
                    statPoints: 0,
                    levelStatPoints: (prev.levelStatPoints || 0) - levelPointsToUse
                }));
            } else {
                if (difference > (trainer.levelStatPoints || 0)) return;
                setTrainer(prev => ({
                    ...prev,
                    stats: { ...prev.stats, [stat]: newValue },
                    levelStatPoints: (prev.levelStatPoints || 0) - difference
                }));
            }
        } else {
            const refund = Math.abs(difference);
            if (trainer.level === 0) {
                setTrainer(prev => ({
                    ...prev,
                    stats: { ...prev.stats, [stat]: newValue },
                    statPoints: prev.statPoints + refund
                }));
            } else {
                setTrainer(prev => ({
                    ...prev,
                    stats: { ...prev.stats, [stat]: newValue },
                    levelStatPoints: (prev.levelStatPoints || 0) + refund
                }));
            }
        }
    }, [trainer, setTrainer]);

    // Level up trainer
    const levelUpTrainer = useCallback(() => {
        const newLevel = trainer.level + 1;
        if (newLevel > 50) {
            alert('Maximum trainer level is 50!');
            return;
        }

        if (trainer.level === 0) {
            const issues = [];
            if ((trainer.statPoints || 0) > 0) {
                issues.push(`• Spend all 30 Creation stat points (${trainer.statPoints} remaining)`);
            }
            if ((trainer.classes || []).length === 0) {
                issues.push('• Pick your first Trainer Class');
            }
            if (issues.length > 0) {
                alert(`Before becoming Level 1, you must complete character creation:\n\n${issues.join('\n')}`);
                return;
            }
        }

        const levelData = GAME_DATA.trainerLevelProgression[newLevel] || { feats: 0, stats: 0 };

        setTrainer(prev => ({
            ...prev,
            level: newLevel,
            levelStatPoints: (prev.levelStatPoints || 0) + levelData.stats,
            featPoints: (prev.featPoints || 0) + levelData.feats
        }));

        if (onLevelUp) {
            const notifications = [];
            if (levelData.stats > 0) notifications.push(`+${levelData.stats} stat point(s)`);
            if (levelData.feats > 0) notifications.push(`+${levelData.feats} feature(s)`);
            if (levelData.note) notifications.push(levelData.note);

            onLevelUp({
                type: 'trainer',
                name: trainer.name,
                level: newLevel,
                statPoints: levelData.stats,
                featPoints: levelData.feats,
                note: levelData.note,
                message: notifications.join(' | ')
            });
        }
    }, [trainer, setTrainer, onLevelUp]);

    // Level down trainer
    const levelDownTrainer = useCallback(() => {
        if (trainer.level <= 1) {
            alert('Cannot go below level 1! Use "Respec Trainer" to reset to level 0 for character recreation.');
            return;
        }

        const currentLevel = trainer.level;
        const newLevel = currentLevel - 1;

        let totalLevelStatsAtNewLevel = 0;
        for (let i = 1; i <= newLevel; i++) {
            totalLevelStatsAtNewLevel += (GAME_DATA.trainerLevelProgression[i]?.stats || 0);
        }

        const totalStatsSpent = Object.values(trainer.stats).reduce((sum, val) => sum + val, 0) - 36;
        const creationPointsSpent = 30 - trainer.statPoints;
        const levelPointsSpent = Math.max(0, totalStatsSpent - creationPointsSpent);

        if (levelPointsSpent > totalLevelStatsAtNewLevel) {
            alert(`Cannot level down! Please reduce your stats first.`);
            return;
        }

        const newLevelStatPoints = totalLevelStatsAtNewLevel - levelPointsSpent;

        let totalFeatsAtNewLevel = 0;
        for (let i = 1; i <= newLevel; i++) {
            totalFeatsAtNewLevel += (GAME_DATA.trainerLevelProgression[i]?.feats || 0);
        }

        const featuresWithCost = (trainer.features || []).filter(f => {
            const featureName = typeof f === 'object' ? f.name : f;
            const featureData = GAME_DATA.features[featureName];
            return featureData && featureData.category !== 'General (Free)' && !featureData.isBase;
        }).length;

        const classesWithCost = Math.max(0, (trainer.classes || []).length - 1);
        const totalFeatPointsSpent = featuresWithCost + classesWithCost;

        if (totalFeatPointsSpent > totalFeatsAtNewLevel) {
            alert(`Cannot level down! Please remove features or classes first.`);
            return;
        }

        const newFeatPoints = totalFeatsAtNewLevel - totalFeatPointsSpent;

        setTrainer(prev => ({
            ...prev,
            level: newLevel,
            levelStatPoints: newLevelStatPoints,
            featPoints: newFeatPoints
        }));
    }, [trainer, setTrainer]);

    // Respec trainer
    const respecTrainer = useCallback(() => {
        if (!confirm('⚠️ RESPEC TRAINER ⚠️\n\nThis will reset to Level 0. Continue?')) return;
        if (!confirm('Are you REALLY sure? This cannot be undone!')) return;

        setTrainer(prev => ({
            ...prev,
            level: 0,
            stats: { hp: 6, atk: 6, def: 6, satk: 6, sdef: 6, spd: 6 },
            statPoints: 30,
            levelStatPoints: 0,
            featPoints: 0,
            classes: [],
            features: [],
            skills: {}
        }));

        alert('Trainer has been reset to Level 0!');
    }, [setTrainer]);

    // Pokemon movement functions
    const moveToParty = useCallback((pokemonId) => {
        if (party.length >= 6) {
            alert('Your party is full! (Maximum 6 Pokémon)');
            return;
        }
        const poke = reserve.find(p => p.id === pokemonId);
        if (poke) {
            setReserve(prev => prev.filter(p => p.id !== pokemonId));
            setParty(prev => [...prev, poke]);
        }
    }, [party.length, reserve, setParty, setReserve]);

    const moveToReserve = useCallback((pokemonId) => {
        const poke = party.find(p => p.id === pokemonId);
        if (poke) {
            setParty(prev => prev.filter(p => p.id !== pokemonId));
            setReserve(prev => [...prev, poke]);
        }
    }, [party, setParty, setReserve]);

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

    const sortPokemonList = useCallback((isParty, sortBy, sortDir = 'asc') => {
        const setList = isParty ? setParty : setReserve;
        setList(prev => {
            const sorted = [...prev].sort((a, b) => {
                let cmp = 0;
                switch (sortBy) {
                    case 'level': cmp = (b.level || 1) - (a.level || 1); break;
                    case 'species': cmp = (a.species || '').localeCompare(b.species || ''); break;
                    case 'type': cmp = (a.types?.[0] || '').localeCompare(b.types?.[0] || ''); break;
                    default: cmp = (a.name || a.species || '').localeCompare(b.name || b.species || '');
                }
                return sortDir === 'asc' ? cmp : -cmp;
            });
            return sorted;
        });
    }, [setParty, setReserve]);

    return {
        // State
        trainers,
        setTrainers,
        activeTrainerId,
        setActiveTrainerId,
        trainer,
        setTrainer,

        // Pokemon state
        party,
        reserve,
        pokemon,
        setParty,
        setReserve,

        // Trainer management
        addNewTrainer,
        deleteTrainer,
        duplicateTrainer,

        // Stats/leveling
        calculateModifier,
        calculateMaxHP,
        updateTrainerStat,
        levelUpTrainer,
        levelDownTrainer,
        respecTrainer,

        // Pokemon movement
        moveToParty,
        moveToReserve,
        movePokemonUp,
        movePokemonDown,
        sortPokemonList
    };
};

export default useTrainerState;
