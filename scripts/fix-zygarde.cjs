// One-time fixup: replace "Zygarde Complete" standalone entry with a proper
// "Zygarde" entry (10% form as default) + 50% and Complete as megaForms.
const fs   = require('fs');
const path = require('path');

const POKEDEX = path.join(__dirname, '..', 'pokedex.min.json');
const data    = JSON.parse(fs.readFileSync(POKEDEX, 'utf8'));
const pokemon = data.pokemon;

const idx = pokemon.findIndex(p => p.species === 'Zygarde Complete');
if (idx === -1) throw new Error('Zygarde Complete not found');

pokemon[idx] = {
    species:   'Zygarde',
    types:     ['Dragon', 'Ground'],
    size:      'Large',
    stats:     { hp: 60, atk: 12, def: 8, satk: 6, sdef: 9, spd: 12 },
    speedFt:   60,
    legendary: true,
    rarity:    'legendary',
    megaForms: [
        {
            name:     '50%',
            fullSlug: 'zygarde',   // Showdown "zygarde" = 50% form
            types:    ['Dragon', 'Ground'],
            stats:    { hp: 600, atk: 12, def: 13, satk: 8, sdef: 10, spd: 10 },
            speedFt:  50,
        },
        {
            name:   'Complete',
            slug:   'complete',    // → zygarde-complete
            types:  ['Dragon', 'Ground'],
            stats:  { hp: 1800, atk: 12, def: 13, satk: 9, sdef: 10, spd: 9 },
            speedFt: 45,
        },
    ],
};

console.log('Replaced Zygarde Complete → Zygarde (10% base + 50% + Complete megaForms)');

data.lastUpdated = '2026-03-08';
fs.writeFileSync(POKEDEX, JSON.stringify(data, null, 0), 'utf8');
console.log('Total entries:', pokemon.length);
