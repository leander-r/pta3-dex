# PTA3 Full Adaptation Plan

## Context
The app was built against an older/custom PTA ruleset that diverges significantly from the
new PTA3 books. This plan adapts every mechanical rule and data set to the new version.

---

## Key Rule Differences (old → new)

| Area | Old | New |
|---|---|---|
| Trainer stats | 6 (hp/atk/def/satk/sdef/spd), base 6, 30 pts, cap 14 | **5** (atk/def/satk/sdef/spd), no HP stat, values 1–10, array [2,3,4,5,6] or point-buy 25 pts |
| Trainer HP | `(hp_stat × 4) + (level × 4)` | Fixed **20**, +1d4 at levels 3 / 7 / 11 |
| Stat modifier | `stat − 10` / `⌊(stat−10)/2⌋` | `⌊stat / 2⌋` |
| Leveling | EXP, max 50 | **Honors** (Gym Badges, Ribbons…), max 15 |
| Stat increase | every level | **+1 to two different stats only at Lv 3 / 7 / 11** (HB1: "You only gain new stats at levels 3, 7, and 11") |
| Class unlocks | Lv 5 / 12 / 24 | **Lv 3 / 7 / 11** |
| Trainer classes | 3 placeholders | 7 base (5 HB1 + 2 HB2) × 5 advanced each |
| Trainer skills | 24 skills, 2d6 + rank bonus | **18 skills**, 1d20 + talent bonus (+2/+5) |
| Pokémon HP | `level + (hp_stat × 3)` | **Fixed species value** from Pokédex entry |
| Pokémon stat alloc | addedStats (1 pt/level) | **None** — stats fixed from Pokédex |
| Nature modifier | ±2 | **±1** |
| Move cap | 4 natural + 4 taught = 8 | **6 total** (no distinction) |
| Move frequency | "At-Will" / "Battle - X" | "At-Will" / "3/day" / "1/day" |
| STAB | +1 per 5 levels (scaling) | **Fixed +4** |
| Combat stages | `base × (1 + stages × 0.25)` | **Flat** `base + stages × 2` |
| Type effectiveness | Multiplier display | **+1/−1 die** description |

---

## Phase 1 — Constants (`src/data/constants.js`) ✅ DONE

- `BASE_STAT_VALUE`: 6 → **1**
- `CREATION_STAT_POINTS`: 30 → **25**
- `CREATION_STAT_CAP`: 14 → **6**
- `MAX_TRAINER_LEVEL`: 50 → **15**
- `CLASS_2_MIN_LEVEL`: 5 → **3**
- `CLASS_3_MIN_LEVEL`: 12 → **7**
- `CLASS_4_MIN_LEVEL`: 24 → **11**
- Removed `TRAINER_STAT_NEUTRAL`, `TRAINER_HP_MULTIPLIER`, `POKEMON_HP_MULTIPLIER`
- Removed `MAX_NATURAL_MOVES` + `MAX_TAUGHT_MOVES` (deprecated with stubs)
- Added `MAX_TOTAL_MOVES = 6`
- Replaced multiplier constants with `COMBAT_STAGE_FLAT_PER_STAGE = 2`
- Added `STAB_BONUS = 4`
- Updated `DEFAULT_TRAINER`: removed `stats.hp`, added `maxHp: 20`, `hpRolls: []`, `honors: 0`, stat defaults to `{ atk:3, def:3, satk:3, sdef:3, spd:3 }`
- Updated `DEFAULT_POKEMON`: removed `addedStats`, `statAllocationHistory`, `statPointsAvailable`; updated `baseStats` defaults
- Added `HONOR_THRESHOLDS`, `HP_MILESTONE_LEVELS`, `POINT_BUY_COSTS`

---

## Phase 2 — Fallback Data (`src/data/configs.js`) ✅ DONE

- All 25 natures with correct ±1 values and flavor mappings
- 18 PTA3 skills with stat groupings, types (check/opposed/passive)
- 7 base trainer classes + 35 advanced classes with `skillPool` and `advancedClasses`
- Updated move frequency strings: "Battle - 2"→"3/day", "Battle - 1"→"1/day"
- Removed `pokemonExpChart` and `trainerLevelProgression`
- Added `honorThresholds`

---

## Phase 3 — Data Migration (`src/utils/dataMigration.js`) ✅ DONE

- New file: `migrateSaveData(data)` detects old format (`stats.hp` present) and converts
- Trainer migration: removes `stats.hp`, scales remaining stats to 1–10 range, replaces `experience` with `honors`
- Pokémon migration: merges `baseStats + addedStats`, removes allocation fields, normalizes move frequencies
- Trigger added to `DataContext.jsx`: runs after `migrateOldData()`, shows toast on migration, re-saves immediately

---

## Phase 4 — Stat Formulas (`src/utils/dataUtils.js`) ✅ DONE

