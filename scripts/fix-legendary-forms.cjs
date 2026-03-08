// ============================================================
// One-time fixup: correct legendary Pokémon forms in pokedex.min.json
//
// Changes applied:
//  1. Remove "Incarnate Form" garbage entry; add Tornadus/Thundurus/Landorus/Enamorus
//     with their Therian forms as megaForms
//  2. Rename "Land Form" → Shaymin; attach "Sky Form" as megaForm; remove Sky Form standalone
//  3. Rename "Aria Form" → Meloetta; attach "Pirouette Form" as megaForm; remove standalone
//  4. Attach "Tera Form" as megaForm on Terapagos; remove standalone
//  5. Move 12 standalone alternate forms to their base species megaForms:
//     Mega Latias/Latios/Diancie, Kyogre Primal Reversion, Eternatus Eternamax,
//     Kyurem Black/White Fusion, Necrozma Dawn Wings/Dusk Mane/Ultra Mantle,
//     Calyrex Ice Rider/Shadow Rider
//  6. Fix Hoopa: correct base to Bound (Psychic/Ghost, HP:100) and add Unbound megaForm
//  7. Add missing megaForms on existing entries:
//     Groudon Primal Reversion, Mega Rayquaza, Deoxys forms (Attack/Defense/Speed),
//     Remote Isles Articuno/Zapdos/Moltres
// ============================================================
const fs   = require('fs');
const path = require('path');

const POKEDEX = path.join(__dirname, '..', 'pokedex.min.json');
const data    = JSON.parse(fs.readFileSync(POKEDEX, 'utf8'));
let   pokemon = data.pokemon;

// ── Helper ───────────────────────────────────────────────────────────────────
function find(name) {
    const p = pokemon.find(p => p.species === name);
    if (!p) throw new Error('Entry not found: ' + name);
    return p;
}
function remove(name) {
    const idx = pokemon.findIndex(p => p.species === name);
    if (idx === -1) throw new Error('Cannot remove, not found: ' + name);
    pokemon.splice(idx, 1);
    console.log('Removed standalone:', name);
}
function attachMegaForm(baseName, form) {
    const base = find(baseName);
    if (!base.megaForms) base.megaForms = [];
    base.megaForms.push(form);
    console.log('Attached megaForm', JSON.stringify(form.name), '→', baseName);
}
function toMegaForm(standaloneName, formName) {
    // Pull full data from the standalone entry, then remove it
    const entry = find(standaloneName);
    const form  = { name: formName, types: entry.types, stats: entry.stats, speedFt: entry.speedFt };
    return form;
}

// ── 1. Remove garbage "Incarnate Form"; add the four Forces of Nature ────────
remove('Incarnate Form');

const FORCES_OF_NATURE = [
    {
        species: 'Tornadus',
        types: ['Flying'],
        size: 'Huge',
        stats: { hp: 96, atk: 12, def: 7, satk: 13, sdef: 8, spd: 13 },
        speedFt: 65,
        legendary: true, rarity: 'legendary',
        megaForms: [{
            name: 'Therian Form',
            types: ['Flying'],
            stats: { hp: 96, atk: 10, def: 8, satk: 11, sdef: 9, spd: 14 },
            speedFt: 70,
        }],
    },
    {
        species: 'Thundurus',
        types: ['Electric', 'Flying'],
        size: 'Huge',
        stats: { hp: 96, atk: 12, def: 7, satk: 14, sdef: 8, spd: 13 },
        speedFt: 65,
        legendary: true, rarity: 'legendary',
        megaForms: [{
            name: 'Therian Form',
            types: ['Electric', 'Flying'],
            stats: { hp: 96, atk: 11, def: 7, satk: 16, sdef: 8, spd: 12 },
            speedFt: 60,
        }],
    },
    {
        species: 'Landorus',
        types: ['Ground', 'Flying'],
        size: 'Huge',
        stats: { hp: 108, atk: 15, def: 10, satk: 12, sdef: 8, spd: 10 },
        speedFt: 50,
        legendary: true, rarity: 'legendary',
        megaForms: [{
            name: 'Therian Form',
            types: ['Ground', 'Flying'],
            stats: { hp: 108, atk: 17, def: 10, satk: 11, sdef: 8, spd: 9 },
            speedFt: 45,
        }],
    },
    {
        species: 'Enamorus',
        types: ['Fairy', 'Flying'],
        size: 'Huge',
        stats: { hp: 96, atk: 12, def: 9, satk: 15, sdef: 9, spd: 11 },
        speedFt: 55,
        legendary: true, rarity: 'legendary',
        megaForms: [{
            name: 'Therian Form',
            types: ['Fairy', 'Flying'],
            stats: { hp: 96, atk: 12, def: 13, satk: 15, sdef: 11, spd: 5 },
            speedFt: 25,
        }],
    },
];

for (const entry of FORCES_OF_NATURE) {
    if (pokemon.some(p => p.species === entry.species)) {
        console.log('Already exists, skipping:', entry.species);
    } else {
        pokemon.push(entry);
        console.log('Added:', entry.species);
    }
}

// ── 2. Land Form → Shaymin; Sky Form → megaForm ──────────────────────────────
{
    const skyForm = toMegaForm('Sky Form', 'Sky Form');
    remove('Sky Form');
    const shaymin = find('Land Form');
    shaymin.species = 'Shaymin';
    if (!shaymin.megaForms) shaymin.megaForms = [];
    shaymin.megaForms.push(skyForm);
    console.log('Renamed Land Form → Shaymin; attached Sky Form megaForm');
}

