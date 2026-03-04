// ============================================================
// PTA3 Pokédex PDF → JSON Parser
// ============================================================
// Reads pokedex_raw.txt (extracted from PTA3Pokedex.pdf via pdftotext)
// and outputs pokedex.min.json in the new PTA3 format.

const fs   = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..', 'reference material');
const RAW_TXT  = path.join(BASE_DIR, 'pokedex_raw.txt');
const OUTPUT   = path.join(__dirname, '..', 'pokedex.min.json');

// ============================================================
// PRE-PROCESSING
// ============================================================
function preprocessText(text) {
    return text
        .replace(/\r/g, '')
        .replace(/\x0c/g, '\n')              // form-feeds → newlines
        .replace(/AtWill/g, 'At-Will')       // fix merged "AtWill"
        .replace(/At-\n\s*Will/g, 'At-Will') // fix split "At-\nWill"
        .replace(/(\d)\/\n\s*(day)/g, '$1/$2') // fix split "1/\nday"
        .replace(/(\d)\/\s+(day)/g, '$1/$2') // fix inline "1/ day"
        // Normalize "TYPE Field CATEGORY:" → "Field TYPE CATEGORY:" in move entries.
        // Some moves (e.g. "Mist - Ice Field Effect: 3/day") write type before the
        // range; this reorders them to match the standard "RANGE TYPE CATEGORY:" pattern.
        .replace(
            / - (Normal|Fire|Water|Grass|Electric|Ice|Fighting|Poison|Ground|Flying|Psychic|Bug|Rock|Ghost|Dragon|Dark|Steel|Fairy) Field (Attack|Special Attack|Effect):/g,
            (_, type, cat) => ` - Field ${type} ${cat}:`
        );
}

// ============================================================
// CONSTANTS
// ============================================================
const POKEMON_TYPES = [
    'Normal','Fire','Water','Grass','Electric','Ice','Fighting','Poison',
    'Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy'
];
const TYPES_ALT = POKEMON_TYPES.join('|');

const TYPE_LINE_RE = new RegExp(
    `^((?:${TYPES_ALT})(?:\\s*\\/\\s*(?:${TYPES_ALT}))*)` +
    `\\s*-\\s*(\\w+)\\s*\\(Size\\),\\s*(\\w+)\\s*\\(Weight\\)`,
    'i'
);

const RANGE_PAT   = '(?:Melee|Self|(?:Ranged|Area|Burst|Cone|Line|Aura|Hazard|Swarm|Field)(?:\\([^)]+\\))?)';
const FREQ_PAT    = 'At-Will|3\\/day|1\\/day';
const DAMAGE_PAT  = '(?:[0-9]+d[0-9]+(?:[+\\-][0-9]+)?|[0-9]+)?';
// Single \s (not \s+) between words prevents double-space PDF artifacts
// (e.g. "Gholdengo  Splash" from two consecutive newlines) from being
// matched as a multi-word move name.
const NAME_PAT    = '[A-Z][a-zA-Z\'\u2019-]*(?:\\s[A-Z][a-zA-Z\'\u2019-]*){0,4}';

const MOVE_RE = new RegExp(
    `(${NAME_PAT})\\s*-\\s*(${RANGE_PAT})` +
    `\\s+(${TYPES_ALT})\\s+(Attack|Special Attack|Effect)` +
    `:\\s*(${FREQ_PAT})\\s*(${DAMAGE_PAT})`,
    'g'
);

// Common English words that can never be move names
const LORE_WORDS = new Set([
    'The','They','This','That','Their','Them','There','These','Those',
    'It','Its','You','Your','We','Our','He','She','His','Her',
    'A','An','In','On','At','For','With','By','From','To','Of',
    'And','Or','But','Not','So','Yet','Nor',
    'Be','Is','Are','Was','Were','Has','Have','Had',
    'Will','Would','Can','Could','May','Might','Must','Should',
    'Do','Does','Did','Go','Get','Got','Make',
    'When','Where','Who','What','How','Which','While',
    'One','Two','Three','Four','Five','Six',
    'All','Any','Some','No','More','Most','Much','Many',
    'Up','Down','Out','Off','Over','Under','Through','Into',
]);

// ============================================================
// STATS PARSING
// ============================================================
function parseStats(block) {
    return parseStatsNth(block, 0);
}

