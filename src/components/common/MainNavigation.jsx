// ============================================================
// Main Navigation Component
// ============================================================
// Sidebar navigation extracted from App.jsx

import React from 'react';
import { TABS } from '../../data/constants.js';
import { useModal } from '../../contexts/index.js';
import { useOnboarding } from '../../hooks/useOnboarding.js';

const NAV_ITEMS = [
    { tab: TABS.TRAINER,   icon: '👤', label: 'Trainer',        mobileLabel: 'Trainer' },
    { tab: TABS.POKEMON,   icon: '🎮', label: 'Pokémon Team',   mobileLabel: 'Pokémon' },
    { tab: TABS.INVENTORY, icon: '🎒', label: 'Inventory',      mobileLabel: 'Items'   },
    { tab: TABS.BATTLE,    icon: '🎲', label: 'Dice Roller',    mobileLabel: 'Battle'  },
    { tab: TABS.REFERENCE, icon: '📚', label: 'Quick Reference', mobileLabel: 'Refs'   },
    { tab: TABS.NOTES,     icon: '📝', label: 'Campaign Notes', mobileLabel: 'Notes'   },
];


const MainNavigation = ({ activeTab, setActiveTab }) => {
    const { openSaveLoadModal } = useModal();
    const { steps, allDone, dismissed, dismiss } = useOnboarding();

    const showChecklist = !dismissed && !allDone;
    const showAllDone   = !dismissed && allDone;

    return (
        <div className="sidebar" role="navigation" aria-label="Main navigation">
            {NAV_ITEMS.map(({ tab, icon, label, mobileLabel }) => (
                <button
                    key={tab}
                    className={`nav-button ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                    aria-current={activeTab === tab ? 'page' : undefined}
                    aria-label={label}
                >
                    <span className="nav-icon">{icon}</span>
                    <span className="nav-label">{label}</span>
                    <span className="nav-mobile-label">{mobileLabel}</span>
                </button>
            ))}

            <div className="nav-divider" style={{ height: '1px', background: 'var(--border-light)', margin: '8px 0' }} />

            <button
                className="nav-button nav-saveload"
                onClick={openSaveLoadModal}
                title="Save or load a game state snapshot"
                aria-label="Open save and load menu"
            >
                <span className="nav-icon">💾</span>
                <span className="nav-label">Save / Load</span>
                <span className="nav-mobile-label">Save</span>
            </button>

            {/* Onboarding checklist — hidden on mobile (bottom bar has no room) */}
            {showChecklist && (
                <div className="nav-checklist" style={{
                    margin: '10px 8px 0',
                    borderRadius: '8px',
                    border: '1px solid #f5a62366',
                    overflow: 'hidden',
                    fontSize: '12px'
                }}>
                    {/* Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, #f5a623, #e8941c)',
                        color: 'white',
                        padding: '7px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontWeight: 700,
                        fontSize: '13px',
                        letterSpacing: '0.3px'
                    }}>
                        <span>✦ Getting Started</span>
                        <button
                            onClick={dismiss}
                            aria-label="Dismiss getting started checklist"
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255,255,255,0.85)',
                                cursor: 'pointer',
                                fontSize: '16px',
                                lineHeight: 1,
                                padding: '4px 6px',
                                minWidth: '28px',
                                minHeight: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >✕</button>
                    </div>

                    {/* Steps */}
                    <div style={{ padding: '6px 0', background: 'var(--surface-bg)' }}>
                        {steps.map(step => (
                            step.done ? (
                                <div key={step.id} style={{
                                    padding: '5px 10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '7px',
                                    color: '#2e7d32',
                                    fontWeight: 600
                                }}>
                                    <span>✓</span>
                                    <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>{step.label}</span>
                                </div>
                            ) : (
                                <button
                                    key={step.id}
                                    onClick={() => setActiveTab(step.tab)}
                                    style={{
                                        width: '100%',
                                        background: 'none',
                                        border: 'none',
                                        textAlign: 'left',
                                        padding: '7px 10px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '7px',
                                        color: 'var(--text-muted)',
                                        fontSize: '13px'
                                    }}
                                    title={`Go to ${step.tab} tab`}
                                >
                                    <span>○</span>
                                    <span>{step.label}</span>
                                </button>
                            )
                        ))}
                    </div>

                    {/* Footer hint */}
                    <div style={{
                        padding: '6px 10px 8px',
                        background: 'var(--surface-bg)',
                        borderTop: '1px solid var(--border-light)',
                        color: 'var(--text-muted)',
                        fontSize: '12px',
                        lineHeight: '1.5'
                    }}>
                        ⓘ Auto-saves every minute. Use Save/Load for snapshots.
                    </div>
                </div>
            )}

            {/* All done message — hidden on mobile */}
            {showAllDone && (
                <div className="nav-checklist" style={{
                    margin: '10px 8px 0',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: '#e8f5e9',
                    border: '1px solid #a5d6a7',
                    fontSize: '12px',
                    color: '#2e7d32',
                    lineHeight: '1.5'
                }}>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>✓ All set! You're ready to play.</div>
                    <button
                        onClick={dismiss}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#2e7d32',
                            cursor: 'pointer',
                            fontSize: '13px',
                            padding: '4px 0',
                            textDecoration: 'underline'
                        }}
                    >Dismiss</button>
                </div>
            )}
        </div>
    );
};

export default MainNavigation;
