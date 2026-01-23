// ============================================================
// Save Indicator Component
// ============================================================

import React from 'react';

/**
 * SaveIndicator - Shows auto-save status
 * @param {Object} props
 * @param {boolean} props.show - Whether to show the indicator
 */
const SaveIndicator = ({ show }) => {
    return (
        <div className={`save-indicator ${show ? 'show' : ''}`}>
            Auto-saved
        </div>
    );
};

export default SaveIndicator;
