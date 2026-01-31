// ============================================================
// Game Data Context
// ============================================================
// Provides Pokedex, GAME_DATA, and custom species management

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { DATA_CONFIG, POKEDEX_CONFIG, FALLBACK_POKEDEX, GAME_DATA } from '../data/configs.js';
import { gameDataLoadPromise } from '../data/gameDataLoader.js';
import { getFromPokedexDB, saveToPokedexDB } from '../data/pokedexLoader.js';

const GameDataContext = createContext(null);

export const useGameData = () => {
    const context = useContext(GameDataContext);
    if (!context) {
        throw new Error('useGameData must be used within GameDataProvider');
    }
    return context;
};

export const GameDataProvider = ({ children, customSpecies = [], setCustomSpecies }) => {
    // Pokedex state
    const [pokedex, setPokedex] = useState([]);
    const [pokedexLoading, setPokedexLoading] = useState(true);
    const [pokedexError, setPokedexError] = useState(null);
    const [gameDataLoaded, setGameDataLoaded] = useState(GAME_DATA._loaded || false);
    const [speciesSearch, setSpeciesSearch] = useState('');

    // Wait for game data to load
    useEffect(() => {
        gameDataLoadPromise.then(loaded => {
            setGameDataLoaded(loaded);
            if (loaded && GAME_DATA._loaded) {
                console.log('Game data ready:',
                    Object.keys(GAME_DATA.moves || {}).length, 'moves,',
                    Object.keys(GAME_DATA.abilities || {}).length, 'abilities,',
                    Object.keys(GAME_DATA.features || {}).length, 'features');
            }
        });
    }, []);

    // Fetch Pokedex
    useEffect(() => {
        const fetchPokedex = async () => {
            setPokedexLoading(true);
            setPokedexError(null);

            try {
                // Check IndexedDB cache first
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

                // Fetch from GitHub
                console.log('Fetching Pokédex from remote...');
                const response = await fetch(POKEDEX_CONFIG.remoteUrl);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const arrayBuffer = await response.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);

                console.log('Response size:', uint8Array.length, 'bytes');

                let responseText;
                let encoding = 'utf-8';

                // Detect encoding from BOM
                if (uint8Array.length >= 2) {
                    if (uint8Array[0] === 0xFF && uint8Array[1] === 0xFE) {
                        encoding = 'utf-16le';
                    } else if (uint8Array[0] === 0xFE && uint8Array[1] === 0xFF) {
                        encoding = 'utf-16be';
                    } else if (uint8Array.length >= 3 && uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF) {
                        encoding = 'utf-8';
                    } else if (uint8Array[0] === 0x1F && uint8Array[1] === 0x8B) {
                        // Gzip
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
                    }
                }

                if (!responseText) {
                    const decoder = new TextDecoder(encoding);
                    responseText = decoder.decode(uint8Array);
                }

                const trimmed = responseText.trim();
                if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
                    throw new Error('Response is not valid JSON');
                }

                const data = JSON.parse(responseText);
                const pokemonList = data.pokemon || data;

                if (!Array.isArray(pokemonList)) {
                    throw new Error('Invalid Pokédex format - expected array');
                }

                // Cache in IndexedDB
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

    // Filtered species list
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

    // Get level-up moves for a Pokemon (supports regional forms)
    const getLevelUpMovesForPokemon = (pokemon) => {
        if (pokemon?.availableLevelUpMoves && pokemon.availableLevelUpMoves.length > 0) {
            return pokemon.availableLevelUpMoves;
        }

        const species = pokemon?.species;
        if (!species || !pokedex || pokedex.length === 0) return [];

        let speciesData = customSpecies?.find(p =>
            p.species?.toLowerCase() === species.toLowerCase()
        );
        if (!speciesData) {
            speciesData = pokedex.find(p =>
                p.species?.toLowerCase() === species.toLowerCase()
            );
        }

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

    // Legacy function for backwards compatibility
    const getLevelUpMovesForSpecies = (species) => {
        if (!species || !pokedex || pokedex.length === 0) return [];
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

    // Get moves for level range
    const getMovesForLevelRange = (pokemon, fromLevel, toLevel) => {
        const levelUpMoves = typeof pokemon === 'object'
            ? getLevelUpMovesForPokemon(pokemon)
            : getLevelUpMovesForSpecies(pokemon);

        if (fromLevel < toLevel) {
            return levelUpMoves.filter(m => m.level > fromLevel && m.level <= toLevel);
        } else {
            return levelUpMoves.filter(m => m.level > toLevel && m.level <= fromLevel);
        }
    };

    const value = {
        // Pokedex
        pokedex,
        pokedexLoading,
        pokedexError,
        filteredSpecies,
        speciesSearch,
        setSpeciesSearch,

        // Game Data
        GAME_DATA,
        gameDataLoaded,

        // Custom Species
        customSpecies,
        setCustomSpecies,

        // Move helpers
        getLevelUpMovesForPokemon,
        getLevelUpMovesForSpecies,
        getMovesForLevelRange
    };

    return (
        <GameDataContext.Provider value={value}>
            {children}
        </GameDataContext.Provider>
    );
};

export default GameDataContext;
