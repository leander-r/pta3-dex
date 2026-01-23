// ============================================================
// TYPE EFFECTIVENESS CHART
// ============================================================
// Defensive type chart - shows what a type is weak/resistant/immune to

export const TYPE_CHART = {
    'Normal': { weak: ['Fighting'], resist: [], immune: ['Ghost'] },
    'Fire': { weak: ['Water', 'Ground', 'Rock'], resist: ['Fire', 'Grass', 'Ice', 'Bug', 'Steel', 'Fairy'], immune: [] },
    'Water': { weak: ['Electric', 'Grass'], resist: ['Fire', 'Water', 'Ice', 'Steel'], immune: [] },
    'Electric': { weak: ['Ground'], resist: ['Electric', 'Flying', 'Steel'], immune: [] },
    'Grass': { weak: ['Fire', 'Ice', 'Poison', 'Flying', 'Bug'], resist: ['Water', 'Electric', 'Grass', 'Ground'], immune: [] },
    'Ice': { weak: ['Fire', 'Fighting', 'Rock', 'Steel'], resist: ['Ice'], immune: [] },
    'Fighting': { weak: ['Flying', 'Psychic', 'Fairy'], resist: ['Bug', 'Rock', 'Dark'], immune: [] },
    'Poison': { weak: ['Ground', 'Psychic'], resist: ['Grass', 'Fighting', 'Poison', 'Bug', 'Fairy'], immune: [] },
    'Ground': { weak: ['Water', 'Grass', 'Ice'], resist: ['Poison', 'Rock'], immune: ['Electric'] },
    'Flying': { weak: ['Electric', 'Ice', 'Rock'], resist: ['Grass', 'Fighting', 'Bug'], immune: ['Ground'] },
    'Psychic': { weak: ['Bug', 'Ghost', 'Dark'], resist: ['Fighting', 'Psychic'], immune: [] },
    'Bug': { weak: ['Fire', 'Flying', 'Rock'], resist: ['Grass', 'Fighting', 'Ground'], immune: [] },
    'Rock': { weak: ['Water', 'Grass', 'Fighting', 'Ground', 'Steel'], resist: ['Normal', 'Fire', 'Poison', 'Flying'], immune: [] },
    'Ghost': { weak: ['Ghost', 'Dark'], resist: ['Poison', 'Bug'], immune: ['Normal', 'Fighting'] },
    'Dragon': { weak: ['Ice', 'Dragon', 'Fairy'], resist: ['Fire', 'Water', 'Electric', 'Grass'], immune: [] },
    'Dark': { weak: ['Fighting', 'Bug', 'Fairy'], resist: ['Ghost', 'Dark'], immune: ['Psychic'] },
    'Steel': { weak: ['Fire', 'Fighting', 'Ground'], resist: ['Normal', 'Grass', 'Ice', 'Flying', 'Psychic', 'Bug', 'Rock', 'Dragon', 'Steel', 'Fairy'], immune: ['Poison'] },
    'Fairy': { weak: ['Poison', 'Steel'], resist: ['Fighting', 'Bug', 'Dark'], immune: ['Dragon'] }
};

/**
 * All Pokemon types
 */
export const POKEMON_TYPES = [
    'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
    'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
    'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
];

/**
 * Get type effectiveness for a defensive type
 * @param {string} type - The defensive type
 * @returns {Object} - { weak: [], resist: [], immune: [] }
 */
export const getTypeEffectiveness = (type) => {
    return TYPE_CHART[type] || { weak: [], resist: [], immune: [] };
};

/**
 * Get combined type effectiveness for dual-types
 * @param {string[]} types - Array of types (1 or 2)
 * @returns {Object} - { superWeak: [], weak: [], resist: [], superResist: [], immune: [] }
 */
export const getCombinedTypeEffectiveness = (types) => {
    if (!types || types.length === 0) {
        return { superWeak: [], weak: [], resist: [], superResist: [], immune: [] };
    }

    // Calculate effectiveness multipliers for all types
    const multipliers = {};
    POKEMON_TYPES.forEach(attackType => {
        multipliers[attackType] = 1;
    });

    types.forEach(defType => {
        const effectiveness = TYPE_CHART[defType];
        if (!effectiveness) return;

        effectiveness.weak.forEach(t => {
            multipliers[t] = (multipliers[t] || 1) * 2;
        });
        effectiveness.resist.forEach(t => {
            multipliers[t] = (multipliers[t] || 1) * 0.5;
        });
        effectiveness.immune.forEach(t => {
            multipliers[t] = 0;
        });
    });

    // Categorize the results
    const result = {
        superWeak: [],    // 4x
        weak: [],         // 2x
        neutral: [],      // 1x
        resist: [],       // 0.5x
        superResist: [],  // 0.25x
        immune: []        // 0x
    };

    Object.entries(multipliers).forEach(([type, mult]) => {
        if (mult === 0) result.immune.push(type);
        else if (mult >= 4) result.superWeak.push(type);
        else if (mult >= 2) result.weak.push(type);
        else if (mult <= 0.25) result.superResist.push(type);
        else if (mult <= 0.5) result.resist.push(type);
        else result.neutral.push(type);
    });

    return result;
};
