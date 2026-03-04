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
 * Default trainer template for new trainers (PTA3 rules)
 */
export const DEFAULT_TRAINER = {
    id: Date.now(),
    name: '',
    gender: '',
    age: '',
    avatar: '',
    level: 0,
    honors: 0,             // Replaces experience; honors = gym badges, ribbons, etc.
    classes: [],
    stats: { atk: 3, def: 3, satk: 3, sdef: 3, spd: 3 },  // 5 stats, 1-10 scale, mid-range default
    maxHp: 20,             // Fixed base HP; increases via rolls at milestone levels
    hpRolls: [],           // 1d4 results added at levels 3, 7, 11
    statPoints: 25,        // Character creation points (point-buy budget)
    levelStatPoints: 0,    // Level-up stat points (no cap)
    classLevels: {},       // Per-class level tracker: { 'Ace Trainer': 3, 'Stat Ace': 1 }
    skills: {},            // Skills with talents: { 'Athletics': 1, 'Stealth': 2 }
    features: [],
    notes: '',
    badges: [],
    money: 0,
    party: [],             // Active party - max 6 Pokemon
    reserve: [],           // Reserve/PC storage - unlimited
    archived: false        // Soft-delete: archived trainers are hidden but recoverable
};

/**
 * Default Pokemon template for new Pokemon (PTA3 rules)
 * Stats are now fixed from Pokédex entry; no addedStats or stat allocation.
 */
export const DEFAULT_POKEMON = {
    id: Date.now(),
    name: 'New Pokémon',
    species: '',
    gender: '',
    avatar: '',
    types: [],
    nature: 'Hardy',
    ability: '',
    baseStats: {
        hp: 30,
        atk: 5,
        def: 5,
        satk: 5,
        sdef: 5,
        spd: 5
    },
    moves: [],
    skills: [],   // Array of capability/skill strings e.g. ["Sprouter", "Threaded"]
    notes: '',
    loyalty: 2,
    heldItem: ''
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
 * Maximum trainer level (PTA3: honor-based leveling, max 15)
 */
export const MAX_TRAINER_LEVEL = 15;

/**
 * Maximum Pokemon level
 */
export const MAX_POKEMON_LEVEL = 100;

/**
 * Base stat value for new trainers (PTA3: 1-10 scale)
 */
export const BASE_STAT_VALUE = 1;

/**
 * Character creation stat points (PTA3 point-buy budget)
 */
export const CREATION_STAT_POINTS = 25;

/**
 * Character creation stat cap (PTA3: max 6 at creation)
 */
export const CREATION_STAT_CAP = 6;

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
 * @deprecated PTA3 does not distinguish natural vs taught moves.
 * Use MAX_TOTAL_MOVES instead.
 */
export const MAX_NATURAL_MOVES = 6;

/**
 * @deprecated PTA3 does not distinguish natural vs taught moves.
 * Use MAX_TOTAL_MOVES instead.
 */
export const MAX_TAUGHT_MOVES = 6;

/**
 * Maximum total moves a Pokemon can have (PTA3: 6 total, no natural/taught distinction)
 */
export const MAX_TOTAL_MOVES = 6;

/**
 * Maximum number of roll entries kept in battle roll history
 */
export const MAX_ROLL_HISTORY = 50;

/**
 * @deprecated PTA3 uses flat combat stages (+2 per stage), not multipliers.
 * Retained only for save-data migration detection.
 */
export const COMBAT_STAGE_POSITIVE_MULTIPLIER = 0.25;

/**
 * @deprecated PTA3 uses flat combat stages (+2 per stage), not multipliers.
 * Retained only for save-data migration detection.
 */
export const COMBAT_STAGE_NEGATIVE_MULTIPLIER = 0.10;

/**
 * Flat stat added per combat stage (PTA3: +2 per stage, applies to both + and -)
 */
export const COMBAT_STAGE_FLAT_PER_STAGE = 2;

/**
 * STAB bonus (PTA3: fixed +4, no level scaling)
 */
export const STAB_BONUS = 4;

/**
 * Milliseconds in one day — used for backup-reminder age calculations
 */
export const MS_PER_DAY = 86_400_000;

/**
 * Number of days between exports before the backup reminder is shown
 */
export const BACKUP_REMINDER_DAYS = 7;

/**
 * Minimum trainer level required to pick a 2nd class (PTA3)
 */
export const CLASS_2_MIN_LEVEL = 3;

/**
 * Minimum trainer level required to pick a 3rd class (PTA3)
 */
export const CLASS_3_MIN_LEVEL = 7;

/**
 * Minimum trainer level required to pick a 4th class (PTA3)
 */
export const CLASS_4_MIN_LEVEL = 11;

/**
 * Honor (gym badge/ribbon) thresholds for each trainer level (PTA3).
 * Key = level, value = honors required to reach that level.
 */
export const HONOR_THRESHOLDS = {
    1: 0, 2: 1, 3: 2, 4: 3, 5: 5, 6: 7, 7: 9, 8: 12, 9: 15, 10: 18,
    11: 22, 12: 26, 13: 30, 14: 35, 15: 40
};

/**
 * Trainer levels at which an HP milestone roll (1d4) is granted (PTA3)
 */
export const HP_MILESTONE_LEVELS = [3, 7, 11];

/**
 * Point-buy costs for each stat value during character creation (PTA3).
 * Stat 1 costs 1 pt, stat 2 costs 2 pts (total), etc.
 * These are CUMULATIVE costs from 1 to each level.
 */
export const POINT_BUY_COSTS = { 1: 1, 2: 2, 3: 3, 4: 6, 5: 8, 6: 11 };

/**
 * Auto-save debounce delay (ms) — how long to wait after a data change before saving
 */
export const AUTOSAVE_DEBOUNCE_MS = 1000;

/**
 * Auto-save interval (ms) — periodic save regardless of debounce
 */
export const AUTOSAVE_INTERVAL_MS = 2 * 60 * 1000;
