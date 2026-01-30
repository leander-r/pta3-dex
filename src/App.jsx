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

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// Data & Configs
import { DATA_CONFIG, POKEDEX_CONFIG, FALLBACK_POKEDEX, GAME_DATA } from './data/configs.js';
import { gameDataLoadPromise } from './data/gameDataLoader.js';
import { getFromPokedexDB, saveToPokedexDB } from './data/pokedexLoader.js';

// Utilities
import { safeLocalStorageGet, safeLocalStorageSet } from './utils/storageUtils.js';
import { TYPE_COLORS, STAT_COLORS, getTypeColor, getStatColor } from './utils/typeUtils.js';
import {
calcModifier,
formatNumber,
calcPokemonHP,
calcSTAB,
calculatePokemonLevel,
getExpToNextLevel,
applyNature,
applyCombatStage,
getCombatStagePercent,
getSpeedSkillMod,
calculateSTAB,
getActualStats,
calculatePokemonHP
} from './utils/dataUtils.js';
import {
exportTrainerText as exportTrainerTextUtil,
exportPokemonText as exportPokemonTextUtil,
exportTeamText as exportTeamTextUtil,
copyToClipboard,
downloadCardAsImage,
exportAllData as exportAllDataUtil,
exportSingleTrainer as exportSingleTrainerUtil
} from './utils/exportUtils.js';

// Components
import SectionCard from './components/SectionCard.jsx';
import {
StatDisplay,
Badge,
IconButton,
EmptyState,
ProgressBar,
TypeBadge,
Tooltip
} from './components/UIComponents.jsx';

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
    CardExportModal
} from './components/modals';

// Common Components
import { Header, SaveIndicator, LevelUpNotification } from './components/common';

// Data
import { EVOLUTION_CHAINS } from './data/evolutionChains.js';


const PTAManager = () => {
// ============================================================
// STATE DECLARATIONS
// ============================================================

// --- Navigation & UI State ---
const [activeTab, setActiveTab] = useState('trainer');
const [showSaveIndicator, setShowSaveIndicator] = useState(false);
const [levelUpNotification, setLevelUpNotification] = useState(null);
const [referenceTab, setReferenceTab] = useState('types');

// --- Theme State ---
const [theme, setTheme] = useState(() => {
    // Load theme from localStorage or default to light
    const savedTheme = safeLocalStorageGet('pta-theme', 'light');
    // Apply theme to document immediately
    document.documentElement.setAttribute('data-theme', savedTheme);
    return savedTheme;
});

// --- Moves Database Filters ---
const [movesFilter, setMovesFilter] = useState({
    search: '',
    type: '',
    category: '',
    frequency: '',
    sortBy: 'name', // 'name', 'type', 'category', 'damage'
    sortDir: 'asc'
});

// --- Abilities Database Filters ---
const [abilitiesFilter, setAbilitiesFilter] = useState({
    search: '',
    sortBy: 'name', // 'name'
    sortDir: 'asc'
});

// --- Modal States ---
const [showMoveModal, setShowMoveModal] = useState(false);
const [selectedMove, setSelectedMove] = useState(null);
const [showFeatureModal, setShowFeatureModal] = useState(false);
const [selectedFeature, setSelectedFeature] = useState(null);
const [showReferenceModal, setShowReferenceModal] = useState(false);
const [showCustomFeatureModal, setShowCustomFeatureModal] = useState(false);
const [showCustomMoveModal, setShowCustomMoveModal] = useState(false);
const [customMoveForPokemon, setCustomMoveForPokemon] = useState(null);
const [showCustomSpeciesModal, setShowCustomSpeciesModal] = useState(false);
const [customSpecies, setCustomSpecies] = useState([]);
const [editingCustomSpeciesId, setEditingCustomSpeciesId] = useState(null);

// --- Regional Form Selector State ---
const [showRegionalFormModal, setShowRegionalFormModal] = useState(false);
const [regionalFormData, setRegionalFormData] = useState(null);
// regionalFormData structure: { pokemonId, speciesData, forms: [{name, types, ...}] }

// --- Move Learning Modal State ---
const [showMoveLearnModal, setShowMoveLearnModal] = useState(false);
const [moveLearnData, setMoveLearnData] = useState(null);
// moveLearnData structure: { pokemonId, pokemonName, newMove, currentMoves, inParty }
const [pendingMoveLearn, setPendingMoveLearn] = useState([]);

// --- Pokédex State ---
const [pokedex, setPokedex] = useState([]);
const [pokedexLoading, setPokedexLoading] = useState(true);
const [pokedexError, setPokedexError] = useState(null);
const [gameDataLoaded, setGameDataLoaded] = useState(GAME_DATA._loaded || false);
const [speciesSearch, setSpeciesSearch] = useState('');

// --- Custom Feature Template ---
const [customFeature, setCustomFeature] = useState({
    name: '',
    category: 'Custom',
    prerequisites: '',
    frequency: '',
    trigger: '',
    target: '',
    effect: ''
});

// --- Custom Move Template ---
const [customMove, setCustomMove] = useState({
    name: '',
    type: 'Normal',
    category: 'Physical',
    frequency: 'At-Will',
    damage: '',
    range: 'Melee',
    effect: '',
    description: '',
    source: 'natural'
});

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

// Get pokemon for current trainer (combined for backward compatibility)
const party = trainer.party || [];
const reserve = trainer.reserve || [];
const pokemon = [...party, ...reserve]; // Combined for functions that need all pokemon

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

// Legacy setPokemon - adds to party if room, otherwise reserve
const setPokemon = (updater) => {
    setTrainers(prev => prev.map(t => {
        if (t.id === (activeTrainerId || prev[0]?.id)) {
            const currentAll = [...(t.party || []), ...(t.reserve || [])];
            const newPokemon = typeof updater === 'function' ? updater(currentAll) : updater;
            // Distribute: first 6 go to party, rest to reserve
            return { 
                ...t, 
                party: newPokemon.slice(0, 6),
                reserve: newPokemon.slice(6)
            };
        }
        return t;
    }));
};

// Move pokemon to party
const moveToParty = (pokemonId) => {
    if (party.length >= 6) {
        alert('Your party is full! (Maximum 6 Pokémon)\n\nMove a Pokémon to reserve first.');
        return;
    }
    const poke = reserve.find(p => p.id === pokemonId);
    if (poke) {
        setReserve(prev => prev.filter(p => p.id !== pokemonId));
        setParty(prev => [...prev, poke]);
    }
};

// Move pokemon to reserve
const moveToReserve = (pokemonId) => {
    const poke = party.find(p => p.id === pokemonId);
    if (poke) {
        setParty(prev => prev.filter(p => p.id !== pokemonId));
        setReserve(prev => [...prev, poke]);
    }
};

// Reorder pokemon in party (move up)
const movePokemonUp = (pokemonId, isParty) => {
    const setList = isParty ? setParty : setReserve;
    setList(prev => {
        const index = prev.findIndex(p => p.id === pokemonId);
        if (index <= 0) return prev; // Already at top
        const newList = [...prev];
        [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
        return newList;
    });
};

// Reorder pokemon in party (move down)
const movePokemonDown = (pokemonId, isParty) => {
    const setList = isParty ? setParty : setReserve;
    setList(prev => {
        const index = prev.findIndex(p => p.id === pokemonId);
        if (index < 0 || index >= prev.length - 1) return prev; // Already at bottom
        const newList = [...prev];
        [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
        return newList;
    });
};

// Sort pokemon list by specified criteria
const sortPokemonList = (isParty, sortBy, sortDir = 'asc') => {
    const setList = isParty ? setParty : setReserve;
    setList(prev => {
        const sorted = [...prev].sort((a, b) => {
            let cmp = 0;
            switch (sortBy) {
                case 'level':
                    cmp = (b.level || 1) - (a.level || 1);
                    break;
                case 'species':
                    cmp = (a.species || '').localeCompare(b.species || '');
                    break;
                case 'type':
                    cmp = (a.types?.[0] || '').localeCompare(b.types?.[0] || '');
                    break;
                case 'name':
                default:
                    cmp = (a.name || a.species || '').localeCompare(b.name || b.species || '');
            }
            return sortDir === 'asc' ? cmp : -cmp;
        });
        return sorted;
    });
};

// ============================================================
// TRAINER MANAGEMENT FUNCTIONS
// ============================================================

/** Add a new trainer to the roster */
const addNewTrainer = () => {
    const newTrainer = {
        ...defaultTrainer,
        id: Date.now(),
        name: 'New Trainer'
    };
    setTrainers(prev => [...prev, newTrainer]);
    setActiveTrainerId(newTrainer.id);
};

/** Delete a trainer from the roster */
const deleteTrainer = (trainerId) => {
    if (trainers.length <= 1) {
        alert('You must have at least one trainer.');
        return;
    }
    if (confirm('Are you sure you want to delete this trainer and all their Pokémon? This cannot be undone.')) {
        setTrainers(prev => {
            const filtered = prev.filter(t => t.id !== trainerId);
            // If we deleted the active trainer, switch to the first one
            if (trainerId === activeTrainerId) {
                setActiveTrainerId(filtered[0]?.id);
            }
            return filtered;
        });
    }
};

// Duplicate a trainer
const duplicateTrainer = (trainerId) => {
    const trainerToCopy = trainers.find(t => t.id === trainerId);
    if (trainerToCopy) {
        const newTrainer = {
            ...JSON.parse(JSON.stringify(trainerToCopy)), // Deep clone
            id: Date.now(),
            name: `${trainerToCopy.name} (Copy)`,
            party: (trainerToCopy.party || []).map(p => ({ ...p, id: Date.now() + Math.random() })),
            reserve: (trainerToCopy.reserve || []).map(p => ({ ...p, id: Date.now() + Math.random() }))
        };
        setTrainers(prev => [...prev, newTrainer]);
        setActiveTrainerId(newTrainer.id);
    }
};

// Pokemon state (for selected/editing)
const [selectedPokemon, setSelectedPokemon] = useState(null);
const [editingPokemon, setEditingPokemon] = useState(null);

// Move search/filter state
const [moveSearchQuery, setMoveSearchQuery] = useState('');
const [moveTypeFilter, setMoveTypeFilter] = useState('all');
const [moveCategoryFilter, setMoveCategoryFilter] = useState('all');

// Inventory state (shared across all trainers for simplicity, or could be per-trainer)
const [inventory, setInventory] = useState([]);
const [showItemModal, setShowItemModal] = useState(false);
const [inventoryFilter, setInventoryFilter] = useState('all');

// Item picker state for adding items
const [itemPickerSearch, setItemPickerSearch] = useState('');
const [itemPickerCategory, setItemPickerCategory] = useState('all');
const [itemPickerSortBy, setItemPickerSortBy] = useState('name'); // 'name', 'price-asc', 'price-desc'
const [showItemPicker, setShowItemPicker] = useState(false);
const [itemPickerQuantity, setItemPickerQuantity] = useState(1);

// Search for items in current inventory
const [inventorySearchQuery, setInventorySearchQuery] = useState('');

// Feature picker state for adding features
const [showFeaturePicker, setShowFeaturePicker] = useState(false);
const [featurePickerSearch, setFeaturePickerSearch] = useState('');
const [featurePickerCategory, setFeaturePickerCategory] = useState('all');
const [featurePickerShowOwned, setFeaturePickerShowOwned] = useState(true);

// Pokemon card edit tab state - tracks which tab is active for each pokemon
const [pokemonEditTab, setPokemonEditTab] = useState({}); // { [pokemonId]: 'info' | 'stats' | 'abilities' | 'moves' }

// Card export state
const [showCardModal, setShowCardModal] = useState(false);
const [cardType, setCardType] = useState('trainer');
const [selectedCardPokemon, setSelectedCardPokemon] = useState(null);

// Character menu dropdown state

// Class skill picker state
const [skillPickerModal, setSkillPickerModal] = useState({
    show: false,
    className: '',
    skillPool: [],
    skillCount: 0,
    selectedSkills: [],
    pendingClassData: null // Store class data while picking skills
});

// Detail modal state - for showing full info on moves, features, abilities, skills, items
const [detailModal, setDetailModal] = useState({
    show: false,
    type: '', // 'move', 'feature', 'ability', 'skill', 'item'
    name: '',
    data: null
});

// Helper to show detail modal
const showDetail = (type, name, data) => {
    setDetailModal({ show: true, type, name, data });
};

// Battle calculator state
const [diceRoller, setDiceRoller] = useState({
    mode: 'pokemon',
    selectedPokemon: null,
    selectedMove: null,
    selectedSkill: '',
    customDice: '',
    combatStages: { atk: 0, satk: 0, def: 0, sdef: 0, spd: 0, acc: 0, eva: 0 },
    rollHistory: [],
    stabApplied: false
});

// Discord webhook integration state
const [discordWebhook, setDiscordWebhook] = useState(() => {
    try {
        const saved = localStorage.getItem('pta-discord-webhook');
        return saved ? JSON.parse(saved) : { url: '', enabled: false, showSettings: false };
    } catch {
        return { url: '', enabled: false, showSettings: false };
    }
});

// Save Discord webhook settings to localStorage
useEffect(() => {
    try {
        localStorage.setItem('pta-discord-webhook', JSON.stringify({
            url: discordWebhook.url,
            enabled: discordWebhook.enabled,
            showSettings: false // Don't persist the open state
        }));
    } catch (e) {
        console.warn('Could not save Discord webhook settings');
    }
}, [discordWebhook.url, discordWebhook.enabled]);

// Save theme to localStorage and apply to document
useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    safeLocalStorageSet('pta-theme', theme);
}, [theme]);

// Send roll result to Discord webhook
const sendToDiscord = useCallback(async (roll) => {
    if (!discordWebhook.enabled || !discordWebhook.url) return;

    try {
        // Build the embed based on roll type
        let embed = {
            timestamp: new Date().toISOString(),
            footer: { text: `${trainer?.name || 'Trainer'} • PTA Manager` }
        };

        // Color based on roll type
        const colors = {
            pokemon: 0xF5A623,      // Orange
            accuracy: 0x3498DB,     // Blue
            trainer: 0x667EEA,      // Purple
            trainer_skill: 0x667EEA,
            trainer_d20: 0x667EEA,
            custom: 0x95A5A6,       // Gray
            pokemonSkill: 0x9B59B6  // Purple
        };
        embed.color = colors[roll.type] || 0x667EEA;

        // Build title and description based on roll type
        if (roll.type === 'pokemon') {
            embed.title = `🎲 ${roll.pokemon} used ${roll.move}!`;

            // Handle hit/miss from accuracy check
            if (roll.isHit === false) {
                embed.description = `**MISS!** (Rolled ${roll.accRoll}${roll.accModifier ? ` + ${roll.accModifier}` : ''} = ${roll.modifiedAccRoll || roll.accRoll} vs AC ${roll.moveAC})`;
                embed.color = 0x95A5A6; // Gray for miss
            } else {
                embed.fields = [
                    { name: '📊 Damage Roll', value: `**${roll.total}** damage`, inline: true },
                    { name: '🎯 Accuracy', value: roll.isCrit ? `**${roll.accRoll}** - CRITICAL HIT! 💥` : `**${roll.accRoll}** vs AC ${roll.moveAC}${roll.acWasOverridden ? ' (DM)' : ''}`, inline: true }
                ];

                if (roll.dice && roll.rolls) {
                    embed.fields.push({ name: '🎲 Dice', value: `${roll.dice} → [${roll.rolls.join(', ')}] = ${roll.diceTotal}`, inline: false });
                }

                let breakdown = [];
                if (roll.statBonus) breakdown.push(`+${roll.statBonus} stat`);
                if (roll.stabBonus) breakdown.push(`+${roll.stabBonus} STAB`);
                if (breakdown.length > 0) {
                    embed.fields.push({ name: '📈 Bonuses', value: breakdown.join(', '), inline: true });
                }

                embed.fields.push({ name: '⚔️ Type', value: `${roll.moveType} (${roll.category})`, inline: true });
            }

        } else if (roll.type === 'accuracy') {
            embed.title = `🎯 ${roll.pokemon} - Accuracy Check`;
            embed.description = roll.isCrit
                ? `**${roll.total}** - CRITICAL HIT! 💥`
                : `**${roll.total}**`;

        } else if (roll.type === 'trainer_skill' || roll.type === 'trainer') {
            embed.title = `🧑‍🏫 Trainer Skill: ${roll.skill}`;
            embed.fields = [
                { name: '🎲 Result', value: `**${roll.total}**`, inline: true },
                { name: '📊 Rolls', value: `[${roll.rolls.join(', ')}]`, inline: true }
            ];
            if (roll.hasSkill) {
                embed.fields.push({ name: '✅ Trained', value: `+${roll.bonus} bonus`, inline: true });
            }
            if (roll.skillStat) {
                embed.fields.push({ name: '📈 Stat', value: roll.skillStat, inline: true });
            }

        } else if (roll.type === 'trainer_d20') {
            embed.title = `🎯 Trainer: ${roll.skill}`;
            embed.description = `Rolled **${roll.total}** on d20`;

        } else if (roll.type === 'pokemonSkill') {
            embed.title = `🐾 ${roll.pokemon} - ${roll.skill}`;
            embed.fields = [
                { name: '🎲 Result', value: `**${roll.total}**`, inline: true },
                { name: '📊 Dice', value: `${roll.dice} → [${roll.rolls.join(', ')}]`, inline: true }
            ];
            if (roll.modifier) {
                embed.fields.push({ name: '📈 Modifier', value: `+${roll.modifier}`, inline: true });
            }

        } else if (roll.type === 'custom') {
            embed.title = `🎲 Custom Roll: ${roll.dice}`;
            embed.fields = [
                { name: '🎲 Result', value: `**${roll.total}**`, inline: true },
                { name: '📊 Rolls', value: `[${roll.rolls.join(', ')}]`, inline: true }
            ];
        }

        // Send to Discord
        await fetch(discordWebhook.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'PTA Dice Roller',
                avatar_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
                embeds: [embed]
            })
        });

    } catch (error) {
        console.error('Failed to send to Discord:', error);
    }
}, [discordWebhook.enabled, discordWebhook.url, trainer?.name]);

