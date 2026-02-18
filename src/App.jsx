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

import React, { useState, useEffect } from 'react';

// Data & Configs
import { DATA_CONFIG, POKEDEX_CONFIG, FALLBACK_POKEDEX, GAME_DATA } from './data/configs.js';
import { gameDataLoadPromise } from './data/gameDataLoader.js';
import { getFromPokedexDB, saveToPokedexDB } from './data/pokedexLoader.js';

// Context
import { AppContext } from './contexts/AppContext.js';

// Tab Components
import { NotesTab } from './components/notes';
import { ReferenceTab } from './components/reference';
import { InventoryTab } from './components/inventory';
import { BattleTab } from './components/battle';
import { TrainerTab } from './components/trainer';
import { PokemonTab } from './components/pokemon';

// Modal Components
import {
    DetailModal,
    CustomFeatureModal,
    CustomMoveModal,
    CustomSpeciesModal,
    MoveLearnModal,
    RegionalFormModal,
    SkillPickerModal,
    CardExportModal,
    BulkExpModal
} from './components/modals';

// Common Components
import { Header, SaveIndicator, LevelUpNotification } from './components/common';
import AppProviders from './components/AppProviders.jsx';

const PTAManager = () => {
// ============================================================
// STATE DECLARATIONS
// ============================================================

// --- Navigation & UI State ---
const [activeTab, setActiveTab] = useState('trainer');
const [showSaveIndicator, setShowSaveIndicator] = useState(false);
const [isAutoSave, setIsAutoSave] = useState(false);
const [lastSaveTime, setLastSaveTime] = useState(null);
const [levelUpNotification, setLevelUpNotification] = useState(null);

// --- Custom Species State ---
const [customSpecies, setCustomSpecies] = useState([]);

// --- Move Learning Modal State ---
const [showMoveLearnModal, setShowMoveLearnModal] = useState(false);
const [moveLearnData, setMoveLearnData] = useState(null);
const [pendingMoveLearn, setPendingMoveLearn] = useState([]);

// --- Pokédex State ---
const [pokedex, setPokedex] = useState([]);
const [pokedexLoading, setPokedexLoading] = useState(true);
const [pokedexError, setPokedexError] = useState(null);
const [gameDataLoaded, setGameDataLoaded] = useState(GAME_DATA._loaded || false);

// ============================================================
// TRAINER DATA STRUCTURE
// ============================================================

const defaultTrainer = {
    id: Date.now(),
    name: '',
    gender: '',
    age: '',
    avatar: '',
    level: 0,
    experience: 0,
    classes: [],
    stats: { hp: 6, atk: 6, def: 6, satk: 6, sdef: 6, spd: 6 },
    statPoints: 30,        // Character creation points (cap at 14 per stat)
    levelStatPoints: 0,    // Level-up stat points (no cap)
    featPoints: 0,         // Feature points
    skills: [],
    features: [],
    notes: '',
    badges: [],
    money: 0,
    pokemon: [],           // Legacy - will be migrated
    party: [],             // Active party - max 6 Pokemon
    reserve: []            // Reserve/PC storage - unlimited
};

// --- Multi-Trainer Management ---
const [trainers, setTrainers] = useState([{ ...defaultTrainer }]);
const [activeTrainerId, setActiveTrainerId] = useState(null);

// Current active trainer (computed)
const trainer = trainers.find(t => t.id === activeTrainerId) || trainers[0] || defaultTrainer;

// Helper to update current trainer
const setTrainer = (updater) => {
    setTrainers(prev => prev.map(t => {
        if (t.id === (activeTrainerId || prev[0]?.id)) {
            return typeof updater === 'function' ? updater(t) : { ...t, ...updater };
        }
        return t;
    }));
};

// Pokemon view state
const [pokemonView, setPokemonView] = useState('party'); // 'party' or 'reserve'

// Get pokemon for current trainer
const party = trainer.party || [];
const reserve = trainer.reserve || [];

// Helper to update party pokemon
const setParty = (updater) => {
    setTrainers(prev => prev.map(t => {
        if (t.id === (activeTrainerId || prev[0]?.id)) {
            const newParty = typeof updater === 'function' ? updater(t.party || []) : updater;
            return { ...t, party: newParty };
        }
        return t;
    }));
};

// Helper to update reserve pokemon
const setReserve = (updater) => {
    setTrainers(prev => prev.map(t => {
        if (t.id === (activeTrainerId || prev[0]?.id)) {
            const newReserve = typeof updater === 'function' ? updater(t.reserve || []) : updater;
            return { ...t, reserve: newReserve };
        }
        return t;
    }));
};

// Pokemon state (for editing)
const [editingPokemon, setEditingPokemon] = useState(null);

// Inventory state
const [inventory, setInventory] = useState([]);

// Initialize activeTrainerId on first load, but don't override if already set to a valid trainer
useEffect(() => {
    const activeTrainerExists = trainers.some(t => t.id === activeTrainerId);
    if (!activeTrainerExists && trainers.length > 0) {
        setActiveTrainerId(trainers[0].id);
    }
}, [trainers, activeTrainerId]);

// ============================================================
// GAME DATA & POKÉDEX FETCH & CACHE
// ============================================================

// Wait for game data to load and update state
useEffect(() => {
    gameDataLoadPromise.then(loaded => {
        setGameDataLoaded(loaded);
        // Force a re-render if game data was loaded
        if (loaded && GAME_DATA._loaded) {
            console.log('Game data ready:', 
                Object.keys(GAME_DATA.moves || {}).length, 'moves,',
                Object.keys(GAME_DATA.abilities || {}).length, 'abilities,',
                Object.keys(GAME_DATA.features || {}).length, 'features');
        }
    });
}, []);

useEffect(() => {
    const fetchPokedex = async () => {
        setPokedexLoading(true);
        setPokedexError(null);
        
        try {
            // 1. Check IndexedDB cache first
            const cachedMeta = await getFromPokedexDB('metadata');
            if (cachedMeta && (Date.now() - cachedMeta.timestamp) < POKEDEX_CONFIG.cacheDuration) {
                const cachedData = await getFromPokedexDB('pokedex');
                if (cachedData && Array.isArray(cachedData)) {
                    console.log('Pokédex loaded from cache:', cachedData.length, 'species');
                    setPokedex(cachedData);
                    setPokedexLoading(false);
                    return;
                }
            }
            
            // 2. Fetch from GitHub
            console.log('Fetching Pokédex from remote...');
            const response = await fetch(POKEDEX_CONFIG.remoteUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Read as ArrayBuffer to inspect the bytes
            const arrayBuffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            
            // Debug: log first few bytes
            console.log('Response size:', uint8Array.length, 'bytes');
            // Debug: console.log('First 10 bytes:', Array.from(uint8Array.slice(0, 10)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
            
            let responseText;
            let encoding = 'utf-8';
            
            // Detect encoding from BOM (Byte Order Mark)
            if (uint8Array.length >= 2) {
                // UTF-16 LE BOM: 0xFF 0xFE
                if (uint8Array[0] === 0xFF && uint8Array[1] === 0xFE) {
                    encoding = 'utf-16le';
                    console.log('Detected UTF-16 LE encoding');
                }
                // UTF-16 BE BOM: 0xFE 0xFF
                else if (uint8Array[0] === 0xFE && uint8Array[1] === 0xFF) {
                    encoding = 'utf-16be';
                    console.log('Detected UTF-16 BE encoding');
                }
                // UTF-8 BOM: 0xEF 0xBB 0xBF
                else if (uint8Array.length >= 3 && uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF) {
                    encoding = 'utf-8';
                    console.log('Detected UTF-8 with BOM');
                }
                // Gzip: 0x1F 0x8B
                else if (uint8Array[0] === 0x1F && uint8Array[1] === 0x8B) {
                    console.log('Detected gzip compression, decompressing...');
                    
                    if (typeof DecompressionStream === 'undefined') {
                        throw new Error('Gzip decompression not supported');
                    }
                    
                    const stream = new ReadableStream({
                        start(controller) {
                            controller.enqueue(uint8Array);
                            controller.close();
                        }
                    });
                    
                    const ds = new DecompressionStream('gzip');
                    const decompressedStream = stream.pipeThrough(ds);
                    const decompressedResponse = new Response(decompressedStream);
                    responseText = await decompressedResponse.text();
                    console.log('Decompressed successfully, length:', responseText.length);
                }
            }
            
            // If not already decompressed (gzip case), decode with detected encoding
            if (!responseText) {
                const decoder = new TextDecoder(encoding);
                responseText = decoder.decode(uint8Array);
                console.log('Decoded as', encoding + ', length:', responseText.length);
            }
            
            // Validate JSON structure
            const trimmed = responseText.trim();
            if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
                console.error('Invalid response (first 100 chars):', trimmed.substring(0, 100));
                console.error('First char code:', trimmed.charCodeAt(0));
                throw new Error('Response is not valid JSON');
            }
            
            // Parse JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Response preview:', responseText.substring(0, 200));
                throw new Error('Failed to parse Pokédex JSON');
            }
            
            const pokemonList = data.pokemon || data;
            
            if (!Array.isArray(pokemonList)) {
                throw new Error('Invalid Pokédex format - expected array');
            }
            
            // 3. Cache in IndexedDB
            await saveToPokedexDB('pokedex', pokemonList);
            await saveToPokedexDB('metadata', { 
                timestamp: Date.now(),
                count: pokemonList.length
            });
            
            console.log('Pokédex loaded:', pokemonList.length, 'species');
            setPokedex(pokemonList);
            
        } catch (error) {
            console.warn('Pokédex fetch failed:', error.message);
            
            // Try stale cache
            const staleCache = await getFromPokedexDB('pokedex');
            if (staleCache && Array.isArray(staleCache)) {
                console.log('Using stale cache');
                setPokedex(staleCache);
                setPokedexError('Using cached data');
            } else if (POKEDEX_CONFIG.fallbackEnabled) {
                // Use embedded fallback
                console.log('Using fallback Pokédex');
                setPokedex(FALLBACK_POKEDEX);
                setPokedexError('Using offline mini-dex (19 Pokémon)');
            } else {
                setPokedexError('Pokédex unavailable - manual entry only');
            }
        } finally {
            setPokedexLoading(false);
        }
    };
    
    fetchPokedex();
}, []);