// Parse the Nth (0-indexed) occurrence of stats — used for dual-column pages.
function parseStatsNth(block, n) {
    const b = block.replace(/\n/g, ' ');

    const fullMatches   = [...b.matchAll(/Hit Points:\s*(\d+)\s+Defense:\s*(\d+)\s+Special Defense:\s*(\d+)/gi)];
    const spdMatches    = [...b.matchAll(/Speed:\s*(\d+)/gi)];
    const spdFtMatches  = [...b.matchAll(/Speed:\s*\d+\s*\((\d+)\s*ft/gi)];
    const satkMatches   = [...b.matchAll(/Special Attack:\s*(\d+)/gi)];
    const atkCtxMatches = [...b.matchAll(/\([\d]+\s*ft\.?\)\s+Attack:\s*(\d+)/gi)];
    const atkFbMatches  = [...b.matchAll(/(?<!Special )Attack:\s*(\d+)/gi)];

    const full   = fullMatches[n];
    const spd    = spdMatches[n];
    const spdFt  = spdFtMatches[n];
    const satk   = satkMatches[n];
    const atkCtx = atkCtxMatches[n];
    const atkFb  = atkFbMatches[n];

    return {
        hp:      full   ? parseInt(full[1])   : 0,
        def:     full   ? parseInt(full[2])   : 0,
        sdef:    full   ? parseInt(full[3])   : 0,
        spd:     spd    ? parseInt(spd[1])    : 0,
        speedFt: spdFt  ? parseInt(spdFt[1])  : 0,
        satk:    satk   ? parseInt(satk[1])   : 0,
        atk:     atkCtx ? parseInt(atkCtx[1]) : (atkFb ? parseInt(atkFb[1]) : 0),
    };
}

// ============================================================
// SKILLS PARSING
// ============================================================
function parseSkills(block) {
    return parseSkillsNth(block, 0);
}

// Parse the Nth (0-indexed) "Skills:" line — used for dual-column pages.
function parseSkillsNth(block, n) {
    let count = 0;
    for (const line of block.split('\n')) {
        const m = line.match(/^Skills:\s*(.+)/i);
        if (!m) continue;
        if (count === n) {
            return m[1]
                .replace(/\([^)]*\)/g, '')
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);
        }
        count++;
    }
    return [];
}

