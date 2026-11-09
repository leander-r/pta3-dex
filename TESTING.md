# Testing Guide

This project uses two test runners:

- **Vitest** (`src/**/__tests__/*.test.{js,jsx}`) — unit tests for pure logic, hooks, and
  context providers. Runs in jsdom, no browser needed.
- **Playwright** (`e2e/*.spec.js`) — end-to-end tests against the real built app in
  Chromium, with `pokedex.min.json` / `pta-game-data.min.json` mocked via `page.route`.

Both run in CI on every push/PR to `main` (`.github/workflows/ci.yml`), so merging to
`main` already enforces a full regression pass. Use the categories below to decide what
to run *locally* while you work, and what to add when you change something.

## Commands cheat-sheet

| Command | What it runs | When to use it |
|---|---|---|
| `npm test` | Vitest in watch mode | While writing/fixing a unit test |
| `npm run test:run` | All Vitest unit tests, once | Before committing any logic change |
| `npm run test:coverage` | Unit tests + coverage report (text + `coverage/`) | Checking whether new logic is actually exercised |
| `npm run test:e2e:smoke` | Only `@smoke`-tagged Playwright tests | Fast sanity check — app boots, nav works |
| `npm run test:e2e` | Full Playwright suite | Before opening a PR, or after any UI/flow change |
| `npm run test:e2e:ui` | Playwright's interactive UI runner | Debugging a failing/flaky e2e test |

## Test categories

### 1. Smoke tests
**Goal:** "Is the app fundamentally broken?" — fast, shallow, covers the app shell.

- Live in `e2e/smoke.spec.js`, tagged `@smoke` in the test title.
- Run with `npm run test:e2e:smoke` (~10-15s). Run this first after pulling changes or
  before a longer session, and any time you touch `AppLayout.jsx`, `Header.jsx`, routing,
  or the data-loading boot sequence.
- Keep this suite shallow on purpose: it checks that each tab *navigates and renders*,
  not that every feature inside it works correctly. Deeper checks belong in category 2.

### 2. Feature / regression suites (existing behavior)
**Goal:** "Does this specific feature still behave correctly?"

- Unit level: one `__tests__` file per module, next to the module it tests
  (e.g. `src/contexts/__tests__/TrainerContext.test.jsx`). These are the PTA3 rule-engine
  tests — leveling, HP, point-buy, migrations, move caps, evolution, etc.
- E2E level: `e2e/trainer.spec.js`, `e2e/pokemon.spec.js` — multi-step user flows
  (edit → save → reload, add Pokémon → change tabs → verify state).
- Run the full suites (`test:run` + `test:e2e`) before opening a PR. This *is* the
  regression pass — there's no separate "regression suite" to maintain; keeping feature
  tests complete and passing is what regression testing means here.

### 3. New-feature tests
**Goal:** ship new logic with tests from the start, not bolted on later.

When you add a feature, add tests in the same PR, placed by what changed:

| You added... | Put tests in |
|---|---|
| A pure calculation/formula | `src/utils/__tests__/<file>.test.js` |
| A `use*` hook | `src/hooks/__tests__/<hook>.test.js` (use `renderHook` from `@testing-library/react`) |
| Context state/actions (Trainer/Pokemon/Data/...) | `src/contexts/__tests__/<Context>.test.jsx` — mock sibling contexts it depends on (see pattern below) |
| A leaf UI component (reads context via props/hooks, renders) | `src/components/<area>/__tests__/<Component>.test.jsx` with React Testing Library — mock `'../../../contexts/index.js'` directly (see pattern below) |
| A new tab, modal, or multi-step user flow | A new `e2e/<feature>.spec.js`, following the `page.route` mocking pattern already used in `e2e/smoke.spec.js` |
| A new nav tab or app-shell affordance | Also extend `e2e/smoke.spec.js` with one shallow `@smoke`-tagged check |

**Mocking sibling contexts in a context-provider test** (testing `TrainerContext`/
`PokemonContext` themselves): they call `useGameData()` / `useUI()` / `useModal()` /
`useData()`. Don't pull in the *real* providers (they do network fetches and IndexedDB).
Instead `vi.mock` the sibling context module with either a static object (if the test
never needs it to change) or a tiny stateful stand-in built with
`createContext`/`useState` (if the code under test reads *and* writes that state — see
`PokemonContext.test.jsx` for the full pattern, and `TrainerContext.test.jsx` for the
simpler static-mock version).

