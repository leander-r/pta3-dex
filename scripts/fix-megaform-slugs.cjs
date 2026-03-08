// One-time fixup: add explicit Showdown sprite slugs to megaForms where the
// auto-derived slug doesn't match Pokémon Showdown's naming convention.
const fs   = require('fs');
const path = require('path');

const POKEDEX = path.join(__dirname, '..', 'pokedex.min.json');
const data    = JSON.parse(fs.readFileSync(POKEDEX, 'utf8'));
const pokemon = data.pokemon;

// [ species, formName, showdownSlug ]
const SLUG_OVERRIDES = [
    // Forces of Nature — "Therian Form" → therian
    ['Tornadus',  'Therian Form', 'therian'],
    ['Thundurus', 'Therian Form', 'therian'],
    ['Landorus',  'Therian Form', 'therian'],
    ['Enamorus',  'Therian Form', 'therian'],
    // Shaymin sky form
    ['Shaymin',   'Sky Form',     'sky'],
    // Meloetta pirouette form
    ['Meloetta',  'Pirouette Form', 'pirouette'],
    // Terapagos Terastal (Tera Form)
    ['Terapagos', 'Tera Form',    'terastal'],
    // Kyurem fusions
    ['Kyurem',    'Black Kyurem', 'black'],
    ['Kyurem',    'White Kyurem', 'white'],
    // Necrozma Ultra Burst
    ['Necrozma',  'Ultra Mantle', 'ultra'],
    // Deoxys alternate forms
    ['Deoxys',    'Attack Form',  'attack'],
    ['Deoxys',    'Defense Form', 'defense'],
    ['Deoxys',    'Speed Form',   'speed'],
    // Groudon and Kyogre Primal
    ['Groudon',   'Primal Reversion', 'primal'],
    ['Kyogre',    'Primal Reversion', 'primal'],
    // Remote Isles (Galarian) birds
    ['Articuno',  'Remote Isles', 'galar'],
    ['Zapdos',    'Remote Isles', 'galar'],
    ['Moltres',   'Remote Isles', 'galar'],
    // Calyrex riders
    ['Calyrex',   'Ice Rider',    'ice'],
    ['Calyrex',   'Shadow Rider', 'shadow'],
    // Dialga / Palkia / Giratina Origin Forms
    ['Dialga',    'Origin Form',  'origin'],
    ['Palkia',    'Origin Form',  'origin'],
    ['Giratina',  'Origin Form',  'origin'],
];

let changed = 0;
for (const [species, formName, slug] of SLUG_OVERRIDES) {
    const entry = pokemon.find(p => p.species === species);
    if (!entry) { console.warn('MISSING species:', species); continue; }
    const form = (entry.megaForms || []).find(f => f.name === formName);
    if (!form) { console.warn('MISSING megaForm', formName, 'on', species); continue; }
    form.slug = slug;
    console.log('slug set:', species, '+', formName, '→', slug);
    changed++;
}

data.lastUpdated = '2026-03-08';
fs.writeFileSync(POKEDEX, JSON.stringify(data, null, 0), 'utf8');
console.log('\nDone. Slug overrides added:', changed);
