// ============================================================
// Build consolidated GAME_DATA.moves catalog from pokedex.min.json
// ============================================================
// The pokedex stores moves per-species (levelUpMoves/moves array), but the
// "Browse Moves" add-move UI and the Moves reference tab read from a single
// global GAME_DATA.moves catalog, which was left as a 5-entry stub. This
// script consolidates every unique move referenced across the pokedex into
// one canonical entry per move name and merges it into pta-game-data.min.json.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const POKEDEX_PATH = path.join(ROOT, 'pokedex.min.json');
const GAME_DATA_PATH = path.join(ROOT, 'pta-game-data.min.json');

const ACCURACY_TO_CATEGORY = {
    Attack: 'Physical',
    Special: 'Special',
    Effect: 'Status'
};

function mode(values) {
    const counts = new Map();
    for (const v of values) {
        if (v === null || v === undefined) continue;
        counts.set(v, (counts.get(v) || 0) + 1);
    }
    let best = null, bestCount = -1;
    for (const [v, c] of counts) {
        if (c > bestCount) { best = v; bestCount = c; }
    }
    return best;
}

const pokedexRaw = JSON.parse(fs.readFileSync(POKEDEX_PATH, 'utf8'));
const species = pokedexRaw.pokemon || pokedexRaw;

const byName = new Map();
for (const p of species) {
    const moveList = p.moves || p.levelUpMoves || [];
    for (const m of moveList) {
        const name = m.name || m.move;
        if (!name) continue;
        if (!byName.has(name)) byName.set(name, []);
        const category = m.category || ACCURACY_TO_CATEGORY[m.accuracyType] || null;
        byName.get(name).push({
            type: m.type || null,
            category,
            frequency: m.frequency || null,
            damage: m.damage || null,
            range: m.range || null,
            effect: m.effect || null
        });
    }
}

const catalog = {};
for (const [name, entries] of byName) {
    catalog[name] = {
        type: mode(entries.map(e => e.type)) || 'Normal',
        category: mode(entries.map(e => e.category)) || 'Status',
        frequency: mode(entries.map(e => e.frequency)) || 'At-Will',
        damage: mode(entries.map(e => e.damage)),
        range: mode(entries.map(e => e.range)) || 'Melee',
        effect: mode(entries.map(e => e.effect))
    };
}

const sortedNames = Object.keys(catalog).sort((a, b) => a.localeCompare(b));
const sortedCatalog = {};
for (const name of sortedNames) sortedCatalog[name] = catalog[name];

console.log(`Consolidated ${sortedNames.length} unique moves from ${species.length} pokedex entries.`);

const gameData = JSON.parse(fs.readFileSync(GAME_DATA_PATH, 'utf8'));
const previousCount = Object.keys(gameData.moves || {}).length;
gameData.moves = sortedCatalog;
gameData.lastUpdated = new Date().toISOString().slice(0, 10);

fs.writeFileSync(GAME_DATA_PATH, JSON.stringify(gameData));
console.log(`pta-game-data.min.json: moves ${previousCount} -> ${sortedNames.length}`);
