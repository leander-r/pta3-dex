// ============================================================
// PTA MANAGER - MAIN APPLICATION COMPONENT
// ============================================================
// Created by: leander_rsr | All Rights Reserved
//
// LEGAL DISCLAIMER & COPYRIGHT NOTICE
// This is an UNOFFICIAL, NON-COMMERCIAL fan-made tool created for personal use
// with the Pokémon Tabletop Adventures (PTA) tabletop role-playing game system.
//
// TRADEMARK NOTICE:
// Pokémon, Pokémon character names, Nintendo, Game Freak, and all related marks
// are trademarks, registered trademarks, or copyrights of Nintendo, Game Freak,
// Creatures Inc., and The Pokémon Company.

import React from 'react';
import AppProviders from './components/AppProviders.jsx';
import AppLayout from './components/AppLayout.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

const PTAManager = () => (
    <ErrorBoundary>
        <AppProviders>
            <AppLayout />
        </AppProviders>
    </ErrorBoundary>
);

export default PTAManager;
