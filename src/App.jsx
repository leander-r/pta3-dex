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

const PTAManager = () => {
// ============================================================
// STATE DECLARATIONS
// ============================================================

// --- Navigation & UI State ---
const [activeTab, setActiveTab] = useState('trainer');
const [showSaveIndicator, setShowSaveIndicator] = useState(false);
const [levelUpNotification, setLevelUpNotification] = useState(null);
const [referenceTab, setReferenceTab] = useState('types');

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
const [showCharacterMenu, setShowCharacterMenu] = useState(false);

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

// Send roll result to Discord webhook
const sendToDiscord = async (roll) => {
    if (!discordWebhook.enabled || !discordWebhook.url) return;
    
    try {
        // Build the embed based on roll type
        let embed = {
            timestamp: new Date().toISOString(),
            footer: { text: `${trainer.name || 'Trainer'} • PTA Manager` }
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
            embed.fields = [
                { name: '📊 Damage Roll', value: `**${roll.total}** damage`, inline: true },
                { name: '🎯 Accuracy', value: roll.isCrit ? `**${roll.accRoll}** - CRITICAL HIT! 💥` : `**${roll.accRoll}**`, inline: true },
                { name: '🎲 Dice', value: `${roll.dice} → [${roll.rolls.join(', ')}] = ${roll.diceTotal}`, inline: false }
            ];
            
            let breakdown = [];
            if (roll.statBonus) breakdown.push(`+${roll.statBonus} stat`);
            if (roll.stabBonus) breakdown.push(`+${roll.stabBonus} STAB`);
            if (breakdown.length > 0) {
                embed.fields.push({ name: '📈 Bonuses', value: breakdown.join(', '), inline: true });
            }
            
            embed.fields.push({ name: '⚔️ Type', value: `${roll.moveType} (${roll.category})`, inline: true });
            
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
};

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

// Handle species selection from Pokédex
// Handle species selection - regular function to ensure updatePokemon is accessible
const handleSpeciesSelect = (speciesName, pokemonId) => {
    const speciesData = pokedex.find(p => p.species === speciesName);
    if (!speciesData) return;
    
    const updates = {
        species: speciesData.species,
        types: [...speciesData.types],
        baseStats: { ...speciesData.baseStats },
        // Store available abilities for reference
        availableAbilities: speciesData.abilities ? { ...speciesData.abilities } : null,
        // Store Pokédex reference data
        pokedexId: speciesData.id
    };
    
    // Set abilities using the correct field names (ability, ability2, ability3)
    if (speciesData.abilities) {
        const allAbilities = [
            ...(speciesData.abilities.basic || []),
            ...(speciesData.abilities.adv || []),
            ...(speciesData.abilities.high || [])
        ];
        
        // Set first basic ability as default
        if (speciesData.abilities.basic && speciesData.abilities.basic.length > 0) {
            updates.ability = speciesData.abilities.basic[0];
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
            ['overland', 'Overland'], 
            ['surface', 'Surface'], 
            ['sky', 'Sky'],
            ['burrow', 'Burrow'], 
            ['jump', 'Jump'], 
            ['power', 'Power'],
            ['intelligence', 'Intelligence']
        ];
        
        skillMappings.forEach(([key, name]) => {
            if (speciesData.skills[key] !== undefined && speciesData.skills[key] !== null) {
                pokemonSkills.push({ name, value: speciesData.skills[key] });
            }
        });
        
        // Capability skills (boolean flags)
        const capabilities = [
            'phasing', 'invisibility', 'zapper', 'firestarter', 
            'gilled', 'tracker', 'threaded', 'Pokemon education',
            'mindlock', 'telepath', 'telekinetic', 'aura reader'
        ];
        capabilities.forEach(cap => {
            if (speciesData.skills[cap]) {
                pokemonSkills.push({ name: cap.charAt(0).toUpperCase() + cap.slice(1) });
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
    
    // Call updatePokemon (defined later in component, but accessible due to JS hoisting behavior with function scope)
    updatePokemon(pokemonId, updates);
    setSpeciesSearch('');
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
            lastSaved: new Date().toISOString(),
            version: '2.0' // Multi-trainer version
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
        
        return {
            trainers: [trainerData],
            activeTrainerId: trainerData.id,
            inventory: loadedData.inventory || []
        };
    }
    
    // Multi-trainer format - migrate each trainer's pokemon to party/reserve
    if (loadedData.trainers) {
        return {
            ...loadedData,
            trainers: loadedData.trainers.map(t => migratePokemonToPartyReserve(t))
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
    if (trainer.skills.length > 0) {
        text += `**Skills:** ${trainer.skills.join(', ')}\n`;
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
            
            // Check if it's multi-trainer format (v2.0+)
            if (data.trainers) {
                // Ensure all trainers have proper structure
                const migratedTrainers = data.trainers.map(t => ({
                    ...t,
                    money: t.money || 0,
                    party: t.party || t.pokemon?.slice(0, 6) || [],
                    reserve: t.reserve || t.pokemon?.slice(6) || []
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
                
                // Ensure proper structure with money, party, reserve
                trainerData = {
                    ...trainerData,
                    id: trainerData.id || Date.now(),
                    money: trainerData.money || 0,
                    // Handle party/reserve - prefer explicit fields, fall back to pokemon array or separate data
                    party: trainerData.party || data.pokemon?.slice(0, 6) || trainerData.pokemon?.slice(0, 6) || [],
                    reserve: trainerData.reserve || data.pokemon?.slice(6) || trainerData.pokemon?.slice(6) || []
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
    return (trainer.stats.hp * 4) + (trainer.level * 4);
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

// Update Pokemon (works on both party and reserve)
const updatePokemon = (id, updates) => {
    // Check if pokemon is in party or reserve
    const inParty = party.some(p => p.id === id);
    const updateFn = (prev) => prev.map(p => {
        if (p.id !== id) return p;
        
        // Handle experience updates
        if (updates.exp !== undefined) {
            const newLevel = calculatePokemonLevel(updates.exp);
            const oldLevel = p.level;
            const highestLevelReached = p.highestLevelReached || oldLevel;
            
            updates.level = newLevel;
            
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

// Type effectiveness chart
const typeChart = {
    'Normal': { weak: ['Fighting'], resist: [], immune: ['Ghost'] },
    'Fire': { weak: ['Water', 'Ground', 'Rock'], resist: ['Fire', 'Grass', 'Ice', 'Bug', 'Steel', 'Fairy'], immune: [] },
    'Water': { weak: ['Electric', 'Grass'], resist: ['Fire', 'Water', 'Ice', 'Steel'], immune: [] },
    'Electric': { weak: ['Ground'], resist: ['Electric', 'Flying', 'Steel'], immune: [] },
    'Grass': { weak: ['Fire', 'Ice', 'Poison', 'Flying', 'Bug'], resist: ['Water', 'Electric', 'Grass', 'Ground'], immune: [] },
    'Ice': { weak: ['Fire', 'Fighting', 'Rock', 'Steel'], resist: ['Ice'], immune: [] },
    'Fighting': { weak: ['Flying', 'Psychic', 'Fairy'], resist: ['Bug', 'Rock', 'Dark'], immune: [] },
    'Poison': { weak: ['Ground', 'Psychic'], resist: ['Grass', 'Fighting', 'Poison', 'Bug', 'Fairy'], immune: [] },
    'Ground': { weak: ['Water', 'Grass', 'Ice'], resist: ['Poison', 'Rock'], immune: ['Electric'] },
    'Flying': { weak: ['Electric', 'Ice', 'Rock'], resist: ['Grass', 'Fighting', 'Bug'], immune: ['Ground'] },
    'Psychic': { weak: ['Bug', 'Ghost', 'Dark'], resist: ['Fighting', 'Psychic'], immune: [] },
    'Bug': { weak: ['Fire', 'Flying', 'Rock'], resist: ['Grass', 'Fighting', 'Ground'], immune: [] },
    'Rock': { weak: ['Water', 'Grass', 'Fighting', 'Ground', 'Steel'], resist: ['Normal', 'Fire', 'Poison', 'Flying'], immune: [] },
    'Ghost': { weak: ['Ghost', 'Dark'], resist: ['Poison', 'Bug'], immune: ['Normal', 'Fighting'] },
    'Dragon': { weak: ['Ice', 'Dragon', 'Fairy'], resist: ['Fire', 'Water', 'Electric', 'Grass'], immune: [] },
    'Dark': { weak: ['Fighting', 'Bug', 'Fairy'], resist: ['Ghost', 'Dark'], immune: ['Psychic'] },
    'Steel': { weak: ['Fire', 'Fighting', 'Ground'], resist: ['Normal', 'Grass', 'Ice', 'Flying', 'Psychic', 'Bug', 'Rock', 'Dragon', 'Steel', 'Fairy'], immune: ['Poison'] },
    'Fairy': { weak: ['Poison', 'Steel'], resist: ['Fighting', 'Bug', 'Dark'], immune: ['Dragon'] }
};

return (
    <div className="container">
        {/* Save Indicator */}
        <div className={`save-indicator ${showSaveIndicator ? 'show' : ''}`}>
            ✓ Auto-saved
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
        <div className="header">
            <h1>P:TA Character Manager</h1>
            
            {/* Trainer Selector, Money & Menu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <select 
                    value={activeTrainerId || ''} 
                    onChange={(e) => {
                        setActiveTrainerId(parseInt(e.target.value));
                        setEditingPokemon(null);
                    }}
                    style={{ 
                        padding: '10px 12px', 
                        borderRadius: '12px', 
                        border: 'none',
                        minWidth: '120px',
                        maxWidth: '200px',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        flex: '1 1 auto'
                    }}
                >
                    {trainers.map(t => {
                        const partyCount = (t.party || []).length;
                        const reserveCount = (t.reserve || []).length;
                        const totalCount = partyCount + reserveCount;
                        return (
                                <option key={t.id} value={t.id}>
                                    {t.name || 'Unnamed'} (Lv.{t.level}) - {totalCount} Pokémon
                                </option>
                            );
                        })}
                </select>
                <div className="money-display" style={{ whiteSpace: 'nowrap' }}>
                    ₽{(trainer.money || 0).toLocaleString()}
                </div>
                
                {/* Character Menu Button */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowCharacterMenu(!showCharacterMenu)}
                        style={{
                            background: showCharacterMenu ? 'linear-gradient(135deg, #e8941c, #d4820f)' : 'linear-gradient(135deg, #f5a623, #e8941c)',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '10px 16px',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 8px rgba(245, 166, 35, 0.3)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <span>⚙️</span>
                        <span>Menu</span>
                        <span style={{ 
                            fontSize: '10px', 
                            transform: showCharacterMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease'
                        }}>▼</span>
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showCharacterMenu && (
                        <>
                            {/* Backdrop to close menu when clicking outside */}
                            <div 
                                onClick={() => setShowCharacterMenu(false)}
                                style={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    zIndex: 999
                                }}
                            />
                            <div style={{
                                position: 'absolute',
                                top: 'calc(100% + 8px)',
                                right: 0,
                                background: 'white',
                                borderRadius: '16px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)',
                                minWidth: '320px',
                                zIndex: 1000,
                                overflow: 'hidden',
                                border: '1px solid rgba(245, 166, 35, 0.2)'
                            }}>
                                {/* Menu Header */}
                                <div style={{
                                    background: 'linear-gradient(135deg, #f5a623, #e8941c)',
                                    padding: '14px 18px',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '15px',
                                    borderBottom: '1px solid rgba(0,0,0,0.1)'
                                }}>
                                    Character & Data Options
                                </div>
                                
                                {/* Character Management Section */}
                                <div style={{ padding: '8px 0' }}>
                                    <div style={{ 
                                        padding: '6px 18px', 
                                        fontSize: '11px', 
                                        fontWeight: '600', 
                                        color: '#888', 
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Character Management
                                    </div>
                                    
                                    <button
                                        onClick={() => {
                                            addNewTrainer();
                                            setShowCharacterMenu(false);
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '12px 18px',
                                            background: 'transparent',
                                            border: 'none',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '12px',
                                            transition: 'background 0.15s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <span style={{ fontSize: '20px' }}>➕</span>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>New Character</div>
                                            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>Create a fresh trainer from scratch</div>
                                        </div>
                                    </button>
                                    
                                    <button
                                        onClick={() => {
                                            duplicateTrainer(activeTrainerId);
                                            setShowCharacterMenu(false);
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '12px 18px',
                                            background: 'transparent',
                                            border: 'none',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '12px',
                                            transition: 'background 0.15s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <span style={{ fontSize: '20px' }}>📋</span>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>Duplicate Character</div>
                                            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>Copy current trainer as a new character</div>
                                        </div>
                                    </button>
                                    
                                    {trainers.length > 1 && (
                                        <button
                                            onClick={() => {
                                                deleteTrainer(activeTrainerId);
                                                setShowCharacterMenu(false);
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '12px 18px',
                                                background: 'transparent',
                                                border: 'none',
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: '12px',
                                                transition: 'background 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#ffebee'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <span style={{ fontSize: '20px' }}>🗑️</span>
                                            <div>
                                                <div style={{ fontWeight: '600', color: '#e53935', fontSize: '14px' }}>Delete Character</div>
                                                <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>Permanently remove current trainer</div>
                                            </div>
                                        </button>
                                    )}
                                </div>
                                
                                {/* Divider */}
                                <div style={{ height: '1px', background: '#eee', margin: '0 18px' }} />
                                
                                {/* Export Section */}
                                <div style={{ padding: '8px 0' }}>
                                    <div style={{ 
                                        padding: '6px 18px', 
                                        fontSize: '11px', 
                                        fontWeight: '600', 
                                        color: '#888', 
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Share & Export
                                    </div>
                                    
                                    <button
                                        onClick={() => {
                                            setShowCardModal(true);
                                            setShowCharacterMenu(false);
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '12px 18px',
                                            background: 'transparent',
                                            border: 'none',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '12px',
                                            transition: 'background 0.15s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <span style={{ fontSize: '20px' }}>📇</span>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>Generate Card Image</div>
                                            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>Create a shareable character or Pokémon card</div>
                                        </div>
                                    </button>
                                    
                                    <button
                                        onClick={() => {
                                            exportSingleTrainer(trainer);
                                            setShowCharacterMenu(false);
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '12px 18px',
                                            background: 'transparent',
                                            border: 'none',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '12px',
                                            transition: 'background 0.15s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <span style={{ fontSize: '20px' }}>💾</span>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>Export This Character</div>
                                            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>Download current trainer as a JSON file</div>
                                        </div>
                                    </button>
                                    
                                    <button
                                        onClick={() => {
                                            exportAllData();
                                            setShowCharacterMenu(false);
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '12px 18px',
                                            background: 'transparent',
                                            border: 'none',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '12px',
                                            transition: 'background 0.15s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <span style={{ fontSize: '20px' }}>📦</span>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>Export All Characters</div>
                                            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>Backup all trainers to a single file</div>
                                        </div>
                                    </button>
                                </div>
                                
                                {/* Divider */}
                                <div style={{ height: '1px', background: '#eee', margin: '0 18px' }} />
                                
                                {/* Import Section */}
                                <div style={{ padding: '8px 0 12px 0' }}>
                                    <div style={{ 
                                        padding: '6px 18px', 
                                        fontSize: '11px', 
                                        fontWeight: '600', 
                                        color: '#888', 
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Import
                                    </div>
                                    
                                    <button
                                        onClick={() => {
                                            document.getElementById('importDataInput').click();
                                            setShowCharacterMenu(false);
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '12px 18px',
                                            background: 'transparent',
                                            border: 'none',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '12px',
                                            transition: 'background 0.15s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <span style={{ fontSize: '20px' }}>📂</span>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>Import from File</div>
                                            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>Load characters from a previously saved JSON file</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
        
        {/* Hidden file input for import */}
        <input
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            id="importDataInput"
            onChange={(e) => {
                if (e.target.files[0]) {
                    importData(e.target.files[0]);
                    e.target.value = '';
                }
            }}
        />
        
        {/* Main Content */}
        <div className="main-content">
            {/* Sidebar Navigation */}
            <div className="sidebar">
                <button
                    className={`nav-button ${activeTab === 'trainer' ? 'active' : ''}`}
                    onClick={() => setActiveTab('trainer')}
                >
                    👤 Trainer
                </button>
                <button
                    className={`nav-button ${activeTab === 'pokemon' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pokemon')}
                >
                    🎮 Pokémon Team
                </button>
                <button
                    className={`nav-button ${activeTab === 'inventory' ? 'active' : ''}`}
                    onClick={() => setActiveTab('inventory')}
                >
                    🎒 Inventory
                </button>
                <button
                    className={`nav-button ${activeTab === 'battle' ? 'active' : ''}`}
                    onClick={() => setActiveTab('battle')}
                >
                    🎲 Dice Roller
                </button>
                <button
                    className={`nav-button ${activeTab === 'reference' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reference')}
                >
                    📚 Quick Reference
                </button>
                <button
                    className={`nav-button ${activeTab === 'notes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('notes')}
                >
                    📝 Campaign Notes
                </button>
            </div>
            
            {/* ============================================== */}
            {/* MAIN CONTENT AREA                             */}
            {/* ============================================== */}
            <div className="content-area">
            
                {/* ========== TRAINER TAB ========== */}
                {activeTab === 'trainer' && (
                    <div>
                        <h2 className="section-title">Trainer</h2>
                        
                        {/* Top Section: Profile + Stats side by side */}
                        <div className="grid-responsive-2 mb-lg">
                            
                            {/* Left Column: Profile */}
                            <div className="section-card-purple">
                                <h3 className="section-title-purple">
                                    <span>👤</span> Profile
                                </h3>
                                
                                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                                    {/* Avatar */}
                                    <div style={{ flexShrink: 0 }}>
                                        {trainer.avatar ? (
                                            <img 
                                                src={trainer.avatar} 
                                                alt="Avatar"
                                                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #667eea' }}
                                            />
                                        ) : (
                                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: 'white' }}>
                                                👤
                                            </div>
                                        )}
                                        <div style={{ textAlign: 'center', marginTop: '5px' }}>
                                            <input type="file" accept="image/*" style={{ display: 'none' }} id="trainerAvatarInput"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onload = (event) => {
                                                            const img = new Image();
                                                            img.onload = () => {
                                                                const canvas = document.createElement('canvas');
                                                                const maxSize = 150;
                                                                let width = img.width, height = img.height;
                                                                if (width > height) { if (width > maxSize) { height *= maxSize / width; width = maxSize; } }
                                                                else { if (height > maxSize) { width *= maxSize / height; height = maxSize; } }
                                                                canvas.width = width; canvas.height = height;
                                                                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                                                                setTrainer(prev => ({ ...prev, avatar: canvas.toDataURL('image/jpeg', 0.8) }));
                                                            };
                                                            img.src = event.target.result;
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                            <button className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '10px' }} onClick={() => document.getElementById('trainerAvatarInput').click()}>
                                                Change
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Name, Gender, Age */}
                                    <div style={{ flex: 1 }}>
                                        <div className="form-group" className="mb-10">
                                            <input type="text" value={trainer.name} onChange={(e) => setTrainer(prev => ({ ...prev, name: e.target.value }))} placeholder="Trainer Name..." style={{ fontSize: '18px', fontWeight: 'bold' }} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                                    <input type="radio" name="trainerGender" checked={trainer.gender === 'male'} onChange={() => setTrainer(prev => ({ ...prev, gender: 'male' }))} />
                                                    <span style={{ color: '#2196f3' }}>♂</span>
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                                    <input type="radio" name="trainerGender" checked={trainer.gender === 'female'} onChange={() => setTrainer(prev => ({ ...prev, gender: 'female' }))} />
                                                    <span style={{ color: '#e91e63' }}>♀</span>
                                                </label>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <span style={{ fontSize: '12px', color: '#666' }}>Age:</span>
                                                <input 
                                                    type="number" 
                                                    value={trainer.age || ''} 
                                                    onChange={(e) => setTrainer(prev => ({ ...prev, age: e.target.value }))}
                                                    placeholder="—"
                                                    min="1"
                                                    max="999"
                                                    style={{ 
                                                        width: '55px', 
                                                        padding: '4px 6px', 
                                                        border: '1px solid #ddd', 
                                                        borderRadius: '6px', 
                                                        fontSize: '14px',
                                                        textAlign: 'center'
                                                    }} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Level with +/- buttons */}
                                <div className="level-controls">
                                    <button 
                                        className="level-btn" 
                                        onClick={levelDownTrainer} 
                                        disabled={trainer.level <= 1}
                                    >−</button>
                                    <div className="text-center">
                                        <div style={{ fontSize: '12px', opacity: 0.8 }}>LEVEL</div>
                                        <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{trainer.level}</div>
                                    </div>
                                    {(() => {
                                        // Check if level 0 requirements are met
                                        const isLevel0 = trainer.level === 0;
                                        const creationPointsRemaining = trainer.statPoints || 0;
                                        const hasClass = (trainer.classes || []).length > 0;
                                        const canLevelUp = !isLevel0 || (creationPointsRemaining === 0 && hasClass);
                                        
                                        return (
                                            <button 
                                                className="level-btn" 
                                                onClick={levelUpTrainer}
                                                disabled={!canLevelUp}
                                                style={!canLevelUp ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                                title={!canLevelUp ? `Complete character creation first:\n• Spend all Creation points (${creationPointsRemaining} left)\n• Pick your first class` : 'Level up trainer'}
                                            >+</button>
                                        );
                                    })()}
                                </div>
                                
                                {/* Level 0 Requirements Checklist */}
                                {trainer.level === 0 && (
                                    <div style={{
                                        marginTop: '10px',
                                        padding: '10px',
                                        background: 'linear-gradient(135deg, #fff3e0, #ffe0b2)',
                                        borderRadius: '8px',
                                        border: '1px solid #ffcc80',
                                        fontSize: '11px'
                                    }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#e65100' }}>
                                            📋 Character Creation Checklist
                                        </div>
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '6px',
                                            marginBottom: '4px',
                                            color: (trainer.statPoints || 0) === 0 ? '#2e7d32' : '#c62828'
                                        }}>
                                            <span>{(trainer.statPoints || 0) === 0 ? '✓' : '○'}</span>
                                            <span>Spend all 30 Creation points ({30 - (trainer.statPoints || 0)}/30)</span>
                                        </div>
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '6px',
                                            color: (trainer.classes || []).length > 0 ? '#2e7d32' : '#c62828'
                                        }}>
                                            <span>{(trainer.classes || []).length > 0 ? '✓' : '○'}</span>
                                            <span>Pick your first class</span>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Respec Button */}
                                <button 
                                    onClick={respecTrainer}
                                    style={{ 
                                        width: '100%', 
                                        marginTop: '10px',
                                        padding: '8px', 
                                        fontSize: '11px', 
                                        background: 'linear-gradient(135deg, #ff9800, #f57c00)', 
                                        border: 'none', 
                                        borderRadius: '6px', 
                                        color: 'white', 
                                        cursor: 'pointer',
                                        fontWeight: '500'
                                    }}
                                    title="Reset trainer to Level 0 for character recreation (keeps Pokémon)"
                                >
                                    🔄 Respec Trainer
                                </button>
                                
                                {/* Quick Stats Display */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '15px' }}>
                                    <div style={{ textAlign: 'center', padding: '10px', background: '#fff', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '10px', color: '#666' }}>MAX HP</div>
                                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e53935' }}>{calculateMaxHP()}</div>
                                    </div>
                                    <div style={{ textAlign: 'center', padding: '10px', background: '#fff', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '10px', color: '#666' }}>FEAT PTS</div>
                                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: trainer.featPoints > 0 ? '#4caf50' : '#999' }}>{trainer.featPoints || 0}</div>
                                    </div>
                                </div>
                                
                                {/* Money Input */}
                                <div style={{ marginTop: '15px', padding: '12px', background: 'linear-gradient(135deg, #ffd700, #ffb300)', borderRadius: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: 'bold', color: '#5d4e00', fontSize: '12px' }}>💰 MONEY</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ fontWeight: 'bold', color: '#5d4e00', fontSize: '18px' }}>₽</span>
                                            <input 
                                                type="number" 
                                                value={trainer.money || 0} 
                                                onChange={(e) => setTrainer(prev => ({ ...prev, money: parseInt(e.target.value) || 0 }))}
                                                style={{ 
                                                    width: '100px', 
                                                    padding: '5px 8px', 
                                                    border: '2px solid #c9a800', 
                                                    borderRadius: '6px', 
                                                    fontSize: '16px', 
                                                    fontWeight: 'bold',
                                                    textAlign: 'right',
                                                    background: 'rgba(255,255,255,0.9)'
                                                }} 
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Badges Section */}
                                <div style={{ marginTop: '15px', padding: '12px', background: 'linear-gradient(135deg, #e8eaf6, #c5cae9)', borderRadius: '10px', border: '1px solid #9fa8da' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <span style={{ fontWeight: 'bold', color: '#303f9f', fontSize: '12px' }}>🏅 BADGES ({(trainer.badges || []).length})</span>
                                        <button
                                            onClick={() => {
                                                const badgeName = prompt('Enter badge name:');
                                                if (badgeName && badgeName.trim()) {
                                                    setTrainer(prev => ({
                                                        ...prev,
                                                        badges: [...(prev.badges || []), { 
                                                            name: badgeName.trim(), 
                                                            id: Date.now(),
                                                            earnedAt: new Date().toISOString()
                                                        }]
                                                    }));
                                                }
                                            }}
                                            style={{
                                                padding: '4px 10px',
                                                fontSize: '11px',
                                                background: 'linear-gradient(135deg, #5c6bc0, #3f51b5)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            + Add Badge
                                        </button>
                                    </div>
                                    
                                    {(trainer.badges || []).length > 0 ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {(trainer.badges || []).map((badge, index) => {
                                                const badgeName = typeof badge === 'string' ? badge : badge.name;
                                                const badgeId = typeof badge === 'string' ? index : badge.id;
                                                return (
                                                    <div 
                                                        key={badgeId}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            padding: '4px 8px',
                                                            background: 'linear-gradient(135deg, #ffd54f, #ffb300)',
                                                            borderRadius: '12px',
                                                            fontSize: '11px',
                                                            fontWeight: 'bold',
                                                            color: '#5d4e00',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                                                            border: '1px solid #ffc107'
                                                        }}
                                                    >
                                                        <span>🏅</span>
                                                        <span>{badgeName}</span>
                                                        <button
                                                            onClick={() => {
                                                                if (confirm(`Remove "${badgeName}" badge?`)) {
                                                                    setTrainer(prev => ({
                                                                        ...prev,
                                                                        badges: (prev.badges || []).filter((b, i) => {
                                                                            if (typeof b === 'string') return i !== index;
                                                                            return b.id !== badgeId;
                                                                        })
                                                                    }));
                                                                }
                                                            }}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                padding: '0 2px',
                                                                fontSize: '10px',
                                                                color: '#8d6e00',
                                                                opacity: 0.7
                                                            }}
                                                            title="Remove badge"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div style={{ 
                                            textAlign: 'center', 
                                            padding: '10px', 
                                            color: '#5c6bc0', 
                                            fontSize: '11px',
                                            fontStyle: 'italic',
                                            background: 'rgba(255,255,255,0.5)',
                                            borderRadius: '6px'
                                        }}>
                                            No badges earned yet
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Right Column: Stats */}
                            <div className="section-card-purple">
                                <h3 className="section-title-purple">
                                    <span>📊</span> Stats
                                    <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 'normal', color: '#666' }}>
                                        Creation: {trainer.statPoints} | Level: {trainer.levelStatPoints || 0}
                                    </span>
                                </h3>
                                
                                <div className="grid-responsive-3 trainer-stats-grid">
                                    {[
                                        { key: 'hp', label: 'HP', color: '#e53935' },
                                        { key: 'atk', label: 'ATK', color: '#ff5722' },
                                        { key: 'def', label: 'DEF', color: '#2196f3' },
                                        { key: 'satk', label: 'SATK', color: '#9c27b0' },
                                        { key: 'sdef', label: 'SDEF', color: '#ff9800' },
                                        { key: 'spd', label: 'SPD', color: '#00bcd4' }
                                    ].map(stat => {
                                        const mod = calculateModifier(trainer.stats[stat.key]);
                                        return (
                                            <div key={stat.key} style={{ background: '#fff', borderRadius: '8px', padding: '10px', textAlign: 'center', border: `2px solid ${stat.color}20` }}>
                                                <div style={{ fontSize: '11px', fontWeight: 'bold', color: stat.color, marginBottom: '5px' }}>{stat.label}</div>
                                                <input type="number" value={trainer.stats[stat.key]} onChange={(e) => updateTrainerStat(stat.key, e.target.value)} min="6" style={{ width: '60px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold', border: '1px solid #ddd', borderRadius: '6px', padding: '5px' }} />
                                                <div style={{ fontSize: '12px', color: mod >= 0 ? '#4caf50' : '#f44336', fontWeight: 'bold', marginTop: '3px' }}>
                                                    {mod >= 0 ? '+' : ''}{mod}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {/* Evasion Display */}
                                <div className="grid-responsive-3" style={{ marginTop: '15px' }}>
                                    <div style={{ textAlign: 'center', padding: '8px', background: '#e3f2fd', borderRadius: '6px' }}>
                                        <div style={{ fontSize: '10px', color: '#1565c0' }}>Phys Eva</div>
                                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1565c0' }}>+{Math.floor(trainer.stats.def / 5)}</div>
                                    </div>
                                    <div style={{ textAlign: 'center', padding: '8px', background: '#fff3e0', borderRadius: '6px' }}>
                                        <div style={{ fontSize: '10px', color: '#e65100' }}>Spec Eva</div>
                                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#e65100' }}>+{Math.floor(trainer.stats.sdef / 5)}</div>
                                    </div>
                                    <div style={{ textAlign: 'center', padding: '8px', background: '#e0f7fa', borderRadius: '6px' }}>
                                        <div style={{ fontSize: '10px', color: '#00838f' }}>Spd Eva</div>
                                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#00838f' }}>+{Math.min(6, Math.max(0, calculateModifier(trainer.stats.spd)))}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Classes Section */}
                        <div className="section-card-purple" style={{ marginBottom: '20px' }}>
                            <h3 className="section-title-purple">
                                <span>🎓</span> Classes
                                <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 'normal', color: '#666' }}>
                                    {(trainer.classes || []).length === 0 ? 'First class grants +2 feat points!' : `${(trainer.classes || []).length}/${trainer.level < 5 ? 1 : trainer.level < 12 ? 2 : trainer.level < 24 ? 3 : 4} classes`}
                                </span>
                            </h3>
                            
                            {/* Current Classes */}
                            {(trainer.classes || []).length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
                                    {(trainer.classes || []).map((cls, index) => (
                                        <div key={index} style={{ 
                                            display: 'flex', alignItems: 'center', gap: '8px', 
                                            padding: '8px 12px', background: 'linear-gradient(135deg, #667eea, #764ba2)', 
                                            borderRadius: '20px', color: 'white' 
                                        }}>
                                            <span className="font-bold">{cls}</span>
                                            {GAME_DATA.trainerClasses[cls] && (
                                                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>
                                                    {GAME_DATA.trainerClasses[cls].type === 'base' ? 'Base' : 'Adv'}
                                                </span>
                                            )}
                                            <button onClick={() => {
                                                const classData = GAME_DATA.trainerClasses[cls];
                                                const isBaseClass = classData?.type === 'base';
                                                const currentClasses = trainer.classes || [];
                                                const isFirstClass = currentClasses.indexOf(cls) === 0 && currentClasses.length > 0;
                                                
                                                // Find base features for this class that should be removed
                                                const baseFeaturesToRemove = isBaseClass ? Object.entries(GAME_DATA.features || {})
                                                    .filter(([_, f]) => f.category === cls && f.isBase)
                                                    .map(([name, _]) => name) : [];
                                                
                                                // Get skills that were granted by this class
                                                const classSkillsToRemove = (trainer.classSkills || {})[cls] || [];
                                                
                                                // Calculate feat point adjustment
                                                // First class is free, additional classes cost 1 point
                                                let featPointRefund = 0;
                                                if (!isFirstClass && currentClasses.length > 1) {
                                                    featPointRefund = 1; // Refund the point spent on this class
                                                }
                                                
                                                setTrainer(prev => {
                                                    // Remove skills granted by this class
                                                    let updatedSkills = [...(prev.skills || [])];
                                                    classSkillsToRemove.forEach(skillToRemove => {
                                                        const idx = updatedSkills.indexOf(skillToRemove);
                                                        if (idx !== -1) {
                                                            updatedSkills.splice(idx, 1);
                                                        }
                                                    });
                                                    
                                                    // Remove class from classSkills tracking
                                                    const newClassSkills = { ...(prev.classSkills || {}) };
                                                    delete newClassSkills[cls];
                                                    
                                                    return {
                                                        ...prev,
                                                        classes: (prev.classes || []).filter(c => c !== cls),
                                                        features: (prev.features || []).filter(f => !baseFeaturesToRemove.includes(f)),
                                                        skills: updatedSkills,
                                                        classSkills: newClassSkills,
                                                        featPoints: (prev.featPoints || 0) + featPointRefund
                                                    };
                                                });
                                                
                                                console.log(`Removed ${cls}:`, {
                                                    features: baseFeaturesToRemove,
                                                    skills: classSkillsToRemove
                                                });
                                            }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '20px', height: '20px', color: 'white', cursor: 'pointer', fontSize: '12px' }}>×</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {/* Add Class */}
                            <div className="input-row input-row-purple">
                                <select id="classSelectCombined">
                                    <option value="">Add a class...</option>
                                    <optgroup label="━━ Base Classes ━━">
                                        {Object.entries(GAME_DATA.trainerClasses || {}).filter(([_, data]) => data.type === 'base').map(([cls, _]) => (
                                            <option key={cls} value={cls} disabled={(trainer.classes || []).includes(cls)}>{cls}</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="━━ Advanced Classes ━━">
                                        {Object.entries(GAME_DATA.trainerClasses || {}).filter(([_, data]) => data.type === 'advanced').map(([cls, _]) => (
                                            <option key={cls} value={cls} disabled={(trainer.classes || []).includes(cls)}>{cls}</option>
                                        ))}
                                    </optgroup>
                                </select>
                                <button className="btn btn-primary" onClick={() => {
                                    const select = document.getElementById('classSelectCombined');
                                    if (select.value) {
                                        const cls = select.value;
                                        const classData = GAME_DATA.trainerClasses[cls];
                                        const isBaseClass = classData?.type === 'base';
                                        const isFirstClass = (trainer.classes || []).length === 0;
                                        
                                        // Determine feat point cost
                                        let featPointChange = 0;
                                        if (isBaseClass && isFirstClass) {
                                            featPointChange = 0;
                                        } else {
                                            featPointChange = -1;
                                        }
                                        
                                        // Check if can afford
                                        if (featPointChange < 0 && (trainer.featPoints || 0) < Math.abs(featPointChange)) {
                                            alert('Not enough feat points!');
                                            return;
                                        }
                                        
                                        // Get skill pool for this class
                                        const skillPool = classData?.skillPool || [];
                                        const skillCount = classData?.skillCount || (isBaseClass ? 3 : 1);
                                        
                                        // Find base features for this class
                                        const baseFeatures = isBaseClass ? Object.entries(GAME_DATA.features || {})
                                            .filter(([_, f]) => f.category === cls && f.isBase)
                                            .map(([name, _]) => name)
                                            .slice(0, 2) : [];
                                        
                                        // If there are skills to pick, show the modal
                                        if (skillPool.length > 0) {
                                            setSkillPickerModal({
                                                show: true,
                                                className: cls,
                                                skillPool: skillPool,
                                                skillCount: skillCount,
                                                selectedSkills: [],
                                                pendingClassData: {
                                                    cls,
                                                    baseFeatures,
                                                    featPointChange,
                                                    isBaseClass
                                                }
                                            });
                                        } else {
                                            // No skills to pick, just add the class
                                            setTrainer(prev => {
                                                const existingFeatures = prev.features || [];
                                                const newFeatures = baseFeatures.filter(f => !existingFeatures.includes(f));
                                                
                                                return {
                                                    ...prev,
                                                    classes: [...(prev.classes || []), cls],
                                                    features: [...existingFeatures, ...newFeatures],
                                                    featPoints: (prev.featPoints || 0) + featPointChange,
                                                    classSkills: { ...(prev.classSkills || {}), [cls]: [] }
                                                };
                                            });
                                        }
                                        
                                        select.value = '';
                                    }
                                }}>
                                    + Add Class
                                </button>
                            </div>
                        </div>
                        
                        {/* Features & Skills Side by Side */}
                        <div className="grid-responsive-2">
                            
                            {/* Features */}
                            <div className="section-card-purple">
                                <h3 className="section-title-purple">
                                    <span>⚡</span> Features
                                    {(trainer.featPoints || 0) > 0 && (
                                        <span style={{ marginLeft: 'auto', background: '#4caf50', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '12px' }}>
                                            {trainer.featPoints} pts available
                                        </span>
                                    )}
                                </h3>
                                
                                {/* Add Feature */}
                                <div style={{ marginBottom: '15px' }}>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => {
                                            setShowFeaturePicker(!showFeaturePicker);
                                            setFeaturePickerSearch('');
                                            setFeaturePickerCategory('all');
                                        }}
                                        style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                                    >
                                        {showFeaturePicker ? '✕ Close Feature Picker' : '+ Add Feature'}
                                    </button>
                                    
                                    {showFeaturePicker && (
                                        <div style={{
                                            marginTop: '10px',
                                            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                                            borderRadius: '10px',
                                            padding: '12px',
                                            border: '2px solid #667eea',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                        }}>
                                            {/* Search Input */}
                                            <div style={{ position: 'relative', marginBottom: '10px' }}>
                                                <input
                                                    type="text"
                                                    placeholder="🔍 Search features by name or effect..."
                                                    value={featurePickerSearch}
                                                    onChange={(e) => setFeaturePickerSearch(e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px 30px 8px 10px',
                                                        borderRadius: '6px',
                                                        border: '2px solid #dee2e6',
                                                        fontSize: '12px'
                                                    }}
                                                />
                                                {featurePickerSearch && (
                                                    <button
                                                        onClick={() => setFeaturePickerSearch('')}
                                                        style={{
                                                            position: 'absolute',
                                                            right: '6px',
                                                            top: '50%',
                                                            transform: 'translateY(-50%)',
                                                            background: '#ccc',
                                                            border: 'none',
                                                            borderRadius: '50%',
                                                            width: '16px',
                                                            height: '16px',
                                                            cursor: 'pointer',
                                                            fontSize: '10px',
                                                            color: 'white',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >✕</button>
                                                )}
                                            </div>
                                            
                                            {/* Category Filter */}
                                            <div style={{ marginBottom: '10px' }}>
                                                <select
                                                    value={featurePickerCategory}
                                                    onChange={(e) => setFeaturePickerCategory(e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '6px 10px',
                                                        borderRadius: '6px',
                                                        border: '2px solid #dee2e6',
                                                        fontSize: '11px',
                                                        background: 'white'
                                                    }}
                                                >
                                                    <option value="all">📦 All Categories</option>
                                                    <option value="General (Free)">🆓 General (Free)</option>
                                                    <option value="General">📋 General</option>
                                                    <option value="Arms">⚔️ Arms</option>
                                                    {(() => {
                                                        const features = GAME_DATA.features || {};
                                                        const categories = [...new Set(Object.values(features).map(f => f.category))]
                                                            .filter(c => c && c !== 'General' && c !== 'General (Free)' && c !== 'Arms')
                                                            .sort();
                                                        return categories.map(cat => (
                                                            <option key={cat} value={cat}>{cat}</option>
                                                        ));
                                                    })()}
                                                </select>
                                            </div>
                                            
                                            {/* Quick Category Chips */}
                                            <div style={{ 
                                                display: 'flex', 
                                                flexWrap: 'wrap', 
                                                gap: '4px', 
                                                marginBottom: '10px',
                                                paddingBottom: '8px',
                                                borderBottom: '1px solid #dee2e6'
                                            }}>
                                                {[
                                                    { key: 'all', label: 'All', color: '#6c757d' },
                                                    { key: 'General (Free)', label: '🆓 Free', color: '#28a745' },
                                                    { key: 'General', label: '📋 Gen', color: '#17a2b8' },
                                                    { key: 'Arms', label: '⚔️ Arms', color: '#dc3545' }
                                                ].map(cat => (
                                                    <button
                                                        key={cat.key}
                                                        onClick={() => setFeaturePickerCategory(cat.key)}
                                                        style={{
                                                            padding: '2px 8px',
                                                            borderRadius: '12px',
                                                            border: featurePickerCategory === cat.key ? `2px solid ${cat.color}` : '2px solid transparent',
                                                            background: featurePickerCategory === cat.key ? cat.color : '#e9ecef',
                                                            color: featurePickerCategory === cat.key ? 'white' : '#495057',
                                                            fontSize: '10px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        {cat.label}
                                                    </button>
                                                ))}
                                            </div>
                                            
                                            {/* Hide owned toggle */}
                                            <div style={{ 
                                                marginBottom: '8px', 
                                                fontSize: '10px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={!featurePickerShowOwned}
                                                        onChange={(e) => setFeaturePickerShowOwned(!e.target.checked)}
                                                    />
                                                    Hide already owned
                                                </label>
                                                <span style={{ color: '#6c757d' }}>
                                                    Feat Points: <strong style={{ color: (trainer.featPoints || 0) > 0 ? '#28a745' : '#dc3545' }}>{trainer.featPoints || 0}</strong>
                                                </span>
                                            </div>
                                            
                                            {/* Feature List */}
                                            {(() => {
                                                const features = GAME_DATA.features || {};
                                                const ownedFeatures = (trainer.features || []).map(f => typeof f === 'object' ? f.name : f);
                                                
                                                const filteredFeatures = Object.entries(features)
                                                    .filter(([name, data]) => {
                                                        // Don't show base class features
                                                        if (data.isBase) return false;
                                                        
                                                        // Search filter
                                                        const matchesSearch = featurePickerSearch === '' || 
                                                            name.toLowerCase().includes(featurePickerSearch.toLowerCase()) ||
                                                            (data.effect && data.effect.toLowerCase().includes(featurePickerSearch.toLowerCase()));
                                                        
                                                        // Category filter
                                                        const matchesCategory = featurePickerCategory === 'all' || data.category === featurePickerCategory;
                                                        
                                                        // Owned filter
                                                        const matchesOwned = featurePickerShowOwned || !ownedFeatures.includes(name);
                                                        
                                                        return matchesSearch && matchesCategory && matchesOwned;
                                                    })
                                                    .sort(([a], [b]) => a.localeCompare(b));
                                                
                                                return (
                                                    <>
                                                        <div style={{ fontSize: '10px', color: '#6c757d', marginBottom: '6px' }}>
                                                            Showing {filteredFeatures.length} features
                                                            {featurePickerSearch && <> matching "<strong>{featurePickerSearch}</strong>"</>}
                                                        </div>
                                                        
                                                        <div style={{
                                                            maxHeight: '200px',
                                                            overflowY: 'auto',
                                                            border: '1px solid #dee2e6',
                                                            borderRadius: '6px',
                                                            background: 'white'
                                                        }}>
                                                            {filteredFeatures.length > 0 ? (
                                                                filteredFeatures.map(([name, data]) => {
                                                                    const isOwned = ownedFeatures.includes(name);
                                                                    const isFree = data.category === 'General (Free)';
                                                                    const canAfford = isFree || (trainer.featPoints || 0) > 0;
                                                                    
                                                                    // Category color coding
                                                                    let catColor = '#667eea';
                                                                    if (isFree) catColor = '#28a745';
                                                                    else if (data.category === 'Arms') catColor = '#dc3545';
                                                                    
                                                                    return (
                                                                        <div
                                                                            key={name}
                                                                            style={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                padding: '8px 10px',
                                                                                borderBottom: '1px solid #f0f0f0',
                                                                                borderLeft: `3px solid ${catColor}`,
                                                                                background: isOwned ? 'rgba(102, 126, 234, 0.08)' : 'transparent',
                                                                                opacity: (!canAfford && !isOwned) ? 0.5 : 1
                                                                            }}
                                                                        >
                                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                                <div style={{ 
                                                                                    fontWeight: '600', 
                                                                                    fontSize: '12px',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    gap: '6px',
                                                                                    flexWrap: 'wrap'
                                                                                }}>
                                                                                    {name}
                                                                                    {isFree && (
                                                                                        <span style={{
                                                                                            background: '#28a745',
                                                                                            color: 'white',
                                                                                            padding: '1px 5px',
                                                                                            borderRadius: '8px',
                                                                                            fontSize: '8px',
                                                                                            fontWeight: 'bold'
                                                                                        }}>FREE</span>
                                                                                    )}
                                                                                    {isOwned && (
                                                                                        <span style={{
                                                                                            background: '#667eea',
                                                                                            color: 'white',
                                                                                            padding: '1px 5px',
                                                                                            borderRadius: '8px',
                                                                                            fontSize: '8px',
                                                                                            fontWeight: 'bold'
                                                                                        }}>OWNED</span>
                                                                                    )}
                                                                                </div>
                                                                                <div style={{ fontSize: '9px', color: '#999' }}>{data.category}</div>
                                                                                <div style={{ 
                                                                                    fontSize: '10px', 
                                                                                    color: '#666',
                                                                                    whiteSpace: 'nowrap',
                                                                                    overflow: 'hidden',
                                                                                    textOverflow: 'ellipsis'
                                                                                }}>
                                                                                    {data.effect ? data.effect.substring(0, 80) + (data.effect.length > 80 ? '...' : '') : 'No description'}
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                                                                                <button
                                                                                    onClick={() => showDetail('feature', name, data)}
                                                                                    style={{
                                                                                        background: '#6c757d',
                                                                                        color: 'white',
                                                                                        border: 'none',
                                                                                        borderRadius: '4px',
                                                                                        padding: '4px 8px',
                                                                                        fontSize: '10px',
                                                                                        cursor: 'pointer'
                                                                                    }}
                                                                                    title="View details"
                                                                                >👁</button>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        if (isOwned) {
                                                                                            alert('You already have this feature!');
                                                                                            return;
                                                                                        }
                                                                                        if (!canAfford) {
                                                                                            alert('No feat points available!');
                                                                                            return;
                                                                                        }
                                                                                        setTrainer(prev => ({
                                                                                            ...prev,
                                                                                            features: [...prev.features, name],
                                                                                            featPoints: isFree ? prev.featPoints : (prev.featPoints || 0) - 1
                                                                                        }));
                                                                                    }}
                                                                                    disabled={isOwned || !canAfford}
                                                                                    style={{
                                                                                        background: isOwned ? '#ccc' : 'linear-gradient(135deg, #4caf50, #43a047)',
                                                                                        color: 'white',
                                                                                        border: 'none',
                                                                                        borderRadius: '4px',
                                                                                        padding: '4px 8px',
                                                                                        fontSize: '10px',
                                                                                        cursor: isOwned || !canAfford ? 'not-allowed' : 'pointer',
                                                                                        fontWeight: 'bold'
                                                                                    }}
                                                                                    title={isOwned ? 'Already owned' : isFree ? 'Add (Free)' : 'Add (1 feat point)'}
                                                                                >
                                                                                    {isOwned ? '✓' : '+'}
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })
                                                            ) : (
                                                                <div style={{ 
                                                                    padding: '20px', 
                                                                    textAlign: 'center', 
                                                                    color: '#6c757d',
                                                                    fontSize: '11px'
                                                                }}>
                                                                    <div>No features found</div>
                                                                    <button
                                                                        onClick={() => {
                                                                            setFeaturePickerSearch('');
                                                                            setFeaturePickerCategory('all');
                                                                            setFeaturePickerShowOwned(true);
                                                                        }}
                                                                        style={{
                                                                            marginTop: '8px',
                                                                            padding: '4px 12px',
                                                                            background: '#6c757d',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '4px',
                                                                            cursor: 'pointer',
                                                                            fontSize: '10px'
                                                                        }}
                                                                    >
                                                                        Clear Filters
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Feature List */}
                                <div className="scroll-container-sm">
                                    {trainer.features.length > 0 ? trainer.features.map((feature, idx) => {
                                        const isCustom = typeof feature === 'object';
                                        const fname = isCustom ? feature.name : feature;
                                        const fdata = isCustom ? feature : GAME_DATA.features[feature];
                                        const isBaseFeature = fdata?.isBase;
                                        const isFreeFeature = fdata?.category === 'General (Free)';
                                        
                                        // Determine border color based on category
                                        let borderColor = '#667eea'; // default purple
                                        if (isFreeFeature) borderColor = '#4caf50'; // green
                                        else if (fdata?.category === 'Arms') borderColor = '#f44336'; // red
                                        else if (isBaseFeature) borderColor = '#ff9800'; // orange for base class features
                                        
                                        return (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: '#fff', borderRadius: '6px', marginBottom: '6px', borderLeft: `3px solid ${borderColor}`, cursor: 'pointer' }} onClick={() => showDetail('feature', fname, fdata)}>
                                                <div>
                                                    <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                                                        {fname}
                                                        {isBaseFeature && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#ff9800', fontWeight: 'normal' }}>(Base)</span>}
                                                    </div>
                                                    <div style={{ fontSize: '10px', color: '#999' }}>{fdata?.category}</div>
                                                    {fdata?.effect && <div className="text-muted-sm">{fdata.effect.substring(0, 60)}...</div>}
                                                </div>
                                                <button onClick={(e) => {
                                                    e.stopPropagation();
                                                    const fd = GAME_DATA.features[feature];
                                                    const isFree = fd?.category === 'General (Free)';
                                                    const isBaseFeature = fd?.isBase;
                                                    // Don't refund points for free features or base class features
                                                    const refundPoints = !isFree && !isBaseFeature;
                                                    setTrainer(prev => ({ 
                                                        ...prev, 
                                                        features: prev.features.filter((_, i) => i !== idx), 
                                                        featPoints: refundPoints ? (prev.featPoints || 0) + 1 : prev.featPoints 
                                                    }));
                                                }} className="btn-delete-sm">×</button>
                                            </div>
                                        );
                                    }) : <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>No features yet</div>}
                                </div>
                            </div>
                            
                            {/* Skills */}
                            <div className="section-card-purple">
                                <h3 className="section-title-purple">
                                    <span>🎯</span> Skills
                                    <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 'normal', color: '#666' }}>
                                        +2 + stat mod if trained
                                    </span>
                                </h3>
                                
                                {/* Add Skill */}
                                <div className="input-row input-row-purple">
                                    <select id="skillSelectCombined">
                                        <option value="">Add skill...</option>
                                        <optgroup label="HP (Passive)">{Object.entries(GAME_DATA.skills || {}).filter(([_, d]) => d.stat === 'HP').map(([s, _]) => <option key={s} value={s}>{s}</option>)}</optgroup>
                                        <optgroup label="ATK">{Object.entries(GAME_DATA.skills || {}).filter(([_, d]) => d.stat === 'ATK').map(([s, _]) => <option key={s} value={s}>{s}</option>)}</optgroup>
                                        <optgroup label="DEF">{Object.entries(GAME_DATA.skills || {}).filter(([_, d]) => d.stat === 'DEF').map(([s, _]) => <option key={s} value={s}>{s}</option>)}</optgroup>
                                        <optgroup label="SATK">{Object.entries(GAME_DATA.skills || {}).filter(([_, d]) => d.stat === 'SATK').map(([s, _]) => <option key={s} value={s}>{s}</option>)}</optgroup>
                                        <optgroup label="SDEF">{Object.entries(GAME_DATA.skills || {}).filter(([_, d]) => d.stat === 'SDEF').map(([s, _]) => <option key={s} value={s}>{s}</option>)}</optgroup>
                                        <optgroup label="SPD">{Object.entries(GAME_DATA.skills || {}).filter(([_, d]) => d.stat === 'SPD').map(([s, _]) => <option key={s} value={s}>{s}</option>)}</optgroup>
                                    </select>
                                    <button className="btn-add" onClick={() => {
                                        const select = document.getElementById('skillSelectCombined');
                                        if (select.value) { setTrainer(prev => ({ ...prev, skills: [...prev.skills, select.value] })); select.value = ''; }
                                    }}>+</button>
                                </div>
                                
                                {/* Skill List */}
                                <div className="scroll-container-sm">
                                    {trainer.skills.length > 0 ? trainer.skills.map((skill, idx) => {
                                        const sd = GAME_DATA.skills[skill];
                                        
                                        const statModifiers = {
                                            HP: 0,
                                            ATK: calculateModifier(trainer.stats.atk),
                                            DEF: calculateModifier(trainer.stats.def),
                                            SATK: calculateModifier(trainer.stats.satk),
                                            SDEF: calculateModifier(trainer.stats.sdef),
                                            SPD: calculateModifier(trainer.stats.spd)
                                        };
                                        const smod = sd ? statModifiers[sd.stat] || 0 : 0;
                                        const cnt = trainer.skills.filter(s => s === skill).length;
                                        const bonus = sd && sd.stat !== 'HP' ? 2 * Math.min(cnt, 2) + smod : null;
                                        const borderColor = sd ? STAT_COLORS[sd.stat] : '#666';
                                        
                                        return (
                                            <div 
                                                key={idx} 
                                                className="list-item cursor-pointer"
                                                style={{ borderLeft: `3px solid ${borderColor}` }} 
                                                onClick={() => showDetail('skill', skill, sd)}
                                            >
                                                <div className="flex-center-gap">
                                                    <span className="font-bold text-13">{skill}</span>
                                                    {sd && <span style={{ background: STAT_COLORS[sd.stat], color: 'white', padding: '1px 5px', borderRadius: '4px', fontSize: '10px' }}>{sd.stat}</span>}
                                                    {bonus !== null && <span style={{ color: '#4caf50', fontWeight: 'bold', fontSize: '12px' }}>+{bonus}</span>}
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); setTrainer(prev => ({ ...prev, skills: prev.skills.filter((_, i) => i !== idx) })); }} className="btn-delete-sm">×</button>
                                            </div>
                                        );
                                    }) : <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>No skills yet</div>}
                                </div>
                            </div>
                        </div>
                        
                        {/* Export Card Button */}
                        <div style={{ marginTop: '20px', textAlign: 'center' }}>
                            <button className="btn btn-primary" onClick={() => { setCardType('trainer'); setShowCardModal(true); }} style={{ padding: '12px 30px' }}>
                                📇 Export Trainer Card
                            </button>
                        </div>
                    </div>
                )}
                
                {/* ========== POKEMON TEAM TAB ========== */}
                {activeTab === 'pokemon' && (
                    <div>
                        <h2 className="section-title">Pokémon Team</h2>
                        
                        {/* Party/Reserve Tabs */}
                        <div style={{ 
                            display: 'flex', 
                            gap: '0', 
                            marginBottom: '15px',
                            background: '#e0e0e0',
                            borderRadius: '10px',
                            padding: '4px',
                            width: 'fit-content'
                        }}>
                            <button
                                onClick={() => setPokemonView('party')}
                                style={{
                                    padding: '10px 20px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    background: pokemonView === 'party' ? '#667eea' : 'transparent',
                                    color: pokemonView === 'party' ? 'white' : '#333',
                                    transition: 'all 0.2s'
                                }}
                            >
                                🎒 Active Party ({party.length}/6)
                            </button>
                            <button
                                onClick={() => setPokemonView('reserve')}
                                style={{
                                    padding: '10px 20px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    background: pokemonView === 'reserve' ? '#667eea' : 'transparent',
                                    color: pokemonView === 'reserve' ? 'white' : '#333',
                                    transition: 'all 0.2s'
                                }}
                            >
                                📦 Reserve ({reserve.length})
                            </button>
                        </div>
                        
                        {/* Info box */}
                        <div style={{
                            background: pokemonView === 'party' ? '#e8f5e9' : '#fff3e0',
                            padding: '10px 15px',
                            borderRadius: '8px',
                            marginBottom: '15px',
                            fontSize: '13px',
                            color: pokemonView === 'party' ? '#2e7d32' : '#e65100'
                        }}>
                            {pokemonView === 'party' ? (
                                <>
                                    <strong>🎒 Active Party:</strong> These Pokémon travel with you and can be used in battle. Maximum 6.
                                    {party.length >= 6 && <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>Party is full!</span>}
                                </>
                            ) : (
                                <>
                                    <strong>📦 Reserve (PC Storage):</strong> Pokémon stored here are safe but not available for immediate battle. Unlimited storage.
                                </>
                            )}
                        </div>
                        
                        <button
                            className="btn btn-primary mb-15"
                            onClick={addPokemon}
                        >
                            + Add New Pokémon {pokemonView === 'party' && party.length >= 6 ? '(to Reserve)' : ''}
                        </button>
                        
                        <div className="pokemon-list">
                            {(() => {
                                const currentList = pokemonView === 'party' ? party : reserve;
                                return currentList.length > 0 ? (
                                currentList.map((poke, index) => {
                                    const actualStats = getActualStats(poke);
                                    const evasionBonuses = getEvasionBonuses(poke);
                                    const stabBonus = calculateSTAB(poke.level);
                                    const expToNext = getExpToNextLevel(poke.exp, poke.level);
                                    const expProgress = poke.level < 100 ? 
                                        ((poke.exp - GAME_DATA.pokemonExpChart[poke.level]) / 
                                        (GAME_DATA.pokemonExpChart[poke.level + 1] - GAME_DATA.pokemonExpChart[poke.level])) * 100 : 100;
                                    const isInParty = pokemonView === 'party';
                                    const isFirst = index === 0;
                                    const isLast = index === currentList.length - 1;
                                    const slotNumber = index + 1;
                                    
                                    return (
                                        <div key={poke.id} className="pokemon-card" style={{ position: 'relative' }}>
                                            {/* Slot indicator */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '-8px',
                                                left: '15px',
                                                background: isInParty ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'linear-gradient(135deg, #78909c, #546e7a)',
                                                color: 'white',
                                                padding: '2px 10px',
                                                borderRadius: '10px',
                                                fontSize: '11px',
                                                fontWeight: 'bold',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                            }}>
                                                {isInParty ? `Slot ${slotNumber}` : `#${slotNumber}`}
                                            </div>
                                            {editingPokemon === poke.id ? (
                                                // Edit Mode - Tabbed Interface
                                                <div>
                                                    {/* Header with Avatar, Name, Species - Always visible */}
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        gap: '15px', 
                                                        marginBottom: '15px',
                                                        paddingBottom: '15px',
                                                        borderBottom: '2px solid #e0e0e0'
                                                    }}>
                                                        {/* Avatar Section */}
                                                        <div className="text-center">
                                                            {poke.avatar ? (
                                                                <img 
                                                                    src={poke.avatar} 
                                                                    alt={poke.name}
                                                                    style={{ 
                                                                        width: '70px', 
                                                                        height: '70px', 
                                                                        borderRadius: '10px', 
                                                                        objectFit: 'cover',
                                                                        border: '2px solid #667eea'
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div style={{ 
                                                                    width: '70px', 
                                                                    height: '70px', 
                                                                    borderRadius: '10px', 
                                                                    background: '#e0e0e0',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    fontSize: '24px',
                                                                    color: '#999'
                                                                }}>
                                                                    🐾
                                                                </div>
                                                            )}
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                style={{ display: 'none' }}
                                                                id={`pokeAvatarInput-${poke.id}`}
                                                                onChange={(e) => {
                                                                    const file = e.target.files[0];
                                                                    if (file) {
                                                                        const reader = new FileReader();
                                                                        reader.onload = (event) => {
                                                                            const img = new Image();
                                                                            img.onload = () => {
                                                                                const canvas = document.createElement('canvas');
                                                                                const maxSize = 150;
                                                                                let width = img.width;
                                                                                let height = img.height;
                                                                                if (width > height) {
                                                                                    if (width > maxSize) {
                                                                                        height *= maxSize / width;
                                                                                        width = maxSize;
                                                                                    }
                                                                                } else {
                                                                                    if (height > maxSize) {
                                                                                        width *= maxSize / height;
                                                                                        height = maxSize;
                                                                                    }
                                                                                }
                                                                                canvas.width = width;
                                                                                canvas.height = height;
                                                                                const ctx = canvas.getContext('2d');
                                                                                ctx.drawImage(img, 0, 0, width, height);
                                                                                updatePokemon(poke.id, { avatar: canvas.toDataURL('image/jpeg', 0.8) });
                                                                            };
                                                                            img.src = event.target.result;
                                                                        };
                                                                        reader.readAsDataURL(file);
                                                                    }
                                                                }}
                                                            />
                                                            <div style={{ marginTop: '4px', display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                                <button 
                                                                    className="btn btn-secondary" 
                                                                    style={{ padding: '2px 6px', fontSize: '10px' }}
                                                                    onClick={() => document.getElementById(`pokeAvatarInput-${poke.id}`).click()}
                                                                >
                                                                    📷
                                                                </button>
                                                                {poke.avatar && (
                                                                    <button 
                                                                        className="btn btn-danger" 
                                                                        style={{ padding: '2px 6px', fontSize: '10px' }}
                                                                        onClick={() => updatePokemon(poke.id, { avatar: '' })}
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Quick Info */}
                                                        <div style={{ flex: 1 }}>
                                                            <input
                                                                type="text"
                                                                value={poke.name}
                                                                onChange={(e) => updatePokemon(poke.id, { name: e.target.value })}
                                                                placeholder="Nickname..."
                                                                style={{ 
                                                                    fontSize: '16px', 
                                                                    fontWeight: 'bold', 
                                                                    marginBottom: '6px',
                                                                    width: '100%',
                                                                    padding: '6px 10px',
                                                                    border: '2px solid #e0e0e0',
                                                                    borderRadius: '6px'
                                                                }}
                                                            />
                                                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                                                                <strong>{poke.species || 'Unknown'}</strong>
                                                                {poke.types.length > 0 && (
                                                                    <span style={{ marginLeft: '8px' }}>
                                                                        {poke.types.map(type => (
                                                                            <span key={type} className={`type-badge type-${type.toLowerCase()}`} style={{ fontSize: '10px', padding: '1px 6px', marginRight: '3px' }}>
                                                                                {type}
                                                                            </span>
                                                                        ))}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#888' }}>
                                                                <span>Lv. <strong style={{ color: '#667eea' }}>{poke.level}</strong></span>
                                                                <span>{poke.nature} Nature</span>
                                                                {poke.statPointsAvailable > 0 && (
                                                                    <span style={{ color: '#ff9800', fontWeight: 'bold' }}>
                                                                        ⚡ {poke.statPointsAvailable} pts
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Quick Actions */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            <button
                                                                className="btn btn-primary"
                                                                style={{ padding: '6px 12px', fontSize: '11px' }}
                                                                onClick={() => setEditingPokemon(null)}
                                                            >
                                                                ✓ Done
                                                            </button>
                                                            <button
                                                                className="btn btn-danger"
                                                                style={{ padding: '4px 8px', fontSize: '10px' }}
                                                                onClick={() => deletePokemon(poke.id)}
                                                            >
                                                                Release
                                                            </button>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Tab Navigation */}
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        gap: '4px', 
                                                        marginBottom: '15px',
                                                        borderBottom: '2px solid #e0e0e0',
                                                        paddingBottom: '10px',
                                                        flexWrap: 'wrap'
                                                    }}>
                                                        {[
                                                            { key: 'info', label: '📋 Info', icon: '📋' },
                                                            { key: 'stats', label: '📊 Stats', icon: '📊' },
                                                            { key: 'abilities', label: '✨ Abilities', icon: '✨' },
                                                            { key: 'moves', label: '⚔️ Moves', icon: '⚔️', count: poke.moves?.length }
                                                        ].map(tab => (
                                                            <button
                                                                key={tab.key}
                                                                onClick={() => setPokemonEditTab(prev => ({ ...prev, [poke.id]: tab.key }))}
                                                                style={{
                                                                    padding: '8px 14px',
                                                                    fontSize: '12px',
                                                                    fontWeight: (pokemonEditTab[poke.id] || 'info') === tab.key ? 'bold' : 'normal',
                                                                    background: (pokemonEditTab[poke.id] || 'info') === tab.key 
                                                                        ? 'linear-gradient(135deg, #667eea, #764ba2)' 
                                                                        : '#f0f0f0',
                                                                    color: (pokemonEditTab[poke.id] || 'info') === tab.key ? 'white' : '#666',
                                                                    border: 'none',
                                                                    borderRadius: '8px',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                {tab.label}
                                                                {tab.count !== undefined && (
                                                                    <span style={{ 
                                                                        marginLeft: '4px', 
                                                                        background: 'rgba(255,255,255,0.3)', 
                                                                        padding: '1px 5px', 
                                                                        borderRadius: '8px',
                                                                        fontSize: '10px'
                                                                    }}>
                                                                        {tab.count}
                                                                    </span>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    
                                                    {/* ========== INFO TAB ========== */}
                                                    {(pokemonEditTab[poke.id] || 'info') === 'info' && (
                                                        <div>
                                                            {/* Species Selector */}
                                                            <div className="form-group" style={{ marginBottom: '12px' }}>
                                                                <label style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '4px', display: 'block' }}>
                                                                    Species
                                                                    {pokedexLoading && <span style={{ fontSize: '10px', color: '#888', marginLeft: '8px' }}>⏳</span>}
                                                                    {!pokedexLoading && pokedex.length > 0 && (
                                                                        <span style={{ fontSize: '10px', color: '#4caf50', marginLeft: '8px' }}>📖 {pokedex.length}</span>
                                                                    )}
                                                                </label>
                                                                
                                                                {pokedex.length > 0 && (
                                                                    <input
                                                                        type="text"
                                                                        placeholder="🔍 Search Pokédex..."
                                                                        value={speciesSearch}
                                                                        onChange={(e) => setSpeciesSearch(e.target.value)}
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '6px 10px',
                                                                            marginBottom: '4px',
                                                                            border: '2px solid #e0e0e0',
                                                                            borderRadius: '6px',
                                                                            fontSize: '12px'
                                                                        }}
                                                                    />
                                                                )}
                                                                
                                                                {pokedex.length > 0 ? (
                                                                    <select
                                                                        value={poke.species || ''}
                                                                        onChange={(e) => {
                                                                            if (e.target.value) {
                                                                                handleSpeciesSelect(e.target.value, poke.id);
                                                                            }
                                                                        }}
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '8px',
                                                                            border: '2px solid #e0e0e0',
                                                                            borderRadius: '6px',
                                                                            fontSize: '12px'
                                                                        }}
                                                                    >
                                                                        <option value="">-- Select ({filteredSpecies.length}) --</option>
                                                                        {filteredSpecies.slice(0, 100).map(p => (
                                                                            <option key={p.id} value={p.species}>
                                                                                #{String(p.id).padStart(3, '0')} {p.species} [{p.types.join('/')}]
                                                                            </option>
                                                                        ))}
                                                                        {filteredSpecies.length > 100 && (
                                                                            <option disabled>... {filteredSpecies.length - 100} more</option>
                                                                        )}
                                                                    </select>
                                                                ) : (
                                                                    <input
                                                                        type="text"
                                                                        value={poke.species}
                                                                        onChange={(e) => updatePokemon(poke.id, { species: e.target.value })}
                                                                        placeholder="e.g., Pikachu..."
                                                                    />
                                                                )}
                                                            </div>
                                                            
                                                            {/* Level & EXP */}
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                                                                <div>
                                                                    <label style={{ fontWeight: 'bold', fontSize: '11px', display: 'block', marginBottom: '2px' }}>Level</label>
                                                                    <input
                                                                        type="number"
                                                                        value={poke.level}
                                                                        onChange={(e) => updatePokemon(poke.id, { level: parseInt(e.target.value) || 1 })}
                                                                        min="1"
                                                                        max="100"
                                                                        style={{ width: '100%', padding: '6px', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label style={{ fontWeight: 'bold', fontSize: '11px', display: 'block', marginBottom: '2px' }}>EXP</label>
                                                                    <input
                                                                        type="number"
                                                                        value={poke.exp}
                                                                        onChange={(e) => updatePokemon(poke.id, { exp: parseInt(e.target.value) || 0 })}
                                                                        min="0"
                                                                        style={{ width: '100%', padding: '6px', fontSize: '14px', textAlign: 'center' }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            
                                                            {/* EXP Progress Bar */}
                                                            <div style={{ marginBottom: '12px' }}>
                                                                <div className="exp-progress" style={{ height: '8px' }}>
                                                                    <div className="exp-progress-bar" style={{ width: `${expProgress}%` }}></div>
                                                                </div>
                                                                <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>
                                                                    {expToNext} EXP to level {Math.min(100, poke.level + 1)}
                                                                    {' • '}Stat points earned: {Math.max(0, poke.level - 1)}
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Types */}
                                                            <div className="form-group" style={{ marginBottom: '12px' }}>
                                                                <label style={{ fontWeight: 'bold', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Types</label>
                                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                                    <select
                                                                        value={poke.types[0] || ''}
                                                                        onChange={(e) => {
                                                                            const newTypes = [e.target.value];
                                                                            if (poke.types[1]) newTypes.push(poke.types[1]);
                                                                            updatePokemon(poke.id, { types: newTypes });
                                                                        }}
                                                                        style={{ flex: 1, padding: '6px', fontSize: '12px' }}
                                                                    >
                                                                        <option value="">Primary</option>
                                                                        {Object.keys(typeChart).map(type => (
                                                                            <option key={type} value={type}>{type}</option>
                                                                        ))}
                                                                    </select>
                                                                    <select
                                                                        value={poke.types[1] || ''}
                                                                        onChange={(e) => {
                                                                            const newTypes = [poke.types[0] || ''];
                                                                            if (e.target.value) newTypes.push(e.target.value);
                                                                            updatePokemon(poke.id, { types: newTypes });
                                                                        }}
                                                                        style={{ flex: 1, padding: '6px', fontSize: '12px' }}
                                                                    >
                                                                        <option value="">Secondary</option>
                                                                        {Object.keys(typeChart).map(type => (
                                                                            <option key={type} value={type}>{type}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Nature & Gender */}
                                                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '12px' }}>
                                                                <div>
                                                                    <label style={{ fontWeight: 'bold', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Nature</label>
                                                                    <select
                                                                        value={poke.nature}
                                                                        onChange={(e) => updatePokemon(poke.id, { nature: e.target.value })}
                                                                        style={{ width: '100%', padding: '6px', fontSize: '12px' }}
                                                                    >
                                                                        {Object.keys(GAME_DATA.natures).map(nature => (
                                                                            <option key={nature} value={nature}>{nature}</option>
                                                                        ))}
                                                                    </select>
                                                                    <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                                                                        {GAME_DATA.natures[poke.nature].description}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label style={{ fontWeight: 'bold', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Gender</label>
                                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                                        {['male', 'female', 'none'].map(g => (
                                                                            <button
                                                                                key={g}
                                                                                onClick={() => updatePokemon(poke.id, { gender: g })}
                                                                                style={{
                                                                                    flex: 1,
                                                                                    padding: '6px',
                                                                                    background: poke.gender === g ? (g === 'male' ? '#2196f3' : g === 'female' ? '#e91e63' : '#9e9e9e') : '#f0f0f0',
                                                                                    color: poke.gender === g ? 'white' : '#666',
                                                                                    border: 'none',
                                                                                    borderRadius: '4px',
                                                                                    cursor: 'pointer',
                                                                                    fontSize: '14px'
                                                                                }}
                                                                            >
                                                                                {g === 'male' ? '♂' : g === 'female' ? '♀' : '⚪'}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Held Item */}
                                                            <div className="form-group" style={{ marginBottom: '12px' }}>
                                                                <label style={{ fontWeight: 'bold', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Held Item</label>
                                                                <select
                                                                    value={poke.heldItem || ''}
                                                                    onChange={(e) => updatePokemon(poke.id, { heldItem: e.target.value })}
                                                                    style={{ width: '100%', padding: '6px', fontSize: '12px' }}
                                                                >
                                                                    <option value="">None</option>
                                                                    {Object.entries(GAME_DATA.items || {})
                                                                        .filter(([_, d]) => d.type === 'held')
                                                                        .sort(([a], [b]) => a.localeCompare(b))
                                                                        .map(([name]) => (
                                                                            <option key={name} value={name}>{name}</option>
                                                                        ))
                                                                    }
                                                                </select>
                                                            </div>
                                                            
                                                            {/* Type Effectiveness Summary */}
                                                            {poke.types.length > 0 && (
                                                                <div style={{ 
                                                                    background: '#f8f9fa', 
                                                                    padding: '10px', 
                                                                    borderRadius: '8px',
                                                                    fontSize: '11px'
                                                                }}>
                                                                    <strong style={{ display: 'block', marginBottom: '4px' }}>Type Matchups:</strong>
                                                                    {poke.types.map(type => (
                                                                        typeChart[type] && (
                                                                            <div key={type} style={{ marginBottom: '2px' }}>
                                                                                <span style={{ fontWeight: 'bold' }}>{type}:</span>
                                                                                {typeChart[type].weak.length > 0 && (
                                                                                    <span className="text-red"> Weak: {typeChart[type].weak.join(', ')}</span>
                                                                                )}
                                                                                {typeChart[type].resist.length > 0 && (
                                                                                    <span className="text-green"> | Resist: {typeChart[type].resist.join(', ')}</span>
                                                                                )}
                                                                                {typeChart[type].immune.length > 0 && (
                                                                                    <span style={{ color: '#2196f3' }}> | Immune: {typeChart[type].immune.join(', ')}</span>
                                                                                )}
                                                                            </div>
                                                                        )
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    {/* ========== STATS TAB ========== */}
                                                    {(pokemonEditTab[poke.id] || 'info') === 'stats' && (
                                                        <div>
                                                            {/* Base Stats */}
                                                            <div style={{ marginBottom: '15px' }}>
                                                                <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#667eea' }}>Base Stats</h4>
                                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                                                    {['hp', 'atk', 'def', 'satk', 'sdef', 'spd'].map(stat => (
                                                                        <div key={stat} className="stat-input" style={{ padding: '8px', background: '#f8f9fa', borderRadius: '6px' }}>
                                                                            <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                                {stat.toUpperCase()}
                                                                                {GAME_DATA.natures[poke.nature].buff === stat && <span className="text-green">↑</span>}
                                                                                {GAME_DATA.natures[poke.nature].nerf === stat && <span className="text-red">↓</span>}
                                                                            </label>
                                                                            <input
                                                                                type="number"
                                                                                value={poke.baseStats[stat]}
                                                                                onChange={(e) => updatePokemon(poke.id, { 
                                                                                    baseStats: { ...poke.baseStats, [stat]: parseInt(e.target.value) || 1 }
                                                                                })}
                                                                                min="1"
                                                                                style={{ width: '100%', padding: '4px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }}
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Stat Point Allocation */}
                                                            {poke.statPointsAvailable > 0 && (
                                                                <div style={{ 
                                                                    background: 'linear-gradient(135deg, #fff3cd, #ffe0b2)', 
                                                                    border: '2px solid #ffc107',
                                                                    borderRadius: '10px',
                                                                    padding: '12px',
                                                                    marginBottom: '15px'
                                                                }}>
                                                                    <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#856404' }}>
                                                                        ⚡ {poke.statPointsAvailable} Stat Points Available!
                                                                    </div>
                                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                                                                        {['hp', 'atk', 'def', 'satk', 'sdef', 'spd'].map(stat => (
                                                                            <button
                                                                                key={stat}
                                                                                className="btn btn-secondary"
                                                                                style={{ padding: '6px', fontSize: '11px' }}
                                                                                onClick={() => allocatePokemonStat(poke.id, stat)}
                                                                            >
                                                                                +1 {stat.toUpperCase()} ({poke.addedStats?.[stat] || 0})
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            
                                                            {/* Added Stats Summary */}
                                                            {Object.values(poke.addedStats || {}).reduce((sum, val) => sum + (val || 0), 0) > 0 && (
                                                                <div style={{ 
                                                                    background: '#e3f2fd', 
                                                                    padding: '10px',
                                                                    borderRadius: '8px',
                                                                    marginBottom: '15px',
                                                                    fontSize: '12px'
                                                                }}>
                                                                    <strong>Added from Leveling:</strong>{' '}
                                                                    {['hp', 'atk', 'def', 'satk', 'sdef', 'spd']
                                                                        .filter(stat => (poke.addedStats?.[stat] || 0) > 0)
                                                                        .map(stat => `${stat.toUpperCase()} +${poke.addedStats[stat]}`)
                                                                        .join(', ')}
                                                                </div>
                                                            )}
                                                            
                                                            {/* Actual Stats Display */}
                                                            <div style={{ marginBottom: '15px' }}>
                                                                <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#4caf50' }}>Final Stats (Base + Added + Nature)</h4>
                                                                <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                                                    <div className="stat-box" style={{ padding: '10px' }}>
                                                                        <label style={{ fontSize: '10px' }}>Max HP</label>
                                                                        <div className="value" style={{ fontSize: '18px' }}>{calculatePokemonHP(poke)}</div>
                                                                    </div>
                                                                    {['atk', 'def', 'satk', 'sdef', 'spd'].map(stat => (
                                                                        <div key={stat} className="stat-box" style={{ padding: '10px' }}>
                                                                            <label style={{ fontSize: '10px' }}>{stat.toUpperCase()}</label>
                                                                            <div className="value" style={{ fontSize: '18px' }}>{actualStats[stat]}</div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Combat Bonuses */}
                                                            <div>
                                                                <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#ff9800' }}>Combat Bonuses</h4>
                                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                                                    <div style={{ background: '#f8f9fa', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                                                                        <div style={{ fontSize: '10px', color: '#666' }}>Physical Evasion</div>
                                                                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>+{evasionBonuses.physical}</div>
                                                                    </div>
                                                                    <div style={{ background: '#f8f9fa', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                                                                        <div style={{ fontSize: '10px', color: '#666' }}>Special Evasion</div>
                                                                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>+{evasionBonuses.special}</div>
                                                                    </div>
                                                                    <div style={{ background: '#f8f9fa', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                                                                        <div style={{ fontSize: '10px', color: '#666' }}>Speed Evasion</div>
                                                                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>+{evasionBonuses.speed}</div>
                                                                    </div>
                                                                    <div style={{ background: '#f8f9fa', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                                                                        <div style={{ fontSize: '10px', color: '#666' }}>STAB Bonus</div>
                                                                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>+{stabBonus}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {/* ========== ABILITIES TAB ========== */}
                                                    {(pokemonEditTab[poke.id] || 'info') === 'abilities' && (
                                                        <div>
                                                            {/* Abilities */}
                                                            <div style={{ marginBottom: '15px' }}>
                                                                <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#9c27b0' }}>Abilities (up to 3)</h4>
                                                                {[1, 2, 3].map(num => {
                                                                    const abilityKey = num === 1 ? 'ability' : `ability${num}`;
                                                                    const abilityValue = poke[abilityKey];
                                                                    return (
                                                                        <div key={num} style={{ marginBottom: '8px' }}>
                                                                            <select
                                                                                value={abilityValue || ''}
                                                                                onChange={(e) => updatePokemon(poke.id, { [abilityKey]: e.target.value })}
                                                                                style={{ width: '100%', padding: '8px', fontSize: '12px', borderRadius: '6px', border: '2px solid #e0e0e0' }}
                                                                            >
                                                                                <option value="">Ability {num}...</option>
                                                                                {Object.keys(GAME_DATA.abilities || {}).sort().map(ability => (
                                                                                    <option key={ability} value={ability}>{ability}</option>
                                                                                ))}
                                                                            </select>
                                                                            {abilityValue && GAME_DATA.abilities[abilityValue] && (
                                                                                <div 
                                                                                    style={{ 
                                                                                        marginTop: '4px', 
                                                                                        fontSize: '11px', 
                                                                                        color: '#666', 
                                                                                        background: '#f5f5f5', 
                                                                                        padding: '6px 8px', 
                                                                                        borderRadius: '4px',
                                                                                        cursor: 'pointer'
                                                                                    }}
                                                                                    onClick={() => showDetail('ability', abilityValue, GAME_DATA.abilities[abilityValue])}
                                                                                >
                                                                                    {GAME_DATA.abilities[abilityValue].length > 100 
                                                                                        ? GAME_DATA.abilities[abilityValue].substring(0, 100) + '...' 
                                                                                        : GAME_DATA.abilities[abilityValue]}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                            
                                                            {/* Pokemon Skills */}
                                                            <div>
                                                                <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#2196f3' }}>
                                                                    Skills
                                                                    <span style={{ fontWeight: 'normal', fontSize: '11px', color: '#888', marginLeft: '8px' }}>
                                                                        ({(poke.pokemonSkills || []).length} active)
                                                                    </span>
                                                                </h4>
                                                                
                                                                {/* Current Skills */}
                                                                {(poke.pokemonSkills || []).length > 0 && (
                                                                    <div style={{ marginBottom: '10px', maxHeight: '150px', overflowY: 'auto' }}>
                                                                        {(poke.pokemonSkills || []).map((skill, idx) => {
                                                                            const skillData = GAME_DATA.pokemonSkills[skill.name];
                                                                            return (
                                                                                <div key={idx} style={{ 
                                                                                    display: 'flex', 
                                                                                    alignItems: 'center', 
                                                                                    gap: '6px', 
                                                                                    padding: '6px 8px',
                                                                                    background: skillData?.type === 'speed' ? '#e3f2fd' : '#f5f5f5',
                                                                                    borderRadius: '6px',
                                                                                    marginBottom: '4px',
                                                                                    borderLeft: `3px solid ${skillData?.type === 'speed' ? '#2196f3' : '#9e9e9e'}`,
                                                                                    fontSize: '12px'
                                                                                }}>
                                                                                    <div style={{ flex: 1 }}>
                                                                                        <strong>{skill.name}</strong>
                                                                                        {skillData?.tag && (
                                                                                            <span style={{ marginLeft: '4px', fontSize: '9px', background: '#667eea', color: 'white', padding: '1px 4px', borderRadius: '6px' }}>
                                                                                                {skillData.tag}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    {skillData?.hasValue && (
                                                                                        <input
                                                                                            type="number"
                                                                                            value={skill.value || 1}
                                                                                            onChange={(e) => {
                                                                                                const newSkills = [...(poke.pokemonSkills || [])];
                                                                                                newSkills[idx] = { ...skill, value: parseInt(e.target.value) || 1 };
                                                                                                updatePokemon(poke.id, { pokemonSkills: newSkills });
                                                                                            }}
                                                                                            min="1"
                                                                                            style={{ width: '50px', padding: '2px', textAlign: 'center', fontSize: '12px' }}
                                                                                        />
                                                                                    )}
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            const newSkills = (poke.pokemonSkills || []).filter((_, i) => i !== idx);
                                                                                            updatePokemon(poke.id, { pokemonSkills: newSkills });
                                                                                        }}
                                                                                        style={{
                                                                                            padding: '2px 6px',
                                                                                            background: '#f44336',
                                                                                            color: 'white',
                                                                                            border: 'none',
                                                                                            borderRadius: '4px',
                                                                                            cursor: 'pointer',
                                                                                            fontSize: '10px'
                                                                                        }}
                                                                                    >✕</button>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                                
                                                                {/* Add Skill */}
                                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                                    <select
                                                                        id={`pokemonSkillSelect-${poke.id}`}
                                                                        style={{ flex: 1, padding: '6px', fontSize: '11px' }}
                                                                        defaultValue=""
                                                                    >
                                                                        <option value="">Add skill...</option>
                                                                        <optgroup label="Speed">
                                                                            {Object.entries(GAME_DATA.pokemonSkills || {})
                                                                                .filter(([_, d]) => d.type === 'speed')
                                                                                .filter(([name]) => !(poke.pokemonSkills || []).some(s => s.name === name))
                                                                                .map(([name]) => <option key={name} value={name}>{name}</option>)
                                                                            }
                                                                        </optgroup>
                                                                        <optgroup label="Basic">
                                                                            {Object.entries(GAME_DATA.pokemonSkills || {})
                                                                                .filter(([_, d]) => d.type === 'basic')
                                                                                .filter(([name]) => !(poke.pokemonSkills || []).some(s => s.name === name))
                                                                                .map(([name]) => <option key={name} value={name}>{name}</option>)
                                                                            }
                                                                        </optgroup>
                                                                        <optgroup label="Other">
                                                                            {Object.entries(GAME_DATA.pokemonSkills || {})
                                                                                .filter(([_, d]) => d.type === 'other')
                                                                                .filter(([name]) => !(poke.pokemonSkills || []).some(s => s.name === name))
                                                                                .map(([name]) => <option key={name} value={name}>{name}</option>)
                                                                            }
                                                                        </optgroup>
                                                                    </select>
                                                                    <button
                                                                        className="btn btn-primary"
                                                                        style={{ padding: '6px 12px', fontSize: '11px' }}
                                                                        onClick={() => {
                                                                            const select = document.getElementById(`pokemonSkillSelect-${poke.id}`);
                                                                            if (select.value) {
                                                                                const skillData = GAME_DATA.pokemonSkills[select.value];
                                                                                const newSkill = { name: select.value };
                                                                                if (skillData?.hasValue) newSkill.value = 1;
                                                                                updatePokemon(poke.id, { 
                                                                                    pokemonSkills: [...(poke.pokemonSkills || []), newSkill]
                                                                                });
                                                                                select.value = '';
                                                                            }
                                                                        }}
                                                                    >+ Add</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {/* ========== MOVES TAB ========== */}
                                                    {(pokemonEditTab[poke.id] || 'info') === 'moves' && (
                                                        <div>
                                                            {/* Move Search & Filters */}
                                                            <div style={{ 
                                                                background: '#f8f9fa', 
                                                                padding: '10px', 
                                                                borderRadius: '8px',
                                                                marginBottom: '12px'
                                                            }}>
                                                                <input
                                                                    type="text"
                                                                    placeholder="🔍 Search moves..."
                                                                    value={moveSearchQuery}
                                                                    onChange={(e) => setMoveSearchQuery(e.target.value)}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '8px',
                                                                        marginBottom: '8px',
                                                                        border: '2px solid #dee2e6',
                                                                        borderRadius: '6px',
                                                                        fontSize: '12px'
                                                                    }}
                                                                />
                                                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                                    <select
                                                                        value={moveTypeFilter}
                                                                        onChange={(e) => setMoveTypeFilter(e.target.value)}
                                                                        style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px' }}
                                                                    >
                                                                        <option value="all">All Types</option>
                                                                        {Object.keys(typeChart).map(type => (
                                                                            <option key={type} value={type}>{type}</option>
                                                                        ))}
                                                                    </select>
                                                                    <select
                                                                        value={moveCategoryFilter}
                                                                        onChange={(e) => setMoveCategoryFilter(e.target.value)}
                                                                        style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px' }}
                                                                    >
                                                                        <option value="all">All Categories</option>
                                                                        <option value="Physical">Physical</option>
                                                                        <option value="Special">Special</option>
                                                                        <option value="Status">Status</option>
                                                                    </select>
                                                                    {poke.types?.length > 0 && (
                                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                                            {poke.types.map(type => (
                                                                                <button
                                                                                    key={type}
                                                                                    onClick={() => setMoveTypeFilter(moveTypeFilter === type ? 'all' : type)}
                                                                                    className={`type-badge type-${type.toLowerCase()}`}
                                                                                    style={{ 
                                                                                        cursor: 'pointer', 
                                                                                        fontSize: '10px',
                                                                                        padding: '2px 6px',
                                                                                        border: moveTypeFilter === type ? '2px solid #333' : 'none'
                                                                                    }}
                                                                                >
                                                                                    {type}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div style={{ fontSize: '10px', color: '#888', marginTop: '6px' }}>
                                                                    {getFilteredMoves.length} moves found
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Add Move */}
                                                            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                                                                <select 
                                                                    id={`moveSelect-${poke.id}`} 
                                                                    style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                                                                >
                                                                    <option value="">Select move to add...</option>
                                                                    {getFilteredMoves.slice(0, 100).map(([name, data]) => (
                                                                        <option key={name} value={name}>
                                                                            {name} ({data.type}/{data.category})
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <select
                                                                    id={`moveSource-${poke.id}`}
                                                                    style={{ width: '80px', padding: '8px', fontSize: '11px' }}
                                                                >
                                                                    <option value="natural">Natural</option>
                                                                    <option value="taught">Taught</option>
                                                                </select>
                                                                <button
                                                                    className="btn btn-primary"
                                                                    style={{ padding: '8px 12px', fontSize: '11px' }}
                                                                    onClick={() => {
                                                                        const select = document.getElementById(`moveSelect-${poke.id}`);
                                                                        const sourceSelect = document.getElementById(`moveSource-${poke.id}`);
                                                                        if (select.value) {
                                                                            const moveData = GAME_DATA.moves[select.value];
                                                                            updatePokemon(poke.id, {
                                                                                moves: [...poke.moves, {
                                                                                    name: select.value,
                                                                                    type: moveData.type,
                                                                                    category: moveData.category,
                                                                                    frequency: moveData.frequency,
                                                                                    damage: moveData.damage,
                                                                                    range: moveData.range,
                                                                                    effect: moveData.effect,
                                                                                    source: sourceSelect.value
                                                                                }]
                                                                            });
                                                                            select.value = '';
                                                                        }
                                                                    }}
                                                                >+ Add</button>
                                                            </div>
                                                            
                                                            {/* Custom Move Button */}
                                                            <button
                                                                className="btn btn-secondary"
                                                                style={{ width: '100%', marginBottom: '12px', padding: '6px', fontSize: '11px' }}
                                                                onClick={() => {
                                                                    setCustomMoveForPokemon(poke.id);
                                                                    setShowCustomMoveModal(true);
                                                                }}
                                                            >
                                                                ✨ Add Custom Move
                                                            </button>
                                                            
                                                            {/* Current Moves */}
                                                            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                                                {poke.moves.length > 0 ? (
                                                                    poke.moves.map((move, index) => {
                                                                        const moveData = GAME_DATA.moves[move.name] || move;
                                                                        return (
                                                                            <div 
                                                                                key={index} 
                                                                                className="move-item"
                                                                                style={{ 
                                                                                    padding: '8px',
                                                                                    marginBottom: '6px',
                                                                                    cursor: 'pointer',
                                                                                    borderRadius: '6px'
                                                                                }}
                                                                                onClick={() => showDetail('move', move.name, { ...moveData, ...move })}
                                                                            >
                                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                                    <div style={{ flex: 1 }}>
                                                                                        <div style={{ fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                                                                                            {move.name}
                                                                                            <span style={{ 
                                                                                                background: move.source === 'natural' ? '#4caf50' : move.source === 'taught' ? '#2196f3' : '#999',
                                                                                                color: 'white', 
                                                                                                padding: '1px 4px', 
                                                                                                borderRadius: '3px', 
                                                                                                fontSize: '9px'
                                                                                            }}>
                                                                                                {move.source === 'natural' ? 'N' : move.source === 'taught' ? 'T' : '?'}
                                                                                            </span>
                                                                                            {hasSTAB(move.type, poke.types) && (
                                                                                                <span className="stab-indicator" style={{ fontSize: '9px' }}>STAB</span>
                                                                                            )}
                                                                                        </div>
                                                                                        <div style={{ fontSize: '11px', color: '#666' }}>
                                                                                            {move.type} | {move.category} | {move.frequency}
                                                                                            {move.damage && ` | ${move.damage}`}
                                                                                        </div>
                                                                                    </div>
                                                                                    <button
                                                                                        style={{ 
                                                                                            background: 'none', 
                                                                                            border: 'none', 
                                                                                            color: '#f5576c',
                                                                                            cursor: 'pointer',
                                                                                            fontSize: '16px',
                                                                                            padding: '0 4px'
                                                                                        }}
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            updatePokemon(poke.id, {
                                                                                                moves: poke.moves.filter((_, i) => i !== index)
                                                                                            });
                                                                                        }}
                                                                                    >×</button>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })
                                                                ) : (
                                                                    <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                                                                        No moves yet. Add some above!
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                // View Mode
                                                <div>
                                                    <div onClick={() => setEditingPokemon(poke.id)} className="cursor-pointer">
                                                    <div className="pokemon-header">
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            {poke.avatar ? (
                                                                <img 
                                                                    src={poke.avatar} 
                                                                    alt={poke.name}
                                                                    style={{ 
                                                                        width: '50px', 
                                                                        height: '50px', 
                                                                        borderRadius: '8px', 
                                                                        objectFit: 'cover',
                                                                        border: '2px solid #667eea'
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <div>
                                                                <div className="pokemon-name">
                                                                    {poke.name}
                                                                    {poke.gender && (
                                                                        <span style={{ 
                                                                            color: poke.gender === 'male' ? '#2196f3' : poke.gender === 'female' ? '#e91e63' : '#9e9e9e',
                                                                            marginLeft: '6px'
                                                                        }}>
                                                                            {poke.gender === 'male' ? '♂' : poke.gender === 'female' ? '♀' : '⚪'}
                                                                        </span>
                                                                    )}
                                                                    {poke.statPointsAvailable > 0 && (
                                                                        <span style={{ 
                                                                            background: '#ffc107', 
                                                                            color: '#333',
                                                                            padding: '2px 6px',
                                                                            borderRadius: '4px',
                                                                            fontSize: '12px',
                                                                            marginLeft: '10px'
                                                                        }}>
                                                                            {poke.statPointsAvailable} points!
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div style={{ fontSize: '14px', color: '#666' }}>
                                                                    {poke.species || 'Unknown Species'} 
                                                                    {poke.nature && (
                                                                        <>
                                                                            {' • '}
                                                                            <span style={{ color: '#764ba2' }}>{poke.nature} Nature</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="pokemon-level">Lv. {poke.level}</div>
                                                    </div>
                                                    
                                                    <div className="exp-progress">
                                                        <div className="exp-progress-bar" style={{ width: `${expProgress}%` }}></div>
                                                    </div>
                                                    <div className="exp-text">
                                                        EXP: {poke.exp} / {GAME_DATA.pokemonExpChart[Math.min(100, poke.level + 1)]}
                                                        {poke.statPointsAvailable > 0 && (
                                                            <span style={{ color: '#ffc107', fontWeight: 'bold' }}>
                                                                {' • '}{poke.statPointsAvailable} stat points!
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    {poke.types.length > 0 && (
                                                        <div className="pokemon-types">
                                                            {poke.types.map(type => (
                                                                <span key={type} className={`type-badge type-${type.toLowerCase()}`}>
                                                                    {type}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '15px' }}>
                                                        <div className="text-14">
                                                            <strong>HP:</strong> {calculatePokemonHP(poke)}
                                                        </div>
                                                        <div className="text-14">
                                                            <strong>ATK:</strong> {actualStats.atk}
                                                        </div>
                                                        <div className="text-14">
                                                            <strong>DEF:</strong> {actualStats.def}
                                                        </div>
                                                        <div className="text-14">
                                                            <strong>SATK:</strong> {actualStats.satk}
                                                        </div>
                                                        <div className="text-14">
                                                            <strong>SDEF:</strong> {actualStats.sdef}
                                                        </div>
                                                        <div className="text-14">
                                                            <strong>SPD:</strong> {actualStats.spd}
                                                        </div>
                                                    </div>
                                                    
                                                    <div style={{ marginTop: '10px', fontSize: '14px' }}>
                                                        <strong>STAB Bonus:</strong> +{stabBonus} damage
                                                        {' • '}
                                                        <strong>Loyalty:</strong> {poke.loyalty || 2}/4
                                                    </div>
                                                    
                                                    {/* Abilities display */}
                                                    {(poke.ability || poke.ability2 || poke.ability3) && (
                                                        <div style={{ marginTop: '10px', fontSize: '13px' }}>
                                                            <strong>Abilities:</strong>{' '}
                                                            {[poke.ability, poke.ability2, poke.ability3]
                                                                .filter(a => a)
                                                                .map((ability, idx, arr) => (
                                                                    <span key={idx}>
                                                                        <span 
                                                                            style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
                                                                            onClick={(e) => { e.stopPropagation(); showDetail('ability', ability, GAME_DATA.abilities[ability]); }}
                                                                        >
                                                                            {ability}
                                                                        </span>
                                                                        {idx < arr.length - 1 && ' • '}
                                                                    </span>
                                                                ))
                                                            }
                                                        </div>
                                                    )}
                                                    
                                                    {/* Skills display */}
                                                    {(poke.pokemonSkills || []).length > 0 && (
                                                        <div style={{ marginTop: '10px', fontSize: '13px' }}>
                                                            <strong>Skills:</strong>{' '}
                                                            {(poke.pokemonSkills || []).map((skill, idx, arr) => (
                                                                <span key={idx}>
                                                                    {skill.name}{skill.value ? ` ${skill.value}` : ''}
                                                                    {idx < arr.length - 1 && ' • '}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    
                                                    {poke.moves.length > 0 && (
                                                        <div className="mt-15">
                                                            <strong className="text-14">Moves:</strong>
                                                            <div className="moves-list">
                                                                {poke.moves.slice(0, 4).map((move, index) => {
                                                                    const moveData = GAME_DATA.moves[move.name] || move;
                                                                    return (
                                                                    <div 
                                                                        key={index} 
                                                                        className="move-item"
                                                                        className="cursor-pointer"
                                                                        onClick={(e) => { e.stopPropagation(); showDetail('move', move.name, { ...moveData, ...move }); }}
                                                                    >
                                                                        <div className="move-name">
                                                                            {move.name}
                                                                            {hasSTAB(move.type, poke.types) && (
                                                                                <span className="stab-indicator">STAB</span>
                                                                            )}
                                                                        </div>
                                                                        <div className="move-type">{move.type} • {move.frequency}</div>
                                                                    </div>
                                                                );})}
                                                                {poke.moves.length > 4 && (
                                                                    <div style={{ fontSize: '12px', color: '#999' }}>
                                                                        +{poke.moves.length - 4} more...
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    <div style={{ marginTop: '15px', fontSize: '12px', color: '#999', textAlign: 'center' }}>
                                                        Click to edit
                                                    </div>
                                                    </div>
                                                    
                                                    {/* Action buttons outside clickable area */}
                                                    <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                                        {/* Reorder buttons */}
                                                        <div style={{ display: 'flex', gap: '5px' }}>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); movePokemonUp(poke.id, isInParty); }}
                                                                disabled={isFirst}
                                                                style={{
                                                                    padding: '5px 12px',
                                                                    fontSize: '11px',
                                                                    background: isFirst ? '#ccc' : '#667eea',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '5px',
                                                                    cursor: isFirst ? 'not-allowed' : 'pointer'
                                                                }}
                                                                title="Move up in list"
                                                            >
                                                                ▲ Up
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); movePokemonDown(poke.id, isInParty); }}
                                                                disabled={isLast}
                                                                style={{
                                                                    padding: '5px 12px',
                                                                    fontSize: '11px',
                                                                    background: isLast ? '#ccc' : '#667eea',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '5px',
                                                                    cursor: isLast ? 'not-allowed' : 'pointer'
                                                                }}
                                                                title="Move down in list"
                                                            >
                                                                ▼ Down
                                                            </button>
                                                        </div>
                                                        
                                                        {/* Transfer button */}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); isInParty ? moveToReserve(poke.id) : moveToParty(poke.id); }}
                                                            style={{
                                                                padding: '5px 12px',
                                                                fontSize: '11px',
                                                                background: isInParty ? '#ff9800' : '#4caf50',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '5px',
                                                                cursor: 'pointer'
                                                            }}
                                                            title={isInParty ? 'Move to Reserve' : 'Move to Party'}
                                                        >
                                                            {isInParty ? '📦 To Reserve' : '🎒 To Party'}
                                                        </button>
                                                        
                                                        {/* Export Card button */}
                                                        <button 
                                                            className="btn btn-secondary" 
                                                            style={{ padding: '5px 12px', fontSize: '11px' }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setCardType('pokemon');
                                                                setSelectedCardPokemon(poke);
                                                                setShowCardModal(true);
                                                            }}
                                                        >
                                                            📇 Export Card
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="empty-state">
                                    <p>No Pokémon in your {pokemonView === 'party' ? 'active party' : 'reserve'} yet</p>
                                    <p style={{ fontSize: '14px', marginTop: '10px' }}>
                                        {pokemonView === 'party' 
                                            ? 'Click "Add New Pokémon" to catch your first partner!'
                                            : 'Move Pokémon here from your party, or add new ones when your party is full.'}
                                    </p>
                                </div>
                            );
                            })()}
                        </div>
                    </div>
                )}
                
                {/* ========== INVENTORY TAB ========== */}
                {activeTab === 'inventory' && (
                    <div>
                        <h2 className="section-title">Inventory & Items</h2>
                        
                        <div className="mb-20">
                            <div className="stat-box" style={{ display: 'inline-block', marginRight: '20px' }}>
                                <label>Money</label>
                                <div className="value">₽{trainer.money || 0}</div>
                            </div>
                            <div className="stat-box" style={{ display: 'inline-block' }}>
                                <label>Total Items</label>
                                <div className="value">{inventory.reduce((sum, item) => sum + item.quantity, 0)}</div>
                            </div>
                        </div>
                        
                        {/* Item Picker Section */}
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>Add Item to Inventory</span>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => {
                                        setShowItemPicker(!showItemPicker);
                                        setItemPickerSearch('');
                                        setItemPickerCategory('all');
                                    }}
                                    style={{ padding: '6px 16px', fontSize: '13px' }}
                                >
                                    {showItemPicker ? '✕ Close Picker' : '+ Open Item Picker'}
                                </button>
                            </label>
                            
                            {showItemPicker && (
                                <div style={{
                                    marginTop: '12px',
                                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    border: '2px solid var(--poke-orange)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}>
                                    {/* Search and Filter Controls */}
                                    <div style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                        gap: '12px',
                                        marginBottom: '12px'
                                    }}>
                                        {/* Search Input */}
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="text"
                                                placeholder="🔍 Search items by name..."
                                                value={itemPickerSearch}
                                                onChange={(e) => setItemPickerSearch(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px 10px 12px',
                                                    borderRadius: '8px',
                                                    border: '2px solid #dee2e6',
                                                    fontSize: '14px',
                                                    transition: 'border-color 0.2s'
                                                }}
                                                onFocus={(e) => e.target.style.borderColor = 'var(--poke-orange)'}
                                                onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                                            />
                                            {itemPickerSearch && (
                                                <button
                                                    onClick={() => setItemPickerSearch('')}
                                                    style={{
                                                        position: 'absolute',
                                                        right: '8px',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        background: '#ccc',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        width: '20px',
                                                        height: '20px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        color: 'white',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >✕</button>
                                            )}
                                        </div>
                                        
                                        {/* Category Filter */}
                                        <select
                                            value={itemPickerCategory}
                                            onChange={(e) => setItemPickerCategory(e.target.value)}
                                            style={{
                                                padding: '10px 12px',
                                                borderRadius: '8px',
                                                border: '2px solid #dee2e6',
                                                fontSize: '14px',
                                                background: 'white',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="all">📦 All Categories</option>
                                            <option value="healing">🩹 Healing</option>
                                            <option value="status">💊 Status Curatives</option>
                                            <option value="ball">🔴 Poké Balls</option>
                                            <option value="berry">🍓 Berries</option>
                                            <option value="held">📎 Held Items</option>
                                            <option value="battle">💪 Battle Items</option>
                                            <option value="vitamin">💉 Vitamins</option>
                                            <option value="trainer">🧑 Trainer Items</option>
                                            <option value="stone">💎 Evolution Stones</option>
                                            <option value="flute">🎵 Flutes</option>
                                            <option value="repel">🚫 Repels</option>
                                            <option value="apricorn">🍎 Apricorns</option>
                                            <option value="mega">✨ Mega Stones</option>
                                        </select>
                                        
                                        {/* Sort By */}
                                        <select
                                            value={itemPickerSortBy}
                                            onChange={(e) => setItemPickerSortBy(e.target.value)}
                                            style={{
                                                padding: '10px 12px',
                                                borderRadius: '8px',
                                                border: '2px solid #dee2e6',
                                                fontSize: '14px',
                                                background: 'white',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="name">Sort: A-Z</option>
                                            <option value="name-desc">Sort: Z-A</option>
                                            <option value="price-asc">Price: Low → High</option>
                                            <option value="price-desc">Price: High → Low</option>
                                        </select>
                                    </div>
                                    
                                    {/* Quick Category Buttons */}
                                    <div style={{ 
                                        display: 'flex', 
                                        flexWrap: 'wrap', 
                                        gap: '6px', 
                                        marginBottom: '12px',
                                        paddingBottom: '12px',
                                        borderBottom: '1px solid #dee2e6'
                                    }}>
                                        {[
                                            { key: 'all', label: '📦 All', color: '#6c757d' },
                                            { key: 'healing', label: '🩹', color: '#28a745' },
                                            { key: 'status', label: '💊', color: '#17a2b8' },
                                            { key: 'ball', label: '🔴', color: '#dc3545' },
                                            { key: 'berry', label: '🍓', color: '#e83e8c' },
                                            { key: 'held', label: '📎', color: '#6f42c1' },
                                            { key: 'battle', label: '💪', color: '#fd7e14' },
                                            { key: 'vitamin', label: '💉', color: '#20c997' },
                                            { key: 'stone', label: '💎', color: '#007bff' },
                                            { key: 'mega', label: '✨', color: '#ffc107' }
                                        ].map(cat => (
                                            <button
                                                key={cat.key}
                                                onClick={() => setItemPickerCategory(cat.key)}
                                                style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '16px',
                                                    border: itemPickerCategory === cat.key ? `2px solid ${cat.color}` : '2px solid transparent',
                                                    background: itemPickerCategory === cat.key ? cat.color : '#e9ecef',
                                                    color: itemPickerCategory === cat.key ? 'white' : '#495057',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                title={cat.key.charAt(0).toUpperCase() + cat.key.slice(1)}
                                            >
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    {/* Results Count */}
                                    {(() => {
                                        const allItems = Object.entries(GAME_DATA.items || {});
                                        const filteredItems = allItems
                                            .filter(([name, data]) => {
                                                const matchesSearch = itemPickerSearch === '' || 
                                                    name.toLowerCase().includes(itemPickerSearch.toLowerCase()) ||
                                                    (data.effect && data.effect.toLowerCase().includes(itemPickerSearch.toLowerCase()));
                                                const matchesCategory = itemPickerCategory === 'all' || data.type === itemPickerCategory;
                                                return matchesSearch && matchesCategory;
                                            })
                                            .sort((a, b) => {
                                                if (itemPickerSortBy === 'name') return a[0].localeCompare(b[0]);
                                                if (itemPickerSortBy === 'name-desc') return b[0].localeCompare(a[0]);
                                                if (itemPickerSortBy === 'price-asc') return (a[1].price || 0) - (b[1].price || 0);
                                                if (itemPickerSortBy === 'price-desc') return (b[1].price || 0) - (a[1].price || 0);
                                                return 0;
                                            });
                                        
                                        return (
                                            <>
                                                <div style={{ 
                                                    fontSize: '12px', 
                                                    color: '#6c757d', 
                                                    marginBottom: '8px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <span>
                                                        Showing <strong>{filteredItems.length}</strong> of {allItems.length} items
                                                        {itemPickerSearch && <> matching "<strong>{itemPickerSearch}</strong>"</>}
                                                    </span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <label style={{ fontSize: '12px', margin: 0 }}>Qty:</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="999"
                                                            value={itemPickerQuantity}
                                                            onChange={(e) => setItemPickerQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                                            style={{
                                                                width: '60px',
                                                                padding: '4px 8px',
                                                                borderRadius: '6px',
                                                                border: '2px solid #dee2e6',
                                                                fontSize: '13px',
                                                                textAlign: 'center'
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                
                                                {/* Item List */}
                                                <div style={{
                                                    maxHeight: '320px',
                                                    overflowY: 'auto',
                                                    border: '1px solid #dee2e6',
                                                    borderRadius: '8px',
                                                    background: 'white'
                                                }}>
                                                    {filteredItems.length > 0 ? (
                                                        filteredItems.map(([name, data]) => {
                                                            const categoryIcons = {
                                                                healing: '🩹', status: '💊', ball: '🔴', berry: '🍓',
                                                                held: '📎', battle: '💪', vitamin: '💉', trainer: '🧑',
                                                                stone: '💎', flute: '🎵', repel: '🚫', apricorn: '🍎', mega: '✨'
                                                            };
                                                            const inInventory = inventory.find(i => i.name === name);
                                                            
                                                            return (
                                                                <div
                                                                    key={name}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        padding: '10px 12px',
                                                                        borderBottom: '1px solid #f0f0f0',
                                                                        cursor: 'pointer',
                                                                        transition: 'background 0.15s',
                                                                        background: inInventory ? 'rgba(102, 126, 234, 0.05)' : 'transparent'
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(245, 166, 35, 0.1)'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.background = inInventory ? 'rgba(102, 126, 234, 0.05)' : 'transparent'}
                                                                    onClick={() => {
                                                                        setInventory(prev => {
                                                                            const existing = prev.find(i => i.name === name);
                                                                            if (existing) {
                                                                                return prev.map(i => 
                                                                                    i.name === name 
                                                                                        ? { ...i, quantity: i.quantity + itemPickerQuantity }
                                                                                        : i
                                                                                );
                                                                            } else {
                                                                                return [...prev, {
                                                                                    name: name,
                                                                                    quantity: itemPickerQuantity,
                                                                                    data: data
                                                                                }];
                                                                            }
                                                                        });
                                                                    }}
                                                                >
                                                                    {/* Category Icon */}
                                                                    <span style={{ 
                                                                        fontSize: '16px', 
                                                                        marginRight: '10px',
                                                                        width: '24px',
                                                                        textAlign: 'center'
                                                                    }}>
                                                                        {categoryIcons[data.type] || '📦'}
                                                                    </span>
                                                                    
                                                                    {/* Item Info */}
                                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                                        <div style={{ 
                                                                            fontWeight: '600', 
                                                                            fontSize: '14px',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '8px'
                                                                        }}>
                                                                            {name}
                                                                            {inInventory && (
                                                                                <span style={{
                                                                                    background: '#667eea',
                                                                                    color: 'white',
                                                                                    padding: '1px 6px',
                                                                                    borderRadius: '10px',
                                                                                    fontSize: '10px',
                                                                                    fontWeight: 'bold'
                                                                                }}>
                                                                                    ×{inInventory.quantity} owned
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div style={{ 
                                                                            fontSize: '11px', 
                                                                            color: '#6c757d',
                                                                            whiteSpace: 'nowrap',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            maxWidth: '300px'
                                                                        }}>
                                                                            {data.effect || 'No description available'}
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {/* Price */}
                                                                    <div style={{
                                                                        background: '#ffd700',
                                                                        color: '#5d4e00',
                                                                        padding: '4px 10px',
                                                                        borderRadius: '12px',
                                                                        fontSize: '12px',
                                                                        fontWeight: 'bold',
                                                                        marginRight: '10px',
                                                                        whiteSpace: 'nowrap'
                                                                    }}>
                                                                        ₽{data.price || 0}
                                                                    </div>
                                                                    
                                                                    {/* Add Button */}
                                                                    <button
                                                                        style={{
                                                                            background: 'linear-gradient(135deg, #4caf50, #43a047)',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '6px',
                                                                            padding: '6px 12px',
                                                                            fontSize: '12px',
                                                                            fontWeight: 'bold',
                                                                            cursor: 'pointer',
                                                                            whiteSpace: 'nowrap',
                                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                                                                        }}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setInventory(prev => {
                                                                                const existing = prev.find(i => i.name === name);
                                                                                if (existing) {
                                                                                    return prev.map(i => 
                                                                                        i.name === name 
                                                                                            ? { ...i, quantity: i.quantity + itemPickerQuantity }
                                                                                            : i
                                                                                    );
                                                                                } else {
                                                                                    return [...prev, {
                                                                                        name: name,
                                                                                        quantity: itemPickerQuantity,
                                                                                        data: data
                                                                                    }];
                                                                                }
                                                                            });
                                                                        }}
                                                                    >
                                                                        + Add
                                                                    </button>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <div style={{ 
                                                            padding: '40px 20px', 
                                                            textAlign: 'center', 
                                                            color: '#6c757d' 
                                                        }}>
                                                            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔍</div>
                                                            <div>No items found matching your search</div>
                                                            <button
                                                                onClick={() => {
                                                                    setItemPickerSearch('');
                                                                    setItemPickerCategory('all');
                                                                }}
                                                                style={{
                                                                    marginTop: '10px',
                                                                    padding: '6px 16px',
                                                                    background: '#6c757d',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px'
                                                                }}
                                                            >
                                                                Clear Filters
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                        
                        <div className="tabs" style={{ flexWrap: 'wrap' }}>
                            <button 
                                className={`tab ${inventoryFilter === 'all' ? 'active' : ''}`}
                                onClick={() => setInventoryFilter('all')}
                            >All Items</button>
                            <button 
                                className={`tab ${inventoryFilter === 'healing' ? 'active' : ''}`}
                                onClick={() => setInventoryFilter('healing')}
                            >Healing</button>
                            <button 
                                className={`tab ${inventoryFilter === 'status' ? 'active' : ''}`}
                                onClick={() => setInventoryFilter('status')}
                            >Status</button>
                            <button 
                                className={`tab ${inventoryFilter === 'ball' ? 'active' : ''}`}
                                onClick={() => setInventoryFilter('ball')}
                            >Poké Balls</button>
                            <button 
                                className={`tab ${inventoryFilter === 'berry' ? 'active' : ''}`}
                                onClick={() => setInventoryFilter('berry')}
                            >Berries</button>
                            <button 
                                className={`tab ${inventoryFilter === 'held' ? 'active' : ''}`}
                                onClick={() => setInventoryFilter('held')}
                            >Held Items</button>
                            <button 
                                className={`tab ${inventoryFilter === 'vitamin' ? 'active' : ''}`}
                                onClick={() => setInventoryFilter('vitamin')}
                            >Vitamins</button>
                            <button 
                                className={`tab ${inventoryFilter === 'battle' ? 'active' : ''}`}
                                onClick={() => setInventoryFilter('battle')}
                            >Battle Items</button>
                            <button 
                                className={`tab ${inventoryFilter === 'trainer' ? 'active' : ''}`}
                                onClick={() => setInventoryFilter('trainer')}
                            >Trainer</button>
                            <button 
                                className={`tab ${inventoryFilter === 'stone' ? 'active' : ''}`}
                                onClick={() => setInventoryFilter('stone')}
                            >Stones</button>
                        </div>
                        
                        {/* Search Your Inventory */}
                        {inventory.length > 0 && (
                            <div style={{ 
                                marginTop: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                flexWrap: 'wrap'
                            }}>
                                <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '350px' }}>
                                    <input
                                        type="text"
                                        placeholder="🔍 Search your inventory..."
                                        value={inventorySearchQuery}
                                        onChange={(e) => setInventorySearchQuery(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px 35px 8px 12px',
                                            borderRadius: '20px',
                                            border: '2px solid #dee2e6',
                                            fontSize: '14px',
                                            transition: 'border-color 0.2s, box-shadow 0.2s'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--poke-orange)';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(245, 166, 35, 0.15)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#dee2e6';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                    {inventorySearchQuery && (
                                        <button
                                            onClick={() => setInventorySearchQuery('')}
                                            style={{
                                                position: 'absolute',
                                                right: '10px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: '#ccc',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '18px',
                                                height: '18px',
                                                cursor: 'pointer',
                                                fontSize: '11px',
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                lineHeight: 1
                                            }}
                                        >✕</button>
                                    )}
                                </div>
                                {inventorySearchQuery && (
                                    <span style={{ fontSize: '12px', color: '#6c757d' }}>
                                        Searching for "{inventorySearchQuery}"
                                    </span>
                                )}
                            </div>
                        )}
                        
                        <div className="mt-20">
                            {(() => {
                                // Filter by category first
                                let filteredInventory = inventoryFilter === 'all' 
                                    ? inventory 
                                    : inventory.filter(item => item.data?.type === inventoryFilter);
                                
                                // Then filter by search query
                                if (inventorySearchQuery) {
                                    const query = inventorySearchQuery.toLowerCase();
                                    filteredInventory = filteredInventory.filter(item => 
                                        item.name.toLowerCase().includes(query) ||
                                        (item.data?.effect && item.data.effect.toLowerCase().includes(query))
                                    );
                                }
                                
                                return filteredInventory.length > 0 ? (
                                    <div className="reference-grid">
                                        {filteredInventory.map((item, index) => (
                                        <div key={index} className="reference-card">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <h4>{item.name}</h4>
                                                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                                    <span style={{ 
                                                        background: '#667eea', 
                                                        color: 'white', 
                                                        padding: '2px 8px', 
                                                        borderRadius: '12px',
                                                        fontSize: '14px'
                                                    }}>
                                                        ×{item.quantity}
                                                    </span>
                                                    <button
                                                        style={{ 
                                                            background: '#f44336', 
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            padding: '2px 6px',
                                                            cursor: 'pointer'
                                                        }}
                                                        onClick={() => {
                                                            setInventory(prev => {
                                                                const updated = prev.map(i => {
                                                                    if (i.name === item.name) {
                                                                        return { ...i, quantity: i.quantity - 1 };
                                                                    }
                                                                    return i;
                                                                });
                                                                return updated.filter(i => i.quantity > 0);
                                                            });
                                                        }}
                                                    >
                                                        -
                                                    </button>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '13px', color: '#666' }}>{item.data?.effect || 'No effect data'}</p>
                                            <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                                                Type: {item.data?.type || 'unknown'} • Value: ₽{(item.data?.price || 0) * item.quantity}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <p>
                                        {inventorySearchQuery 
                                            ? `No items found matching "${inventorySearchQuery}"`
                                            : inventoryFilter === 'all' 
                                                ? 'No items in inventory' 
                                                : `No ${inventoryFilter} items`
                                        }
                                    </p>
                                    <p style={{ fontSize: '14px', marginTop: '10px' }}>
                                        {inventorySearchQuery
                                            ? 'Try a different search term or clear filters'
                                            : inventoryFilter === 'all' 
                                                ? 'Click "Open Item Picker" above to add items'
                                                : 'Try selecting "All Items" or add items of this type'
                                        }
                                    </p>
                                    {(inventorySearchQuery || inventoryFilter !== 'all') && (
                                        <button
                                            onClick={() => {
                                                setInventorySearchQuery('');
                                                setInventoryFilter('all');
                                            }}
                                            style={{
                                                marginTop: '12px',
                                                padding: '8px 20px',
                                                background: '#6c757d',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '13px'
                                            }}
                                        >
                                            Clear All Filters
                                        </button>
                                    )}
                                </div>
                            );
                            })()}
                        </div>
                    </div>
                )}
                
                {/* ========== DICE ROLLER TAB ========== */}
                {activeTab === 'battle' && (
                    <div>
                        <h2 className="section-title">🎲 Dice Roller</h2>
                        
                        {/* Discord Integration Settings */}
                        <div style={{ 
                            marginBottom: '20px', 
                            background: discordWebhook.enabled ? 'linear-gradient(135deg, #5865F2, #4752C4)' : '#f8f9fa',
                            borderRadius: '12px',
                            border: discordWebhook.enabled ? '2px solid #4752C4' : '2px solid #e0e0e0',
                            overflow: 'hidden'
                        }}>
                            {/* Discord Header - Always visible */}
                            <div 
                                style={{ 
                                    padding: '12px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    color: discordWebhook.enabled ? 'white' : '#333'
                                }}
                                onClick={() => setDiscordWebhook(prev => ({ ...prev, showSettings: !prev.showSettings }))}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '20px' }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill={discordWebhook.enabled ? 'white' : '#5865F2'}>
                                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                                        </svg>
                                    </span>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                            Discord Integration
                                        </div>
                                        <div style={{ fontSize: '11px', opacity: 0.8 }}>
                                            {discordWebhook.enabled 
                                                ? '✓ Sending rolls to Discord' 
                                                : 'Click to set up Discord webhook'}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {discordWebhook.url && (
                                        <label 
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={discordWebhook.enabled}
                                                onChange={(e) => setDiscordWebhook(prev => ({ ...prev, enabled: e.target.checked }))}
                                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                            />
                                            <span style={{ fontSize: '12px', fontWeight: '500' }}>
                                                {discordWebhook.enabled ? 'ON' : 'OFF'}
                                            </span>
                                        </label>
                                    )}
                                    <span style={{ fontSize: '18px', transition: 'transform 0.2s', transform: discordWebhook.showSettings ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                        ▼
                                    </span>
                                </div>
                            </div>
                            
                            {/* Discord Settings Panel - Expandable */}
                            {discordWebhook.showSettings && (
                                <div style={{ 
                                    padding: '15px',
                                    background: 'white',
                                    borderTop: '1px solid #e0e0e0'
                                }}>
                                    <div style={{ marginBottom: '12px' }}>
                                        <label style={{ display: 'block', fontWeight: 'bold', fontSize: '12px', marginBottom: '6px', color: '#333' }}>
                                            Webhook URL
                                        </label>
                                        <input
                                            type="text"
                                            value={discordWebhook.url}
                                            onChange={(e) => setDiscordWebhook(prev => ({ ...prev, url: e.target.value }))}
                                            placeholder="https://discord.com/api/webhooks/..."
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                border: '2px solid #e0e0e0',
                                                borderRadius: '8px',
                                                fontSize: '13px',
                                                fontFamily: 'monospace'
                                            }}
                                        />
                                    </div>
                                    
                                    <div style={{ 
                                        background: '#f0f4ff', 
                                        padding: '12px', 
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        color: '#4752C4',
                                        lineHeight: '1.5'
                                    }}>
                                        <strong>How to get a webhook URL:</strong>
                                        <ol style={{ marginLeft: '16px', marginTop: '6px' }}>
                                            <li>Open Discord → Go to your server</li>
                                            <li>Right-click a channel → Edit Channel</li>
                                            <li>Integrations → Webhooks → New Webhook</li>
                                            <li>Copy Webhook URL and paste above</li>
                                        </ol>
                                    </div>
                                    
                                    {discordWebhook.url && (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await fetch(discordWebhook.url, {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            username: 'PTA Dice Roller',
                                                            avatar_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
                                                            embeds: [{
                                                                title: '✅ Connection Test',
                                                                description: `PTA Manager is now connected!\n\n**Trainer:** ${trainer.name || 'Unknown'}\n\nDice rolls will appear in this channel.`,
                                                                color: 0x4CAF50,
                                                                timestamp: new Date().toISOString()
                                                            }]
                                                        })
                                                    });
                                                    alert('✅ Test message sent! Check your Discord channel.');
                                                } catch (error) {
                                                    alert('❌ Failed to send. Please check your webhook URL.');
                                                }
                                            }}
                                            style={{
                                                marginTop: '12px',
                                                padding: '10px 20px',
                                                background: 'linear-gradient(135deg, #5865F2, #4752C4)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                fontSize: '13px',
                                                width: '100%'
                                            }}
                                        >
                                            🧪 Send Test Message
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {/* Mode Selection */}
                        <div className="tabs" className="mb-20">
                            <button 
                                className={`tab ${diceRoller.mode === 'pokemon' ? 'active' : ''}`}
                                onClick={() => setDiceRoller(prev => ({ ...prev, mode: 'pokemon' }))}
                            >
                                Pokémon Move
                            </button>
                            <button 
                                className={`tab ${diceRoller.mode === 'trainer' ? 'active' : ''}`}
                                onClick={() => setDiceRoller(prev => ({ ...prev, mode: 'trainer' }))}
                            >
                                Trainer Action
                            </button>
                            <button 
                                className={`tab ${diceRoller.mode === 'pokemonSkill' ? 'active' : ''}`}
                                onClick={() => setDiceRoller(prev => ({ ...prev, mode: 'pokemonSkill' }))}
                            >
                                Pokémon Skill
                            </button>
                            <button 
                                className={`tab ${diceRoller.mode === 'custom' ? 'active' : ''}`}
                                onClick={() => setDiceRoller(prev => ({ ...prev, mode: 'custom' }))}
                            >
                                Custom Roll
                            </button>
                        </div>
                        
                        <div className="grid-responsive-2">
                            {/* Left Panel - Roll Setup */}
                            <div className="section-card">
                                
                                {/* Pokémon Move Mode */}
                                {diceRoller.mode === 'pokemon' && (
                                    <>
                                        <h3 style={{ marginBottom: '15px', color: '#667eea' }}>Pokémon Move Roll</h3>
                                        
                                        <div className="form-group">
                                            <label>Select Pokémon (Active Party Only)</label>
                                            <select
                                                value={diceRoller.selectedPokemon?.id || ''}
                                                onChange={(e) => {
                                                    const poke = party.find(p => p.id === parseInt(e.target.value));
                                                    setDiceRoller(prev => ({ ...prev, selectedPokemon: poke, selectedMove: null }));
                                                }}
                                            >
                                                <option value="">Choose Pokémon...</option>
                                                {party.length > 0 ? (
                                                    party.map(p => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.name} (Lv.{p.level}) - HP: {calculatePokemonHP(p) - (p.currentDamage || 0)}/{calculatePokemonHP(p)}
                                                        </option>
                                                    ))
                                                ) : (
                                                    <option disabled>No Pokémon in active party</option>
                                                )}
                                            </select>
                                            {party.length === 0 && (
                                                <p style={{ fontSize: '12px', color: '#e65100', marginTop: '5px' }}>
                                                    Add Pokémon to your active party to use the dice roller.
                                                </p>
                                            )}
                                        </div>
                                        
                                        {diceRoller.selectedPokemon && (
                                            <>
                                                {/* HP Tracker */}
                                                <div style={{ 
                                                    background: '#fff', 
                                                    padding: '15px', 
                                                    borderRadius: '10px', 
                                                    marginBottom: '15px',
                                                    border: '2px solid #667eea'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                        <strong className="text-purple">❤️ Current HP</strong>
                                                        <span style={{ fontSize: '12px', color: '#666' }}>
                                                            Max: {calculatePokemonHP(diceRoller.selectedPokemon)}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                                                        <button
                                                            onClick={() => {
                                                                const maxHP = calculatePokemonHP(diceRoller.selectedPokemon);
                                                                const currentDamage = diceRoller.selectedPokemon.currentDamage || 0;
                                                                if (currentDamage < maxHP) {
                                                                    const newDamage = Math.min(maxHP, currentDamage + 10);
                                                                    updatePokemon(diceRoller.selectedPokemon.id, { currentDamage: newDamage });
                                                                    setDiceRoller(prev => ({
                                                                        ...prev,
                                                                        selectedPokemon: { ...prev.selectedPokemon, currentDamage: newDamage }
                                                                    }));
                                                                }
                                                            }}
                                                            style={{ padding: '5px 12px', background: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}
                                                            title="Take 10 damage"
                                                        >
                                                            -10
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const maxHP = calculatePokemonHP(diceRoller.selectedPokemon);
                                                                const currentDamage = diceRoller.selectedPokemon.currentDamage || 0;
                                                                if (currentDamage < maxHP) {
                                                                    const newDamage = Math.min(maxHP, currentDamage + 1);
                                                                    updatePokemon(diceRoller.selectedPokemon.id, { currentDamage: newDamage });
                                                                    setDiceRoller(prev => ({
                                                                        ...prev,
                                                                        selectedPokemon: { ...prev.selectedPokemon, currentDamage: newDamage }
                                                                    }));
                                                                }
                                                            }}
                                                            style={{ padding: '5px 10px', background: '#ff7043', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                                                            title="Take 1 damage"
                                                        >
                                                            -1
                                                        </button>
                                                        <div style={{ 
                                                            fontSize: '24px', 
                                                            fontWeight: 'bold', 
                                                            minWidth: '100px', 
                                                            textAlign: 'center',
                                                            color: (() => {
                                                                const maxHP = calculatePokemonHP(diceRoller.selectedPokemon);
                                                                const currentHP = maxHP - (diceRoller.selectedPokemon.currentDamage || 0);
                                                                const percent = currentHP / maxHP;
                                                                if (percent <= 0.25) return '#f44336';
                                                                if (percent <= 0.5) return '#ff9800';
                                                                return '#4caf50';
                                                            })()
                                                        }}>
                                                            {calculatePokemonHP(diceRoller.selectedPokemon) - (diceRoller.selectedPokemon.currentDamage || 0)}
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const currentDamage = diceRoller.selectedPokemon.currentDamage || 0;
                                                                if (currentDamage > 0) {
                                                                    const newDamage = Math.max(0, currentDamage - 1);
                                                                    updatePokemon(diceRoller.selectedPokemon.id, { currentDamage: newDamage });
                                                                    setDiceRoller(prev => ({
                                                                        ...prev,
                                                                        selectedPokemon: { ...prev.selectedPokemon, currentDamage: newDamage }
                                                                    }));
                                                                }
                                                            }}
                                                            style={{ padding: '5px 10px', background: '#66bb6a', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                                                            title="Heal 1 HP"
                                                        >
                                                            +1
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const currentDamage = diceRoller.selectedPokemon.currentDamage || 0;
                                                                if (currentDamage > 0) {
                                                                    const newDamage = Math.max(0, currentDamage - 10);
                                                                    updatePokemon(diceRoller.selectedPokemon.id, { currentDamage: newDamage });
                                                                    setDiceRoller(prev => ({
                                                                        ...prev,
                                                                        selectedPokemon: { ...prev.selectedPokemon, currentDamage: newDamage }
                                                                    }));
                                                                }
                                                            }}
                                                            style={{ padding: '5px 12px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}
                                                            title="Heal 10 HP"
                                                        >
                                                            +10
                                                        </button>
                                                    </div>
                                                    {/* HP Bar */}
                                                    <div style={{ 
                                                        height: '8px', 
                                                        background: '#e0e0e0', 
                                                        borderRadius: '4px', 
                                                        marginTop: '10px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <div style={{ 
                                                            height: '100%', 
                                                            width: `${Math.max(0, ((calculatePokemonHP(diceRoller.selectedPokemon) - (diceRoller.selectedPokemon.currentDamage || 0)) / calculatePokemonHP(diceRoller.selectedPokemon)) * 100)}%`,
                                                            background: (() => {
                                                                const maxHP = calculatePokemonHP(diceRoller.selectedPokemon);
                                                                const currentHP = maxHP - (diceRoller.selectedPokemon.currentDamage || 0);
                                                                const percent = currentHP / maxHP;
                                                                if (percent <= 0.25) return '#f44336';
                                                                if (percent <= 0.5) return '#ff9800';
                                                                return '#4caf50';
                                                            })(),
                                                            transition: 'all 0.3s'
                                                        }}></div>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                                                        <button
                                                            onClick={() => {
                                                                updatePokemon(diceRoller.selectedPokemon.id, { currentDamage: 0 });
                                                                setDiceRoller(prev => ({
                                                                    ...prev,
                                                                    selectedPokemon: { ...prev.selectedPokemon, currentDamage: 0 }
                                                                }));
                                                            }}
                                                            style={{ padding: '3px 8px', fontSize: '11px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                        >
                                                            Full Heal
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const maxHP = calculatePokemonHP(diceRoller.selectedPokemon);
                                                                updatePokemon(diceRoller.selectedPokemon.id, { currentDamage: maxHP });
                                                                setDiceRoller(prev => ({
                                                                    ...prev,
                                                                    selectedPokemon: { ...prev.selectedPokemon, currentDamage: maxHP }
                                                                }));
                                                            }}
                                                            style={{ padding: '3px 8px', fontSize: '11px', background: '#9e9e9e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                        >
                                                            Fainted (0 HP)
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                <div className="form-group">
                                                    <label>Select Move</label>
                                                    <select
                                                        value={diceRoller.selectedMove?.name || ''}
                                                        onChange={(e) => {
                                                            const move = diceRoller.selectedPokemon.moves.find(m => m.name === e.target.value);
                                                            setDiceRoller(prev => ({ ...prev, selectedMove: move }));
                                                        }}
                                                    >
                                                        <option value="">Choose move...</option>
                                                        {diceRoller.selectedPokemon.moves.map(m => (
                                                            <option key={m.name} value={m.name}>
                                                                {m.name} ({m.type}) - {m.damage || 'Status'} [{m.frequency}]
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                
                                                {diceRoller.selectedMove && (
                                                    <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '12px' }}>
                                                        <div><strong>{diceRoller.selectedMove.name}</strong> - {diceRoller.selectedMove.type}</div>
                                                        <div style={{ color: '#666', marginTop: '4px' }}>
                                                            {diceRoller.selectedMove.category} | {diceRoller.selectedMove.range} | {diceRoller.selectedMove.frequency}
                                                        </div>
                                                        {diceRoller.selectedMove.damage && (() => {
                                                            const actualStats = getActualStats(diceRoller.selectedPokemon);
                                                            const isPhysical = diceRoller.selectedMove.category === 'Physical';
                                                            const statKey = isPhysical ? 'atk' : 'satk';
                                                            const baseStat = isPhysical ? actualStats.atk : actualStats.satk;
                                                            const modifiedStat = applyCombatStage(baseStat, diceRoller.combatStages[statKey]);
                                                            const stabValue = diceRoller.stabApplied ? calculateSTAB(diceRoller.selectedPokemon.level) : 0;
                                                            
                                                            return (
                                                                <div style={{ 
                                                                    marginTop: '8px', 
                                                                    padding: '8px', 
                                                                    background: '#f0f4ff', 
                                                                    borderRadius: '4px',
                                                                    border: '1px solid #d0d8ff'
                                                                }}>
                                                                    <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#333' }}>
                                                                        📊 Damage Calculation:
                                                                    </div>
                                                                    <div style={{ color: '#555' }}>
                                                                        <span style={{ fontWeight: 'bold' }}>{diceRoller.selectedMove.damage}</span>
                                                                        <span style={{ color: isPhysical ? '#f44336' : '#9c27b0' }}>
                                                                            {' '}+ {modifiedStat} {isPhysical ? 'ATK' : 'SATK'}
                                                                        </span>
                                                                        {stabValue > 0 && (
                                                                            <span style={{ color: '#4caf50' }}> + {stabValue} STAB</span>
                                                                        )}
                                                                    </div>
                                                                    <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
                                                                        {isPhysical ? 'Physical moves add ATK stat' : 'Special moves add SATK stat'}
                                                                        {diceRoller.combatStages[statKey] !== 0 && (
                                                                            <span> (includes combat stage modifier)</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                        {diceRoller.selectedMove.effect && (
                                                            <div style={{ color: '#888', marginTop: '4px' }}>Effect: {diceRoller.selectedMove.effect}</div>
                                                        )}
                                                        {diceRoller.selectedMove.description && (
                                                            <div style={{ color: '#555', marginTop: '4px', fontStyle: 'italic' }}>{diceRoller.selectedMove.description}</div>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                <div className="mb-15">
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={diceRoller.stabApplied}
                                                            onChange={(e) => setDiceRoller(prev => ({ ...prev, stabApplied: e.target.checked }))}
                                                        />
                                                        <span>
                                                            Apply STAB 
                                                            <span style={{ 
                                                                background: '#4caf50', 
                                                                color: 'white', 
                                                                padding: '1px 6px', 
                                                                borderRadius: '10px', 
                                                                fontSize: '12px',
                                                                marginLeft: '6px'
                                                            }}>
                                                                +{calculateSTAB(diceRoller.selectedPokemon?.level || 1)} damage
                                                            </span>
                                                        </span>
                                                        {diceRoller.selectedMove && diceRoller.selectedPokemon && hasSTAB(diceRoller.selectedMove.type, diceRoller.selectedPokemon.types) && (
                                                            <span style={{ color: '#4caf50', fontSize: '11px', fontWeight: 'bold' }}>✓ Type matches!</span>
                                                        )}
                                                    </label>
                                                    <div style={{ fontSize: '11px', color: '#888', marginTop: '4px', marginLeft: '24px' }}>
                                                        Same Type Attack Bonus: Add +{calculateSTAB(diceRoller.selectedPokemon?.level || 1)} when move type matches Pokémon type (Lv.{diceRoller.selectedPokemon?.level || 1})
                                                    </div>
                                                </div>
                                                
                                                {/* Combat Stages */}
                                                {(() => {
                                                    const poke = diceRoller.selectedPokemon;
                                                    const actualStats = getActualStats(poke);
                                                    
                                                    return (
                                                        <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '15px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                                <strong className="text-13">⚔️ Combat Stages</strong>
                                                                <button
                                                                    onClick={() => setDiceRoller(prev => ({
                                                                        ...prev,
                                                                        combatStages: { atk: 0, satk: 0, def: 0, sdef: 0, spd: 0, acc: 0, eva: 0 }
                                                                    }))}
                                                                    style={{ padding: '2px 8px', fontSize: '10px', background: '#9e9e9e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                                >
                                                                    Reset All
                                                                </button>
                                                            </div>
                                                            
                                                            {/* Stats with combat stages */}
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
                                                                {[
                                                                    { key: 'atk', label: 'ATK', color: '#e53935', baseStat: actualStats.atk },
                                                                    { key: 'def', label: 'DEF', color: '#fb8c00', baseStat: actualStats.def },
                                                                    { key: 'satk', label: 'SATK', color: '#8e24aa', baseStat: actualStats.satk },
                                                                    { key: 'sdef', label: 'SDEF', color: '#43a047', baseStat: actualStats.sdef },
                                                                    { key: 'spd', label: 'SPD', color: '#1e88e5', baseStat: actualStats.spd }
                                                                ].map(stat => {
                                                                    const stages = diceRoller.combatStages[stat.key];
                                                                    const modifiedStat = applyCombatStage(stat.baseStat, stages);
                                                                    const percentStr = getCombatStagePercent(stages);
                                                                    
                                                                    return (
                                                                        <div key={stat.key} style={{ 
                                                                            textAlign: 'center', 
                                                                            padding: '8px',
                                                                            background: stages !== 0 ? (stages > 0 ? '#e8f5e9' : '#ffebee') : '#f5f5f5',
                                                                            borderRadius: '6px',
                                                                            border: `2px solid ${stages !== 0 ? (stages > 0 ? '#4caf50' : '#f44336') : '#e0e0e0'}`
                                                                        }}>
                                                                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: stat.color, marginBottom: '4px' }}>{stat.label}</div>
                                                                            
                                                                            {/* Base → Modified stat display */}
                                                                            <div style={{ fontSize: '12px', marginBottom: '6px' }}>
                                                                                {stages !== 0 ? (
                                                                                    <>
                                                                                        <span style={{ color: '#999', textDecoration: 'line-through' }}>{stat.baseStat}</span>
                                                                                        <span style={{ margin: '0 4px' }}>→</span>
                                                                                        <span style={{ fontWeight: 'bold', color: stages > 0 ? '#2e7d32' : '#c62828', fontSize: '14px' }}>{modifiedStat}</span>
                                                                                    </>
                                                                                ) : (
                                                                                    <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{stat.baseStat}</span>
                                                                                )}
                                                                            </div>
                                                                            
                                                                            {/* Percentage display */}
                                                                            {stages !== 0 && (
                                                                                <div style={{ fontSize: '10px', color: stages > 0 ? '#2e7d32' : '#c62828', marginBottom: '4px' }}>
                                                                                    ({percentStr})
                                                                                </div>
                                                                            )}
                                                                            
                                                                            {/* Stage controls */}
                                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                                                <button
                                                                                    onClick={() => setDiceRoller(prev => ({
                                                                                        ...prev,
                                                                                        combatStages: { 
                                                                                            ...prev.combatStages, 
                                                                                            [stat.key]: Math.max(-6, prev.combatStages[stat.key] - 1) 
                                                                                        }
                                                                                    }))}
                                                                                    disabled={stages <= -6}
                                                                                    style={{ 
                                                                                        width: '24px', 
                                                                                        height: '24px', 
                                                                                        padding: 0, 
                                                                                        fontSize: '14px', 
                                                                                        background: stages <= -6 ? '#ccc' : '#f44336',
                                                                                        color: 'white',
                                                                                        border: 'none',
                                                                                        borderRadius: '4px',
                                                                                        cursor: stages <= -6 ? 'not-allowed' : 'pointer'
                                                                                    }}
                                                                                >−</button>
                                                                                <span style={{ 
                                                                                    minWidth: '32px', 
                                                                                    textAlign: 'center', 
                                                                                    fontWeight: 'bold',
                                                                                    fontSize: '14px',
                                                                                    color: stages > 0 ? '#4caf50' : stages < 0 ? '#f44336' : '#333'
                                                                                }}>
                                                                                    {stages > 0 ? '+' : ''}{stages}
                                                                                </span>
                                                                                <button
                                                                                    onClick={() => setDiceRoller(prev => ({
                                                                                        ...prev,
                                                                                        combatStages: { 
                                                                                            ...prev.combatStages, 
                                                                                            [stat.key]: Math.min(6, prev.combatStages[stat.key] + 1) 
                                                                                        }
                                                                                    }))}
                                                                                    disabled={stages >= 6}
                                                                                    style={{ 
                                                                                        width: '24px', 
                                                                                        height: '24px', 
                                                                                        padding: 0, 
                                                                                        fontSize: '14px', 
                                                                                        background: stages >= 6 ? '#ccc' : '#4caf50',
                                                                                        color: 'white',
                                                                                        border: 'none',
                                                                                        borderRadius: '4px',
                                                                                        cursor: stages >= 6 ? 'not-allowed' : 'pointer'
                                                                                    }}
                                                                                >+</button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                            
                                                            {/* ACC and EVA row */}
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '12px' }}>
                                                                {[
                                                                    { key: 'acc', label: 'Accuracy', color: '#6d4c41' },
                                                                    { key: 'eva', label: 'Evasion', color: '#00acc1' }
                                                                ].map(stat => {
                                                                    const stages = diceRoller.combatStages[stat.key];
                                                                    const percentStr = getCombatStagePercent(stages);
                                                                    
                                                                    return (
                                                                        <div key={stat.key} style={{ 
                                                                            textAlign: 'center', 
                                                                            padding: '8px',
                                                                            background: stages !== 0 ? (stages > 0 ? '#e8f5e9' : '#ffebee') : '#f5f5f5',
                                                                            borderRadius: '6px',
                                                                            border: `2px solid ${stages !== 0 ? (stages > 0 ? '#4caf50' : '#f44336') : '#e0e0e0'}`
                                                                        }}>
                                                                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: stat.color, marginBottom: '4px' }}>{stat.label}</div>
                                                                            
                                                                            {stages !== 0 && (
                                                                                <div style={{ fontSize: '12px', color: stages > 0 ? '#2e7d32' : '#c62828', marginBottom: '4px' }}>
                                                                                    {percentStr} modifier
                                                                                </div>
                                                                            )}
                                                                            
                                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                                                <button
                                                                                    onClick={() => setDiceRoller(prev => ({
                                                                                        ...prev,
                                                                                        combatStages: { 
                                                                                            ...prev.combatStages, 
                                                                                            [stat.key]: Math.max(-6, prev.combatStages[stat.key] - 1) 
                                                                                        }
                                                                                    }))}
                                                                                    disabled={stages <= -6}
                                                                                    style={{ 
                                                                                        width: '24px', 
                                                                                        height: '24px', 
                                                                                        padding: 0, 
                                                                                        fontSize: '14px', 
                                                                                        background: stages <= -6 ? '#ccc' : '#f44336',
                                                                                        color: 'white',
                                                                                        border: 'none',
                                                                                        borderRadius: '4px',
                                                                                        cursor: stages <= -6 ? 'not-allowed' : 'pointer'
                                                                                    }}
                                                                                >−</button>
                                                                                <span style={{ 
                                                                                    minWidth: '32px', 
                                                                                    textAlign: 'center', 
                                                                                    fontWeight: 'bold',
                                                                                    fontSize: '14px',
                                                                                    color: stages > 0 ? '#4caf50' : stages < 0 ? '#f44336' : '#333'
                                                                                }}>
                                                                                    {stages > 0 ? '+' : ''}{stages}
                                                                                </span>
                                                                                <button
                                                                                    onClick={() => setDiceRoller(prev => ({
                                                                                        ...prev,
                                                                                        combatStages: { 
                                                                                            ...prev.combatStages, 
                                                                                            [stat.key]: Math.min(6, prev.combatStages[stat.key] + 1) 
                                                                                        }
                                                                                    }))}
                                                                                    disabled={stages >= 6}
                                                                                    style={{ 
                                                                                        width: '24px', 
                                                                                        height: '24px', 
                                                                                        padding: 0, 
                                                                                        fontSize: '14px', 
                                                                                        background: stages >= 6 ? '#ccc' : '#4caf50',
                                                                                        color: 'white',
                                                                                        border: 'none',
                                                                                        borderRadius: '4px',
                                                                                        cursor: stages >= 6 ? 'not-allowed' : 'pointer'
                                                                                    }}
                                                                                >+</button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                            
                                                            {/* Speed Skill modifier */}
                                                            {diceRoller.combatStages.spd !== 0 && (
                                                                <div style={{ 
                                                                    background: '#e3f2fd', 
                                                                    padding: '8px', 
                                                                    borderRadius: '6px', 
                                                                    marginBottom: '8px',
                                                                    fontSize: '12px',
                                                                    textAlign: 'center'
                                                                }}>
                                                                    <strong>Speed Skills:</strong> {getSpeedSkillMod(diceRoller.combatStages.spd) >= 0 ? '+' : ''}{getSpeedSkillMod(diceRoller.combatStages.spd)}
                                                                    <span style={{ color: '#666', marginLeft: '8px' }}>
                                                                        (+1 per 2↑, -1 per 3↓, min 1)
                                                                    </span>
                                                                </div>
                                                            )}
                                                            
                                                            {/* Rules reference */}
                                                            <div style={{ fontSize: '10px', color: '#888', textAlign: 'center', borderTop: '1px solid #e0e0e0', paddingTop: '8px' }}>
                                                                <div>📈 Raised: +25% per stage (max +6 = 250%)</div>
                                                                <div>📉 Lowered: -10% per stage (max -6 = 40%)</div>
                                                                <div style={{ marginTop: '4px', fontStyle: 'italic' }}>Stages reset when returned to Pokéball or after ~10 min out of combat</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </>
                                        )}
                                        
                                        <button
                                            className="btn btn-primary"
                                            style={{ width: '100%', marginTop: '10px' }}
                                            disabled={!diceRoller.selectedPokemon || !diceRoller.selectedMove}
                                            onClick={() => {
                                                const poke = diceRoller.selectedPokemon;
                                                const move = diceRoller.selectedMove;
                                                if (!poke || !move) return;
                                                
                                                // Parse damage dice (e.g., "3d12+14", "2d10+8")
                                                const damageStr = move.damage || '';
                                                const diceMatch = damageStr.match(/(\d+)d(\d+)(?:\+(\d+))?/);
                                                
                                                let rolls = [];
                                                let diceTotal = 0;
                                                let diceUsed = damageStr || 'Status Move';
                                                let stabBonus = 0;
                                                let statBonus = 0;
                                                let total = 0;
                                                
                                                if (diceMatch) {
                                                    const numDice = parseInt(diceMatch[1]);
                                                    const dieSize = parseInt(diceMatch[2]);
                                                    const bonus = parseInt(diceMatch[3]) || 0;
                                                    
                                                    // 1. Roll damage dice
                                                    for (let i = 0; i < numDice; i++) {
                                                        const roll = Math.floor(Math.random() * dieSize) + 1;
                                                        rolls.push(roll);
                                                        diceTotal += roll;
                                                    }
                                                    diceTotal += bonus;
                                                    
                                                    // 2. Get the appropriate attack stat (ATK for Physical, SATK for Special)
                                                    // Apply combat stage modifiers first
                                                    const actualStats = getActualStats(poke);
                                                    const baseStat = move.category === 'Physical' ? actualStats.atk : actualStats.satk;
                                                    const stageKey = move.category === 'Physical' ? 'atk' : 'satk';
                                                    const modifiedStat = applyCombatStage(baseStat, diceRoller.combatStages[stageKey]);
                                                    
                                                    // PTA Rules: Add the full stat value, not a D&D-style modifier
                                                    statBonus = modifiedStat;
                                                    
                                                    // 3. Apply STAB if move type matches Pokemon type
                                                    if (diceRoller.stabApplied) {
                                                        stabBonus = calculateSTAB(poke.level);
                                                    }
                                                    
                                                    // Total = Dice Roll + Stat + STAB
                                                    total = diceTotal + statBonus + stabBonus;
                                                }
                                                
                                                // Roll accuracy (d20)
                                                const accRoll = Math.floor(Math.random() * 20) + 1;
                                                const isCrit = accRoll === 20;
                                                
                                                const newRoll = {
                                                    id: Date.now(),
                                                    type: 'pokemon',
                                                    pokemon: poke.name,
                                                    move: move.name,
                                                    moveType: move.type,
                                                    category: move.category,
                                                    dice: diceUsed,
                                                    rolls: rolls,
                                                    diceTotal: diceTotal,
                                                    statBonus: statBonus,
                                                    stabBonus: stabBonus,
                                                    total: total,
                                                    accRoll: accRoll,
                                                    isCrit: isCrit,
                                                    stab: diceRoller.stabApplied,
                                                    timestamp: new Date().toLocaleTimeString()
                                                };
                                                
                                                setDiceRoller(prev => ({
                                                    ...prev,
                                                    rollHistory: [newRoll, ...prev.rollHistory.slice(0, 19)]
                                                }));
                                                sendToDiscord(newRoll);
                                            }}
                                        >
                                            🎲 Roll Move! (Accuracy included)
                                        </button>
                                        
                                        <button
                                            className="btn btn-secondary"
                                            style={{ width: '100%', marginTop: '8px' }}
                                            disabled={!diceRoller.selectedPokemon}
                                            onClick={() => {
                                                const accRoll = Math.floor(Math.random() * 20) + 1;
                                                const newRoll = {
                                                    id: Date.now(),
                                                    type: 'accuracy',
                                                    pokemon: diceRoller.selectedPokemon?.name || 'Unknown',
                                                    dice: '1d20',
                                                    rolls: [accRoll],
                                                    total: accRoll,
                                                    isCrit: accRoll === 20,
                                                    timestamp: new Date().toLocaleTimeString()
                                                };
                                                setDiceRoller(prev => ({
                                                    ...prev,
                                                    rollHistory: [newRoll, ...prev.rollHistory.slice(0, 19)]
                                                }));
                                                sendToDiscord(newRoll);
                                            }}
                                        >
                                            🎯 Accuracy Check Only (d20)
                                        </button>
                                    </>
                                )}
                                
                                {/* Trainer Action Mode */}
                                {diceRoller.mode === 'trainer' && (
                                    <>
                                        <h3 style={{ marginBottom: '15px', color: '#667eea' }}>Trainer Skill Check</h3>
                                        <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
                                            Roll 1d20. If you have the skill: add +2 (+4 if you have it twice) plus your Stat Modifier.
                                        </p>
                                        
                                        <div className="form-group">
                                            <label>Select Skill</label>
                                            <select
                                                value={diceRoller.selectedSkill}
                                                onChange={(e) => setDiceRoller(prev => ({ ...prev, selectedSkill: e.target.value }))}
                                            >
                                                <option value="">Choose skill...</option>
                                                <optgroup label="HP Skills (Passive - No Roll)">
                                                    {Object.entries(GAME_DATA.skills || {}).filter(([_, data]) => data.stat === 'HP').map(([skill, _]) => (
                                                        <option key={skill} value={skill}>{skill}</option>
                                                    ))}
                                                </optgroup>
                                                <optgroup label="Attack Skills">
                                                    {Object.entries(GAME_DATA.skills || {}).filter(([_, data]) => data.stat === 'ATK').map(([skill, _]) => (
                                                        <option key={skill} value={skill}>{skill}</option>
                                                    ))}
                                                </optgroup>
                                                <optgroup label="Defense Skills">
                                                    {Object.entries(GAME_DATA.skills || {}).filter(([_, data]) => data.stat === 'DEF').map(([skill, _]) => (
                                                        <option key={skill} value={skill}>{skill}</option>
                                                    ))}
                                                </optgroup>
                                                <optgroup label="Special Attack Skills">
                                                    {Object.entries(GAME_DATA.skills || {}).filter(([_, data]) => data.stat === 'SATK').map(([skill, _]) => (
                                                        <option key={skill} value={skill}>{skill}</option>
                                                    ))}
                                                </optgroup>
                                                <optgroup label="Special Defense Skills">
                                                    {Object.entries(GAME_DATA.skills || {}).filter(([_, data]) => data.stat === 'SDEF').map(([skill, _]) => (
                                                        <option key={skill} value={skill}>{skill}</option>
                                                    ))}
                                                </optgroup>
                                                <optgroup label="Speed Skills">
                                                    {Object.entries(GAME_DATA.skills || {}).filter(([_, data]) => data.stat === 'SPD').map(([skill, _]) => (
                                                        <option key={skill} value={skill}>{skill}</option>
                                                    ))}
                                                </optgroup>
                                            </select>
                                        </div>
                                        
                                        {diceRoller.selectedSkill && GAME_DATA.skills[diceRoller.selectedSkill] && (
                                            <div style={{ background: '#fff', padding: '12px', borderRadius: '6px', marginBottom: '15px', fontSize: '12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                    <strong>{diceRoller.selectedSkill}</strong>
                                                    <span style={{ 
                                                        background: GAME_DATA.skills[diceRoller.selectedSkill].stat === 'HP' ? '#4caf50' : 
                                                                   GAME_DATA.skills[diceRoller.selectedSkill].stat === 'ATK' ? '#f44336' :
                                                                   GAME_DATA.skills[diceRoller.selectedSkill].stat === 'DEF' ? '#2196f3' :
                                                                   GAME_DATA.skills[diceRoller.selectedSkill].stat === 'SATK' ? '#9c27b0' :
                                                                   GAME_DATA.skills[diceRoller.selectedSkill].stat === 'SDEF' ? '#ff9800' :
                                                                   GAME_DATA.skills[diceRoller.selectedSkill].stat === 'SPD' ? '#00bcd4' : '#666',
                                                        color: 'white',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        fontSize: '10px'
                                                    }}>
                                                        {GAME_DATA.skills[diceRoller.selectedSkill].stat}
                                                    </span>
                                                    <span style={{ 
                                                        background: '#eee',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        fontSize: '10px'
                                                    }}>
                                                        {GAME_DATA.skills[diceRoller.selectedSkill].type}
                                                    </span>
                                                </div>
                                                <div style={{ color: '#555' }}>
                                                    {GAME_DATA.skills[diceRoller.selectedSkill].description}
                                                </div>
                                                {GAME_DATA.skills[diceRoller.selectedSkill].stat === 'HP' && (
                                                    <div style={{ color: '#4caf50', marginTop: '8px', fontWeight: 'bold' }}>
                                                        ⚡ Passive ability - no roll needed!
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        
                                        <div style={{ background: '#e3f2fd', padding: '12px', borderRadius: '6px', marginBottom: '15px' }}>
                                            <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Your Bonuses:</div>
                                            {(() => {
                                                const skillData = GAME_DATA.skills[diceRoller.selectedSkill];
                                                const statModMap = { 
                                                    'HP': 0, 
                                                    'ATK': calculateModifier(trainer.stats.atk), 
                                                    'DEF': calculateModifier(trainer.stats.def), 
                                                    'SATK': calculateModifier(trainer.stats.satk), 
                                                    'SDEF': calculateModifier(trainer.stats.sdef), 
                                                    'SPD': calculateModifier(trainer.stats.spd) 
                                                };
                                                const hasSkill = trainer.skills.includes(diceRoller.selectedSkill);
                                                const skillCount = trainer.skills.filter(s => s === diceRoller.selectedSkill).length;
                                                const skillBonus = hasSkill ? 2 * Math.min(skillCount, 2) : 0;
                                                const statMod = skillData ? statModMap[skillData.stat] || 0 : 0;
                                                const totalBonus = hasSkill ? skillBonus + statMod : 0;
                                                
                                                return (
                                                    <div className="text-12">
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                            <span>Have Skill:</span>
                                                            <span style={{ color: hasSkill ? '#4caf50' : '#f44336', fontWeight: 'bold' }}>
                                                                {hasSkill ? `Yes (x${skillCount})` : 'No'}
                                                            </span>
                                                        </div>
                                                        {hasSkill && (
                                                            <>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                                    <span>Skill Bonus:</span>
                                                                    <span>+{skillBonus}</span>
                                                                </div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                                    <span>{skillData?.stat} Modifier:</span>
                                                                    <span>{statMod >= 0 ? '+' : ''}{statMod}</span>
                                                                </div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #90caf9', paddingTop: '4px', fontWeight: 'bold' }}>
                                                                    <span>Total Bonus:</span>
                                                                    <span style={{ color: '#1976d2' }}>+{totalBonus}</span>
                                                                </div>
                                                            </>
                                                        )}
                                                        {!hasSkill && diceRoller.selectedSkill && (
                                                            <div style={{ color: '#f44336', marginTop: '4px' }}>
                                                                Without the skill, roll plain 1d20 (no bonuses).
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        
                                        <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '11px' }}>
                                            <div><strong>Your Stats & Modifiers:</strong></div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', marginTop: '6px' }}>
                                                <span>ATK: {trainer.stats?.atk || 10} ({calculateModifier(trainer.stats?.atk || 10) >= 0 ? '+' : ''}{calculateModifier(trainer.stats?.atk || 10)})</span>
                                                <span>DEF: {trainer.stats?.def || 10} ({calculateModifier(trainer.stats?.def || 10) >= 0 ? '+' : ''}{calculateModifier(trainer.stats?.def || 10)})</span>
                                                <span>SATK: {trainer.stats?.satk || 10} ({calculateModifier(trainer.stats?.satk || 10) >= 0 ? '+' : ''}{calculateModifier(trainer.stats?.satk || 10)})</span>
                                                <span>SDEF: {trainer.stats?.sdef || 10} ({calculateModifier(trainer.stats?.sdef || 10) >= 0 ? '+' : ''}{calculateModifier(trainer.stats?.sdef || 10)})</span>
                                                <span>SPD: {trainer.stats?.spd || 10} ({calculateModifier(trainer.stats?.spd || 10) >= 0 ? '+' : ''}{calculateModifier(trainer.stats?.spd || 10)})</span>
                                            </div>
                                        </div>
                                        
                                        <button
                                            className="btn btn-primary"
                                            style={{ width: '100%', marginTop: '10px' }}
                                            disabled={!diceRoller.selectedSkill || GAME_DATA.skills[diceRoller.selectedSkill]?.stat === 'HP'}
                                            onClick={() => {
                                                const skillData = GAME_DATA.skills[diceRoller.selectedSkill];
                                                const statModMap = { 
                                                    'HP': 0, 
                                                    'ATK': calculateModifier(trainer.stats.atk), 
                                                    'DEF': calculateModifier(trainer.stats.def), 
                                                    'SATK': calculateModifier(trainer.stats.satk), 
                                                    'SDEF': calculateModifier(trainer.stats.sdef), 
                                                    'SPD': calculateModifier(trainer.stats.spd) 
                                                };
                                                const hasSkill = trainer.skills.includes(diceRoller.selectedSkill);
                                                const skillCount = trainer.skills.filter(s => s === diceRoller.selectedSkill).length;
                                                const skillBonus = hasSkill ? 2 * Math.min(skillCount, 2) : 0;
                                                const statMod = skillData ? statModMap[skillData.stat] || 0 : 0;
                                                const totalBonus = hasSkill ? skillBonus + statMod : 0;
                                                
                                                const roll = Math.floor(Math.random() * 20) + 1;
                                                const total = roll + totalBonus;
                                                
                                                const newRoll = {
                                                    id: Date.now(),
                                                    type: 'trainer_skill',
                                                    skill: diceRoller.selectedSkill,
                                                    skillStat: skillData?.stat,
                                                    hasSkill: hasSkill,
                                                    dice: hasSkill ? `1d20+${totalBonus}` : '1d20',
                                                    rolls: [roll],
                                                    bonus: totalBonus,
                                                    total: total,
                                                    isCrit: roll === 20,
                                                    isFumble: roll === 1,
                                                    timestamp: new Date().toLocaleTimeString()
                                                };
                                                
                                                setDiceRoller(prev => ({
                                                    ...prev,
                                                    rollHistory: [newRoll, ...prev.rollHistory.slice(0, 19)]
                                                }));
                                                sendToDiscord(newRoll);
                                            }}
                                        >
                                            🎲 Roll Skill Check (1d20)
                                        </button>
                                        
                                        <button
                                            className="btn btn-secondary"
                                            style={{ width: '100%', marginTop: '8px' }}
                                            onClick={() => {
                                                const roll = Math.floor(Math.random() * 20) + 1;
                                                const newRoll = {
                                                    id: Date.now(),
                                                    type: 'trainer_d20',
                                                    skill: 'Flat Check (No Skill)',
                                                    dice: '1d20',
                                                    rolls: [roll],
                                                    total: roll,
                                                    isCrit: roll === 20,
                                                    isFumble: roll === 1,
                                                    timestamp: new Date().toLocaleTimeString()
                                                };
                                                setDiceRoller(prev => ({
                                                    ...prev,
                                                    rollHistory: [newRoll, ...prev.rollHistory.slice(0, 19)]
                                                }));
                                                sendToDiscord(newRoll);
                                            }}
                                        >
                                            🎯 Flat d20 (No Skill Bonus)
                                        </button>
                                    </>
                                )}
                                
                                {/* Pokemon Skill Mode */}
                                {diceRoller.mode === 'pokemonSkill' && (
                                    <>
                                        <h3 style={{ marginBottom: '15px', color: '#667eea' }}>Pokémon Skill Check</h3>
                                        
                                        <div className="form-group">
                                            <label>Select Pokémon (Active Party Only)</label>
                                            <select
                                                value={diceRoller.selectedPokemon?.id || ''}
                                                onChange={(e) => {
                                                    const poke = party.find(p => p.id === parseInt(e.target.value));
                                                    setDiceRoller(prev => ({ ...prev, selectedPokemon: poke, selectedPokemonSkill: null }));
                                                }}
                                            >
                                                <option value="">Choose Pokémon...</option>
                                                {party.length > 0 ? (
                                                    party.map(p => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.name} (Lv.{p.level})
                                                        </option>
                                                    ))
                                                ) : (
                                                    <option disabled>No Pokémon in active party</option>
                                                )}
                                            </select>
                                        </div>
                                        
                                        {diceRoller.selectedPokemon && (
                                            <>
                                                {/* Pokemon's Skills */}
                                                {(diceRoller.selectedPokemon.pokemonSkills || []).length > 0 ? (
                                                    <div className="mb-15">
                                                        <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                                                            {diceRoller.selectedPokemon.name}'s Skills
                                                        </label>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            {(diceRoller.selectedPokemon.pokemonSkills || []).map((skill, idx) => {
                                                                const skillData = GAME_DATA.pokemonSkills[skill.name];
                                                                const isSelected = diceRoller.selectedPokemonSkill?.name === skill.name;
                                                                return (
                                                                    <button
                                                                        key={idx}
                                                                        onClick={() => setDiceRoller(prev => ({ 
                                                                            ...prev, 
                                                                            selectedPokemonSkill: skill 
                                                                        }))}
                                                                        style={{
                                                                            padding: '10px 12px',
                                                                            background: isSelected ? '#667eea' : (skillData?.type === 'speed' ? '#e3f2fd' : '#f5f5f5'),
                                                                            color: isSelected ? 'white' : '#333',
                                                                            border: isSelected ? '2px solid #5568d8' : '2px solid transparent',
                                                                            borderRadius: '8px',
                                                                            cursor: 'pointer',
                                                                            textAlign: 'left',
                                                                            transition: 'all 0.2s'
                                                                        }}
                                                                    >
                                                                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                                                            {skill.name}
                                                                            {skill.value && (
                                                                                <span style={{ 
                                                                                    marginLeft: '8px', 
                                                                                    background: isSelected ? 'rgba(255,255,255,0.2)' : '#667eea',
                                                                                    color: 'white',
                                                                                    padding: '2px 8px',
                                                                                    borderRadius: '10px',
                                                                                    fontSize: '12px'
                                                                                }}>
                                                                                    {skill.value}
                                                                                </span>
                                                                            )}
                                                                            {skillData?.type === 'speed' && (
                                                                                <span style={{ 
                                                                                    marginLeft: '8px', 
                                                                                    fontSize: '10px', 
                                                                                    background: isSelected ? 'rgba(255,255,255,0.2)' : '#2196f3', 
                                                                                    color: 'white', 
                                                                                    padding: '2px 6px', 
                                                                                    borderRadius: '8px' 
                                                                                }}>
                                                                                    Speed
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {skillData?.description && (
                                                                            <div style={{ 
                                                                                fontSize: '11px', 
                                                                                color: isSelected ? 'rgba(255,255,255,0.8)' : '#666', 
                                                                                marginTop: '4px',
                                                                                lineHeight: '1.3'
                                                                            }}>
                                                                                {skillData.description.substring(0, 100)}...
                                                                            </div>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ 
                                                        background: '#fff3e0', 
                                                        padding: '15px', 
                                                        borderRadius: '8px', 
                                                        marginBottom: '15px',
                                                        textAlign: 'center'
                                                    }}>
                                                        <p style={{ color: '#e65100', fontWeight: 'bold' }}>No Skills Assigned</p>
                                                        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                                                            Add skills to {diceRoller.selectedPokemon.name} in the Pokémon tab to roll skill checks.
                                                        </p>
                                                    </div>
                                                )}
                                                
                                                {diceRoller.selectedPokemonSkill && (
                                                    <div style={{ 
                                                        background: '#e8f5e9', 
                                                        padding: '12px', 
                                                        borderRadius: '8px', 
                                                        marginBottom: '15px' 
                                                    }}>
                                                        <div style={{ fontWeight: 'bold', color: '#2e7d32' }}>
                                                            Selected: {diceRoller.selectedPokemonSkill.name}
                                                            {diceRoller.selectedPokemonSkill.value && ` (Value: ${diceRoller.selectedPokemonSkill.value})`}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                                            Roll 1d20 for skill check. GM determines DC.
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Quick Skill Rolls */}
                                                <div className="mb-15">
                                                    <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                                                        Common Skill Checks
                                                    </label>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                                        {[
                                                            { name: 'Perception', desc: 'Notice things' },
                                                            { name: 'Stealth', desc: 'Move quietly' },
                                                            { name: 'Athletics', desc: 'Physical feats' },
                                                            { name: 'Tracker', desc: 'Follow scents' }
                                                        ].map(skill => (
                                                            <button
                                                                key={skill.name}
                                                                className="btn btn-secondary"
                                                                style={{ padding: '8px', fontSize: '11px' }}
                                                                onClick={() => {
                                                                    const roll = Math.floor(Math.random() * 20) + 1;
                                                                    const newRoll = {
                                                                        id: Date.now(),
                                                                        type: 'pokemonSkill',
                                                                        pokemon: diceRoller.selectedPokemon.name,
                                                                        skill: skill.name,
                                                                        dice: '1d20',
                                                                        rolls: [roll],
                                                                        total: roll,
                                                                        isCrit: roll === 20,
                                                                        isFail: roll === 1,
                                                                        timestamp: new Date().toLocaleTimeString()
                                                                    };
                                                                    setDiceRoller(prev => ({
                                                                        ...prev,
                                                                        rollHistory: [newRoll, ...prev.rollHistory.slice(0, 19)]
                                                                    }));
                                                                    sendToDiscord(newRoll);
                                                                }}
                                                            >
                                                                {skill.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        
                                        <button
                                            className="btn btn-primary"
                                            style={{ width: '100%', marginTop: '10px' }}
                                            disabled={!diceRoller.selectedPokemon || !diceRoller.selectedPokemonSkill}
                                            onClick={() => {
                                                const poke = diceRoller.selectedPokemon;
                                                const skill = diceRoller.selectedPokemonSkill;
                                                if (!poke || !skill) return;
                                                
                                                const roll = Math.floor(Math.random() * 20) + 1;
                                                const skillData = GAME_DATA.pokemonSkills[skill.name];
                                                
                                                // For speed skills, add the skill value as a modifier
                                                const modifier = skill.value || 0;
                                                const total = roll + modifier;
                                                
                                                const newRoll = {
                                                    id: Date.now(),
                                                    type: 'pokemonSkill',
                                                    pokemon: poke.name,
                                                    skill: skill.name,
                                                    skillValue: skill.value,
                                                    skillType: skillData?.type,
                                                    dice: skill.value ? `1d20+${skill.value}` : '1d20',
                                                    rolls: [roll],
                                                    modifier: modifier,
                                                    total: total,
                                                    isCrit: roll === 20,
                                                    isFail: roll === 1,
                                                    timestamp: new Date().toLocaleTimeString()
                                                };
                                                
                                                setDiceRoller(prev => ({
                                                    ...prev,
                                                    rollHistory: [newRoll, ...prev.rollHistory.slice(0, 19)]
                                                }));
                                                sendToDiscord(newRoll);
                                            }}
                                        >
                                            🎲 Roll Skill Check
                                        </button>
                                        
                                        <button
                                            className="btn btn-secondary"
                                            style={{ width: '100%', marginTop: '8px' }}
                                            disabled={!diceRoller.selectedPokemon}
                                            onClick={() => {
                                                const poke = diceRoller.selectedPokemon;
                                                if (!poke) return;
                                                
                                                const roll = Math.floor(Math.random() * 20) + 1;
                                                
                                                const newRoll = {
                                                    id: Date.now(),
                                                    type: 'pokemonSkill',
                                                    pokemon: poke.name,
                                                    skill: 'Generic Check',
                                                    dice: '1d20',
                                                    rolls: [roll],
                                                    total: roll,
                                                    isCrit: roll === 20,
                                                    isFail: roll === 1,
                                                    timestamp: new Date().toLocaleTimeString()
                                                };
                                                
                                                setDiceRoller(prev => ({
                                                    ...prev,
                                                    rollHistory: [newRoll, ...prev.rollHistory.slice(0, 19)]
                                                }));
                                                sendToDiscord(newRoll);
                                            }}
                                        >
                                            🎯 Flat d20 (No Modifier)
                                        </button>
                                    </>
                                )}
                                
                                {/* Custom Roll Mode */}
                                {diceRoller.mode === 'custom' && (
                                    <>
                                        <h3 style={{ marginBottom: '15px', color: '#667eea' }}>Custom Dice Roll</h3>
                                        
                                        <div className="form-group">
                                            <label>Dice Expression</label>
                                            <input 
                                                type="text"
                                                placeholder="e.g., 2d6+3, 1d20, 4d8-2"
                                                value={diceRoller.customDice}
                                                onChange={(e) => setDiceRoller(prev => ({ ...prev, customDice: e.target.value }))}
                                            />
                                            <small style={{ color: '#666', fontSize: '11px' }}>
                                                Format: XdY+Z (e.g., 3d6+2, 1d20, 2d10-1)
                                            </small>
                                        </div>
                                        
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '15px' }}>
                                            {['1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '2d6', '1d100'].map(dice => (
                                                <button
                                                    key={dice}
                                                    className="btn btn-secondary"
                                                    style={{ padding: '8px', fontSize: '12px' }}
                                                    onClick={() => setDiceRoller(prev => ({ ...prev, customDice: dice }))}
                                                >
                                                    {dice}
                                                </button>
                                            ))}
                                        </div>
                                        
                                        <button
                                            className="btn btn-primary"
                                            style={{ width: '100%', marginTop: '10px' }}
                                            onClick={() => {
                                                const expr = diceRoller.customDice;
                                                const match = expr.match(/(\d+)d(\d+)(?:([+-])(\d+))?/i);
                                                
                                                if (!match) {
                                                    alert('Invalid dice format. Use format like 2d6+3');
                                                    return;
                                                }
                                                
                                                const numDice = parseInt(match[1]);
                                                const dieSize = parseInt(match[2]);
                                                const modSign = match[3] || '+';
                                                const modifier = parseInt(match[4]) || 0;
                                                
                                                let rolls = [];
                                                let total = 0;
                                                
                                                for (let i = 0; i < numDice; i++) {
                                                    const roll = Math.floor(Math.random() * dieSize) + 1;
                                                    rolls.push(roll);
                                                    total += roll;
                                                }
                                                
                                                total += modSign === '-' ? -modifier : modifier;
                                                
                                                const newRoll = {
                                                    id: Date.now(),
                                                    type: 'custom',
                                                    dice: expr,
                                                    rolls: rolls,
                                                    total: total,
                                                    isCrit: dieSize === 20 && numDice === 1 && rolls[0] === 20,
                                                    isFumble: dieSize === 20 && numDice === 1 && rolls[0] === 1,
                                                    timestamp: new Date().toLocaleTimeString()
                                                };
                                                
                                                setDiceRoller(prev => ({
                                                    ...prev,
                                                    rollHistory: [newRoll, ...prev.rollHistory.slice(0, 19)]
                                                }));
                                                sendToDiscord(newRoll);
                                            }}
                                        >
                                            🎲 Roll Custom Dice!
                                        </button>
                                    </>
                                )}
                            </div>
                            
                            {/* Right Panel - Roll History */}
                            <div className="section-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <h3 className="text-purple">Roll History</h3>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '4px 10px', fontSize: '12px' }}
                                        onClick={() => setDiceRoller(prev => ({ ...prev, rollHistory: [] }))}
                                    >
                                        Clear
                                    </button>
                                </div>
                                
                                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                    {diceRoller.rollHistory.length === 0 ? (
                                        <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                                            No rolls yet. Make a roll to see results here!
                                        </div>
                                    ) : (
                                        diceRoller.rollHistory.map((roll, index) => (
                                            <div 
                                                key={roll.id}
                                                style={{ 
                                                    background: index === 0 ? '#fff' : '#fafafa',
                                                    border: index === 0 ? '2px solid #667eea' : '1px solid #dee2e6',
                                                    borderRadius: '8px',
                                                    padding: '12px',
                                                    marginBottom: '10px',
                                                    transition: 'all 0.3s ease'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div>
                                                        {roll.type === 'pokemon' && (
                                                            <>
                                                                <div className="text-bold-dark">
                                                                    {roll.pokemon}: {roll.move}
                                                                </div>
                                                                <div className="text-muted-sm">
                                                                    {roll.moveType} | {roll.category} | {roll.dice}
                                                                </div>
                                                            </>
                                                        )}
                                                        {roll.type === 'accuracy' && (
                                                            <div className="text-bold-dark">
                                                                {roll.pokemon}: Accuracy Check
                                                            </div>
                                                        )}
                                                        {roll.type === 'trainer' && (
                                                            <div className="text-bold-dark">
                                                                Trainer: {roll.skill} Check
                                                            </div>
                                                        )}
                                                        {roll.type === 'trainer_skill' && (
                                                            <>
                                                                <div className="text-bold-dark">
                                                                    Trainer: {roll.skill}
                                                                    {roll.skillStat && (
                                                                        <span style={{ 
                                                                            background: roll.skillStat === 'ATK' ? '#f44336' :
                                                                                       roll.skillStat === 'DEF' ? '#2196f3' :
                                                                                       roll.skillStat === 'SATK' ? '#9c27b0' :
                                                                                       roll.skillStat === 'SDEF' ? '#ff9800' :
                                                                                       roll.skillStat === 'SPD' ? '#00bcd4' : '#666',
                                                                            color: 'white',
                                                                            padding: '1px 5px',
                                                                            borderRadius: '4px',
                                                                            fontSize: '10px',
                                                                            marginLeft: '6px'
                                                                        }}>
                                                                            {roll.skillStat}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-muted-sm">
                                                                    {roll.hasSkill ? `Has skill (+${roll.bonus} bonus)` : 'No skill (flat roll)'}
                                                                </div>
                                                            </>
                                                        )}
                                                        {roll.type === 'trainer_d20' && (
                                                            <div className="text-bold-dark">
                                                                Trainer: {roll.skill}
                                                            </div>
                                                        )}
                                                        {roll.type === 'custom' && (
                                                            <div className="text-bold-dark">
                                                                Custom: {roll.dice}
                                                            </div>
                                                        )}
                                                        {roll.type === 'pokemonSkill' && (
                                                            <>
                                                                <div className="text-bold-dark">
                                                                    {roll.pokemon}: {roll.skill}
                                                                    {roll.skillType === 'speed' && (
                                                                        <span style={{ 
                                                                            background: '#2196f3',
                                                                            color: 'white',
                                                                            padding: '1px 5px',
                                                                            borderRadius: '4px',
                                                                            fontSize: '10px',
                                                                            marginLeft: '6px'
                                                                        }}>
                                                                            Speed
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {roll.skillValue && (
                                                                    <div className="text-muted-sm">
                                                                        Skill Value: {roll.skillValue} (+{roll.modifier} modifier)
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '10px', color: '#999' }}>
                                                        {roll.timestamp}
                                                    </div>
                                                </div>
                                                
                                                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ 
                                                        fontSize: '28px', 
                                                        fontWeight: 'bold',
                                                        color: roll.isCrit ? '#4caf50' : (roll.isFumble || roll.isFail) ? '#f44336' : '#667eea'
                                                    }}>
                                                        {roll.total}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                                        {/* Pokemon move damage breakdown */}
                                                        {roll.type === 'pokemon' && roll.diceTotal !== undefined ? (
                                                            <span>
                                                                [{roll.rolls.join(' + ')}] = {roll.diceTotal}
                                                                {roll.statBonus > 0 && (
                                                                    <span style={{ color: roll.category === 'Physical' ? '#f44336' : '#9c27b0' }}>
                                                                        {' '}+ {roll.statBonus} {roll.category === 'Physical' ? 'ATK' : 'SATK'}
                                                                    </span>
                                                                )}
                                                                {roll.stabBonus > 0 && (
                                                                    <span style={{ color: '#4caf50' }}> + {roll.stabBonus} STAB</span>
                                                                )}
                                                            </span>
                                                        ) : (
                                                            <span>
                                                                [{roll.rolls.join(' + ')}]
                                                                {roll.modifier > 0 && <span> +{roll.modifier}</span>}
                                                                {roll.stab && <span className="text-green"> +STAB</span>}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {roll.isCrit && roll.type === 'pokemonSkill' && (
                                                    <div style={{ marginTop: '4px', fontSize: '12px', color: '#4caf50', fontWeight: 'bold' }}>
                                                        🎯 NATURAL 20!
                                                    </div>
                                                )}
                                                
                                                {roll.isFail && roll.type === 'pokemonSkill' && (
                                                    <div style={{ marginTop: '4px', fontSize: '12px', color: '#f44336', fontWeight: 'bold' }}>
                                                        💥 NATURAL 1!
                                                    </div>
                                                )}
                                                
                                                {roll.accRoll && (
                                                    <div style={{ marginTop: '6px', fontSize: '12px', color: '#666' }}>
                                                        Accuracy: <strong style={{ color: roll.isCrit ? '#4caf50' : '#333' }}>{roll.accRoll}</strong>
                                                        {roll.isCrit && <span style={{ color: '#4caf50', fontWeight: 'bold' }}> CRITICAL HIT!</span>}
                                                    </div>
                                                )}
                                                
                                                {roll.isCrit && !roll.accRoll && (
                                                    <div style={{ color: '#4caf50', fontWeight: 'bold', fontSize: '12px', marginTop: '4px' }}>
                                                        🎯 NATURAL 20!
                                                    </div>
                                                )}
                                                {roll.isFumble && (
                                                    <div style={{ color: '#f44336', fontWeight: 'bold', fontSize: '12px', marginTop: '4px' }}>
                                                        💀 NATURAL 1!
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Quick Reference */}
                        <div className="section-card" style={{ marginTop: '20px' }}>
                            <h4>P:TA Dice Reference</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginTop: '10px', fontSize: '13px' }}>
                                <div>
                                    <strong>Accuracy Check:</strong> Roll 1d20 + Accuracy - Target's Evasion ≥ Move's AC
                                    <br/><span className="text-muted">Natural 20 = Critical Hit (check move for crit range)</span>
                                </div>
                                <div>
                                    <strong>Damage:</strong> Roll damage dice + stat modifier + STAB
                                    <br/><span className="text-muted">Physical uses ATK, Special uses SATK</span>
                                </div>
                                <div>
                                    <strong>Skill Check:</strong> Roll Xd6 (X = skill rank) + stat modifier
                                    <br/><span className="text-muted">Compare to DC set by GM</span>
                                </div>
                                <div>
                                    <strong>Combat Stages:</strong> Each stage = ±2 to relevant rolls
                                    <br/><span className="text-muted">Range: -6 to +6</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* ========== QUICK REFERENCE TAB ========== */}
                {activeTab === 'reference' && (
                    <div>
                        <h2 className="section-title">Quick Reference</h2>
                        
                        <div className="tabs">
                            <button className={`tab ${referenceTab === 'types' ? 'active' : ''}`} onClick={() => setReferenceTab('types')}>Type Chart</button>
                            <button className={`tab ${referenceTab === 'natures' ? 'active' : ''}`} onClick={() => setReferenceTab('natures')}>Natures</button>
                            <button className={`tab ${referenceTab === 'moves' ? 'active' : ''}`} onClick={() => setReferenceTab('moves')}>Moves Database</button>
                            <button className={`tab ${referenceTab === 'abilities' ? 'active' : ''}`} onClick={() => setReferenceTab('abilities')}>Abilities</button>
                            <button className={`tab ${referenceTab === 'rules' ? 'active' : ''}`} onClick={() => setReferenceTab('rules')}>Game Rules</button>
                            <button className={`tab ${referenceTab === 'exp' ? 'active' : ''}`} onClick={() => setReferenceTab('exp')}>EXP Chart</button>
                        </div>
                        
                        {referenceTab === 'types' && (
                            <div>
                                <h3>Type Effectiveness Chart</h3>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', fontSize: '14px' }}>
                                        <thead>
                                            <tr style={{ background: '#f8f9fa' }}>
                                                <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>Type</th>
                                                <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>Weak To (2×)</th>
                                                <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>Resists (0.5×)</th>
                                                <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>Immune (0×)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(typeChart).map(([type, data]) => (
                                                <tr key={type}>
                                                    <td className="ref-cell-header">
                                                        <span className={`type-badge type-${type.toLowerCase()}`}>{type}</span>
                                                    </td>
                                                    <td style={{ padding: '8px', border: '1px solid #dee2e6', color: '#f44336' }}>
                                                        {data.weak.join(', ') || '—'}
                                                    </td>
                                                    <td style={{ padding: '8px', border: '1px solid #dee2e6', color: '#4caf50' }}>
                                                        {data.resist.join(', ') || '—'}
                                                    </td>
                                                    <td style={{ padding: '8px', border: '1px solid #dee2e6', color: '#2196f3' }}>
                                                        {data.immune.join(', ') || '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        
                        {referenceTab === 'natures' && (
                            <div>
                                <h3>Nature Effects (35 Natures)</h3>
                                <p style={{ marginBottom: '15px', fontSize: '13px', color: '#666' }}>
                                    Natures modify base stats by +1/-1. HP modifications are always just +1 or -1 to the HP Base Stat.
                                </p>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                        <thead>
                                            <tr style={{ background: '#667eea', color: 'white' }}>
                                                <th style={{ padding: '10px', textAlign: 'left' }}>Nature</th>
                                                <th style={{ padding: '10px', textAlign: 'center' }}>Raises</th>
                                                <th style={{ padding: '10px', textAlign: 'center' }}>Lowers</th>
                                                <th style={{ padding: '10px', textAlign: 'center' }}>Likes</th>
                                                <th style={{ padding: '10px', textAlign: 'center' }}>Dislikes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(GAME_DATA.natures).map(([nature, data], index) => (
                                                <tr key={nature} style={{ background: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                                                    <td style={{ padding: '8px', fontWeight: 'bold' }}>{nature}</td>
                                                    <td style={{ padding: '8px', textAlign: 'center', color: '#4caf50' }}>
                                                        {data.buff ? data.buff.toUpperCase() : '—'}
                                                    </td>
                                                    <td style={{ padding: '8px', textAlign: 'center', color: '#f44336' }}>
                                                        {data.nerf ? data.nerf.toUpperCase() : '—'}
                                                    </td>
                                                    <td style={{ padding: '8px', textAlign: 'center' }}>
                                                        {data.likedFlavor || 'None'}
                                                    </td>
                                                    <td style={{ padding: '8px', textAlign: 'center' }}>
                                                        {data.dislikedFlavor || 'None'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        
                        {referenceTab === 'moves' && (
                            <div>
                                <h3 style={{ marginBottom: '15px' }}>Moves Database ({Object.keys(GAME_DATA.moves).length} moves)</h3>
                                
                                {/* Search and Filters */}
                                <div className="section-card" style={{ marginBottom: '15px' }}>
                                    {/* Search Bar */}
                                    <div style={{ marginBottom: '12px' }}>
                                        <input
                                            type="text"
                                            placeholder="🔍 Search by name, effect, or description..."
                                            value={movesFilter.search}
                                            onChange={(e) => setMovesFilter(prev => ({ ...prev, search: e.target.value }))}
                                            style={{ width: '100%', padding: '10px 15px', borderRadius: '8px', border: '2px solid #dee2e6', fontSize: '14px' }}
                                        />
                                    </div>
                                    
                                    {/* Filter Row */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                                        {/* Type Filter */}
                                        <select
                                            value={movesFilter.type}
                                            onChange={(e) => setMovesFilter(prev => ({ ...prev, type: e.target.value }))}
                                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px', background: movesFilter.type ? getTypeColor(movesFilter.type) : 'white', color: movesFilter.type ? 'white' : '#333' }}
                                        >
                                            <option value="">All Types</option>
                                            {['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'].map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                        
                                        {/* Category Filter */}
                                        <select
                                            value={movesFilter.category}
                                            onChange={(e) => setMovesFilter(prev => ({ ...prev, category: e.target.value }))}
                                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }}
                                        >
                                            <option value="">All Categories</option>
                                            <option value="Physical">Physical (ATK)</option>
                                            <option value="Special">Special (SATK)</option>
                                            <option value="Status">Status</option>
                                        </select>
                                        
                                        {/* Frequency Filter */}
                                        <select
                                            value={movesFilter.frequency}
                                            onChange={(e) => setMovesFilter(prev => ({ ...prev, frequency: e.target.value }))}
                                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }}
                                        >
                                            <option value="">All Frequencies</option>
                                            <option value="At-Will">At-Will</option>
                                            <option value="EOT">EOT (Every Other Turn)</option>
                                            <option value="Battle">Battle (1/battle)</option>
                                            <option value="Center">Center (1/center)</option>
                                            <option value="Daily">Daily</option>
                                        </select>
                                        
                                        {/* Sort By */}
                                        <select
                                            value={movesFilter.sortBy}
                                            onChange={(e) => setMovesFilter(prev => ({ ...prev, sortBy: e.target.value }))}
                                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }}
                                        >
                                            <option value="name">Sort: Name</option>
                                            <option value="type">Sort: Type</option>
                                            <option value="category">Sort: Category</option>
                                            <option value="damage">Sort: Damage</option>
                                        </select>
                                        
                                        {/* Sort Direction */}
                                        <button
                                            onClick={() => setMovesFilter(prev => ({ ...prev, sortDir: prev.sortDir === 'asc' ? 'desc' : 'asc' }))}
                                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', background: '#fff', cursor: 'pointer', fontSize: '13px' }}
                                        >
                                            {movesFilter.sortDir === 'asc' ? '↑ A-Z' : '↓ Z-A'}
                                        </button>
                                        
                                        {/* Clear Filters */}
                                        {(movesFilter.search || movesFilter.type || movesFilter.category || movesFilter.frequency) && (
                                            <button
                                                onClick={() => setMovesFilter({ search: '', type: '', category: '', frequency: '', sortBy: 'name', sortDir: 'asc' })}
                                                style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', background: '#dc3545', color: 'white', cursor: 'pointer', fontSize: '13px' }}
                                            >
                                                ✕ Clear
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Quick Type Buttons */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '15px' }}>
                                    {['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setMovesFilter(prev => ({ ...prev, type: prev.type === type ? '' : type }))}
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                border: movesFilter.type === type ? '2px solid #333' : '1px solid transparent',
                                                background: getTypeColor(type),
                                                color: ['Electric', 'Ice', 'Ground', 'Steel'].includes(type) ? '#333' : 'white',
                                                cursor: 'pointer',
                                                fontSize: '10px',
                                                fontWeight: 'bold',
                                                opacity: movesFilter.type && movesFilter.type !== type ? 0.5 : 1
                                            }}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                                
                                {/* Results Count */}
                                {(() => {
                                    const filteredMoves = Object.entries(GAME_DATA.moves || {})
                                        .filter(([name, data]) => {
                                            const searchLower = movesFilter.search.toLowerCase();
                                            const matchesSearch = !movesFilter.search || 
                                                name.toLowerCase().includes(searchLower) ||
                                                (data.effect && data.effect.toLowerCase().includes(searchLower)) ||
                                                (data.description && data.description.toLowerCase().includes(searchLower));
                                            const matchesType = !movesFilter.type || data.type === movesFilter.type;
                                            const matchesCategory = !movesFilter.category || data.category === movesFilter.category;
                                            const matchesFrequency = !movesFilter.frequency || 
                                                (data.frequency && data.frequency.toLowerCase().includes(movesFilter.frequency.toLowerCase()));
                                            return matchesSearch && matchesType && matchesCategory && matchesFrequency;
                                        })
                                        .sort((a, b) => {
                                            let cmp = 0;
                                            switch (movesFilter.sortBy) {
                                                case 'type':
                                                    cmp = a[1].type.localeCompare(b[1].type);
                                                    break;
                                                case 'category':
                                                    cmp = a[1].category.localeCompare(b[1].category);
                                                    break;
                                                case 'damage':
                                                    const getDamageValue = (d) => {
                                                        if (!d) return 0;
                                                        const match = d.match(/(\d+)d(\d+)/);
                                                        return match ? parseInt(match[1]) * parseInt(match[2]) : 0;
                                                    };
                                                    cmp = getDamageValue(b[1].damage) - getDamageValue(a[1].damage);
                                                    break;
                                                default:
                                                    cmp = a[0].localeCompare(b[0]);
                                            }
                                            return movesFilter.sortDir === 'asc' ? cmp : -cmp;
                                        });
                                    
                                    return (
                                        <>
                                            <div style={{ marginBottom: '10px', fontSize: '13px', color: '#666' }}>
                                                Showing {filteredMoves.length} of {Object.keys(GAME_DATA.moves).length} moves
                                                {movesFilter.type && <span style={{ marginLeft: '8px', padding: '2px 6px', borderRadius: '4px', background: getTypeColor(movesFilter.type), color: 'white', fontSize: '11px' }}>{movesFilter.type}</span>}
                                                {movesFilter.category && <span style={{ marginLeft: '8px', padding: '2px 6px', borderRadius: '4px', background: movesFilter.category === 'Physical' ? '#f44336' : movesFilter.category === 'Special' ? '#9c27b0' : '#607d8b', color: 'white', fontSize: '11px' }}>{movesFilter.category}</span>}
                                            </div>
                                            
                                            {/* Moves List */}
                                            <div style={{ maxHeight: '550px', overflowY: 'auto' }}>
                                                {filteredMoves.length === 0 ? (
                                                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                                        No moves found matching your filters.
                                                    </div>
                                                ) : (
                                                    filteredMoves.map(([move, data]) => (
                                                        <div 
                                                            key={move} 
                                                            style={{ 
                                                                marginBottom: '10px', 
                                                                padding: '12px', 
                                                                background: '#fff', 
                                                                borderRadius: '8px', 
                                                                borderLeft: `4px solid ${getTypeColor(data.type)}`,
                                                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                                cursor: 'pointer',
                                                                transition: 'transform 0.1s ease'
                                                            }}
                                                            onClick={() => showDetail('move', move, data)}
                                                        >
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                                    <strong style={{ fontSize: '14px' }}>{move}</strong>
                                                                    <span style={{ 
                                                                        padding: '2px 8px', 
                                                                        borderRadius: '4px', 
                                                                        fontSize: '10px', 
                                                                        fontWeight: 'bold',
                                                                        background: getTypeColor(data.type), 
                                                                        color: ['Electric', 'Ice', 'Ground', 'Steel'].includes(data.type) ? '#333' : 'white'
                                                                    }}>
                                                                        {data.type}
                                                                    </span>
                                                                    <span style={{ 
                                                                        padding: '2px 8px', 
                                                                        borderRadius: '4px', 
                                                                        fontSize: '10px',
                                                                        background: data.category === 'Physical' ? '#ffebee' : data.category === 'Special' ? '#f3e5f5' : '#eceff1',
                                                                        color: data.category === 'Physical' ? '#c62828' : data.category === 'Special' ? '#6a1b9a' : '#455a64'
                                                                    }}>
                                                                        {data.category}
                                                                    </span>
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#555' }}>
                                                                    {data.damage && (
                                                                        <span style={{ fontWeight: 'bold', color: '#c62828' }}>
                                                                            ⚔️ {data.damage}
                                                                        </span>
                                                                    )}
                                                                    {data.ac && (
                                                                        <span>🎯 AC {data.ac}</span>
                                                                    )}
                                                                    <span style={{ color: '#888' }}>{data.frequency}</span>
                                                                </div>
                                                            </div>
                                                            {data.range && (
                                                                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                                                                    📍 {data.range}
                                                                </div>
                                                            )}
                                                            {data.effect && (
                                                                <div style={{ fontSize: '12px', color: '#555', marginTop: '6px', lineHeight: '1.4' }}>
                                                                    {data.effect.length > 150 ? data.effect.substring(0, 150) + '...' : data.effect}
                                                                </div>
                                                            )}
                                                            <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                                                                Tap for full details
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                        
                        {referenceTab === 'abilities' && (
                            <div>
                                <h3 style={{ marginBottom: '15px' }}>Abilities Database ({Object.keys(GAME_DATA.abilities).length} abilities)</h3>
                                
                                {/* Search and Filters */}
                                <div className="section-card" style={{ marginBottom: '15px' }}>
                                    {/* Search Bar */}
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <input
                                            type="text"
                                            placeholder="🔍 Search abilities by name or effect..."
                                            value={abilitiesFilter.search}
                                            onChange={(e) => setAbilitiesFilter(prev => ({ ...prev, search: e.target.value }))}
                                            style={{ flex: '1', minWidth: '200px', padding: '10px 15px', borderRadius: '8px', border: '2px solid #dee2e6', fontSize: '14px' }}
                                        />
                                        
                                        {/* Sort Direction */}
                                        <button
                                            onClick={() => setAbilitiesFilter(prev => ({ ...prev, sortDir: prev.sortDir === 'asc' ? 'desc' : 'asc' }))}
                                            style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #dee2e6', background: '#fff', cursor: 'pointer', fontSize: '13px' }}
                                        >
                                            {abilitiesFilter.sortDir === 'asc' ? '↑ A-Z' : '↓ Z-A'}
                                        </button>
                                        
                                        {/* Clear */}
                                        {abilitiesFilter.search && (
                                            <button
                                                onClick={() => setAbilitiesFilter({ search: '', sortBy: 'name', sortDir: 'asc' })}
                                                style={{ padding: '10px 15px', borderRadius: '8px', border: 'none', background: '#dc3545', color: 'white', cursor: 'pointer', fontSize: '13px' }}
                                            >
                                                ✕ Clear
                                            </button>
                                        )}
                                    </div>
                                    
                                    {/* Quick Search Suggestions */}
                                    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        <span style={{ fontSize: '11px', color: '#666', marginRight: '4px' }}>Quick:</span>
                                        {['weather', 'contact', 'stat', 'damage', 'STAB', 'immunity', 'heal', 'status'].map(term => (
                                            <button
                                                key={term}
                                                onClick={() => setAbilitiesFilter(prev => ({ ...prev, search: prev.search === term ? '' : term }))}
                                                style={{
                                                    padding: '3px 8px',
                                                    borderRadius: '4px',
                                                    border: abilitiesFilter.search === term ? '2px solid #667eea' : '1px solid #dee2e6',
                                                    background: abilitiesFilter.search === term ? '#667eea' : '#fff',
                                                    color: abilitiesFilter.search === term ? 'white' : '#555',
                                                    cursor: 'pointer',
                                                    fontSize: '11px'
                                                }}
                                            >
                                                {term}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Results */}
                                {(() => {
                                    const filteredAbilities = Object.entries(GAME_DATA.abilities)
                                        .filter(([name, desc]) => {
                                            const searchLower = abilitiesFilter.search.toLowerCase();
                                            return !abilitiesFilter.search || 
                                                name.toLowerCase().includes(searchLower) ||
                                                desc.toLowerCase().includes(searchLower);
                                        })
                                        .sort((a, b) => {
                                            const cmp = a[0].localeCompare(b[0]);
                                            return abilitiesFilter.sortDir === 'asc' ? cmp : -cmp;
                                        });
                                    
                                    // Group abilities alphabetically
                                    const grouped = filteredAbilities.reduce((acc, [name, desc]) => {
                                        const letter = name[0].toUpperCase();
                                        if (!acc[letter]) acc[letter] = [];
                                        acc[letter].push([name, desc]);
                                        return acc;
                                    }, {});
                                    
                                    return (
                                        <>
                                            <div style={{ marginBottom: '10px', fontSize: '13px', color: '#666' }}>
                                                Showing {filteredAbilities.length} of {Object.keys(GAME_DATA.abilities).length} abilities
                                            </div>
                                            
                                            {/* Alphabet Jump */}
                                            {!abilitiesFilter.search && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '15px', padding: '8px', background: '#fff', borderRadius: '8px' }}>
                                                    {Object.keys(grouped).sort().map(letter => (
                                                        <button
                                                            key={letter}
                                                            onClick={() => {
                                                                const el = document.getElementById(`ability-group-${letter}`);
                                                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                            }}
                                                            style={{
                                                                width: '28px',
                                                                height: '28px',
                                                                borderRadius: '4px',
                                                                border: '1px solid #dee2e6',
                                                                background: '#f8f9fa',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                                fontWeight: 'bold',
                                                                color: '#667eea'
                                                            }}
                                                        >
                                                            {letter}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {/* Abilities List */}
                                            <div style={{ maxHeight: '550px', overflowY: 'auto' }}>
                                                {filteredAbilities.length === 0 ? (
                                                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                                        No abilities found matching "{abilitiesFilter.search}".
                                                    </div>
                                                ) : (
                                                    abilitiesFilter.search ? (
                                                        // Flat list when searching
                                                        filteredAbilities.map(([ability, description]) => (
                                                            <div 
                                                                key={ability} 
                                                                style={{ 
                                                                    marginBottom: '10px', 
                                                                    padding: '12px 15px', 
                                                                    background: '#fff', 
                                                                    borderRadius: '8px',
                                                                    borderLeft: '4px solid #f093fb',
                                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                                    cursor: 'pointer'
                                                                }}
                                                                onClick={() => showDetail('ability', ability, description)}
                                                            >
                                                                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#333', marginBottom: '6px' }}>
                                                                    ✨ {ability}
                                                                </div>
                                                                <div style={{ fontSize: '13px', color: '#555', lineHeight: '1.5' }}>
                                                                    {description.length > 200 ? description.substring(0, 200) + '...' : description}
                                                                </div>
                                                                {description.length > 200 && (
                                                                    <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                                                                        Tap for full description
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        // Grouped by letter when not searching
                                                        Object.keys(grouped).sort().map(letter => (
                                                            <div key={letter} id={`ability-group-${letter}`} style={{ marginBottom: '20px' }}>
                                                                <div style={{ 
                                                                    position: 'sticky', 
                                                                    top: 0, 
                                                                    background: 'linear-gradient(135deg, #667eea, #764ba2)', 
                                                                    color: 'white',
                                                                    padding: '6px 12px',
                                                                    borderRadius: '6px',
                                                                    fontWeight: 'bold',
                                                                    fontSize: '14px',
                                                                    marginBottom: '8px',
                                                                    zIndex: 1
                                                                }}>
                                                                    {letter} ({grouped[letter].length})
                                                                </div>
                                                                {grouped[letter].map(([ability, description]) => (
                                                                    <div 
                                                                        key={ability} 
                                                                        style={{ 
                                                                            marginBottom: '8px', 
                                                                            padding: '10px 12px', 
                                                                            background: '#fff', 
                                                                            borderRadius: '6px',
                                                                            borderLeft: '3px solid #f093fb',
                                                                            cursor: 'pointer',
                                                                            transition: 'background 0.2s'
                                                                        }}
                                                                        onClick={() => showDetail('ability', ability, description)}
                                                                    >
                                                                        <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#333' }}>
                                                                            {ability}
                                                                        </div>
                                                                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', lineHeight: '1.4' }}>
                                                                            {description.length > 120 ? description.substring(0, 120) + '...' : description}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ))
                                                    )
                                                )}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                        
                        {referenceTab === 'exp' && (
                            <div>
                                <h3>Pokémon Experience Chart</h3>
                                <p style={{ marginTop: '10px', marginBottom: '20px', fontSize: '14px' }}>
                                    Experience required to reach each level. Pokémon gain 1 stat point per level to distribute.
                                </p>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ borderCollapse: 'collapse', fontSize: '13px' }}>
                                        <thead>
                                            <tr style={{ background: '#f8f9fa' }}>
                                                <th className="ref-cell-header">Level</th>
                                                <th className="ref-cell-header">Total EXP</th>
                                                <th className="ref-cell-header">EXP to Next</th>
                                                <th className="ref-cell-header">STAB Bonus</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[1, 2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100].map(level => (
                                                <tr key={level}>
                                                    <td style={{ padding: '6px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                                                        {level}
                                                    </td>
                                                    <td style={{ padding: '6px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                                                        {GAME_DATA.pokemonExpChart[level].toLocaleString()}
                                                    </td>
                                                    <td style={{ padding: '6px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                                                        {level < 100 ? (GAME_DATA.pokemonExpChart[level + 1] - GAME_DATA.pokemonExpChart[level]).toLocaleString() : '—'}
                                                    </td>
                                                    <td style={{ padding: '6px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                                                        +{calculateSTAB(level)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <p style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
                                        <strong>Official P:TA Experience Chart</strong> - Values from Players Handbook 2
                                        <br />
                                        Notable progression: Early levels require small amounts, mid-levels scale dramatically, 
                                        high levels require massive EXP investments (Level 100 = 600,000 EXP total!)
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        {referenceTab === 'rules' && (
                            <div>
                                <h3>Core Game Rules (P:TA)</h3>
                                
                                <div className="mt-20">
                                    <h4 style={{ color: '#667eea', borderBottom: '2px solid #667eea', paddingBottom: '5px' }}>Trainer Rules</h4>
                                    <ul className="info-list">
                                        <li><strong>Starting Stats:</strong> Base 6 in all stats, 30 points to distribute (max 14 per stat)</li>
                                        <li><strong>Max HP:</strong> (HP Stat × 4) + (Level × 4)</li>
                                        <li><strong>Stat Modifiers:</strong> Floor(Stat / 2) - 5 (e.g., 14 = +2, 10 = 0, 8 = -1)</li>
                                        <li><strong>Speed Evasion:</strong> Capped at +6</li>
                                        <li><strong>Leveling:</strong> Through achievements, not experience points</li>
                                        <li><strong>Classes:</strong> First class grants +2 feat points, additional classes cost 1 feat point each</li>
                                        <li><strong>Class Limits:</strong> 1 at Lv.0, 2 at Lv.5, 3 at Lv.12, 4 at Lv.24</li>
                                        <li><strong>Feat Points:</strong> 1 per level to spend on Features</li>
                                    </ul>
                                    
                                    <h4 style={{ marginTop: '20px', color: '#e53935', borderBottom: '2px solid #e53935', paddingBottom: '5px' }}>Pokémon Rules</h4>
                                    <ul className="info-list">
                                        <li><strong>HP Calculation:</strong> Level + (HP Stat × 3)</li>
                                        <li><strong>Leveling:</strong> Based on experience points (see EXP chart)</li>
                                        <li><strong>Stat Points:</strong> +1 stat point per level to distribute</li>
                                        <li><strong>Abilities:</strong> Pokémon can have up to 3 abilities</li>
                                        <li><strong>Loyalty:</strong> 0-4 scale (0=Hostile, 2=Neutral, 3=Loyal, 4=Devoted)</li>
                                        <li><strong>Vitamins:</strong> Can use up to 5 total to modify base stats</li>
                                        <li><strong className="text-red">Move Limit:</strong> Maximum 8 moves (4 Natural/Level-Up + 4 Taught/TM/Tutor)</li>
                                        <li><strong>Experience Drops:</strong> Defeated wild Pokémon typically drop Level × 10-30 EXP</li>
                                        <li><strong>Party Size:</strong> Maximum 6 Pokémon in active party</li>
                                    </ul>
                                    
                                    <h4 style={{ marginTop: '20px', color: '#4caf50', borderBottom: '2px solid #4caf50', paddingBottom: '5px' }}>Nature Modifiers</h4>
                                    <ul className="info-list">
                                        <li><strong>HP Modifier:</strong> +1/-1 (HP is always ±1, not ±2)</li>
                                        <li><strong>Other Stats:</strong> +2/-2 (ATK, DEF, SATK, SDEF, SPD)</li>
                                        <li><strong>Neutral Natures:</strong> Composed, Dull, Patient, Poised, Stoic (no changes)</li>
                                        <li><strong>Minimum Stat:</strong> Stats cannot go below 1</li>
                                    </ul>
                                    
                                    <h4 style={{ marginTop: '20px', color: '#ff9800', borderBottom: '2px solid #ff9800', paddingBottom: '5px' }}>Combat Stages</h4>
                                    <ul className="info-list">
                                        <li><strong>Range:</strong> -6 to +6 stages per stat</li>
                                        <li><strong>Raised Stats:</strong> +25% per stage (rounded down)</li>
                                        <li><strong>Lowered Stats:</strong> -10% per stage (rounded up)</li>
                                        <li><strong>At +6:</strong> 250% of original stat</li>
                                        <li><strong>At -6:</strong> 40% of original stat</li>
                                        <li><strong>Speed Skills:</strong> +1 per 2 raised stages, -1 per 3 lowered stages (min 1)</li>
                                        <li><strong>Reset:</strong> Stages reset when returned to Pokéball or after ~10 min out of combat</li>
                                    </ul>
                                    
                                    <h4 style={{ marginTop: '20px', color: '#9c27b0', borderBottom: '2px solid #9c27b0', paddingBottom: '5px' }}>Combat Rules</h4>
                                    <ul className="info-list">
                                        <li><strong>Accuracy Check:</strong> d20 + ACC - Evasion ≥ AC of move</li>
                                        <li><strong>Critical Hit:</strong> Natural 20 (or expanded range with certain moves)</li>
                                        <li><strong>Move Frequency:</strong>
                                            <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
                                                <li><em>At-Will:</em> Unlimited use</li>
                                                <li><em>EOT (Every Other Turn):</em> Once per turn, with 1 turn cooldown</li>
                                                <li><em>Battle:</em> Once per encounter</li>
                                                <li><em>Center:</em> Once per Pokémon Center visit</li>
                                            </ul>
                                        </li>
                                        <li><strong>Switching:</strong> Takes your turn unless you have special features</li>
                                        <li><strong>Damage:</strong> Roll damage dice + stat modifier (ATK for Physical, SATK for Special)</li>
                                    </ul>
                                    
                                    <h4 style={{ marginTop: '20px', color: '#2196f3', borderBottom: '2px solid #2196f3', paddingBottom: '5px' }}>STAB Bonus (Same Type Attack Bonus)</h4>
                                    <table style={{ marginTop: '10px', borderCollapse: 'collapse', width: '100%' }}>
                                        <tbody>
                                            <tr className="bg-gray">
                                                <td style={{ padding: '8px 12px', border: '1px solid #dee2e6', fontWeight: 'bold' }}>Level</td>
                                                <td style={{ padding: '8px 12px', border: '1px solid #dee2e6', fontWeight: 'bold' }}>STAB Bonus</td>
                                                <td style={{ padding: '8px 12px', border: '1px solid #dee2e6', fontWeight: 'bold' }}>Level</td>
                                                <td style={{ padding: '8px 12px', border: '1px solid #dee2e6', fontWeight: 'bold' }}>STAB Bonus</td>
                                            </tr>
                                            <tr><td className="ref-cell">1-4</td><td className="ref-cell">+0</td><td className="ref-cell">50-54</td><td className="ref-cell">+10</td></tr>
                                            <tr><td className="ref-cell">5-9</td><td className="ref-cell">+1</td><td className="ref-cell">55-59</td><td className="ref-cell">+11</td></tr>
                                            <tr><td className="ref-cell">10-14</td><td className="ref-cell">+2</td><td className="ref-cell">60-64</td><td className="ref-cell">+12</td></tr>
                                            <tr><td className="ref-cell">15-19</td><td className="ref-cell">+3</td><td className="ref-cell">65-69</td><td className="ref-cell">+13</td></tr>
                                            <tr><td className="ref-cell">20-24</td><td className="ref-cell">+4</td><td className="ref-cell">70-74</td><td className="ref-cell">+14</td></tr>
                                            <tr><td className="ref-cell">25-29</td><td className="ref-cell">+5</td><td className="ref-cell">75-79</td><td className="ref-cell">+15</td></tr>
                                            <tr><td className="ref-cell">30-34</td><td className="ref-cell">+6</td><td className="ref-cell">80-84</td><td className="ref-cell">+16</td></tr>
                                            <tr><td className="ref-cell">35-39</td><td className="ref-cell">+7</td><td className="ref-cell">85-89</td><td className="ref-cell">+17</td></tr>
                                            <tr><td className="ref-cell">40-44</td><td className="ref-cell">+8</td><td className="ref-cell">90-94</td><td className="ref-cell">+18</td></tr>
                                            <tr><td className="ref-cell">45-49</td><td className="ref-cell">+9</td><td className="ref-cell">95-100</td><td className="ref-cell">+19-20</td></tr>
                                        </tbody>
                                    </table>
                                    
                                    <h4 style={{ marginTop: '20px', color: '#00bcd4', borderBottom: '2px solid #00bcd4', paddingBottom: '5px' }}>Pokémon Skills</h4>
                                    <div style={{ marginLeft: '10px' }}>
                                        <p style={{ fontWeight: 'bold', marginTop: '10px' }}>Speed Skills (value = spaces/meters per round):</p>
                                        <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
                                            <li><strong>Overland:</strong> Movement on dry land</li>
                                            <li><strong>Sky:</strong> Flight/levitation movement (+4 from Fly)</li>
                                            <li><strong>Burrow:</strong> Underground movement (+3 from Dig)</li>
                                            <li><strong>Surface:</strong> Water surface movement (+4 from Surf)</li>
                                            <li><strong>Underwater:</strong> Underwater movement (+3 from Dive)</li>
                                        </ul>
                                        <p style={{ fontWeight: 'bold', marginTop: '10px' }}>Basic Skills:</p>
                                        <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
                                            <li><strong>Intelligence (1-7):</strong> 1=Feeble, 4=Normal, 5=Human, 7=Genius</li>
                                            <li><strong>Jump (1-10):</strong> Max height per bound (1=3ft, 5=20ft, 10=100ft)</li>
                                            <li><strong>Power (1-10):</strong> Lifting capacity (1=10lbs, 5=350lbs, 10=4000lbs)</li>
                                        </ul>
                                        <p style={{ fontWeight: 'bold', marginTop: '10px' }}>Other Skills (examples):</p>
                                        <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
                                            <li><strong>Gilled:</strong> Breathe underwater indefinitely</li>
                                            <li><strong>Climber:</strong> Vertical terrain = normal terrain</li>
                                            <li><strong>Phasing:</strong> Move through solid objects (30 sec max)</li>
                                            <li><strong>Telekinetic:</strong> Move objects with mind (level × 5 lbs)</li>
                                            <li><strong>Tracker:</strong> Follow scents (DC 11/16/20)</li>
                                        </ul>
                                    </div>
                                    
                                    <h4 style={{ marginTop: '20px', color: '#795548', borderBottom: '2px solid #795548', paddingBottom: '5px' }}>Evasion Bonuses</h4>
                                    <ul className="info-list">
                                        <li><strong>Physical Evasion:</strong> +1 per 5 Defense</li>
                                        <li><strong>Special Evasion:</strong> +1 per 5 Special Defense</li>
                                        <li><strong>Speed Evasion:</strong> +1 per 10 Speed (capped at +6 for Trainers)</li>
                                    </ul>
                                    
                                    <h4 style={{ marginTop: '20px', color: '#e91e63', borderBottom: '2px solid #e91e63', paddingBottom: '5px' }}>Trainer Skills</h4>
                                    <ul className="info-list">
                                        <li><strong>Skill Check:</strong> d20 + Stat Modifier (+ skill bonus if trained)</li>
                                        <li><strong>Opposed Check:</strong> Both parties roll, higher wins</li>
                                        <li><strong>Passive Skills (HP):</strong> Breathless, Fasting, Endurance, Resistant</li>
                                        <li><strong>ATK Skills:</strong> Browbeat, Jump, Sprint, Strength</li>
                                        <li><strong>DEF Skills:</strong> Concentration, Deflection, Healing, Tireless</li>
                                        <li><strong>SATK Skills:</strong> Engineering, History, Languages, Medicine, Nature, Occult</li>
                                        <li><strong>SDEF Skills:</strong> Insight, Perception, Persuasion, Survival</li>
                                        <li><strong>SPD Skills:</strong> Acrobatics, Sleight of Hand, Stealth</li>
                                    </ul>
                                    
                                    <h4 style={{ marginTop: '20px', color: '#607d8b', borderBottom: '2px solid #607d8b', paddingBottom: '5px' }}>Breeding Rules</h4>
                                    <ul className="info-list">
                                        <li><strong>Requirements:</strong> 8+ hours of privacy for non-Breeders</li>
                                        <li><strong>Success Rate:</strong> Roll d100, success on 25 or less</li>
                                        <li><strong>Egg Moves:</strong> Up to 4 moves can be passed to offspring</li>
                                        <li><strong>Species:</strong> Usually mother's species, 5% chance for father's</li>
                                    </ul>
                                    
                                    <h4 style={{ marginTop: '20px', color: '#ff5722', borderBottom: '2px solid #ff5722', paddingBottom: '5px' }}>Contest Rules</h4>
                                    <ul className="info-list">
                                        <li><strong>Categories:</strong> Cool, Beauty, Cute, Smart, Tough</li>
                                        <li><strong>Appeal:</strong> Based on move's contest type and combo potential</li>
                                        <li><strong>Voltage:</strong> Builds up for powerful finishers</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* ========== CAMPAIGN NOTES TAB ========== */}
                {activeTab === 'notes' && (
                    <div>
                        <h2 className="section-title">Campaign Notes</h2>
                        
                        <div className="form-group">
                            <label>Notes & Reminders</label>
                            <textarea
                                value={trainer.notes}
                                onChange={(e) => setTrainer(prev => ({ ...prev, notes: e.target.value }))}
                                rows="20"
                                placeholder="Keep track of your adventure, important NPCs, quest items, story notes, team strategies, breeding plans, etc..."
                                style={{ fontFamily: 'monospace', resize: 'vertical' }}
                            />
                        </div>
                        
                        <div className="section-card" style={{ marginTop: '20px' }}>
                            <h4>Quick Tips</h4>
                            <ul style={{ marginLeft: '20px', lineHeight: '1.8', fontSize: '14px' }}>
                                <li>Track NPC relationships and their Pokémon teams</li>
                                <li>Note down breeding combinations you want to try</li>
                                <li>Keep a wishlist of TMs and items you're looking for</li>
                                <li>Record gym leader strategies and weaknesses</li>
                                <li>Document side quests and their rewards</li>
                                <li>Note locations of rare Pokémon spawns</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
        
        {/* Custom Feature Modal */}
        {showCustomFeatureModal && (
            <div className="modal-overlay" onClick={() => setShowCustomFeatureModal(false)}>
                <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                    <div className="modal-header">
                        <h3>Create Custom Feature</h3>
                        <button onClick={() => setShowCustomFeatureModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
                    </div>
                    <div className="modal-content">
                        <div className="form-group">
                            <label>Feature Name *</label>
                            <input
                                type="text"
                                value={customFeature.name}
                                onChange={(e) => setCustomFeature(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Type Specialist"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Category</label>
                            <select
                                value={customFeature.category}
                                onChange={(e) => setCustomFeature(prev => ({ ...prev, category: e.target.value }))}
                            >
                                <option value="Custom">Custom</option>
                                <option value="Class">Class Feature</option>
                                <option value="General">General</option>
                                <option value="Arms">Arms</option>
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label>Prerequisites</label>
                            <input
                                type="text"
                                value={customFeature.prerequisites}
                                onChange={(e) => setCustomFeature(prev => ({ ...prev, prerequisites: e.target.value }))}
                                placeholder="e.g., Level 5, 14 SATK"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Frequency</label>
                            <input
                                type="text"
                                value={customFeature.frequency}
                                onChange={(e) => setCustomFeature(prev => ({ ...prev, frequency: e.target.value }))}
                                placeholder="e.g., At-Will, Daily, Static"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Trigger (if any)</label>
                            <input
                                type="text"
                                value={customFeature.trigger}
                                onChange={(e) => setCustomFeature(prev => ({ ...prev, trigger: e.target.value }))}
                                placeholder="e.g., When your Pokémon is hit by a super-effective move"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Target (if any)</label>
                            <input
                                type="text"
                                value={customFeature.target}
                                onChange={(e) => setCustomFeature(prev => ({ ...prev, target: e.target.value }))}
                                placeholder="e.g., Your Pokémon, An allied Trainer"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Effect *</label>
                            <textarea
                                value={customFeature.effect}
                                onChange={(e) => setCustomFeature(prev => ({ ...prev, effect: e.target.value }))}
                                placeholder="Describe what this feature does..."
                                rows={4}
                                style={{ width: '100%', resize: 'vertical' }}
                            />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button className="btn btn-secondary" onClick={() => setShowCustomFeatureModal(false)}>
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary"
                                disabled={!customFeature.name || !customFeature.effect}
                                onClick={() => {
                                    if (customFeature.name && customFeature.effect) {
                                        setTrainer(prev => ({
                                            ...prev,
                                            features: [...prev.features, { ...customFeature }],
                                            featPoints: (prev.featPoints || 0) - 1
                                        }));
                                        setShowCustomFeatureModal(false);
                                    }
                                }}
                            >
                                Add Feature (1 point)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        {/* Custom Move Modal */}
        {showCustomMoveModal && (
            <div className="modal-overlay" onClick={() => setShowCustomMoveModal(false)}>
                <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
                    <div className="modal-header">
                        <h3>Create Custom Move</h3>
                        <button onClick={() => setShowCustomMoveModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
                    </div>
                    <div className="modal-content">
                        <div className="form-group">
                            <label>Move Name *</label>
                            <input
                                type="text"
                                value={customMove.name}
                                onChange={(e) => setCustomMove(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Thunder Claw"
                            />
                        </div>
                        
                        <div className="grid-responsive-2 gap-sm">
                            <div className="form-group">
                                <label>Type</label>
                                <select
                                    value={customMove.type}
                                    onChange={(e) => setCustomMove(prev => ({ ...prev, type: e.target.value }))}
                                >
                                    {Object.keys(typeChart).map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label>Category</label>
                                <select
                                    value={customMove.category}
                                    onChange={(e) => setCustomMove(prev => ({ ...prev, category: e.target.value }))}
                                >
                                    <option value="Physical">Physical</option>
                                    <option value="Special">Special</option>
                                    <option value="Status">Status</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="grid-responsive-2 gap-sm">
                            <div className="form-group">
                                <label>Frequency</label>
                                <select
                                    value={customMove.frequency}
                                    onChange={(e) => setCustomMove(prev => ({ ...prev, frequency: e.target.value }))}
                                >
                                    <option value="At-Will">At-Will</option>
                                    <option value="At-Will - 2">At-Will - 2</option>
                                    <option value="At-Will - 3">At-Will - 3</option>
                                    <option value="EOT">EOT</option>
                                    <option value="EOT - 2">EOT - 2</option>
                                    <option value="Battle">Battle</option>
                                    <option value="Battle - 2">Battle - 2</option>
                                    <option value="Center">Center</option>
                                    <option value="Center - 2">Center - 2</option>
                                    <option value="Daily">Daily</option>
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label>Move Source</label>
                                <select
                                    value={customMove.source}
                                    onChange={(e) => setCustomMove(prev => ({ ...prev, source: e.target.value }))}
                                >
                                    <option value="natural">Natural / Level-Up</option>
                                    <option value="taught">Taught / TM / Tutor</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="grid-responsive-2 gap-sm">
                            <div className="form-group">
                                <label>Damage Dice</label>
                                <input
                                    type="text"
                                    value={customMove.damage}
                                    onChange={(e) => setCustomMove(prev => ({ ...prev, damage: e.target.value }))}
                                    placeholder="e.g., 2d10+8 or leave empty for Status"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Range</label>
                                <input
                                    type="text"
                                    value={customMove.range}
                                    onChange={(e) => setCustomMove(prev => ({ ...prev, range: e.target.value }))}
                                    placeholder="e.g., Melee, Ranged 6, Self"
                                />
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>Effect Tags</label>
                            <input
                                type="text"
                                value={customMove.effect}
                                onChange={(e) => setCustomMove(prev => ({ ...prev, effect: e.target.value }))}
                                placeholder="e.g., 1 Target, Burst, Column, Push"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                value={customMove.description}
                                onChange={(e) => setCustomMove(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Describe any special effects, conditions, or rules for this move..."
                                rows={3}
                                style={{ width: '100%', resize: 'vertical' }}
                            />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button className="btn btn-secondary" onClick={() => setShowCustomMoveModal(false)}>
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary"
                                disabled={!customMove.name}
                                onClick={() => {
                                    if (customMove.name && customMoveForPokemon) {
                                        const targetPoke = pokemon.find(p => p.id === customMoveForPokemon);
                                        if (targetPoke) {
                                            // Check move limits
                                            const naturalMoves = targetPoke.moves.filter(m => m.source === 'natural').length;
                                            const taughtMoves = targetPoke.moves.filter(m => m.source === 'taught').length;
                                            
                                            if (customMove.source === 'natural' && naturalMoves >= 4) {
                                                alert('This Pokémon already has 4 Natural moves.');
                                                return;
                                            }
                                            if (customMove.source === 'taught' && taughtMoves >= 4) {
                                                alert('This Pokémon already has 4 Taught moves.');
                                                return;
                                            }
                                            if (targetPoke.moves.length >= 8) {
                                                alert('This Pokémon already has 8 moves.');
                                                return;
                                            }
                                            
                                            updatePokemon(customMoveForPokemon, {
                                                moves: [...targetPoke.moves, { ...customMove }]
                                            });
                                        }
                                        setShowCustomMoveModal(false);
                                    }
                                }}
                            >
                                Add Move
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        {/* Card Export Modal */}
        {showCardModal && (
            <div className="modal-overlay" onClick={() => setShowCardModal(false)}>
                <div className="modal" style={{ maxWidth: cardType === 'team' ? '650px' : '550px', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3>📇 Export Character Card</h3>
                        <button onClick={() => setShowCardModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
                    </div>
                    
                    <div className="mb-15">
                        <div className="tabs">
                            <button 
                                className={`tab ${cardType === 'trainer' ? 'active' : ''}`}
                                onClick={() => setCardType('trainer')}
                            >Trainer</button>
                            <button 
                                className={`tab ${cardType === 'team' ? 'active' : ''}`}
                                onClick={() => setCardType('team')}
                            >Team Card</button>
                            <button 
                                className={`tab ${cardType === 'pokemon' ? 'active' : ''}`}
                                onClick={() => setCardType('pokemon')}
                            >Pokémon</button>
                        </div>
                        
                        {cardType === 'pokemon' && (
                            <div className="mt-10">
                                <select 
                                    value={selectedCardPokemon?.id || ''} 
                                    onChange={(e) => setSelectedCardPokemon(pokemon.find(p => p.id === parseInt(e.target.value)))}
                                    className="w-full"
                                >
                                    <option value="">Select a Pokémon...</option>
                                    {pokemon.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} (Lv.{p.level})</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                    
                    {/* Trainer Card Preview */}
                    {cardType === 'trainer' && (
                        <div id="trainerCardExport" style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '16px',
                            padding: '20px',
                            color: 'white',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {/* Decorative elements */}
                            <div style={{
                                position: 'absolute',
                                top: '-50px',
                                right: '-50px',
                                width: '150px',
                                height: '150px',
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: '50%'
                            }}></div>
                            <div style={{
                                position: 'absolute',
                                bottom: '-30px',
                                left: '-30px',
                                width: '100px',
                                height: '100px',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '50%'
                            }}></div>
                            
                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px', position: 'relative', zIndex: 1 }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: trainer.avatar ? `url(${trainer.avatar}) center/cover` : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                    border: '3px solid rgba(255,255,255,0.5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '32px',
                                    flexShrink: 0
                                }}>
                                    {!trainer.avatar && '👤'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h2 style={{ margin: 0, fontSize: '24px', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                                        {trainer.name || 'Unnamed Trainer'}
                                        <span style={{ marginLeft: '8px', fontSize: '20px' }}>
                                            {trainer.gender === 'male' ? '♂' : trainer.gender === 'female' ? '♀' : ''}
                                        </span>
                                    </h2>
                                    <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '14px' }}>
                                        Level {trainer.level} {(trainer.classes && trainer.classes.length > 0) ? trainer.classes.join(' / ') : 'Trainer'}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Stats Grid */}
                            <div style={{
                                background: 'rgba(255,255,255,0.15)',
                                borderRadius: '12px',
                                padding: '12px',
                                marginBottom: '12px',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Stats • Max HP: {(trainer.stats.hp * 4) + (trainer.level * 4)}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                    {[
                                        { label: 'HP', value: trainer.stats.hp, color: '#ff6b6b' },
                                        { label: 'ATK', value: trainer.stats.atk, color: '#ffa502' },
                                        { label: 'DEF', value: trainer.stats.def, color: '#2ed573' },
                                        { label: 'SATK', value: trainer.stats.satk, color: '#70a1ff' },
                                        { label: 'SDEF', value: trainer.stats.sdef, color: '#7bed9f' },
                                        { label: 'SPD', value: trainer.stats.spd, color: '#ff6348' }
                                    ].map(stat => (
                                        <div key={stat.label} style={{
                                            background: 'rgba(0,0,0,0.2)',
                                            borderRadius: '8px',
                                            padding: '6px 10px',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '10px', opacity: 0.8 }}>{stat.label}</div>
                                            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{stat.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Features */}
                            {trainer.features.length > 0 && (
                                <div className="mb-10">
                                    <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Features</div>
                                    <div style={{ fontSize: '12px', lineHeight: 1.4 }}>
                                        {trainer.features.map(f => typeof f === 'object' ? f.name : f).join(' • ')}
                                    </div>
                                </div>
                            )}
                            
                            {/* Skills */}
                            {trainer.skills.length > 0 && (
                                <div className="mb-10">
                                    <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Skills</div>
                                    <div className="text-12">{trainer.skills.join(' • ')}</div>
                                </div>
                            )}
                            
                            {/* Footer */}
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                borderTop: '1px solid rgba(255,255,255,0.2)',
                                paddingTop: '10px',
                                marginTop: '10px'
                            }}>
                                <span className="text-14">💰 ₽{(trainer.money || 0).toLocaleString()}</span>
                                <span className="text-14">🎖️ {trainer.badges?.length || 0} Badges</span>
                                <span className="text-14">📦 {pokemon.length} Pokémon</span>
                            </div>
                        </div>
                    )}
                    
                    {/* Team Card Preview - Trainer + Active Party */}
                    {cardType === 'team' && (
                        <div id="teamCardExport" style={{
                            background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                            borderRadius: '16px',
                            padding: '20px',
                            color: 'white',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                            position: 'relative',
                            overflow: 'hidden',
                            minWidth: '480px'
                        }}>
                            {/* Background decoration */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                                opacity: 0.5
                            }}></div>
                            
                            {/* Header - Trainer Info */}
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '15px', 
                                marginBottom: '15px',
                                position: 'relative',
                                zIndex: 1,
                                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3))',
                                borderRadius: '12px',
                                padding: '12px'
                            }}>
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    background: trainer.avatar ? `url(${trainer.avatar}) center/cover` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: '3px solid rgba(255,255,255,0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '24px',
                                    flexShrink: 0
                                }}>
                                    {!trainer.avatar && '👤'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h2 style={{ margin: 0, fontSize: '20px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                                        {trainer.name || 'Unnamed Trainer'}
                                        <span style={{ marginLeft: '6px', fontSize: '16px', opacity: 0.8 }}>
                                            {trainer.gender === 'male' ? '♂' : trainer.gender === 'female' ? '♀' : ''}
                                        </span>
                                    </h2>
                                    <p style={{ margin: '2px 0 0', opacity: 0.8, fontSize: '12px' }}>
                                        Level {trainer.level} • {(trainer.classes && trainer.classes.length > 0) ? trainer.classes.slice(0, 3).join(' / ') : 'Trainer'}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '11px', opacity: 0.7 }}>
                                    <div>💰 ₽{(trainer.money || 0).toLocaleString()}</div>
                                    <div>🎖️ {trainer.badges?.length || 0} Badges</div>
                                </div>
                            </div>
                            
                            {/* Party Section Title */}
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '10px',
                                marginBottom: '12px',
                                position: 'relative',
                                zIndex: 1
                            }}>
                                <span style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>
                                    ⚔️ Active Party
                                </span>
                                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.3), transparent)' }}></div>
                                <span style={{ fontSize: '12px', opacity: 0.7 }}>{party.length}/6</span>
                            </div>
                            
                            {/* Party Pokemon Grid */}
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '10px',
                                position: 'relative',
                                zIndex: 1
                            }}>
                                {party.length > 0 ? party.map((poke, idx) => {
                                    const pokeStats = getActualStats(poke);
                                    const maxHP = calculatePokemonHP(poke);
                                    const primaryType = poke.types?.[0] || 'Normal';
                                    const genderIcon = poke.gender === 'male' ? '♂' : poke.gender === 'female' ? '♀' : '';
                                    
                                    return (
                                        <div key={poke.id} style={{
                                            background: `linear-gradient(135deg, ${getTypeColor(primaryType)}99, ${getTypeColor(primaryType)}44)`,
                                            borderRadius: '10px',
                                            padding: '10px',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            position: 'relative'
                                        }}>
                                            {/* Slot number */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '-6px',
                                                left: '-6px',
                                                width: '20px',
                                                height: '20px',
                                                background: '#667eea',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '11px',
                                                fontWeight: 'bold',
                                                border: '2px solid #1a1a2e'
                                            }}>
                                                {idx + 1}
                                            </div>
                                            
                                            {/* Pokemon avatar/icon */}
                                            <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                                                {poke.avatar ? (
                                                    <img src={poke.avatar} alt={poke.name} style={{
                                                        width: '50px',
                                                        height: '50px',
                                                        borderRadius: '8px',
                                                        objectFit: 'cover',
                                                        border: '2px solid rgba(255,255,255,0.3)'
                                                    }} />
                                                ) : (
                                                    <div style={{
                                                        width: '50px',
                                                        height: '50px',
                                                        margin: '0 auto',
                                                        borderRadius: '8px',
                                                        background: 'rgba(255,255,255,0.2)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '24px'
                                                    }}>
                                                        🎴
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Name and level */}
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '2px', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                                                    {poke.name || poke.species || 'Unknown'} {genderIcon}
                                                </div>
                                                <div style={{ fontSize: '10px', opacity: 0.8 }}>
                                                    Lv.{poke.level}
                                                </div>
                                            </div>
                                            
                                            {/* Types */}
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', marginTop: '4px' }}>
                                                {poke.types?.map(type => (
                                                    <span key={type} style={{
                                                        padding: '1px 6px',
                                                        borderRadius: '8px',
                                                        fontSize: '8px',
                                                        fontWeight: 'bold',
                                                        background: getTypeColor(type),
                                                        textShadow: '0 1px 1px rgba(0,0,0,0.3)'
                                                    }}>
                                                        {type}
                                                    </span>
                                                ))}
                                            </div>
                                            
                                            {/* HP Bar */}
                                            <div style={{ marginTop: '6px' }}>
                                                <div style={{ fontSize: '8px', opacity: 0.7, marginBottom: '2px', textAlign: 'center' }}>
                                                    HP: {maxHP - (poke.currentDamage || 0)}/{maxHP}
                                                </div>
                                                <div style={{
                                                    height: '4px',
                                                    background: 'rgba(0,0,0,0.3)',
                                                    borderRadius: '2px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        height: '100%',
                                                        width: `${((maxHP - (poke.currentDamage || 0)) / maxHP) * 100}%`,
                                                        background: ((maxHP - (poke.currentDamage || 0)) / maxHP) > 0.5 ? '#4caf50' : 
                                                                   ((maxHP - (poke.currentDamage || 0)) / maxHP) > 0.25 ? '#ff9800' : '#f44336',
                                                        borderRadius: '2px',
                                                        transition: 'width 0.3s ease'
                                                    }}></div>
                                                </div>
                                            </div>
                                            
                                            {/* Key stats */}
                                            <div style={{ 
                                                display: 'grid', 
                                                gridTemplateColumns: 'repeat(3, 1fr)', 
                                                gap: '2px', 
                                                marginTop: '6px',
                                                fontSize: '8px',
                                                textAlign: 'center'
                                            }}>
                                                <div><span style={{ opacity: 0.6 }}>ATK</span> <strong>{pokeStats.atk}</strong></div>
                                                <div><span style={{ opacity: 0.6 }}>DEF</span> <strong>{pokeStats.def}</strong></div>
                                                <div><span style={{ opacity: 0.6 }}>SPD</span> <strong>{pokeStats.spd}</strong></div>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    // Empty slots
                                    Array(6).fill(null).map((_, idx) => (
                                        <div key={idx} style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            borderRadius: '10px',
                                            padding: '20px',
                                            border: '1px dashed rgba(255,255,255,0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minHeight: '120px'
                                        }}>
                                            <span style={{ opacity: 0.3, fontSize: '12px' }}>Empty</span>
                                        </div>
                                    ))
                                )}
                                {/* Fill remaining slots if party < 6 */}
                                {party.length > 0 && party.length < 6 && Array(6 - party.length).fill(null).map((_, idx) => (
                                    <div key={`empty-${idx}`} style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '10px',
                                        padding: '20px',
                                        border: '1px dashed rgba(255,255,255,0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minHeight: '120px'
                                    }}>
                                        <span style={{ opacity: 0.3, fontSize: '12px' }}>Empty</span>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Footer */}
                            <div style={{ 
                                marginTop: '15px',
                                paddingTop: '10px',
                                borderTop: '1px solid rgba(255,255,255,0.1)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '10px',
                                opacity: 0.6,
                                position: 'relative',
                                zIndex: 1
                            }}>
                                <span>P:TA Character Manager</span>
                                <span>{new Date().toLocaleDateString()}</span>
                            </div>
                        </div>
                    )}
                    
                    {/* Pokemon Card Preview */}
                    {cardType === 'pokemon' && selectedCardPokemon && (() => {
                        const poke = selectedCardPokemon;
                        const actualStats = getActualStats(poke);
                        const maxHP = calculatePokemonHP(poke);
                        const genderSymbol = poke.gender === 'male' ? '♂' : poke.gender === 'female' ? '♀' : poke.gender === 'genderless' ? '⚪' : '';
                        const primaryType = poke.types[0] || 'Normal';
                        const secondaryType = poke.types[1];
                        const bgGradient = secondaryType 
                            ? `linear-gradient(135deg, ${getTypeColor(primaryType)} 0%, ${getTypeColor(secondaryType)} 100%)`
                            : `linear-gradient(135deg, ${getTypeColor(primaryType)} 0%, ${getTypeColor(primaryType)}dd 100%)`;
                        
                        return (
                            <div id="pokemonCardExport" style={{
                                background: bgGradient,
                                borderRadius: '16px',
                                padding: '20px',
                                color: 'white',
                                fontFamily: 'system-ui, -apple-system, sans-serif',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                {/* Pokeball watermark */}
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    right: '-60px',
                                    transform: 'translateY(-50%)',
                                    width: '200px',
                                    height: '200px',
                                    borderRadius: '50%',
                                    border: '8px solid rgba(255,255,255,0.1)',
                                    opacity: 0.3
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: 0,
                                        right: 0,
                                        height: '8px',
                                        background: 'rgba(255,255,255,0.1)',
                                        transform: 'translateY(-50%)'
                                    }}></div>
                                </div>
                                
                                {/* Header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px', position: 'relative', zIndex: 1 }}>
                                    <div style={{
                                        width: '90px',
                                        height: '90px',
                                        borderRadius: '12px',
                                        background: poke.avatar ? `url(${poke.avatar}) center/cover` : 'rgba(255,255,255,0.2)',
                                        border: '3px solid rgba(255,255,255,0.5)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '40px',
                                        flexShrink: 0
                                    }}>
                                        {!poke.avatar && '?'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h2 style={{ margin: 0, fontSize: '22px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                                            {poke.name} {genderSymbol}
                                        </h2>
                                        {poke.species && poke.species !== poke.name && (
                                            <p style={{ margin: '2px 0', opacity: 0.9, fontSize: '13px' }}>{poke.species}</p>
                                        )}
                                        <p style={{ margin: '4px 0 0', fontSize: '14px' }}>
                                            Level {poke.level} • {poke.nature} Nature
                                        </p>
                                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                                            {poke.types.map(type => (
                                                <span key={type} style={{
                                                    background: 'rgba(0,0,0,0.3)',
                                                    padding: '2px 10px',
                                                    borderRadius: '10px',
                                                    fontSize: '11px',
                                                    fontWeight: 'bold'
                                                }}>{type}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Abilities */}
                                {(poke.ability || poke.ability2 || poke.ability3) && (
                                    <div style={{
                                        background: 'rgba(0,0,0,0.2)',
                                        borderRadius: '8px',
                                        padding: '8px 12px',
                                        marginBottom: '12px',
                                        fontSize: '12px'
                                    }}>
                                        <strong>Abilities:</strong>{' '}
                                        {[poke.ability, poke.ability2, poke.ability3]
                                            .filter(a => a)
                                            .join(' • ')
                                        }
                                    </div>
                                )}
                                
                                {/* Stats Grid */}
                                <div style={{
                                    background: 'rgba(255,255,255,0.15)',
                                    borderRadius: '12px',
                                    padding: '12px',
                                    marginBottom: '12px',
                                    backdropFilter: 'blur(10px)'
                                }}>
                                    <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Stats • HP: {maxHP} • STAB: +{calculateSTAB(poke.level)}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                        {[
                                            { label: 'HP', value: actualStats.hp },
                                            { label: 'ATK', value: actualStats.atk },
                                            { label: 'DEF', value: actualStats.def },
                                            { label: 'SATK', value: actualStats.satk },
                                            { label: 'SDEF', value: actualStats.sdef },
                                            { label: 'SPD', value: actualStats.spd }
                                        ].map(stat => (
                                            <div key={stat.label} style={{
                                                background: 'rgba(0,0,0,0.2)',
                                                borderRadius: '8px',
                                                padding: '6px 10px',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{ fontSize: '10px', opacity: 0.8 }}>{stat.label}</div>
                                                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{stat.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Moves */}
                                {poke.moves.length > 0 && (
                                    <div>
                                        <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Moves</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                            {poke.moves.slice(0, 8).map((move, i) => (
                                                <div key={i} style={{
                                                    background: 'rgba(0,0,0,0.2)',
                                                    borderRadius: '6px',
                                                    padding: '6px 10px',
                                                    fontSize: '11px'
                                                }}>
                                                    <div className="font-bold">{move.name}</div>
                                                    <div style={{ opacity: 0.8, fontSize: '10px' }}>
                                                        {move.type} • {move.damage || 'Status'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Held Item */}
                                {poke.heldItem && (
                                    <div style={{ 
                                        marginTop: '10px', 
                                        fontSize: '12px',
                                        background: 'rgba(255,255,255,0.1)',
                                        padding: '6px 10px',
                                        borderRadius: '6px'
                                    }}>
                                        📎 Held: {poke.heldItem}
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                    
                    {cardType === 'pokemon' && !selectedCardPokemon && (
                        <div className="empty-state">
                            <p>Select a Pokémon above to preview their card</p>
                        </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px', flexWrap: 'wrap' }}>
                        <button 
                            className="btn btn-secondary"
                            onClick={() => {
                                let text = '';
                                if (cardType === 'trainer') {
                                    text = exportTrainerText();
                                } else if (cardType === 'team') {
                                    text = exportTeamText();
                                } else if (selectedCardPokemon) {
                                    text = exportPokemonText(selectedCardPokemon);
                                }
                                if (text) copyToClipboard(text);
                            }}
                            disabled={cardType === 'pokemon' && !selectedCardPokemon}
                        >
                            📋 Copy Text
                        </button>
                        <button 
                            className="btn btn-primary"
                            onClick={() => {
                                let cardId, filename;
                                if (cardType === 'trainer') {
                                    cardId = 'trainerCardExport';
                                    filename = `${trainer.name || 'trainer'}-card`;
                                } else if (cardType === 'team') {
                                    cardId = 'teamCardExport';
                                    filename = `${trainer.name || 'trainer'}-team-card`;
                                } else {
                                    cardId = 'pokemonCardExport';
                                    filename = `${selectedCardPokemon?.name || 'pokemon'}-card`;
                                }
                                downloadCardAsImage(cardId, filename);
                            }}
                            disabled={cardType === 'pokemon' && !selectedCardPokemon}
                        >
                            📷 Download Image
                        </button>
                    </div>
                </div>
            </div>
        )}
        
        {/* Class Skill Picker Modal */}
        {skillPickerModal.show && (
            <div className="modal-overlay" onClick={() => setSkillPickerModal({ ...skillPickerModal, show: false })}>
                <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3>🎯 Pick Skills for {skillPickerModal.className}</h3>
                        <button onClick={() => setSkillPickerModal({ ...skillPickerModal, show: false })} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
                    </div>
                    
                    <div className="p-20">
                        <p style={{ marginBottom: '15px', color: '#666' }}>
                            Select <strong>{skillPickerModal.skillCount}</strong> skill{skillPickerModal.skillCount > 1 ? 's' : ''} from the {skillPickerModal.className} skill pool:
                        </p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
                            {skillPickerModal.skillPool.map(skill => {
                                const isSelected = skillPickerModal.selectedSkills.includes(skill);
                                const skillData = GAME_DATA.skills[skill];
                                const canSelect = isSelected || skillPickerModal.selectedSkills.length < skillPickerModal.skillCount;
                                
                                return (
                                    <button
                                        key={skill}
                                        onClick={() => {
                                            if (isSelected) {
                                                setSkillPickerModal(prev => ({
                                                    ...prev,
                                                    selectedSkills: prev.selectedSkills.filter(s => s !== skill)
                                                }));
                                            } else if (canSelect) {
                                                setSkillPickerModal(prev => ({
                                                    ...prev,
                                                    selectedSkills: [...prev.selectedSkills, skill]
                                                }));
                                            }
                                        }}
                                        style={{
                                            padding: '12px',
                                            border: isSelected ? '2px solid #4caf50' : '2px solid #ddd',
                                            borderRadius: '8px',
                                            background: isSelected ? '#e8f5e9' : (canSelect ? 'white' : '#f5f5f5'),
                                            cursor: canSelect || isSelected ? 'pointer' : 'not-allowed',
                                            opacity: canSelect || isSelected ? 1 : 0.5,
                                            textAlign: 'left'
                                        }}
                                    >
                                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                            {isSelected && '✓ '}{skill}
                                        </div>
                                        <div className="text-muted-sm">
                                            {skillData?.stat || ''} • {skillData?.description?.substring(0, 50)}...
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        
                        <div className="flex-between">
                            <span style={{ color: skillPickerModal.selectedSkills.length === skillPickerModal.skillCount ? '#4caf50' : '#ff9800' }}>
                                Selected: {skillPickerModal.selectedSkills.length} / {skillPickerModal.skillCount}
                            </span>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                    onClick={() => setSkillPickerModal({ ...skillPickerModal, show: false })}
                                    style={{ padding: '10px 20px', border: '1px solid #ddd', borderRadius: '6px', background: 'white', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => {
                                        if (skillPickerModal.selectedSkills.length !== skillPickerModal.skillCount) {
                                            alert(`Please select exactly ${skillPickerModal.skillCount} skill(s)`);
                                            return;
                                        }
                                        
                                        const { cls, baseFeatures, featPointChange, isBaseClass } = skillPickerModal.pendingClassData;
                                        
                                        setTrainer(prev => {
                                            const existingFeatures = prev.features || [];
                                            const newFeatures = baseFeatures.filter(f => !existingFeatures.includes(f));
                                            
                                            return {
                                                ...prev,
                                                classes: [...(prev.classes || []), cls],
                                                features: [...existingFeatures, ...newFeatures],
                                                skills: [...(prev.skills || []), ...skillPickerModal.selectedSkills],
                                                classSkills: {
                                                    ...(prev.classSkills || {}),
                                                    [cls]: skillPickerModal.selectedSkills
                                                },
                                                featPoints: (prev.featPoints || 0) + featPointChange
                                            };
                                        });
                                        
                                        console.log(`Added ${cls} with skills:`, skillPickerModal.selectedSkills);
                                        setSkillPickerModal({ show: false, className: '', skillPool: [], skillCount: 0, selectedSkills: [], pendingClassData: null });
                                    }}
                                    disabled={skillPickerModal.selectedSkills.length !== skillPickerModal.skillCount}
                                    className="btn btn-primary"
                                    style={{ 
                                        padding: '10px 20px',
                                        opacity: skillPickerModal.selectedSkills.length === skillPickerModal.skillCount ? 1 : 0.5
                                    }}
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        {/* Detail Modal - Shows full info for moves, features, abilities, skills, items */}
        {detailModal.show && (
            <div className="modal-overlay" onClick={() => setDetailModal({ show: false, type: '', name: '', data: null })}>
                <div className="modal" style={{ maxWidth: '550px', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
                    <div className="modal-header" style={{ 
                        background: detailModal.type === 'move' ? `linear-gradient(135deg, ${getTypeColor(detailModal.data?.type)}, ${getTypeColor(detailModal.data?.type)}dd)` :
                                   detailModal.type === 'feature' ? 'linear-gradient(135deg, #667eea, #764ba2)' :
                                   detailModal.type === 'ability' ? 'linear-gradient(135deg, #f093fb, #f5576c)' :
                                   detailModal.type === 'skill' ? 'linear-gradient(135deg, #4facfe, #00f2fe)' :
                                   detailModal.type === 'item' ? 'linear-gradient(135deg, #fa709a, #fee140)' :
                                   'linear-gradient(135deg, #667eea, #764ba2)',
                        color: 'white'
                    }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span>
                                {detailModal.type === 'move' ? '⚔️' : 
                                 detailModal.type === 'feature' ? '⚡' : 
                                 detailModal.type === 'ability' ? '✨' : 
                                 detailModal.type === 'skill' ? '🎯' : 
                                 detailModal.type === 'item' ? '🎒' : '📋'}
                            </span>
                            {detailModal.name}
                        </h3>
                        <button onClick={() => setDetailModal({ show: false, type: '', name: '', data: null })} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'white', borderRadius: '50%', width: '30px', height: '30px' }}>×</button>
                    </div>
                    
                    <div className="p-20">
                        {/* Move Details */}
                        {detailModal.type === 'move' && detailModal.data && (
                            <div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
                                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: getTypeColor(detailModal.data.type), color: 'white' }}>
                                        {detailModal.data.type}
                                    </span>
                                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', background: detailModal.data.category === 'Physical' ? '#f44336' : detailModal.data.category === 'Special' ? '#2196f3' : '#9e9e9e', color: 'white' }}>
                                        {detailModal.data.category}
                                    </span>
                                    {detailModal.data.frequency && (
                                        <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', background: '#ff9800', color: 'white' }}>
                                            {detailModal.data.frequency}
                                        </span>
                                    )}
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '15px' }}>
                                    {detailModal.data.damage && (
                                        <div style={{ background: '#ffebee', padding: '10px', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '10px', color: '#c62828', fontWeight: 'bold' }}>DAMAGE</div>
                                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#b71c1c' }}>{detailModal.data.damage}</div>
                                        </div>
                                    )}
                                    {detailModal.data.ac && (
                                        <div style={{ background: '#e3f2fd', padding: '10px', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '10px', color: '#1565c0', fontWeight: 'bold' }}>ACCURACY</div>
                                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0d47a1' }}>{detailModal.data.ac}</div>
                                        </div>
                                    )}
                                    {detailModal.data.range && (
                                        <div style={{ background: '#f3e5f5', padding: '10px', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '10px', color: '#7b1fa2', fontWeight: 'bold' }}>RANGE</div>
                                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#4a148c' }}>{detailModal.data.range}</div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Effect - targeting info */}
                                {detailModal.data.effect && (
                                    <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                                        <div style={{ fontSize: '11px', color: '#2e7d32', fontWeight: 'bold', marginBottom: '5px' }}>TARGET / EFFECT</div>
                                        <div style={{ fontSize: '14px', lineHeight: '1.5', color: '#1b5e20' }}>{detailModal.data.effect}</div>
                                    </div>
                                )}
                                
                                {/* Description - full move explanation */}
                                {detailModal.data.description && (
                                    <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                                        <div style={{ fontSize: '11px', color: '#666', fontWeight: 'bold', marginBottom: '5px' }}>DESCRIPTION</div>
                                        <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#333' }}>{detailModal.data.description}</div>
                                    </div>
                                )}
                                
                                {/* Contest Info */}
                                {(detailModal.data.contestType || detailModal.data.contestEffect || detailModal.data.contest) && (
                                    <div style={{ background: 'linear-gradient(135deg, #fce4ec, #f3e5f5)', padding: '15px', borderRadius: '8px', marginBottom: '10px', border: '1px solid #f8bbd9' }}>
                                        <div style={{ fontSize: '11px', color: '#ad1457', fontWeight: 'bold', marginBottom: '8px' }}>🎭 CONTEST</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                                            {detailModal.data.contestType && (
                                                <span style={{ 
                                                    padding: '4px 10px', 
                                                    borderRadius: '12px', 
                                                    fontSize: '12px', 
                                                    fontWeight: 'bold',
                                                    background: detailModal.data.contestType === 'Beauty' ? '#e91e63' :
                                                               detailModal.data.contestType === 'Cool' ? '#2196f3' :
                                                               detailModal.data.contestType === 'Cute' ? '#ff9800' :
                                                               detailModal.data.contestType === 'Smart' ? '#4caf50' :
                                                               detailModal.data.contestType === 'Tough' ? '#795548' : '#9c27b0',
                                                    color: 'white'
                                                }}>
                                                    {detailModal.data.contestType}
                                                </span>
                                            )}
                                            {detailModal.data.contestDice && (
                                                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#7b1fa2' }}>
                                                    🎲 {detailModal.data.contestDice}
                                                </span>
                                            )}
                                        </div>
                                        {detailModal.data.contestEffect && (
                                            <div style={{ fontSize: '13px', lineHeight: '1.5', color: '#6a1b9a', marginTop: '8px' }}>
                                                {detailModal.data.contestEffect}
                                            </div>
                                        )}
                                        {/* Fallback for combined contest field */}
                                        {detailModal.data.contest && !detailModal.data.contestType && (
                                            <div style={{ fontSize: '13px', lineHeight: '1.5', color: '#6a1b9a' }}>
                                                {detailModal.data.contest}
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {/* Additional notes if any */}
                                {detailModal.data.notes && (
                                    <div style={{ background: '#fff3e0', padding: '15px', borderRadius: '8px', marginBottom: '10px', border: '1px solid #ffcc80' }}>
                                        <div style={{ fontSize: '11px', color: '#e65100', fontWeight: 'bold', marginBottom: '5px' }}>📝 NOTES</div>
                                        <div style={{ fontSize: '13px', lineHeight: '1.5', color: '#bf360c' }}>{detailModal.data.notes}</div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Feature Details */}
                        {detailModal.type === 'feature' && detailModal.data && (
                            <div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
                                    {detailModal.data.category && (
                                        <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: '#667eea', color: 'white' }}>
                                            {detailModal.data.category}
                                        </span>
                                    )}
                                    {detailModal.data.isBase && (
                                        <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: '#ff9800', color: 'white' }}>
                                            Base Feature
                                        </span>
                                    )}
                                    {detailModal.data.frequency && (
                                        <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', background: '#4caf50', color: 'white' }}>
                                            {detailModal.data.frequency}
                                        </span>
                                    )}
                                </div>
                                
                                {detailModal.data.prerequisites && (
                                    <div style={{ background: '#fff3e0', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                                        <div style={{ fontSize: '11px', color: '#e65100', fontWeight: 'bold', marginBottom: '3px' }}>PREREQUISITES</div>
                                        <div className="text-13">{detailModal.data.prerequisites}</div>
                                    </div>
                                )}
                                
                                {detailModal.data.trigger && (
                                    <div style={{ background: '#fce4ec', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                                        <div style={{ fontSize: '11px', color: '#c2185b', fontWeight: 'bold', marginBottom: '3px' }}>TRIGGER</div>
                                        <div className="text-13">{detailModal.data.trigger}</div>
                                    </div>
                                )}
                                
                                {detailModal.data.target && (
                                    <div style={{ background: '#e8eaf6', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                                        <div style={{ fontSize: '11px', color: '#303f9f', fontWeight: 'bold', marginBottom: '3px' }}>TARGET</div>
                                        <div className="text-13">{detailModal.data.target}</div>
                                    </div>
                                )}
                                
                                {detailModal.data.effect && (
                                    <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '11px', color: '#666', fontWeight: 'bold', marginBottom: '5px' }}>EFFECT</div>
                                        <div style={{ fontSize: '14px', lineHeight: '1.6' }}>{detailModal.data.effect}</div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Ability Details */}
                        {detailModal.type === 'ability' && (
                            <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                                    {typeof detailModal.data === 'string' ? detailModal.data : detailModal.data?.effect || detailModal.data?.description || 'No description available.'}
                                </div>
                            </div>
                        )}
                        
                        {/* Skill Details */}
                        {detailModal.type === 'skill' && detailModal.data && (
                            <div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
                                    {detailModal.data.stat && (
                                        <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', 
                                            background: { HP: '#4caf50', ATK: '#f44336', DEF: '#2196f3', SATK: '#9c27b0', SDEF: '#ff9800', SPD: '#00bcd4' }[detailModal.data.stat] || '#667eea', 
                                            color: 'white' }}>
                                            {detailModal.data.stat}
                                        </span>
                                    )}
                                    {detailModal.data.type && (
                                        <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', background: '#e0e0e0', color: '#333' }}>
                                            {detailModal.data.type}
                                        </span>
                                    )}
                                </div>
                                
                                <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                                        {detailModal.data.description || 'No description available.'}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Item Details */}
                        {detailModal.type === 'item' && detailModal.data && (
                            <div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
                                    {detailModal.data.category && (
                                        <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: '#ff9800', color: 'white' }}>
                                            {detailModal.data.category}
                                        </span>
                                    )}
                                    {detailModal.data.price && (
                                        <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', background: '#ffd700', color: '#5d4e00' }}>
                                            ₽{detailModal.data.price}
                                        </span>
                                    )}
                                </div>
                                
                                <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                                        {detailModal.data.effect || detailModal.data.description || 'No description available.'}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
        
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