// Initialize activeTrainerId on first load
useEffect(() => {
    if (!activeTrainerId && trainers.length > 0) {
        setActiveTrainerId(trainers[0].id);
    }
}, [trainers]);

// Load data on mount
useEffect(() => {
    loadData();
}, []);

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

// Filtered species list (memoized for performance)
const filteredSpecies = useMemo(() => {
    if (!pokedex || pokedex.length === 0) return [];
    if (!speciesSearch.trim()) return pokedex;
    
    const search = speciesSearch.toLowerCase().trim();
    return pokedex.filter(p => 
        p.species.toLowerCase().includes(search) ||
        p.types.some(t => t.toLowerCase().includes(search)) ||
        p.id.toString() === search
    );
}, [pokedex, speciesSearch]);

// ============================================================
// EVOLUTION HELPER FUNCTIONS
// ============================================================

// Get evolution options for a Pokemon
const getEvolutionOptions = (pokemon) => {
    if (!pokemon?.species) return { canEvolve: [], canDevolve: null };

    const species = pokemon.species;
    const level = pokemon.level || 1;
    const regionalForm = pokemon.regionalForm || null;

    // Check for custom species evolution data first
    const customSpeciesData = customSpecies?.find(p =>
        p.species?.toLowerCase() === species.toLowerCase()
    );

    // Use custom species evolution data if available, otherwise use EVOLUTION_CHAINS
    let evolutionData;
    if (customSpeciesData) {
        evolutionData = {
            evolvesTo: customSpeciesData.evolvesTo || [],
            evolvesFrom: customSpeciesData.evolvesFrom || null
        };
        // Skip if no evolution data defined
        if (evolutionData.evolvesTo.length === 0 && !evolutionData.evolvesFrom) {
            evolutionData = null;
        }
    } else {
        evolutionData = EVOLUTION_CHAINS[species];
    }
    if (!evolutionData) return { canEvolve: [], canDevolve: null };
    
    const canEvolve = [];
    let canDevolve = null;
    
    // Check evolution options
    if (evolutionData.evolvesTo) {
        evolutionData.evolvesTo.forEach(evo => {
            // Special case: Pikachu can evolve into both normal Raichu and Alolan Raichu
            // even though there's no Alolan Pikachu (only Pokemon where this happens)
            const isPikachuToAlolanRaichu = species === 'Pikachu' && evo.species === 'Raichu' && evo.regionalForm === 'Alolan';

            // Special case: Rockruff can evolve into any Lycanroc form (Day/Night/Dusk)
            // The form is a player choice, not based on the Pokemon's current form
            const isRockruffToLycanroc = species === 'Rockruff' && evo.species === 'Lycanroc';

            // Filter by regional form if applicable
            if (evo.regionalForm && evo.regionalForm !== regionalForm && !isPikachuToAlolanRaichu && !isRockruffToLycanroc) {
                // This evolution is for a different regional form
                // Only show if the Pokemon IS that regional form
                if (regionalForm !== evo.regionalForm) return;
            }

            // For non-regional evolutions, show if Pokemon has no regional form or matches
            if (!evo.regionalForm && regionalForm) {
                // Normal evolution but Pokemon is regional - check if regional form has same evo
                // Allow it as the regional forms typically follow same pattern
            }
            
            let canEvolveNow = false;
            let reason = '';
            let needsItem = null;
            
            switch (evo.method) {
                case 'level':
                    canEvolveNow = level >= evo.requirement;
                    reason = canEvolveNow ? '' : `Needs Level ${evo.requirement}`;
                    break;
                case 'stone':
                    needsItem = evo.requirement;
                    canEvolveNow = true; // Will check inventory separately
                    reason = `Requires ${evo.requirement}`;
                    break;
                case 'trade':
                    canEvolveNow = true;
                    reason = evo.requirement === 'Trade' ? 'Trade Evolution' : `Trade with ${evo.requirement}`;
                    if (evo.requirement !== 'Trade') needsItem = evo.requirement;
                    break;
                case 'happiness':
                    canEvolveNow = true; // Assume happiness is met if player wants to evolve
                    reason = evo.requirement;
                    break;
                case 'other':
                    canEvolveNow = true;
                    reason = evo.requirement;
                    break;
            }
            
            canEvolve.push({
                species: evo.species,
                method: evo.method,
                requirement: evo.requirement,
                regionalForm: evo.regionalForm || null,
                note: evo.note || null,
                canEvolveNow,
                reason,
                needsItem
            });
        });
    }
    
    // Check devolution option
    if (evolutionData.evolvesFrom) {
        const devo = evolutionData.evolvesFrom;
        canDevolve = {
            species: devo.species,
            method: devo.method,
            requirement: devo.requirement
        };
    }
    
    return { canEvolve, canDevolve };
};

// Check if inventory has a specific item
const hasItemInInventory = (itemName) => {
    if (!itemName) return true;
    return inventory.some(item => 
        item.name.toLowerCase() === itemName.toLowerCase() && 
        (item.quantity || 1) > 0
    );
};

// Remove item from inventory
const removeItemFromInventory = (itemName) => {
    setInventory(prev => {
        const idx = prev.findIndex(item => 
            item.name.toLowerCase() === itemName.toLowerCase()
        );
        if (idx === -1) return prev;
        
        const newInventory = [...prev];
        if ((newInventory[idx].quantity || 1) <= 1) {
            newInventory.splice(idx, 1);
        } else {
            newInventory[idx] = {
                ...newInventory[idx],
                quantity: (newInventory[idx].quantity || 1) - 1
            };
        }
        return newInventory;
    });
};

// Handle Pokemon evolution
const handleEvolution = (pokemonId, targetSpecies, targetRegionalForm, consumeItem) => {
    // Find Pokemon
    const inParty = party.some(p => p.id === pokemonId);
    const pokemon = inParty 
        ? party.find(p => p.id === pokemonId)
        : reserve.find(p => p.id === pokemonId);
    
    if (!pokemon) return;
    
    // Find target species in Pokedex or Custom Species
    let targetPokedexEntry = pokedex.find(p => p.species === targetSpecies);
    if (!targetPokedexEntry) {
        // Check custom species
        targetPokedexEntry = customSpecies.find(p => p.species === targetSpecies);
    }
    if (!targetPokedexEntry) {
        alert(`Could not find ${targetSpecies} in the Pokédex or Custom Species!`);
        return;
    }

    // Consume item if needed
    if (consumeItem) {
        if (!hasItemInInventory(consumeItem)) {
            alert(`You don't have a ${consumeItem} in your inventory!`);
            return;
        }
        removeItemFromInventory(consumeItem);
    }
    
    // Determine the regional form to use
    // Priority: 1) Explicitly specified targetRegionalForm, 2) Current Pokemon's regional form if target has it
    let finalRegionalForm = null;
    
    if (targetRegionalForm) {
        // Explicit regional form specified (e.g., evolving to specifically Alolan Raichu)
        const matchingForm = targetPokedexEntry.regionalForms?.find(rf => rf.name === targetRegionalForm);
        if (matchingForm) {
            finalRegionalForm = { name: targetRegionalForm, isBase: false, ...matchingForm };
        }
    } else if (pokemon.regionalForm) {
        // Preserve current Pokemon's regional form if target species has the same form
        const matchingForm = targetPokedexEntry.regionalForms?.find(rf => rf.name === pokemon.regionalForm);
        if (matchingForm) {
            finalRegionalForm = { name: pokemon.regionalForm, isBase: false, ...matchingForm };
        }
    }
    
    // Apply evolution - this updates species data but PRESERVES moves
    // Also store the consumed item for potential refund on devolution
    applyEvolutionToPokemon(pokemonId, targetPokedexEntry, finalRegionalForm, inParty, consumeItem, pokemon.species);
    
    // Show notification
    const formName = finalRegionalForm?.name || targetRegionalForm;
    setLevelUpNotification({
        pokemon: pokemon.name || pokemon.species,
        message: `evolved into ${formName ? formName + ' ' : ''}${targetSpecies}!`,
        type: 'evolution'
    });
    setTimeout(() => setLevelUpNotification(null), 3000);
};

