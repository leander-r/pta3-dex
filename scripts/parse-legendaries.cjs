// ============================================================
// PTA3 GMG Legendary Section Parser
// ============================================================
// Reads reference material/gmg_raw.txt (GMG PDF text extraction)
// and extracts legendary Pokémon stat blocks starting from "Type: Null".
// Merges results into pokedex.min.json (skipping duplicates).

const fs   = require('fs');
const path = require('path');

const BASE_DIR   = path.join(__dirname, '..', 'reference material');
const GMG_RAW    = path.join(BASE_DIR, 'gmg_raw.txt');
const POKEDEX    = path.join(__dirname, '..', 'pokedex.min.json');
const DEBUG_OUT  = path.join(__dirname, 'legendaries_debug.txt');

const POKEMON_TYPES = [
    'Normal','Fire','Water','Grass','Electric','Ice','Fighting','Poison',
    'Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy'
];
const TYPES_RE = new RegExp(
    `^((?:${POKEMON_TYPES.join('|')})(?:\\s*/\\s*(?:${POKEMON_TYPES.join('|')}))*)` +
    `\\s*-\\s*(\\w+)\\s*\\(Size\\),?\\s*(\\w+)\\s*\\(Weight\\)`,
    'i'
);
const HP_RE    = /Hit Points:\s*(\d+)\s+Defense:\s*(\d+)\s+Special\s+Defense:\s*(\d+)/i;
const SPEED_RE = /Speed:\s*(\d+)\s*\(\s*(\d+)\s*ft\.?\s*\)\s*\*?\s*Attack:\s*(\d+)\s*\*?\s*Special\s+Attack:\s*(\d+)/i;
const FREQ_PAT = '(?:At-Will|3\\/day|1\\/day)';
const RANGE_PAT = '(?:Melee|Self|(?:Ranged|Area|Burst|Cone|Line|Aura|Hazard|Swarm|Field)(?:\\([^)]+\\))?)';
const TYPE_PAT  = POKEMON_TYPES.join('|');
const MOVE_RE  = new RegExp(
    `([A-Z][A-Za-z'\\- ]{1,40})\\s*-\\s*(${RANGE_PAT})\\s+(${TYPE_PAT})\\s+(Attack|Special Attack|Effect):\\s*(${FREQ_PAT})\\s*([0-9]+d[0-9]+(?:[+-][0-9]+)?)?`,
    'g'
);

