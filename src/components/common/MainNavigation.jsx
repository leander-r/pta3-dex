// ============================================================
// Main Navigation Component
// ============================================================
// Sidebar navigation extracted from App.jsx

import React from 'react';
import { TABS } from '../../data/constants.js';
import { useModal } from '../../contexts/index.js';

const NAV_ITEMS = [
    { tab: TABS.TRAINER,   icon: '👤', label: 'Trainer' },
    { tab: TABS.POKEMON,   icon: '🎮', label: 'Pokémon Team' },
    { tab: TABS.INVENTORY, icon: '🎒', label: 'Inventory' },
    { tab: TABS.BATTLE,    icon: '🎲', label: 'Dice Roller' },
    { tab: TABS.REFERENCE, icon: '📚', label: 'Quick Reference' },
    { tab: TABS.NOTES,     icon: '📝', label: 'Campaign Notes' },
];

const MainNavigation = ({ activeTab, setActiveTab }) => {
    const { openSaveLoadModal } = useModal();

    return (
        <div className="sidebar" role="navigation" aria-label="Main navigation">
            {NAV_ITEMS.map(({ tab, icon, label }) => (
                <button
                    key={tab}
                    className={`nav-button ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                    aria-current={activeTab === tab ? 'page' : undefined}
                >
                    <span className="nav-icon">{icon}</span>
                    <span>{label}</span>
                </button>
            ))}

            <div style={{ height: '1px', background: 'var(--border-light)', margin: '8px 0' }} />

            <button
                className="nav-button"
                onClick={openSaveLoadModal}
                title="Save or load a game state snapshot"
                aria-label="Open save and load menu"
            >
                <span className="nav-icon">💾</span>
                <span>Save / Load</span>
            </button>
        </div>
    );
};

export default MainNavigation;
