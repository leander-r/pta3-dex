// ============================================================
// GAME DATA LOADER
// ============================================================

import { DATA_CONFIG, GAME_DATA, updateGameData } from './configs.js';
import { FETCH_TIMEOUT_MS } from './constants.js';

// ============================================================
// INDEXEDDB HELPERS FOR GAME DATA CACHING
// ============================================================

export const openGameDataDB = () => {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            reject(new Error('IndexedDB not supported'));
            return;
        }
        const request = indexedDB.open(DATA_CONFIG.dbName, DATA_CONFIG.dbVersion);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('gamedata')) {
                db.createObjectStore('gamedata', { keyPath: 'key' });
            }
            if (!db.objectStoreNames.contains('pokedex')) {
                db.createObjectStore('pokedex', { keyPath: 'key' });
            }
        };
    });
};

export const getFromGameDataDB = async (key) => {
    try {
        const db = await openGameDataDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('gamedata', 'readonly');
            const store = tx.objectStore('gamedata');
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result?.value);
            request.onerror = () => reject(request.error);
            tx.oncomplete = () => db.close();
        });
    } catch (e) {
        console.warn('GameData DB get error:', e);
        return null;
    }
};

export const saveToGameDataDB = async (key, value) => {
    try {
        const db = await openGameDataDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('gamedata', 'readwrite');
            const store = tx.objectStore('gamedata');
            store.put({ key, value, timestamp: Date.now() });
            tx.oncomplete = () => { db.close(); resolve(true); };
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.warn('GameData DB save error:', e);
        return false;
    }
};

/**
 * Load game data from GitHub (called at startup)
 */
export const loadGameDataFromGitHub = async () => {
    try {
        // 1. Check cache first
        const cachedMetadata = await getFromGameDataDB('metadata');
        if (cachedMetadata && (Date.now() - cachedMetadata.timestamp) < DATA_CONFIG.cacheDuration) {
            const cachedData = await getFromGameDataDB('gamedata');
            // Validate cache completeness — reject if abilities are missing or too few (stale pre-v285 cache)
            const abilityCount = Object.keys(cachedData?.abilities || {}).length;
            if (cachedData && abilityCount >= 100) {
                updateGameData(cachedData);
                GAME_DATA._loaded = true;
                return true;
            }
        }
        
        // 2. Fetch from GitHub (with timeout)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        const response = await fetch(DATA_CONFIG.gameDataUrl, { signal: controller.signal, mode: 'cors' });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Handle encoding (similar to Pokedex)
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
            }
        }
        
        const decoder = new TextDecoder(encoding);
        responseText = decoder.decode(uint8Array);
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            throw new Error('Failed to parse game data JSON');
        }
        
        // 3. Merge with GAME_DATA
        if (data.natures) GAME_DATA.natures = data.natures;
        if (data.pokemonSkills) GAME_DATA.pokemonSkills = data.pokemonSkills;
        if (data.trainerClasses) GAME_DATA.trainerClasses = data.trainerClasses;
        if (data.features) GAME_DATA.features = data.features;
        if (data.moves) GAME_DATA.moves = data.moves;
        if (data.abilities) GAME_DATA.abilities = data.abilities;
        if (data.items) GAME_DATA.items = data.items;
        if (data.uniqueZMoves) GAME_DATA.uniqueZMoves = data.uniqueZMoves;
        if (data.gigantamaxForms) GAME_DATA.gigantamaxForms = data.gigantamaxForms;
        // pokemonExpChart removed in PTA3 (honor-based leveling)
        
        GAME_DATA._loaded = true;
        GAME_DATA._loadedAt = Date.now();
        
        // 4. Cache the data
        await saveToGameDataDB('gamedata', data);
        await saveToGameDataDB('metadata', { timestamp: Date.now(), count: Object.keys(data).length });
        
        return true;
        
    } catch (error) {
        // Try stale cache
        const staleData = await getFromGameDataDB('gamedata');
        if (staleData) {
            updateGameData(staleData);
            GAME_DATA._loaded = true;
            return true;
        }
        
        return false;
    }
};

// Start loading game data immediately
export const gameDataLoadPromise = loadGameDataFromGitHub();
