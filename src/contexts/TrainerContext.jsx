// ============================================================
// Trainer Context
// ============================================================
// Manages trainer state and actions

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { GAME_DATA } from '../data/configs.js';

const TrainerContext = createContext(null);

export const useTrainerContext = () => {
    const context = useContext(TrainerContext);
    if (!context) {
        throw new Error('useTrainerContext must be used within TrainerProvider');
    }
    return context;
};

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

export const TrainerProvider = ({
    children,
    initialTrainers = null,
    initialActiveId = null,
    onTrainersChange,
    onLevelUp
}) => {
    // Track if we're doing an external sync to avoid notifying parent
    const isExternalUpdate = useRef(false);
    // Track if initial mount is complete
    const isInitialMount = useRef(true);

    // Multi-Trainer Management
    const [trainers, setTrainersState] = useState(() => {
        if (initialTrainers && initialTrainers.length > 0) {
            return initialTrainers;
        }
        return [{ ...defaultTrainer }];
    });

    const [activeTrainerId, setActiveTrainerIdState] = useState(() => {
        return initialActiveId || (initialTrainers && initialTrainers.length > 0 ? initialTrainers[0].id : null);
    });

    // Sync internal state when props change (e.g., from DataContext import)
    // Always sync from props to ensure external updates (like imports) are reflected
    useEffect(() => {
        // Skip on initial mount since state is already initialized from props
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        if (initialTrainers && initialTrainers.length > 0) {
            isExternalUpdate.current = true;
            setTrainersState(initialTrainers);
            // Reset flag immediately - it only needed to be true during this sync
            // to prevent redundant onTrainersChange calls, but we're using setTrainersState directly
            isExternalUpdate.current = false;
        }
    }, [initialTrainers]);

    // Sync activeTrainerId when prop changes
    useEffect(() => {
        if (initialActiveId && initialActiveId !== activeTrainerId) {
            setActiveTrainerIdState(initialActiveId);
        }
    }, [initialActiveId, activeTrainerId]);

    // Wrapper for setActiveTrainerId to notify parent
    const setActiveTrainerId = useCallback((id) => {
        setActiveTrainerIdState(id);
    }, []);

    // Track if change was internal (user action) vs external (prop sync)
    const pendingNotify = useRef(false);

    // Wrapper to update trainers and mark for parent notification
    const setTrainers = useCallback((updater) => {
        if (!isExternalUpdate.current) {
            pendingNotify.current = true;
        }
        setTrainersState(prev => {
            const newTrainers = typeof updater === 'function' ? updater(prev) : updater;
            isExternalUpdate.current = false;
            return newTrainers;
        });
    }, []);

    // Notify parent when trainers change due to user action
    useEffect(() => {
        if (pendingNotify.current && onTrainersChange) {
            pendingNotify.current = false;
            onTrainersChange(trainers);
        }
    }, [trainers, onTrainersChange]);

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
    }, [activeTrainerId, setTrainers]);

    // Get pokemon for current trainer
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
    }, [activeTrainerId, setTrainers]);

    // Helper to update reserve pokemon
    const setReserve = useCallback((updater) => {
        setTrainers(prev => prev.map(t => {
            if (t.id === (activeTrainerId || prev[0]?.id)) {
                const newReserve = typeof updater === 'function' ? updater(t.reserve || []) : updater;
                return { ...t, reserve: newReserve };
            }
            return t;
        }));
    }, [activeTrainerId, setTrainers]);

    // Add a new trainer to the roster
    const addNewTrainer = useCallback(() => {
        const newTrainer = {
            ...defaultTrainer,
            id: Date.now(),
            name: 'New Trainer'
        };
        setTrainers(prev => [...prev, newTrainer]);
        setActiveTrainerId(newTrainer.id);
        return newTrainer;
    }, [setTrainers]);

    // Delete a trainer from the roster
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
    }, [trainers.length, activeTrainerId, setTrainers]);

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
    }, [trainers, setTrainers]);

    // Calculate trainer modifiers
    const calculateModifier = useCallback((stat) => {
        const value = trainer.stats[stat] || 6;
        if (value === 10) return 0;
        if (value < 10) return -(10 - value);
        return Math.floor((value - 10) / 2);
    }, [trainer.stats]);

    // Calculate trainer max HP
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
            const hpBonus = (atkMod + defMod) * 5;
            baseHP += Math.max(0, hpBonus);
        } else if (hasMartialEndurance) {
            const atkMod = calculateModifier('atk');
            const defMod = calculateModifier('def');
            const hpBonus = (Math.floor(atkMod / 2) + Math.floor(defMod / 2)) * 5;
            baseHP += Math.max(0, hpBonus);
        }

        if (hasMysticVeil) {
            const defMod = calculateModifier('def');
            const hpBonus = defMod * 3;
            baseHP += Math.max(0, hpBonus);
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

    // Level up the trainer
    const levelUpTrainer = useCallback(() => {
        const newLevel = trainer.level + 1;
        if (newLevel > 50) {
            alert('Maximum trainer level is 50!');
            return;
        }

        if (trainer.level === 0) {
            const creationPointsRemaining = trainer.statPoints || 0;
            const hasClass = (trainer.classes || []).length > 0;

            const issues = [];
            if (creationPointsRemaining > 0) {
                issues.push(`• Spend all 30 Creation stat points (${creationPointsRemaining} remaining)`);
            }
            if (!hasClass) {
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

        const notifications = [];
        if (levelData.stats > 0) notifications.push(`+${levelData.stats} stat point(s)`);
        if (levelData.feats > 0) notifications.push(`+${levelData.feats} feature(s)`);
        if (levelData.note) notifications.push(levelData.note);

        if (onLevelUp) {
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

    // Level down the trainer
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
            const pointsToRefund = levelPointsSpent - totalLevelStatsAtNewLevel;
            alert(`Cannot level down! You have spent ${levelPointsSpent} level stat points, but level ${newLevel} only provides ${totalLevelStatsAtNewLevel}.\n\nPlease reduce your stats by ${pointsToRefund} point(s) first.`);
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

        const maxClassesAtNewLevel = newLevel >= 24 ? 4 : newLevel >= 12 ? 3 : newLevel >= 5 ? 2 : 1;
        const currentClassCount = (trainer.classes || []).length;

        if (currentClassCount > maxClassesAtNewLevel) {
            const classesToRemove = currentClassCount - maxClassesAtNewLevel;
            alert(`Cannot level down! You have ${currentClassCount} classes, but level ${newLevel} only allows ${maxClassesAtNewLevel}.\n\nPlease remove ${classesToRemove} class(es) first.`);
            return;
        }

        if (totalFeatPointsSpent > totalFeatsAtNewLevel) {
            const pointsToFree = totalFeatPointsSpent - totalFeatsAtNewLevel;
            alert(`Cannot level down! You have spent ${totalFeatPointsSpent} feat points, but level ${newLevel} only provides ${totalFeatsAtNewLevel} feat points.\n\nPlease remove ${pointsToFree} feature(s) or class(es) first.`);
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
        const confirmed = confirm(
            '⚠️ RESPEC TRAINER ⚠️\n\n' +
            'This will reset your trainer to Level 0 for character recreation:\n\n' +
            '• Stats reset to base (6 in each)\n' +
            '• All classes removed\n' +
            '• All features removed\n' +
            '• All skills removed\n' +
            '• 30 creation stat points restored\n' +
            '• 4 feat points restored (Level 1)\n\n' +
            '✓ Your Pokémon will be KEPT!\n' +
            '✓ Your trainer name and notes will be KEPT!\n\n' +
            'Are you sure you want to respec?'
        );

        if (!confirmed) return;

        const doubleConfirm = confirm('Are you REALLY sure? This cannot be undone!');
        if (!doubleConfirm) return;

        setTrainer(prev => ({
            ...prev,
            level: 0,
            stats: { hp: 6, atk: 6, def: 6, satk: 6, sdef: 6, spd: 6 },
            statPoints: 30,
            levelStatPoints: 0,
            featPoints: 0,
            classes: [],
            features: [],
            skills: {},
            edges: prev.edges || [],
            currentHP: 24 + 0
        }));

        alert('Trainer has been reset to Level 0!\n\nYou can now rebuild your character. Remember to level up to 1 and pick your first class to get your base features!');
    }, [setTrainer]);

    // Move pokemon to party
    const moveToParty = useCallback((pokemonId) => {
        if (party.length >= 6) {
            alert('Your party is full! (Maximum 6 Pokémon)\n\nMove a Pokémon to reserve first.');
            return;
        }
        const poke = reserve.find(p => p.id === pokemonId);
        if (poke) {
            setReserve(prev => prev.filter(p => p.id !== pokemonId));
            setParty(prev => [...prev, poke]);
        }
    }, [party.length, reserve, setParty, setReserve]);

    // Move pokemon to reserve
    const moveToReserve = useCallback((pokemonId) => {
        const poke = party.find(p => p.id === pokemonId);
        if (poke) {
            setParty(prev => prev.filter(p => p.id !== pokemonId));
            setReserve(prev => [...prev, poke]);
        }
    }, [party, setParty, setReserve]);

    // Reorder pokemon (move up)
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

    // Reorder pokemon (move down)
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

    // Sort pokemon list
    const sortPokemonList = useCallback((isParty, sortBy, sortDir = 'asc') => {
        const setList = isParty ? setParty : setReserve;
        setList(prev => {
            const sorted = [...prev].sort((a, b) => {
                let cmp = 0;
                switch (sortBy) {
                    case 'level':
                        cmp = (b.level || 1) - (a.level || 1);
                        break;
                    case 'species':
                        cmp = (a.species || '').localeCompare(b.species || '');
                        break;
                    case 'type':
                        cmp = (a.types?.[0] || '').localeCompare(b.types?.[0] || '');
                        break;
                    case 'name':
                    default:
                        cmp = (a.name || a.species || '').localeCompare(b.name || b.species || '');
                }
                return sortDir === 'asc' ? cmp : -cmp;
            });
            return sorted;
        });
    }, [setParty, setReserve]);

    const value = {
        // Trainer State
        trainers,
        setTrainers,
        activeTrainerId,
        setActiveTrainerId,
        trainer,
        setTrainer,

        // Pokemon State
        party,
        reserve,
        pokemon,
        setParty,
        setReserve,

        // Trainer Management
        addNewTrainer,
        deleteTrainer,
        duplicateTrainer,

        // Trainer Stats/Leveling
        calculateModifier,
        calculateMaxHP,
        updateTrainerStat,
        levelUpTrainer,
        levelDownTrainer,
        respecTrainer,

        // Pokemon Movement
        moveToParty,
        moveToReserve,
        movePokemonUp,
        movePokemonDown,
        sortPokemonList
    };

    return (
        <TrainerContext.Provider value={value}>
            {children}
        </TrainerContext.Provider>
    );
};

export default TrainerContext;
