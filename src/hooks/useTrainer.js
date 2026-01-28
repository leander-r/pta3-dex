// ============================================================
// useTrainer Hook
// ============================================================
// Trainer state and management functions

import { useState, useCallback, useMemo } from 'react';
import { GAME_DATA } from '../data/configs.js';
import { DEFAULT_TRAINER, MAX_TRAINER_LEVEL, BASE_STAT_VALUE, CREATION_STAT_POINTS, CREATION_STAT_CAP } from '../data/constants.js';

/**
 * Create a new trainer with default values
 * @param {string} name - Trainer name
 * @returns {Object} - New trainer object
 */
const createNewTrainer = (name = 'New Trainer') => ({
    ...DEFAULT_TRAINER,
    id: Date.now(),
    name,
    stats: { hp: 6, atk: 6, def: 6, satk: 6, sdef: 6, spd: 6 },
    statPoints: CREATION_STAT_POINTS,
    levelStatPoints: 0,
    featPoints: 0,
    party: [],
    reserve: []
});

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

    // Update trainer stat
    const updateTrainerStat = useCallback((stat, value) => {
        const newValue = parseInt(value) || BASE_STAT_VALUE;
        const oldValue = trainer.stats[stat];
        const difference = newValue - oldValue;

        // Minimum stat is base value
        if (newValue < BASE_STAT_VALUE) return false;

        const totalAvailable = trainer.statPoints + (trainer.levelStatPoints || 0);
        if (totalAvailable - difference < 0) return false;

        if (difference > 0) {
            // Spending points
            if (newValue > CREATION_STAT_CAP && trainer.statPoints > 0) {
                const pointsToReach14 = Math.max(0, CREATION_STAT_CAP - oldValue);
                const creationPointsToUse = Math.min(trainer.statPoints, pointsToReach14);
                const levelPointsToUse = difference - creationPointsToUse;

                if (levelPointsToUse > (trainer.levelStatPoints || 0)) return false;

                setTrainer(prev => ({
                    ...prev,
                    stats: { ...prev.stats, [stat]: newValue },
                    statPoints: prev.statPoints - creationPointsToUse,
                    levelStatPoints: (prev.levelStatPoints || 0) - levelPointsToUse
                }));
            } else if (newValue <= CREATION_STAT_CAP && trainer.statPoints >= difference) {
                setTrainer(prev => ({
                    ...prev,
                    stats: { ...prev.stats, [stat]: newValue },
                    statPoints: prev.statPoints - difference
                }));
            } else if (newValue <= CREATION_STAT_CAP && trainer.statPoints < difference) {
                const creationPointsToUse = trainer.statPoints;
                const levelPointsToUse = difference - creationPointsToUse;

                if (levelPointsToUse > (trainer.levelStatPoints || 0)) return false;

                setTrainer(prev => ({
                    ...prev,
                    stats: { ...prev.stats, [stat]: newValue },
                    statPoints: 0,
                    levelStatPoints: (prev.levelStatPoints || 0) - levelPointsToUse
                }));
            } else {
                if (difference > (trainer.levelStatPoints || 0)) return false;

                setTrainer(prev => ({
                    ...prev,
                    stats: { ...prev.stats, [stat]: newValue },
                    levelStatPoints: (prev.levelStatPoints || 0) - difference
                }));
            }
        } else {
            // Refunding points
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

        return true;
    }, [trainer, setTrainer]);

    // Level up trainer
    const levelUpTrainer = useCallback(() => {
        const newLevel = trainer.level + 1;
        if (newLevel > MAX_TRAINER_LEVEL) {
            return { success: false, message: `Maximum trainer level is ${MAX_TRAINER_LEVEL}!` };
        }

        // Validation for level 0 -> 1
        if (trainer.level === 0) {
            const issues = [];
            if ((trainer.statPoints || 0) > 0) {
                issues.push(`Spend all ${CREATION_STAT_POINTS} Creation stat points (${trainer.statPoints} remaining)`);
            }
            if ((trainer.classes || []).length === 0) {
                issues.push('Pick your first Trainer Class');
            }

            if (issues.length > 0) {
                return { success: false, message: `Complete character creation first:\n${issues.join('\n')}` };
            }
        }

        const levelData = GAME_DATA.trainerLevelProgression[newLevel] || { feats: 0, stats: 0 };

        setTrainer(prev => ({
            ...prev,
            level: newLevel,
            levelStatPoints: (prev.levelStatPoints || 0) + levelData.stats,
            featPoints: (prev.featPoints || 0) + levelData.feats
        }));

        return {
            success: true,
            level: newLevel,
            statPoints: levelData.stats,
            featPoints: levelData.feats,
            note: levelData.note
        };
    }, [trainer, setTrainer]);

    // Level down trainer
    const levelDownTrainer = useCallback(() => {
        if (trainer.level <= 1) {
            return { success: false, message: 'Cannot go below level 1!' };
        }

        const currentLevel = trainer.level;
        const newLevel = currentLevel - 1;
        const levelData = GAME_DATA.trainerLevelProgression[currentLevel] || { feats: 0, stats: 0 };

        // Calculate if we can level down
        let totalLevelStatsAtNewLevel = 0;
        for (let i = 1; i <= newLevel; i++) {
            totalLevelStatsAtNewLevel += (GAME_DATA.trainerLevelProgression[i]?.stats || 0);
        }

        const totalStatsSpent = Object.values(trainer.stats).reduce((sum, val) => sum + val, 0) - 36;
        const creationPointsSpent = CREATION_STAT_POINTS - trainer.statPoints;
        const levelPointsSpent = Math.max(0, totalStatsSpent - creationPointsSpent);

        if (levelPointsSpent > totalLevelStatsAtNewLevel) {
            return {
                success: false,
                message: `Cannot level down! Reduce stats by ${levelPointsSpent - totalLevelStatsAtNewLevel} point(s) first.`
            };
        }

        const newLevelStatPoints = totalLevelStatsAtNewLevel - levelPointsSpent;

        // Calculate feat points
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
            return {
                success: false,
                message: `Cannot level down! Remove ${totalFeatPointsSpent - totalFeatsAtNewLevel} feature(s) or class(es) first.`
            };
        }

        const newFeatPoints = totalFeatsAtNewLevel - totalFeatPointsSpent;

        setTrainer(prev => ({
            ...prev,
            level: newLevel,
            levelStatPoints: newLevelStatPoints,
            featPoints: newFeatPoints
        }));

        return { success: true, level: newLevel };
    }, [trainer, setTrainer]);

    // Respec trainer (reset to level 0)
    const respecTrainer = useCallback(() => {
        setTrainer(prev => ({
            ...prev,
            level: 0,
            stats: { hp: 6, atk: 6, def: 6, satk: 6, sdef: 6, spd: 6 },
            statPoints: CREATION_STAT_POINTS,
            levelStatPoints: 0,
            featPoints: 0,
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

    // Calculate max HP
    const calculateMaxHP = useCallback(() => {
        return (trainer.stats.hp * 4) + (trainer.level * 4);
    }, [trainer.stats.hp, trainer.level]);

    // Calculate stat modifier
    const calculateModifier = useCallback((stat) => {
        const value = trainer.stats[stat] || BASE_STAT_VALUE;
        if (value === 10) return 0;
        if (value < 10) return -(10 - value);
        return Math.floor((value - 10) / 2);
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
