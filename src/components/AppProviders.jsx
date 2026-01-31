// ============================================================
// App Providers Component
// ============================================================
// Composes all context providers for the application

import React from 'react';
import { UIProvider } from '../contexts/UIContext.jsx';
import { GameDataProvider } from '../contexts/GameDataContext.jsx';

/**
 * AppProviders - Wraps the application with all necessary context providers
 * This component composes the provider hierarchy to reduce nesting in App.jsx
 */
const AppProviders = ({ children, customSpecies, setCustomSpecies }) => {
    return (
        <UIProvider>
            <GameDataProvider
                customSpecies={customSpecies}
                setCustomSpecies={setCustomSpecies}
            >
                {children}
            </GameDataProvider>
        </UIProvider>
    );
};

export default AppProviders;