// ── 3. Aria Form → Meloetta; Pirouette Form → megaForm ───────────────────────
{
    const pirouette = toMegaForm('Pirouette Form', 'Pirouette Form');
    remove('Pirouette Form');
    const meloetta = find('Aria Form');
    meloetta.species = 'Meloetta';
    if (!meloetta.megaForms) meloetta.megaForms = [];
    meloetta.megaForms.push(pirouette);
    console.log('Renamed Aria Form → Meloetta; attached Pirouette Form megaForm');
}

// ── 4. Tera Form → megaForm on Terapagos ─────────────────────────────────────
{
    const teraForm = toMegaForm('Tera Form', 'Tera Form');
    remove('Tera Form');
    attachMegaForm('Terapagos', teraForm);
}

// ── 5. Move 12 standalone alternate forms to base species megaForms ───────────
const STANDALONE_TO_MEGA = [
    { standalone: 'Mega Latias',             base: 'Latias',    formName: 'Mega' },
    { standalone: 'Mega Latios',             base: 'Latios',    formName: 'Mega' },
    { standalone: 'Mega Diancie',            base: 'Diancie',   formName: 'Mega' },
    { standalone: 'Kyogre Primal Reversion', base: 'Kyogre',    formName: 'Primal Reversion' },
    { standalone: 'Eternatus Eternamax',     base: 'Eternatus', formName: 'Eternamax' },
    { standalone: 'Kyurem Black Fusion',     base: 'Kyurem',    formName: 'Black Kyurem' },
    { standalone: 'Kyurem White Fusion',     base: 'Kyurem',    formName: 'White Kyurem' },
    { standalone: 'Necrozma Dawn Wings',     base: 'Necrozma',  formName: 'Dawn Wings' },
    { standalone: 'Necrozma Dusk Mane',      base: 'Necrozma',  formName: 'Dusk Mane' },
    { standalone: 'Necrozma Ultra Mantle',   base: 'Necrozma',  formName: 'Ultra Mantle' },
    { standalone: 'Calyrex Ice Rider',       base: 'Calyrex',   formName: 'Ice Rider' },
    { standalone: 'Calyrex Shadow Rider',    base: 'Calyrex',   formName: 'Shadow Rider' },
];

for (const { standalone, base, formName } of STANDALONE_TO_MEGA) {
    const form = toMegaForm(standalone, formName);
    remove(standalone);
    attachMegaForm(base, form);
}

// ── 6. Fix Hoopa: set base to Bound; add Unbound megaForm ────────────────────
{
    const hoopa = find('Hoopa');
    // Save current (Unbound) data before overwriting
    const unboundForm = {
        name: 'Unbound',
        types: [...hoopa.types],
        stats: { ...hoopa.stats },
        speedFt: hoopa.speedFt,
    };
    // Correct base to Bound form (Psychic/Ghost)
    hoopa.types   = ['Psychic', 'Ghost'];
    hoopa.stats   = { hp: 100, atk: 11, def: 6, satk: 15, sdef: 13, spd: 7 };
    hoopa.speedFt = 35;
    hoopa.size    = 'Small';
    if (!hoopa.megaForms) hoopa.megaForms = [];
    hoopa.megaForms.push(unboundForm);
    console.log('Fixed Hoopa: base → Bound (Psychic/Ghost); added Unbound megaForm');
}

// ── 7. Add missing megaForms on existing entries ──────────────────────────────

// Groudon Primal Reversion
attachMegaForm('Groudon', {
    name: 'Primal Reversion',
    types: ['Ground', 'Fire'],
    stats: { hp: 1600, atk: 19, def: 17, satk: 15, sdef: 9, spd: 11 },
    speedFt: 55,
});

// Mega Rayquaza
attachMegaForm('Rayquaza', {
    name: 'Mega',
    types: ['Dragon', 'Flying'],
    stats: { hp: 1660, atk: 19, def: 10, satk: 18, sdef: 10, spd: 15 },
    speedFt: 75,
});

// Deoxys alternate forms (base is Normal Form)
attachMegaForm('Deoxys', {
    name: 'Attack Form',
    types: ['Psychic'],
    stats: { hp: 60, atk: 18, def: 5, satk: 18, sdef: 5, spd: 15 },
    speedFt: 75,
});
attachMegaForm('Deoxys', {
    name: 'Defense Form',
    types: ['Psychic'],
    stats: { hp: 60, atk: 7, def: 19, satk: 7, sdef: 19, spd: 9 },
    speedFt: 45,
});
attachMegaForm('Deoxys', {
    name: 'Speed Form',
    types: ['Psychic'],
    stats: { hp: 60, atk: 10, def: 12, satk: 10, sdef: 12, spd: 18 },
    speedFt: 90,
});

// Remote Isles bird forms (Galarian variants)
attachMegaForm('Articuno', {
    name: 'Remote Isles',
    types: ['Psychic', 'Flying'],
    stats: { hp: 108, atk: 9, def: 9, satk: 13, sdef: 10, spd: 12 },
    speedFt: 60,
});
attachMegaForm('Zapdos', {
    name: 'Remote Isles',
    types: ['Fighting', 'Flying'],
    stats: { hp: 108, atk: 13, def: 9, satk: 9, sdef: 9, spd: 12 },
    speedFt: 60,
});
attachMegaForm('Moltres', {
    name: 'Remote Isles',
    types: ['Dark', 'Flying'],
    stats: { hp: 108, atk: 9, def: 9, satk: 11, sdef: 13, spd: 11 },
    speedFt: 55,
});

// ── Save ──────────────────────────────────────────────────────────────────────
data.lastUpdated = '2026-03-08';
fs.writeFileSync(POKEDEX, JSON.stringify(data, null, 0), 'utf8');

const legendaryCount = pokemon.filter(p => p.legendary).length;
console.log('\nDone. Total entries:', pokemon.length, '| Legendary entries:', legendaryCount);