**Mocking contexts in a leaf-component test** (testing a component that *consumes* a
context, not the context itself): every component imports its hooks from the single
barrel file `src/contexts/index.js`, so mock that one module with `vi.fn()` per hook and
set `.mockReturnValue({...})` per test — no providers, no React state plumbing needed.
See `TrainerStats.test.jsx`, `TrainerSkills.test.jsx`, `TrainerClasses.test.jsx`,
`MoveLearnModal.test.jsx`, and `PokemonCard.test.jsx` for the pattern. Pure-props
components with no context dependency (`CombatStagesPanel`, `TypeMatchupDisplay`) need no
mocking at all — render them directly.

### 4. Defect-fix tests
**Goal:** every bug fix comes with a test that fails before the fix and passes after.

When fixing a bug:

1. Write a test that reproduces it — add it to the existing `__tests__` file for the
   module where the bug lives (or create one if none exists yet).
2. Confirm it fails against the old code (`git stash` the fix, run the test, `git stash pop`).
3. Apply the fix; confirm the test now passes.
4. Leave a one-line comment on the test *only* if the failure mode is non-obvious from
   the test body alone (e.g. a specific input combination that triggered it) — don't
   reference issue numbers or "regression test for X" boilerplate; the test's assertions
   should speak for themselves.

If the bug was in app behavior rather than pure logic (e.g. a UI flow silently doing the
wrong thing), add the repro as a Playwright test in the relevant `e2e/*.spec.js` file
instead.

## Current coverage snapshot

Run `npm run test:coverage` for exact numbers. As of this pass (347 unit tests / 21
files, 37 e2e tests / 6 files):

- **Well covered (logic):** `utils/dataUtils.js`, `utils/dataMigration.js` (incl.
  `capImportedPayloadSizes`), `utils/inventoryUtils.js`, `utils/exportUtils.js`,
  `utils/discordEmbeds.js`, `utils/typeUtils.js`, `utils/storageUtils.js`,
  `hooks/useInventory.js`, `hooks/useDiceRoller.js`, `contexts/TrainerContext.jsx`,
  `contexts/PokemonContext.jsx`.
- **Covered (components):** `ConfirmModal`, `ErrorBoundary`, `CombatStagesPanel`,
  `TypeMatchupDisplay`, `TrainerStats`, `TrainerSkills`, `TrainerClasses`,
  `MoveLearnModal`, `CustomFeatureModal`, `PokemonCard` (focused subset — it's ~2500
  lines; the evolution edit panel and move/held-item browsers are not unit-tested, only
  smoke-checked via `e2e/pokemon.spec.js`).
- **Covered (e2e):** app shell navigation (`smoke.spec.js`), Trainer and Pokémon Team
  flows, Inventory (add/expand/remove an item), GM Tools (all 8 sub-sections navigate +
  Capture Calculator computes), Quick Reference (all 8 sub-sections navigate).
- **Known gap:** `DataContext.jsx`, `GameDataContext.jsx`, `UIContext.jsx`,
  `ModalContext.jsx` have no dedicated unit tests of their own (only exercised indirectly
  via mocking in other tests) — notably the two `DataContext.jsx` migration-pipeline
  fixes below have no direct unit test, only the manual full-suite verification done when
  they were fixed. Most components under `src/components/battle/`, `src/components/gm/`,
  `src/components/reference/`, `src/components/inventory/`, and `src/components/notes/`
  have no unit tests — e2e smoke coverage only. Treat these as the next places to add
  coverage, not as acceptable blind spots.

## Bugs found and fixed via this test pass

Writing tests against actual behavior (rather than assuming the code is correct), plus a
broad 5-way parallel code review across the whole `src/` tree, surfaced real production
bugs — each now fixed with a regression test pinning the correct behavior:

