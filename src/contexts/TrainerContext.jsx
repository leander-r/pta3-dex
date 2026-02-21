// ============================================================
// Trainer Context
// ============================================================
// Manages trainer state and actions

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { GAME_DATA } from '../data/configs.js';
import { DEFAULT_TRAINER } from '../data/constants.js';
import toast from '../utils/toast.js';
import { useUI } from './UIContext.jsx';

const TrainerContext = createContext(null);

export const useTrainerContext = () => {
    const context = useContext(TrainerContext);
    if (!context) {
        throw new Error('useTrainerContext must be used within TrainerProvider');
    }
    return context;
};

export const TrainerProvider = ({ children }) => {
    const { showConfirm, showLevelUpNotification } = useUI();

    // Multi-Trainer Management (owned here; DataProvider populates after loading saved data)
    const [trainers, setTrainers] = useState([{ ...DEFAULT_TRAINER, id: Date.now() }]);
    const [activeTrainerId, setActiveTrainerId] = useState(null);

    // Current active trainer (computed)
    const trainer = useMemo(() => {
        return trainers.find(t => t.id === activeTrainerId) || trainers[0] || DEFAULT_TRAINER;
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
            ...DEFAULT_TRAINER,
            id: Date.now(),
            name: 'New Trainer'
        };
        setTrainers(prev => [...prev, newTrainer]);
        setActiveTrainerId(newTrainer.id);
        return newTrainer;
    }, [setTrainers]);

    // Delete a trainer from the roster (with 5-second undo window)
    const deleteTrainer = useCallback((trainerId) => {
        const activeTrainers = trainers.filter(t => !t.archived);
        if (activeTrainers.length <= 1 && !trainers.find(t => t.id === trainerId)?.archived) {
            toast.warning('You must have at least one active trainer. Archive it instead to hide it.');
            return;
        }
        showConfirm({
            title: 'Delete Trainer',
            message: 'Are you sure you want to permanently delete this trainer and all their Pokémon?',
            danger: true,
            onConfirm: () => {
                const deleted = trainers.find(t => t.id === trainerId);
                const remaining = trainers.filter(t => t.id !== trainerId);
                const nextActive = remaining.find(t => !t.archived) || remaining[0];

                setTrainers(remaining);
                if (trainerId === activeTrainerId) {
                    setActiveTrainerId(nextActive?.id ?? null);
                }

                toast.show(
                    `Trainer "${deleted?.name || 'Unnamed'}" deleted.`,
                    'warning',
                    5000,
                    {
                        label: 'Undo',
                        onClick: () => {
                            setTrainers(prev => [...prev, deleted]);
                            setActiveTrainerId(deleted.id);
                        }
                    }
                );
            }
        });
    }, [trainers, activeTrainerId, setTrainers, showConfirm]);

    // Archive a trainer (soft-delete — hidden from active selector but recoverable)
    const archiveTrainer = useCallback((trainerId) => {
        const activeCount = trainers.filter(t => !t.archived && t.id !== trainerId).length;
        if (activeCount === 0) {
            toast.warning('You must keep at least one active trainer.');
            return;
        }
        const nextActive = trainers.find(t => !t.archived && t.id !== trainerId);
        setTrainers(prev => prev.map(t => t.id === trainerId ? { ...t, archived: true } : t));
        if (trainerId === activeTrainerId && nextActive) {
            setActiveTrainerId(nextActive.id);
        }
        toast.info('Trainer archived. Restore them from the character menu.');
    }, [trainers, activeTrainerId, setTrainers]);

    // Restore an archived trainer
    const unarchiveTrainer = useCallback((trainerId) => {
        setTrainers(prev => prev.map(t => t.id === trainerId ? { ...t, archived: false } : t));
        setActiveTrainerId(trainerId);
    }, [setTrainers]);

    // Duplicate a trainer
    const duplicateTrainer = useCallback((trainerId) => {
        const trainerToCopy = trainers.find(t => t.id === trainerId);
        if (!trainerToCopy) return null;
        try {
            const newTrainer = {
                ...JSON.parse(JSON.stringify(trainerToCopy)),
                id: Date.now(),
                name: `${trainerToCopy.name} (Copy)`,
                party: (trainerToCopy.party || []).map((p, i) => ({ ...p, id: Date.now() + i + 1 })),
                reserve: (trainerToCopy.reserve || []).map((p, i) => ({ ...p, id: Date.now() + 1000 + i }))
            };
            setTrainers(prev => [...prev, newTrainer]);
            setActiveTrainerId(newTrainer.id);
            return newTrainer;
        } catch (err) {
            console.error('Failed to duplicate trainer:', err);
            toast.error('Could not duplicate trainer.');
            return null;
        }
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
            toast.warning('Maximum trainer level is 50!');
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
                toast.warning(`Before becoming Level 1, you must complete character creation:\n${issues.join('\n')}`);
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

        showLevelUpNotification({
            type: 'trainer',
            name: trainer.name,
            level: newLevel,
            statPoints: levelData.stats,
            featPoints: levelData.feats,
            note: levelData.note,
            message: notifications.join(' | ')
        });
    }, [trainer, setTrainer, showLevelUpNotification]);

    // Level down the trainer
    const levelDownTrainer = useCallback(() => {
        if (trainer.level <= 1) {
            toast.warning('Cannot go below level 1! Use "Respec Trainer" to reset to level 0.');
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
            toast.warning(`Cannot level down! You have ${levelPointsSpent} level stat points spent, but level ${newLevel} only provides ${totalLevelStatsAtNewLevel}.\nReduce your stats by ${pointsToRefund} point(s) first.`);
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
            toast.warning(`Cannot level down! You have ${currentClassCount} classes, but level ${newLevel} only allows ${maxClassesAtNewLevel}.\nRemove ${classesToRemove} class(es) first.`);
            return;
        }

        if (totalFeatPointsSpent > totalFeatsAtNewLevel) {
            const pointsToFree = totalFeatPointsSpent - totalFeatsAtNewLevel;
            toast.warning(`Cannot level down! You have ${totalFeatPointsSpent} feat points spent, but level ${newLevel} only provides ${totalFeatsAtNewLevel}.\nRemove ${pointsToFree} feature(s) or class(es) first.`);
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
        showConfirm({
            title: '⚠️ Respec Trainer',
            message: 'This will reset your trainer to Level 0 for character recreation:\n\n' +
                '• Stats reset to base (6 in each)\n' +
                '• All classes removed\n' +
                '• All features removed\n' +
                '• All skills removed\n' +
                '• 30 creation stat points restored\n' +
                '✓ Your Pokémon and notes will be KEPT!\n\n' +
                'Are you sure you want to respec?',
            confirmLabel: 'Respec',
            danger: true,
            onConfirm: () => {
                showConfirm({
                    title: 'Final Confirmation',
                    message: 'Are you REALLY sure? This cannot be undone!',
                    confirmLabel: 'Yes, Respec',
                    danger: true,
                    onConfirm: () => {
                        setTrainer(prev => ({
                            ...prev,
                            level: 0,
                            stats: { ...DEFAULT_TRAINER.stats },
                            statPoints: DEFAULT_TRAINER.statPoints,
                            levelStatPoints: 0,
                            featPoints: 0,
                            classes: [],
                            features: [],
                            skills: {},
                            edges: prev.edges || []
                        }));
                        toast.success('Trainer has been reset to Level 0! You can now rebuild your character.');
                    }
                });
            }
        });
    }, [setTrainer, showConfirm]);

    // Move pokemon to party
    const moveToParty = useCallback((pokemonId) => {
        if (party.length >= 6) {
            toast.warning('Your party is full! (Maximum 6 Pokemon)\nMove a Pokemon to reserve first.');
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
        archiveTrainer,
        unarchiveTrainer,

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
