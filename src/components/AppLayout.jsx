// ============================================================
// App Layout Component
// ============================================================
// Inner application shell. Lives inside AppProviders so it can
// consume all contexts directly — no prop drilling needed.

import React from 'react';

// Data & Configs
import { DATA_CONFIG, GAME_DATA } from '../data/configs.js';

// Tab Components
import { NotesTab } from './notes';
import { ReferenceTab } from './reference';
import { InventoryTab } from './inventory';
import { BattleTab } from './battle';
import { TrainerTab } from './trainer';
import { PokemonTab } from './pokemon';

// Common Components
import { Header, SaveIndicator, LevelUpNotification, MainNavigation, ModalsContainer } from './common';
import ToastContainer from './common/ToastContainer.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';

// Contexts
import { useUI } from '../contexts/UIContext.jsx';
import { useGameData } from '../contexts/GameDataContext.jsx';

// ── Clear Cache Button ───────────────────────────────────────
const ClearCacheButton = () => {
    const { showConfirm } = useUI();
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
                onClick={() => {
                    showConfirm({
                        title: 'Clear Cache',
                        message: 'Clear cached Pokédex and game data, then reload from the server?\n\nYour trainer data will be saved before refreshing.\n\nThis is useful if the data has been updated online or if you are experiencing issues with moves, abilities, or Pokémon not appearing correctly.',
                        confirmLabel: 'Clear & Reload',
                        danger: true,
                        onConfirm: async () => {
                            try {
                                await new Promise(resolve => setTimeout(resolve, 1200));
                                indexedDB.deleteDatabase('PTAPokedex');
                                indexedDB.deleteDatabase(DATA_CONFIG.dbName);
                                window.location.reload();
                            } catch (e) {
                                window.location.reload();
                            }
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
    const { pokedex, pokedexLoading, gameDataLoaded } = useGameData();

    return (
        <div className="container">
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
                <div className="content-area">

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

                    {/* All tabs stay mounted (CSS-hidden) so local state like search filters,
                        combat stages, and note drafts persist across tab switches */}
                    <div style={{ display: activeTab === 'trainer' ? undefined : 'none' }}>
                        <ErrorBoundary inline><TrainerTab /></ErrorBoundary>
                    </div>

                    <div style={{ display: activeTab === 'pokemon' ? undefined : 'none' }}>
                        <ErrorBoundary inline><PokemonTab /></ErrorBoundary>
                    </div>

                    <div style={{ display: activeTab === 'inventory' ? undefined : 'none' }}>
                        <ErrorBoundary inline><InventoryTab /></ErrorBoundary>
                    </div>

                    <div style={{ display: activeTab === 'battle' ? undefined : 'none' }}>
                        <ErrorBoundary inline><BattleTab /></ErrorBoundary>
                    </div>

                    <div style={{ display: activeTab === 'reference' ? undefined : 'none' }}>
                        <ErrorBoundary inline><ReferenceTab /></ErrorBoundary>
                    </div>

                    <div style={{ display: activeTab === 'notes' ? undefined : 'none' }}>
                        <ErrorBoundary inline><NotesTab /></ErrorBoundary>
                    </div>
                </div>
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
