// ============================================================
// usePokedex Hook
// ============================================================
// Pokedex data fetching and caching

import { useState, useEffect, useMemo, useCallback } from 'react';
import { POKEDEX_CONFIG, FALLBACK_POKEDEX } from '../data/configs.js';
import { getFromPokedexDB, saveToPokedexDB } from '../data/pokedexLoader.js';

/**
 * Custom hook for Pokedex data management
 * @returns {Object} - { pokedex, loading, error, filteredSpecies, speciesSearch, setSpeciesSearch, refreshPokedex }
 */
export const usePokedex = () => {
    const [pokedex, setPokedex] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [speciesSearch, setSpeciesSearch] = useState('');

    // Fetch Pokedex data
    const fetchPokedex = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // 1. Check IndexedDB cache first
            const cachedMeta = await getFromPokedexDB('metadata');
            if (cachedMeta && (Date.now() - cachedMeta.timestamp) < POKEDEX_CONFIG.cacheDuration) {
                const cachedData = await getFromPokedexDB('pokedex');
                if (cachedData && Array.isArray(cachedData)) {
                    setPokedex(cachedData);
                    setLoading(false);
                    return;
                }
            }

            // 2. Fetch from GitHub (with 15s timeout)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            const response = await fetch(POKEDEX_CONFIG.remoteUrl, { signal: controller.signal, mode: 'cors' });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Read as ArrayBuffer to handle encoding
            const arrayBuffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

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
                    // Gzip compressed
                    if (typeof DecompressionStream !== 'undefined') {
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
                    } else {
                        throw new Error('Gzip decompression not supported');
                    }
                }
            }

            // Decode if not already decompressed
            if (responseText === undefined) {
                const decoder = new TextDecoder(encoding);
                responseText = decoder.decode(uint8Array);
            }

            if (!responseText) {
                throw new Error('Pokédex response was empty after decoding');
            }

            // Validate JSON
            const trimmed = responseText.trim();
            if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
                throw new Error('Response is not valid JSON');
            }

            // Parse JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                throw new Error('Failed to parse Pokédex JSON');
            }
            const pokemonList = data.pokemon || data;

            if (!Array.isArray(pokemonList)) {
                throw new Error('Invalid Pokedex format - expected array');
            }

            // 3. Cache in IndexedDB
            await saveToPokedexDB('pokedex', pokemonList);
            await saveToPokedexDB('metadata', {
                timestamp: Date.now(),
                count: pokemonList.length
            });

            setPokedex(pokemonList);

        } catch (err) {
            // Try stale cache
            const staleCache = await getFromPokedexDB('pokedex');
            if (staleCache && Array.isArray(staleCache)) {
                setPokedex(staleCache);
                setError('Using cached data');
            } else if (POKEDEX_CONFIG.fallbackEnabled) {
                setPokedex(FALLBACK_POKEDEX);
                setError('Using offline mini-dex (limited Pokemon)');
            } else {
                setError('Pokedex unavailable - manual entry only');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Load on mount
    useEffect(() => {
        fetchPokedex();
    }, [fetchPokedex]);

    // Filtered species list (memoized)
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

    // Find species by name
    const findSpecies = useCallback((speciesName) => {
        if (!speciesName || !pokedex) return null;
        return pokedex.find(p =>
            p.species?.toLowerCase() === speciesName.toLowerCase()
        );
    }, [pokedex]);

    // Get level-up moves for a species
    const getLevelUpMoves = useCallback((speciesName, regionalForm = null) => {
        const species = findSpecies(speciesName);
        if (!species) return [];

        if (regionalForm && species.regionalForms) {
            const form = species.regionalForms.find(rf => rf.name === regionalForm);
            if (form?.levelUpMoves) {
                return form.levelUpMoves;
            }
        }

        return species.levelUpMoves || [];
    }, [findSpecies]);

    return {
        pokedex,
        loading,
        error,
        filteredSpecies,
        speciesSearch,
        setSpeciesSearch,
        refreshPokedex: fetchPokedex,
        findSpecies,
        getLevelUpMoves
    };
};

export default usePokedex;
