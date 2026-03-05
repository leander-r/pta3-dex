// ============================================================
// App Layout Component
// ============================================================
// Inner application shell. Lives inside AppProviders so it can
// consume all contexts directly — no prop drilling needed.

import React, { lazy, Suspense, useState, useEffect } from 'react';

// Data & Configs
import { DATA_CONFIG, POKEDEX_CONFIG, GAME_DATA } from '../data/configs.js';

// Tab Components — lazily loaded so each tab's JS is only parsed on first visit
import { TrainerTab } from './trainer'; // default tab: keep eager so no flash on load
const PokemonTab   = lazy(() => import('./pokemon/PokemonTab.jsx'));
const InventoryTab = lazy(() => import('./inventory/InventoryTab.jsx'));
const BattleTab    = lazy(() => import('./battle/BattleTab.jsx'));
const ReferenceTab = lazy(() => import('./reference/ReferenceTab.jsx'));
const NotesTab     = lazy(() => import('./notes/NotesTab.jsx'));

// Minimal spinner shown while a lazy tab chunk is downloading (first visit only)
const TabFallback = () => (
    <div
        role="status"
        aria-label="Loading tab"
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px'
        }}
    >
        <div
            aria-hidden="true"
            style={{
                width: '32px',
                height: '32px',
                border: '3px solid var(--border-light)',
                borderTopColor: '#667eea',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
            }}
        />
    </div>
);

// Common Components
import { Header, SaveIndicator, LevelUpNotification, MainNavigation, ModalsContainer } from './common';
import ToastContainer from './common/ToastContainer.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';

// Contexts
import { useUI } from '../contexts/UIContext.jsx';
import { useModal } from '../contexts/ModalContext.jsx';
import { useGameData } from '../contexts/GameDataContext.jsx';

