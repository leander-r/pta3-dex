// ============================================================
// Gym Leader / Elite Four Pokémon passives (GMG "Encounter Building")
// Shared between GymLeaderGuide.jsx (reference list) and NpcRoster.jsx
// (tagging an NPC's team Pokémon with them).
// ============================================================

export const GYM_STAT_PASSIVES = [
    { name: 'Gym Anchor',   effect: '+2 Defense, +2 Special Defense' },
    { name: 'Gym Blaster',  effect: '+2 Special Attack, +2 Special Defense' },
    { name: 'Gym Knight',   effect: '+2 Attack, +2 Defense' },
    { name: 'Gym Striker',  effect: '+3 Attack OR +3 Special Attack' },
    { name: "Gym Leader's", effect: '+1 Defense, +1 Special Defense' },
];

export const GYM_ABILITY_PASSIVES = [
    { name: 'Healing Opportunist',   effect: 'First medicine item use each battle can be used before or after your turn in the same round.' },
    { name: 'Home Field Advantage',  effect: "While battling in your trainer's League Gym, move +10 ft per round." },
    { name: 'Rallied Gym Defenders', effect: "While adjacent to a gym trainer's Pokémon, +1 Defense and +1 Special Defense." },
];

export const GYM_TRAINER_FEATURES = [
    { name: "I'll Show You Our True Power!", freq: '1/day', effect: 'Your final Pokémon gets +2 to all stats for 10 minutes.' },
    { name: "Give it All We've Got!",        freq: '1/day', effect: 'Your Pokémon deals an additional 2d6 damage on one attack.' },
    { name: "We're Not Done Yet!",           freq: '1/day', effect: 'Your Pokémon takes 10 less damage when hit by one attack.' },
];

export const ELITE_STAT_PASSIVES = [
    { name: "Elite's",       effect: '+2 Defense, +2 Special Defense, +1 Speed' },
    { name: 'Elite Striker', effect: '+4 Attack OR +4 Special Attack; +1 Speed' },
    { name: 'Elite Wall',    effect: '+4 Defense OR +4 Special Defense; +1 Speed' },
];

export const ELITE_ABILITY_PASSIVES = [
    { name: 'Battle Rush',      effect: 'While above half max HP, move +15 ft per round.' },
    { name: 'Healing Adept',    effect: 'First medicine item each battle usable before/after turn; also grants +6 temporary HP.' },
    { name: 'No Faults',        effect: 'First immunity-ignored attack per battle is treated as shielded instead.' },
    { name: 'Subvert Weakness', effect: 'First super-effective/extremely-effective hit per battle: attacker adds one less damage die.' },
];
