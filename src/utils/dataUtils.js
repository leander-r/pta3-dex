// ============================================================
// DATA CALCULATION UTILITIES
// ============================================================

import { GAME_DATA } from '../data/configs.js';
import { COMBAT_STAGE_FLAT_PER_STAGE, STAB_BONUS } from '../data/constants.js';

/**
 * Calculate stat modifier (PTA3: ⌊stat / 2⌋)
 */
export const calcModifier = (stat) => Math.floor((stat || 0) / 2);

/**
 * Format number with commas
 */
export const formatNumber = (num) => (num || 0).toLocaleString();

/**
 * Apply nature to Pokémon stats (PTA3: ±1 on affected stat)
 */
export const applyNature = (baseStats, nature) => {
    const natureData = GAME_DATA.natures[nature];
    if (!natureData) return baseStats;

    let modifiedStats = { ...baseStats };
    if (natureData.buff) {
        modifiedStats[natureData.buff] = (baseStats[natureData.buff] || 0) + 1;
    }
    if (natureData.nerf) {
        modifiedStats[natureData.nerf] = Math.max(1, (baseStats[natureData.nerf] || 0) - 1);
    }
    return modifiedStats;
};

/**
 * Calculate Combat Stage modifier for a stat (PTA3: flat +2 per stage)
 * Range: -6 to +6 maps to -12 to +12 on the stat
 */
export const applyCombatStage = (baseStat, stages) => {
    if (stages === 0) return baseStat;
    return (baseStat || 0) + stages * COMBAT_STAGE_FLAT_PER_STAGE;
};

/**
 * Get combat stage flat change display
 */
export const getCombatStagePercent = (stages) => {
    if (stages === 0) return '+0';
    return (stages > 0 ? '+' : '') + (stages * COMBAT_STAGE_FLAT_PER_STAGE);
};

/**
 * Calculate Speed Skill modifier from combat stages
 * +1 per 2 positive stages, -1 per 3 negative stages (min 1)
 */
export const getSpeedSkillMod = (spdStages) => {
    if (spdStages >= 0) {
        return Math.floor(spdStages / 2);
    } else {
        return -Math.floor(Math.abs(spdStages) / 3);
    }
};

/**
 * Calculate STAB bonus (PTA3: fixed +4, no level scaling)
 */
export const calculateSTAB = (_level) => STAB_BONUS;

/**
 * Get actual Pokémon stats with nature modifier applied (PTA3: ±1 nature, no addedStats)
 */
export const getActualStats = (pokemon) => {
    if (!pokemon) return { hp: 1, atk: 1, def: 1, satk: 1, sdef: 1, spd: 1 };

    const base = pokemon.baseStats || { hp: 30, atk: 5, def: 5, satk: 5, sdef: 5, spd: 5 };

    // Apply nature modifications (±1, PTA3 rules)
    return applyNature(base, pokemon.nature);
};

/**
 * Calculate Pokémon max HP (PTA3: HP is a fixed Pokédex stat, nature-adjusted)
 */
export const calculatePokemonHP = (pokemon) => {
    if (!pokemon) return 0;
    const actualStats = getActualStats(pokemon);
    return actualStats.hp;
};

/**
 * Parse dice notation string (e.g., "2d6+5", "3d12+14", "1d20")
 */
export const parseDice = (diceStr) => {
    if (!diceStr) return { count: 0, sides: 0, bonus: 0, flat: 0 };
    const diceMatch = diceStr.match(/(\d+)d(\d+)(?:\+(\d+))?/i);
    if (diceMatch) {
        return {
            count: parseInt(diceMatch[1]) || 0,
            sides: parseInt(diceMatch[2]) || 0,
            bonus: parseInt(diceMatch[3]) || 0,
            flat: 0,
        };
    }
    // Flat damage (e.g. Dragon Rage "25" — fixed damage, no dice)
    const flatMatch = diceStr.match(/^(\d+)$/);
    if (flatMatch) {
        return { count: 0, sides: 0, bonus: 0, flat: parseInt(flatMatch[1]) || 0 };
    }
    return { count: 0, sides: 0, bonus: 0, flat: 0 };
};

/**
 * Parse a move description for an extended crit range (e.g. "Critical Hit on 18-20").
 * Returns the lowest roll that counts as a crit (default 20).
 */
export const parseCritThreshold = (description = '') => {
    const text = description || '';
    // PTA3 format: "if you got 18 or higher on Accuracy Check"
    const pta3 = text.match(/(\d+)\s+or\s+higher\s+on\s+Accuracy\s+Check/i);
    if (pta3) return parseInt(pta3[1]);
    // Legacy format: "Critical Hit on 18-20"
    const legacy = text.match(/Critical Hit on (\d+)[-–]20/i);
    return legacy ? parseInt(legacy[1]) : 20;
};

/**
 * Parse an item's effect string for an HP heal formula.
 * Handles dice notation ("2d6+3 HP", "2d6 + 3 HP") and fractions ("1/2 Max HP").
 * Returns { type: 'dice', formula } | { type: 'fraction', num, denom } | { type: 'none' }
 */
export const parseHealFormula = (effectStr = '') => {
    const diceMatch = effectStr.match(/(\d+d\d+(?:\s*[+]\s*\d+)?)\s*HP/i);
    if (diceMatch) return { type: 'dice', formula: diceMatch[1].replace(/\s+/g, '') };
    const fracMatch = effectStr.match(/(\d+)\/(\d+)\s*Max\s*HP/i);
    if (fracMatch) return { type: 'fraction', num: parseInt(fracMatch[1]), denom: parseInt(fracMatch[2]) };
    return { type: 'none' };
};