// Helper function to get level-up moves for a Pokemon (supports regional forms)
// If pokemon object is passed and has availableLevelUpMoves, use those (for regional forms)
// Otherwise fall back to looking up the species in the pokedex
const getLevelUpMovesForPokemon = (pokemon) => {
    // If Pokemon has stored available moves (from regional form selection), use those
    if (pokemon?.availableLevelUpMoves && pokemon.availableLevelUpMoves.length > 0) {
        return pokemon.availableLevelUpMoves;
    }
    
    // Fall back to looking up species in pokedex or customSpecies
    const species = pokemon?.species;
    if (!species || !pokedex || pokedex.length === 0) return [];

    // First check customSpecies, then pokedex
    let speciesData = customSpecies?.find(p =>
        p.species?.toLowerCase() === species.toLowerCase()
    );
    if (!speciesData) {
        speciesData = pokedex.find(p =>
            p.species?.toLowerCase() === species.toLowerCase()
        );
    }
    
    // If Pokemon has a regional form but no stored moves, try to get form-specific moves
    if (pokemon?.regionalForm && speciesData?.regionalForms) {
        const regionalFormData = speciesData.regionalForms.find(
            rf => rf.name === pokemon.regionalForm
        );
        if (regionalFormData?.levelUpMoves) {
            return regionalFormData.levelUpMoves;
        }
    }
    
    return speciesData?.levelUpMoves || [];
};