1. **`TrainerContext.calculateModifier`** did an internal `trainer.stats[key]` lookup, but
   its only real caller (`TrainerStats.jsx`) always passed the raw stat *value* — so every
   stat modifier badge in the Trainer Stats panel always showed `+0`. Fixed to operate
   directly on the value (matching `dataUtils.calcModifier` and the HB1 rule "modifier =
   stat/2, rounding down"). See `TrainerContext.test.jsx` → `calculateModifier` and
   `TrainerStats.test.jsx` → "stat modifier display".
2. **`PokemonCard.jsx` HP controls**: `PokemonTab.jsx` binds `updatePokemon` to each card
   as a single-argument closure (`(updates) => updatePokemon(pokemon.id, updates)`), but
   5 call sites (−1/+1/Full-heal HP buttons, Clear-all-boosts, and the temp-boost remove
   ×) called it with *two* arguments, silently dropping the real update. Fixed to call
   with one argument, matching every other call site in the file. See
   `PokemonCard.test.jsx` → "Current HP controls".
3. **`TrainerClasses.doRemoveClass`** never cleared `trainer.primaryBaseClass` when the
   removed class *was* the primary base class. Since the only place that reassigns it only
   fires when falsy, this permanently blocked the Level 15 capstone feature. Fixed to
   promote the oldest remaining secondary base class (or clear to `''` if none). See
   `TrainerClasses.test.jsx` → "removing a class".
4. **`CustomFeatureModal.jsx`** never reset the shared `customFeature` context state on
   close or after adding, so reopening the modal silently pre-filled the previous
   feature's values. Fixed to reset to a blank shape on both paths. See
   `CustomFeatureModal.test.jsx`.
5. **`DataContext.jsx` migration gaps**: `restoreAutoBackup` and the single-trainer
   branch of `importData` both skipped the PTA3 migration pipeline
   (`migrateSaveData`/`cleanupLegacyFeatures`/`fixStatPointAccounting`) that `loadData`
   and the multi-trainer import branch already ran — restoring an old auto-backup or
   importing an old single-trainer export file would silently load unconverted
   pre-PTA3 data. Fixed both to run the same pipeline.
6. **Unvalidated bulk import size** (security hardening, not a functional bug): the
   multi-trainer/single-trainer import path had no size caps on arrays/strings, unlike
   `exportUtils.importSinglePokemon`. Added `dataMigration.capImportedPayloadSizes`
   (caps trainers/party/reserve/moves/inventory/notes/etc. to generous-but-bounded
   limits) and wired it into `importData` right after parsing, before anything else
   touches the file's contents. See `dataMigration.test.js` →
   `capImportedPayloadSizes`.
7. **`PokemonCard.jsx` species dropdown**: the Info tab's inline species-search
   dropdown reimplemented species/ability/move application independently of
   `PokemonContext.applySpeciesToPokemon` (the function `RegionalFormModal` uses), and
   had diverged — it wrote an `abilities`/`availableAbilities` shape nothing in the
   file ever reads, and never set `pokemon.ability` (the field the Info tab's ability
   dropdown actually uses), so picking a species from this specific dropdown silently
   left the ability blank. Fixed by delegating to the context function instead of
   reimplementing it. See `PokemonCard.test.jsx` → "species selection (Info tab)".

## Low-severity cleanups from the same review pass

Fixed alongside the bugs above (no behavior change intended, verified against the full
suite + a manual Playwright-driven click-through of the Dice Roller tab for the
`calcModifier` consolidation):

- **`Header.jsx`** import file input never reset `e.target.value`, so re-selecting the
  same filename after a failed/cancelled import silently did nothing. Now resets on
  every change.
- **`BattleTab.jsx`** `rollHealItem` read `party` instead of `actorParty` — harmless
  today only because Heal mode forces `actorSource` back to `'player'`, but a latent
  bug if that invariant is ever relaxed. Fixed to match every other actor-aware lookup
  in the file.
- **Dead code removed**: `SkillPickerModal.jsx` (+ its `ModalContext` state and
  `ModalsContainer`/`modals/index.js` wiring — nothing ever set `show: true`),
  `AppContext.js`/`useAppContext` (no `AppContext.Provider` exists anywhere in the
  tree — calling it would always throw), `useLocalStorage.js`/`usePersistentStorage`
  (zero consumers; `DataContext.jsx` reimplements the same debounced-save pattern
  independently), and `UIComponents.jsx` in its entirety (zero files import from it —
  every apparent "usage" found by name-grep was an unrelated same-named local
  component or plain text elsewhere, e.g. `TypeChartSection.jsx`'s own local
  `TypeBadge`).
- **Stat-modifier formula consolidation**: `⌊stat/2⌋` was independently reimplemented
  as inline `Math.floor(x / 2)` in `TrainerSkills.jsx` (2 sites) and, once audited
  further, 10 more sites across `BattleTab.jsx` plus 1 in `useDiceRoller.js` — all now
  call the single tested `dataUtils.calcModifier`. This is the same duplication
  pattern that caused bug #1 above (one copy was wrong, the others masked it).
