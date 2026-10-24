// ============================================================
// Main Navigation Component
// ============================================================
// Sidebar / bottom-bar navigation. Holds ONLY navigation tabs —
// actions (save/load, export, print) live in the header menus.

import React, { useState, useRef, useEffect } from 'react';
import { TABS } from '../../data/constants.js';
import { useOnboarding } from '../../hooks/useOnboarding.js';
import { IconPerson, IconPokeball, IconBag, IconDice, IconBook, IconFileText, IconMap, IconKebab } from './NavIcons.jsx';

// `primary: true` tabs get a permanent slot in the mobile bottom bar.
// The rest collapse into the "More" overflow popover on mobile (desktop
// sidebar always shows every tab — there's room).
const NAV_ITEMS = [
    { tab: TABS.TRAINER,   icon: IconPerson,   label: 'Trainer',         mobileLabel: 'Trainer', primary: true },
    { tab: TABS.POKEMON,   icon: IconPokeball, label: 'Pokémon Team',    mobileLabel: 'Pokémon', primary: true },
    { tab: TABS.INVENTORY, icon: IconBag,       label: 'Inventory',       mobileLabel: 'Items',   primary: true },
    { tab: TABS.BATTLE,    icon: IconDice,      label: 'Dice Roller',     mobileLabel: 'Battle',  primary: true },
    { tab: TABS.REFERENCE, icon: IconBook,      label: 'Quick Reference', mobileLabel: 'Refs',    primary: true },
    { tab: TABS.NOTES,     icon: IconFileText,  label: 'Campaign Notes',  mobileLabel: 'Notes',   primary: false },
    { tab: TABS.GM,        icon: IconMap,       label: 'GM Tools',        mobileLabel: 'GM',      primary: false },
];

const SECONDARY_ITEMS = NAV_ITEMS.filter(i => !i.primary);

const MainNavigation = ({ activeTab, setActiveTab }) => {
    const { steps, allDone, dismissed, dismiss } = useOnboarding();
    const [showMore, setShowMore] = useState(false);
    const moreRef = useRef(null);

    const showChecklist = !dismissed && !allDone;
    const showAllDone   = !dismissed && allDone;

    // Close the overflow popover on outside click/tap or Escape
    useEffect(() => {
        if (!showMore) return;
        const handleOutside = (e) => {
            if (moreRef.current && !moreRef.current.contains(e.target)) setShowMore(false);
        };
        const handleKey = (e) => { if (e.key === 'Escape') setShowMore(false); };
        document.addEventListener('mousedown', handleOutside);
        document.addEventListener('touchstart', handleOutside, { passive: true });
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleOutside);
            document.removeEventListener('touchstart', handleOutside);
            document.removeEventListener('keydown', handleKey);
        };
    }, [showMore]);

    return (
        <div className="sidebar" role="navigation" aria-label="Main navigation">
            {NAV_ITEMS.map(({ tab, icon: Icon, label, mobileLabel, primary }) => (
                <button
                    key={tab}
                    className={`nav-button ${activeTab === tab ? 'active' : ''} ${primary ? '' : 'nav-secondary'}`}
                    onClick={() => setActiveTab(tab)}
                    aria-current={activeTab === tab ? 'page' : undefined}
                    aria-label={label}
                >
                    <span className="nav-icon"><Icon /></span>
                    <span className="nav-label">{label}</span>
                    <span className="nav-mobile-label">{mobileLabel}</span>
                </button>
            ))}

            {/* Mobile-only overflow trigger — hidden on desktop via CSS since the
                sidebar has room to show every tab directly. `display:contents` keeps
                the button (and popover) as direct flex children of .sidebar on mobile. */}
            <div style={{ display: 'contents' }} ref={moreRef}>
                <button
                    className="nav-button nav-more-button"
                    onClick={() => setShowMore(p => !p)}
                    aria-expanded={showMore}
                    aria-haspopup="true"
                    aria-label="More navigation options"
                >
                    <span className="nav-icon"><IconKebab /></span>
                    <span className="nav-label">More</span>
                    <span className="nav-mobile-label">More</span>
                </button>

                {showMore && (
                    <div className="nav-more-popover" role="menu">
                        {SECONDARY_ITEMS.map(({ tab, icon: Icon, label }) => (
                            <button
                                key={tab}
                                role="menuitem"
                                className={`nav-more-item ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => { setActiveTab(tab); setShowMore(false); }}
                            >
                                <span className="nav-icon"><Icon /></span>
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Onboarding checklist — hidden on mobile (bottom bar has no room).
                Reachable instead via Header's "Getting Started" / "Help Topics" menu items. */}
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
                        ⓘ Auto-saves every minute. Use the header's Data &amp; Export menu for snapshots.
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