// ── Clear Cache Button ───────────────────────────────────────
const ClearCacheButton = () => {
    const { showConfirm } = useModal();
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
                onClick={() => {
                    showConfirm({
                        title: 'Clear Cache',
                        message: 'Clear cached Pokédex and game data, then reload from the server?\n\nYour trainer data will be saved before refreshing.\n\nThis is useful if the data has been updated online or if you are experiencing issues with moves, abilities, or Pokémon not appearing correctly.',
                        confirmLabel: 'Clear & Reload',
                        danger: true,
                        onConfirm: () => {
                            try {
                                indexedDB.deleteDatabase(POKEDEX_CONFIG.dbName);
                                indexedDB.deleteDatabase(DATA_CONFIG.dbName);
                            } catch {}
                            window.location.reload();
                        }
                    });
                }}
                style={{
                    padding: '8px 16px',
                    fontSize: '12px',
                    background: 'linear-gradient(135deg, #42a5f5, #1e88e5)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: 'white',
                    fontWeight: '500',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
            >
                🔄 Refresh Game Data
            </button>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', maxWidth: '300px' }}>
                Clears cached Pokédex and game data (moves, abilities, items, etc.) and reloads the latest version from the server.
            </span>
        </div>
    );
};

// ── Main Layout ──────────────────────────────────────────────
const AppLayout = () => {
    const {
        activeTab, setActiveTab,
        showSaveIndicator, isAutoSave, lastSaveTime,
        levelUpNotification
    } = useUI();
    const { pokedex, pokedexLoading, pokedexError, gameDataLoaded } = useGameData();

    // Track which tabs have been visited so we mount them on first visit and
    // keep them mounted (CSS-hidden) thereafter — preserving local component state
    // (combat stages, search filters, selected section, etc.) across tab switches.
    const [visitedTabs, setVisitedTabs] = useState(() => new Set([activeTab]));
    useEffect(() => {
        setVisitedTabs(prev => {
            if (prev.has(activeTab)) return prev;
            const next = new Set(prev);
            next.add(activeTab);
            return next;
        });
    }, [activeTab]);

    return (
        <div className="container">
            {/* Skip to main content — keyboard / screen-reader navigation */}
            <a
                href="#main-content"
                style={{
                    position: 'absolute',
                    top: '-999px',
                    left: '-999px',
                    zIndex: 9999,
                    padding: '8px 16px',
                    background: '#667eea',
                    color: 'white',
                    borderRadius: '0 0 6px 6px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    textDecoration: 'none'
                }}
                onFocus={e => { e.currentTarget.style.top = '0'; e.currentTarget.style.left = '0'; }}
                onBlur={e => { e.currentTarget.style.top = '-999px'; e.currentTarget.style.left = '-999px'; }}
            >
                Skip to main content
            </a>

            {/* Toast Notifications */}
            <ToastContainer />

            {/* Save Indicator */}
            <SaveIndicator
                show={showSaveIndicator}
                isAuto={isAutoSave}
                saveTime={lastSaveTime}
            />

            {/* Level Up / Evolution Notification */}
            <LevelUpNotification notification={levelUpNotification} />

            {/* Header */}
            <Header />

            {/* Main Content */}
            <div className="main-content">
                {/* Sidebar Navigation */}
                <MainNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

                {/* ============================================== */}
                {/* MAIN CONTENT AREA                             */}
                {/* ============================================== */}
                <main id="main-content" className="content-area">

                    {/* Pokédex error banner (shown when data fails to load but app is not in loading state) */}
                    {pokedexError && !pokedexLoading && (
                        <div
                            role="alert"
                            style={{
                                margin: '16px 0',
                                padding: '12px 16px',
                                background: 'rgba(231, 76, 60, 0.15)',
                                border: '1px solid #e74c3c',
                                borderRadius: '8px',
                                color: '#e74c3c',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}
                        >
                            <span>⚠️</span>
                            <span>Failed to load Pokédex: {pokedexError}. Some features may be unavailable.</span>
                        </div>
                    )}

                    {/* Loading overlay while fetching Pokédex / game data */}
                    {(pokedexLoading || !gameDataLoaded) && (
                        <div
                            role="status"
                            aria-label="Loading application data"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '60px 20px',
                                textAlign: 'center',
                                color: 'var(--text-secondary)'
                            }}
                        >
                            <div
                                aria-hidden="true"
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    border: '4px solid var(--border-light)',
                                    borderTopColor: '#667eea',
                                    borderRadius: '50%',
                                    animation: 'spin 0.8s linear infinite',
                                    marginBottom: '20px'
                                }}
                            />
                            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
                                Loading Game Data...
                            </div>
                            <div style={{ fontSize: '13px' }}>
                                {pokedexLoading ? 'Fetching Pokédex...' : `Pokédex loaded (${pokedex.length} species)`}
                                {' / '}
                                {!gameDataLoaded ? 'Fetching moves & abilities...' : 'Game data ready'}
                            </div>
                        </div>
                    )}

                    {/* TrainerTab is the default landing tab — kept as an eager static
                        import so it renders immediately with no loading flash.
                        All other tabs use React.lazy: their JS chunk is fetched only
                        on first visit, then the tab stays mounted (CSS-hidden) so
                        local state (filters, combat stages, etc.) persists across switches. */}
                    <div style={{ display: activeTab === 'trainer' ? undefined : 'none' }}>
                        <ErrorBoundary inline><TrainerTab /></ErrorBoundary>
                    </div>

                    <Suspense fallback={<TabFallback />}>
                        {visitedTabs.has('pokemon') && (
                            <div style={{ display: activeTab === 'pokemon' ? undefined : 'none' }}>
                                <ErrorBoundary inline><PokemonTab /></ErrorBoundary>
                            </div>
                        )}
                        {visitedTabs.has('inventory') && (
                            <div style={{ display: activeTab === 'inventory' ? undefined : 'none' }}>
                                <ErrorBoundary inline><InventoryTab /></ErrorBoundary>
                            </div>
                        )}
                        {visitedTabs.has('battle') && (
                            <div style={{ display: activeTab === 'battle' ? undefined : 'none' }}>
                                <ErrorBoundary inline><BattleTab /></ErrorBoundary>
                            </div>
                        )}
                        {visitedTabs.has('reference') && (
                            <div style={{ display: activeTab === 'reference' ? undefined : 'none' }}>
                                <ErrorBoundary inline><ReferenceTab /></ErrorBoundary>
                            </div>
                        )}
                        {visitedTabs.has('notes') && (
                            <div style={{ display: activeTab === 'notes' ? undefined : 'none' }}>
                                <ErrorBoundary inline><NotesTab /></ErrorBoundary>
                            </div>
                        )}
                    </Suspense>
                </main>
            </div>

            {/* ========== MODALS ========== */}
            <ModalsContainer />

            {/* Footer with Legal Disclaimer */}
            <footer style={{
                marginTop: '40px',
                padding: '20px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '10px',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '11px',
                lineHeight: '1.6'
            }}>
                {/* Data Management Section */}
                <div style={{
                    marginBottom: '20px',
                    padding: '15px',
                    background: 'rgba(0,0,0,0.15)',
                    borderRadius: '8px',
                    maxWidth: '600px',
                    margin: '0 auto 20px auto'
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#81d4fa', fontSize: '12px' }}>
                        📊 Data Management
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '15px',
                        flexWrap: 'wrap',
                        marginBottom: '10px'
                    }}>
                        <span style={{ color: pokedex.length > 0 ? '#a5d6a7' : '#ffcc80' }}>
                            {pokedex.length > 0 ? `✓ Pokédex: ${pokedex.length} species` : '⏳ Loading Pokédex...'}
                        </span>
                        <span style={{ color: gameDataLoaded ? '#a5d6a7' : '#ffcc80' }}>
                            {gameDataLoaded
                                ? `✓ Game Data: ${Object.keys(GAME_DATA.moves || {}).length} moves, ${Object.keys(GAME_DATA.features || {}).length} features`
                                : '⏳ Loading Game Data...'}
                        </span>
                    </div>
                    <ClearCacheButton />
                </div>

                <div className="mb-10">
                    <strong>Created by leander_rsr</strong> • Pokémon Tabletop Adventures Character Manager
                </div>
                <div style={{
                    padding: '15px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '8px',
                    maxWidth: '800px',
                    margin: '0 auto'
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#ffd54f' }}>
                        ⚠️ LEGAL DISCLAIMER
                    </div>
                    <p className="mb-8">
                        This is an <strong>UNOFFICIAL, NON-COMMERCIAL</strong> fan-made tool for personal use only.
                        This tool is <strong>FREE</strong> and no profit is made from its distribution.
                    </p>
                    <p className="mb-8">
                        <strong>Pokémon</strong>, Pokémon character names, <strong>Nintendo</strong>, <strong>Game Freak</strong>,
                        and all related marks are trademarks, registered trademarks, or copyrights of
                        <strong> Nintendo, Game Freak, Creatures Inc., and The Pokémon Company</strong>.
                    </p>
                    <p className="mb-8">
                        This tool is <strong>NOT</strong> affiliated with, endorsed by, or sponsored by any of these companies.
                        It is intended solely as a companion tool for the fan-made <strong>Pokémon Tabletop Adventures</strong> RPG system.
                    </p>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>
                        All original code and design © leander_rsr. Provided "AS IS" without warranty.
                        For personal, non-commercial use only.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default AppLayout;
