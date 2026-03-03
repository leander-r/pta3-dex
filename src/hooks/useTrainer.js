// ============================================================
// useTrainer Hook
// ============================================================
// Trainer state and management functions

import { useState, useCallback, useMemo } from 'react';
import { GAME_DATA } from '../data/configs.js';
import {
    DEFAULT_TRAINER, MAX_TRAINER_LEVEL, BASE_STAT_VALUE,
    CREATION_STAT_POINTS, CREATION_STAT_CAP,
    HONOR_THRESHOLDS, HP_MILESTONE_LEVELS, POINT_BUY_COSTS
} from '../data/constants.js';

/**
 * Create a new trainer with default values
 * @param {string} name - Trainer name
 * @returns {Object} - New trainer object
 */
const createNewTrainer = (name = 'New Trainer') => ({
    ...DEFAULT_TRAINER,
    id: Date.now(),
    name,
    // PTA3: 5 stats (no HP), values 1-10, base 3
    stats: { atk: 3, def: 3, satk: 3, sdef: 3, spd: 3 },
    maxHp: 20,
    hpRolls: [],
    honors: 0,
    statPoints: CREATION_STAT_POINTS,
    levelStatPoints: 0,
    party: [],
    reserve: []
});

// PTA3 cumulative point-buy cost for a stat value
function getCumulativeCost(value) {
    return POINT_BUY_COSTS[Math.min(value, 6)] || (value > 6 ? POINT_BUY_COSTS[6] + (value - 6) : 0);
}

/**
 * Custom hook for multi-trainer management
 * @param {Array} initialTrainers - Initial trainers array
 * @param {number} initialActiveId - Initial active trainer ID
 * @returns {Object} - Trainer state and functions
 */
