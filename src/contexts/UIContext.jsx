// ============================================================
// UI Context
// ============================================================
// Core app shell state: navigation, theme, save indicator,
// level-up notifications, and Pokemon edit view.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { safeLocalStorageGet, safeLocalStorageSet } from '../utils/storageUtils.js';

const UIContext = createContext(null);

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within UIProvider');
    }
    return context;
};

export const UIProvider = ({ children }) => {
    // Navigation & UI State
    const [activeTab, setActiveTab] = useState('trainer');
    const [referenceTab, setReferenceTab] = useState('types');

    // Theme State - respects saved preference, falls back to system preference
    const [theme, setTheme] = useState(() => {
        const saved = safeLocalStorageGet('pta-theme', null);
        const initial = saved || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', initial);
        return initial;
    });

    // Compact/dense UI mode
    const [compactMode, setCompactMode] = useState(() => safeLocalStorageGet('pta-compact-mode', false));
    useEffect(() => {
        document.documentElement.setAttribute('data-compact', compactMode ? 'true' : 'false');
        safeLocalStorageSet('pta-compact-mode', compactMode);
    }, [compactMode]);

    // Save Indicator State
    const [showSaveIndicator, setShowSaveIndicator] = useState(false);
    const [isAutoSave, setIsAutoSave] = useState(false);
    const [lastSaveTime, setLastSaveTime] = useState(null);

    // Level Up Notification
    const [levelUpNotification, setLevelUpNotification] = useState(null);

    // Pokemon Edit State
    const [selectedPokemon, setSelectedPokemon] = useState(null);
    const [editingPokemon, setEditingPokemon] = useState(null);
    const [pokemonView, setPokemonView] = useState('party');

    // Help Modal State
    const [helpTopic, setHelpTopic] = useState(null);
    const showHelp  = useCallback((topic) => setHelpTopic(topic), []);
    const closeHelp = useCallback(() => setHelpTopic(null), []);

    // Save theme to localStorage and apply to document
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        safeLocalStorageSet('pta-theme', theme);
    }, [theme]);

    // Show save indicator
    const triggerSaveIndicator = useCallback((isAuto = false) => {
        setIsAutoSave(isAuto);
        setLastSaveTime(new Date());
        setShowSaveIndicator(true);
        setTimeout(() => setShowSaveIndicator(false), 2000);
    }, []);

    // Show level up notification
    const showLevelUpNotification = useCallback((notification) => {
        setLevelUpNotification(notification);
        setTimeout(() => setLevelUpNotification(null), 5000);
    }, []);

    const value = {
        // Navigation
        activeTab,
        setActiveTab,
        referenceTab,
        setReferenceTab,

        // Theme
        theme,
        setTheme,

        // Compact Mode
        compactMode,
        setCompactMode,

        // Save Indicator
        showSaveIndicator,
        isAutoSave,
        lastSaveTime,
        triggerSaveIndicator,

        // Level Up Notification
        levelUpNotification,
        setLevelUpNotification,
        showLevelUpNotification,

        // Pokemon View State
        selectedPokemon,
        setSelectedPokemon,
        editingPokemon,
        setEditingPokemon,
        pokemonView,
        setPokemonView,

        // Help Modal
        helpTopic,
        showHelp,
        closeHelp
    };

    return (
        <UIContext.Provider value={value}>
            {children}
        </UIContext.Provider>
    );
};

export default UIContext;