// Apply evolution to a Pokemon - preserves moves and only adds evolution (E) moves
const applyEvolutionToPokemon = (pokemonId, speciesData, regionalForm, inParty, consumedItem = null, previousSpecies = null) => {
    // Get the current Pokemon
    const currentPoke = party.find(p => p.id === pokemonId) || reserve.find(p => p.id === pokemonId);
    if (!currentPoke) return;
    
    // Determine which data to use (base or regional form)
    const isRegional = regionalForm && !regionalForm.isBase;
    const formData = isRegional ? regionalForm : null;
    
    // Determine which move lists to use based on form
    const levelUpMoves = formData?.levelUpMoves || speciesData.levelUpMoves || [];
    const eggMoves = formData?.eggMoves || speciesData.eggMoves || [];
    const tutorMoves = formData?.tutorMoves || speciesData.tutorMoves || [];
    
    // Build updates - similar to applySpeciesToPokemon but WITHOUT replacing moves
    const updates = {
        species: speciesData.species,
        types: formData ? [...formData.types] : [...speciesData.types],
        baseStats: formData?.baseStats ? { ...formData.baseStats } : { ...speciesData.baseStats },
        availableAbilities: formData?.abilities ? { ...formData.abilities } : (speciesData.abilities ? { ...speciesData.abilities } : null),
        pokedexId: speciesData.id,
        regionalForm: isRegional ? regionalForm.name : null,
        availableLevelUpMoves: levelUpMoves,
        availableEggMoves: eggMoves,
        availableTutorMoves: tutorMoves,
        // Store evolution info for potential refund on devolution
        evolvedFrom: previousSpecies || currentPoke.species,
        evolutionStoneUsed: consumedItem || null
    };
    
    // Update abilities - keep current ability if it's still valid, otherwise set default
    const newAbilities = formData?.abilities || speciesData.abilities;
    if (newAbilities) {
        const allValidAbilities = [
            ...(newAbilities.basic || []),
            ...(newAbilities.adv || []),
            ...(newAbilities.high || [])
        ];
        
        // Check if current ability is still valid for evolved form
        if (!currentPoke.ability || !allValidAbilities.includes(currentPoke.ability)) {
            // Set first basic ability as default
            if (newAbilities.basic && newAbilities.basic.length > 0) {
                updates.ability = newAbilities.basic[0];
            }
        }
        // Keep ability2 and ability3 only if they're still valid
        if (currentPoke.ability2 && !allValidAbilities.includes(currentPoke.ability2)) {
            updates.ability2 = '';
        }
        if (currentPoke.ability3 && !allValidAbilities.includes(currentPoke.ability3)) {
            updates.ability3 = '';
        }
    }
    
    // Build Pokemon skills array from Pokédex skills object
    const pokemonSkills = [];
    if (speciesData.skills) {
        const skillMappings = [
            ['overland', 'Overland'], ['surface', 'Surface'], ['sky', 'Sky'],
            ['burrow', 'Burrow'], ['underwater', 'Underwater'], ['jump', 'Jump'],
            ['power', 'Power'], ['intelligence', 'Intelligence']
        ];

        skillMappings.forEach(([key, name]) => {
            if (speciesData.skills[key] !== undefined && speciesData.skills[key] !== null) {
                pokemonSkills.push({ name, value: speciesData.skills[key] });
            }
        });

        // Capability skills - map pokedex key to display name
        const capabilityMappings = [
            ['phasing', 'Phasing'], ['invisibility', 'Invisibility'], ['zapper', 'Zapper'],
            ['firestarter', 'Firestarter'], ['gilled', 'Gilled'], ['tracker', 'Tracker'],
            ['threaded', 'Threaded'], ['mindLock', 'Mind Lock'], ['telepath', 'Telepath'],
            ['telekinetic', 'Telekinetic'], ['aura', 'Aura'], ['amorphous', 'Amorphous'],
            ['chilled', 'Chilled'], ['climber', 'Climber'], ['stealth', 'Stealth'],
            ['fountain', 'Fountain'], ['freezer', 'Freezer'], ['glow', 'Glow'],
            ['groundshaker', 'Groundshaper'], ['guster', 'Guster'], ['heater', 'Heater'],
            ['magnetic', 'Magnetic'], ['sprouter', 'Sprouter'], ['sinker', 'Sinker'],
            ['packMon', 'Pack Mon'], ['empath', 'Telepath'], ['illusionist', 'Invisibility'],
            ['dreamEater', 'Dream Smoke'], ['warp', 'Phasing'],
            // Legendary skills
            ['extinguisher', 'Extinguisher'], ['impenetrable', 'Impenetrable'],
            ['mindslaver', 'Mindslaver'], ['powerOfTheLand', 'Power of the Land']
        ];
        capabilityMappings.forEach(([key, name]) => {
            if (speciesData.skills[key]) {
                pokemonSkills.push({ name });
            }
        });

        if (speciesData.skills.naturewalk && Array.isArray(speciesData.skills.naturewalk)) {
            speciesData.skills.naturewalk.forEach(terrain => {
                pokemonSkills.push({ name: `Naturewalk (${terrain})` });
            });
        }
    }
    updates.pokemonSkills = pokemonSkills;

    // DO NOT replace moves - keep current moveset
    // Apply the species updates first
    updatePokemon(pokemonId, updates);
    
    // Now check for evolution moves (moves at level 0) and queue them
    const evolutionMoves = levelUpMoves.filter(m => m.level === 0);
    const currentMoves = currentPoke.moves || [];
    
    if (evolutionMoves.length > 0) {
        // Build queue of evolution moves to learn
        const movesToQueue = [];
        
        evolutionMoves.forEach(evoMove => {
            // Check if Pokemon already knows this move
            const alreadyKnows = currentMoves.some(m => 
                m.name?.toLowerCase() === evoMove.move?.toLowerCase()
            );
            
            if (!alreadyKnows) {
                movesToQueue.push({
                    pokemonId: pokemonId,
                    pokemonName: currentPoke.name || speciesData.species,
                    newMove: {
                        move: evoMove.move,
                        type: evoMove.type || 'Normal',
                        level: 0
                    },
                    inParty: inParty,
                    isEvolutionMove: true
                });
            }
        });
        
        // Add to pending move learn queue - the useEffect will handle showing modals
        if (movesToQueue.length > 0) {
            setPendingMoveLearn(prev => [...prev, ...movesToQueue]);
        }
    }
};

// Handle Pokemon devolution
const handleDevolution = (pokemonId, targetSpecies) => {
    // Find Pokemon
    const inParty = party.some(p => p.id === pokemonId);
    const pokemon = inParty 
        ? party.find(p => p.id === pokemonId)
        : reserve.find(p => p.id === pokemonId);
    
    if (!pokemon) return;
    
    // Find target species in Pokedex or Custom Species
    let targetPokedexEntry = pokedex.find(p => p.species === targetSpecies);
    if (!targetPokedexEntry) {
        // Check custom species
        targetPokedexEntry = customSpecies.find(p => p.species === targetSpecies);
    }
    if (!targetPokedexEntry) {
        alert(`Could not find ${targetSpecies} in the Pokédex or Custom Species!`);
        return;
    }

    // Check if regional form should carry over
    const currentRegionalForm = pokemon.regionalForm;
    let targetRegionalForm = null;
    
    // If the target has the same regional form available, keep it
    if (currentRegionalForm && targetPokedexEntry.regionalForms) {
        const matchingForm = targetPokedexEntry.regionalForms.find(rf => rf.name === currentRegionalForm);
        if (matchingForm) {
            targetRegionalForm = { name: currentRegionalForm, isBase: false, ...matchingForm };
        }
    }
    
    // Build display name for confirmation
    const devolveTargetName = targetRegionalForm ? `${targetRegionalForm.name} ${targetSpecies}` : targetSpecies;
    
    // Check if there's an evolution stone to refund
    const stoneToRefund = pokemon.evolutionStoneUsed;
    const evolvedFromSpecies = pokemon.evolvedFrom;
    
    // Build confirmation message
    let confirmMsg = `Are you sure you want to devolve ${pokemon.name || pokemon.species} back to ${devolveTargetName}?`;
    if (stoneToRefund && evolvedFromSpecies === targetSpecies) {
        confirmMsg += `\n\nYou will receive back: 1x ${stoneToRefund}`;
    }
    
    // Confirm devolution
    if (!confirm(confirmMsg)) {
        return;
    }
    
    // Refund evolution stone if devolving to the species it evolved from
    if (stoneToRefund && evolvedFromSpecies === targetSpecies) {
        addItemToInventory(stoneToRefund);
    }
    
    // Apply devolution (this will also clear the evolution tracking fields)
    applyDevolutionToPokemon(pokemonId, targetPokedexEntry, targetRegionalForm, inParty);
    
    // Show notification
    let notificationMsg = `devolved back to ${targetRegionalForm ? targetRegionalForm.name + ' ' : ''}${targetSpecies}!`;
    if (stoneToRefund && evolvedFromSpecies === targetSpecies) {
        notificationMsg += ` (${stoneToRefund} refunded)`;
    }
    
    setLevelUpNotification({
        pokemon: pokemon.name || pokemon.species,
        message: notificationMsg,
        type: 'devolution'
    });
    setTimeout(() => setLevelUpNotification(null), 3000);
};

// Add item to inventory (for refunding evolution stones)
const addItemToInventory = (itemName) => {
    setInventory(prev => {
        const existingIdx = prev.findIndex(item => 
            item.name.toLowerCase() === itemName.toLowerCase()
        );
        
        if (existingIdx >= 0) {
            // Item exists, increment quantity
            const newInventory = [...prev];
            newInventory[existingIdx] = {
                ...newInventory[existingIdx],
                quantity: (newInventory[existingIdx].quantity || 1) + 1
            };
            return newInventory;
        } else {
            // New item, add to inventory
            return [...prev, { name: itemName, quantity: 1 }];
        }
    });
};

// Apply devolution to a Pokemon - similar to applySpeciesToPokemon but clears evolution tracking
const applyDevolutionToPokemon = (pokemonId, speciesData, regionalForm, inParty) => {
    // Get the current Pokemon
    const currentPoke = party.find(p => p.id === pokemonId) || reserve.find(p => p.id === pokemonId);
    if (!currentPoke) return;
    const currentLevel = currentPoke?.level || 1;
    
    // Determine which data to use (base or regional form)
    const isRegional = regionalForm && !regionalForm.isBase;
    const formData = isRegional ? regionalForm : null;
    
    // Determine which move lists to use based on form
    const levelUpMoves = formData?.levelUpMoves || speciesData.levelUpMoves || [];
    const eggMoves = formData?.eggMoves || speciesData.eggMoves || [];
    const tutorMoves = formData?.tutorMoves || speciesData.tutorMoves || [];
    
    // Build updates
    const updates = {
        species: speciesData.species,
        types: formData ? [...formData.types] : [...speciesData.types],
        baseStats: formData?.baseStats ? { ...formData.baseStats } : { ...speciesData.baseStats },
        availableAbilities: formData?.abilities ? { ...formData.abilities } : (speciesData.abilities ? { ...speciesData.abilities } : null),
        pokedexId: speciesData.id,
        regionalForm: isRegional ? regionalForm.name : null,
        availableLevelUpMoves: levelUpMoves,
        availableEggMoves: eggMoves,
        availableTutorMoves: tutorMoves,
        // Clear evolution tracking on devolution
        evolvedFrom: null,
        evolutionStoneUsed: null
    };
    
    // Update abilities - keep current ability if it's still valid, otherwise set default
    const newAbilities = formData?.abilities || speciesData.abilities;
    if (newAbilities) {
        const allValidAbilities = [
            ...(newAbilities.basic || []),
            ...(newAbilities.adv || []),
            ...(newAbilities.high || [])
        ];
        
        if (!currentPoke.ability || !allValidAbilities.includes(currentPoke.ability)) {
            if (newAbilities.basic && newAbilities.basic.length > 0) {
                updates.ability = newAbilities.basic[0];
            }
        }
        if (currentPoke.ability2 && !allValidAbilities.includes(currentPoke.ability2)) {
            updates.ability2 = '';
        }
        if (currentPoke.ability3 && !allValidAbilities.includes(currentPoke.ability3)) {
            updates.ability3 = '';
        }
    }
    
    // Build Pokemon skills
    const pokemonSkills = [];
    if (speciesData.skills) {
        const skillMappings = [
            ['overland', 'Overland'], ['surface', 'Surface'], ['sky', 'Sky'],
            ['burrow', 'Burrow'], ['underwater', 'Underwater'], ['jump', 'Jump'],
            ['power', 'Power'], ['intelligence', 'Intelligence']
        ];

        skillMappings.forEach(([key, name]) => {
            if (speciesData.skills[key] !== undefined && speciesData.skills[key] !== null) {
                pokemonSkills.push({ name, value: speciesData.skills[key] });
            }
        });

        // Capability skills - map pokedex key to display name
        const capabilityMappings = [
            ['phasing', 'Phasing'], ['invisibility', 'Invisibility'], ['zapper', 'Zapper'],
            ['firestarter', 'Firestarter'], ['gilled', 'Gilled'], ['tracker', 'Tracker'],
            ['threaded', 'Threaded'], ['mindLock', 'Mind Lock'], ['telepath', 'Telepath'],
            ['telekinetic', 'Telekinetic'], ['aura', 'Aura'], ['amorphous', 'Amorphous'],
            ['chilled', 'Chilled'], ['climber', 'Climber'], ['stealth', 'Stealth'],
            ['fountain', 'Fountain'], ['freezer', 'Freezer'], ['glow', 'Glow'],
            ['groundshaker', 'Groundshaper'], ['guster', 'Guster'], ['heater', 'Heater'],
            ['magnetic', 'Magnetic'], ['sprouter', 'Sprouter'], ['sinker', 'Sinker'],
            ['packMon', 'Pack Mon'], ['empath', 'Telepath'], ['illusionist', 'Invisibility'],
            ['dreamEater', 'Dream Smoke'], ['warp', 'Phasing'],
            // Legendary skills
            ['extinguisher', 'Extinguisher'], ['impenetrable', 'Impenetrable'],
            ['mindslaver', 'Mindslaver'], ['powerOfTheLand', 'Power of the Land']
        ];
        capabilityMappings.forEach(([key, name]) => {
            if (speciesData.skills[key]) {
                pokemonSkills.push({ name });
            }
        });

        if (speciesData.skills.naturewalk && Array.isArray(speciesData.skills.naturewalk)) {
            speciesData.skills.naturewalk.forEach(terrain => {
                pokemonSkills.push({ name: `Naturewalk (${terrain})` });
            });
        }
    }
    updates.pokemonSkills = pokemonSkills;

    // Keep current moves (don't reset on devolution)
    // But we could optionally remove moves that the devolved form can't learn
    
    // Apply updates
    updatePokemon(pokemonId, updates);
};

