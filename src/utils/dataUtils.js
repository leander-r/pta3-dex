// ============================================================
// DATA CALCULATION UTILITIES
// ============================================================

import { GAME_DATA } from '../data/configs.js';

/**
 * Calculate stat modifier (D&D style)
 */
export const calcModifier = (stat) => Math.floor(stat / 2) - 5;

/**
 * Format number with commas
 */
export const formatNumber = (num) => (num || 0).toLocaleString();

/**
 * Calculate Pokémon level from experience
 */
export const calculatePokemonLevel = (exp) => {
    let level = 1;
    for (let lvl in GAME_DATA.pokemonExpChart) {
        if (exp >= GAME_DATA.pokemonExpChart[lvl]) {
            level = parseInt(lvl);
        } else {
            break;
        }
    }
    return level;
};

/**
 * Calculate exp needed for next level
 */
export const getExpToNextLevel = (currentExp, currentLevel) => {
    const nextLevel = Math.min(currentLevel + 1, 100);
    const expNeeded = GAME_DATA.pokemonExpChart[nextLevel] || 0;
    return expNeeded - currentExp;
};

/**
 * Apply nature to Pokémon stats
 * HP modifications are +1/-1, all other stats are +2/-2
 */
export const applyNature = (baseStats, nature) => {
    const natureData = GAME_DATA.natures[nature];
    if (!natureData) return baseStats;
    
    let modifiedStats = { ...baseStats };
    if (natureData.buff) {
        // HP gets +1, other stats get +2
        const buffAmount = natureData.buff === 'hp' ? 1 : 2;
        modifiedStats[natureData.buff] = baseStats[natureData.buff] + buffAmount;
    }
    if (natureData.nerf) {
        // HP gets -1, other stats get -2
        const nerfAmount = natureData.nerf === 'hp' ? 1 : 2;
        modifiedStats[natureData.nerf] = Math.max(1, baseStats[natureData.nerf] - nerfAmount);
    }
    return modifiedStats;
};

/**
 * Calculate Combat Stage modifier for a stat
 * +25% per positive stage (rounded down), -10% per negative stage (rounded up)
 * At +6: 250% of original, at -6: 40% of original
 */
export const applyCombatStage = (baseStat, stages) => {
    if (stages === 0) return baseStat;
    
    if (stages > 0) {
        // +25% per positive stage, rounded down
        return Math.floor(baseStat * (1 + (stages * 0.25)));
    } else {
        // -10% per negative stage, rounded up
        // At -6, should be 40% of original (1 - 0.6 = 0.4)
        const reduction = Math.abs(stages) * 0.10;
        return Math.ceil(baseStat * (1 - reduction));
    }
};

/**
 * Get combat stage percentage display
 */
export const getCombatStagePercent = (stages) => {
    if (stages === 0) return '100%';
    if (stages > 0) {
        return `${100 + (stages * 25)}%`;
    } else {
        return `${100 - (Math.abs(stages) * 10)}%`;
    }
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
 * Calculate STAB bonus - OFFICIAL P:TA HANDBOOK
 * You get the bonus AT the listed level
 */
export const calculateSTAB = (level) => {
    if (level >= 100) return 20;
    if (level >= 95) return 19;
    if (level >= 90) return 18;
    if (level >= 85) return 17;
    if (level >= 80) return 16;
    if (level >= 75) return 15;
    if (level >= 70) return 14;
    if (level >= 65) return 13;
    if (level >= 60) return 12;
    if (level >= 55) return 11;
    if (level >= 50) return 10;
    if (level >= 45) return 9;
    if (level >= 40) return 8;
    if (level >= 35) return 7;
    if (level >= 30) return 6;
    if (level >= 25) return 5;
    if (level >= 20) return 4;
    if (level >= 15) return 3;
    if (level >= 10) return 2;
    if (level >= 5) return 1;
    return 0;
};

/**
 * Get actual stats including added stats and nature
 */
export const getActualStats = (pokemon) => {
    if (!pokemon) return { hp: 1, atk: 1, def: 1, satk: 1, sdef: 1, spd: 1 };
    
    const base = pokemon.baseStats || { hp: 10, atk: 10, def: 10, satk: 10, sdef: 10, spd: 10 };
    const added = pokemon.addedStats || { hp: 0, atk: 0, def: 0, satk: 0, sdef: 0, spd: 0 };
    
    const combinedStats = {
        hp: base.hp + added.hp,
        atk: base.atk + added.atk,
        def: base.def + added.def,
        satk: base.satk + added.satk,
        sdef: base.sdef + added.sdef,
        spd: base.spd + added.spd
    };
    
    // Apply nature modifications
    return applyNature(combinedStats, pokemon.nature);
};

/**
 * Calculate Pokemon HP: Level + (HP stat × 3)
 */
export const calculatePokemonHP = (pokemon) => {
    if (!pokemon) return 0;
    const actualStats = getActualStats(pokemon);
    return pokemon.level + (actualStats.hp * 3);
};
