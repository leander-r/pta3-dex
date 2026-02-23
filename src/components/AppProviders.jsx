// ============================================================
// App Providers Component
// ============================================================
// Composes all context providers for the application.
//
// Provider order matters — outer providers are available to inner ones:
//   1. UIProvider       — navigation, theme, save indicator, notifications, Pokemon edit
//   2. ModalProvider    — all modal state (isolated to reduce re-renders)
//   3. FilterProvider   — reference tab filter state
//   4. GameDataProvider — Pokédex, GAME_DATA, custom species
//   5. TrainerProvider  — Trainer state and actions
//   6. DataProvider     — Save/Load/Export; owns inventory
//   7. PokemonProvider  — Pokémon CRUD and move learning

import React from 'react';
import { UIProvider } from '../contexts/UIContext.jsx';
import { ModalProvider } from '../contexts/ModalContext.jsx';
import { FilterProvider } from '../contexts/FilterContext.jsx';
import { GameDataProvider } from '../contexts/GameDataContext.jsx';
import { TrainerProvider } from '../contexts/TrainerContext.jsx';
import { PokemonProvider } from '../contexts/PokemonContext.jsx';
import { DataProvider } from '../contexts/DataContext.jsx';

const AppProviders = ({ children }) => (
    <UIProvider>
        <ModalProvider>
            <FilterProvider>
                <GameDataProvider>
                    <TrainerProvider>
                        <DataProvider>
                            <PokemonProvider>
                                {children}
                            </PokemonProvider>
                        </DataProvider>
                    </TrainerProvider>
                </GameDataProvider>
            </FilterProvider>
        </ModalProvider>
    </UIProvider>
);

export default AppProviders;