// Handle species selection from Pokédex
// Handle species selection - regular function to ensure updatePokemon is accessible
const handleSpeciesSelect = (speciesName, pokemonId) => {
    const speciesData = pokedex.find(p => p.species === speciesName);
    if (!speciesData) return;
    
    // Check if this species has regional forms
    if (speciesData.regionalForms && speciesData.regionalForms.length > 0) {
        // Show regional form selector modal
        setRegionalFormData({
            pokemonId,
            speciesData,
            forms: [
                { name: 'Normal', isBase: true },
                ...speciesData.regionalForms
            ]
        });
        setShowRegionalFormModal(true);
        setSpeciesSearch('');
        return;
    }
    
    // No regional forms, apply species directly
    applySpeciesToPokemon(pokemonId, speciesData, null);
    setSpeciesSearch('');
};

// Apply species data to a Pokemon (called directly or after regional form selection)
const applySpeciesToPokemon = (pokemonId, speciesData, regionalForm) => {
    // Get the current Pokemon to check its level
    const currentPoke = party.find(p => p.id === pokemonId) || reserve.find(p => p.id === pokemonId);
    const currentLevel = currentPoke?.level || 1;
    
    // Determine which data to use (base or regional form)
    const isRegional = regionalForm && !regionalForm.isBase;
    const formData = isRegional ? regionalForm : null;
    
    // Determine which move lists to use based on form
    const levelUpMoves = formData?.levelUpMoves || speciesData.levelUpMoves || [];
    const eggMoves = formData?.eggMoves || speciesData.eggMoves || [];
    const tutorMoves = formData?.tutorMoves || speciesData.tutorMoves || [];
    
    const updates = {
        species: speciesData.species,
        types: formData ? [...formData.types] : [...speciesData.types],
        baseStats: formData?.baseStats ? { ...formData.baseStats } : { ...speciesData.baseStats },
        // Store available abilities for reference
        availableAbilities: formData?.abilities ? { ...formData.abilities } : (speciesData.abilities ? { ...speciesData.abilities } : null),
        // Store Pokédex reference data
        pokedexId: speciesData.id,
        // Store regional form info
        regionalForm: isRegional ? regionalForm.name : null,
        // Store available move lists for this form (used for move learning/validation)
        availableLevelUpMoves: levelUpMoves,
        availableEggMoves: eggMoves,
        availableTutorMoves: tutorMoves
    };
    
    // Set abilities using the correct field names (ability, ability2, ability3)
    const abilities = formData?.abilities || speciesData.abilities;
    if (abilities) {
        // Set first basic ability as default
        if (abilities.basic && abilities.basic.length > 0) {
            updates.ability = abilities.basic[0];
        }
        // Clear the other ability slots (user can add them manually)
        updates.ability2 = '';
        updates.ability3 = '';
    }
    
    // Build Pokemon skills array from Pokédex skills object
    const pokemonSkills = [];
    if (speciesData.skills) {
        // Movement skills with values
        const skillMappings = [
            ['overland', 'Overland'], ['surface', 'Surface'], ['sky', 'Sky'],
            ['burrow', 'Burrow'], ['underwater', 'Underwater'], ['jump', 'Jump'],
            ['power', 'Power'], ['intelligence', 'Intelligence']
        ];

        skillMappings.forEach(([key, name]) => {
            if (speciesData.skills[key] !== undefined && speciesData.skills[key] !== null) {
                pokemonSkills.push({ name, value: speciesData.skills[key] });
            }
        });

        // Capability skills - map pokedex key to display name
        const capabilityMappings = [
            ['phasing', 'Phasing'], ['invisibility', 'Invisibility'], ['zapper', 'Zapper'],
            ['firestarter', 'Firestarter'], ['gilled', 'Gilled'], ['tracker', 'Tracker'],
            ['threaded', 'Threaded'], ['mindLock', 'Mind Lock'], ['telepath', 'Telepath'],
            ['telekinetic', 'Telekinetic'], ['aura', 'Aura'], ['amorphous', 'Amorphous'],
            ['chilled', 'Chilled'], ['climber', 'Climber'], ['stealth', 'Stealth'],
            ['fountain', 'Fountain'], ['freezer', 'Freezer'], ['glow', 'Glow'],
            ['groundshaker', 'Groundshaper'], ['guster', 'Guster'], ['heater', 'Heater'],
            ['magnetic', 'Magnetic'], ['sprouter', 'Sprouter'], ['sinker', 'Sinker'],
            ['packMon', 'Pack Mon'], ['empath', 'Telepath'], ['illusionist', 'Invisibility'],
            ['dreamEater', 'Dream Smoke'], ['warp', 'Phasing'],
            // Legendary skills
            ['extinguisher', 'Extinguisher'], ['impenetrable', 'Impenetrable'],
            ['mindslaver', 'Mindslaver'], ['powerOfTheLand', 'Power of the Land']
        ];
        capabilityMappings.forEach(([key, name]) => {
            if (speciesData.skills[key]) {
                pokemonSkills.push({ name });
            }
        });

        // Naturewalk (array of terrain types)
        if (speciesData.skills.naturewalk && Array.isArray(speciesData.skills.naturewalk)) {
            speciesData.skills.naturewalk.forEach(terrain => {
                pokemonSkills.push({ name: `Naturewalk (${terrain})` });
            });
        }
    }
    updates.pokemonSkills = pokemonSkills;

    // Add starting moves based on current level (moves at level 0 and 1, plus any up to current level)
    if (levelUpMoves && levelUpMoves.length > 0) {
        // Filter to moves at or below current level, then deduplicate by move name
        const seenMoves = new Set();
        const startingMoves = levelUpMoves
            .filter(m => m.level <= currentLevel)
            .filter(m => {
                const moveLower = m.move?.toLowerCase();
                if (seenMoves.has(moveLower)) return false;
                seenMoves.add(moveLower);
                return true;
            })
            .slice(0, 4) // Max 4 natural moves
            .map(m => {
                const moveData = GAME_DATA.moves[m.move] || {};
                return {
                    name: m.move,
                    type: moveData.type || m.type || 'Normal',
                    category: moveData.category || 'Physical',
                    frequency: moveData.frequency || 'At-Will',
                    damage: moveData.damage || '',
                    range: moveData.range || 'Melee',
                    effect: moveData.effect || '',
                    source: 'natural',
                    learnedAtLevel: m.level
                };
            });
        
        // Set moves when:
        // - Pokemon has no moves yet (new Pokemon)
        // - Pokemon has no species yet (first time setting species)
        // - Species is changing to a different one
        const hasNoMoves = !currentPoke?.moves || currentPoke.moves.length === 0;
        const hasNoSpecies = !currentPoke?.species;
        const speciesIsChanging = currentPoke?.species && currentPoke.species !== speciesData.species;
        
        if (hasNoMoves || hasNoSpecies || speciesIsChanging) {
            updates.moves = startingMoves;
        }
    }
    
    // Call updatePokemon
    updatePokemon(pokemonId, updates);
};

// Handle regional form selection
const handleRegionalFormSelect = (form) => {
    if (!regionalFormData) return;
    
    applySpeciesToPokemon(
        regionalFormData.pokemonId,
        regionalFormData.speciesData,
        form
    );
    
    setShowRegionalFormModal(false);
    setRegionalFormData(null);
};

// Auto-save functionality
useEffect(() => {
    const saveTimeout = setTimeout(() => {
        saveData();
    }, 1000);
    
    return () => clearTimeout(saveTimeout);
}, [trainers, inventory, activeTrainerId]);

// Calculate trainer level from experience
const calculateTrainerLevel = (exp) => {
    // Trainers gain levels from achievements, not exp
    // This is just for reference
    return trainer.level;
};

// Calculate Pokémon level from experience
const calculatePokemonLevel = (exp) => {
    let level = 1;
    for (let lvl in GAME_DATA.pokemonExpChart) {
        if (exp >= GAME_DATA.pokemonExpChart[lvl]) {
            level = parseInt(lvl);
        } else {
            break;
        }
    }
    return level;
};

// Calculate exp needed for next level
const getExpToNextLevel = (currentExp, currentLevel) => {
    const nextLevel = Math.min(currentLevel + 1, 100);
    const expNeeded = GAME_DATA.pokemonExpChart[nextLevel] || 0;
    return expNeeded - currentExp;
};

// Apply nature to Pokémon stats
// HP modifications are +1/-1, all other stats are +2/-2
const applyNature = (baseStats, nature) => {
    const natureData = GAME_DATA.natures[nature];
    if (!natureData) return baseStats;
    
    let modifiedStats = { ...baseStats };
    if (natureData.buff) {
        // HP gets +1, other stats get +2
        const buffAmount = natureData.buff === 'hp' ? 1 : 2;
        modifiedStats[natureData.buff] = baseStats[natureData.buff] + buffAmount;
    }
    if (natureData.nerf) {
        // HP gets -1, other stats get -2
        const nerfAmount = natureData.nerf === 'hp' ? 1 : 2;
        modifiedStats[natureData.nerf] = Math.max(1, baseStats[natureData.nerf] - nerfAmount);
    }
    return modifiedStats;
};

// Calculate Combat Stage modifier for a stat
// +25% per positive stage (rounded down), -10% per negative stage (rounded up)
// At +6: 250% of original, at -6: 40% of original
const applyCombatStage = (baseStat, stages) => {
    if (stages === 0) return baseStat;
    
    if (stages > 0) {
        // +25% per positive stage, rounded down
        return Math.floor(baseStat * (1 + (stages * 0.25)));
    } else {
        // -10% per negative stage, rounded up
        // At -6, should be 40% of original (1 - 0.6 = 0.4)
        const reduction = Math.abs(stages) * 0.10;
        return Math.ceil(baseStat * (1 - reduction));
    }
};

// Get combat stage percentage display
const getCombatStagePercent = (stages) => {
    if (stages === 0) return '100%';
    if (stages > 0) {
        return `${100 + (stages * 25)}%`;
    } else {
        return `${100 - (Math.abs(stages) * 10)}%`;
    }
};

// Calculate Speed Skill modifier from combat stages
// +1 per 2 positive stages, -1 per 3 negative stages (min 1)
const getSpeedSkillMod = (spdStages) => {
    if (spdStages >= 0) {
        return Math.floor(spdStages / 2);
    } else {
        return -Math.floor(Math.abs(spdStages) / 3);
    }
};

// Calculate STAB bonus
const calculateSTAB = (level) => {
    // STAB bonus based on level thresholds - OFFICIAL P:TA HANDBOOK
    // You get the bonus AT the listed level
    if (level >= 100) return 20;
    if (level >= 95) return 19;
    if (level >= 90) return 18;
    if (level >= 85) return 17;
    if (level >= 80) return 16;
    if (level >= 75) return 15;
    if (level >= 70) return 14;
    if (level >= 65) return 13;
    if (level >= 60) return 12;
    if (level >= 55) return 11;
    if (level >= 50) return 10;
    if (level >= 45) return 9;
    if (level >= 40) return 8;
    if (level >= 35) return 7;
    if (level >= 30) return 6;
    if (level >= 25) return 5;
    if (level >= 20) return 4;
    if (level >= 15) return 3;
    if (level >= 10) return 2;
    if (level >= 5) return 1;
    return 0; // Below level 5, no STAB bonus
};

// Save data to storage
const saveData = async () => {
    try {
        const savePayload = {
            trainers,
            activeTrainerId,
            inventory,
            customSpecies,
            lastSaved: new Date().toISOString(),
            version: '2.1' // Added custom species support
        };
        
        let saveSuccess = false;
        
        if (window.storage) {
            // Use Claude's persistent storage if available
            const result = await window.storage.set('pta-enhanced-save-data', JSON.stringify(savePayload));
            saveSuccess = !!result;
        } else {
            // Fallback to localStorage with safe wrapper
            saveSuccess = safeLocalStorageSet('pta-enhanced-save-data', savePayload);
        }
        
        if (saveSuccess) {
            setShowSaveIndicator(true);
            setTimeout(() => setShowSaveIndicator(false), 2000);
        } else {
            console.warn('Save may not have persisted properly');
        }
    } catch (error) {
        console.error('Error saving data:', error);
    }
};

// Migrate old single-trainer data to multi-trainer format
const migrateOldData = (loadedData) => {
    // Helper to migrate skills from array to object format
    const migrateSkillsToObject = (skills) => {
        if (!skills) return {};
        if (Array.isArray(skills)) {
            // Convert array format to object with rank 1
            return skills.reduce((acc, skill) => {
                acc[skill] = 1;
                return acc;
            }, {});
        }
        // Already object format
        return skills;
    };

    // Helper to migrate pokemon array to party/reserve
    const migratePokemonToPartyReserve = (trainerData) => {
        // If already has party/reserve, just ensure they exist
        if (trainerData.party !== undefined || trainerData.reserve !== undefined) {
            return {
                ...trainerData,
                party: trainerData.party || [],
                reserve: trainerData.reserve || []
            };
        }
        
        // Migrate from old pokemon array
        const allPokemon = trainerData.pokemon || [];
        return {
            ...trainerData,
            party: allPokemon.slice(0, 6),
            reserve: allPokemon.slice(6),
            pokemon: undefined // Remove old field
        };
    };
    
    // Check if it's old format (has trainer instead of trainers)
    if (loadedData.trainer && !loadedData.trainers) {
        let trainerData = loadedData.trainer;
        
        // Migrate old class/advancedClass to classes array
        if (!trainerData.classes) {
            const migratedClasses = [];
            if (trainerData.class) migratedClasses.push(trainerData.class);
            if (trainerData.advancedClass) migratedClasses.push(trainerData.advancedClass);
            trainerData = { ...trainerData, classes: migratedClasses };
        }
        
        // Add ID and pokemon array to trainer
        trainerData = {
            ...trainerData,
            id: trainerData.id || Date.now(),
            pokemon: loadedData.pokemon || trainerData.pokemon || []
        };
        
        // Migrate to party/reserve
        trainerData = migratePokemonToPartyReserve(trainerData);

        // Migrate skills to object format
        trainerData = {
            ...trainerData,
            skills: migrateSkillsToObject(trainerData.skills)
        };

        return {
            trainers: [trainerData],
            activeTrainerId: trainerData.id,
            inventory: loadedData.inventory || []
        };
    }

    // Multi-trainer format - migrate each trainer's pokemon to party/reserve and skills
    if (loadedData.trainers) {
        return {
            ...loadedData,
            trainers: loadedData.trainers.map(t => ({
                ...migratePokemonToPartyReserve(t),
                skills: migrateSkillsToObject(t.skills)
            }))
        };
    }
    
    // Already new format
    return loadedData;
};

