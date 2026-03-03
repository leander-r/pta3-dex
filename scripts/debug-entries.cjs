// Debug: count type lines and candidates with current scan logic
const fs = require('fs');
const path = require('path');
const BASE_DIR = path.join(__dirname, '..', 'reference material');
const RAW_TXT  = path.join(BASE_DIR, 'pokedex_raw.txt');

const rawText = fs.readFileSync(RAW_TXT, 'utf8');
const text = rawText
    .replace(/\r/g, '')
    .replace(/\x0c/g, '\n')
    .replace(/AtWill/g, 'At-Will')
    .replace(/At-\n\s*Will/g, 'At-Will')
    .replace(/(\d)\/\n\s*(day)/g, '$1/$2')
    .replace(/(\d)\/\s+(day)/g, '$1/$2');
const lines = text.split('\n');

const POKEMON_TYPES = ['Normal','Fire','Water','Grass','Electric','Ice','Fighting','Poison','Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy'];
const TYPES_ALT = POKEMON_TYPES.join('|');
const TYPE_LINE_RE = new RegExp(
    `^((?:${TYPES_ALT})(?:\\s*\\/\\s*(?:${TYPES_ALT}))*)` +
    `\\s*-\\s*(\\w+)\\s*\\(Size\\),\\s*(\\w+)\\s*\\(Weight\\)`,
    'i'
);

let totalTypeLines = 0;
let skippedNoCandidates = 0;
const SCAN_START = 2000;

for (let i = SCAN_START; i < lines.length; i++) {
    const line = lines[i].trim();
    const typeMatch = line.match(TYPE_LINE_RE);
    if (!typeMatch) continue;
    totalTypeLines++;

    const candidates = [];
    for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
        const candidate = lines[j].trim();
        if (!candidate) continue;
        if (/^\d+$/.test(candidate)) continue;
        // Section/stat keywords: BREAK (checked before '/' so "Proficiencies: X / Y" → break)
        if (/^(Pok[eé]|Starter|Evolution|Biology|Proficien|Contents|Other|How to|Skills|Moves|Passives|Speed:|Hit Points:|Special Attack:|Special Defense:|Defense:|Attack:)/i.test(candidate)) break;
        if (candidate.includes('/')) continue;
        if (/^[A-Z]/.test(candidate) && candidate.length < 60) {
            candidates.push(candidate);
            if (candidates.length >= 3) break;
        }
    }

    if (candidates.length === 0) {
        skippedNoCandidates++;
        console.log(`SKIP (0 candidates) line ${i}: ${line.substring(0, 70)}`);
        for (let j = Math.max(0, i - 11); j < i; j++) {
            if (lines[j].trim()) console.log(`  [${j}] ${lines[j].trim().substring(0, 80)}`);
        }
    }
}

console.log(`\nTotal type lines found: ${totalTypeLines}`);
console.log(`Skipped (0 candidates): ${skippedNoCandidates}`);
console.log(`Would create: ${totalTypeLines - skippedNoCandidates} entries`);
