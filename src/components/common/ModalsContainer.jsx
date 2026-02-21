// ============================================================
// Modals Container Component
// ============================================================
// Renders all app-level modals in one place (extracted from App.jsx)

import React from 'react';
import {
    DetailModal,
    CustomFeatureModal,
    CustomMoveModal,
    CustomSpeciesModal,
    MoveLearnModal,
    RegionalFormModal,
    SkillPickerModal,
    CardExportModal,
    BulkExpModal,
    ConfirmModal
} from '../modals';

const ModalsContainer = () => (
    <>
        <CustomFeatureModal />
        <CustomMoveModal />
        <CustomSpeciesModal />
        <MoveLearnModal />
        <RegionalFormModal />
        <CardExportModal />
        <SkillPickerModal />
        <DetailModal />
        <BulkExpModal />
        <ConfirmModal />
    </>
);

export default ModalsContainer;
