// ============================================================
// useDiceRoller Hook
// ============================================================
// Dice roller state and functions for PTA combat

import { useState, useCallback } from 'react';
import { calculateSTAB, getActualStats, calculatePokemonHP } from '../utils/dataUtils.js';
import { GAME_DATA } from '../data/configs.js';

/**
 * Parse dice notation (e.g., "2d6+5", "3d12+14")
 * @param {string} diceStr - Dice notation string
 * @returns {Object} - { count, sides, bonus }
 */
const parseDice = (diceStr) => {
    if (!diceStr) return { count: 0, sides: 0, bonus: 0 };

    const match = diceStr.match(/(\d+)d(\d+)(?:\+(\d+))?/i);
    if (!match) return { count: 0, sides: 0, bonus: 0 };

    return {
        count: parseInt(match[1]) || 0,
        sides: parseInt(match[2]) || 0,
        bonus: parseInt(match[3]) || 0
    };
};

/**
 * Roll dice
 * @param {number} count - Number of dice
 * @param {number} sides - Sides per die
 * @returns {number[]} - Array of individual rolls
 */
const rollDice = (count, sides) => {
    const rolls = [];
    for (let i = 0; i < count; i++) {
        rolls.push(Math.floor(Math.random() * sides) + 1);
    }
    return rolls;
};

/**
 * Custom hook for dice rolling functionality
 * @param {Function} sendToDiscord - Function to send results to Discord
 * @returns {Object} - Dice roller state and functions
 */
