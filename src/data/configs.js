// ============================================================
// DATA CONFIGURATION - GitHub-hosted JSON files
// ============================================================
// [lndr_rsr:0x6c65616e6465725f727372] Application Core
export const _0x72 = atob('bGVhbmRlcl9yc3I='); // ownership marker

export const DATA_CONFIG = {
    // GitHub raw URLs for data files
    pokedexUrl: 'https://raw.githubusercontent.com/leander-r/pta-dex/main/pokedex.min.json',
    gameDataUrl: 'https://raw.githubusercontent.com/leander-r/pta-dex/main/pta-game-data.min.json',
    
    // IndexedDB configuration
    dbName: 'PTAData',
    dbVersion: 2,
    
    // Cache duration (7 days in milliseconds)
    cacheDuration: 7 * 24 * 60 * 60 * 1000
};

// Keep POKEDEX_CONFIG for backward compatibility
export const POKEDEX_CONFIG = {
    remoteUrl: DATA_CONFIG.pokedexUrl,
    fallbackEnabled: true,
    dbName: 'PTAPokedex',
    dbVersion: 1,
    storeName: 'pokedex',
    cacheDuration: DATA_CONFIG.cacheDuration
};

// Fallback mini Pokédex (Gen 1 starters + common Pokemon)
export const FALLBACK_POKEDEX = [
    { id: 1, species: "Bulbasaur", types: ["Grass", "Poison"], baseStats: { hp: 5, atk: 5, def: 5, satk: 7, sdef: 7, spd: 5 }, abilities: { basic: ["Overgrow"], adv: ["Chlorophyll"], high: [] }, skills: { overland: 4, swim: 2, jump: 2, power: 2 } },
    { id: 4, species: "Charmander", types: ["Fire"], baseStats: { hp: 4, atk: 5, def: 4, satk: 6, sdef: 5, spd: 7 }, abilities: { basic: ["Blaze"], adv: ["Solar Power"], high: [] }, skills: { overland: 4, swim: 2, jump: 2, power: 2 } },
    { id: 7, species: "Squirtle", types: ["Water"], baseStats: { hp: 5, atk: 5, def: 7, satk: 5, sdef: 6, spd: 4 }, abilities: { basic: ["Torrent"], adv: ["Rain Dish"], high: [] }, skills: { overland: 3, swim: 5, jump: 2, power: 2 } },
    { id: 25, species: "Pikachu", types: ["Electric"], baseStats: { hp: 4, atk: 6, def: 4, satk: 5, sdef: 5, spd: 10 }, abilities: { basic: ["Static"], adv: ["Lightning Rod"], high: [] }, skills: { overland: 5, swim: 2, jump: 3, power: 2 } }
];

// ============================================================
// MINIMAL FALLBACK GAME DATA
// Full data is loaded from GitHub - this is just for offline/error cases
// ============================================================

