// ============================================================
// Modal Context
// ============================================================
// Manages all modal state so modal open/close doesn't re-render
// the entire app tree — only components subscribed to ModalContext.

import React, { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext(null);

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within ModalProvider');
    }
    return context;
};

export const ModalProvider = ({ children }) => {
    // Confirm / Prompt Modal
    const [confirmModal, setConfirmModal] = useState({
        show: false, title: '', message: '', confirmLabel: 'Confirm',
        cancelLabel: 'Cancel', danger: false, inputConfig: null,
        onConfirm: null, onCancel: null
    });

    const showConfirm = useCallback((options) => {
        setConfirmModal({
            show: true, confirmLabel: 'Confirm', cancelLabel: 'Cancel',
            danger: false, inputConfig: null, onConfirm: null, onCancel: null,
            ...options
        });
    }, []);

    // Detail Modal
    const [detailModal, setDetailModal] = useState({
        show: false,
        type: '',
        name: '',
        data: null
    });

    const showDetail = useCallback((type, name, data) => {
        setDetailModal({ show: true, type, name, data });
    }, []);

    // Move / Feature / Reference info modals
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [selectedMove, setSelectedMove] = useState(null);
    const [showFeatureModal, setShowFeatureModal] = useState(false);
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [showReferenceModal, setShowReferenceModal] = useState(false);

    // Custom Feature Modal
    const [showCustomFeatureModal, setShowCustomFeatureModal] = useState(false);
    const [customFeature, setCustomFeature] = useState({
        name: '',
        category: 'Custom',
        prerequisites: '',
        frequency: '',
        trigger: '',
        target: '',
        effect: ''
    });

    // Custom Move Modal
    const [showCustomMoveModal, setShowCustomMoveModal] = useState(false);
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
    const [customMoveForPokemon, setCustomMoveForPokemon] = useState(null);

    // Custom Species Modal
    const [showCustomSpeciesModal, setShowCustomSpeciesModal] = useState(false);
    const [editingCustomSpeciesId, setEditingCustomSpeciesId] = useState(null);

    // Regional Form Modal
    const [showRegionalFormModal, setShowRegionalFormModal] = useState(false);
    const [regionalFormData, setRegionalFormData] = useState(null);

    // Move Learning Modal
    const [showMoveLearnModal, setShowMoveLearnModal] = useState(false);
    const [moveLearnData, setMoveLearnData] = useState(null);
    const [pendingMoveLearn, setPendingMoveLearn] = useState([]);

    // Card Export Modal
    const [showCardModal, setShowCardModal] = useState(false);
    const [cardType, setCardType] = useState('trainer');
    const [selectedCardPokemon, setSelectedCardPokemon] = useState(null);

    // Bulk EXP Modal
    const [showBulkExpModal, setShowBulkExpModal] = useState(false);

    // Comparison Modal
    const [showComparisonModal, setShowComparisonModal] = useState(false);
    const [comparisonIds, setComparisonIds] = useState([]);

    const openComparison = useCallback((id1, id2) => {
        setComparisonIds([id1, id2]);
        setShowComparisonModal(true);
    }, []);

    const closeComparison = useCallback(() => {
        setShowComparisonModal(false);
        setComparisonIds([]);
    }, []);

    // Skill Picker Modal
    const [skillPickerModal, setSkillPickerModal] = useState({
        show: false,
        className: '',
        skillPool: [],
        skillCount: 0,
        selectedSkills: [],
        pendingClassData: null
    });

    // Save/Load Modal
    const [showSaveLoadModal, setShowSaveLoadModal] = useState(false);
    const openSaveLoadModal  = useCallback(() => setShowSaveLoadModal(true),  []);
    const closeSaveLoadModal = useCallback(() => setShowSaveLoadModal(false), []);

    const value = {
        // Confirm Modal
        confirmModal,
        setConfirmModal,
        showConfirm,

        // Detail Modal
        detailModal,
        setDetailModal,
        showDetail,

        // Move / Feature / Reference info modals
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

        // Custom Feature Modal
        showCustomFeatureModal,
        setShowCustomFeatureModal,
        customFeature,
        setCustomFeature,

        // Custom Move Modal
        showCustomMoveModal,
        setShowCustomMoveModal,
        customMove,
        setCustomMove,
        customMoveForPokemon,
        setCustomMoveForPokemon,

        // Custom Species Modal
        showCustomSpeciesModal,
        setShowCustomSpeciesModal,
        editingCustomSpeciesId,
        setEditingCustomSpeciesId,

        // Regional Form Modal
        showRegionalFormModal,
        setShowRegionalFormModal,
        regionalFormData,
        setRegionalFormData,

        // Move Learning Modal
        showMoveLearnModal,
        setShowMoveLearnModal,
        moveLearnData,
        setMoveLearnData,
        pendingMoveLearn,
        setPendingMoveLearn,

        // Card Export Modal
        showCardModal,
        setShowCardModal,
        cardType,
        setCardType,
        selectedCardPokemon,
        setSelectedCardPokemon,

        // Bulk EXP Modal
        showBulkExpModal,
        setShowBulkExpModal,

        // Comparison Modal
        showComparisonModal,
        setShowComparisonModal,
        comparisonIds,
        setComparisonIds,
        openComparison,
        closeComparison,

        // Skill Picker Modal
        skillPickerModal,
        setSkillPickerModal,

        // Save/Load Modal
        showSaveLoadModal,
        openSaveLoadModal,
        closeSaveLoadModal
    };

    return (
        <ModalContext.Provider value={value}>
            {children}
        </ModalContext.Provider>
    );
};

export default ModalContext;
