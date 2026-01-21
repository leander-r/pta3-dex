// ============================================================
// SAFE STORAGE UTILITIES (with error handling)
// ============================================================

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

/**
 * Safely set item in localStorage
 */
export const safeLocalStorageSet = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`Error writing to localStorage (${key}):`, error);
        // Storage might be full, try to alert user
        if (error.name === 'QuotaExceededError') {
            console.warn('localStorage quota exceeded. Consider clearing old data.');
        }
        return false;
    }
};