// Legacy function for backwards compatibility (when we only have species name)
const getLevelUpMovesForSpecies = (species) => {
    if (!species || !pokedex || pokedex.length === 0) return [];
    // First check customSpecies, then pokedex
    let speciesData = customSpecies?.find(p =>
        p.species?.toLowerCase() === species.toLowerCase()
    );
    if (!speciesData) {
        speciesData = pokedex.find(p =>
            p.species?.toLowerCase() === species.toLowerCase()
        );
    }
    return speciesData?.levelUpMoves || [];
};

// Helper function to check moves learned between two levels
// Now accepts Pokemon object to support regional forms
const getMovesForLevelRange = (pokemon, fromLevel, toLevel) => {
    const levelUpMoves = typeof pokemon === 'object' 
        ? getLevelUpMovesForPokemon(pokemon)
        : getLevelUpMovesForSpecies(pokemon); // backwards compat if string passed
        
    if (fromLevel < toLevel) {
        // Level UP: get moves learned between old level (exclusive) and new level (inclusive)
        return levelUpMoves.filter(m => m.level > fromLevel && m.level <= toLevel);
    } else {
        // Level DOWN: get moves that were learned above the new level
        return levelUpMoves.filter(m => m.level > toLevel && m.level <= fromLevel);
    }
};

