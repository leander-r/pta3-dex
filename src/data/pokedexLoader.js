// ============================================================
// POKÉDEX DATA LOADER
// ============================================================

import { POKEDEX_CONFIG, FALLBACK_POKEDEX } from './configs.js';

// ============================================================
// INDEXEDDB HELPERS FOR POKÉDEX CACHING
// ============================================================

export const openPokedexDB = () => {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            reject(new Error('IndexedDB not supported'));
            return;
        }
        const request = indexedDB.open(POKEDEX_CONFIG.dbName, POKEDEX_CONFIG.dbVersion);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(POKEDEX_CONFIG.storeName)) {
                db.createObjectStore(POKEDEX_CONFIG.storeName, { keyPath: 'key' });
            }
        };
    });
};

export const getFromPokedexDB = async (key) => {
    try {
        const db = await openPokedexDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(POKEDEX_CONFIG.storeName, 'readonly');
            const store = transaction.objectStore(POKEDEX_CONFIG.storeName);
            const request = store.get(key);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result?.value || null);
            transaction.oncomplete = () => db.close();
        });
    } catch (error) {
        console.warn('IndexedDB get error:', error);
        return null;
    }
};

export const saveToPokedexDB = async (key, value) => {
    try {
        const db = await openPokedexDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(POKEDEX_CONFIG.storeName, 'readwrite');
            const store = transaction.objectStore(POKEDEX_CONFIG.storeName);
            const request = store.put({ key, value, timestamp: Date.now() });
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(true);
            transaction.oncomplete = () => db.close();
        });
    } catch (error) {
        console.warn('IndexedDB save error:', error);
        return false;
    }
};

/**
 * Load Pokédex data - checks cache first, then fetches from GitHub
 */
export const loadPokedexFromGitHub = async (setPokedex, setPokedexLoading, setPokedexError) => {
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
