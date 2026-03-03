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

// Fallback mini Pokédex — shown when GitHub is unavailable (PTA3 format)
export const FALLBACK_POKEDEX = [
    { id: 1,  species: "Bulbasaur",  types: ["Grass", "Poison"], baseStats: { hp: 30, atk: 5, def: 6, satk: 7, sdef: 7, spd: 5 }, skills: ["Sprouter", "Threaded"],  passives: ["Growl", "Overgrow"] },
    { id: 4,  species: "Charmander", types: ["Fire"],            baseStats: { hp: 24, atk: 5, def: 5, satk: 6, sdef: 5, spd: 7 }, skills: ["Firestarter", "Sinker"], passives: ["Growl", "Blaze"] },
    { id: 7,  species: "Squirtle",   types: ["Water"],           baseStats: { hp: 24, atk: 5, def: 8, satk: 5, sdef: 6, spd: 4 }, skills: ["Fountain", "Swimmer"],  passives: ["Withdraw", "Torrent"] },
    { id: 25, species: "Pikachu",    types: ["Electric"],        baseStats: { hp: 24, atk: 7, def: 5, satk: 6, sdef: 5, spd: 9 }, skills: ["Zapper"],              passives: ["Static", "Lightning Rod"] }
];

// ============================================================
// MINIMAL FALLBACK GAME DATA
// Full data is loaded from GitHub - this is just for offline/error cases
// ============================================================