return (
    <AppProviders
        customSpecies={customSpecies}
        setCustomSpecies={setCustomSpecies}
        trainers={trainers}
        setTrainers={setTrainers}
        activeTrainerId={activeTrainerId}
        setActiveTrainerId={setActiveTrainerId}
        onLevelUp={(notification) => {
            setLevelUpNotification(notification);
            setTimeout(() => setLevelUpNotification(null), 5000);
        }}
        party={party}
        reserve={reserve}
        setParty={setParty}
        setReserve={setReserve}
        pokemonView={pokemonView}
        setPokemonView={setPokemonView}
        editingPokemon={editingPokemon}
        setEditingPokemon={setEditingPokemon}
        pendingMoveLearn={pendingMoveLearn}
        setPendingMoveLearn={setPendingMoveLearn}
        showMoveLearnModal={showMoveLearnModal}
        setShowMoveLearnModal={setShowMoveLearnModal}
        moveLearnData={moveLearnData}
        setMoveLearnData={setMoveLearnData}
        inventory={inventory}
        setInventory={setInventory}
        getMovesForLevelRange={getMovesForLevelRange}
        onSaveComplete={(isAuto) => {
            setIsAutoSave(isAuto);
            setLastSaveTime(new Date());
            setShowSaveIndicator(true);
            setTimeout(() => setShowSaveIndicator(false), 2000);
        }}
        showNotification={(notification) => {
            setLevelUpNotification(notification);
            setTimeout(() => setLevelUpNotification(null), 3000);
        }}
    >
    <div className="container">
        {/* Save Indicator */}
        <SaveIndicator
            show={showSaveIndicator}
            isAuto={isAutoSave}
            saveTime={lastSaveTime}
        />
        
        {/* Level Up Notification */}
        {levelUpNotification && (
            <div className="level-up-notification">
                <h4>🎉 Level Up!</h4>
                <p>{levelUpNotification.name} reached level {levelUpNotification.level}!</p>
                {levelUpNotification.statPoints > 0 && (
                    <p>+{levelUpNotification.statPoints} stat point(s)!</p>
                )}
                {levelUpNotification.featPoints > 0 && (
                    <p>+{levelUpNotification.featPoints} feature(s)!</p>
                )}
                {levelUpNotification.note && (
                    <p style={{ fontStyle: 'italic', color: '#ffd700' }}>{levelUpNotification.note}</p>
                )}
            </div>
        )}
        
        {/* Header */}
        <Header />


        {/* Main Content */}
        <div className="main-content">
            {/* Sidebar Navigation */}
            <div className="sidebar" role="navigation" aria-label="Main navigation">
                <button
                    className={`nav-button ${activeTab === 'trainer' ? 'active' : ''}`}
                    onClick={() => setActiveTab('trainer')}
                    aria-current={activeTab === 'trainer' ? 'page' : undefined}
                >
                    <span className="nav-icon">👤</span>
                    <span>Trainer</span>
                </button>
                <button
                    className={`nav-button ${activeTab === 'pokemon' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pokemon')}
                    aria-current={activeTab === 'pokemon' ? 'page' : undefined}
                >
                    <span className="nav-icon">🎮</span>
                    <span>Pokémon Team</span>
                </button>
                <button
                    className={`nav-button ${activeTab === 'inventory' ? 'active' : ''}`}
                    onClick={() => setActiveTab('inventory')}
                    aria-current={activeTab === 'inventory' ? 'page' : undefined}
                >
                    <span className="nav-icon">🎒</span>
                    <span>Inventory</span>
                </button>
                <button
                    className={`nav-button ${activeTab === 'battle' ? 'active' : ''}`}
                    onClick={() => setActiveTab('battle')}
                    aria-current={activeTab === 'battle' ? 'page' : undefined}
                >
                    <span className="nav-icon">🎲</span>
                    <span>Dice Roller</span>
                </button>
                <button
                    className={`nav-button ${activeTab === 'reference' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reference')}
                    aria-current={activeTab === 'reference' ? 'page' : undefined}
                >
                    <span className="nav-icon">📚</span>
                    <span>Quick Reference</span>
                </button>
                <button
                    className={`nav-button ${activeTab === 'notes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('notes')}
                    aria-current={activeTab === 'notes' ? 'page' : undefined}
                >
                    <span className="nav-icon">📝</span>
                    <span>Campaign Notes</span>
                </button>
            </div>
            
            {/* ============================================== */}
            {/* MAIN CONTENT AREA                             */}
            {/* ============================================== */}
            <div className="content-area">

                {/* Loading overlay while fetching Pokédex/game data */}
                {(pokedexLoading || !gameDataLoaded) && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '60px 20px',
                        textAlign: 'center',
                        color: 'var(--text-secondary)'
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            border: '4px solid var(--border-light)',
                            borderTopColor: '#667eea',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                            marginBottom: '20px'
                        }} />
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
                    <TrainerTab />
                </div>

                <div style={{ display: activeTab === 'pokemon' ? undefined : 'none' }}>
                    <PokemonTab />
                </div>

                <div style={{ display: activeTab === 'inventory' ? undefined : 'none' }}>
                    <InventoryTab />
                </div>

                <div style={{ display: activeTab === 'battle' ? undefined : 'none' }}>
                    <BattleTab />
                </div>

                <div style={{ display: activeTab === 'reference' ? undefined : 'none' }}>
                    <ReferenceTab />
                </div>

                <div style={{ display: activeTab === 'notes' ? undefined : 'none' }}>
                    <NotesTab />
                </div>
            </div>
        </div>
        
        {/* ========== MODALS ========== */}
        <CustomFeatureModal />

        <CustomMoveModal />

        <CustomSpeciesModal />

        <MoveLearnModal />

        <RegionalFormModal />

        <CardExportModal />

        <SkillPickerModal />

        <DetailModal />

        <BulkExpModal />


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
                        {gameDataLoaded ? `✓ Game Data: ${Object.keys(GAME_DATA.moves || {}).length} moves, ${Object.keys(GAME_DATA.features || {}).length} features` : '⏳ Loading Game Data...'}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                        onClick={async () => {
                            if (confirm('Clear cached Pokédex and game data, then reload from the server?\n\nYour trainer data will be saved before refreshing.\n\nThis is useful if the data has been updated online or if you are experiencing issues with moves, abilities, or Pokémon not appearing correctly.')) {
                                try {
                                    // Wait for any pending auto-save to complete (1s debounce + buffer)
                                    await new Promise(resolve => setTimeout(resolve, 1200));
                                    indexedDB.deleteDatabase('PTAPokedex');
                                    indexedDB.deleteDatabase(DATA_CONFIG.dbName);
                                    window.location.reload();
                                } catch (e) {
                                    window.location.reload();
                                }
                            }
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
    </AppProviders>
);
};

// Export the main component
export default PTAManager;
