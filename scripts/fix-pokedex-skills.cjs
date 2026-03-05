#!/usr/bin/env node
// Fix parsing errors in pokedex.min.json skills arrays

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'pokedex.min.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

let fixed = 0;

data.pokemon = data.pokemon.map(p => {
    let changed = false;

    // ── Species name fixes ───────────────────────────────────────────
    if (p.species === 'Attack higher than Defense') {
        p.species = 'Hitmontop';
        changed = true;
    }

    // ── Skills fixes ─────────────────────────────────────────────────
    if (!Array.isArray(p.skills)) return p;

    let skills = p.skills;

    // 1. Remove bare "-" entries (→ empty array)
    skills = skills.filter(s => s !== '-');

    // 2. Normalize skill strings
    skills = skills.flatMap(s => {
        // Remove leading/trailing parens, asterisks, dots
        s = s.trim();

        // "Intelligence Swimmer" → ["Intelligence", "Swimmer"]
        if (s === 'Intelligence Swimmer') {
            changed = true;
            return ['Intelligence', 'Swimmer'];
        }

        // "Sinker [Chest]" → "Sinker"
        if (s === 'Sinker [Chest]') { changed = true; return ['Sinker']; }

        // "Swimmer [Roaming]" → "Swimmer"
        if (s === 'Swimmer [Roaming]') { changed = true; return ['Swimmer']; }

        // "Mausfam )" → "Mausfam"
        if (s === 'Mausfam )') { changed = true; return ['Mausfam']; }

        // "Segmented )." → "Segmented"
        if (s === 'Segmented ).') { changed = true; return ['Segmented']; }

        // "Reach  *This ability is different..." → "Reach"
        if (s.startsWith('Reach ') && s.includes('*')) { changed = true; return ['Reach']; }

        // "*This ability is different..." → drop
        if (s.startsWith('*')) { changed = true; return []; }

        // "Sinker Passives: Defense Curl" → "Sinker"  (passives leaked into skills)
        // "Zapper Passives: Coil" → "Zapper"
        // "Strength Passives: Iron Defense" → "Strength"
        const passiveMatch = s.match(/^(\w+)\s+Passives:/);
        if (passiveMatch) { changed = true; return [passiveMatch[1]]; }

        // Items that are known to be passives/abilities, not skills — drop them
        // (Leer, Blaze, Levitate, Sheer Force are all move/passive names)
        const knownNonSkills = ['Leer', 'Blaze', 'Levitate', 'Sheer Force'];
        if (knownNonSkills.includes(s)) { changed = true; return []; }

        return [s];
    });

    // 3. Gimmighoul (Chest) — keep only Sinker (not Swimmer [Roaming] already cleaned)
    if (p.species === 'Gimmighoul (Chest)') {
        skills = skills.filter(s => s !== 'Swimmer');
        changed = true;
    }
    // Gimmighoul (Roaming) — keep only Swimmer
    if (p.species === 'Gimmighoul (Roaming)') {
        skills = skills.filter(s => s !== 'Sinker');
        changed = true;
    }

    if (changed || skills.length !== p.skills.length || skills.some((s,i) => s !== p.skills[i])) {
        fixed++;
        p.skills = skills;
    }

    return p;
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
console.log(`Done. Fixed ${fixed} entries.`);
