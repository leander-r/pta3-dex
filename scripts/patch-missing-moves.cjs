// ============================================================
// Patch missing moves for 12 legendary/special Pokémon
// ============================================================
'use strict';

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'pokedex.min.json');
const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

// Move format: { name, range, type, category (Physical/Special/Status), frequency, damage, effect }
const PATCHES = {
  'Tornadus': [
    { name: 'Air Slash', range: 'Ranged(15ft)', type: 'Flying', category: 'Special', frequency: '1/day', damage: '3d12', effect: 'Air Slash has -1 during Accuracy Check. On hit, if you got 14 or higher on Accuracy Check, the target is Stunned.' },
    { name: 'Dark Pulse', range: 'Ranged(10ft)', type: 'Dark', category: 'Special', frequency: '3/day', damage: '3d10', effect: 'On hit, if you got 16 or higher on Accuracy Check, the target is Stunned.' },
    { name: 'Revenge', range: 'Melee', type: 'Fighting', category: 'Physical', frequency: '3/day', damage: '3d8', effect: 'If you were attacked by the target this round, use 3d12 for damage instead.' },
    { name: 'Thrash', range: 'Melee', type: 'Normal', category: 'Physical', frequency: '1/day', damage: '5d12', effect: 'Two-turn move. On each turn, move to the closest character within 25 ft that you can reach, and roll this move\'s Accuracy Check and damage against them. After your second turn you are Confused.' },
    { name: 'Hurricane', range: 'Ranged(25ft, 10ft blast)', type: 'Flying', category: 'Special', frequency: '1/day', damage: '5d12', effect: 'Hurricane has -2 during Accuracy Check unless it\'s Raining. On hit, if you got 14 or higher on Accuracy Check, the targets are Confused.' },
  ],
  'Thundurus': [
    { name: 'Shock Wave', range: 'Ranged(20ft)', type: 'Electric', category: 'Special', frequency: '3/day', damage: '3d8', effect: 'You can\'t miss targets with less than 15 Special Defense.' },
    { name: 'Dark Pulse', range: 'Ranged(10ft)', type: 'Dark', category: 'Special', frequency: '3/day', damage: '3d10', effect: 'On hit, if you got 16 or higher on Accuracy Check, the target is Stunned.' },
    { name: 'Revenge', range: 'Melee', type: 'Fighting', category: 'Physical', frequency: '3/day', damage: '3d8', effect: 'If you were attacked by the target this round, use 3d12 for damage instead.' },
    { name: 'Thrash', range: 'Melee', type: 'Normal', category: 'Physical', frequency: '1/day', damage: '5d12', effect: 'Two-turn move. On each turn, move to the closest character within 25 ft that you can reach, and roll this move\'s Accuracy Check and damage against them. After your second turn you are Confused.' },
    { name: 'Thunder', range: 'Ranged(30ft, 5ft blast)', type: 'Electric', category: 'Special', frequency: '1/day', damage: '5d12', effect: 'Thunder has -2 during Accuracy Check unless it\'s Raining. On hit, if you got 14 or higher on Accuracy Check, the targets are Paralyzed.' },
  ],
  'Landorus': [
    { name: 'Extrasensory', range: 'Ranged(10ft)', type: 'Psychic', category: 'Special', frequency: '3/day', damage: '3d10', effect: 'On hit, if you got 18 or higher on Accuracy Check, the target is Stunned.' },
    { name: 'Rock Slide', range: 'Ranged(20ft, 10ft wave)', type: 'Rock', category: 'Physical', frequency: '1/day', damage: '5d12', effect: 'Rock Slide has -2 during Accuracy Check. On hit, if you got 14 or higher on Accuracy Check, the target is Stunned.' },
    { name: 'Earthquake', range: 'Ranged(30ft burst)', type: 'Ground', category: 'Physical', frequency: '1/day', damage: '3d12', effect: null },
    { name: 'Stone Edge', range: 'Ranged(25ft)', type: 'Rock', category: 'Physical', frequency: '1/day', damage: '5d12', effect: 'Stone Edge has -2 during Accuracy Check. On hit, if you got 18 or higher on Accuracy Check, Stone Edge is a critical hit.' },
    { name: 'Outrage', range: 'Melee', type: 'Dragon', category: 'Physical', frequency: '1/day', damage: '5d12', effect: 'Two-turn move. On each turn, move to the closest character within 25 ft that you can reach, and roll this move\'s Accuracy Check and damage against them. After your second turn you are Confused.' },
  ],
  'Enamorus': [
    { name: 'Extrasensory', range: 'Ranged(10ft)', type: 'Psychic', category: 'Special', frequency: '3/day', damage: '3d10', effect: 'On hit, if you got 18 or higher on Accuracy Check, the target is Stunned.' },
    { name: 'Draining Kiss', range: 'Melee', type: 'Fairy', category: 'Special', frequency: '3/day', damage: '2d8', effect: 'On hit, you regain HP equal to half of the damage dealt.' },
    { name: 'Crunch', range: 'Melee', type: 'Dark', category: 'Physical', frequency: '3/day', damage: '3d10', effect: 'On hit, the target\'s Defense is -1 for 10 mins.' },
    { name: 'Moonblast', range: 'Ranged(20ft)', type: 'Fairy', category: 'Special', frequency: '3/day', damage: '3d10', effect: 'On hit, the target\'s Special Attack is -1 for 10 mins.' },
    { name: 'Hyper Beam', range: 'Ranged(25ft beam)', type: 'Normal', category: 'Special', frequency: '1/day', damage: '5d20', effect: 'Hyper Beam has a recharge turn and -2 during Accuracy Check.' },
  ],
  'Regieleki': [
    { name: 'Stomp', range: 'Melee', type: 'Normal', category: 'Physical', frequency: 'At-Will', damage: '2d8', effect: 'On hit, if you got 18 or higher on Accuracy Check, the target is Stunned.' },
    { name: 'Thunder Shock', range: 'Ranged(20ft)', type: 'Electric', category: 'Special', frequency: 'At-Will', damage: '1d12', effect: 'On hit, if you got 18 or higher on Accuracy Check, the target is Paralyzed.' },
    { name: 'Thunder', range: 'Ranged(30ft, 5ft blast)', type: 'Electric', category: 'Special', frequency: '1/day', damage: '5d12', effect: 'Thunder has -2 during Accuracy Check unless it\'s Raining. On hit, if you got 14 or higher on Accuracy Check, the targets are Paralyzed.' },
    { name: 'Hyper Beam', range: 'Ranged(25ft beam)', type: 'Normal', category: 'Special', frequency: '1/day', damage: '5d20', effect: 'Hyper Beam has a recharge turn and -2 during Accuracy Check.' },
    { name: 'Thunder Cage', range: 'Ranged(50ft burst)', type: 'Electric', category: 'Special', frequency: '1/day', damage: '3d8', effect: 'On hit, all targets are bound to ground for 1d4 turns. For each turn the target is bound, it takes 1d6 damage.' },
  ],
  'Pecharunt': [
    { name: 'Mean Look', range: 'Ranged(10ft)', type: 'Normal', category: 'Status', frequency: '1/day', damage: null, effect: 'On hit, the target is bound in place for 2 mins. Ghost Pokémon are immune to Mean Look.' },
    { name: 'Night Shade', range: 'Ranged(20ft)', type: 'Ghost', category: 'Special', frequency: '3/day', damage: '20', effect: 'Do not add bonuses of any kind to this damage.' },
    { name: 'Shadow Ball', range: 'Ranged(20ft)', type: 'Ghost', category: 'Special', frequency: '3/day', damage: '3d10', effect: 'On hit, the target\'s Special Defense is -1 for 10 mins.' },
    { name: 'Recover', range: 'Self', type: 'Normal', category: 'Status', frequency: '1/day', damage: null, effect: 'You are healed HP equal to half of your Max HP.' },
  ],
  'Hoopa': [
    { name: 'Astonish', range: 'Melee', type: 'Ghost', category: 'Physical', frequency: 'At-Will', damage: '1d10', effect: 'On hit, if you got 19 or higher on Accuracy Check, the target is Stunned.' },
    { name: 'Shadow Ball', range: 'Ranged(20ft)', type: 'Ghost', category: 'Special', frequency: '3/day', damage: '3d10', effect: 'On hit, the target\'s Special Defense is -1 for 10 mins.' },
    { name: 'Dark Pulse', range: 'Ranged(10ft)', type: 'Dark', category: 'Special', frequency: '3/day', damage: '3d10', effect: 'On hit, if you got 16 or higher on Accuracy Check, the target is Stunned.' },
    { name: 'Psychic', range: 'Ranged(25ft)', type: 'Psychic', category: 'Special', frequency: '3/day', damage: '3d10', effect: 'On hit, the target\'s Special Defense is -1 for 10 mins.' },
    { name: 'Phantom Force', range: 'Melee', type: 'Ghost', category: 'Physical', frequency: '1/day', damage: '3d12', effect: 'Two-turn move. On the first turn, disappear from the battlefield. On the second turn, reappear anywhere within 25 ft of where you vanished, move up to twice your movement speed, and roll Phantom Force\'s Accuracy Check and damage.' },
  ],
  'Articuno (Remote Isles)': [
    { name: 'Confusion', range: 'Ranged(10ft)', type: 'Psychic', category: 'Special', frequency: 'At-Will', damage: '1d12', effect: 'On hit, if you got 19 or higher on Accuracy Check, the target is Confused.' },
    { name: 'Hypnosis', range: 'Ranged(10ft)', type: 'Psychic', category: 'Status', frequency: '3/day', damage: null, effect: 'Hypnosis has -4 during Accuracy Check. On hit, the target is put Asleep.' },
    { name: 'Hurricane', range: 'Ranged(25ft, 10ft blast)', type: 'Flying', category: 'Special', frequency: '1/day', damage: '5d12', effect: 'Hurricane has -2 during Accuracy Check unless it\'s Raining. On hit, if you got 14 or higher on Accuracy Check, the targets are Confused.' },
    { name: 'Recover', range: 'Self', type: 'Normal', category: 'Status', frequency: '1/day', damage: null, effect: 'You are healed HP equal to half of your Max HP.' },
    { name: 'Freezing Glare', range: 'Ranged(20ft)', type: 'Psychic', category: 'Special', frequency: '3/day', damage: '3d10', effect: 'On hit, if you got 18 or higher on Accuracy Check, the target is Frozen.' },
  ],
  'Zapdos (Remote Isles)': [
    { name: 'Drill Peck', range: 'Melee', type: 'Flying', category: 'Physical', frequency: '3/day', damage: '3d10', effect: null },
    { name: 'Detect', range: 'Self', type: 'Fighting', category: 'Status', frequency: '1/day', damage: null, effect: 'Reaction. When you would be hit by a move, use Detect to instead ignore the damage and any effects of the attack.' },
    { name: 'Brick Break', range: 'Melee', type: 'Fighting', category: 'Physical', frequency: '3/day', damage: '3d8', effect: 'Destroy any Walls within 5 ft.' },
    { name: 'Close Combat', range: 'Melee', type: 'Fighting', category: 'Physical', frequency: '1/day', damage: '5d12', effect: 'On hit, your Defense and Special Defense are -2 for 10 mins.' },
    { name: 'Thunderous Kick', range: 'Melee', type: 'Fighting', category: 'Physical', frequency: '1/day', damage: '5d12', effect: 'On hit, the target\'s Defense is -1 for 10 mins.' },
  ],
  'Moltres (Remote Isles)': [
    { name: 'Sucker Punch', range: 'Melee', type: 'Dark', category: 'Physical', frequency: '1/day', damage: '3d8', effect: 'Reaction. When you are a target of a melee move, use Sucker Punch to attack the attacker before the enemy rolls their Accuracy Check against you.' },
    { name: 'Air Slash', range: 'Ranged(15ft)', type: 'Flying', category: 'Special', frequency: '1/day', damage: '3d12', effect: 'Air Slash has -1 during Accuracy Check. On hit, if you got 14 or higher on Accuracy Check, the target is Stunned.' },
    { name: 'Hurricane', range: 'Ranged(25ft, 10ft blast)', type: 'Flying', category: 'Special', frequency: '1/day', damage: '5d12', effect: 'Hurricane has -2 during Accuracy Check unless it\'s Raining. On hit, if you got 14 or higher on Accuracy Check, the targets are Confused.' },
    { name: 'Endure', range: 'Self', type: 'Normal', category: 'Status', frequency: '1/day', damage: null, effect: 'Reaction. If you would be hit by an attack that would knock you out, use Endure to instead be left with 1 HP.' },
    { name: 'Fiery Wrath', range: 'Ranged(20ft)', type: 'Dark', category: 'Special', frequency: '3/day', damage: '3d10', effect: 'On hit, if you got 16 or higher on Accuracy Check, the target is Stunned.' },
  ],
  'Shaymin': [
    { name: 'Magical Leaf', range: 'Ranged(25ft)', type: 'Grass', category: 'Special', frequency: '3/day', damage: '3d8', effect: 'You can\'t miss targets with less than 15 Special Defense.' },
    { name: 'Air Slash', range: 'Ranged(15ft)', type: 'Flying', category: 'Special', frequency: '1/day', damage: '3d12', effect: 'Air Slash has -1 during Accuracy Check. On hit, if you got 14 or higher on Accuracy Check, the target is Stunned.' },
    { name: 'Energy Ball', range: 'Ranged(20ft)', type: 'Grass', category: 'Special', frequency: '3/day', damage: '3d10', effect: 'On hit, the target\'s Special Defense is -1 for 10 mins.' },
    { name: 'Synthesis', range: 'Self', type: 'Grass', category: 'Status', frequency: '1/day', damage: null, effect: 'You are healed HP equal to half of your Max HP. If you are within Sunny Weather, you are healed HP equal to 3/4ths of your Max HP instead.' },
    { name: 'Seed Flare', range: 'Ranged(30ft, 10ft blast)', type: 'Grass', category: 'Special', frequency: '3/day', damage: '5d20', effect: 'On hit, all target\'s Special Defense is -5 for 10 mins.' },
  ],
  // Zygarde — represents 50% form (the main entry); lower form moves included since higher forms have access to them
  'Zygarde': [
    // 10% form moves
    { name: 'Bite', range: 'Melee', type: 'Dark', category: 'Physical', frequency: 'At-Will', damage: '2d8', effect: 'On hit, if you got 16 or higher on Accuracy Check, the target is Stunned.' },
    { name: 'Dig', range: 'Melee', type: 'Ground', category: 'Physical', frequency: '3/day', damage: '3d10', effect: 'Two-turn move. On the first turn, burrow up to 40 ft straight down. On the second turn, burrow up to your movement speed +40 ft, then roll Dig\'s Accuracy Check and damage.' },
    { name: 'Extreme Speed', range: 'Melee', type: 'Normal', category: 'Physical', frequency: '3/day', damage: '3d10', effect: 'Extreme Speed has Priority and cannot be contested for Priority.' },
    { name: 'Dragon Pulse', range: 'Ranged(10ft)', type: 'Dragon', category: 'Special', frequency: '3/day', damage: '3d10', effect: null },
    { name: 'Thousand Arrows', range: 'Ranged(40ft)', type: 'Ground', category: 'Physical', frequency: '3/day', damage: '3d10', effect: 'Thousand Arrows ignores any Ground-type immunities.' },
    // 50% form moves
    { name: 'Earthquake', range: 'Ranged(30ft burst)', type: 'Ground', category: 'Physical', frequency: '1/day', damage: '3d12', effect: null },
    { name: "Land's Wrath", range: 'Ranged(40ft)', type: 'Ground', category: 'Physical', frequency: '3/day', damage: '5d12', effect: null },
    // Complete form moves
    { name: 'Outrage', range: 'Melee', type: 'Dragon', category: 'Physical', frequency: '1/day', damage: '5d12', effect: 'Two-turn move. On each turn, move to the closest character within 25 ft that you can reach, and roll this move\'s Accuracy Check and damage against them. After your second turn you are Confused.' },
    { name: 'Thousand Waves', range: 'Ranged(40ft, 10ft wave)', type: 'Ground', category: 'Physical', frequency: '3/day', damage: '3d12', effect: 'On hit, all targets are bound to the ground for 10 mins. Thousand Waves ignores any Ground-type immunities.' },
    { name: 'Core Enforcer', range: 'Ranged(40ft, 10ft blast)', type: 'Dragon', category: 'Special', frequency: '3/day', damage: '3d12', effect: 'If any targets acted before you this turn, they lose all ability passives for 10 mins.' },
  ],
};

let patchCount = 0;
for (const [species, moves] of Object.entries(PATCHES)) {
  const entry = data.pokemon.find(p => p.species === species);
  if (!entry) {
    console.warn('WARNING: species not found: ' + species);
    continue;
  }
  entry.moves = moves;
  patchCount++;
  console.log(`✓ Patched ${species} with ${moves.length} moves`);
}

data.lastUpdated = new Date().toISOString().split('T')[0];
fs.writeFileSync(DATA_PATH, JSON.stringify(data));
console.log(`\nDone. Patched ${patchCount} entries. File saved.`);
