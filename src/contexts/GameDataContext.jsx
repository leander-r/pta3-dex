// ============================================================
// Game Data Context
// ============================================================
// Provides Pokedex, GAME_DATA, and custom species management

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { GAME_DATA } from '../data/configs.js';
import { gameDataLoadPromise } from '../data/gameDataLoader.js';
import { loadPokedexFromGitHub } from '../data/pokedexLoader.js';

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
                // Game data loaded successfully
            }
        });
    }, []);

    // Fetch Pokedex (uses shared loader with timeout and caching)
    useEffect(() => {
        loadPokedexFromGitHub(setPokedex, setPokedexLoading, setPokedexError);
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
