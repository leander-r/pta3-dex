// ============================================================
// UI Context
// ============================================================
// Manages UI state: theme, active tab, modals, notifications

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

    // Theme State
    const [theme, setTheme] = useState(() => {
        const savedTheme = safeLocalStorageGet('pta-theme', 'light');
        document.documentElement.setAttribute('data-theme', savedTheme);
        return savedTheme;
    });

    // Save Indicator State
    const [showSaveIndicator, setShowSaveIndicator] = useState(false);
    const [isAutoSave, setIsAutoSave] = useState(false);
    const [lastSaveTime, setLastSaveTime] = useState(null);

    // Level Up Notification
    const [levelUpNotification, setLevelUpNotification] = useState(null);

    // Modal States
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [selectedMove, setSelectedMove] = useState(null);
    const [showFeatureModal, setShowFeatureModal] = useState(false);
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [showReferenceModal, setShowReferenceModal] = useState(false);
    const [showCustomFeatureModal, setShowCustomFeatureModal] = useState(false);
    const [showCustomMoveModal, setShowCustomMoveModal] = useState(false);
    const [customMoveForPokemon, setCustomMoveForPokemon] = useState(null);
    const [showCustomSpeciesModal, setShowCustomSpeciesModal] = useState(false);
    const [editingCustomSpeciesId, setEditingCustomSpeciesId] = useState(null);

    // Regional Form Selector State
    const [showRegionalFormModal, setShowRegionalFormModal] = useState(false);
    const [regionalFormData, setRegionalFormData] = useState(null);

    // Move Learning Modal State
    const [showMoveLearnModal, setShowMoveLearnModal] = useState(false);
    const [moveLearnData, setMoveLearnData] = useState(null);
    const [pendingMoveLearn, setPendingMoveLearn] = useState([]);

    // Card Export Modal State
    const [showCardModal, setShowCardModal] = useState(false);
    const [cardType, setCardType] = useState('trainer');
    const [selectedCardPokemon, setSelectedCardPokemon] = useState(null);

    // Skill Picker Modal State
    const [skillPickerModal, setSkillPickerModal] = useState({
        show: false,
        className: '',
        skillPool: [],
        skillCount: 0,
        selectedSkills: [],
        pendingClassData: null
    });

    // Detail Modal State
    const [detailModal, setDetailModal] = useState({
        show: false,
        type: '',
        name: '',
        data: null
    });

    // Pokemon Edit State
    const [selectedPokemon, setSelectedPokemon] = useState(null);
    const [editingPokemon, setEditingPokemon] = useState(null);
    const [pokemonView, setPokemonView] = useState('party');

    // Filter States
    const [movesFilter, setMovesFilter] = useState({
        search: '',
        type: '',
        category: '',
        frequency: '',
        sortBy: 'name',
        sortDir: 'asc'
    });

    const [abilitiesFilter, setAbilitiesFilter] = useState({
        search: '',
        sortBy: 'name',
        sortDir: 'asc'
    });

    const [moveSearchQuery, setMoveSearchQuery] = useState('');
    const [moveTypeFilter, setMoveTypeFilter] = useState('all');
    const [moveCategoryFilter, setMoveCategoryFilter] = useState('all');

    // Custom Feature Template
    const [customFeature, setCustomFeature] = useState({
        name: '',
        category: 'Custom',
        prerequisites: '',
        frequency: '',
        trigger: '',
        target: '',
        effect: ''
    });

    // Custom Move Template
    const [customMove, setCustomMove] = useState({
        name: '',
        type: 'Normal',
        category: 'Physical',
        frequency: 'At-Will',
        damage: '',
        range: 'Melee',
        effect: '',
        description: '',
        source: 'natural'
    });

    // Save theme to localStorage and apply to document
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        safeLocalStorageSet('pta-theme', theme);
    }, [theme]);

    // Helper to show detail modal
    const showDetail = useCallback((type, name, data) => {
        setDetailModal({ show: true, type, name, data });
    }, []);

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

        // Save Indicator
        showSaveIndicator,
        isAutoSave,
        lastSaveTime,
        triggerSaveIndicator,

        // Level Up Notification
        levelUpNotification,
        setLevelUpNotification,
        showLevelUpNotification,

        // Modals
        showMoveModal,
        setShowMoveModal,
        selectedMove,
        setSelectedMove,
        showFeatureModal,
        setShowFeatureModal,
        selectedFeature,
        setSelectedFeature,
        showReferenceModal,
        setShowReferenceModal,
        showCustomFeatureModal,
        setShowCustomFeatureModal,
        showCustomMoveModal,
        setShowCustomMoveModal,
        customMoveForPokemon,
        setCustomMoveForPokemon,
        showCustomSpeciesModal,
        setShowCustomSpeciesModal,
        editingCustomSpeciesId,
        setEditingCustomSpeciesId,

        // Regional Form Modal
        showRegionalFormModal,
        setShowRegionalFormModal,
        regionalFormData,
        setRegionalFormData,

        // Move Learn Modal
        showMoveLearnModal,
        setShowMoveLearnModal,
        moveLearnData,
        setMoveLearnData,
        pendingMoveLearn,
        setPendingMoveLearn,

        // Card Export
        showCardModal,
        setShowCardModal,
        cardType,
        setCardType,
        selectedCardPokemon,
        setSelectedCardPokemon,

        // Skill Picker
        skillPickerModal,
        setSkillPickerModal,

        // Detail Modal
        detailModal,
        setDetailModal,
        showDetail,

        // Pokemon View State
        selectedPokemon,
        setSelectedPokemon,
        editingPokemon,
        setEditingPokemon,
        pokemonView,
        setPokemonView,

        // Filters
        movesFilter,
        setMovesFilter,
        abilitiesFilter,
        setAbilitiesFilter,
        moveSearchQuery,
        setMoveSearchQuery,
        moveTypeFilter,
        setMoveTypeFilter,
        moveCategoryFilter,
        setMoveCategoryFilter,

        // Custom Feature/Move Templates
        customFeature,
        setCustomFeature,
        customMove,
        setCustomMove
    };

    return (
        <UIContext.Provider value={value}>
            {children}
        </UIContext.Provider>
    );
};

export default UIContext;
