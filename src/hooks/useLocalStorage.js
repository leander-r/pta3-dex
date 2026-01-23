// ============================================================
// useLocalStorage Hook
// ============================================================
// Generic localStorage hook with auto-save functionality

import { useState, useEffect, useCallback } from 'react';
import { safeLocalStorageGet, safeLocalStorageSet } from '../utils/storageUtils.js';

/**
 * Custom hook for localStorage persistence
 * @param {string} key - localStorage key
 * @param {*} initialValue - default value if key doesn't exist
 * @param {number} debounceMs - debounce time for auto-save (default 1000ms)
 * @returns {[*, Function, boolean]} - [value, setValue, isSaving]
 */
export const useLocalStorage = (key, initialValue, debounceMs = 1000) => {
    // Initialize state from localStorage or use initialValue
    const [value, setValue] = useState(() => {
        const stored = safeLocalStorageGet(key, null);
        return stored !== null ? stored : initialValue;
    });

    const [isSaving, setIsSaving] = useState(false);

    // Save to localStorage with debounce
    useEffect(() => {
        const saveTimeout = setTimeout(() => {
            setIsSaving(true);
            const success = safeLocalStorageSet(key, value);
            setTimeout(() => setIsSaving(false), 500);
            if (!success) {
                console.warn(`Failed to save ${key} to localStorage`);
            }
        }, debounceMs);

        return () => clearTimeout(saveTimeout);
    }, [key, value, debounceMs]);

    // Force save immediately
    const saveNow = useCallback(() => {
        setIsSaving(true);
        const success = safeLocalStorageSet(key, value);
        setTimeout(() => setIsSaving(false), 500);
        return success;
    }, [key, value]);

    return [value, setValue, isSaving, saveNow];
};

/**
 * Custom hook for persistent storage with cloud fallback
 * Attempts window.storage first, falls back to localStorage
 * @param {string} key - storage key
 * @param {*} initialValue - default value
 * @returns {[*, Function, boolean]} - [value, setValue, isSaving]
 */
export const usePersistentStorage = (key, initialValue) => {
    const [value, setValue] = useState(initialValue);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load on mount
    useEffect(() => {
        const loadData = async () => {
            let loadedData = null;

            // Try cloud storage first
            if (window.storage) {
                try {
                    const result = await window.storage.get(key);
                    if (result && result.value) {
                        loadedData = JSON.parse(result.value);
                    }
                } catch (err) {
                    console.warn('Cloud storage not available');
                }
            }

            // Fallback to localStorage
            if (!loadedData) {
                loadedData = safeLocalStorageGet(key, null);
            }

            if (loadedData !== null) {
                setValue(loadedData);
            }
            setIsLoaded(true);
        };

        loadData();
    }, [key]);

    // Save on value change (debounced)
    useEffect(() => {
        if (!isLoaded) return;

        const saveTimeout = setTimeout(async () => {
            setIsSaving(true);

            let saveSuccess = false;

            // Try cloud storage first
            if (window.storage) {
                try {
                    await window.storage.set(key, JSON.stringify(value));
                    saveSuccess = true;
                } catch (err) {
                    console.warn('Cloud save failed, falling back to localStorage');
                }
            }

            // Fallback to localStorage
            if (!saveSuccess) {
                saveSuccess = safeLocalStorageSet(key, value);
            }

            setTimeout(() => setIsSaving(false), 500);
        }, 1000);

        return () => clearTimeout(saveTimeout);
    }, [key, value, isLoaded]);

    return [value, setValue, isSaving, isLoaded];
};

export default useLocalStorage;
