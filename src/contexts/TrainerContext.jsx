// ============================================================
// Trainer Context
// ============================================================
// Manages trainer state and actions

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { GAME_DATA } from '../data/configs.js';
import { useGameData } from './GameDataContext.jsx';
import {
    DEFAULT_TRAINER,
    BASE_STAT_VALUE,
    CREATION_STAT_CAP,
    CREATION_STAT_POINTS,
    MAX_PARTY_SIZE,
    MAX_TRAINER_LEVEL,
    MAX_FEATURE_DROPS,
    CLASS_2_MIN_LEVEL,
    CLASS_3_MIN_LEVEL,
    CLASS_4_MIN_LEVEL,
    HONOR_THRESHOLDS,
    HP_MILESTONE_LEVELS,
    POINT_BUY_COSTS
} from '../data/constants.js';
import toast from '../utils/toast.js';
import { useUI } from './UIContext.jsx';
import { useModal } from './ModalContext.jsx';

// ── Pure helper ─────────────────────────────────────────────
// PTA3 point-buy: cumulative creation cost from 1 to value.
// Only used for the character-creation pool; level-up uses flat 1-per-+1.
function getCumulativeCost(value) {
    return POINT_BUY_COSTS[Math.min(value, 6)] || (value > 6 ? POINT_BUY_COSTS[6] + (value - 6) : 0);
}

// Returns { creationDelta, levelDelta } (negative = spend, positive = refund).
// Returns null when the move is impossible (not enough points).
//
// Creation points use the point-buy cost table (spending 3→4 costs 3 pts, etc.).
// Level points (granted at milestone levels 3/7/11) are always flat: 1 pt = +1 stat.
function allocateStatPoints(oldValue, newValue, creationPoints, levelPoints) {
    if (newValue > oldValue) {
        // Spending: try creation-point-buy first (only within creation cap)
        if (newValue <= CREATION_STAT_CAP) {
            const creationCost = getCumulativeCost(newValue) - getCumulativeCost(oldValue);
            if (creationPoints >= creationCost) {
                return { creationDelta: -creationCost, levelDelta: 0 };
            }
        }
        // Level-up path: flat 1 level point per +1 (PTA3 rule: "increase by 1")
        const flatCost = newValue - oldValue;
        if (flatCost > levelPoints) return null;
        return { creationDelta: 0, levelDelta: -flatCost };
    } else {
        // Refunding (stat reduced via − button)
        if (oldValue <= CREATION_STAT_CAP) {
            const creationRefund = getCumulativeCost(oldValue) - getCumulativeCost(newValue);
            return { creationDelta: creationRefund, levelDelta: 0 };
        }
        return { creationDelta: 0, levelDelta: oldValue - newValue };
    }
}

/**
 * Returns feature names from allFeatures that belong to className
 * and have a "Level X" prerequisite exactly matching newClassLevel,
 * and are not already in ownedSet.
 * Only the primaryBaseClass receives the Level 15 feature (PTA3 rule).
 */
function getNewFeaturesForClass(className, newClassLevel, ownedSet, allFeatures, primaryBaseClass = '') {
    return Object.entries(allFeatures)
        .filter(([name, data]) => {
            if (data.category !== className) return false;
            if (ownedSet.has(name)) return false;
            const m = (data.prerequisites || '').match(/^Level (\d+)$/i);
            if (!m || parseInt(m[1]) !== newClassLevel) return false;
            if (parseInt(m[1]) === 15 && className !== primaryBaseClass) return false;
            return true;
        })
        .map(([name]) => name);
}

const TrainerContext = createContext(null);

export const useTrainerContext = () => {
    const context = useContext(TrainerContext);
    if (!context) {
        throw new Error('useTrainerContext must be used within TrainerProvider');
    }
    return context;
};

