// ============================================================
// Save Indicator Component
// ============================================================

import React from 'react';

/**
 * SaveIndicator - Shows save status with optional timestamp
 * @param {Object} props
 * @param {boolean} props.show - Whether to show the indicator
 * @param {boolean} props.isAuto - Whether this was an auto-save
 * @param {Date} props.saveTime - When the save occurred
 */
const SaveIndicator = ({ show, isAuto = false, saveTime = null }) => {
    const formatTime = (date) => {
        if (!date) return '';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={`save-indicator ${show ? 'show' : ''}`}>
            {isAuto ? 'Auto-saved' : 'Saved'} {saveTime && `at ${formatTime(saveTime)}`}
        </div>
    );
};

export default SaveIndicator;