// Load data from storage
const loadData = async () => {
    try {
        let loadedData = null;
        
        if (window.storage) {
            // Use Claude's persistent storage if available
            try {
                const result = await window.storage.get('pta-enhanced-save-data');
                if (result && result.value) {
                    loadedData = JSON.parse(result.value);
                }
            } catch (storageErr) {
                console.warn('Cloud storage not available, falling back to localStorage');
            }
        }
        
        // Fallback to localStorage if no cloud data
        if (!loadedData) {
            loadedData = safeLocalStorageGet('pta-enhanced-save-data', null);
        }
        
        if (loadedData) {
            // Validate data structure before using
            if (typeof loadedData !== 'object') {
                console.error('Invalid data format loaded');
                return;
            }
            
            // Migrate old format if needed
            const migratedData = migrateOldData(loadedData);
            
            if (migratedData.trainers && Array.isArray(migratedData.trainers) && migratedData.trainers.length > 0) {
                setTrainers(migratedData.trainers);
                setActiveTrainerId(migratedData.activeTrainerId || migratedData.trainers[0].id);
            }
            setInventory(Array.isArray(migratedData.inventory) ? migratedData.inventory : []);
            setCustomSpecies(Array.isArray(migratedData.customSpecies) ? migratedData.customSpecies : []);
        }
    } catch (error) {
        console.error('Error loading data:', error);
        // Don't crash - app will start with default state
    }
};

// Export trainer for Discord/sharing
const exportTrainerText = () => exportTrainerTextUtil(trainer); // Wrapper for local trainer
const _originalExportTrainerText = () => {
    const actualStats = {
        hp: trainer.stats.hp,
        atk: trainer.stats.atk,
        def: trainer.stats.def,
        satk: trainer.stats.satk,
        sdef: trainer.stats.sdef,
        spd: trainer.stats.spd
    };
    const maxHP = (trainer.stats.hp * 4) + (trainer.level * 4);
    const genderSymbol = trainer.gender === 'male' ? '♂' : trainer.gender === 'female' ? '♀' : '';
    const classesDisplay = (trainer.classes && trainer.classes.length > 0) ? trainer.classes.join(' / ') : 'Trainer';
    
    let text = `**━━━━━━ TRAINER CARD ━━━━━━**\n`;
    text += `**${trainer.name || 'Unnamed'}** ${genderSymbol}\n`;
    text += `Level ${trainer.level} ${classesDisplay}\n\n`;
    text += `**Stats** (Max HP: ${maxHP})\n`;
    text += `HP: ${actualStats.hp} | ATK: ${actualStats.atk} | DEF: ${actualStats.def}\n`;
    text += `SATK: ${actualStats.satk} | SDEF: ${actualStats.sdef} | SPD: ${actualStats.spd}\n\n`;
    
    if (trainer.features.length > 0) {
        const featureNames = trainer.features.map(f => typeof f === 'object' ? f.name : f);
        text += `**Features:** ${featureNames.join(', ')}\n`;
    }
    // Handle both legacy array format and new object format for skills
    const skillsForDisplay = Array.isArray(trainer.skills)
        ? trainer.skills
        : Object.entries(trainer.skills || {})
            .filter(([_, rank]) => rank > 0)
            .map(([name, rank]) => rank === 2 ? `${name} (★★)` : name);
    if (skillsForDisplay.length > 0) {
        text += `**Skills:** ${skillsForDisplay.join(', ')}\n`;
    }
    if (trainer.badges.length > 0) {
        text += `**Badges:** ${trainer.badges.length}\n`;
    }
    text += `**Money:** ₽${trainer.money.toLocaleString()}\n`;
    text += `**━━━━━━━━━━━━━━━━━━━━━**`;
    
    return text;
};

// ============================================================
// EXPORT/IMPORT FUNCTIONS
// ============================================================

/** Export Pokemon data as formatted text for Discord/sharing */
const exportPokemonText = (poke) => {
    const actualStats = getActualStats(poke);
    const maxHP = calculatePokemonHP(poke);
    const genderSymbol = poke.gender === 'male' ? '♂' : poke.gender === 'female' ? '♀' : poke.gender === 'genderless' ? '⚪' : '';
    
    let text = `**━━━━━━ POKÉMON ━━━━━━**\n`;
    text += `**${poke.name}** ${genderSymbol}`;
    if (poke.species && poke.species !== poke.name) {
        text += ` (${poke.species})`;
    }
    text += `\n`;
    text += `Level ${poke.level} | ${poke.types.join('/')} | ${poke.nature} Nature\n`;
    
    // Build abilities list
    const abilities = [poke.ability, poke.ability2, poke.ability3].filter(a => a);
    text += `**Abilities:** ${abilities.length > 0 ? abilities.join(', ') : 'None'}\n`;
    
    // Build skills list
    const skills = (poke.pokemonSkills || []);
    if (skills.length > 0) {
        const skillsStr = skills.map(s => s.value ? `${s.name} ${s.value}` : s.name).join(', ');
        text += `**Skills:** ${skillsStr}\n`;
    }
    text += `\n`;
    
    text += `**Stats** (Max HP: ${maxHP})\n`;
    text += `HP: ${actualStats.hp} | ATK: ${actualStats.atk} | DEF: ${actualStats.def}\n`;
    text += `SATK: ${actualStats.satk} | SDEF: ${actualStats.sdef} | SPD: ${actualStats.spd}\n\n`;
    
    if (poke.moves.length > 0) {
        text += `**Moves:**\n`;
        poke.moves.forEach(move => {
            text += `• ${move.name} (${move.type}) - ${move.damage || 'Status'} [${move.frequency}]\n`;
        });
    }
    
    text += `**━━━━━━━━━━━━━━━━━━━━━**`;
    
    return text;
};

/** Export Team data as formatted text for Discord/sharing */
const exportTeamText = () => {
    const genderSymbol = trainer.gender === 'male' ? '♂' : trainer.gender === 'female' ? '♀' : '';
    const classesDisplay = (trainer.classes && trainer.classes.length > 0) ? trainer.classes.join(' / ') : 'Trainer';
    
    let text = `**╔══════════════════════════════════════╗**\n`;
    text += `**║     ${trainer.name || 'Unnamed'} ${genderSymbol} - TEAM CARD     ║**\n`;
    text += `**╚══════════════════════════════════════╝**\n\n`;
    
    text += `📋 **TRAINER INFO**\n`;
    text += `Level ${trainer.level} ${classesDisplay}\n`;
    text += `💰 ₽${(trainer.money || 0).toLocaleString()} | 🎖️ ${trainer.badges?.length || 0} Badges\n\n`;
    
    text += `⚔️ **ACTIVE PARTY** (${party.length}/6)\n`;
    text += `─────────────────────────────────\n`;
    
    if (party.length === 0) {
        text += `(No Pokémon in party)\n`;
    } else {
        party.forEach((poke, idx) => {
            const actualStats = getActualStats(poke);
            const maxHP = calculatePokemonHP(poke);
            const currentHP = maxHP - (poke.currentDamage || 0);
            const genderIcon = poke.gender === 'male' ? '♂' : poke.gender === 'female' ? '♀' : '';
            const typeStr = poke.types?.join('/') || 'Normal';
            
            text += `\n**${idx + 1}. ${poke.name || poke.species || 'Unknown'}** ${genderIcon}\n`;
            text += `   Lv.${poke.level} | ${typeStr} | HP: ${currentHP}/${maxHP}\n`;
            text += `   ATK:${actualStats.atk} DEF:${actualStats.def} SATK:${actualStats.satk} SDEF:${actualStats.sdef} SPD:${actualStats.spd}\n`;
            
            // Show moves (max 4)
            if (poke.moves && poke.moves.length > 0) {
                const moveNames = poke.moves.slice(0, 4).map(m => m.name).join(', ');
                text += `   Moves: ${moveNames}\n`;
            }
        });
    }
    
    text += `\n─────────────────────────────────\n`;
    text += `📅 ${new Date().toLocaleDateString()} | P:TA Character Manager`;
    
    return text;
};

// Copy to clipboard
const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard! Paste in Discord or anywhere.');
    }).catch(err => {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Copied to clipboard!');
    });
};

