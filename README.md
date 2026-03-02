# PTA3 Dex — Pokémon Tabletop Adventures 3 Character Manager

A fan-made, non-commercial web application for managing trainers, Pokémon, stats, moves, and game data for the **Pokémon Tabletop Adventures 3 (PTA3)** tabletop RPG system.

This tool replaces spreadsheets and manual note-taking with a clean, interactive interface designed for long-running PTA3 campaigns.

> **Live Demo:** [https://leander-r.github.io/pta3-dex/](https://leander-r.github.io/pta3-dex/)

---

## Features

### Trainer Management
- **Profile & Stats** — Name, age, level, gender, and core stats (HP, ATK, DEF, SATK, SDEF, SPD) with creation-point and level-point tracking
- **Classes & Features** — Manage trainer classes with their associated features; skill picker for class-granted skills
- **Skills** — Rank-based skill system (Rank 1: +2 + mod, Rank 2: +4 + 2×mod); HP skills cap at Rank 1
- **Badges** — Track gym badges with a quick-stat display
- **Money** — Track Pokédollars (₽)
- **Stat Undo** — Step back the last stat change during allocation

### Pokémon Team
- **Party & Reserve** — Up to 6 active Pokémon plus an unlimited reserve box
- **Stat Calculations** — Automatic stats from level, nature, base stats, and added points
- **Move Management** — Separate natural (level-up) and taught move pools (4 slots each); move-learning prompt on level-up
- **Evolution Tracking** — View evolution chains; one-click evolve and devolve
- **Abilities** — Basic, Advanced, and Hidden abilities per species
- **Regional Forms** — Alolan, Galarian, Hisuian, and Paldean forms with correct sprites
- **Custom Moves & Species** — Create homebrew moves and entirely new species for your campaign
- **Bulk EXP** — Award experience to the whole party at once
- **Comparison** — Side-by-side stat comparison for two Pokémon

### Battle Tools
- **Dice Roller** — Roll move damage or trainer skill checks with full history
- **Combat Stages** — Track stat modifiers (−6 to +6) per Pokémon during battle
- **HP Tracking** — Current HP and damage for each party member
- **Discord Integration** — Send roll results to a channel via webhook

### Inventory
- **Item Management** — Add, remove, and adjust quantities
- **Item Database** — Browse and search the full PTA item database
- **Category Filters** — Filter by item type (Healing, Poké Balls, Held Items, etc.)

### Quick Reference
- **Pokédex Browser** — Look up any species' base stats, abilities, skills, level-up / egg / tutor moves, and evolution chain; search by name or filter by type
- **Type Chart** — Interactive type effectiveness chart
- **Natures** — Complete nature reference with stat modifiers
- **Moves Database** — Searchable and filterable database of all moves
- **Abilities Database** — Browse all Pokémon abilities
- **EXP Chart** — Experience requirements by level
- **Game Rules** — Quick reference for common PTA rules

### Share & Export
- **Export Cards** — Generate trainer and Pokémon cards as shareable images
- **Print Character Sheet** — Opens a print-ready HTML page (A4, auto-triggers the browser print dialog so you can save as PDF)
- **Export Trainer JSON** — Save a single trainer as a JSON backup
- **Export All Data** — Full backup of all trainers and inventory
- **Import Data** — Restore from any previously exported JSON file
- **Discord Embeds** — Copy trainer and team info as formatted Discord messages

### Data & User Experience
- **Auto-Save** — All changes saved instantly to localStorage; no Save button needed
- **Save Slots** — Three named save slots plus an auto-backup for point-in-time snapshots
- **Multi-Trainer** — Manage multiple trainers; clone or archive characters
- **Dark Mode** — Toggle between light and dark themes; preference persists across sessions
- **Compact Mode** — Tighter layout for smaller screens
- **Responsive Design** — Works on desktop, tablet, and mobile (bottom navigation bar on mobile)
- **Onboarding Checklist** — Step-by-step guide for new users
- **Contextual Help** — In-app help topics for stats, classes, move slots, combat stages, and more
- **Example Trainer** — Load a pre-built trainer (Red + Pikachu + Bulbasaur) to explore the interface

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **Vite** | Build tool & dev server |
| **Context API** | State management |
| **LocalStorage** | Trainer data persistence |
| **IndexedDB** | Pokédex data caching |
| **html2canvas** | Card image export |
| **Playwright** | End-to-end tests |
| **Vitest** | Unit tests |

---

## Getting Started

### Use Online (Recommended)

Visit the live site: **[https://leander-r.github.io/pta-dex/](https://leander-r.github.io/pta-dex/)**

No installation required — works in any modern browser.

### Run Locally

**Prerequisites:** [Node.js](https://nodejs.org/) v18 or higher

```bash
git clone https://github.com/leander-r/pta3-dex.git
cd pta3-dex
npm install
npm run dev        # dev server at http://localhost:5173
```

```bash
npm run build      # production build
npm run preview    # preview the production build
npm run test:run   # unit tests (Vitest)
npm run test:e2e   # end-to-end tests (Playwright)
```

---

## Usage Guide

### Creating Your First Trainer

1. Open the **Trainer** tab — a default trainer is ready to edit
2. Set your trainer's name, age, and gender
3. Allocate the 30 creation stat points (min 6 / max 14 per stat during creation)
4. Add a trainer class; pick your class-granted skills in the skill picker
5. Add features unlocked by your class
6. Level up to spend level stat points (1 per level, no per-stat cap)

### Adding Pokémon to Your Team

1. Go to the **Pokémon** tab and click **Add Pokémon**
2. Search for a species by name
3. Set level, nature, and nickname — stats calculate automatically
4. Add moves from the species' move pool (natural or taught)
5. Collapse the card when done; it stays in your party

### Battle & Dice Roller

1. Go to the **Battle** tab
2. Select **Pokémon** mode to roll move damage for a party member, or **Trainer** mode for skill checks
3. Adjust combat stages with the ± buttons; they apply to displayed stats automatically
4. Track HP damage directly on each Pokémon's combat row

### Exporting & Printing

Export actions live in the **Share & Export** section at the bottom of the sidebar:

- **Export Cards** — generate image cards for your trainer or Pokémon
- **Print Sheet** — opens a print-ready page; choose *Save as PDF* in the browser print dialog

JSON backups and the Import option are available via the **☰ menu** in the header.

### Multiple Trainers

- **☰ menu → New Trainer** to create another character
- Use the **trainer dropdown** in the header to switch
- **Clone Trainer** duplicates the active trainer
- **Archive Trainer** hides a trainer without deleting them

---

## Project Structure

```
pta-dex/
├── src/
│   ├── components/
│   │   ├── battle/        # Dice roller & combat tools
│   │   ├── common/        # Header, navigation, modals container
│   │   ├── inventory/     # Item management
│   │   ├── modals/        # All modal dialogs
│   │   ├── notes/         # Campaign notes
│   │   ├── pokemon/       # Pokémon cards & management
│   │   ├── reference/     # Pokédex browser, type chart, moves, etc.
│   │   └── trainer/       # Trainer profile & stats
│   ├── contexts/          # React context providers
│   ├── data/              # Game data, constants, loaders
│   ├── hooks/             # Custom React hooks
│   ├── styles/            # Global CSS
│   └── utils/             # Utility functions (sprites, export, types…)
├── e2e/                   # Playwright end-to-end tests
├── pokedex.min.json       # Pokémon species data
├── pta-game-data.min.json # PTA rules data (moves, abilities, classes…)
└── index.html
```

---

## License

The source code is released under the **MIT License** — see [LICENSE](LICENSE) for the full text.

### Trademark Notice

Pokémon, Pokémon character names, Nintendo, Game Freak, and all related marks are trademarks of Nintendo, Game Freak, Creatures Inc., and The Pokémon Company. This is an **unofficial fan-made tool** and is not affiliated with, endorsed by, or connected to any of those entities. No copyright infringement is intended.

---

## Attribution

- **Pokémon sprites** sourced from the [Pokémon Showdown](https://github.com/smogon/pokemon-showdown-client) open-source project; sprites are the property of Nintendo / Game Freak / The Pokémon Company.
- **PTA System** — game rules and data from the Pokémon Tabletop Adventures community.
- **Developer:** [leander_rsr](https://github.com/leander-r)
- **AI Assistance:** Development aided by Claude (Anthropic) for iteration, refactoring, and UI work.

---

*Made with ❤️ for the PTA community*
