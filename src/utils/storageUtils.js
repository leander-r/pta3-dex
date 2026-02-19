// ============================================================
// SAFE STORAGE UTILITIES (with error handling)
// ============================================================

import toast from './toast.js';

/**
 * Safely get item from localStorage with fallback
 */
export const safeLocalStorageGet = (key, fallback = null) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (error) {
        console.error(`Error reading from localStorage (${key}):`, error);
        return fallback;
    }
};

// Track quota warning so we don't spam the user
let _quotaWarned = false;

/**
 * Safely set item in localStorage
 */
export const safeLocalStorageSet = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`Error writing to localStorage (${key}):`, error);
        if (error.name === 'QuotaExceededError') {
            if (!_quotaWarned) {
                _quotaWarned = true;
                toast.error('Storage is full! Export your data as a backup, then clear old trainers to free space.');
                setTimeout(() => { _quotaWarned = false; }, 60000);
            }
        }
        return false;
    }
};