export const useTrainer = (initialTrainers = null, initialActiveId = null) => {
    // Initialize with default trainer if no initial trainers
    const [trainers, setTrainers] = useState(() => {
        if (initialTrainers && initialTrainers.length > 0) {
            return initialTrainers;
        }
        return [createNewTrainer()];
    });

    const [activeTrainerId, setActiveTrainerId] = useState(() => {
        if (initialActiveId) return initialActiveId;
        if (initialTrainers && initialTrainers.length > 0) return initialTrainers[0].id;
        return trainers[0]?.id || null;
    });

    // Current active trainer (computed)
    const trainer = useMemo(() => {
        return trainers.find(t => t.id === activeTrainerId) || trainers[0] || createNewTrainer();
    }, [trainers, activeTrainerId]);

    // Helper to update current trainer
    const setTrainer = useCallback((updater) => {
        setTrainers(prev => prev.map(t => {
            if (t.id === activeTrainerId) {
                return typeof updater === 'function' ? updater(t) : { ...t, ...updater };
            }
            return t;
        }));
    }, [activeTrainerId]);

    // Add a new trainer
    const addNewTrainer = useCallback((name = 'New Trainer') => {
        const newTrainer = createNewTrainer(name);
        setTrainers(prev => [...prev, newTrainer]);
        setActiveTrainerId(newTrainer.id);
        return newTrainer;
    }, []);

    // Delete a trainer
    const deleteTrainer = useCallback((trainerId) => {
        if (trainers.length <= 1) {
            return false; // Must have at least one trainer
        }

        setTrainers(prev => {
            const filtered = prev.filter(t => t.id !== trainerId);
            if (trainerId === activeTrainerId) {
                setActiveTrainerId(filtered[0]?.id);
            }
            return filtered;
        });
        return true;
    }, [trainers.length, activeTrainerId]);

    // Duplicate a trainer
    const duplicateTrainer = useCallback((trainerId) => {
        const trainerToCopy = trainers.find(t => t.id === trainerId);
        if (!trainerToCopy) return null;

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
    }, [trainers]);

    // Update trainer stat (PTA3 point-buy)
    const updateTrainerStat = useCallback((stat, value) => {
        const newValue = parseInt(value) || BASE_STAT_VALUE;
        const oldValue = trainer.stats[stat] || BASE_STAT_VALUE;

        if (newValue < BASE_STAT_VALUE || newValue > 10) return false;

        const oldCost = getCumulativeCost(oldValue);
        const newCost = getCumulativeCost(newValue);
        const delta = newCost - oldCost;

        const creationPoints = trainer.statPoints || 0;
        const levelPoints = trainer.levelStatPoints || 0;

        if (delta > 0) {
            // Spending points
            if (newValue <= CREATION_STAT_CAP) {
                if (creationPoints >= delta) {
                    setTrainer(prev => ({ ...prev, stats: { ...prev.stats, [stat]: newValue }, statPoints: prev.statPoints - delta }));
                } else {
                    const remaining = delta - creationPoints;
                    if (remaining > levelPoints) return false;
                    setTrainer(prev => ({ ...prev, stats: { ...prev.stats, [stat]: newValue }, statPoints: 0, levelStatPoints: (prev.levelStatPoints || 0) - remaining }));
                }
            } else {
                if (delta > levelPoints) return false;
                setTrainer(prev => ({ ...prev, stats: { ...prev.stats, [stat]: newValue }, levelStatPoints: (prev.levelStatPoints || 0) - delta }));
            }
        } else {
            // Refunding points
            const refund = Math.abs(delta);
            if (oldValue <= CREATION_STAT_CAP) {
                setTrainer(prev => ({ ...prev, stats: { ...prev.stats, [stat]: newValue }, statPoints: prev.statPoints + refund }));
            } else {
                setTrainer(prev => ({ ...prev, stats: { ...prev.stats, [stat]: newValue }, levelStatPoints: (prev.levelStatPoints || 0) + refund }));
            }
        }

        return true;
    }, [trainer, setTrainer]);

    // Level up trainer (PTA3 honor-based)
    const levelUpTrainer = useCallback(() => {
        const newLevel = trainer.level + 1;
        if (newLevel > MAX_TRAINER_LEVEL) {
            return { success: false, message: `Maximum trainer level is ${MAX_TRAINER_LEVEL}!` };
        }

        // Validation for level 0 -> 1
        if (trainer.level === 0) {
            const issues = [];
            if ((trainer.statPoints || 0) > 0) {
                issues.push(`Spend all ${CREATION_STAT_POINTS} creation stat points (${trainer.statPoints} remaining)`);
            }
            if ((trainer.classes || []).length === 0) {
                issues.push('Pick your first Trainer Class');
            }
            if (issues.length > 0) {
                return { success: false, message: `Complete character creation first:\n${issues.join('\n')}` };
            }
        }

        const isMilestone = HP_MILESTONE_LEVELS.includes(newLevel);
        const hpRoll = isMilestone ? Math.ceil(Math.random() * 4) : 0;

        setTrainer(prev => ({
            ...prev,
            level: newLevel,
            levelStatPoints: (prev.levelStatPoints || 0) + 2,
            ...(isMilestone && { hpRolls: [...(prev.hpRolls || []), hpRoll] })
        }));

        return {
            success: true,
            level: newLevel,
            statPoints: 2,
            hpRoll: isMilestone ? hpRoll : null,
            isMilestone
        };
    }, [trainer, setTrainer]);

    // Level down trainer (PTA3 honor-based)
    const levelDownTrainer = useCallback(() => {
        if (trainer.level <= 1) {
            return { success: false, message: 'Cannot go below level 1!' };
        }

        const currentLevel = trainer.level;
        const newLevel = currentLevel - 1;

        // Check we can refund 2 level stat points
        const totalLevelPointsGranted = newLevel * 2;
        const levelPointsSpent = Math.max(0, (trainer.levelStatPoints || 0));
        // Ensure dropping the level doesn't strand points in stats
        const newLevelStatPoints = Math.max(0, (trainer.levelStatPoints || 0) + 2);

        const isMilestone = HP_MILESTONE_LEVELS.includes(currentLevel);

        setTrainer(prev => ({
            ...prev,
            level: newLevel,
            levelStatPoints: newLevelStatPoints,
            ...(isMilestone && { hpRolls: (prev.hpRolls || []).slice(0, -1) })
        }));

        return { success: true, level: newLevel };
    }, [trainer, setTrainer]);

    // Respec trainer (reset to level 0, PTA3 defaults)
    const respecTrainer = useCallback(() => {
        setTrainer(prev => ({
            ...prev,
            level: 0,
            stats: { atk: 3, def: 3, satk: 3, sdef: 3, spd: 3 },
            maxHp: 20,
            hpRolls: [],
            honors: 0,
            statPoints: CREATION_STAT_POINTS,
            levelStatPoints: 0,
            classes: [],
            features: [],
            skills: {}
        }));
    }, [setTrainer]);

    // Add class to trainer
    const addClass = useCallback((className) => {
        setTrainer(prev => ({
            ...prev,
            classes: [...(prev.classes || []), className]
        }));
    }, [setTrainer]);

    // Remove class from trainer
    const removeClass = useCallback((className) => {
        setTrainer(prev => ({
            ...prev,
            classes: (prev.classes || []).filter(c => c !== className)
        }));
    }, [setTrainer]);

    // Add feature to trainer
    const addFeature = useCallback((feature) => {
        setTrainer(prev => ({
            ...prev,
            features: [...(prev.features || []), feature]
        }));
    }, [setTrainer]);

    // Remove feature from trainer
    const removeFeature = useCallback((featureName) => {
        setTrainer(prev => ({
            ...prev,
            features: (prev.features || []).filter(f =>
                (typeof f === 'object' ? f.name : f) !== featureName
            )
        }));
    }, [setTrainer]);

    // Add skill to trainer (with rank, default 1)
    const addSkill = useCallback((skill, rank = 1) => {
        setTrainer(prev => {
            const currentSkills = prev.skills || {};
            // Handle legacy array format
            const skillsObj = Array.isArray(currentSkills)
                ? currentSkills.reduce((acc, s) => ({ ...acc, [s]: 1 }), {})
                : currentSkills;
            return {
                ...prev,
                skills: { ...skillsObj, [skill]: rank }
            };
        });
    }, [setTrainer]);

    // Set skill rank (0 removes the skill, 1-2 sets rank)
    const setSkillRank = useCallback((skill, rank) => {
        setTrainer(prev => {
            const currentSkills = prev.skills || {};
            // Handle legacy array format
            const skillsObj = Array.isArray(currentSkills)
                ? currentSkills.reduce((acc, s) => ({ ...acc, [s]: 1 }), {})
                : currentSkills;

            if (rank === 0) {
                const { [skill]: removed, ...rest } = skillsObj;
                return { ...prev, skills: rest };
            }
            return {
                ...prev,
                skills: { ...skillsObj, [skill]: rank }
            };
        });
    }, [setTrainer]);

    // Remove skill from trainer
    const removeSkill = useCallback((skill) => {
        setTrainer(prev => {
            const currentSkills = prev.skills || {};
            // Handle legacy array format
            if (Array.isArray(currentSkills)) {
                return {
                    ...prev,
                    skills: currentSkills.filter(s => s !== skill)
                };
            }
            const { [skill]: removed, ...rest } = currentSkills;
            return { ...prev, skills: rest };
        });
    }, [setTrainer]);

    // Calculate max HP (PTA3: 20 base + sum of 1d4 rolls at Lv 3/7/11)
    const calculateMaxHP = useCallback(() => {
        return (trainer.maxHp ?? 20) + (trainer.hpRolls || []).reduce((s, v) => s + v, 0);
    }, [trainer.maxHp, trainer.hpRolls]);

    // Calculate stat modifier (PTA3: ⌊stat / 2⌋)
    const calculateModifier = useCallback((stat) => {
        const value = trainer.stats[stat] || BASE_STAT_VALUE;
        return Math.floor(value / 2);
    }, [trainer.stats]);

    return {
        // State
        trainers,
        setTrainers,
        activeTrainerId,
        setActiveTrainerId,
        trainer,
        setTrainer,

        // Trainer management
        addNewTrainer,
        deleteTrainer,
        duplicateTrainer,

        // Stats
        updateTrainerStat,
        calculateMaxHP,
        calculateModifier,

        // Leveling
        levelUpTrainer,
        levelDownTrainer,
        respecTrainer,

        // Classes, Features, Skills
        addClass,
        removeClass,
        addFeature,
        removeFeature,
        addSkill,
        setSkillRank,
        removeSkill
    };
};

export default useTrainer;