export let GAME_DATA = {
    _signature: { v: '1.0', a: 'leander_rsr', t: Date.now() },
    _loaded: false,
    
    // Minimal natures fallback (5 common ones)
    natures: {
        'Adamant': { buff: 'atk', nerf: 'satk', likedFlavor: 'Spicy', dislikedFlavor: 'Dry', description: '+2 Attack, -2 Sp. Attack' },
        'Modest': { buff: 'satk', nerf: 'atk', likedFlavor: 'Dry', dislikedFlavor: 'Spicy', description: '+2 Sp. Attack, -2 Attack' },
        'Jolly': { buff: 'spd', nerf: 'satk', likedFlavor: 'Sweet', dislikedFlavor: 'Dry', description: '+2 Speed, -2 Sp. Attack' },
        'Timid': { buff: 'spd', nerf: 'atk', likedFlavor: 'Sweet', dislikedFlavor: 'Spicy', description: '+2 Speed, -2 Attack' },
        'Bold': { buff: 'def', nerf: 'atk', likedFlavor: 'Sour', dislikedFlavor: 'Spicy', description: '+2 Defense, -2 Attack' }
    },
    
    // Minimal skills (just the basics)
    pokemonSkills: {
        'Overland': { type: 'speed', hasValue: true, description: 'Movement speed on land' },
        'Surface': { type: 'speed', hasValue: true, description: 'Movement speed on water surface' },
        'Sky': { type: 'speed', hasValue: true, description: 'Flight speed' },
        'Jump': { type: 'basic', hasValue: true, description: 'Jump height' },
        'Power': { type: 'basic', hasValue: true, description: 'Physical power' },
        'Intelligence': { type: 'basic', hasValue: true, description: 'Mental capability' }
    },
    
    // Minimal trainer classes (3 base classes)
    trainerClasses: {
        'Ace Trainer': { type: 'base', description: 'Skilled Pokemon trainer' },
        'Capture Specialist': { type: 'base', description: 'Expert at catching Pokemon' },
        'Researcher': { type: 'base', description: 'Studies Pokemon behavior' }
    },
    
    // Minimal trainer skills - Official P:TA Handbook
    skills: {
        // HP Skills (passive, no roll)
        'Breathless': { stat: 'HP', type: 'passive', description: 'Hold breath for up to 5 minutes.' },
        'Fasting': { stat: 'HP', type: 'passive', description: 'Withstand a week without water, month without food.' },
        'Endurance': { stat: 'HP', type: 'passive', description: 'Do not tire from hours of physical exertion.' },
        'Resistant': { stat: 'HP', type: 'passive', description: '3/4 damage from Poison/Burns. +2 vs status rolls.' },
        // ATK Skills
        'Browbeat': { stat: 'ATK', type: 'opposed', description: 'Intimidate or coerce others.' },
        'Jump': { stat: 'ATK', type: 'check', description: 'Leap higher/further. 5: 2ft. 10: 4ft. 15: 5ft. 20: 8ft.' },
        'Sprint': { stat: 'ATK', type: 'check', description: 'Run faster. 10: Normal. 15: +2 Shift. 20: +4 Shift.' },
        'Strength': { stat: 'ATK', type: 'check', description: 'Lift/move heavy objects. 10: 150lbs. 15: 250lbs. 20: 350lbs.' },
        // DEF Skills
        'Concentration': { stat: 'DEF', type: 'check', description: 'Maintain focus while taking damage.' },
        'Deflection': { stat: 'DEF', type: 'opposed', description: 'Intercept objects midflight (not Pokémon Moves).' },
        'Healing': { stat: 'DEF', type: 'check', description: 'Recover more HP from rest. 10: 15%. 15: 25%. 20: Full.' },
        'Tireless': { stat: 'DEF', type: 'check', description: 'Go without sleep without HP loss.' },
        // SATK Skills
        'Engineering': { stat: 'SATK', type: 'check', description: 'Understand and operate machinery.' },
        'History': { stat: 'SATK', type: 'check', description: 'Knowledge of the Pokémon world\'s past.' },
        'Investigate': { stat: 'SATK', type: 'opposed', description: 'Find items or understand purpose.' },
        'Programming': { stat: 'SATK', type: 'opposed', description: 'Access and manipulate computers/networks.' },
        // SDEF Skills
        'Bluff/Diplomacy': { stat: 'SDEF', type: 'opposed', description: 'Deceive or persuade others.' },
        'Perception': { stat: 'SDEF', type: 'opposed', description: 'Notice things happening around you.' },
        'Sooth': { stat: 'SDEF', type: 'opposed', description: 'Calm upset Pokémon.' },
        'Streetwise': { stat: 'SDEF', type: 'check', description: 'Know your way around new places.' },
        // SPD Skills
        'Acrobatics': { stat: 'SPD', type: 'check', description: 'Balance, parkour, climbing, flips.' },
        'Perform': { stat: 'SPD', type: 'check', description: 'Music, dance, speeches, entertainment.' },
        'Sleight of Hand': { stat: 'SPD', type: 'opposed', description: 'Pickpocket or conceal items.' },
        'Stealth': { stat: 'SPD', type: 'opposed', description: 'Move quietly and hide.' }
    },
    
    // Minimal features
    features: {},
    
    // Minimal moves (5 common ones)
    moves: {
        'Tackle': { type: 'Normal', damage: '2d6+8', frequency: 'At-Will', category: 'Physical', range: 'Melee', effect: '1 Target, Dash', description: 'Basic physical attack' },
        'Thunderbolt': { type: 'Electric', damage: '3d12+14', frequency: 'Battle - 2', category: 'Special', range: 'Ranged 8', effect: '1 Target', description: 'Powerful electric attack. 11-20 Paralyzes.' },
        'Flamethrower': { type: 'Fire', damage: '3d12+14', frequency: 'Battle - 2', category: 'Special', range: 'Ranged 8', effect: '1 Target', description: 'Powerful fire attack. 19-20 Burns.' },
        'Surf': { type: 'Water', damage: '3d12+14', frequency: 'Battle - 2', category: 'Special', range: 'Ranged 6, 1 Target', effect: 'Burst', description: 'Hits all adjacent targets' },
        'Earthquake': { type: 'Ground', damage: '4d10+16', frequency: 'Battle - 2', category: 'Physical', range: 'Burst 3', effect: 'Groundsource', description: 'Powerful ground attack hitting all nearby' }
    },
    
    // Minimal abilities (5 common ones)
    abilities: {
        'Overgrow': 'Trigger, Last Chance. Grass type moves get additional STAB when HP ≤ 1/3.',
        'Blaze': 'Trigger, Last Chance. Fire type moves get additional STAB when HP ≤ 1/3.',
        'Torrent': 'Trigger, Last Chance. Water type moves get additional STAB when HP ≤ 1/3.',
        'Static': 'Trigger - Daily. When hit by melee Move, attacker becomes Paralyzed.',
        'Intimidate': 'Trigger - Hourly. Lower all adjacent foes Attack 1 Combat Stage when entering encounter.'
    },
    
    // Minimal items
    items: {
        'Potion': { type: 'healing', effect: 'Heals 2d12+10 HP', price: 200 },
        'Poke Ball': { type: 'ball', effect: '+0 modifier', price: 200, modifier: 0 },
        'Great Ball': { type: 'ball', effect: '-10 modifier', price: 600, modifier: -10 }
    },
    
    // Pokemon experience chart (levels 1-100)
    pokemonExpChart: {
        1: 0, 2: 25, 3: 50, 4: 100, 5: 150, 6: 200, 7: 400, 8: 600, 9: 800, 10: 1000,
        11: 1250, 12: 1500, 13: 1750, 14: 2000, 15: 2250, 16: 2750, 17: 3250, 18: 3750, 19: 4250, 20: 4750,
        21: 5500, 22: 6250, 23: 7000, 24: 7750, 25: 8500, 26: 9500, 27: 10500, 28: 11500, 29: 12500, 30: 13500,
        31: 15000, 32: 16500, 33: 18000, 34: 19500, 35: 21000, 36: 23000, 37: 25000, 38: 27000, 39: 29000, 40: 31000,
        41: 34000, 42: 37000, 43: 40000, 44: 43000, 45: 46000, 46: 50000, 47: 54000, 48: 58000, 49: 62000, 50: 66000,
        51: 72000, 52: 78000, 53: 84000, 54: 90000, 55: 96000, 56: 104000, 57: 112000, 58: 120000, 59: 128000, 60: 136000,
        61: 148000, 62: 160000, 63: 172000, 64: 184000, 65: 196000, 66: 212000, 67: 228000, 68: 244000, 69: 260000, 70: 276000,
        71: 300000, 72: 324000, 73: 348000, 74: 372000, 75: 396000, 76: 428000, 77: 460000, 78: 492000, 79: 524000, 80: 556000,
        81: 600000, 82: 650000, 83: 700000, 84: 750000, 85: 800000, 86: 860000, 87: 920000, 88: 980000, 89: 1040000, 90: 1100000,
        91: 1180000, 92: 1260000, 93: 1340000, 94: 1420000, 95: 1500000, 96: 1600000, 97: 1700000, 98: 1800000, 99: 1900000, 100: 2000000
    },
    
    // Trainer level progression - Official P:TA Handbook values
    // Level 5: 2 classes, Level 12: 3 classes, Level 24: 4 classes
    // Pattern: 1 stat per level, feats alternate (even=1, odd=0) after level 6, milestone bonus at every 10th
    trainerLevelProgression: {
        0: { feats: 0, stats: 0, totalFeats: 0, totalStats: 0 },
        1: { feats: 1, stats: 1, totalFeats: 1, totalStats: 1 },
        2: { feats: 1, stats: 1, totalFeats: 2, totalStats: 2 },
        3: { feats: 1, stats: 1, totalFeats: 3, totalStats: 3 },
        4: { feats: 1, stats: 1, totalFeats: 4, totalStats: 4 },
        5: { feats: 1, stats: 1, totalFeats: 5, totalStats: 5 },
        6: { feats: 1, stats: 1, totalFeats: 6, totalStats: 6 },
        7: { feats: 0, stats: 1, totalFeats: 6, totalStats: 7 },
        8: { feats: 1, stats: 1, totalFeats: 7, totalStats: 8 },
        9: { feats: 0, stats: 1, totalFeats: 7, totalStats: 9 },
        10: { feats: 2, stats: 1, totalFeats: 9, totalStats: 10 },
        11: { feats: 0, stats: 1, totalFeats: 9, totalStats: 11 },
        12: { feats: 1, stats: 1, totalFeats: 10, totalStats: 12 },
        13: { feats: 0, stats: 1, totalFeats: 10, totalStats: 13 },
        14: { feats: 1, stats: 1, totalFeats: 11, totalStats: 14 },
        15: { feats: 0, stats: 1, totalFeats: 11, totalStats: 15 },
        16: { feats: 1, stats: 1, totalFeats: 12, totalStats: 16 },
        17: { feats: 0, stats: 1, totalFeats: 12, totalStats: 17 },
        18: { feats: 1, stats: 1, totalFeats: 13, totalStats: 18 },
        19: { feats: 0, stats: 1, totalFeats: 13, totalStats: 19 },
        20: { feats: 2, stats: 1, totalFeats: 15, totalStats: 20 },
        21: { feats: 0, stats: 1, totalFeats: 15, totalStats: 21 },
        22: { feats: 1, stats: 1, totalFeats: 16, totalStats: 22 },
        23: { feats: 0, stats: 1, totalFeats: 16, totalStats: 23 },
        24: { feats: 1, stats: 1, totalFeats: 17, totalStats: 24 },
        25: { feats: 0, stats: 1, totalFeats: 17, totalStats: 25 },
        26: { feats: 1, stats: 1, totalFeats: 18, totalStats: 26 },
        27: { feats: 0, stats: 1, totalFeats: 18, totalStats: 27 },
        28: { feats: 1, stats: 1, totalFeats: 19, totalStats: 28 },
        29: { feats: 0, stats: 1, totalFeats: 19, totalStats: 29 },
        30: { feats: 2, stats: 1, totalFeats: 21, totalStats: 30 },
        31: { feats: 0, stats: 1, totalFeats: 21, totalStats: 31 },
        32: { feats: 1, stats: 1, totalFeats: 22, totalStats: 32 },
        33: { feats: 0, stats: 1, totalFeats: 22, totalStats: 33 },
        34: { feats: 1, stats: 1, totalFeats: 23, totalStats: 34 },
        35: { feats: 0, stats: 1, totalFeats: 23, totalStats: 35 },
        36: { feats: 1, stats: 1, totalFeats: 24, totalStats: 36 },
        37: { feats: 0, stats: 1, totalFeats: 24, totalStats: 37 },
        38: { feats: 1, stats: 1, totalFeats: 25, totalStats: 38 },
        39: { feats: 0, stats: 1, totalFeats: 25, totalStats: 39 },
        40: { feats: 2, stats: 1, totalFeats: 27, totalStats: 40 },
        41: { feats: 0, stats: 1, totalFeats: 27, totalStats: 41 },
        42: { feats: 1, stats: 1, totalFeats: 28, totalStats: 42 },
        43: { feats: 0, stats: 1, totalFeats: 28, totalStats: 43 },
        44: { feats: 1, stats: 1, totalFeats: 29, totalStats: 44 },
        45: { feats: 0, stats: 1, totalFeats: 29, totalStats: 45 },
        46: { feats: 1, stats: 1, totalFeats: 30, totalStats: 46 },
        47: { feats: 0, stats: 1, totalFeats: 30, totalStats: 47 },
        48: { feats: 1, stats: 1, totalFeats: 31, totalStats: 48 },
        49: { feats: 0, stats: 1, totalFeats: 31, totalStats: 49 },
        50: { feats: 2, stats: 1, totalFeats: 33, totalStats: 50 }
    }
};

// Function to update GAME_DATA (needed because it's exported as let)
export const updateGameData = (newData) => {
    Object.assign(GAME_DATA, newData);
};
