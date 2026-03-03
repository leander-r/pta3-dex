// ============================================================
// Trainer State Container
// ============================================================
// Manages all trainer-related state and logic

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
    DEFAULT_TRAINER,
    BASE_STAT_VALUE,
    CREATION_STAT_CAP,
    CREATION_STAT_POINTS,
    MAX_TRAINER_LEVEL,
    CLASS_2_MIN_LEVEL,
    CLASS_3_MIN_LEVEL,
    CLASS_4_MIN_LEVEL,
    HP_MILESTONE_LEVELS,
    POINT_BUY_COSTS
} from '../data/constants.js';
import { safeLocalStorageGet, safeLocalStorageSet } from '../utils/storageUtils.js';
import { useModal } from '../contexts/ModalContext.jsx';

// ── PTA3 point-buy helpers ──────────────────────────────────
// Cumulative cost to raise a stat from 1 to `value`.
// Values above 6 (CREATION_STAT_CAP) cost 1 level-point per step.
function getCumulativeCost(value) {
    return POINT_BUY_COSTS[Math.min(value, 6)] || (value > 6 ? POINT_BUY_COSTS[6] + (value - 6) : 0);
}

// Returns { creationDelta, levelDelta } (negative = spend, positive = refund).
// Returns null when the move is impossible.
function allocateStatPoints(oldValue, newValue, creationPoints, levelPoints) {
    const delta = getCumulativeCost(newValue) - getCumulativeCost(oldValue);
    if (delta > 0) {
        if (newValue <= CREATION_STAT_CAP) {
            if (creationPoints >= delta) return { creationDelta: -delta, levelDelta: 0 };
            const remaining = delta - creationPoints;
            if (remaining > levelPoints) return null;
            return { creationDelta: -creationPoints, levelDelta: -remaining };
        } else {
            if (delta > levelPoints) return null;
            return { creationDelta: 0, levelDelta: -delta };
        }
    } else {
        const refund = Math.abs(delta);
        return oldValue <= CREATION_STAT_CAP
            ? { creationDelta: refund, levelDelta: 0 }
            : { creationDelta: 0, levelDelta: refund };
    }
}

/**
 * Default trainer template (PTA3)
 */
const defaultTrainer = {
    ...DEFAULT_TRAINER,
    id: Date.now(),
};

/**
 * useTrainerState - Custom hook that provides all trainer state and actions
 * This hook encapsulates the trainer management logic from App.jsx
 */
