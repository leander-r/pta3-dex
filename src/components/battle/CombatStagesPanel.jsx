import React, { useState } from 'react';
import { COMBAT_STAGE_POSITIVE_MULTIPLIER, COMBAT_STAGE_NEGATIVE_MULTIPLIER } from '../../data/constants.js';

const STATS = [
    { key: 'atk',  label: 'ATK',  color: '#f44336', desc: 'Attack - affects Physical move damage' },
    { key: 'def',  label: 'DEF',  color: '#2196f3', desc: 'Defense - reduces Physical damage taken' },
    { key: 'satk', label: 'SATK', color: '#9c27b0', desc: 'Special Attack - affects Special move damage' },
    { key: 'sdef', label: 'SDEF', color: '#ff9800', desc: 'Special Defense - reduces Special damage taken' },
    { key: 'spd',  label: 'SPD',  color: '#00bcd4', desc: 'Speed - determines turn order in battle' },
    { key: 'acc',  label: 'ACC',  color: '#4caf50', desc: 'Accuracy - adds/subtracts from hit roll (1d20)' },
    { key: 'eva',  label: 'EVA',  color: '#607d8b', desc: 'Evasion - subtracts from opponent hit rolls' },
];

const getModifiedStat = (baseStat, stages) => {
    if (stages > 0) return Math.floor(baseStat * (1 + stages * COMBAT_STAGE_POSITIVE_MULTIPLIER));
    if (stages < 0) return Math.ceil(baseStat * (1 - Math.abs(stages) * COMBAT_STAGE_NEGATIVE_MULTIPLIER));
    return baseStat;
};

const HELP_BTN_STYLE = {
    background: 'none',
    border: '1px solid var(--border-medium)',
    borderRadius: '50%',
    width: '18px', height: '18px',
    fontSize: '11px', fontWeight: 'bold',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    lineHeight: '16px',
    padding: 0, flexShrink: 0,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
};

const CombatStagesPanel = ({ selectedPokemon, combatStages, getStatsWithMega, updateCombatStage, resetCombatStages, onHelp }) => {
    const [show, setShow] = useState(false);

    if (!selectedPokemon) return null;

    const actualStats = getStatsWithMega(selectedPokemon);

    return (
        <div style={{ marginBottom: '12px' }}>
            <div
                role="button"
                tabIndex={0}
                aria-expanded={show}
                aria-label={`${show ? 'Hide' : 'Show'} combat stages`}
                onClick={() => setShow(v => !v)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setShow(v => !v)}
                className="combat-stages-header"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', marginBottom: show ? '8px' : 0 }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                        style={{ fontSize: '12px', fontWeight: 'bold' }}
                        title="Combat Stages track stat buffs and debuffs from moves. Each positive stage increases the stat by 25%, each negative stage decreases it by 10%. Range: -6 to +6."
                    >
                        Combat Stages
                    </span>
                    {onHelp && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onHelp(); }}
                            style={HELP_BTN_STYLE}
                            aria-label="Help: Combat Stages"
                            title="About combat stages"
                        >?</button>
                    )}
                    <span className="text-muted" style={{ fontSize: '10px', marginLeft: '2px' }}>Buffs & debuffs from moves</span>
                </div>
                <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                    style={{ color: 'var(--text-secondary)', transition: 'transform 0.2s ease', transform: show ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
                    aria-hidden="true"
                >
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            </div>
            {show && (
                <div className="combat-stages-content" style={{ padding: '10px', borderRadius: '6px' }}>
                    <div className="text-muted" style={{ fontSize: '10px', marginBottom: '8px', textAlign: 'center' }}>
                        +1 stage = +25% stat | −1 stage = −10% stat | Range: −6 to +6
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        {STATS.map(stat => {
                            const baseStat = actualStats[stat.key] || 0;
                            const stages = combatStages[stat.key] || 0;
                            const isModOnly = stat.key === 'acc' || stat.key === 'eva';
                            const modifiedStat = isModOnly ? stages : getModifiedStat(baseStat, stages);
                            return (
                                <div key={stat.key} className="combat-stat-box" style={{ textAlign: 'center', padding: '6px', borderRadius: '4px' }} title={stat.desc}>
                                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: stat.color }}>{stat.label}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                        {isModOnly ? '±' : baseStat} → <strong style={{ color: stages !== 0 ? (stages > 0 ? '#4caf50' : '#f44336') : 'var(--text-primary)' }}>
                                            {isModOnly ? (stages >= 0 ? '+' : '') + stages : modifiedStat}
                                        </strong>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px' }}>
                                        <button
                                            onClick={() => updateCombatStage(stat.key, -1)}
                                            style={{ width: '24px', height: '24px', border: 'none', borderRadius: '4px', background: '#ffcdd2', cursor: 'pointer', fontSize: '14px' }}
                                            aria-label={`Decrease ${stat.label}`}
                                        >−</button>
                                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: stages > 0 ? '#4caf50' : stages < 0 ? '#f44336' : '#999', minWidth: '20px' }}>
                                            {stages > 0 ? '+' : ''}{stages}
                                        </span>
                                        <button
                                            onClick={() => updateCombatStage(stat.key, 1)}
                                            style={{ width: '24px', height: '24px', border: 'none', borderRadius: '4px', background: '#c8e6c9', cursor: 'pointer', fontSize: '14px' }}
                                            aria-label={`Increase ${stat.label}`}
                                        >+</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <button
                        onClick={resetCombatStages}
                        style={{ marginTop: '8px', width: '100%', padding: '6px', background: '#9e9e9e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                    >
                        Reset All Stages
                    </button>
                </div>
            )}
        </div>
    );
};

export default CombatStagesPanel;