// ============================================================
// PASSIVES PARSING (paren-aware split)
// ============================================================
function parsePassives(block) {
    const b = block.replace(/\n/g, ' ');
    const m = b.match(/Passives:\s*(.*?)(?=\s*Moves\s*\(|Biology:|$)/i);
    if (!m) return [];

    const text = m[1].trim();
    const passives = [];
    let depth = 0, current = '';
    for (const ch of text) {
        if (ch === '(') depth++;
        else if (ch === ')') depth--;
        else if (ch === ',' && depth === 0) {
            passives.push(current.trim());
            current = '';
            continue;
        }
        current += ch;
    }
    if (current.trim()) passives.push(current.trim());

    return passives.map(p => p.replace(/\([\s\S]*$/, '').trim()).filter(Boolean);
}

// Parse the Nth (0-indexed) "Passives:" section.
// Each section is sliced from its "Passives:" start to the next one.
function parsePassivesNth(block, n) {
    const positions = [...block.matchAll(/Passives:/gi)].map(m => m.index);
    if (positions.length <= n) return [];
    const start  = positions[n];
    const endPos = positions[n + 1] !== undefined ? positions[n + 1] : block.length;
    return parsePassives(block.slice(start, endPos));
}

// ============================================================
// ACCURACY MODS
// ============================================================
function parseAccuracyMods(block) {
    const m = block.match(
        /Moves\s*\(Attack\s*([+\-]\d+),\s*Special Attack\s*([+\-]\d+),\s*Effect\s*([+\-]\d+)\)/i
    );
    if (!m) return null;
    return { atk: parseInt(m[1]), satk: parseInt(m[2]), eff: parseInt(m[3]) };
}

// ============================================================
// MOVES PARSING
// ============================================================
function cleanMoveName(name) {
    // Remove leading line-break artifact like "Am- " (hyphenated mid-word from left column)
    return name.replace(/^[A-Z][a-zA-Z]{1,4}-\s+/, '').trim();
}

function parseMoves(block) {
    const movesIdx = block.indexOf('Moves (');
    if (movesIdx === -1) return { moves: [], accuracyMods: null };

    const accuracyMods = parseAccuracyMods(block);
    const section = block.slice(movesIdx).replace(/\n/g, ' ');

    // Collect all valid matches first so we can compute inter-match effect text
    MOVE_RE.lastIndex = 0;
    const validMatches = [];
    let m;
    while ((m = MOVE_RE.exec(section)) !== null) {
        const rawName = m[1].trim();
        const name = cleanMoveName(rawName);
        if (LORE_WORDS.has(name)) continue;
        if (name.length < 2) continue;
        validMatches.push({ m, name });
    }

    const moves = [];
    for (let i = 0; i < validMatches.length; i++) {
        const { m: match, name } = validMatches[i];
        const range    = match[2].trim();
        const type     = match[3].trim();
        const category = match[4].trim();
        const frequency = match[5].trim();
        const damage   = match[6] ? match[6].trim() : null;

        // Effect text: everything between end of this match and start of next,
        // but clipped at any boundary that marks the end of move-effect text.
        const matchEnd   = match.index + match[0].length;
        const nextStart  = i + 1 < validMatches.length
            ? validMatches[i + 1].m.index
            : section.length;
        let effectSlice = section.slice(matchEnd, nextStart);
        // Clip at a blank-line boundary (PDF paragraphs: \n\n → two spaces after flattening).
        // Move effects are single-line; lore paragraphs follow after a blank line.
        const doubleSpaceBoundary = effectSlice.search(/  /);
        if (doubleSpaceBoundary !== -1) effectSlice = effectSlice.slice(0, doubleSpaceBoundary);
        // Clip at section headers (Biology:, Evolution:, Proficiencies:, Skills:, Passives:)
        const sectionBoundary = effectSlice.search(
            /\b(?:Biology|Evolution|Proficiencies|Skills|Passives)\s*:/i
        );
        if (sectionBoundary !== -1) effectSlice = effectSlice.slice(0, sectionBoundary);
        // Clip at a Pokémon type line: "TypeName - Adj (Size), Adj (Weight)"
        // These appear when the block includes the start of the next species entry.
        const typeBoundary = effectSlice.search(
            /\s(?:Normal|Fire|Water|Grass|Electric|Ice|Fighting|Poison|Ground|Flying|Psychic|Bug|Rock|Ghost|Dragon|Dark|Steel|Fairy)(?:\s*\/\s*(?:Normal|Fire|Water|Grass|Electric|Ice|Fighting|Poison|Ground|Flying|Psychic|Bug|Rock|Ghost|Dragon|Dark|Steel|Fairy))*\s+-\s+\w+\s+\(Size\)/
        );
        if (typeBoundary !== -1) effectSlice = effectSlice.slice(0, typeBoundary);
        // Clip at a page number followed by prose (pdftotext page-break artifact): " 22 Word"
        const pageNumBoundary = effectSlice.search(/\s\d{2,3}\s+[A-Z][a-z]/);
        if (pageNumBoundary !== -1) effectSlice = effectSlice.slice(0, pageNumBoundary);
        const effectRaw  = effectSlice
            .replace(/\s{2,}/g, ' ')
            .trim()
            .replace(/^\.?\s*/, '')   // strip leading period/space
            .trim();
        const effect = effectRaw || null;

        moves.push({ name, range, type, category, frequency, damage: damage || null, effect });
    }

    return { moves, accuracyMods };
}

// Parse the Nth (0-indexed) "Moves (" section.
// Each section is sliced from its "Moves (" start to the next one.
function parseMovesNth(block, n) {
    const positions = [...block.matchAll(/Moves \(/gi)].map(m => m.index);
    if (positions.length <= n) return { moves: [], accuracyMods: null };
    const start  = positions[n];
    const endPos = positions[n + 1] !== undefined ? positions[n + 1] : block.length;
    return parseMoves(block.slice(start, endPos));
}

// ============================================================
// BIOLOGY
// ============================================================
function parseBiology(block) {
    const m = block.match(/Biology:\s*([\s\S]*?)(?=Evolution:|Proficiencies:|$)/);
    if (!m) return null;

    const text = m[1].replace(/\n/g, ' ').trim();
    const eg   = text.match(/Egg Group\s*-\s*([^,]+?)(?=,\s*Egg Hatch|$)/i);
    const eh   = text.match(/Egg Hatch Rate\s*-\s*([^,]+)/i);
    const diet = text.match(/Diet\s*-\s*([^,]+)/i);
    const hab  = text.match(/Habitat\s*-\s*(.+?)(?=\s*$)/i);

    return {
        eggGroups: eg ? eg[1].split(/\s*\/\s*/).map(s => s.trim()) : [],
        hatchDays: eh ? (parseInt(eh[1]) || eh[1].trim()) : null,
        diet:      diet ? diet[1].trim() : null,
        habitat:   hab  ? hab[1].trim()  : null,
    };
}

function parseBiologyNth(block, n) {
    const positions = [...block.matchAll(/Biology:/gi)].map(m => m.index);
    if (positions.length === 0) return null;
    // Use the Nth if available, else fall back to the last one (often shared)
    const idx = positions[n] !== undefined ? n : positions.length - 1;
    const start  = positions[idx];
    const endPos = positions[idx + 1] !== undefined ? positions[idx + 1] : block.length;
    return parseBiology(block.slice(start, endPos));
}

// ============================================================
// EVOLUTION
// ============================================================
function parseEvolution(block) {
    const m = block.match(/Evolution:\s*([\s\S]*?)(?=Proficiencies:|Biology:|$)/);
    if (!m) return null;
    const members = m[1].trim()
        .replace(/\n+/g, ' ')
        .split(/\s{2,}|\s*\n\s*/)
        .map(s => s.trim())
        .filter(Boolean);
    return members.length > 0 ? members : null;
}

function parseEvolutionNth(block, n) {
    const positions = [...block.matchAll(/Evolution:/gi)].map(m => m.index);
    if (positions.length === 0) return null;
    const idx = positions[n] !== undefined ? n : positions.length - 1;
    const start  = positions[idx];
    const endPos = positions[idx + 1] !== undefined ? positions[idx + 1] : block.length;
    return parseEvolution(block.slice(start, endPos));
}

// ============================================================
// PROFICIENCIES
// ============================================================
function parseProficiencies(block) {
    const m = block.match(/Proficiencies:\s*(.*)/i);
    if (!m) return [];
    return m[1].split('/')
        .map(s => s.replace(/\([^)]+\)/g, '').trim())
        .filter(Boolean);
}

function parseProficienciesNth(block, n) {
    const positions = [...block.matchAll(/Proficiencies:/gi)].map(m => m.index);
    if (positions.length === 0) return [];
    const idx = positions[n] !== undefined ? n : positions.length - 1;
    const start  = positions[idx];
    const endPos = positions[idx + 1] !== undefined ? positions[idx + 1] : block.length;
    return parseProficiencies(block.slice(start, endPos));
}

// ============================================================
// ENTRY SPLITTING
// ============================================================
function splitIntoEntries(lines) {
    const rawEntries = [];
    const SCAN_START = 2000;

    for (let i = SCAN_START; i < lines.length; i++) {
        const line = lines[i].trim();
        const typeMatch = line.match(TYPE_LINE_RE);
        if (!typeMatch) continue;

        // Scan backwards collecting up to 3 candidate species names (closest first).
        const candidates = []; // [{ name, isLegend }]
        for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
            const candidate = lines[j].trim();
            if (!candidate) continue;                       // empty → keep looking
            if (/^\d+$/.test(candidate)) continue;          // page number → keep looking
            // Stat labels (Speed:, Hit Points:, etc.) always break — they appear AFTER type
            // lines, so seeing them means we've overshot into the previous entry's stats.
            if (/^(Speed:|Hit Points:|Special Attack:|Special Defense:|Defense:|Attack:)/i.test(candidate)) break;
            // Content section headers (Moves, Passives, Skills) always break.
            if (/^(Moves|Passives|Skills)/i.test(candidate)) break;
            // Page-level navigation (Pokémon, Starter, etc.) always break.
            if (/^(Pok[eé]|Starter|Contents|Other|How to)/i.test(candidate)) break;
            // Entry-level sections (Proficiencies, Biology, Evolution) sometimes appear
            // between a species name and its type line in the PDF layout.
            // Only break if we already have a candidate; otherwise keep scanning.
            if (/^(Evolution|Biology|Proficien)/i.test(candidate)) {
                if (candidates.length > 0) break;
                else continue;
            }
            // Lines with '/' are dual-types or path-style strings — skip but keep looking.
            if (candidate.includes('/')) continue;
            // Skip lines that look like move entries (At-Will frequency marker).
            if (/\bAt-Will\b/.test(candidate)) continue;
            if (/^[A-Z]/.test(candidate) && candidate.length < 60) {
                candidates.push({
                    name:     candidate.replace(/\s*\(Legend\)\s*/g, '').trim(),
                    isLegend: /\(Legend\)/.test(candidate),
                });
                if (candidates.length >= 3) break;
            }
        }

        if (candidates.length === 0) continue;

        rawEntries.push({
            lineIdx:    i,
            species:    candidates[0].name,
            isLegend:   candidates[0].isLegend,
            candidates,
            types:  typeMatch[1].split(/\s*\/\s*/).map(t => t.trim()),
            size:   typeMatch[2],
            weight: typeMatch[3],
            dualColumn: false,
            dualRole:   null,
        });
    }

    // Post-process: detect dual-column pairs (type lines within 4 lines of each other).
    // On dual-column pages pdftotext outputs both type lines consecutively.
    // The two species names appear before the FIRST type line:
    //   candidates[0] (closer) = B's real name
    //   candidates[1] (further) = A's real name
    for (let i = 0; i < rawEntries.length - 1; i++) {
        const a = rawEntries[i];
        const b = rawEntries[i + 1];
        if (b.lineIdx - a.lineIdx > 4) continue;

        if (a.candidates.length >= 2) {
            a.species  = a.candidates[1].name;
            a.isLegend = a.candidates[1].isLegend;
            b.species  = a.candidates[0].name;
            b.isLegend = a.candidates[0].isLegend;
        }

        a.dualColumn = true;  a.dualRole = 'A';
        b.dualColumn = true;  b.dualRole = 'B';
        i++; // skip B in outer loop to avoid false chaining
    }

    return rawEntries;
}

// ============================================================
// ALL-Nth PARSING for a dual-column combined block
// ============================================================
function parseAllNth(combined, n) {
    const stats        = parseStatsNth(combined, n);
    const skills       = parseSkillsNth(combined, n);
    const passives     = parsePassivesNth(combined, n);
    const { moves, accuracyMods } = parseMovesNth(combined, n);
    const biology      = parseBiologyNth(combined, n);
    const evolution    = parseEvolutionNth(combined, n);
    const proficiencies = parseProficienciesNth(combined, n);
    return { stats, skills, passives, moves, accuracyMods, biology, evolution, proficiencies };
}

// ============================================================
// ENTRY OUTPUT BUILDER
// ============================================================
function buildEntryOut(entry, parsed) {
    const { stats, skills, passives, moves, accuracyMods, biology, evolution, proficiencies } = parsed;
    const out = {
        species: entry.species,
        types:   entry.types,
        size:    entry.size,
        weight:  entry.weight,
        stats: {
            hp:   stats.hp,
            atk:  stats.atk,
            def:  stats.def,
            satk: stats.satk,
            sdef: stats.sdef,
            spd:  stats.spd,
        },
        speedFt:  stats.speedFt,
        skills,
        passives,
        moves,
    };
    if (accuracyMods)         out.accuracyMods  = accuracyMods;
    if (biology)              out.biology        = biology;
    if (evolution)            out.evolution      = evolution;
    if (proficiencies.length) out.proficiencies  = proficiencies;
    if (entry.isLegend)       out.isLegend       = true;
    return out;
}

// Apply Nth-parsed content to an existing pokemon object (for post-processing fixups).
// Preserves existing stats (they were parsed correctly from the entry's own block).
function applyNthContent(pokemonObj, block, n) {
    const skills    = parseSkillsNth(block, n);
    const passives  = parsePassivesNth(block, n);
    const { moves, accuracyMods } = parseMovesNth(block, n);
    const bio       = parseBiologyNth(block, n);
    const evo       = parseEvolutionNth(block, n);
    const prof      = parseProficienciesNth(block, n);

    if (skills.length)    pokemonObj.skills    = skills;
    if (passives.length)  pokemonObj.passives  = passives;
    if (moves.length)     pokemonObj.moves     = moves;
    if (accuracyMods)     pokemonObj.accuracyMods = accuracyMods;
    if (bio)              pokemonObj.biology   = bio;
    if (evo)              pokemonObj.evolution  = evo;
    if (prof.length)      pokemonObj.proficiencies = prof;
}

// ============================================================
// MAIN PARSE
// ============================================================
function parse() {
    console.log('Reading raw text...');
    const rawText = fs.readFileSync(RAW_TXT, 'utf8');
    const text    = preprocessText(rawText);
    const lines   = text.split('\n');

    console.log(`Total lines: ${lines.length}`);

    const entryStarts = splitIntoEntries(lines);
    console.log(`Found ${entryStarts.length} species entries`);

    const dualPairs = entryStarts.filter(e => e.dualColumn && e.dualRole === 'A').length;
    if (dualPairs > 0) console.log(`  Dual-column pairs detected: ${dualPairs}`);

    const pokemon = [];

    for (let ei = 0; ei < entryStarts.length; ei++) {
        const entry = entryStarts[ei];

        // ── Detected dual-column pair (A + B processed together) ─────────
        if (entry.dualColumn && entry.dualRole === 'A') {
            const entryA = entry;
            const entryB = entryStarts[ei + 1];

            // Build one combined block covering both entries
            const startLn = Math.max(0, entryA.lineIdx - 5);
            const endLn   = ei + 2 < entryStarts.length
                ? entryStarts[ei + 2].lineIdx + 1
                : lines.length;
            const combined = lines.slice(startLn, endLn).join('\n');

            // Use Nth-occurrence parsing for everything — handles any interleaving pattern
            pokemon.push(buildEntryOut(entryA, parseAllNth(combined, 0)));
            pokemon.push(buildEntryOut(entryB, parseAllNth(combined, 1)));

            ei++; // skip entryB — already processed
            if ((ei + 1) % 100 === 0) {
                process.stdout.write(`  Processed ${ei + 1}/${entryStarts.length}...\r`);
            }
            continue;
        }

        // Role B guard — should never reach here due to ei++ above
        if (entry.dualColumn && entry.dualRole === 'B') continue;

        // ── Normal single-column entry ────────────────────────────────────
        const startLn = Math.max(0, entry.lineIdx - 5);
        let endLn     = ei + 1 < entryStarts.length
            ? entryStarts[ei + 1].lineIdx + 1
            : lines.length;
        // Cap block size: if the block extends far beyond the type line (e.g. the
        // last entry absorbing PDF appendix pages), limit it to 120 lines from
        // the type line so parseMoves doesn't pick up the appendix move list.
        const MAX_SINGLE_BLOCK = 120;
        if (endLn - entry.lineIdx > MAX_SINGLE_BLOCK) {
            endLn = entry.lineIdx + MAX_SINGLE_BLOCK;
        }
        const block = lines.slice(startLn, endLn).join('\n');

        const stats        = parseStats(block);
        const skills       = parseSkills(block);
        const passives     = parsePassives(block);
        const { moves, accuracyMods } = parseMoves(block);
        const biology      = parseBiology(block);
        const evolution    = parseEvolution(block);
        const proficiencies = parseProficiencies(block);
        const parsed = { stats, skills, passives, moves, accuracyMods, biology, evolution, proficiencies };

        const poke = buildEntryOut(entry, parsed);
        pokemon.push(poke);

        // ── Double-content detection (non-detected dual-column page) ──────
        // If this block contains 2+ "Passives:" sections, it absorbed a
        // neighbouring entry's content. Re-parse this entry with Nth=0,
        // and fix the most recent 0-moves pokemon using Nth=1.
        const passivesInBlock = (block.match(/Passives:/gi) || []).length;
        if (passivesInBlock >= 2) {
            // Re-parse this entry with Nth=0 (overrides what we just built)
            const fixed0 = parseAllNth(block, 0);
            // Keep correct stats (from parseStats which finds first occurrence = this entry's)
            Object.assign(poke, {
                skills:   fixed0.skills,
                passives: fixed0.passives,
                moves:    fixed0.moves,
            });
            if (fixed0.accuracyMods) poke.accuracyMods = fixed0.accuracyMods;
            if (fixed0.biology)      poke.biology       = fixed0.biology;
            if (fixed0.evolution)    poke.evolution     = fixed0.evolution;
            if (fixed0.proficiencies.length) poke.proficiencies = fixed0.proficiencies;

            // Fix the most recent 0-moves pokemon (the "lost" entry on the same page)
            for (let pi = pokemon.length - 2; pi >= Math.max(0, pokemon.length - 4); pi--) {
                if (pokemon[pi].moves.length === 0) {
                    applyNthContent(pokemon[pi], block, 1);
                    break;
                }
            }
        }

        if ((ei + 1) % 100 === 0) {
            process.stdout.write(`  Processed ${ei + 1}/${entryStarts.length}...\r`);
        }
    }

    // ── Post-process: fill in alternate forms that share content ──────────────
    // Alternate forms (e.g. Aegislash Shield/Sword, Wishiwashi Single/School,
    // Darmanitan / Zen Mode) share a single Skills+Passives+Moves block that
    // falls inside only one of their content windows.  For any entry with 0
    // moves, check the immediate neighbour with the same species-base name and
    // copy its content.
    const getBase = (s) => s.split(/[\s(]/)[0].toLowerCase();
    for (let i = 0; i < pokemon.length; i++) {
        const p = pokemon[i];
        if (p.moves.length > 0) continue;
        const baseCur = getBase(p.species);

        // Check previous entry first (handles detected-pair Zen Mode entries)
        if (i > 0) {
            const prev = pokemon[i - 1];
            if (prev.moves.length > 0 && getBase(prev.species) === baseCur) {
                if (p.skills.length === 0)   p.skills   = [...prev.skills];
                if (p.passives.length === 0) p.passives = [...prev.passives];
                p.moves = [...prev.moves];
                if (prev.accuracyMods) p.accuracyMods = prev.accuracyMods;
                continue;
            }
        }
        // Check next entry (handles sequential forms like Shield → Sword)
        if (i < pokemon.length - 1) {
            const next = pokemon[i + 1];
            if (next.moves.length > 0 && getBase(next.species) === baseCur) {
                if (p.skills.length === 0)   p.skills   = [...next.skills];
                if (p.passives.length === 0) p.passives = [...next.passives];
                p.moves = [...next.moves];
                if (next.accuracyMods) p.accuracyMods = next.accuracyMods;
            }
        }
    }

    return pokemon;
}

// ============================================================
// RUN
// ============================================================
const pokemon = parse();

const output = {
    version:     '3.0.0',
    lastUpdated: new Date().toISOString().split('T')[0],
    pokemon,
};

fs.writeFileSync(OUTPUT, JSON.stringify(output));

const withMoves  = pokemon.filter(p => p.moves.length > 0).length;
const withSkills = pokemon.filter(p => p.skills.length > 0).length;
const withHP     = pokemon.filter(p => p.stats.hp > 0).length;
const avgMoves   = pokemon.reduce((s, p) => s + p.moves.length, 0) / (pokemon.length || 1);

console.log(`\n✓ Wrote ${pokemon.length} entries to pokedex.min.json`);
console.log(`  With moves:  ${withMoves} (${((withMoves/pokemon.length)*100).toFixed(1)}%)`);
console.log(`  With skills: ${withSkills} (${((withSkills/pokemon.length)*100).toFixed(1)}%)`);
console.log(`  With HP>0:   ${withHP} (${((withHP/pokemon.length)*100).toFixed(1)}%)`);
console.log(`  Avg moves:   ${avgMoves.toFixed(1)}`);
console.log(`\nSample entries:`);
[0, 1, 2].forEach(i => {
    const p = pokemon[i];
    if (!p) return;
    console.log(`  [${i}] ${p.species} | HP:${p.stats.hp} ATK:${p.stats.atk} DEF:${p.stats.def} SATK:${p.stats.satk} SDEF:${p.stats.sdef} SPD:${p.stats.spd} | moves:${p.moves.length} skills:${p.skills.length}`);
});

// Report any remaining entries without moves
const noMoves = pokemon.filter(p => p.moves.length === 0);
if (noMoves.length > 0) {
    console.log(`\nEntries still missing moves (${noMoves.length}):`);
    noMoves.forEach(p => console.log(`  - ${p.species} [${p.types.join('/')}]`));
} else {
    console.log(`\n✓ All entries have moves!`);
}

// Spot-check key entries
const checks = ['Venusaur', 'Heracross', 'Pinsir', 'Lunatone', 'Solrock', 'Carbink', 'Klawf', 'Mothim'];
console.log(`\nSpot-checks:`);
checks.forEach(name => {
    const p = pokemon.find(x => x.species === name);
    if (!p) { console.log(`  ${name}: NOT FOUND`); return; }
    console.log(`  ${name} [${p.types.join('/')}]: HP=${p.stats.hp} moves=${p.moves.length} (${p.moves.map(m=>m.name).join(', ')})`);
});