- `calcModifier(stat)`: `Math.floor(stat / 2)` (removed neutral=10 logic)
- `applyNature()`: ±1 modifier (was ±2; removed HP special-case)
- `applyCombatStage()`: flat `base + stages × 2` (was multiplier)
- `getCombatStagePercent()`: now returns flat delta string
- `calculateSTAB()`: returns fixed `STAB_BONUS = 4` (was level-based table)
- `getActualStats()`: no addedStats merge; just applies nature ±1 to baseStats
- `calculatePokemonHP()`: returns `actualStats.hp` (was formula)

---

## Phase 5 — Trainer Model (`src/contexts/TrainerContext.jsx`) ✅ DONE

- `calculateModifier()`: `⌊stat/2⌋`
- `calculateMaxHP()`: `20 + hpRolls.reduce(...)`
- `updateTrainerStat()`: PTA3 point-buy costs from `POINT_BUY_COSTS`
- `levelUpTrainer()`: honor-based, milestone HP roll at Lv 3/7/11
- `levelDownTrainer()`: reverse honor logic
- `rollMilestoneHP()`: appends 1d4 to `hpRolls`
- Class unlock thresholds: Lv 3 / 7 / 11
- `respecTrainer()`: reset to new defaults

---

## Phase 6 — Trainer UI

### `TrainerStats.jsx`
- Remove HP stat from `STAT_CONFIG`
- Add HP section: "HP: currentHp / maxHp (20 base + rolls)"
- "Roll HP Bonus" button at milestone levels 3/7/11
- Update modifier display: `⌊stat/2⌋`
- Update min/max: 1–10

### `TrainerSkills.jsx`
- Rename "ranks" → "talents"
- Update to 18 PTA3 skills
- Talent bonus: 0→+0, 1→+2, 2→+5
- Mark Concentration/Constitution as Passive
- Remove HP skill group

### `TrainerClasses.jsx`
- Level thresholds: Lv 3 / 7 / 11
- Class skill pool from new data
- Skill talent cap: max 2 per skill

---

## Phase 7 — Pokémon Model

### `src/contexts/PokemonContext.jsx`
- Remove `addedStats`, `statAllocationHistory`, `statPointsAvailable`
- Remove `addStat()` / `removeStat()` actions
- Remove `statPointsForLevelUp/Down/Relevel()` helpers
- Nature ±1 (via updated `dataUtils`)
- Species selection copies stats directly from Pokédex

### `src/hooks/usePokemon.js`
- Remove stat allocation helpers
- `getPokemonStats()`: apply nature ±1, return HP directly
- `getMaxHP()`: return `actualStats.hp`

---

## Phase 8 — Pokémon UI

### `PokemonCard.jsx`
- Remove stat allocation UI (+/− buttons, stat point counter)
- Read-only stats + nature modifier highlight (±1 coloring)
- HP: `currentHp / maxHp` where `maxHp = baseStats.hp ± natureModifier`
- Skills as tag chips

### `MoveLearnModal.jsx`
- Move cap: `MAX_TOTAL_MOVES = 6`
- Remove natural/taught pool logic
- Warning: "Already knows 6 moves"

---

## Phase 9 — Battle Mechanics

### `CombatStagesPanel.jsx`
- Replace multiplier formula with flat `base + stages × 2`
- Update tooltip: "+1 stage = +2 to stat"

### `TypeMatchupDisplay.jsx`
- Update descriptions: "x2"→"super effective (+1 die)", "x4"→"+2 dice", "x½"→"resistant (−1 die)", "x¼"→"−2 dice"

---

## Phase 10 — Reference Section

### `GameRulesSection.jsx`
- Rewrite all 5 sections with PTA3 content

### `NaturesSection.jsx`
- Show ±1 modifier
- Add 5 neutral natures to table

---

## Phase 11 — JSON Data File (`pta-game-data.min.json`)

- 25 natures, 18 skills, 7 base + 35 advanced classes
- Updated move frequency strings
- Remove `pokemonExpChart`
- Add `honorThresholds`

---

## Critical Files