export const TrainerProvider = ({ children }) => {
    const { showLevelUpNotification } = useUI();
    const { showConfirm } = useModal();
    const { GAME_DATA: liveGameData } = useGameData();

    // Multi-Trainer Management (owned here; DataProvider populates after loading saved data)
    const [trainers, setTrainers] = useState([{ ...DEFAULT_TRAINER, id: Date.now() }]);
    const [activeTrainerId, setActiveTrainerId] = useState(null);

    // Feature drop: set when auto-granted features can optionally be swapped for +1 stat
    // { features: string[], dropsRemaining: number }
    const [pendingFeatureDrop, setPendingFeatureDrop] = useState(null);

    // Stat allocation undo — one-level snapshot
    const [lastStatSnapshot, setLastStatSnapshot] = useState(null);

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
            id: Date.now() * 1000 + Math.floor(Math.random() * 999),
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

    // Calculate trainer stat modifier (PTA3: ⌊stat / 2⌋)
    const calculateModifier = useCallback((stat) => {
        const value = trainer.stats[stat] || BASE_STAT_VALUE;
        return Math.floor(value / 2);
    }, [trainer.stats]);

    // Calculate trainer max HP (PTA3: 20 base + sum of hpRolls)
    const calculateMaxHP = useCallback(() => {
        const base = trainer.maxHp ?? 20;
        const rolls = Array.isArray(trainer.hpRolls) ? trainer.hpRolls : [];
        return base + rolls.reduce((s, v) => s + (v || 0), 0);
    }, [trainer.maxHp, trainer.hpRolls]);

    // Update trainer stat
    const updateTrainerStat = useCallback((stat, value) => {
        const newValue = parseInt(value) || BASE_STAT_VALUE;
        const oldValue = trainer.stats[stat] || BASE_STAT_VALUE;

        if (newValue < BASE_STAT_VALUE || newValue === oldValue) return;

        const levelPoints = trainer.levelStatPoints || 0;
        const allocation = allocateStatPoints(oldValue, newValue, trainer.statPoints || 0, levelPoints);
        if (!allocation) return;

        const allocations = trainer.levelStatAllocations || [];

        // PTA3 rule: at each milestone, the two increases must go to different stats
        if (allocation.levelDelta < 0 && allocations.includes(stat)) {
            toast.warning('You already used a level point on this stat. Choose a different stat.');
            return;
        }

        // Capture snapshot before applying change (enables one-level undo)
        setLastStatSnapshot({
            stats: { ...trainer.stats },
            statPoints: trainer.statPoints,
            levelStatPoints: trainer.levelStatPoints || 0,
            levelStatAllocations: allocations
        });

        // Track which stats were raised with level points
        let newAllocations = allocations;
        if (allocation.levelDelta < 0) {
            newAllocations = [...allocations, stat];
        } else if (allocation.levelDelta > 0) {
            newAllocations = allocations.filter(s => s !== stat);
        }

        setTrainer(prev => ({
            ...prev,
            stats: { ...prev.stats, [stat]: newValue },
            statPoints: (prev.statPoints || 0) + allocation.creationDelta,
            levelStatPoints: (prev.levelStatPoints || 0) + allocation.levelDelta,
            levelStatAllocations: newAllocations
        }));
    }, [trainer, setTrainer, setLastStatSnapshot]);

    const undoStatAllocation = useCallback(() => {
        if (!lastStatSnapshot) return;
        setTrainer(prev => ({
            ...prev,
            stats: lastStatSnapshot.stats,
            statPoints: lastStatSnapshot.statPoints,
            levelStatPoints: lastStatSnapshot.levelStatPoints,
            levelStatAllocations: lastStatSnapshot.levelStatAllocations || []
        }));
        setLastStatSnapshot(null);
    }, [lastStatSnapshot, setTrainer]);

    // Roll a milestone HP bonus (1d4) — called when trainer reaches Lv 3, 7, or 11
    const rollMilestoneHP = useCallback(() => {
        const roll = Math.ceil(Math.random() * 4);
        setTrainer(prev => ({
            ...prev,
            hpRolls: [...(prev.hpRolls || []), roll]
        }));
        toast.success(`HP milestone roll: +${roll} HP!`);
    }, [setTrainer]);

    // Level up the trainer (PTA3: honor-based leveling)
    // Requires enough honors for the next level (checked here and in TrainerProfile).
    const levelUpTrainer = useCallback(() => {
        const newLevel = trainer.level + 1;
        if (newLevel > MAX_TRAINER_LEVEL) {
            toast.warning(`Maximum trainer level is ${MAX_TRAINER_LEVEL}!`);
            return;
        }

        // Creation checklist for level 0 → 1
        if (trainer.level === 0) {
            const creationPointsRemaining = trainer.statPoints || 0;
            const hasClass = (trainer.classes || []).length > 0;
            const issues = [];
            if (creationPointsRemaining > 0) {
                issues.push(`• Spend all ${CREATION_STAT_POINTS} Creation stat points (${creationPointsRemaining} remaining)`);
            }
            if (!hasClass) {
                issues.push('• Pick your first Trainer Class');
            }
            if (issues.length > 0) {
                toast.warning(`Before becoming Level 1, you must complete character creation:\n${issues.join('\n')}`);
                return;
            }
        } else {
            // For levels 1+, require the honors threshold to be met
            const required = HONOR_THRESHOLDS[newLevel];
            if (required !== undefined && (trainer.honors || 0) < required) {
                const needed = required - (trainer.honors || 0);
                toast.warning(`Need ${needed} more honor${needed !== 1 ? 's' : ''} to reach level ${newLevel} (requires ${required} total).`);
                return;
            }

        }

        // PTA3: stat increases only at milestone levels 3, 7, 11 (+1 to two different stats = 2 points)
        const isMilestone = HP_MILESTONE_LEVELS.includes(newLevel);

        // Auto-grant features unlocked at the new class level for each class
        const allFeatures = liveGameData?.features || {};
        const primaryBaseClass = trainer.primaryBaseClass || (trainer.classes || [])[0] || '';
        const ownedSet = new Set((trainer.features || []).map(f => typeof f === 'object' ? f.name : f));
        const autoFeatures = [];
        Object.entries(trainer.classLevels || {}).forEach(([cls, clvl]) => {
            const newClsLevel = clvl + 1;
            getNewFeaturesForClass(cls, newClsLevel, ownedSet, allFeatures, primaryBaseClass).forEach(f => {
                autoFeatures.push(f);
                ownedSet.add(f);
            });
        });

        setTrainer(prev => ({
            ...prev,
            level: newLevel,
            levelStatPoints: (prev.levelStatPoints || 0) + (isMilestone ? 2 : 0),
            levelStatAllocations: isMilestone ? [] : (prev.levelStatAllocations || []),
            classLevels: Object.fromEntries(
                Object.entries(prev.classLevels || {}).map(([k, v]) => [k, v + 1])
            ),
            features: autoFeatures.length > 0
                ? [...(prev.features || []), ...autoFeatures]
                : (prev.features || [])
        }));

        // Offer feature drop if features were granted and drops are available
        if (autoFeatures.length > 0 && (trainer.featureDropsUsed || 0) < MAX_FEATURE_DROPS) {
            setPendingFeatureDrop({
                features: autoFeatures,
                dropsRemaining: MAX_FEATURE_DROPS - (trainer.featureDropsUsed || 0)
            });
        }

        const notifications = isMilestone ? ['+2 stat points', 'Class slot unlocked! Roll HP bonus (d4)'] : [];
        if (notifications.length === 0) notifications.push('Level up!');

        showLevelUpNotification({
            type: 'trainer',
            name: trainer.name,
            level: newLevel,
            statPoints: 2,
            message: notifications.join(' | ')
        });

        // Auto-prompt milestone HP roll
        if (isMilestone) {
            const milestonesReached = HP_MILESTONE_LEVELS.filter(l => l <= newLevel).length;
            const hpRolls = trainer.hpRolls || [];
            if (hpRolls.length < milestonesReached) {
                setTimeout(() => rollMilestoneHP(), 300);
            }
        }
    }, [trainer, setTrainer, showLevelUpNotification, rollMilestoneHP, liveGameData]);

    /**
     * Award honors only — does NOT auto-level.
     * The trainer must level up manually via the Level Up button in Trainer Stats.
     */
    const awardHonors = useCallback((amount) => {
        if (!amount || amount <= 0) return;
        const newHonors = (trainer.honors || 0) + amount;
        setTrainer(prev => ({ ...prev, honors: newHonors }));
    }, [trainer, setTrainer]);

    // Level down the trainer (PTA3)
    const levelDownTrainer = useCallback(() => {
        if (trainer.level <= 1) {
            toast.warning('Cannot go below level 1! Use "Respec Trainer" to reset to level 0.');
            return;
        }

        const newLevel = trainer.level - 1;

        // Check class slots — losing level may remove a class slot
        const maxClassesAtNewLevel = newLevel >= CLASS_4_MIN_LEVEL ? 4 : newLevel >= CLASS_3_MIN_LEVEL ? 3 : newLevel >= CLASS_2_MIN_LEVEL ? 2 : 1;
        const currentClassCount = (trainer.classes || []).length;
        if (currentClassCount > maxClassesAtNewLevel) {
            const classesToRemove = currentClassCount - maxClassesAtNewLevel;
            toast.warning(`Cannot level down! You have ${currentClassCount} classes, but level ${newLevel} only allows ${maxClassesAtNewLevel}.\nRemove ${classesToRemove} class(es) first.`);
            return;
        }

        // Remove last HP roll if the milestone is being un-reached
        const wasMilestone = HP_MILESTONE_LEVELS.includes(trainer.level);
        const hpRolls = [...(trainer.hpRolls || [])];
        if (wasMilestone && hpRolls.length > 0) hpRolls.pop();

        // PTA3: stat points are only granted at milestone levels — only refund at milestones
        const wasMilestoneLevel = HP_MILESTONE_LEVELS.includes(trainer.level);
        const newLevelStatPoints = Math.max(0, (trainer.levelStatPoints || 0) + (wasMilestoneLevel ? 2 : 0));

        // Remove features that were granted at the class level being lost
        const allFeatures = liveGameData?.features || {};
        const featuresToRemove = new Set();
        Object.entries(trainer.classLevels || {}).forEach(([cls, clvl]) => {
            Object.entries(allFeatures).forEach(([name, data]) => {
                if (data.category !== cls) return;
                const m = (data.prerequisites || '').match(/^Level (\d+)$/i);
                if (m && parseInt(m[1]) === clvl) featuresToRemove.add(name);
            });
        });

        setTrainer(prev => ({
            ...prev,
            level: newLevel,
            levelStatPoints: newLevelStatPoints,
            hpRolls,
            classLevels: Object.fromEntries(
                Object.entries(prev.classLevels || {}).map(([k, v]) => [k, Math.max(1, v - 1)])
            ),
            features: featuresToRemove.size > 0
                ? (prev.features || []).filter(f => !featuresToRemove.has(typeof f === 'object' ? f.name : f))
                : (prev.features || [])
        }));
    }, [trainer, setTrainer, liveGameData]);

    // Respec trainer
    const respecTrainer = useCallback(() => {
        showConfirm({
            title: '⚠️ Respec Trainer',
            message: 'This will reset your trainer to Level 0 for character recreation:\n\n' +
                '• Stats reset to base (3 in each)\n' +
                '• All classes removed\n' +
                '• All features removed\n' +
                '• All skills removed\n' +
                '• 25 creation stat points restored\n' +
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
                            maxHp: 20,
                            hpRolls: [],
                            honors: 0,
                            statPoints: DEFAULT_TRAINER.statPoints,
                            levelStatPoints: 0,
                            levelStatAllocations: [],
                            classLevels: {},
                            classes: [],
                            primaryBaseClass: '',
                            secondaryBaseClasses: [],
                            features: [],
                            skills: {},
                            classSkills: {},
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
        if (party.length >= MAX_PARTY_SIZE) {
            toast.warning(`Your party is full! (Maximum ${MAX_PARTY_SIZE} Pokemon)\nMove a Pokemon to reserve first.`);
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

    // Reorder pokemon via drag-and-drop
    const reorderPokemon = useCallback((dragId, dropId, isParty) => {
        const setList = isParty ? setParty : setReserve;
        setList(prev => {
            const from = prev.findIndex(p => p.id === dragId);
            const to   = prev.findIndex(p => p.id === dropId);
            if (from < 0 || to < 0 || from === to) return prev;
            const next = [...prev];
            const [item] = next.splice(from, 1);
            next.splice(to, 0, item);
            return next;
        });
    }, [setParty, setReserve]);

    // Sort pokemon list
    const sortPokemonList = useCallback((isParty, sortBy, sortDir = 'asc') => {
        const setList = isParty ? setParty : setReserve;
        setList(prev => {
            const sorted = [...prev].sort((a, b) => {
                let cmp = 0;
                switch (sortBy) {
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

    // Drop a feature gained on level-up, gaining +1 to a chosen stat instead
    const dropFeatureForStat = useCallback((featureName, stat) => {
        if (!pendingFeatureDrop) return;
        if ((trainer.featureDropsUsed || 0) >= MAX_FEATURE_DROPS) return;
        const currentVal = trainer.stats[stat] || 1;
        if (currentVal >= 10) {
            toast.warning('That stat is already at 10!');
            return;
        }
        setTrainer(prev => ({
            ...prev,
            features: (prev.features || []).filter(f => (typeof f === 'object' ? f.name : f) !== featureName),
            stats: { ...prev.stats, [stat]: (prev.stats[stat] || 1) + 1 },
            featureDropsUsed: (prev.featureDropsUsed || 0) + 1
        }));
        const remainingFeatures = pendingFeatureDrop.features.filter(f => f !== featureName);
        const newDropsRemaining = pendingFeatureDrop.dropsRemaining - 1;
        if (newDropsRemaining > 0 && remainingFeatures.length > 0) {
            setPendingFeatureDrop({ features: remainingFeatures, dropsRemaining: newDropsRemaining });
        } else {
            setPendingFeatureDrop(null);
        }
        toast.success(`Dropped "${featureName}" → +1 ${stat.toUpperCase()}`);
    }, [pendingFeatureDrop, trainer, setTrainer]);

    const dismissFeatureDrop = useCallback(() => {
        setPendingFeatureDrop(null);
    }, []);

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
        undoStatAllocation,
        canUndoStat: !!lastStatSnapshot,
        levelUpTrainer,
        levelDownTrainer,
        awardHonors,
        respecTrainer,
        rollMilestoneHP,
        pendingFeatureDrop,
        dropFeatureForStat,
        dismissFeatureDrop,

        // Pokemon Movement
        moveToParty,
        moveToReserve,
        movePokemonUp,
        movePokemonDown,
        sortPokemonList,
        reorderPokemon
    };

    return (
        <TrainerContext.Provider value={value}>
            {children}
        </TrainerContext.Provider>
    );
};

export default TrainerContext;
