// One-time fixup: convert Remote Isles birds from megaForms to standalone regional entries.
const fs   = require('fs');
const path = require('path');

const POKEDEX = path.join(__dirname, '..', 'pokedex.min.json');
const data    = JSON.parse(fs.readFileSync(POKEDEX, 'utf8'));
const pokemon = data.pokemon;

const BIRDS = ['Articuno', 'Zapdos', 'Moltres'];

for (const name of BIRDS) {
    const base = pokemon.find(p => p.species === name);
    if (!base) { console.error('NOT FOUND:', name); continue; }

    const formIdx = (base.megaForms || []).findIndex(f => f.name === 'Remote Isles');
    if (formIdx === -1) { console.warn('No Remote Isles megaForm on', name); continue; }

    const [form] = base.megaForms.splice(formIdx, 1);
    if (base.megaForms.length === 0) delete base.megaForms;

    const regionalEntry = {
        species:   `${name} (Remote Isles)`,
        types:     form.types,
        size:      base.size,
        stats:     form.stats,
        speedFt:   form.speedFt,
        legendary: true,
        rarity:    'legendary',
    };
    pokemon.push(regionalEntry);
    console.log('Converted megaForm → standalone:', regionalEntry.species);
}

data.lastUpdated = '2026-03-08';
fs.writeFileSync(POKEDEX, JSON.stringify(data, null, 0), 'utf8');
console.log('Done. Total entries:', pokemon.length);
