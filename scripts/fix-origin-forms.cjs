// One-time fixup: rename Altered Form entries and attach Origin Forms as megaForms
const fs = require('fs');
const path = require('path');

const POKEDEX = path.join(__dirname, '..', 'pokedex.min.json');
const data = JSON.parse(fs.readFileSync(POKEDEX, 'utf8'));
const pokemon = data.pokemon;

const REMAP = {
    'Dialga Altered Form': 'Dialga',
    'Palkia Altered Form': 'Palkia',
    'Giratina Altered Form': 'Giratina',
};
const ORIGIN_TO_BASE = {
    'Dialga Origin Form': 'Dialga',
    'Palkia Origin Form': 'Palkia',
    'Giratina Origin Form': 'Giratina',
};

// Rename altered forms to canonical base species names
for (const entry of pokemon) {
    const newName = REMAP[entry.species];
    if (newName) {
        console.log('Renamed:', entry.species, '->', newName);
        entry.species = newName;
    }
}

// Attach origin forms as megaForms on their base species, then remove standalone
for (const [originName, baseName] of Object.entries(ORIGIN_TO_BASE)) {
    const origin = pokemon.find(p => p.species === originName);
    const base   = pokemon.find(p => p.species === baseName);
    if (!origin || !base) { console.log('MISSING:', originName, 'or', baseName); continue; }
    if (!base.megaForms) base.megaForms = [];
    base.megaForms.push({
        name: 'Origin Form',
        types: origin.types,
        stats: origin.stats,
        speedFt: origin.speedFt,
    });
    pokemon.splice(pokemon.indexOf(origin), 1);
    console.log('Attached', originName, '-> megaForms on', baseName, '(total forms:', base.megaForms.length + ')');
}

data.lastUpdated = '2026-03-08';
fs.writeFileSync(POKEDEX, JSON.stringify(data, null, 0), 'utf8');
console.log('Done. Total entries:', data.pokemon.length);