export let GAME_DATA = {
    _signature: { v: '3.0', a: 'leander_rsr', t: Date.now() },
    _loaded: false,

    // Honor thresholds for trainer leveling (PTA3)
    honorThresholds: {
        1: 0, 2: 1, 3: 2, 4: 3, 5: 5, 6: 7, 7: 9, 8: 12, 9: 15, 10: 18,
        11: 22, 12: 26, 13: 30, 14: 35, 15: 40
    },

    // All 25 natures (PTA3: ±1 modifier)
    // Flavor: atk=Spicy, def=Sour, satk=Dry, sdef=Bitter, spd=Sweet
    natures: {
        // Neutral (no modifier)
        'Hardy':   { buff: null, nerf: null, likedFlavor: 'None', dislikedFlavor: 'None' },
        'Docile':  { buff: null, nerf: null, likedFlavor: 'None', dislikedFlavor: 'None' },
        'Serious': { buff: null, nerf: null, likedFlavor: 'None', dislikedFlavor: 'None' },
        'Bashful': { buff: null, nerf: null, likedFlavor: 'None', dislikedFlavor: 'None' },
        'Quirky':  { buff: null, nerf: null, likedFlavor: 'None', dislikedFlavor: 'None' },
        // +ATK natures
        'Lonely':  { buff: 'atk', nerf: 'def',  likedFlavor: 'Spicy', dislikedFlavor: 'Sour' },
        'Brave':   { buff: 'atk', nerf: 'spd',  likedFlavor: 'Spicy', dislikedFlavor: 'Sweet' },
        'Adamant': { buff: 'atk', nerf: 'satk', likedFlavor: 'Spicy', dislikedFlavor: 'Dry' },
        'Naughty': { buff: 'atk', nerf: 'sdef', likedFlavor: 'Spicy', dislikedFlavor: 'Bitter' },
        // +DEF natures
        'Bold':    { buff: 'def', nerf: 'atk',  likedFlavor: 'Sour',  dislikedFlavor: 'Spicy' },
        'Relaxed': { buff: 'def', nerf: 'spd',  likedFlavor: 'Sour',  dislikedFlavor: 'Sweet' },
        'Impish':  { buff: 'def', nerf: 'satk', likedFlavor: 'Sour',  dislikedFlavor: 'Dry' },
        'Lax':     { buff: 'def', nerf: 'sdef', likedFlavor: 'Sour',  dislikedFlavor: 'Bitter' },
        // +SPD natures
        'Timid':   { buff: 'spd', nerf: 'atk',  likedFlavor: 'Sweet', dislikedFlavor: 'Spicy' },
        'Hasty':   { buff: 'spd', nerf: 'def',  likedFlavor: 'Sweet', dislikedFlavor: 'Sour' },
        'Jolly':   { buff: 'spd', nerf: 'satk', likedFlavor: 'Sweet', dislikedFlavor: 'Dry' },
        'Naive':   { buff: 'spd', nerf: 'sdef', likedFlavor: 'Sweet', dislikedFlavor: 'Bitter' },
        // +SATK natures
        'Modest':  { buff: 'satk', nerf: 'atk',  likedFlavor: 'Dry',    dislikedFlavor: 'Spicy' },
        'Mild':    { buff: 'satk', nerf: 'def',  likedFlavor: 'Dry',    dislikedFlavor: 'Sour' },
        'Quiet':   { buff: 'satk', nerf: 'spd',  likedFlavor: 'Dry',    dislikedFlavor: 'Sweet' },
        'Rash':    { buff: 'satk', nerf: 'sdef', likedFlavor: 'Dry',    dislikedFlavor: 'Bitter' },
        // +SDEF natures
        'Calm':    { buff: 'sdef', nerf: 'atk',  likedFlavor: 'Bitter', dislikedFlavor: 'Spicy' },
        'Gentle':  { buff: 'sdef', nerf: 'def',  likedFlavor: 'Bitter', dislikedFlavor: 'Sour' },
        'Sassy':   { buff: 'sdef', nerf: 'spd',  likedFlavor: 'Bitter', dislikedFlavor: 'Sweet' },
        'Careful': { buff: 'sdef', nerf: 'satk', likedFlavor: 'Bitter', dislikedFlavor: 'Dry' }
    },

    // PTA3 Trainer Skills (18 total)
    // Roll: 1d20 + ⌊stat/2⌋ + talent bonus (0 talents: +0, 1 talent: +2, 2 talents: +5)
    skills: {
        // ATK Skills
        'Athletics':             { stat: 'ATK',  type: 'check',   description: 'Running, jumping, climbing, swimming, feats of strength.' },
        // DEF Skills
        'Concentration':         { stat: 'DEF',  type: 'passive', description: 'Maintaining focus under duress; invoked by GM.' },
        'Constitution':          { stat: 'DEF',  type: 'passive', description: 'Physical stress, holding breath, enduring hardship.' },
        // SATK Skills
        'Engineering/Operation': { stat: 'SATK', type: 'check',   description: 'Understanding and operating machinery.' },
        'History':               { stat: 'SATK', type: 'check',   description: 'Knowledge of past and current events.' },
        'Investigate':           { stat: 'SATK', type: 'check',   description: 'Finding clues, deducing purpose, examining evidence.' },
        'Medicine':              { stat: 'SATK', type: 'check',   description: 'First aid, stabilizing injuries, identifying berries.' },
        'Nature':                { stat: 'SATK', type: 'check',   description: 'Pokémon types, tracking, identifying edible plants.' },
        'Programming':           { stat: 'SATK', type: 'opposed', description: 'Accessing and manipulating computer systems.' },
        // SDEF Skills
        'Bluff/Deception':       { stat: 'SDEF', type: 'opposed', description: 'Lying, forging, disguise, misdirection.' },
        'Diplomacy/Persuasion':  { stat: 'SDEF', type: 'opposed', description: 'Convincing others, negotiations.' },
        'Insight':               { stat: 'SDEF', type: 'check',   description: 'Discerning intention, reading people.' },
        'Perception':            { stat: 'SDEF', type: 'opposed', description: 'Noticing things in the environment.' },
        'Perform':               { stat: 'SDEF', type: 'check',   description: 'Music, dance, speeches, entertainment.' },
        'Pokémon Handling':      { stat: 'SDEF', type: 'check',   description: 'Interacting with unfamiliar or hostile Pokémon.' },
        // SPD Skills
        'Acrobatics':            { stat: 'SPD',  type: 'check',   description: 'Balance, parkour, tumbling, maneuvering.' },
        'Sleight of Hand':       { stat: 'SPD',  type: 'opposed', description: 'Pickpocketing, concealment, lock-picking, misdirection.' },
        'Stealth':               { stat: 'SPD',  type: 'opposed', description: 'Moving quietly, hiding.' }
    },

    // PTA3 Trainer Classes (7 base from HB1/HB2, 35 advanced)
    trainerClasses: {
        // ── Base Classes (HB1) ───────────────────────────────────────────────────
        'Ace Trainer': {
            type: 'base',
            description: 'Skilled battler focused on optimizing Pokémon performance.',
            primaryStats: ['ATK', 'SATK'],
            skillPool: ['Athletics', 'Insight', 'Perception', 'Nature', 'Pokémon Handling'],
            advancedClasses: ['Stat Ace', 'Strategist', 'Tag Battler', 'Type Ace', 'Underdog']
        },
        'Breeder': {
            type: 'base',
            description: 'Expert in raising and nurturing Pokémon to their full potential.',
            primaryStats: ['DEF', 'SDEF'],
            skillPool: ['Medicine', 'Nature', 'Pokémon Handling', 'Investigate', 'Diplomacy/Persuasion'],
            advancedClasses: ['Botanist', 'Chef', 'Evolver', 'Medic', 'Move Tutor']
        },
        'Coordinator': {
            type: 'base',
            description: 'Focuses on Pokémon Contests and performance.',
            primaryStats: ['SDEF', 'SPD'],
            skillPool: ['Perform', 'Bluff/Deception', 'Diplomacy/Persuasion', 'Pokémon Handling', 'Insight'],
            advancedClasses: ['Choreographer', 'Coach', 'Designer', 'Groomer', 'Rising Star']
        },
        'Ranger': {
            type: 'base',
            description: 'Wilderness expert who partners closely with wild Pokémon.',
            primaryStats: ['DEF', 'SPD'],
            skillPool: ['Athletics', 'Nature', 'Stealth', 'Pokémon Handling', 'Perception'],
            advancedClasses: ['Invoker', 'Officer', 'Rider', 'Special Operative', 'Survivalist']
        },
        'Researcher': {
            type: 'base',
            description: 'Academic who studies Pokémon biology, history, and mechanics.',
            primaryStats: ['SATK', 'SDEF'],
            skillPool: ['History', 'Investigate', 'Nature', 'Medicine', 'Engineering/Operation'],
            advancedClasses: ['Archeologist', 'Ball Smith', 'Photographer', 'Scientist', 'Watcher']
        },
        // ── Base Classes (HB2) ───────────────────────────────────────────────────
        'Martial Artist': {
            type: 'base',
            description: 'Combines physical prowess with Pokémon battle discipline.',
            primaryStats: ['ATK', 'DEF'],
            skillPool: ['Athletics', 'Acrobatics', 'Concentration', 'Constitution', 'Insight'],
            advancedClasses: ['Aura Master', 'Dirty Fighter', 'Mentor', 'Ninja', 'Yogi']
        },
        'Psychic': {
            type: 'base',
            description: 'Channels psychic energy to influence battle and environment.',
            primaryStats: ['SATK', 'SPD'],
            skillPool: ['Insight', 'Perception', 'Bluff/Deception', 'Investigate', 'Concentration'],
            advancedClasses: ['Air Adept', 'Earth Shaker', 'Firebreather', 'Hex Maniac', 'Rain Waker']
        },
        // ── Advanced Classes (Ace Trainer tree) ─────────────────────────────────
        'Stat Ace':       { type: 'advanced', parentClass: 'Ace Trainer', description: 'Maximizes a single stat to extreme levels.' },
        'Strategist':     { type: 'advanced', parentClass: 'Ace Trainer', description: 'Plans several moves ahead; controls battlefield tempo.' },
        'Tag Battler':    { type: 'advanced', parentClass: 'Ace Trainer', description: 'Expert in double and multi-Pokémon battles.' },
        'Type Ace':       { type: 'advanced', parentClass: 'Ace Trainer', description: 'Specializes in a single Pokémon type.' },
        'Underdog':       { type: 'advanced', parentClass: 'Ace Trainer', description: 'Turns disadvantage into victory through grit.' },
        // ── Advanced Classes (Breeder tree) ─────────────────────────────────────
        'Botanist':       { type: 'advanced', parentClass: 'Breeder', description: 'Expert in Grass-type Pokémon and plant-based items.' },
        'Chef':           { type: 'advanced', parentClass: 'Breeder', description: 'Crafts special foods and Poffins to boost Pokémon.' },
        'Evolver':        { type: 'advanced', parentClass: 'Breeder', description: 'Specializes in evolution methods and chains.' },
        'Medic':          { type: 'advanced', parentClass: 'Breeder', description: 'Field medic for Pokémon injuries and ailments.' },
        'Move Tutor':     { type: 'advanced', parentClass: 'Breeder', description: 'Teaches Pokémon moves they cannot normally learn.' },
        // ── Advanced Classes (Coordinator tree) ─────────────────────────────────
        'Choreographer':  { type: 'advanced', parentClass: 'Coordinator', description: 'Designs elaborate contest routines.' },
        'Coach':          { type: 'advanced', parentClass: 'Coordinator', description: 'Supports allied Pokémon with morale boosts.' },
        'Designer':       { type: 'advanced', parentClass: 'Coordinator', description: 'Creates accessories and costumes for contests.' },
        'Groomer':        { type: 'advanced', parentClass: 'Coordinator', description: 'Maintains Pokémon condition and happiness.' },
        'Rising Star':    { type: 'advanced', parentClass: 'Coordinator', description: 'Up-and-coming contest celebrity.' },
        // ── Advanced Classes (Ranger tree) ──────────────────────────────────────
        'Invoker':        { type: 'advanced', parentClass: 'Ranger', description: 'Calls upon wild Pokémon for aid in battle.' },
        'Officer':        { type: 'advanced', parentClass: 'Ranger', description: 'Law enforcement specialist with Pokémon partner.' },
        'Rider':          { type: 'advanced', parentClass: 'Ranger', description: 'Expert mount and Pokémon riding techniques.' },
        'Special Operative': { type: 'advanced', parentClass: 'Ranger', description: 'Elite operative skilled in covert field operations.' },
        'Survivalist':    { type: 'advanced', parentClass: 'Ranger', description: 'Thrives in harsh wilderness environments.' },
        // ── Advanced Classes (Researcher tree) ──────────────────────────────────
        'Archeologist':   { type: 'advanced', parentClass: 'Researcher', description: 'Uncovers fossil Pokémon and ancient artifacts.' },
        'Ball Smith':     { type: 'advanced', parentClass: 'Researcher', description: 'Crafts custom Poké Balls with special properties.' },
        'Photographer':   { type: 'advanced', parentClass: 'Researcher', description: 'Documents Pokémon in the wild.' },
        'Scientist':      { type: 'advanced', parentClass: 'Researcher', description: 'Experiments with Pokémon biology and mechanics.' },
        'Watcher':        { type: 'advanced', parentClass: 'Researcher', description: 'Patient observer skilled at predicting Pokémon behavior.' },
        // ── Advanced Classes (Martial Artist tree) ───────────────────────────────
        'Aura Master':    { type: 'advanced', parentClass: 'Martial Artist', description: 'Channels aura energy like Lucario.' },
        'Dirty Fighter':  { type: 'advanced', parentClass: 'Martial Artist', description: 'Uses underhanded tactics to gain advantage.' },
        'Mentor':         { type: 'advanced', parentClass: 'Martial Artist', description: 'Trains others and boosts their capabilities.' },
        'Ninja':          { type: 'advanced', parentClass: 'Martial Artist', description: 'Lightning-fast stealth combatant.' },
        'Yogi':           { type: 'advanced', parentClass: 'Martial Artist', description: 'Focuses inner discipline for unmatched endurance.' },
        // ── Advanced Classes (Psychic tree) ─────────────────────────────────────
        'Air Adept':      { type: 'advanced', parentClass: 'Psychic', description: 'Controls wind and atmospheric phenomena.' },
        'Earth Shaker':   { type: 'advanced', parentClass: 'Psychic', description: 'Commands seismic and ground forces.' },
        'Firebreather':   { type: 'advanced', parentClass: 'Psychic', description: 'Channels fire energy through psychic force.' },
        'Hex Maniac':     { type: 'advanced', parentClass: 'Psychic', description: 'Specializes in curses, hexes, and dark energy.' },
        'Rain Waker':     { type: 'advanced', parentClass: 'Psychic', description: 'Commands water and weather patterns.' }
    },

    // Minimal features
    features: {},

    // Minimal moves (updated frequency strings for PTA3)
    moves: {
        'Tackle':       { type: 'Normal',   damage: '2d6+8',   frequency: 'At-Will', category: 'Physical', range: 'Melee',      effect: '1 Target, Dash', description: 'Basic physical attack' },
        'Thunderbolt':  { type: 'Electric', damage: '3d12+14', frequency: '3/day',   category: 'Special',  range: 'Ranged(8)',   effect: '1 Target', description: 'Powerful electric attack. 11-20 Paralyzes.' },
        'Flamethrower': { type: 'Fire',     damage: '3d12+14', frequency: '3/day',   category: 'Special',  range: 'Ranged(8)',   effect: '1 Target', description: 'Powerful fire attack. 19-20 Burns.' },
        'Surf':         { type: 'Water',    damage: '3d12+14', frequency: '3/day',   category: 'Special',  range: 'Ranged(6)',   effect: 'Burst', description: 'Hits all adjacent targets' },
        'Earthquake':   { type: 'Ground',   damage: '4d10+16', frequency: '3/day',   category: 'Physical', range: 'Burst(3)',    effect: 'Groundsource', description: 'Powerful ground attack hitting all nearby' }
    },

    // Minimal abilities (5 common ones)
    abilities: {
        'Overgrow':   'Trigger, Last Chance. Grass type moves get additional STAB when HP ≤ 1/3.',
        'Blaze':      'Trigger, Last Chance. Fire type moves get additional STAB when HP ≤ 1/3.',
        'Torrent':    'Trigger, Last Chance. Water type moves get additional STAB when HP ≤ 1/3.',
        'Static':     'Trigger - Daily. When hit by melee Move, attacker becomes Paralyzed.',
        'Intimidate': 'Trigger - Hourly. Lower all adjacent foes Attack 1 Combat Stage when entering encounter.'
    },

    // Minimal items
    items: {
        'Potion':    { type: 'healing', effect: 'Heals 2d12+10 HP', price: 200 },
        'Poke Ball': { type: 'ball',    effect: '+0 modifier', price: 200, modifier: 0 },
        'Great Ball': { type: 'ball',   effect: '-10 modifier', price: 600, modifier: -10 }
    }
};

// Function to update GAME_DATA (needed because it's exported as let)
export const updateGameData = (newData) => {
    Object.assign(GAME_DATA, newData);
};