export const useDiceRoller = (sendToDiscord = null) => {
    const [state, setState] = useState({
        mode: 'pokemon',           // 'pokemon', 'trainer', 'custom'
        selectedPokemon: null,
        selectedMove: null,
        selectedSkill: '',
        customDice: '',
        combatStages: { atk: 0, satk: 0, def: 0, sdef: 0, spd: 0, acc: 0, eva: 0 },
        rollHistory: [],
        stabApplied: false
    });

    // Update state helper
    const updateState = useCallback((updates) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    // Set combat stage
    const setCombatStage = useCallback((stat, value) => {
        setState(prev => ({
            ...prev,
            combatStages: { ...prev.combatStages, [stat]: value }
        }));
    }, []);

    // Reset combat stages
    const resetCombatStages = useCallback(() => {
        setState(prev => ({
            ...prev,
            combatStages: { atk: 0, satk: 0, def: 0, sdef: 0, spd: 0, acc: 0, eva: 0 }
        }));
    }, []);

    // Add to roll history
    const addToHistory = useCallback((roll) => {
        setState(prev => ({
            ...prev,
            rollHistory: [roll, ...prev.rollHistory].slice(0, 50) // Keep last 50 rolls
        }));
    }, []);

    // Clear roll history
    const clearHistory = useCallback(() => {
        setState(prev => ({ ...prev, rollHistory: [] }));
    }, []);

    /**
     * Roll a Pokemon move
     * @param {Object} pokemon - Pokemon object
     * @param {Object} move - Move object
     * @param {boolean} applyStab - Whether to apply STAB
     * @returns {Object} - Roll result
     */
    const rollPokemonMove = useCallback((pokemon, move, applyStab = true) => {
        if (!pokemon || !move) return null;

        const actualStats = getActualStats(pokemon);
        const isPhysical = move.category === 'Physical';
        const statKey = isPhysical ? 'atk' : 'satk';
        const baseStat = actualStats[statKey] || 0;

        // Apply combat stages
        const stages = state.combatStages[statKey] || 0;
        let statMod = baseStat;
        if (stages > 0) {
            statMod = Math.floor(baseStat * (1 + stages * 0.25));
        } else if (stages < 0) {
            statMod = Math.ceil(baseStat * (1 - Math.abs(stages) * 0.10));
        }

        // Roll accuracy (d20)
        const accRoll = Math.floor(Math.random() * 20) + 1;
        const isCrit = accRoll === 20;

        // Parse damage dice
        const diceData = parseDice(move.damage);
        if (diceData.count === 0) {
            // Status move
            const result = {
                type: 'pokemon',
                pokemon: pokemon.name || pokemon.species,
                move: move.name,
                moveType: move.type,
                category: move.category,
                accRoll,
                isCrit,
                isStatus: true,
                total: 0,
                timestamp: Date.now()
            };

            addToHistory(result);
            if (sendToDiscord) sendToDiscord(result, pokemon.name);
            return result;
        }

        // Roll damage dice (double on crit)
        const diceCount = isCrit ? diceData.count * 2 : diceData.count;
        const rolls = rollDice(diceCount, diceData.sides);
        const diceTotal = rolls.reduce((sum, r) => sum + r, 0);

        // Calculate STAB
        let stabBonus = 0;
        if (applyStab && pokemon.types && pokemon.types.includes(move.type)) {
            stabBonus = calculateSTAB(pokemon.level || 1);
        }

        // Total damage
        const total = diceTotal + diceData.bonus + statMod + stabBonus;

        const result = {
            type: 'pokemon',
            pokemon: pokemon.name || pokemon.species,
            move: move.name,
            moveType: move.type,
            category: move.category,
            dice: `${diceCount}d${diceData.sides}+${diceData.bonus}`,
            rolls,
            diceTotal,
            statBonus: statMod,
            stabBonus,
            accRoll,
            isCrit,
            total,
            timestamp: Date.now()
        };

        addToHistory(result);
        if (sendToDiscord) sendToDiscord(result, pokemon.name);
        return result;
    }, [state.combatStages, addToHistory, sendToDiscord]);

    /**
     * Roll accuracy only
     * @param {Object} pokemon - Pokemon object
     * @returns {Object} - Roll result
     */
    const rollAccuracy = useCallback((pokemon) => {
        const accRoll = Math.floor(Math.random() * 20) + 1;
        const isCrit = accRoll === 20;

        const result = {
            type: 'accuracy',
            pokemon: pokemon?.name || pokemon?.species || 'Pokemon',
            total: accRoll,
            isCrit,
            timestamp: Date.now()
        };

        addToHistory(result);
        if (sendToDiscord) sendToDiscord(result, pokemon?.name);
        return result;
    }, [addToHistory, sendToDiscord]);

    /**
     * Roll a trainer skill check
     * @param {Object} trainer - Trainer object
     * @param {string} skillName - Skill name
     * @returns {Object} - Roll result
     */
    const rollTrainerSkill = useCallback((trainer, skillName) => {
        if (!trainer || !skillName) return null;

        const skillData = GAME_DATA.skills[skillName];
        if (!skillData) return null;

        const statKey = skillData.stat?.toLowerCase();
        const baseStat = trainer.stats?.[statKey] || 6;

        // Check if trainer has this skill
        const hasSkill = trainer.skills?.includes(skillName);
        const skillBonus = hasSkill ? 2 : 0;

        // Roll 2d6
        const rolls = rollDice(2, 6);
        const rollTotal = rolls.reduce((sum, r) => sum + r, 0);

        // Calculate modifier (stat - 10)
        const modifier = baseStat - 10;
        const total = rollTotal + modifier + skillBonus;

        const result = {
            type: 'trainer_skill',
            skill: skillName,
            skillStat: skillData.stat,
            dice: '2d6',
            rolls,
            baseStat,
            modifier,
            hasSkill,
            bonus: skillBonus,
            total,
            timestamp: Date.now()
        };

        addToHistory(result);
        if (sendToDiscord) sendToDiscord(result, trainer.name);
        return result;
    }, [addToHistory, sendToDiscord]);

    /**
     * Roll a d20 for trainer
     * @param {Object} trainer - Trainer object
     * @param {string} label - Roll label
     * @returns {Object} - Roll result
     */
    const rollTrainerD20 = useCallback((trainer, label = 'D20 Roll') => {
        const roll = Math.floor(Math.random() * 20) + 1;

        const result = {
            type: 'trainer_d20',
            skill: label,
            total: roll,
            timestamp: Date.now()
        };

        addToHistory(result);
        if (sendToDiscord) sendToDiscord(result, trainer?.name);
        return result;
    }, [addToHistory, sendToDiscord]);

    /**
     * Roll Pokemon skill check
     * @param {Object} pokemon - Pokemon object
     * @param {string} skillName - Skill name
     * @param {number} skillValue - Skill value/dice
     * @returns {Object} - Roll result
     */
    const rollPokemonSkill = useCallback((pokemon, skillName, skillValue) => {
        if (!pokemon || !skillName) return null;

        const dice = `${skillValue}d6`;
        const rolls = rollDice(skillValue, 6);
        const total = rolls.reduce((sum, r) => sum + r, 0);

        const result = {
            type: 'pokemonSkill',
            pokemon: pokemon.name || pokemon.species,
            skill: skillName,
            dice,
            rolls,
            total,
            timestamp: Date.now()
        };

        addToHistory(result);
        if (sendToDiscord) sendToDiscord(result, pokemon.name);
        return result;
    }, [addToHistory, sendToDiscord]);

    /**
     * Roll custom dice
     * @param {string} diceNotation - Dice notation (e.g., "2d6+5")
     * @returns {Object} - Roll result
     */
    const rollCustom = useCallback((diceNotation) => {
        const diceData = parseDice(diceNotation);
        if (diceData.count === 0 || diceData.sides === 0) return null;

        const rolls = rollDice(diceData.count, diceData.sides);
        const rollTotal = rolls.reduce((sum, r) => sum + r, 0);
        const total = rollTotal + diceData.bonus;

        const result = {
            type: 'custom',
            dice: diceNotation,
            rolls,
            rollTotal,
            bonus: diceData.bonus,
            total,
            timestamp: Date.now()
        };

        addToHistory(result);
        if (sendToDiscord) sendToDiscord(result);
        return result;
    }, [addToHistory, sendToDiscord]);

    return {
        state,
        updateState,
        setCombatStage,
        resetCombatStages,
        clearHistory,
        rollPokemonMove,
        rollAccuracy,
        rollTrainerSkill,
        rollTrainerD20,
        rollPokemonSkill,
        rollCustom
    };
};

export default useDiceRoller;