// Export all data as JSON file
const exportAllData = () => {
    const exportData = {
        trainers,
        activeTrainerId,
        inventory,
        exportedAt: new Date().toISOString(),
        version: '2.1',
        _m: { c: 'leander_rsr', h: '6c65616e6465725f727372' },
        // Include summary for user reference
        _summary: {
            trainerCount: trainers.length,
            trainerNames: trainers.map(t => t.name || 'Unnamed').join(', '),
            totalMoney: trainers.reduce((sum, t) => sum + (t.money || 0), 0),
            inventoryItemCount: inventory.length,
            totalPokemon: trainers.reduce((sum, t) => sum + (t.party?.length || 0) + (t.reserve?.length || 0), 0)
        }
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pta-all-trainers-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

// Export single trainer
const exportSingleTrainer = (trainerToExport) => {
    const exportData = {
        trainer: {
            ...trainerToExport,
            // Ensure money is explicitly included
            money: trainerToExport.money || 0,
            // Ensure party and reserve are included
            party: trainerToExport.party || [],
            reserve: trainerToExport.reserve || []
        },
        pokemon: [...(trainerToExport.party || []), ...(trainerToExport.reserve || [])], // Legacy compatibility
        inventory: inventory, // Include shared inventory
        exportedAt: new Date().toISOString(),
        version: '1.1',
        _m: { c: 'leander_rsr', h: '6c65616e6465725f727372' },
        // Include summary for user reference
        _summary: {
            trainerName: trainerToExport.name || 'Unnamed',
            trainerLevel: trainerToExport.level || 0,
            money: trainerToExport.money || 0,
            partyCount: (trainerToExport.party || []).length,
            reserveCount: (trainerToExport.reserve || []).length,
            inventoryItemCount: inventory.length
        }
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trainerToExport.name || 'trainer'}-pta-data.json`;
    a.click();
    URL.revokeObjectURL(url);
};

// Import data from JSON file
const importData = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            // Helper to migrate skills array to object format
            const migrateSkills = (skills) => {
                if (!skills) return {};
                if (Array.isArray(skills)) {
                    return skills.reduce((acc, s) => ({ ...acc, [s]: 1 }), {});
                }
                return skills;
            };

            // Check if it's multi-trainer format (v2.0+)
            if (data.trainers) {
                // Ensure all trainers have proper structure
                const migratedTrainers = data.trainers.map(t => ({
                    ...t,
                    money: t.money || 0,
                    party: t.party || t.pokemon?.slice(0, 6) || [],
                    reserve: t.reserve || t.pokemon?.slice(6) || [],
                    skills: migrateSkills(t.skills)
                }));
                setTrainers(migratedTrainers);
                setActiveTrainerId(data.activeTrainerId || migratedTrainers[0]?.id);
                if (data.inventory) setInventory(data.inventory);
                
                // Build summary message
                const totalMoney = migratedTrainers.reduce((sum, t) => sum + (t.money || 0), 0);
                const totalPokemon = migratedTrainers.reduce((sum, t) => sum + (t.party?.length || 0) + (t.reserve?.length || 0), 0);
                const inventoryCount = data.inventory?.length || 0;
                
                alert(`Data imported successfully!\n\n` +
                    `• ${migratedTrainers.length} trainer(s) loaded\n` +
                    `• ${totalPokemon} Pokémon total\n` +
                    `• ₽${totalMoney.toLocaleString()} total money\n` +
                    `• ${inventoryCount} inventory item(s)`);
            } 
            // Single-trainer format (v1.0+)
            else if (data.trainer) {
                let trainerData = data.trainer;
                
                // Migrate old class format
                if (!trainerData.classes) {
                    const migratedClasses = [];
                    if (trainerData.class) migratedClasses.push(trainerData.class);
                    if (trainerData.advancedClass) migratedClasses.push(trainerData.advancedClass);
                    trainerData = { ...trainerData, classes: migratedClasses };
                }
                
                // Ensure proper structure with money, party, reserve, skills
                trainerData = {
                    ...trainerData,
                    id: trainerData.id || Date.now(),
                    money: trainerData.money || 0,
                    // Handle party/reserve - prefer explicit fields, fall back to pokemon array or separate data
                    party: trainerData.party || data.pokemon?.slice(0, 6) || trainerData.pokemon?.slice(0, 6) || [],
                    reserve: trainerData.reserve || data.pokemon?.slice(6) || trainerData.pokemon?.slice(6) || [],
                    skills: migrateSkills(trainerData.skills)
                };
                
                // Ask if they want to replace all or add to existing
                if (trainers.length > 0 && trainers[0].name) {
                    const choice = confirm(
                        `You have existing trainers. Do you want to:\n\n` +
                        `OK = Add "${trainerData.name || 'Imported Trainer'}" as a new trainer\n` +
                        `Cancel = Replace all trainers with this import`
                    );
                    if (choice) {
                        // Add as new trainer
                        trainerData.id = Date.now();
                        setTrainers(prev => [...prev, trainerData]);
                        setActiveTrainerId(trainerData.id);
                    } else {
                        // Replace all
                        setTrainers([trainerData]);
                        setActiveTrainerId(trainerData.id);
                    }
                } else {
                    // No existing trainers, just set it
                    setTrainers([trainerData]);
                    setActiveTrainerId(trainerData.id);
                }
                
                // Import inventory if present (ask user if they want to merge or replace)
                if (data.inventory && data.inventory.length > 0) {
                    if (inventory.length > 0) {
                        const inventoryChoice = confirm(
                            `The import file contains ${data.inventory.length} inventory item(s).\n\n` +
                            `OK = Merge with existing inventory\n` +
                            `Cancel = Replace existing inventory`
                        );
                        if (inventoryChoice) {
                            // Merge inventories (combine quantities of same items)
                            const mergedInventory = [...inventory];
                            data.inventory.forEach(importItem => {
                                const existingIndex = mergedInventory.findIndex(i => i.name === importItem.name);
                                if (existingIndex >= 0) {
                                    mergedInventory[existingIndex] = {
                                        ...mergedInventory[existingIndex],
                                        quantity: (mergedInventory[existingIndex].quantity || 1) + (importItem.quantity || 1)
                                    };
                                } else {
                                    mergedInventory.push(importItem);
                                }
                            });
                            setInventory(mergedInventory);
                        } else {
                            setInventory(data.inventory);
                        }
                    } else {
                        setInventory(data.inventory);
                    }
                }
                
                // Build summary message
                const pokemonCount = (trainerData.party?.length || 0) + (trainerData.reserve?.length || 0);
                const inventoryCount = data.inventory?.length || 0;
                
                alert(`Trainer imported successfully!\n\n` +
                    `• ${trainerData.name || 'Unnamed'} (Level ${trainerData.level || 0})\n` +
                    `• ${pokemonCount} Pokémon\n` +
                    `• ₽${(trainerData.money || 0).toLocaleString()} money\n` +
                    (inventoryCount > 0 ? `• ${inventoryCount} inventory item(s)` : ''));
            } else {
                alert('Error: No trainer data found in file.');
            }
        } catch (err) {
            console.error('Import error:', err);
            alert('Error importing data: Invalid file format');
        }
    };
    reader.readAsText(file);
};

// Download card as image using html2canvas approach
const downloadCardAsImage = async (cardId, filename) => {
    const card = document.getElementById(cardId);
    if (!card) {
        alert('Card element not found. Please try again.');
        return;
    }
    
    try {
        // Use html2canvas library loaded from CDN
        if (typeof html2canvas === 'undefined') {
            // Load html2canvas dynamically
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                script.onload = resolve;
                script.onerror = () => reject(new Error('Failed to load html2canvas'));
                document.head.appendChild(script);
            });
        }
        await captureCard(card, filename);
    } catch (err) {
        console.error('Error loading html2canvas:', err);
        // Offer alternative: copy to clipboard
        if (confirm('Image export failed. Would you like to copy the card data as text instead?')) {
            try {
                const text = card.innerText;
                await navigator.clipboard.writeText(text);
                alert('Card data copied to clipboard!');
            } catch (clipErr) {
                alert('Export failed. Try taking a screenshot manually (Print Screen key).');
            }
        }
    }
};

const captureCard = async (card, filename) => {
    try {
        // Clone the card and apply inline styles for better capture
        const canvas = await html2canvas(card, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            // Fix for some CSS issues
            onclone: (clonedDoc) => {
                const clonedCard = clonedDoc.getElementById(card.id);
                if (clonedCard) {
                    // Ensure fonts are loaded
                    clonedCard.style.fontFamily = 'Segoe UI, Arial, sans-serif';
                }
            }
        });
        
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (err) {
        console.error('Error capturing card:', err);
        alert('Error creating image. Try right-clicking the card and using "Save image as..." or take a screenshot.');
    }
};

// Generate trainer card HTML
const generateTrainerCard = () => {
    const maxHP = (trainer.stats.hp * 4) + (trainer.level * 4);
    const genderSymbol = trainer.gender === 'male' ? '♂' : trainer.gender === 'female' ? '♀' : '';
    const featureNames = trainer.features.map(f => typeof f === 'object' ? f.name : f);
    
    return { maxHP, genderSymbol, featureNames };
};

// Generate pokemon card data
const generatePokemonCard = (poke) => {
    if (!poke) return null;
    const actualStats = getActualStats(poke);
    const maxHP = calculatePokemonHP(poke);
    const genderSymbol = poke.gender === 'male' ? '♂' : poke.gender === 'female' ? '♀' : poke.gender === 'genderless' ? '⚪' : '';
    const stabBonus = calculateSTAB(poke.level);
    
    return { actualStats, maxHP, genderSymbol, stabBonus };
};

// Calculate trainer modifiers
const calculateModifier = (stat) => {
    if (stat === 10) return 0;
    if (stat < 10) return -(10 - stat);
    return Math.floor((stat - 10) / 2);
};

// Calculate trainer max HP
const calculateMaxHP = () => {
    let baseHP = (trainer.stats.hp * 4) + (trainer.level * 4);

    // Check for HP bonus features - they add HP bonuses based on stat modifiers
    const features = trainer.features || [];

    // Check for Improved Martial Endurance first (uses full modifiers, replaces basic version)
    const hasImprovedMartialEndurance = features.some(f =>
        (typeof f === 'object' ? f.name : f) === 'Improved Martial Endurance'
    );

    // Check for basic Martial Endurance (uses half modifiers)
    const hasMartialEndurance = features.some(f =>
        (typeof f === 'object' ? f.name : f) === 'Martial Endurance'
    );

    // Check for Mystic Veil (DEF mod × 3)
    const hasMysticVeil = features.some(f =>
        (typeof f === 'object' ? f.name : f) === 'Mystic Veil'
    );

    if (hasImprovedMartialEndurance) {
        // Improved: (ATK mod + DEF mod) × 5
        const atkMod = calculateModifier(trainer.stats.atk || 10);
        const defMod = calculateModifier(trainer.stats.def || 10);
        const hpBonus = (atkMod + defMod) * 5;
        baseHP += Math.max(0, hpBonus);
    } else if (hasMartialEndurance) {
        // Basic: (half ATK mod + half DEF mod) × 5
        const atkMod = calculateModifier(trainer.stats.atk || 10);
        const defMod = calculateModifier(trainer.stats.def || 10);
        const hpBonus = (Math.floor(atkMod / 2) + Math.floor(defMod / 2)) * 5;
        baseHP += Math.max(0, hpBonus);
    }

    if (hasMysticVeil) {
        // Mystic Veil: DEF mod × 3
        const defMod = calculateModifier(trainer.stats.def || 10);
        const hpBonus = defMod * 3;
        baseHP += Math.max(0, hpBonus);
    }

    return baseHP;
};

// Update trainer stat
const updateTrainerStat = (stat, value) => {
    const newValue = parseInt(value) || 6;
    const oldValue = trainer.stats[stat];
    const difference = newValue - oldValue;
    
    // Total available points from both pools
    const totalAvailable = trainer.statPoints + (trainer.levelStatPoints || 0);
    
    // Minimum stat is 6
    if (newValue < 6) return;
    
    // Check if we have enough points
    if (totalAvailable - difference < 0) return;
    
    // For character creation points, cap at 14 per stat
    // Level stat points have no cap
    // We use creation points first (they have the cap), then level points
    
    if (difference > 0) {
        // Spending points
        // If stat would go above 14 and we still have creation points, limit based on creation pool
        if (newValue > 14 && trainer.statPoints > 0) {
            // Can only use creation points up to stat 14
            const pointsToReach14 = Math.max(0, 14 - oldValue);
            const creationPointsToUse = Math.min(trainer.statPoints, pointsToReach14);
            const levelPointsToUse = difference - creationPointsToUse;
            
            if (levelPointsToUse > (trainer.levelStatPoints || 0)) return;
            
            setTrainer(prev => ({
                ...prev,
                stats: { ...prev.stats, [stat]: newValue },
                statPoints: prev.statPoints - creationPointsToUse,
                levelStatPoints: (prev.levelStatPoints || 0) - levelPointsToUse
            }));
        } else if (newValue <= 14 && trainer.statPoints >= difference) {
            // Within creation cap, use creation points
            setTrainer(prev => ({
                ...prev,
                stats: { ...prev.stats, [stat]: newValue },
                statPoints: prev.statPoints - difference
            }));
        } else if (newValue <= 14 && trainer.statPoints < difference) {
            // Need to use some level points
            const creationPointsToUse = trainer.statPoints;
            const levelPointsToUse = difference - creationPointsToUse;
            
            if (levelPointsToUse > (trainer.levelStatPoints || 0)) return;
            
            setTrainer(prev => ({
                ...prev,
                stats: { ...prev.stats, [stat]: newValue },
                statPoints: 0,
                levelStatPoints: (prev.levelStatPoints || 0) - levelPointsToUse
            }));
        } else {
            // Above 14, only level points can be used
            if (difference > (trainer.levelStatPoints || 0)) return;
            
            setTrainer(prev => ({
                ...prev,
                stats: { ...prev.stats, [stat]: newValue },
                levelStatPoints: (prev.levelStatPoints || 0) - difference
            }));
        }
    } else {
        // Refunding points (negative difference)
        const refund = Math.abs(difference);
        
        if (trainer.level === 0) {
            // At level 0, refund to creation points only
            setTrainer(prev => ({
                ...prev,
                stats: { ...prev.stats, [stat]: newValue },
                statPoints: prev.statPoints + refund
            }));
        } else {
            // At level 1+, refund to level points only
            setTrainer(prev => ({
                ...prev,
                stats: { ...prev.stats, [stat]: newValue },
                levelStatPoints: (prev.levelStatPoints || 0) + refund
            }));
        }
    }
};

// ============================================================
// LEVEL & STAT CALCULATION FUNCTIONS
// ============================================================

/** Level up the trainer and grant rewards */
const levelUpTrainer = () => {
    const newLevel = trainer.level + 1;
    if (newLevel > 50) {
        alert('Maximum trainer level is 50!');
        return;
    }
    
    // Special validation for level 0 → 1 transition
    if (trainer.level === 0) {
        const creationPointsRemaining = trainer.statPoints || 0;
        const hasClass = (trainer.classes || []).length > 0;
        
        const issues = [];
        if (creationPointsRemaining > 0) {
            issues.push(`• Spend all 30 Creation stat points (${creationPointsRemaining} remaining)`);
        }
        if (!hasClass) {
            issues.push('• Pick your first Trainer Class');
        }
        
        if (issues.length > 0) {
            alert(`Before becoming Level 1, you must complete character creation:\n\n${issues.join('\n')}`);
            return;
        }
    }
    
    const levelData = GAME_DATA.trainerLevelProgression[newLevel] || { feats: 0, stats: 0 };
    
    setTrainer(prev => ({
        ...prev,
        level: newLevel,
        levelStatPoints: (prev.levelStatPoints || 0) + levelData.stats,
        featPoints: (prev.featPoints || 0) + levelData.feats
    }));
    
    const notifications = [];
    if (levelData.stats > 0) notifications.push(`+${levelData.stats} stat point(s)`);
    if (levelData.feats > 0) notifications.push(`+${levelData.feats} feature(s)`);
    if (levelData.note) notifications.push(levelData.note);
    
    setLevelUpNotification({
        type: 'trainer',
        name: trainer.name,
        level: newLevel,
        statPoints: levelData.stats,
        featPoints: levelData.feats,
        note: levelData.note,
        message: notifications.join(' | ')
    });
    
    setTimeout(() => setLevelUpNotification(null), 5000);
};

const levelDownTrainer = () => {
    if (trainer.level <= 1) {
        alert('Cannot go below level 1! Use "Respec Trainer" to reset to level 0 for character recreation.');
        return;
    }
    
    const currentLevel = trainer.level;
    const newLevel = currentLevel - 1;
    const levelData = GAME_DATA.trainerLevelProgression[currentLevel] || { feats: 0, stats: 0 };
    
    // Calculate total stat points that SHOULD be available at new level
    let totalLevelStatsAtNewLevel = 0;
    for (let i = 1; i <= newLevel; i++) {
        totalLevelStatsAtNewLevel += (GAME_DATA.trainerLevelProgression[i]?.stats || 0);
    }
    
    // Calculate how many level stat points have been spent
    // Total stats above base (36 = 6 stats * 6 base) minus creation points spent
    const totalStatsSpent = Object.values(trainer.stats).reduce((sum, val) => sum + val, 0) - 36;
    const creationPointsSpent = 30 - trainer.statPoints;
    const levelPointsSpent = Math.max(0, totalStatsSpent - creationPointsSpent);
    
    // Check if we can level down - do we have enough unspent level points?
    if (levelPointsSpent > totalLevelStatsAtNewLevel) {
        const pointsToRefund = levelPointsSpent - totalLevelStatsAtNewLevel;
        alert(`Cannot level down! You have spent ${levelPointsSpent} level stat points, but level ${newLevel} only provides ${totalLevelStatsAtNewLevel}.\n\nPlease reduce your stats by ${pointsToRefund} point(s) first.`);
        return;
    }
    
    // Calculate new available level stat points
    const newLevelStatPoints = totalLevelStatsAtNewLevel - levelPointsSpent;
    
    // Handle feat points - need to account for features AND additional classes
    let totalFeatsAtNewLevel = 0;
    for (let i = 1; i <= newLevel; i++) {
        totalFeatsAtNewLevel += (GAME_DATA.trainerLevelProgression[i]?.feats || 0);
    }
    
    // Count features that cost points (non-free and non-base features)
    const featuresWithCost = (trainer.features || []).filter(f => {
        const featureName = typeof f === 'object' ? f.name : f;
        const featureData = GAME_DATA.features[featureName];
        return featureData && featureData.category !== 'General (Free)' && !featureData.isBase;
    }).length;
    
    // Count classes that cost points (all except the first one)
    const classesWithCost = Math.max(0, (trainer.classes || []).length - 1);
    
    // Total feat points spent
    const totalFeatPointsSpent = featuresWithCost + classesWithCost;
    
    // Check max classes allowed at new level
    const maxClassesAtNewLevel = newLevel >= 24 ? 4 : newLevel >= 12 ? 3 : newLevel >= 5 ? 2 : 1;
    const currentClassCount = (trainer.classes || []).length;
    
    if (currentClassCount > maxClassesAtNewLevel) {
        const classesToRemove = currentClassCount - maxClassesAtNewLevel;
        alert(`Cannot level down! You have ${currentClassCount} classes, but level ${newLevel} only allows ${maxClassesAtNewLevel}.\n\nPlease remove ${classesToRemove} class(es) first.`);
        return;
    }
    
    if (totalFeatPointsSpent > totalFeatsAtNewLevel) {
        const pointsToFree = totalFeatPointsSpent - totalFeatsAtNewLevel;
        alert(`Cannot level down! You have spent ${totalFeatPointsSpent} feat points (${featuresWithCost} features + ${classesWithCost} additional classes), but level ${newLevel} only provides ${totalFeatsAtNewLevel} feat points.\n\nPlease remove ${pointsToFree} feature(s) or class(es) first.`);
        return;
    }
    
    const newFeatPoints = totalFeatsAtNewLevel - totalFeatPointsSpent;
    
    setTrainer(prev => ({
        ...prev,
        level: newLevel,
        levelStatPoints: newLevelStatPoints,
        featPoints: newFeatPoints
    }));
};

/** Respec trainer - reset to level 0 for character recreation while keeping Pokémon */
const respecTrainer = () => {
    const confirmed = confirm(
        '⚠️ RESPEC TRAINER ⚠️\n\n' +
        'This will reset your trainer to Level 0 for character recreation:\n\n' +
        '• Stats reset to base (6 in each)\n' +
        '• All classes removed\n' +
        '• All features removed\n' +
        '• All skills removed\n' +
        '• 30 creation stat points restored\n' +
        '• 4 feat points restored (Level 1)\n\n' +
        '✓ Your Pokémon will be KEPT!\n' +
        '✓ Your trainer name and notes will be KEPT!\n\n' +
        'Are you sure you want to respec?'
    );
    
    if (!confirmed) return;
    
    // Double confirm for safety
    const doubleConfirm = confirm('Are you REALLY sure? This cannot be undone!');
    if (!doubleConfirm) return;
    
    setTrainer(prev => ({
        ...prev,
        level: 0,
        stats: { hp: 6, atk: 6, def: 6, satk: 6, sdef: 6, spd: 6 },
        statPoints: 30,
        levelStatPoints: 0,
        featPoints: 0, // Will get 1 at level 1 + base class features
        classes: [],
        features: [],
        skills: [],
        edges: prev.edges || [], // Keep edges if any
        currentHP: 24 + 0 // Base HP at level 0 with 6 HP stat
    }));
    
    alert('Trainer has been reset to Level 0!\n\nYou can now rebuild your character. Remember to level up to 1 and pick your first class to get your base features!');
};

// Import Pokemon (from trade/gift)
const importPokemon = (pokemonData, toParty = false) => {
    // Ensure the imported Pokemon has a unique ID
    const importedPokemon = {
        ...pokemonData,
        id: Date.now() + Math.random()
    };

    // Add to party if requested and there's room, otherwise add to reserve
    if (toParty && party.length < 6) {
        setParty(prev => [...prev, importedPokemon]);
    } else {
        setReserve(prev => [...prev, importedPokemon]);
        // Switch to reserve view if we added there and we tried to add to party
        if (toParty && party.length >= 6) {
            setPokemonView('reserve');
        }
    }
};

// Add new Pokemon
const addPokemon = () => {
    const newPokemon = {
        id: Date.now(),
        name: 'New Pokémon',
        species: '',
        gender: '',
        avatar: '',
        level: 1,
        exp: 0,
        highestLevelReached: 1, // Tracks highest level to prevent stat point exploits
        types: [],
        nature: 'Hardy',
        ability: '',
        baseStats: {
            hp: 10,
            atk: 10,
            def: 10,
            satk: 10,
            sdef: 10,
            spd: 10
        },
        addedStats: {
            hp: 0,
            atk: 0,
            def: 0,
            satk: 0,
            sdef: 0,
            spd: 0
        },
        statAllocationHistory: [], // Tracks order of stat allocations for removal on level down
        moves: [],
        skills: [],
        notes: '',
        loyalty: 2,
        statPointsAvailable: 0
    };
    
    // Add to party if there's room and we're viewing party, otherwise add to reserve
    if (pokemonView === 'party' && party.length < 6) {
        setParty(prev => [...prev, newPokemon]);
    } else {
        setReserve(prev => [...prev, newPokemon]);
        // Switch to reserve view if we added there
        if (pokemonView === 'party') {
            setPokemonView('reserve');
        }
    }
    setEditingPokemon(newPokemon.id);
};

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

// Process pending move learns one at a time
useEffect(() => {
    if (pendingMoveLearn.length > 0 && !showMoveLearnModal) {
        const nextMove = pendingMoveLearn[0];
        
        // Fetch fresh pokemon data to get current moves
        const freshPokemon = nextMove.inParty 
            ? party.find(p => p.id === nextMove.pokemonId)
            : reserve.find(p => p.id === nextMove.pokemonId);
        
        if (freshPokemon) {
            const freshMoves = freshPokemon.moves || [];
            const naturalMoves = freshMoves.filter(m => m.source === 'natural');
            const alreadyKnows = freshMoves.some(m => 
                m.name.toLowerCase() === nextMove.newMove.move.toLowerCase()
            );
            
            if (alreadyKnows) {
                // Already knows this move, skip to next
                setPendingMoveLearn(prev => prev.slice(1));
            } else if (naturalMoves.length < 4) {
                // Has room now, learn directly and move to next
                learnMove(nextMove.pokemonId, nextMove.newMove, null, nextMove.inParty);
                setPendingMoveLearn(prev => prev.slice(1));
            } else {
                // Still needs to replace, show modal with fresh moves
                setMoveLearnData({
                    ...nextMove,
                    currentMoves: freshMoves,
                    pokemonName: freshPokemon.name
                });
                setShowMoveLearnModal(true);
                setPendingMoveLearn(prev => prev.slice(1));
            }
        } else {
            // Pokemon not found, skip
            setPendingMoveLearn(prev => prev.slice(1));
        }
    }
}, [pendingMoveLearn, showMoveLearnModal, party, reserve]);

// Function to handle learning a new move (called after modal confirmation or auto-learn)
const learnMove = (pokemonId, newMove, replaceIndex = null, inParty = true) => {
    const updateFn = (prev) => prev.map(p => {
        if (p.id !== pokemonId) return p;

        // Check for duplicate move (unless we're replacing at the same index)
        const moveName = newMove.move || newMove.name;
        const alreadyKnows = p.moves.some((m, idx) =>
            m.name?.toLowerCase() === moveName?.toLowerCase() &&
            (replaceIndex === null || idx !== replaceIndex)
        );

        if (alreadyKnows) {
            // Pokemon already knows this move, skip
            console.log(`${p.name || p.species} already knows ${moveName}, skipping`);
            return p;
        }

        const moveData = GAME_DATA.moves[moveName] || {};
        const newMoveObj = {
            name: moveName,
            type: moveData.type || newMove.type || 'Normal',
            category: moveData.category || 'Physical',
            frequency: moveData.frequency || 'At-Will',
            damage: moveData.damage || '',
            range: moveData.range || 'Melee',
            effect: moveData.effect || '',
            source: 'natural',
            learnedAtLevel: newMove.level
        };

        let newMoves;
        let newMoveHistory = [...(p.moveHistory || [])];

        if (replaceIndex !== null && replaceIndex >= 0) {
            // Replace existing move - save the replaced move to history
            const replacedMove = p.moves[replaceIndex];
            if (replacedMove) {
                newMoveHistory.push({
                    ...replacedMove,
                    replacedAtLevel: newMove.level,
                    slotIndex: replaceIndex
                });
            }
            newMoves = [...p.moves];
            newMoves[replaceIndex] = newMoveObj;
        } else {
            // Add new move
            newMoves = [...p.moves, newMoveObj];
        }

        return { ...p, moves: newMoves, moveHistory: newMoveHistory };
    });

    if (inParty) {
        setParty(updateFn);
    } else {
        setReserve(updateFn);
    }
};

// Function to forget moves when leveling down - restores previously forgotten moves
const forgetMovesAboveLevel = (pokemonId, newLevel, inParty = true) => {
    const updateFn = (prev) => prev.map(p => {
        if (p.id !== pokemonId) return p;

        let newMoves = [...p.moves];
        let newMoveHistory = [...(p.moveHistory || [])];

        // Find moves that need to be forgotten (learned above new level)
        const movesToForget = p.moves.filter(move =>
            move.source === 'natural' &&
            move.learnedAtLevel &&
            move.learnedAtLevel > newLevel
        );

        // For each move being forgotten, try to restore the previous move from history
        movesToForget.forEach(moveToForget => {
            const moveIndex = newMoves.findIndex(m => m.name === moveToForget.name);
            if (moveIndex === -1) return;

            // Look for a move in history that was replaced at this level or higher
            // and was in this slot (or close to it)
            const historyIdx = newMoveHistory.findIndex(h =>
                h.replacedAtLevel >= moveToForget.learnedAtLevel
            );

            if (historyIdx !== -1) {
                // Restore the forgotten move
                const restoredMove = newMoveHistory[historyIdx];
                // Remove the learnedAtLevel tracking from restored move since it's being restored
                const { replacedAtLevel, slotIndex, ...moveToRestore } = restoredMove;
                newMoves[moveIndex] = moveToRestore;
                // Remove from history
                newMoveHistory.splice(historyIdx, 1);
            } else {
                // No history to restore, just remove the move
                newMoves.splice(moveIndex, 1);
            }
        });

        return { ...p, moves: newMoves, moveHistory: newMoveHistory };
    });

    if (inParty) {
        setParty(updateFn);
    } else {
        setReserve(updateFn);
    }
};

// Update Pokemon (works on both party and reserve)
const updatePokemon = (id, updates) => {
    // Check if pokemon is in party or reserve
    const inParty = party.some(p => p.id === id);
    const currentPokemon = inParty 
        ? party.find(p => p.id === id) 
        : reserve.find(p => p.id === id);
    
    const updateFn = (prev) => prev.map(p => {
        if (p.id !== id) return p;
        
        // Determine if we have a level change (either from exp or direct level update)
        let newLevel = p.level;
        let hasLevelChange = false;
        
        if (updates.exp !== undefined) {
            newLevel = calculatePokemonLevel(updates.exp);
            updates.level = newLevel;
            hasLevelChange = newLevel !== p.level;
        } else if (updates.level !== undefined && updates.level !== p.level) {
            newLevel = updates.level;
            hasLevelChange = true;
            // When level is changed directly, set exp to the minimum for that level
            updates.exp = GAME_DATA.pokemonExpChart[newLevel] || 0;
        }
        
        // Handle level changes (stat points)
        if (hasLevelChange) {
            const oldLevel = p.level;
            const highestLevelReached = p.highestLevelReached || oldLevel;
            
            // Calculate total stat points that SHOULD be available based on level progression
            const totalAddedStats = Object.values(p.addedStats || {}).reduce((sum, val) => sum + (val || 0), 0);
            
            if (newLevel > highestLevelReached) {
                // Going to a NEW highest level - grant new stat points
                const newPointsEarned = newLevel - highestLevelReached;
                updates.highestLevelReached = newLevel;
                updates.statPointsAvailable = (p.statPointsAvailable || 0) + newPointsEarned;
                
                setLevelUpNotification({
                    type: 'pokemon',
                    name: p.name,
                    level: newLevel,
                    statPoints: newPointsEarned
                });
                
                setTimeout(() => setLevelUpNotification(null), 5000);
            } else if (newLevel < oldLevel) {
                // Going DOWN in level - remove allocated stats if necessary
                // Stat points earned = level - 1 (start at level 1 with 0 points)
                const maxPossiblePoints = Math.max(0, newLevel - 1);
                
                // If we have more allocated stats than we should at this level, remove them
                if (totalAddedStats > maxPossiblePoints) {
                    const pointsToRemove = totalAddedStats - maxPossiblePoints;
                    const history = [...(p.statAllocationHistory || [])];
                    const newAddedStats = { ...p.addedStats };
                    
                    // Remove the most recently allocated points
                    for (let i = 0; i < pointsToRemove && history.length > 0; i++) {
                        const lastStat = history.pop();
                        if (lastStat && newAddedStats[lastStat] > 0) {
                            newAddedStats[lastStat]--;
                        }
                    }
                    
                    updates.addedStats = newAddedStats;
                    updates.statAllocationHistory = history;
                    updates.statPointsAvailable = 0;
                    updates.highestLevelReached = newLevel; // Reset highest level when stats are removed
                } else {
                    // No need to remove stats, just recalculate available
                    const newAvailable = Math.max(0, maxPossiblePoints - totalAddedStats);
                    updates.statPointsAvailable = newAvailable;
                }
            }
            // If going up but not past highestLevelReached, recalculate available
            else if (newLevel > oldLevel && newLevel <= highestLevelReached) {
                // Returning to a previously reached level - recalculate what should be available
                const maxPossiblePoints = Math.max(0, newLevel - 1);
                const currentAddedStats = Object.values(updates.addedStats || p.addedStats || {}).reduce((sum, val) => sum + (val || 0), 0);
                const newAvailable = Math.max(0, maxPossiblePoints - currentAddedStats);
                updates.statPointsAvailable = newAvailable;
            }
        }
        
        return { ...p, ...updates };
    });
    
    // Apply update to the correct array
    if (inParty) {
        setParty(updateFn);
    } else {
        setReserve(updateFn);
    }
    
    // Handle move learning/forgetting after state update
    // Trigger on either exp change OR direct level change
    const oldLevel = currentPokemon?.level;
    let newLevel = oldLevel;
    
    if (updates.exp !== undefined) {
        newLevel = calculatePokemonLevel(updates.exp);
    } else if (updates.level !== undefined) {
        newLevel = updates.level;
    }
    
    if (currentPokemon?.species && newLevel !== oldLevel) {
        // Process moves synchronously using current pokemon data
        // We use currentPokemon which was captured before state update
        const pokemonId = id;
        const pokemonName = currentPokemon.name;
        const pokemonInParty = inParty;
        const startingMoves = currentPokemon.moves || [];
        
        if (newLevel > oldLevel) {
            // Level UP - check for new moves to learn (pass full Pokemon for regional form support)
            const movesToLearn = getMovesForLevelRange(currentPokemon, oldLevel, newLevel);
            
            if (movesToLearn.length > 0) {
                const naturalMoves = startingMoves.filter(m => m.source === 'natural');
                let currentNaturalCount = naturalMoves.length;
                const movesToQueue = [];
                const movesToLearnDirectly = [];
                
                movesToLearn.forEach(newMove => {
                    // Check if pokemon already knows this move
                    const alreadyKnows = startingMoves.some(m => 
                        m.name.toLowerCase() === newMove.move.toLowerCase()
                    );
                    
                    if (!alreadyKnows) {
                        if (currentNaturalCount < 4) {
                            // Can learn directly
                            movesToLearnDirectly.push(newMove);
                            currentNaturalCount++;
                        } else {
                            // Need to ask user to replace a move
                            movesToQueue.push({
                                pokemonId: pokemonId,
                                pokemonName: pokemonName,
                                newMove: newMove,
                                currentMoves: startingMoves,
                                inParty: pokemonInParty,
                                needsReplacement: true
                            });
                        }
                    }
                });
                
                // Learn moves that fit directly (use setTimeout to ensure state is updated)
                if (movesToLearnDirectly.length > 0) {
                    setTimeout(() => {
                        movesToLearnDirectly.forEach(move => {
                            learnMove(pokemonId, move, null, pokemonInParty);
                        });
                    }, 10);
                }
                
                // Queue up moves that need replacement
                if (movesToQueue.length > 0) {
                    setTimeout(() => {
                        setPendingMoveLearn(prev => [...prev, ...movesToQueue]);
                    }, 20);
                }
            }
        } else {
            // Level DOWN - forget moves learned above new level
            setTimeout(() => {
                forgetMovesAboveLevel(pokemonId, newLevel, pokemonInParty);
            }, 10);
        }
    }
};

// Allocate stat point for Pokémon
const allocatePokemonStat = (pokemonId, stat) => {
    const inParty = party.some(p => p.id === pokemonId);
    const updateFn = (prev) => prev.map(p => {
        if (p.id !== pokemonId || !p.statPointsAvailable) return p;
        
        return {
            ...p,
            addedStats: {
                ...p.addedStats,
                [stat]: (p.addedStats[stat] || 0) + 1
            },
            statAllocationHistory: [...(p.statAllocationHistory || []), stat],
            statPointsAvailable: p.statPointsAvailable - 1
        };
    });
    
    if (inParty) {
        setParty(updateFn);
    } else {
        setReserve(updateFn);
    }
};

// Delete Pokemon
const deletePokemon = (id) => {
    if (confirm('Are you sure you want to release this Pokémon?')) {
        const inParty = party.some(p => p.id === id);
        if (inParty) {
            setParty(prev => prev.filter(p => p.id !== id));
        } else {
            setReserve(prev => prev.filter(p => p.id !== id));
        }
        setSelectedPokemon(null);
        setEditingPokemon(null);
    }
};

// Get filtered moves based on search query and filters
const getFilteredMoves = useMemo(() => {
    return Object.entries(GAME_DATA.moves || {})
        .filter(([moveName, moveData]) => {
            // Type filter
            if (moveTypeFilter !== 'all' && moveData.type !== moveTypeFilter) {
                return false;
            }
            // Category filter
            if (moveCategoryFilter !== 'all' && moveData.category !== moveCategoryFilter) {
                return false;
            }
            // Search query (name or type)
            if (moveSearchQuery) {
                const query = moveSearchQuery.toLowerCase();
                return moveName.toLowerCase().includes(query) || 
                       moveData.type.toLowerCase().includes(query) ||
                       (moveData.effect && moveData.effect.toLowerCase().includes(query));
            }
            return true;
        })
        .sort((a, b) => {
            // Sort by type first, then by name
            const typeCompare = a[1].type.localeCompare(b[1].type);
            return typeCompare !== 0 ? typeCompare : a[0].localeCompare(b[0]);
        });
}, [moveSearchQuery, moveTypeFilter, moveCategoryFilter]);

// Get all unique types from moves
const allMoveTypes = useMemo(() => {
    const types = new Set(Object.values(GAME_DATA.moves).map(m => m.type));
    return Array.from(types).sort();
}, []);

// Calculate Pokemon max HP
const calculatePokemonHP = (pokemon) => {
    const actualStats = getActualStats(pokemon);
    return pokemon.level + (actualStats.hp * 3);
};

// Get actual stats (base + added + nature)
const getActualStats = (pokemon) => {
    const baseWithNature = applyNature(pokemon.baseStats, pokemon.nature);
    return {
        hp: baseWithNature.hp + (pokemon.addedStats?.hp || 0),
        atk: baseWithNature.atk + (pokemon.addedStats?.atk || 0),
        def: baseWithNature.def + (pokemon.addedStats?.def || 0),
        satk: baseWithNature.satk + (pokemon.addedStats?.satk || 0),
        sdef: baseWithNature.sdef + (pokemon.addedStats?.sdef || 0),
        spd: baseWithNature.spd + (pokemon.addedStats?.spd || 0)
    };
};

// Get evasion bonuses
const getEvasionBonuses = (pokemon) => {
    const actualStats = getActualStats(pokemon);
    return {
        physical: Math.floor(actualStats.def / 5),
        special: Math.floor(actualStats.sdef / 5),
        speed: Math.floor(actualStats.spd / 10)
    };
};

// Check if move gets STAB
const hasSTAB = (moveType, pokemonTypes) => {
    return pokemonTypes.includes(moveType);
};

return (
    <div className="container">
        {/* Save Indicator */}
        <div className={`save-indicator ${showSaveIndicator ? 'show' : ''}`}>
            Auto-saved
        </div>
        
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
        <Header
            trainers={trainers}
            trainer={trainer}
            activeTrainerId={activeTrainerId}
            setActiveTrainerId={(id) => {
                setActiveTrainerId(id);
                setEditingPokemon(null);
            }}
            addNewTrainer={addNewTrainer}
            deleteTrainer={deleteTrainer}
            duplicateTrainer={duplicateTrainer}
            exportSingleTrainer={exportSingleTrainer}
            exportAllData={exportAllData}
            onImport={importData}
            onExportCard={() => setShowCardModal(true)}
            theme={theme}
            setTheme={setTheme}
        />


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
            
                {/* ========== TRAINER TAB ========== */}
                {activeTab === 'trainer' && (
                    <TrainerTab
                        trainer={trainer}
                        setTrainer={setTrainer}
                        levelUpTrainer={levelUpTrainer}
                        levelDownTrainer={levelDownTrainer}
                        respecTrainer={respecTrainer}
                        updateTrainerStat={updateTrainerStat}
                        calculateMaxHP={calculateMaxHP}
                        calculateModifier={calculateModifier}
                        GAME_DATA={GAME_DATA}
                        showDetail={showDetail}
                    />
                )}


                {/* ========== POKEMON TEAM TAB ========== */}
                {activeTab === 'pokemon' && (
                    <PokemonTab
                        party={party}
                        reserve={reserve}
                        pokemonView={pokemonView}
                        setPokemonView={setPokemonView}
                        editingPokemonId={editingPokemon}
                        setEditingPokemonId={setEditingPokemon}
                        addPokemon={addPokemon}
                        updatePokemon={updatePokemon}
                        deletePokemon={deletePokemon}
                        moveToParty={moveToParty}
                        moveToReserve={moveToReserve}
                        movePokemonUp={movePokemonUp}
                        movePokemonDown={movePokemonDown}
                        sortPokemonList={sortPokemonList}
                        pokedex={pokedex}
                        GAME_DATA={GAME_DATA}
                        showDetail={showDetail}
                        getEvolutionOptions={getEvolutionOptions}
                        evolvePokemon={handleEvolution}
                        devolvePokemon={handleDevolution}
                        importPokemon={importPokemon}
                        customSpecies={customSpecies}
                        setCustomSpecies={setCustomSpecies}
                        setShowCustomSpeciesModal={setShowCustomSpeciesModal}
                        setEditingCustomSpeciesId={setEditingCustomSpeciesId}
                    />
                )}


                {/* ========== INVENTORY TAB ========== */}
                {activeTab === 'inventory' && (
                    <InventoryTab inventory={inventory} setInventory={setInventory} />
                )}


                {/* ========== DICE ROLLER TAB ========== */}
                {activeTab === 'battle' && (
                    <BattleTab
                        trainer={trainer}
                        party={party}
                        discordWebhook={discordWebhook}
                        setDiscordWebhook={setDiscordWebhook}
                        sendToDiscord={sendToDiscord}
                        updatePokemon={updatePokemon}
                        showDetail={showDetail}
                        pokedex={pokedex}
                    />
                )}


                {/* ========== QUICK REFERENCE TAB ========== */}
                {activeTab === 'reference' && (
                    <ReferenceTab showDetail={showDetail} />
                )}


                {/* ========== CAMPAIGN NOTES TAB ========== */}
                {activeTab === 'notes' && (
                    <NotesTab trainer={trainer} setTrainer={setTrainer} />
                )}
            </div>
        </div>
        
        {/* ========== MODALS ========== */}
        <CustomFeatureModal
            showCustomFeatureModal={showCustomFeatureModal}
            setShowCustomFeatureModal={setShowCustomFeatureModal}
            customFeature={customFeature}
            setCustomFeature={setCustomFeature}
            setTrainer={setTrainer}
        />

        <CustomMoveModal
            showCustomMoveModal={showCustomMoveModal}
            setShowCustomMoveModal={setShowCustomMoveModal}
            customMove={customMove}
            setCustomMove={setCustomMove}
            customMoveForPokemon={customMoveForPokemon}
            pokemon={pokemon}
            updatePokemon={updatePokemon}
        />

        <CustomSpeciesModal
            showCustomSpeciesModal={showCustomSpeciesModal}
            setShowCustomSpeciesModal={setShowCustomSpeciesModal}
            customSpecies={customSpecies}
            setCustomSpecies={setCustomSpecies}
            editingCustomSpeciesId={editingCustomSpeciesId}
            setEditingCustomSpeciesId={setEditingCustomSpeciesId}
        />

        <MoveLearnModal
            showMoveLearnModal={showMoveLearnModal}
            setShowMoveLearnModal={setShowMoveLearnModal}
            moveLearnData={moveLearnData}
            setMoveLearnData={setMoveLearnData}
            learnMove={learnMove}
            showDetail={showDetail}
            GAME_DATA={GAME_DATA}
        />

        <RegionalFormModal
            showRegionalFormModal={showRegionalFormModal}
            setShowRegionalFormModal={setShowRegionalFormModal}
            regionalFormData={regionalFormData}
            setRegionalFormData={setRegionalFormData}
            handleRegionalFormSelect={handleRegionalFormSelect}
        />

        <CardExportModal
            showCardModal={showCardModal}
            setShowCardModal={setShowCardModal}
            cardType={cardType}
            setCardType={setCardType}
            selectedCardPokemon={selectedCardPokemon}
            setSelectedCardPokemon={setSelectedCardPokemon}
            trainer={trainer}
            party={party}
            pokemon={pokemon}
            exportTrainerText={exportTrainerText}
            exportTeamText={exportTeamText}
            exportPokemonText={exportPokemonText}
        />

        <SkillPickerModal
            skillPickerModal={skillPickerModal}
            setSkillPickerModal={setSkillPickerModal}
            setTrainer={setTrainer}
            GAME_DATA={GAME_DATA}
        />

        <DetailModal
            detailModal={detailModal}
            setDetailModal={setDetailModal}
        />


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
                            if (confirm('Clear cached Pokédex and game data, then reload from the server?\n\nThis is useful if the data has been updated online or if you are experiencing issues with moves, abilities, or Pokémon not appearing correctly.')) {
                                try {
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
);
};

// Export the main component
export default PTAManager;
