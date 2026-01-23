// ============================================================
// Reference Tab Component
// ============================================================
// Quick reference section with type chart, moves, abilities, etc.

import React, { useState, useMemo } from 'react';
import { GAME_DATA } from '../../data/configs.js';
import { TYPE_CHART, POKEMON_TYPES } from '../../data/typeChart.js';
import { getTypeColor } from '../../utils/typeUtils.js';

// Sub-components for each reference section
import TypeChartSection from './TypeChartSection.jsx';
import NaturesSection from './NaturesSection.jsx';
import MovesSection from './MovesSection.jsx';
import AbilitiesSection from './AbilitiesSection.jsx';
import ExpChartSection from './ExpChartSection.jsx';
import GameRulesSection from './GameRulesSection.jsx';

/**
 * ReferenceTab - Quick reference database browser
 * @param {Object} props
 * @param {Function} props.showDetail - Function to show detail modal
 */
const ReferenceTab = ({ showDetail }) => {
    const [activeSection, setActiveSection] = useState('types');

    const sections = [
        { id: 'types', label: 'Type Chart' },
        { id: 'natures', label: 'Natures' },
        { id: 'moves', label: 'Moves Database' },
        { id: 'abilities', label: 'Abilities' },
        { id: 'rules', label: 'Game Rules' },
        { id: 'exp', label: 'EXP Chart' }
    ];

    return (
        <div>
            <h2 className="section-title">Quick Reference</h2>

            {/* Tab Navigation */}
            <div className="tabs">
                {sections.map(section => (
                    <button
                        key={section.id}
                        className={`tab ${activeSection === section.id ? 'active' : ''}`}
                        onClick={() => setActiveSection(section.id)}
                    >
                        {section.label}
                    </button>
                ))}
            </div>

            {/* Content Sections */}
            {activeSection === 'types' && <TypeChartSection />}
            {activeSection === 'natures' && <NaturesSection />}
            {activeSection === 'moves' && <MovesSection showDetail={showDetail} />}
            {activeSection === 'abilities' && <AbilitiesSection showDetail={showDetail} />}
            {activeSection === 'rules' && <GameRulesSection />}
            {activeSection === 'exp' && <ExpChartSection />}
        </div>
    );
};

export default ReferenceTab;