// ── Column splitter ─────────────────────────────────────────
// Tries to detect lines with two columns separated by 5+ spaces.
// Handles leading whitespace (indented left column) and right-column-only lines.
// Returns [leftPart, rightPart | null].
const STAT_LINE_RE = /^(?:Speed:\s*\d|Hit Points:\s*\d|Skills:|Passives:|Moves\s*\(|Biology:|Proficiencies:|Evolution:|(?:Normal|Fire|Water|Grass|Electric|Ice|Fighting|Poison|Ground|Flying|Psychic|Bug|Rock|Ghost|Dragon|Dark|Steel|Fairy)(?:\s*\/|\s*-\s*\w+\s*\())/i;
function splitColumns(line) {
    // Right-column-only: 30+ leading spaces then content (e.g. Proficiencies/Biology lines)
    if (/^\s{30,}\S/.test(line)) return ['', line.trim()];

    // Two-column: any text (including leading spaces) + 5+ space gap + right content.
    // Use lazy .*?\S so we find the FIRST large gap, not the last.
    const m = line.match(/^(.*?\S)\s{5,}(\S.*)$/);
    if (m && m[1].trim().length >= 3) return [m[1].trim(), m[2].trim()];

    // Stat-line fallback: 2+ space gap when right part is a recognizable stat block keyword.
    // Handles cases where left-column text ends close to the right column (< 5 space gap).
    const m2 = line.match(/^(.*?\S)\s{2,}(\S.*)$/);
    if (m2 && m2[1].trim().length >= 3 && STAT_LINE_RE.test(m2[2])) return [m2[1].trim(), m2[2].trim()];

    return [line.trim(), null];
}

// ── Build column streams ─────────────────────────────────────
// Interleave left and right column lines with a sentinel to separate them.
function buildColumnStreams(rawLines) {
    // We produce two separate streams: left[] and right[]
    // where each element is { lineNo, text }
    const left  = [];
    const right = [];

    for (let i = 0; i < rawLines.length; i++) {
        const [l, r] = splitColumns(rawLines[i]);
        left.push({ lineNo: i + 1, text: l });
        if (r !== null) {
            right.push({ lineNo: i + 1, text: r });
        } else {
            // Insert blank placeholder so right stream stays in sync
            right.push({ lineNo: i + 1, text: '' });
        }
    }
    return { left, right };
}

// ── Stat block extractor ─────────────────────────────────────
// Processes a single column stream (array of {lineNo, text})
// and returns an array of raw stat block objects.
function extractEntries(stream) {
    const entries = [];
    let i = 0;

    while (i < stream.length) {
        const line = stream[i].text;

        // Look for the HP line as the start of a stat block
        const hpMatch = HP_RE.exec(line);
        if (!hpMatch) { i++; continue; }

        // Found HP line — gather context
        const hpLine = i;
        const hp    = parseInt(hpMatch[1]);
        const def   = parseInt(hpMatch[2]);
        const sdef  = parseInt(hpMatch[3]);

        // ── Look backward for type and name ──────────────────
        let typeLine = null, nameLine = null;
        for (let back = 1; back <= 6; back++) {
            const idx = hpLine - back;
            if (idx < 0) break;
            const t = stream[idx].text;
            if (!typeLine) {
                const tm = TYPES_RE.exec(t);
                if (tm) {
                    typeLine = { raw: t, types: tm[1].split('/').map(x => x.trim()), size: tm[2], weight: tm[3] };
                    continue;
                }
            }
            // Name: non-empty, no digits, starts with capital, not too long
            if (!nameLine && t && !/\d/.test(t) && /^[A-Z]/.test(t) && t.length < 80) {
                // Skip lore-ish lines
                const lowerT = t.toLowerCase();
                const isLore = ['the','they','it ','in ','on ','at ','this','that',
                    'legendary','biology','proficiencies','evolution','there','these'].some(w => lowerT.startsWith(w));
                if (!isLore) {
                    // Extract base species from parenthetical (e.g. "Great Tusk (Donphan)" → baseSpecies "Donphan")
                    const parenM = t.match(/\s*\(([^)]+)\)\s*$/);
                    if (parenM) nameLine = { name: t.replace(/\s*\([^)]+\)\s*$/, '').trim(), baseSpecies: parenM[1] };
                    else        nameLine = { name: t.trim(), baseSpecies: null };
                }
            }
        }

        if (!typeLine || !nameLine) { i++; continue; }

        // ── Validate the name ─────────────────────────────────
        // Reject names that are clearly lore text or type lines
        const nameOk = (() => {
            const n = nameLine.name;
            if (/[.!?]/.test(n) && /\s/.test(n)) return false;  // sentence (has punct + space)
            if (/\s*\/\s*[A-Z][a-z]+\s+-\s+[A-Z][a-z]/.test(n)) return false;  // "Type / Type - Size"
            if (n.endsWith(' -') || n.endsWith('-')) return false; // truncated
            if (/\bworld\b|\bportal\b|\bopens\b/i.test(n)) return false;
            if (/\bis\b|\bare\b|\bwas\b|\bwere\b|\bhas\b|\bhave\b/i.test(n)) return false; // verbs
            if (n.length > 60) return false; // too long
            return true;
        })();
        if (!nameOk) { i++; continue; }

        // ── Look forward for speed, skills, passives, moves ──
        let atk = 0, satk = 0, spd = 0, speedFt = 0;
        let skillLine = '', passiveLine = '';
        const rawMoveLines = [];
        let j = hpLine + 1;

        while (j < Math.min(hpLine + 80, stream.length)) {
            const t = stream[j].text;

            // Stop at the next entry's HP line (prevents scan from consuming adjacent species)
            if (HP_RE.test(t)) break;

            const spdM = SPEED_RE.exec(t);
            if (spdM && spd === 0) {
                spd     = parseInt(spdM[1]);
                speedFt = parseInt(spdM[2]);
                atk     = parseInt(spdM[3]);
                satk    = parseInt(spdM[4]);
            }

            if (/^Skills:/i.test(t) && !skillLine) skillLine = t;
            if (/^Passives:/i.test(t) && !passiveLine) passiveLine = t;
            if (/^Moves\s*\(/i.test(t)) rawMoveLines.push(t);
            // Only break on Biology/Proficiencies after we've found the speed line
            // (avoids premature break from right-column spillover)
            if (spd > 0 && /^Biology:/i.test(t)) break;
            if (spd > 0 && /^Proficiencies:/i.test(t)) break;
            j++;
        }

        // Collect multi-line skills and passives
        let skillsFull = skillLine;
        let passivesFull = passiveLine;
        // Walk forward to get continuation lines
        for (let k = hpLine + 1; k < j; k++) {
            const t = stream[k].text;
            if (/^Skills:/i.test(t)) {
                // Collect following lines until we hit another block marker
                let kk = k + 1;
                while (kk < j && stream[kk].text && !/^Passives:|^Moves|^Biology|^Proficiencies|^Speed:/i.test(stream[kk].text)) {
                    skillsFull += ' ' + stream[kk].text;
                    kk++;
                }
            }
            if (/^Passives:/i.test(t)) {
                let kk = k + 1;
                while (kk < j && stream[kk].text && !/^Moves|^Biology|^Proficiencies|^Skills:|^Speed:/i.test(stream[kk].text)) {
                    passivesFull += ' ' + stream[kk].text;
                    kk++;
                }
            }
        }

        // Extract individual skills
        const skillsArr = parseSkills(skillsFull);
        const passivesArr = parsePassives(passivesFull);

        // Extract moves by collecting all text from HP to j
        const blockText = stream.slice(hpLine, j).map(l => l.text).join('\n');
        const moves = parseMoves(blockText);

        entries.push({
            species:     nameLine.name,
            baseSpecies: nameLine.baseSpecies || undefined,
            types:   typeLine.types,
            size:    typeLine.size,
            weight:  typeLine.weight,
            stats:   { hp, atk, def, satk, sdef, spd },
            speedFt,
            skills:  skillsArr,
            passives: passivesArr,
            moves,
            legendary: true,
            rarity:   'legendary',
        });

        i = j; // Skip past this entry
    }

    return entries;
}

function parseSkills(line) {
    if (!line) return [];
    // "Skills: Burrow (moves through earth easily), Climber (treats..."
    const body = line.replace(/^Skills:\s*/i, '');
    // Split on ", CapitalWord" or ", CapitalWord ("
    return body.split(/,\s+(?=[A-Z])/).map(s => {
        // Remove parenthetical descriptions
        return s.replace(/\s*\(.*\)$/, '').trim();
    }).filter(s => s.length > 0 && s.length < 40);
}

function parsePassives(line) {
    if (!line) return [];
    const body = line.replace(/^Passives:\s*/i, '');
    // Split on ", CapitalWord" boundaries — but passive names can be multi-word
    // Use a simpler split: "),\s+" to split after closing parenthesis
    const parts = body.split(/\),\s+(?=[A-Z])/);
    return parts.map(s => {
        // Get the name: everything before the first " ("
        const m = s.match(/^([^(]+)/);
        return m ? m[1].trim() : s.trim();
    }).filter(s => s.length > 0 && s.length < 50);
}

function parseMoves(text) {
    const moves = [];
    MOVE_RE.lastIndex = 0;
    let m;
    while ((m = MOVE_RE.exec(text)) !== null) {
        const name = m[1].trim();
        // Filter out false positives
        if (name.split(' ').some(w => ['The','They','It','In','On','At','A','An','By','Of','This','That'].includes(w))) continue;
        moves.push({
            name,
            range:        m[2].trim(),
            type:         m[3],
            accuracyType: m[4] === 'Effect' ? 'Effect' : (m[4] === 'Special Attack' ? 'Special' : 'Attack'),
            frequency:    m[5],
            damage:       m[6] || null,
        });
    }
    return moves;
}

// ── Deduplication ────────────────────────────────────────────
function deduplicateEntries(arr) {
    const seen = new Map();
    for (const e of arr) {
        const key = e.species.toLowerCase();
        if (!seen.has(key)) {
            seen.set(key, e);
        } else {
            // Prefer the entry with more moves
            const existing = seen.get(key);
            if (e.moves.length > existing.moves.length) seen.set(key, e);
        }
    }
    return [...seen.values()];
}

// ── Main ─────────────────────────────────────────────────────
function main() {
    console.log('Reading GMG raw text…');
    const fullText = fs.readFileSync(GMG_RAW, 'utf8');
    // Normalize: CRLF → LF, form-feeds → newlines, then split
    const allLines = fullText
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\f/g, '\n')    // form-feeds (page breaks) → newlines
        .split('\n');

    // Find start: look for "Type: Null" stat block (the one that's near an HP line, not lore text).
    // We want the occurrence that has a Normal type line nearby (line ~9902).
    // Strategy: find first occurrence after the HP line "Hit Points: 90 Defense: 10" that
    // follows a line starting with "Normal" type.
    // Simpler: find the occurrence of "Type: Null" that is a standalone (no comma, no "he ")
    // and appears after line 9800.
    let startIdx = -1;
    for (let i = 9800; i < allLines.length; i++) {
        if (/^Type: Null\s*(?:\s{5,}|$)/.test(allLines[i])) { startIdx = i; break; }
    }
    if (startIdx < 0) {
        // Fallback: find via the page-159 marker or by the HP pattern nearby
        for (let i = 9000; i < allLines.length; i++) {
            if (allLines[i].includes('Type: Null') && allLines.slice(i, i+5).some(l => /Hit Points: 90/.test(l))) {
                startIdx = i; break;
            }
        }
    }
    if (startIdx < 0) { console.error('Could not find "Type: Null" stat block in GMG raw text'); process.exit(1); }
    console.log(`Legendary section starts at line ${startIdx + 1}`);

    const legendaryLines = allLines.slice(startIdx);
    console.log(`Processing ${legendaryLines.length} lines…`);

    const { left, right } = buildColumnStreams(legendaryLines);

    console.log('Extracting from left column…');
    const leftEntries  = extractEntries(left);
    console.log(`  Found ${leftEntries.length} entries`);

    console.log('Extracting from right column…');
    const rightEntries = extractEntries(right);
    console.log(`  Found ${rightEntries.length} entries`);

    const all = deduplicateEntries([...leftEntries, ...rightEntries]);
    console.log(`Total unique entries: ${all.length}`);

    // Write debug info
    const debugLines = all.map(e =>
        `${e.species} | ${e.types.join('/')} | HP:${e.stats.hp} ATK:${e.stats.atk} DEF:${e.stats.def} SATK:${e.stats.satk} SDEF:${e.stats.sdef} SPD:${e.stats.spd} | moves:${e.moves.length} | skills:${e.skills.length} | passives:${e.passives.length}`
    );
    fs.writeFileSync(DEBUG_OUT, debugLines.join('\n'), 'utf8');
    console.log(`Debug written to ${DEBUG_OUT}`);

    // ── Merge into pokedex.min.json ───────────────────────────
    console.log('\nMerging into pokedex.min.json…');
    const pokedex = JSON.parse(fs.readFileSync(POKEDEX, 'utf8'));
    const existingSpecies = new Set(pokedex.pokemon.map(p => p.species.toLowerCase()));

    // Species that should be skipped as standalone entries because they are
    // stored as megaForms on their base species (manually patched in pokedex.min.json).
    const SKIP_STANDALONE = new Set(['mega mewtwo x', 'mega mewtwo y']);

    let added = 0;
    let flagged = 0;
    for (const entry of all) {
        const key = entry.species.toLowerCase();
        if (SKIP_STANDALONE.has(key)) continue; // handled as megaForms on Mewtwo
        if (existingSpecies.has(key)) {
            // Flag existing entry as legendary
            const existing = pokedex.pokemon.find(p => p.species.toLowerCase() === key);
            if (existing && !existing.legendary) {
                existing.legendary = true;
                existing.rarity    = 'legendary';
                flagged++;
            }
        } else {
            // Add new entry in pokedex format — no id; loader assigns from array index
            pokedex.pokemon.push({
                species:     entry.species,
                ...(entry.baseSpecies ? { baseSpecies: entry.baseSpecies } : {}),
                types:    entry.types,
                size:     entry.size,
                weight:   entry.weight,
                stats:    entry.stats,
                speedFt:  entry.speedFt,
                skills:   entry.skills,
                passives: entry.passives,
                moves:    entry.moves,
                abilities: { basic: [], adv: [], high: [] },
                biology:  { eggGroups: [], hatchDays: 0, diet: '', habitat: '' },
                evolution: { from: null, to: null, method: '' },
                legendary: true,
                rarity:   'legendary',
            });
            existingSpecies.add(key);
            added++;
        }
    }

    pokedex.lastUpdated = new Date().toISOString().split('T')[0];
    if (!pokedex.version) pokedex.version = '3.0.0';

    fs.writeFileSync(POKEDEX, JSON.stringify(pokedex, null, 0), 'utf8');
    console.log(`Added ${added} new legendary entries.`);
    console.log(`Flagged ${flagged} existing entries as legendary.`);
    console.log(`Pokedex now has ${pokedex.pokemon.length} entries.`);
    console.log('Done!');
}

main();
