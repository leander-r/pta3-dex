// ============================================================
// Modals Container Component
// ============================================================
// Renders all app-level modals in one place (extracted from App.jsx).
// Each modal is lazy-loaded — its JS chunk is fetched only when the
// modal is first opened, not at app startup.

import React, { lazy, Suspense } from 'react';

const CustomFeatureModal = lazy(() => import('../modals/CustomFeatureModal.jsx'));
const CustomMoveModal    = lazy(() => import('../modals/CustomMoveModal.jsx'));
const CustomSpeciesModal = lazy(() => import('../modals/CustomSpeciesModal.jsx'));
const MoveLearnModal     = lazy(() => import('../modals/MoveLearnModal.jsx'));
const RegionalFormModal  = lazy(() => import('../modals/RegionalFormModal.jsx'));
const CardExportModal    = lazy(() => import('../modals/CardExportModal.jsx'));
const SkillPickerModal   = lazy(() => import('../modals/SkillPickerModal.jsx'));
const DetailModal        = lazy(() => import('../modals/DetailModal.jsx'));
const BulkExpModal       = lazy(() => import('../modals/BulkExpModal.jsx'));
const ConfirmModal       = lazy(() => import('../modals/ConfirmModal.jsx'));

// null fallback: modals appear when the user triggers them, so a loading
// spinner inside the modal would be jarring. The chunk is small enough
// that the delay is imperceptible after the first open.
const ModalsContainer = () => (
    <Suspense fallback={null}>
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
    </Suspense>
);

export default ModalsContainer;