export const useTrainerState = (onLevelUp) => {
    const { showConfirm } = useModal();

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
            return;
        }
        showConfirm({
            title: 'Delete Trainer',
            message: 'Are you sure you want to delete this trainer and all their Pokémon? This cannot be undone.',
            danger: true,
            onConfirm: () => {
                setTrainers(prev => {
                    const filtered = prev.filter(t => t.id !== trainerId);
                    if (trainerId === activeTrainerId) {
                        setActiveTrainerId(filtered[0]?.id);
                    }
                    return filtered;
                });
            }
        });
    }, [trainers.length, activeTrainerId, showConfirm]);

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

    // Calculate modifier (PTA3: ⌊stat / 2⌋)
    const calculateModifier = useCallback((stat) => {
        const value = trainer.stats[stat] || BASE_STAT_VALUE;
        return Math.floor(value / 2);
    }, [trainer.stats]);

    // Calculate max HP (PTA3: 20 base + sum of milestone d4 rolls)
    const calculateMaxHP = useCallback(() => {
        const base = trainer.maxHp ?? 20;
        const rolls = Array.isArray(trainer.hpRolls) ? trainer.hpRolls : [];
        return base + rolls.reduce((s, v) => s + (v || 0), 0);
    }, [trainer.maxHp, trainer.hpRolls]);

    // Update trainer stat (PTA3 point-buy)
    const updateTrainerStat = useCallback((stat, value) => {
        const newValue = parseInt(value);
        if (isNaN(newValue) || newValue === (trainer.stats[stat] ?? BASE_STAT_VALUE)) return;
        if (newValue < BASE_STAT_VALUE || newValue > 10) return;

        const oldValue = trainer.stats[stat] ?? BASE_STAT_VALUE;
        const allocation = allocateStatPoints(oldValue, newValue, trainer.statPoints || 0, trainer.levelStatPoints || 0);
        if (!allocation) return;

        setTrainer(prev => ({
            ...prev,
            stats: { ...prev.stats, [stat]: newValue },
            statPoints: (prev.statPoints || 0) + allocation.creationDelta,
            levelStatPoints: (prev.levelStatPoints || 0) + allocation.levelDelta
        }));
    }, [trainer, setTrainer]);

    // Roll a milestone HP bonus (1d4)
    const rollMilestoneHP = useCallback(() => {
        const roll = Math.ceil(Math.random() * 4);
        setTrainer(prev => ({
            ...prev,
            hpRolls: [...(prev.hpRolls || []), roll]
        }));
        alert(`HP milestone roll: +${roll} HP!`);
    }, [setTrainer]);

    // Level up trainer (PTA3: honor-based, max 15)
    const levelUpTrainer = useCallback(() => {
        const newLevel = trainer.level + 1;
        if (newLevel > MAX_TRAINER_LEVEL) {
            alert(`Maximum trainer level is ${MAX_TRAINER_LEVEL}!`);
            return;
        }

        if (trainer.level === 0) {
            const issues = [];
            if ((trainer.statPoints || 0) > 0) {
                issues.push(`• Spend all ${CREATION_STAT_POINTS} Creation stat points (${trainer.statPoints} remaining)`);
            }
            if ((trainer.classes || []).length === 0) {
                issues.push('• Pick your first Trainer Class');
            }
            if (issues.length > 0) {
                alert(`Before becoming Level 1, you must complete character creation:\n\n${issues.join('\n')}`);
                return;
            }
        }

        const isMilestone = HP_MILESTONE_LEVELS.includes(newLevel);

        setTrainer(prev => ({
            ...prev,
            level: newLevel,
            levelStatPoints: (prev.levelStatPoints || 0) + 2
        }));

        if (onLevelUp) {
            const notifications = ['+2 stat points'];
            if (isMilestone) notifications.push('Class slot unlocked! Roll HP bonus (d4)');

            onLevelUp({
                type: 'trainer',
                name: trainer.name,
                level: newLevel,
                statPoints: 2,
                message: notifications.join(' | ')
            });
        }

        if (isMilestone) {
            const milestonesReached = HP_MILESTONE_LEVELS.filter(l => l <= newLevel).length;
            if ((trainer.hpRolls || []).length < milestonesReached) {
                setTimeout(() => rollMilestoneHP(), 300);
            }
        }
    }, [trainer, setTrainer, onLevelUp, rollMilestoneHP]);

    // Level down trainer (PTA3)
    const levelDownTrainer = useCallback(() => {
        if (trainer.level <= 1) {
            alert('Cannot go below level 1! Use "Respec Trainer" to reset to level 0 for character recreation.');
            return;
        }

        const newLevel = trainer.level - 1;

        // Check class slots
        const maxClassesAtNewLevel = newLevel >= CLASS_4_MIN_LEVEL ? 4 : newLevel >= CLASS_3_MIN_LEVEL ? 3 : newLevel >= CLASS_2_MIN_LEVEL ? 2 : 1;
        const currentClassCount = (trainer.classes || []).length;
        if (currentClassCount > maxClassesAtNewLevel) {
            alert(`Cannot level down! You have ${currentClassCount} classes, but level ${newLevel} only allows ${maxClassesAtNewLevel}. Remove ${currentClassCount - maxClassesAtNewLevel} class(es) first.`);
            return;
        }

        // Remove last HP roll if un-reaching a milestone
        const wasMilestone = HP_MILESTONE_LEVELS.includes(trainer.level);
        const hpRolls = [...(trainer.hpRolls || [])];
        if (wasMilestone && hpRolls.length > 0) hpRolls.pop();

        // Refund 2 level stat points (PTA3: +2 per level)
        const newLevelStatPoints = Math.max(0, (trainer.levelStatPoints || 0) + 2);

        setTrainer(prev => ({
            ...prev,
            level: newLevel,
            levelStatPoints: newLevelStatPoints,
            hpRolls
        }));
    }, [trainer, setTrainer]);

    // Respec trainer (PTA3)
    const respecTrainer = useCallback(() => {
        showConfirm({
            title: '⚠️ Respec Trainer',
            message: 'This will reset to Level 0. Continue?',
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
                            honors: 0,
                            stats: { ...DEFAULT_TRAINER.stats },
                            maxHp: 20,
                            hpRolls: [],
                            statPoints: DEFAULT_TRAINER.statPoints,
                            levelStatPoints: 0,
                            featPoints: 0,
                            classes: [],
                            features: [],
                            skills: {}
                        }));
                    }
                });
            }
        });
    }, [setTrainer, showConfirm]);

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
        rollMilestoneHP,

        // Pokemon movement
        moveToParty,
        moveToReserve,
        movePokemonUp,
        movePokemonDown,
        sortPokemonList
    };
};

export default useTrainerState;
