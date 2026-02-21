# PTA Dex — Improvement Roadmap

This file tracks the prioritized improvement list so it persists across sessions.

---

## Priority 1 — Bugs (Data Loss / Crash Risk) ✅ DONE (commit 36086d6)
1. ✅ File import has no size check before reading (`DataContext.jsx`)
2. ✅ Pokédex load falls through on undefined `responseText` (`pokedexLoader.js`)
3. ✅ IndexedDB connection not closed on transaction error (`pokedexLoader.js`)
4. ✅ `sessionStorage` parse in BattleTab not wrapped (`BattleTab.jsx` line ~23)
5. ✅ Discord send errors are silently swallowed (`useDiscordWebhook.js` / `DataContext.jsx`)

## Priority 2 — Security
6. No CORS mode specified on external fetches (`App.jsx`, `pokedexLoader.js`)
7. `JSON.parse` used without try/catch in some non-utility spots

## Priority 3 — Performance
8. Species/Pokédex dropdown renders all 1000+ entries on every keystroke (no memoization/virtualization in `PokemonCard.jsx`)
9. `filteredSpecies` not memoized in `PokemonCard.jsx`
10. Callback props not wrapped in `useCallback` (`updatePokemon`, `deletePokemon`, etc.)
11. Duplicate level-up move lookup logic in both `App.jsx` and `GameDataContext.jsx`
12. Roll history reads `sessionStorage` on every render instead of in `useState` initializer (`BattleTab.jsx`)

## Priority 4 — UX / Accessibility
13. No focus trap in modals (`ConfirmModal.jsx`)
14. Loading spinner has no accessible label (`App.jsx`)
15. Form inputs missing `<label>` elements (several modals)
16. Nav buttons lack `aria-label` (`App.jsx` sidebar)
17. Modal not clamped to viewport on very small screens (fixed `maxWidth: 480px`)
18. No loading state UI on export/import operations
19. Search filters reset on tab switch (Pokémon tab)

## Priority 5 — Code Quality / Maintainability
*(Vitest tests, TypeScript types, Discord warning already done in previous session)*
20. `App.jsx` is ~709 lines — extract `<AppLayout>`, `<MainNavigation>`, `<ModalsContainer>`
21. Trainer state lives in 3 places — consolidate into `TrainerContext.jsx`
22. Magic numbers scattered throughout — create `src/data/constants.js`
23. Inconsistent error handling patterns across modules
24. No React Error Boundaries — a crash in one tab takes down the whole app

## Priority 6 — Missing Features
25. No undo for destructive actions (deleting trainer/Pokémon is permanent)
26. No explicit dark mode toggle (OS preference only)
27. No trainer archiving (old trainers can only be deleted)
28. Bulk Pokémon operations not fully integrated (`BulkExpModal` exists but not wired up)
29. No auto-backup (reminder triggers after 7 days but no automatic export)
30. Filter persistence across sessions (sort/filter should survive page reloads)