| File | Change Type | Status |
|---|---|---|
| `src/data/constants.js` | Constants update | ✅ Done |
| `src/data/configs.js` | Full GAME_DATA fallback replacement | ✅ Done |
| `src/utils/dataUtils.js` | Formula rewrites | ✅ Done |
| `src/utils/dataMigration.js` | New file — migration function | ✅ Done |
| `src/contexts/DataContext.jsx` | Add migration trigger on load | ✅ Done |
| `src/contexts/TrainerContext.jsx` | Trainer model: HP, honors, class unlocks | ✅ Done |
| `src/hooks/useTrainer.js` | Formula helpers | ✅ Done |
| `src/components/trainer/TrainerStats.jsx` | 5 stats + flat HP UI | ✅ Done |
| `src/components/trainer/TrainerSkills.jsx` | New skills + talent system | ✅ Done |
| `src/components/trainer/TrainerClasses.jsx` | New unlock levels + class data | ✅ Done |
| `src/contexts/PokemonContext.jsx` | Remove stat allocation | ✅ Done |
| `src/hooks/usePokemon.js` | Remove stat allocation helpers | ✅ Done |
| `src/components/pokemon/PokemonCard.jsx` | Read-only stats, single move pool | ✅ Done |
| `src/components/modals/MoveLearnModal.jsx` | 6-move cap | ✅ Done |
| `src/components/battle/CombatStagesPanel.jsx` | Flat stage formula | ✅ Done |
| `src/components/reference/GameRulesSection.jsx` | Rewritten rules | ✅ Done |
| `src/components/reference/NaturesSection.jsx` | 25 natures, ±1 | ✅ Done |
| `src/components/battle/TypeMatchupDisplay.jsx` | Die-count descriptions | ✅ Done |
| `pta-game-data.min.json` | Updated game data v3.0 | ✅ Done |
| `pokedex.min.json` | Full re-extraction from PTA3Pokedex.pdf | ✅ Done |
| `src/data/pokedexLoader.js` | Support new entry format (skills as array, etc.) | ✅ Done |

---

## Phase 12 — Pokédex Extraction (`pokedex.min.json`) ✅ DONE

**Source:** `reference material/PTA3Pokedex.pdf` (83 MB, ~814 pages)
**Target:** `pokedex.min.json` (replace current 812-entry old-format file)

The current `pokedex.min.json` uses the old PTA format:
- `baseStats.hp: 5` (tiny old multiplier value; should be 25–50+)
- Skills as numeric movement values `{ overland: 7, jump: 2, swim: 0 }` (should be string arrays `["Sprouter", "Threaded"]`)
- No move lists per species

### New entry format
```json
{
  "species": "Bulbasaur",
  "types": ["Grass", "Poison"],
  "size": "Small",
  "weight": "Light",
  "stats": { "hp": 30, "atk": 5, "def": 6, "satk": 7, "sdef": 7, "spd": 5 },
  "speedFt": 25,
  "skills": ["Sprouter", "Threaded"],
  "passives": ["Growl", "Overgrow"],
  "moves": [
    { "name": "Tackle", "range": "Melee", "type": "Normal", "accuracyType": "Attack", "frequency": "At-Will", "damage": "2d6" },
    { "name": "Vine Whip", "range": "Melee", "type": "Grass", "accuracyType": "Attack", "frequency": "At-Will", "damage": "2d8" },
    { "name": "Leech Seed", "range": "Ranged(20ft)", "type": "Grass", "accuracyType": "Effect", "frequency": "1/day", "damage": null }
  ],
  "abilities": { "basic": ["Overgrow", "Chlorophyll"], "adv": [], "high": [] },
  "biology": { "eggGroups": ["Monster", "Grass"], "hatchDays": 10, "diet": "Phototroph", "habitat": "Forests/Jungles" },
  "evolution": { "from": null, "to": "Ivysaur", "method": "natural" },
  "rarity": "common"
}
```

### Approach
- Read the PDF in batches of ~30–40 pages using the Read tool (max 20 pages per call → 2 calls per batch)
- Extract each species entry into the new JSON format
- Accumulate into a single `pokedex.min.json` with `{ "version": "3.0.0", "lastUpdated": "...", "pokemon": [...] }`
- Also update `src/data/pokedexLoader.js` to support both old format (for backward compat) and new format (auto-detected by `skills` being an array vs. an object)

### Also update
- `src/data/pokedexLoader.js`: detect new format (`Array.isArray(entry.skills)`) and map fields accordingly

---

## Cleanup Pass — EXP System Removal

Additional files fixed after the main phases:

| File | Change |
|---|---|
| `src/components/modals/BulkExpModal.jsx` | Rewritten as Honor award modal for trainer |
| `src/components/pokemon/PokemonTab.jsx` | Button text: "Award EXP" → "Award Honors" |
| `src/types/index.ts` | Removed `experience`, `addedStats`, `statPointsAvailable`, `featPoints`; added `honors`, `maxHp`, `hpRolls`; split `TrainerStats` from `BaseStats` |
| `src/utils/dataUtils.js` | Removed `calculatePokemonLevel` + `getExpToNextLevel` (dead code) |
| `src/contexts/PokemonContext.jsx` | Removed local `calculatePokemonLevel`; removed EXP→level derivation in `updatePokemon` |
| `src/hooks/usePokemon.js` | Removed `calculatePokemonLevel` import + EXP branch |
| `src/utils/exportUtils.js` | Removed `experience` field from pokemon import |
| `src/utils/__tests__/dataUtils.test.js` | Updated all tests for PTA3 formulas (calcModifier, applyCombatStage, applyNature, calculatePokemonHP, calculateSTAB) |
| `src/utils/__tests__/exportUtils.test.js` | Removed deprecated fields from test fixtures |
