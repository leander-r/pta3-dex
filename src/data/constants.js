// ============================================================
// SHARED CONSTANTS
// ============================================================

/**
 * Evolution stones available in PTA
 */
export const EVOLUTION_STONES = [
    'Fire Stone', 'Water Stone', 'Thunder Stone', 'Leaf Stone', 'Moon Stone',
    'Sun Stone', 'Shiny Stone', 'Dusk Stone', 'Dawn Stone', 'Ice Stone'
];

/**
 * Default trainer template for new trainers
 */
export const DEFAULT_TRAINER = {
    id: Date.now(),
    name: '',
    gender: '',
    age: '',
    avatar: '',
    level: 0,
    experience: 0,
    classes: [],
    stats: { hp: 6, atk: 6, def: 6, satk: 6, sdef: 6, spd: 6 },
    statPoints: 30,        // Character creation points (cap at 14 per stat)
    levelStatPoints: 0,    // Level-up stat points (no cap)
    featPoints: 0,         // Feature points
    skills: {},            // Skills with ranks: { 'Browbeat': 1, 'Jump': 2 }
    features: [],
    notes: '',
    badges: [],
    money: 0,
    party: [],             // Active party - max 6 Pokemon
    reserve: [],           // Reserve/PC storage - unlimited
    archived: false        // Soft-delete: archived trainers are hidden but recoverable
};

/**
 * Default Pokemon template for new Pokemon
 */
export const DEFAULT_POKEMON = {
    id: Date.now(),
    name: 'New Pokémon',
    species: '',
    gender: '',
    avatar: '',
    level: 1,
    exp: 0,
    highestLevelReached: 1,
    types: [],
    nature: 'Hardy',
    ability: '',
    baseStats: {
        hp: 10,
        atk: 10,
        def: 10,
        satk: 10,
        sdef: 10,
        spd: 10
    },
    addedStats: {
        hp: 0,
        atk: 0,
        def: 0,
        satk: 0,
        sdef: 0,
        spd: 0
    },
    statAllocationHistory: [],
    moves: [],
    skills: [],
    notes: '',
    loyalty: 2,
    statPointsAvailable: 0
};

/**
 * Application tab identifiers
 */
export const TABS = {
    TRAINER: 'trainer',
    POKEMON: 'pokemon',
    INVENTORY: 'inventory',
    BATTLE: 'battle',
    REFERENCE: 'reference',
    NOTES: 'notes'
};

/**
 * Reference sub-tab identifiers
 */
export const REFERENCE_TABS = {
    TYPES: 'types',
    MOVES: 'moves',
    ABILITIES: 'abilities',
    FEATURES: 'features'
};

/**
 * Pokemon view modes
 */
export const POKEMON_VIEW = {
    PARTY: 'party',
    RESERVE: 'reserve'
};

/**
 * Move sources
 */
export const MOVE_SOURCES = {
    NATURAL: 'natural',
    TM: 'tm',
    TUTOR: 'tutor',
    EGG: 'egg',
    CUSTOM: 'custom'
};

/**
 * Maximum party size
 */
export const MAX_PARTY_SIZE = 6;

/**
 * Maximum trainer level
 */
export const MAX_TRAINER_LEVEL = 50;

/**
 * Maximum Pokemon level
 */
export const MAX_POKEMON_LEVEL = 100;

/**
 * Base stat value for new trainers
 */
export const BASE_STAT_VALUE = 6;

/**
 * Character creation stat points
 */
export const CREATION_STAT_POINTS = 30;

/**
 * Character creation stat cap
 */
export const CREATION_STAT_CAP = 14;

/**
 * Network fetch timeout (milliseconds)
 */
export const FETCH_TIMEOUT_MS = 15000;

/**
 * Maximum full trainer data import file size (5 MB)
 */
export const MAX_TRAINER_IMPORT_BYTES = 5 * 1024 * 1024;

/**
 * Maximum single-Pokemon import file size (100 KB)
 */
export const MAX_POKEMON_IMPORT_BYTES = 100 * 1024;
