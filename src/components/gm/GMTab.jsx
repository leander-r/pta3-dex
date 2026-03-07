// ============================================================
// GM Tab — Game Master tools
// ============================================================

import React, { useState } from 'react';
import CaptureCalculator from './CaptureCalculator.jsx';
import EncounterGuide from './EncounterGuide.jsx';
import RewardTables from './RewardTables.jsx';

const sections = [
    { id: 'capture',   label: '🎯 Capture Rates' },
    { id: 'encounter', label: '⚔️ Encounter Guide' },
    { id: 'rewards',   label: '💰 Rewards & Loot' },
];

const GMTab = () => {
    const [activeSection, setActiveSection] = useState('capture');
    return (
        <div>
            <h2 className="section-title">Game Master Tools</h2>
            <p className="section-description">
                Reference tables, calculators, and encounter tools for the GM. Based on the PTA3 Game Master's Guide.
            </p>

            <div className="tabs" style={{ marginBottom: '16px' }}>
                {sections.map(s => (
                    <button
                        key={s.id}
                        className={`tab ${activeSection === s.id ? 'active' : ''}`}
                        onClick={() => setActiveSection(s.id)}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {activeSection === 'capture'   && <CaptureCalculator />}
            {activeSection === 'encounter' && <EncounterGuide />}
            {activeSection === 'rewards'   && <RewardTables />}
        </div>
    );
};

export default GMTab;
