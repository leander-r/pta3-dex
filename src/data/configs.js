// ============================================================
// DATA CONFIGURATION - GitHub-hosted JSON files
// ============================================================
// [lndr_rsr:0x6c65616e6465725f727372] Application Core
export const _0x72 = atob('bGVhbmRlcl9yc3I='); // ownership marker

export const DATA_CONFIG = {
    // GitHub raw URLs for data files
    pokedexUrl: 'https://raw.githubusercontent.com/leander-r/pta3-dex/main/pokedex.min.json',
    gameDataUrl: 'https://raw.githubusercontent.com/leander-r/pta3-dex/main/pta-game-data.min.json',
    
    // IndexedDB configuration — app-specific name prevents collision with pta-dex
    // (both apps share the same origin leander-r.github.io)
    dbName: 'PTA3Data',
    dbVersion: 2,
    
    // Cache duration (7 days in milliseconds)
    cacheDuration: 7 * 24 * 60 * 60 * 1000
};

// Keep POKEDEX_CONFIG for backward compatibility
export const POKEDEX_CONFIG = {
    remoteUrl: DATA_CONFIG.pokedexUrl,
    fallbackEnabled: true,
    dbName: 'PTA3Pokedex',
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
        'Programming':           { stat: 'SATK', type: 'check',   description: 'Accessing and manipulating computer systems.' },
        // SDEF Skills
        'Bluff/Deception':       { stat: 'SDEF', type: 'opposed', description: 'Lying, forging, disguise, misdirection.' },
        'Diplomacy/Persuasion':  { stat: 'SDEF', type: 'opposed', description: 'Convincing others, negotiations.' },
        'Insight':               { stat: 'SDEF', type: 'opposed', description: 'Discerning intention, reading people.' },
        'Perception':            { stat: 'SDEF', type: 'check',   description: 'Noticing things in the environment.' },
        'Perform':               { stat: 'SDEF', type: 'check',   description: 'Music, dance, speeches, entertainment.' },
        'Pokémon Handling':      { stat: 'SDEF', type: 'check',   description: 'Interacting with unfamiliar or hostile Pokémon.' },
        // SPD Skills
        'Acrobatics':            { stat: 'SPD',  type: 'check',   description: 'Balance, parkour, tumbling, maneuvering.' },
        'Sleight of Hand':       { stat: 'SPD',  type: 'check',   description: 'Pickpocketing, concealment, lock-picking, misdirection.' },
        'Stealth':               { stat: 'SPD',  type: 'opposed', description: 'Moving quietly, hiding.' }
    },

    // PTA3 Trainer Classes (7 base from HB1/HB2, 35 advanced)
    trainerClasses: {
        // ── Base Classes (HB1) ───────────────────────────────────────────────────
        'Ace Trainer': {
            type: 'base',
            description: 'Skilled battler focused on optimizing Pokémon performance.',
            primaryStats: ['ATK', 'SATK'],
            skillPool: ['Acrobatics', 'Athletics', 'Concentration', 'Diplomacy/Persuasion', 'History', 'Pokémon Handling'],
            advancedClasses: ['Stat Ace', 'Strategist', 'Tag Battler', 'Type Ace', 'Underdog']
        },
        'Breeder': {
            type: 'base',
            description: 'Expert in raising and nurturing Pokémon to their full potential.',
            primaryStats: ['DEF', 'SDEF'],
            skillPool: ['Constitution', 'Diplomacy/Persuasion', 'History', 'Medicine', 'Nature', 'Pokémon Handling'],
            advancedClasses: ['Botanist', 'Chef', 'Evolver', 'Medic', 'Move Tutor']
        },
        'Coordinator': {
            type: 'base',
            description: 'Focuses on Pokémon Contests and performance.',
            primaryStats: ['SDEF', 'SPD'],
            skillPool: ['Acrobatics', 'Athletics', 'Bluff/Deception', 'Diplomacy/Persuasion', 'Perform', 'Sleight of Hand'],
            advancedClasses: ['Choreographer', 'Coach', 'Designer', 'Groomer', 'Rising Star']
        },
        'Ranger': {
            type: 'base',
            description: 'Wilderness expert who partners closely with wild Pokémon.',
            primaryStats: ['DEF', 'SPD'],
            skillPool: ['Acrobatics', 'Athletics', 'Diplomacy/Persuasion', 'Perception', 'Pokémon Handling', 'Stealth'],
            advancedClasses: ['Invoker', 'Officer', 'Rider', 'Special Operative', 'Survivalist'],
            prerequisite: 'Requires Ranger Union/Law Enforcement origin.'
        },
        'Researcher': {
            type: 'base',
            description: 'Academic who studies Pokémon biology, history, and mechanics.',
            primaryStats: ['SATK', 'SDEF'],
            skillPool: ['Engineering/Operation', 'History', 'Investigate', 'Medicine', 'Perception', 'Programming'],
            advancedClasses: ['Archeologist', 'Ball Smith', 'Photographer', 'Scientist', 'Watcher']
        },
        // ── Base Classes (HB2) ───────────────────────────────────────────────────
        'Martial Artist': {
            type: 'base',
            description: 'Combines physical prowess with Pokémon battle discipline.',
            primaryStats: ['ATK', 'DEF'],
            skillPool: ['Acrobatics', 'Athletics', 'Concentration', 'Constitution', 'Medicine', 'Perform'],
            advancedClasses: ['Aura Master', 'Dirty Fighter', 'Mentor', 'Ninja', 'Yogi']
        },
        'Psychic': {
            type: 'base',
            description: 'Channels psychic energy to influence battle and environment.',
            primaryStats: ['SATK', 'SPD'],
            skillPool: ['Acrobatics', 'Concentration', 'Insight', 'Investigate', 'Perception', 'Pokémon Handling'],
            advancedClasses: ['Air Adept', 'Earth Shaker', 'Firebreather', 'Hex Maniac', 'Rain Waker']
        },
        // ── Advanced Classes (Ace Trainer tree) ─────────────────────────────────
        'Stat Ace':       { type: 'advanced', parentClass: 'Ace Trainer',  description: 'Maximizes a single stat to extreme levels.',                     skillPool: ['Insight', 'Nature'] },
        'Strategist':     { type: 'advanced', parentClass: 'Ace Trainer',  description: 'Plans several moves ahead; controls battlefield tempo.',          skillPool: ['Investigate', 'Perception'] },
        'Tag Battler':    { type: 'advanced', parentClass: 'Ace Trainer',  description: 'Expert in double and multi-Pokémon battles.',                     skillPool: ['Concentration', 'Diplomacy/Persuasion'] },
        'Type Ace':       { type: 'advanced', parentClass: 'Ace Trainer',  description: 'Specializes in a single Pokémon type.',                          skillPool: ['Nature', 'Perform'] },
        'Underdog':       { type: 'advanced', parentClass: 'Ace Trainer',  description: 'Turns disadvantage into victory through grit.',                   skillPool: ['Bluff/Deception', 'Constitution'] },
        // ── Advanced Classes (Breeder tree) ─────────────────────────────────────
        'Botanist':       { type: 'advanced', parentClass: 'Breeder',      description: 'Expert in Grass-type Pokémon and plant-based items.',             skillPool: ['Medicine', 'Nature'] },
        'Chef':           { type: 'advanced', parentClass: 'Breeder',      description: 'Crafts special foods and Poffins to boost Pokémon.',              skillPool: ['Perform', 'Sleight of Hand'] },
        'Evolver':        { type: 'advanced', parentClass: 'Breeder',      description: 'Specializes in evolution methods and chains.',                    skillPool: ['Constitution', 'Pokémon Handling'] },
        'Medic':          { type: 'advanced', parentClass: 'Breeder',      description: 'Field medic for Pokémon injuries and ailments.',                  skillPool: ['Medicine', 'Sleight of Hand'] },
        'Move Tutor':     { type: 'advanced', parentClass: 'Breeder',      description: 'Teaches Pokémon moves they cannot normally learn.',               skillPool: ['Diplomacy/Persuasion', 'Pokémon Handling'] },
        // ── Advanced Classes (Coordinator tree) ─────────────────────────────────
        'Choreographer':  { type: 'advanced', parentClass: 'Coordinator',  description: 'Designs elaborate contest routines.',                             skillPool: ['Acrobatics', 'Perform'] },
        'Coach':          { type: 'advanced', parentClass: 'Coordinator',  description: 'Supports allied Pokémon with morale boosts.',                     skillPool: ['Athletics', 'Pokémon Handling'] },
        'Designer':       { type: 'advanced', parentClass: 'Coordinator',  description: 'Creates accessories and costumes for contests.',                  skillPool: ['Engineering/Operation', 'Sleight of Hand'] },
        'Groomer':        { type: 'advanced', parentClass: 'Coordinator',  description: 'Maintains Pokémon condition and happiness.',                      skillPool: ['Nature', 'Pokémon Handling'] },
        'Rising Star':    { type: 'advanced', parentClass: 'Coordinator',  description: 'Up-and-coming contest celebrity.',                                skillPool: ['Bluff/Deception', 'Diplomacy/Persuasion'] },
        // ── Advanced Classes (Ranger tree) ──────────────────────────────────────
        'Invoker':        { type: 'advanced', parentClass: 'Ranger',       description: 'Calls upon wild Pokémon for aid in battle.',                      skillPool: ['History', 'Perform'] },
        'Officer':        { type: 'advanced', parentClass: 'Ranger',       description: 'Law enforcement specialist with Pokémon partner.',                skillPool: ['Insight', 'Investigate'] },
        'Rider':          { type: 'advanced', parentClass: 'Ranger',       description: 'Expert mount and Pokémon riding techniques.',                     skillPool: ['Acrobatics', 'Pokémon Handling'] },
        'Special Operative': { type: 'advanced', parentClass: 'Ranger',    description: 'Elite operative skilled in covert field operations.',             skillPool: ['Constitution', 'Engineering/Operation'] },
        'Survivalist':    { type: 'advanced', parentClass: 'Ranger',       description: 'Thrives in harsh wilderness environments.',                        skillPool: ['Constitution', 'Nature'] },
        // ── Advanced Classes (Researcher tree) ──────────────────────────────────
        'Archeologist':   { type: 'advanced', parentClass: 'Researcher',   description: 'Uncovers fossil Pokémon and ancient artifacts.',                  skillPool: ['Engineering/Operation', 'History'] },
        'Ball Smith':     { type: 'advanced', parentClass: 'Researcher',   description: 'Crafts custom Poké Balls with special properties.',               skillPool: ['Engineering/Operation', 'Programming'] },
        'Photographer':   { type: 'advanced', parentClass: 'Researcher',   description: 'Documents Pokémon in the wild.',                                  skillPool: ['Engineering/Operation', 'Investigate'] },
        'Scientist':      { type: 'advanced', parentClass: 'Researcher',   description: 'Experiments with Pokémon biology and mechanics.',                 skillPool: ['Medicine', 'Nature'] },
        'Watcher':        { type: 'advanced', parentClass: 'Researcher',   description: 'Patient observer skilled at predicting Pokémon behavior.',        skillPool: ['Sleight of Hand', 'Stealth'] },
        // ── Advanced Classes (Martial Artist tree) ───────────────────────────────
        'Aura Master':    { type: 'advanced', parentClass: 'Martial Artist', description: 'Channels aura energy like Lucario.',                            skillPool: ['Concentration', 'Insight'] },
        'Dirty Fighter':  { type: 'advanced', parentClass: 'Martial Artist', description: 'Uses underhanded tactics to gain advantage.',                   skillPool: ['Bluff/Deception', 'Sleight of Hand'] },
        'Mentor':         { type: 'advanced', parentClass: 'Martial Artist', description: 'Trains others and boosts their capabilities.',                  skillPool: ['Diplomacy/Persuasion', 'History'] },
        'Ninja':          { type: 'advanced', parentClass: 'Martial Artist', description: 'Lightning-fast stealth combatant.',                             skillPool: ['Acrobatics', 'Stealth'] },
        'Yogi':           { type: 'advanced', parentClass: 'Martial Artist', description: 'Focuses inner discipline for unmatched endurance.',             skillPool: ['Acrobatics', 'Medicine'] },
        // ── Advanced Classes (Psychic tree) ─────────────────────────────────────
        'Air Adept':      { type: 'advanced', parentClass: 'Psychic',      description: 'Controls wind and atmospheric phenomena.',                        skillPool: ['Acrobatics', 'Nature'] },
        'Earth Shaker':   { type: 'advanced', parentClass: 'Psychic',      description: 'Commands seismic and ground forces.',                             skillPool: ['Concentration', 'Constitution'] },
        'Firebreather':   { type: 'advanced', parentClass: 'Psychic',      description: 'Channels fire energy through psychic force.',                    skillPool: ['Concentration', 'Perform'] },
        'Hex Maniac':     { type: 'advanced', parentClass: 'Psychic',      description: 'Specializes in curses, hexes, and dark energy.',                 skillPool: ['Bluff/Deception', 'Sleight of Hand'] },
        'Rain Waker':     { type: 'advanced', parentClass: 'Psychic',      description: 'Commands water and weather patterns.',                            skillPool: ['Concentration', 'Perform'] }
    },

    // Minimal features
    features: {},

    // Species-specific Z-Moves (full data in pta-game-data.min.json)
    uniqueZMoves: {},

    // Gigantamax-capable species and their G-Max moves (full data in pta-game-data.min.json)
    gigantamaxForms: {},

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

    // Minimal fallback items — full item database is loaded from pta-game-data.min.json
    items: {
        'Potion':     { type: 'healing', effect: 'Heals 10 HP', price: 25 },
        'Poke Ball':  { type: 'ball',    effect: '+5 to capture roll (standard ball)', price: 100, modifier: 5 },
        'Great Ball': { type: 'ball',    effect: '+0 to capture roll', price: 600, modifier: 0 },
        'Ultra Ball': { type: 'ball',    effect: '-5 from capture roll', price: 1000, modifier: -5 },
        // ── Armor (Combat Wear) ──────────────────────────────────────────────
        'Chainmail':        { type: 'armor', effect: '+1 DEF on accuracy checks made against you. (10 lbs)', price: 1250 },
        'Full Plate Armor': { type: 'armor', effect: '+2 DEF on accuracy checks, −10ft movement. (20 lbs)', price: 3450 },
        'Heavy Full Plate': { type: 'armor', effect: '+3 DEF on accuracy checks, −20ft movement. (50 lbs)', price: 9650 },
        'Nimble Spandex':   { type: 'armor', effect: '+1 SDEF on accuracy checks made against you. (1 lb)', price: 1250 },
        // ── Skill-Boosting Clothing ──────────────────────────────────────────
        'Ninja Tabi':          { type: 'clothing', effect: '+2 Acrobatics', price: 800, skillBonus: { skill: 'Acrobatics', bonus: 2 } },
        'Bracing Sleeves':     { type: 'clothing', effect: '+2 Athletics', price: 800, skillBonus: { skill: 'Athletics', bonus: 2 } },
        'Domino Mask':         { type: 'clothing', effect: '+2 Bluff/Deception', price: 800, skillBonus: { skill: 'Bluff/Deception', bonus: 2 } },
        'Pyramid Hat':         { type: 'clothing', effect: '+2 Concentration', price: 800, skillBonus: { skill: 'Concentration', bonus: 2 } },
        'Padded Jacket':       { type: 'clothing', effect: '+2 Constitution', price: 800, skillBonus: { skill: 'Constitution', bonus: 2 } },
        'Fine Ascot':          { type: 'clothing', effect: '+2 Diplomacy/Persuasion', price: 800, skillBonus: { skill: 'Diplomacy/Persuasion', bonus: 2 } },
        'Fingerless Gloves':   { type: 'clothing', effect: '+2 Engineering/Operation', price: 800, skillBonus: { skill: 'Engineering/Operation', bonus: 2 } },
        'Grand Monocle':       { type: 'clothing', effect: '+2 History', price: 800, skillBonus: { skill: 'History', bonus: 2 } },
        'Cozy Scarf':          { type: 'clothing', effect: '+2 Insight', price: 800, skillBonus: { skill: 'Insight', bonus: 2 } },
        'Wrist Magnifier':     { type: 'clothing', effect: '+2 Investigate', price: 800, skillBonus: { skill: 'Investigate', bonus: 2 } },
        'New Stethoscope':     { type: 'clothing', effect: '+2 Medicine', price: 800, skillBonus: { skill: 'Medicine', bonus: 2 } },
        'Field Boots':         { type: 'clothing', effect: '+2 Nature', price: 800, skillBonus: { skill: 'Nature', bonus: 2 } },
        'Tech Visor':          { type: 'clothing', effect: '+2 Perception', price: 800, skillBonus: { skill: 'Perception', bonus: 2 } },
        'Baller Hacky Sack':   { type: 'clothing', effect: '+2 Perform', price: 800, skillBonus: { skill: 'Perform', bonus: 2 } },
        'Soft Brush':          { type: 'clothing', effect: '+2 Pokémon Handling', price: 800, skillBonus: { skill: 'Pokémon Handling', bonus: 2 } },
        'AR Goggles':          { type: 'clothing', effect: '+2 Programming', price: 800, skillBonus: { skill: 'Programming', bonus: 2 } },
        'Loose Overcoat':      { type: 'clothing', effect: '+2 Sleight of Hand', price: 800, skillBonus: { skill: 'Sleight of Hand', bonus: 2 } },
        'Silent Sneakers':     { type: 'clothing', effect: '+2 Stealth', price: 800, skillBonus: { skill: 'Stealth', bonus: 2 } },
        // ── Weapons ─────────────────────────────────────────────────────────
        'Wood Staff':  { type: 'weapon', effect: 'Branch Poke — Melee Grass At-Will 2d6. Requires Weapons Master.', price: 200 },
        'Stone Fist':  { type: 'weapon', effect: 'Stone Smash — Melee Rock At-Will 2d6. Requires Weapons Master.', price: 200 },
        'Steel Blade': { type: 'weapon', effect: 'Steel Strike — Melee Steel At-Will 2d6. Requires Weapons Master.', price: 300 }
    }
};

// Function to update GAME_DATA (needed because it's exported as let)
export const updateGameData = (newData) => {
    Object.assign(GAME_DATA, newData);
};
