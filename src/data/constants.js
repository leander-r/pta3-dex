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
    heldItem: '',
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

/**
 * Maximum number of natural (level-up) moves a Pokemon can have at once
 */
export const MAX_NATURAL_MOVES = 4;

/**
 * Maximum number of taught (TM/tutor/egg/custom) moves a Pokemon can have at once
 */
export const MAX_TAUGHT_MOVES = 4;

/**
 * Maximum total moves a Pokemon can have (natural + taught combined)
 */
export const MAX_TOTAL_MOVES = MAX_NATURAL_MOVES + MAX_TAUGHT_MOVES;

/**
 * Maximum number of roll entries kept in battle roll history
 */
export const MAX_ROLL_HISTORY = 50;

/**
 * Combat stage multiplier applied per positive stage (e.g. +1 stage → stat × 1.25)
 */
export const COMBAT_STAGE_POSITIVE_MULTIPLIER = 0.25;

/**
 * Combat stage multiplier applied per negative stage (e.g. -1 stage → stat × 0.90)
 */
export const COMBAT_STAGE_NEGATIVE_MULTIPLIER = 0.10;

/**
 * Trainer stat value at which the modifier is exactly 0
 */
export const TRAINER_STAT_NEUTRAL = 10;

/**
 * Multiplier used in the trainer HP formula: maxHP = (hp_stat × n) + (level × n)
 */
export const TRAINER_HP_MULTIPLIER = 4;

/**
 * Multiplier used in the Pokemon HP formula: maxHP = level + (hp_stat × n)
 */
export const POKEMON_HP_MULTIPLIER = 3;

/**
 * Milliseconds in one day — used for backup-reminder age calculations
 */
export const MS_PER_DAY = 86_400_000;

/**
 * Number of days between exports before the backup reminder is shown
 */
export const BACKUP_REMINDER_DAYS = 7;

/**
 * Minimum trainer level required to pick a 2nd class
 */
export const CLASS_2_MIN_LEVEL = 5;

/**
 * Minimum trainer level required to pick a 3rd class
 */
export const CLASS_3_MIN_LEVEL = 12;

/**
 * Minimum trainer level required to pick a 4th class
 */
export const CLASS_4_MIN_LEVEL = 24;

/**
 * Auto-save debounce delay (ms) — how long to wait after a data change before saving
 */
export const AUTOSAVE_DEBOUNCE_MS = 1000;

/**
 * Auto-save interval (ms) — periodic save regardless of debounce
 */
export const AUTOSAVE_INTERVAL_MS = 2 * 60 * 1000;
