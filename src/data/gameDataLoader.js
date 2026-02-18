// ============================================================
// GAME DATA LOADER
// ============================================================

import { DATA_CONFIG, GAME_DATA, updateGameData } from './configs.js';

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
            if (cachedData) {
                console.log('Game data loaded from cache');
                updateGameData(cachedData);
                GAME_DATA._loaded = true;
                return true;
            }
        }
        
        // 2. Fetch from GitHub (with 15s timeout)
        console.log('Fetching game data from GitHub...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const response = await fetch(DATA_CONFIG.gameDataUrl, { signal: controller.signal });
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
        
        const data = JSON.parse(responseText);
        
        // 3. Merge with GAME_DATA
        if (data.natures) GAME_DATA.natures = data.natures;
        if (data.pokemonSkills) GAME_DATA.pokemonSkills = data.pokemonSkills;
        if (data.trainerClasses) GAME_DATA.trainerClasses = data.trainerClasses;
        if (data.features) GAME_DATA.features = data.features;
        if (data.moves) GAME_DATA.moves = data.moves;
        if (data.abilities) GAME_DATA.abilities = data.abilities;
        if (data.items) GAME_DATA.items = data.items;
        if (data.pokemonExpChart) GAME_DATA.pokemonExpChart = data.pokemonExpChart;
        
        GAME_DATA._loaded = true;
        GAME_DATA._loadedAt = Date.now();
        
        // 4. Cache the data
        await saveToGameDataDB('gamedata', data);
        await saveToGameDataDB('metadata', { timestamp: Date.now(), count: Object.keys(data).length });
        
        console.log('Game data loaded from GitHub:', 
            Object.keys(data.moves || {}).length, 'moves,',
            Object.keys(data.abilities || {}).length, 'abilities,',
            Object.keys(data.items || {}).length, 'items,',
            Object.keys(data.features || {}).length, 'features');
        
        return true;
        
    } catch (error) {
        console.warn('Failed to load game data from GitHub:', error.message);
        
        // Try stale cache
        const staleData = await getFromGameDataDB('gamedata');
        if (staleData) {
            console.log('Using stale cached game data');
            updateGameData(staleData);
            GAME_DATA._loaded = true;
            return true;
        }
        
        console.log('Using fallback minimal game data');
        return false;
    }
};

// Start loading game data immediately
export const gameDataLoadPromise = loadGameDataFromGitHub();
