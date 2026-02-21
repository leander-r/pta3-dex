# PTA Dex — Improvement Roadmap

This file tracks the prioritized improvement list so it persists across sessions.

---

## Priority 1 — Bugs (Data Loss / Crash Risk) ✅ DONE (commit 36086d6)
1. ✅ File import has no size check before reading (`DataContext.jsx`)
2. ✅ Pokédex load falls through on undefined `responseText` (`pokedexLoader.js`)
3. ✅ IndexedDB connection not closed on transaction error (`pokedexLoader.js`)
4. ✅ `sessionStorage` parse in BattleTab not wrapped (`BattleTab.jsx` line ~23)
5. ✅ Discord send errors are silently swallowed (`useDiscordWebhook.js` / `DataContext.jsx`)

## Priority 2 — Security ✅ DONE (commit 669b1ba)
6. ✅ No CORS mode specified on external fetches (`App.jsx`, `pokedexLoader.js`)
7. ✅ `JSON.parse` used without try/catch in some non-utility spots

## Priority 3 — Performance ✅ DONE (commit 0d7c590)
8. ✅ Species/Pokédex dropdown renders all 1000+ entries on every keystroke (no memoization/virtualization in `PokemonCard.jsx`)
9. ✅ `filteredSpecies` not memoized in `PokemonCard.jsx`
10. ✅ Callback props not wrapped in `useCallback` (`updatePokemon`, `deletePokemon`, etc.)
11. ✅ Duplicate level-up move lookup logic in both `App.jsx` and `GameDataContext.jsx`
12. ✅ Roll history reads `sessionStorage` on every render instead of in `useState` initializer (`BattleTab.jsx`)

## Priority 4 — UX / Accessibility ✅ DONE (commit 49acdbf)
13. ✅ No focus trap in modals (`ConfirmModal.jsx`)
14. ✅ Loading spinner has no accessible label (`App.jsx`)
15. ✅ Form inputs missing `<label>` elements (several modals)
16. ✅ Nav buttons lack `aria-label` (`App.jsx` sidebar)
17. ✅ Modal not clamped to viewport on very small screens (fixed `maxWidth: 480px`)
18. ✅ No loading state UI on export/import operations
19. ✅ Search filters reset on tab switch (Pokémon tab)

## Priority 5 — Code Quality / Maintainability ✅ DONE
*(Vitest tests, TypeScript types, Discord warning already done in previous session)*
20. ✅ `App.jsx` is ~709 lines — extracted `<AppLayout>`, `<MainNavigation>`, `<ModalsContainer>`
21. ✅ Trainer state lives in 3 places — consolidated into `TrainerContext.jsx`; contexts cross-consume via hooks
22. ✅ Magic numbers scattered throughout — created `src/data/constants.js`
23. ✅ Inconsistent error handling — standardized try/catch + toast in touched files; added guard in `duplicateTrainer`
24. ✅ No React Error Boundaries — per-tab `<ErrorBoundary inline>` + top-level boundary added

## Priority 6 — Missing Features ✅ DONE
25. ✅ Undo for destructive deletes — 5-second toast with Undo button after releasing Pokémon or deleting trainer (`PokemonContext.jsx`, `TrainerContext.jsx`, `toast.js`, `ToastContainer.jsx`)
26. ✅ Dark mode toggle — already present in `Header.jsx` (OS preference + manual toggle)
27. ✅ Trainer archiving — soft-delete with Archive/Restore in character menu; archived trainers hidden from selector (`TrainerContext.jsx`, `Header.jsx`)
28. ✅ Bulk Pokémon EXP — `BulkExpModal` wired to "Award EXP" button in `PokemonTab.jsx`
29. ✅ Auto-backup — rolling snapshot of previous save written to `pta-auto-backup` before each save; "Restore Auto-Backup" in character menu (`DataContext.jsx`, `Header.jsx`)
30. ✅ Filter persistence — type filter, sort direction, and sort field persisted to localStorage across sessions (`PokemonTab.jsx`)
