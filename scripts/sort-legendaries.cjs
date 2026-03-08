// One-time fixup: reorder legendary entries in pokedex.min.json to match
// the order they appear in the PTA3 Game Master's Guide (derived from legendaries_debug.txt).
const fs   = require('fs');
const path = require('path');

const POKEDEX = path.join(__dirname, '..', 'pokedex.min.json');
const data    = JSON.parse(fs.readFileSync(POKEDEX, 'utf8'));
const pokemon = data.pokemon;

// Canonical GMG order (debug entries mapped to current species names).
// Mega/form-only debug entries are skipped since they're now megaForms.
// Entries added manually (Forces of Nature, Remote Isles birds) are
// inserted next to their closest relatives in the GMG sequence.
const GMG_ORDER = [
    'Type: Null', 'Silvally', 'Genesect', 'Mewtwo',
    'Great Tusk', 'Brute Bonnet', 'Slither Wing', 'Roaring Moon',
    'Iron Bundle', 'Iron Jugulis', 'Iron Thorns',
    'Pheromosa', 'Kartana', 'Blacephalon',
    // Galarian birds first (GMG "Articuno" = Remote Isles), Kanto paired alongside
    'Articuno', 'Articuno (Remote Isles)',
    'Zapdos', 'Zapdos (Remote Isles)',
    'Moltres', 'Moltres (Remote Isles)',
    'Raikou', 'Suicune',
    'Tapu Lele', 'Tapu Fini',
    'Wo-Chien', 'Ting-Lu',
    'Cobalion', 'Virizion',
    // Forces of Nature (GMG had "Incarnate Form" = Thundurus area)
    'Tornadus', 'Thundurus', 'Landorus', 'Enamorus',
    'Latias',
    'Regirock', 'Registeel', 'Regidrago',
    'Uxie', 'Azelf',
    'Heatran',
    'Ho-oh',
    'Okidogi', 'Fezandipiti',
    'Terapagos',
    'Phione', 'Celebi', 'Jirachi', 'Marshadow',
    'Meloetta',  // renamed from "Aria Form"
    'Diancie', 'Zarude',
    'Walking Wake', 'Raging Bolt', 'Iron Boulder',
    'Koraidon',
    'Glastrier', 'Calyrex', 'Kubfu',
    'Urshifu Single Strike',
    'Meltan',
    'Hoopa', 'Deoxys', 'Darkrai',
    'Zacian',
    'Cosmog', 'Cosmoem', 'Lunala', 'Necrozma',
    'Kyogre', 'Reshiram', 'Kyurem', 'Xerneas',
    'Dialga', 'Palkia', 'Giratina',
    'Eternatus', 'Arceus',
    'Magearna', 'Mew',
    'Scream Tail', 'Flutter Mane', 'Sandy Shocks',
    'Iron Treads', 'Iron Hands', 'Iron Moth', 'Iron Valiant',
    'Nihilego', 'Xurkitree', 'Guzzlord', 'Poipole',
    'Entei',
    'Tapu Koko', 'Tapu Bulu',
    'Chien-Pao', 'Chi-Yu',
    'Terrakion', 'Keldeo',
    'Latios',
    'Regice', 'Regieleki', 'Regigigas',
    'Mesprit', 'Volcanion',
    'Lugia',
    'Munkidori', 'Pecharunt',
    'Ogerpon',
    'Manaphy', 'Victini',
    'Shaymin',  // renamed from "Land Form"
    'Zeraora',
    'Iron Leaves', 'Iron Crown',
    'Miraidon', 'Spectrier',
    'Urshifu Rapid Strike',
    'Cresselia', 'Zamazenta', 'Solgaleo',
    'Groudon', 'Rayquaza', 'Zekrom',
    'Yveltal',
    'Zygarde Complete',
];

const orderMap = new Map(GMG_ORDER.map((name, i) => [name, i]));

// Separate non-legendary and legendary entries
const nonLegendary = pokemon.filter(p => !p.legendary);
const legendary    = pokemon.filter(p => p.legendary);

// Sort legendary entries: known GMG order first, then unknowns alphabetically
legendary.sort((a, b) => {
    const ia = orderMap.has(a.species) ? orderMap.get(a.species) : Infinity;
    const ib = orderMap.has(b.species) ? orderMap.get(b.species) : Infinity;
    if (ia !== ib) return ia - ib;
    return a.species.localeCompare(b.species);
});

// Verify: log entries not in GMG order list
const unlisted = legendary.filter(p => !orderMap.has(p.species));
if (unlisted.length) {
    console.log('Unlisted legendaries (placed at end):', unlisted.map(p => p.species).join(', '));
}

// Reconstruct array: non-legendary first, then sorted legendaries
data.pokemon = [...nonLegendary, ...legendary];
data.lastUpdated = '2026-03-08';

fs.writeFileSync(POKEDEX, JSON.stringify(data, null, 0), 'utf8');

// Print final legendary order for verification
console.log('\nLegendary order after sort:');
data.pokemon.filter(p => p.legendary).forEach((p, i) => {
    console.log(`  ${String(i + 1).padStart(3)}. ${p.species}`);
});
console.log('\nTotal entries:', data.pokemon.length);
