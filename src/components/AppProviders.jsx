// ============================================================
// App Providers Component
// ============================================================
// Composes all context providers for the application.
//
// Provider order matters — outer providers are available to inner ones:
//   1. UIProvider       — UI state (modals, theme, notifications)
//   2. GameDataProvider — Pokédex, GAME_DATA, custom species
//   3. TrainerProvider  — Trainer state and actions
//   4. DataProvider     — Save/Load/Export; owns inventory
//   5. PokemonProvider  — Pokémon CRUD and move learning

import React from 'react';
import { UIProvider } from '../contexts/UIContext.jsx';
import { GameDataProvider } from '../contexts/GameDataContext.jsx';
import { TrainerProvider } from '../contexts/TrainerContext.jsx';
import { PokemonProvider } from '../contexts/PokemonContext.jsx';
import { DataProvider } from '../contexts/DataContext.jsx';

const AppProviders = ({ children }) => (
    <UIProvider>
        <GameDataProvider>
            <TrainerProvider>
                <DataProvider>
                    <PokemonProvider>
                        {children}
                    </PokemonProvider>
                </DataProvider>
            </TrainerProvider>
        </GameDataProvider>
    </UIProvider>
);

export default AppProviders;
