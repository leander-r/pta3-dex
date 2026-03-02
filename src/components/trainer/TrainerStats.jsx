// ============================================================
// Trainer Stats Component
// ============================================================

import React, { useState } from 'react';
import { useTrainerContext, useUI } from '../../contexts/index.js';
import { HELP_BTN_STYLE } from '../common/helpBtnStyle.js';

const STAT_CONFIG = [
    { key: 'hp', label: 'HP', color: '#e53935' },
    { key: 'atk', label: 'ATK', color: '#ff5722' },
    { key: 'def', label: 'DEF', color: '#2196f3' },
    { key: 'satk', label: 'SATK', color: '#9c27b0' },
    { key: 'sdef', label: 'SDEF', color: '#ff9800' },
    { key: 'spd', label: 'SPD', color: '#00bcd4' }
];

/**
 * TrainerStats - Trainer stats management
 * Uses TrainerContext for state management
 */
const TrainerStats = () => {
    const { trainer, updateTrainerStat, calculateModifier, undoStatAllocation, canUndoStat } = useTrainerContext();
    const { showHelp } = useUI();
    const [collapsed, setCollapsed] = useState(true);
    return (
        <div className="section-card-purple">
            <h3 className="section-title-purple" onClick={() => setCollapsed(c => !c)} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <span>📊</span> Stats
                <button
                    onClick={(e) => { e.stopPropagation(); showHelp('stat-allocation'); }}
                    style={HELP_BTN_STYLE}
                    aria-label="Help: Trainer Stats"
                    title="About stat allocation"
                >?</button>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {!collapsed && (
                        <span className="text-muted" style={{ fontSize: '12px', fontWeight: 'normal' }} title="Creation points are used during character creation (min 6, max 14). Level points are gained when leveling up.">
                            Creation: {trainer.statPoints} | Level: {trainer.levelStatPoints || 0}
                        </span>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); setCollapsed(c => !c); }}
                        aria-label={collapsed ? 'Expand Stats' : 'Collapse Stats'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: 'inherit' }}
                    >
                        <span style={{ display: 'inline-block', transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', fontSize: '12px' }}>▼</span>
                    </button>
                </span>
            </h3>
            {!collapsed && <>
            <div className="trainer-stats-compact">
                {STAT_CONFIG.map(stat => {
                    const mod = calculateModifier(stat.key);
                    return (
                        <div
                            key={stat.key}
                            style={{
                                borderRadius: '7px',
                                padding: '9px 6px',
                                textAlign: 'center',
                                border: `1px solid ${stat.color}55`,
                                borderTop: `3px solid ${stat.color}`,
                                background: `linear-gradient(180deg, ${stat.color}25 0%, var(--card-bg, #fff) 70%)`
                            }}
                        >
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: stat.color, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {stat.label}
                            </div>
                            <input
                                type="number"
                                value={trainer.stats[stat.key]}
                                onChange={(e) => updateTrainerStat(stat.key, e.target.value)}
                                min="6"
                                style={{
                                    width: '50px',
                                    textAlign: 'center',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    border: `1.5px solid ${stat.color}99`,
                                    borderRadius: '5px',
                                    padding: '3px 2px',
                                    background: 'transparent',
                                    color: 'var(--text-primary)'
                                }}
                            />
                            <div style={{
                                fontSize: '12px',
                                color: mod >= 0 ? '#4caf50' : '#f44336',
                                fontWeight: 'bold',
                                marginTop: '3px'
                            }}>
                                {mod >= 0 ? '+' : ''}{mod}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Evasion Display + Undo */}
            <div style={{ marginTop: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <div className="evasion-box-phys" style={{ flex: 1, textAlign: 'center', padding: '5px 4px', borderRadius: '6px' }} title="Physical Evasion = DEF ÷ 5 (rounded down). Applies vs Physical attacks.">
                    <div style={{ fontSize: '10px', color: '#1565c0' }}>Phys Eva</div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1565c0' }}>+{Math.floor(trainer.stats.def / 5)}</div>
                </div>
                <div className="evasion-box-spec" style={{ flex: 1, textAlign: 'center', padding: '5px 4px', borderRadius: '6px' }} title="Special Evasion = SDEF ÷ 5 (rounded down). Applies vs Special attacks.">
                    <div style={{ fontSize: '10px', color: '#e65100' }}>Spec Eva</div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#e65100' }}>+{Math.floor(trainer.stats.sdef / 5)}</div>
                </div>
                <div className="evasion-box-spd" style={{ flex: 1, textAlign: 'center', padding: '5px 4px', borderRadius: '6px' }} title="Speed Evasion = SPD modifier (capped 0-6). Applies to dodge-based checks.">
                    <div style={{ fontSize: '10px', color: '#00838f' }}>Spd Eva</div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#00838f' }}>+{Math.min(6, Math.max(0, calculateModifier(trainer.stats.spd)))}</div>
                </div>
                <button
                    onClick={undoStatAllocation}
                    disabled={!canUndoStat}
                    title="Undo last stat change"
                    style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        background: canUndoStat ? '#ff9800' : 'var(--bg-light, #f5f5f5)',
                        color: canUndoStat ? 'white' : 'var(--text-muted)',
                        border: canUndoStat ? 'none' : '1px solid var(--border-medium, #ddd)',
                        borderRadius: '4px',
                        cursor: canUndoStat ? 'pointer' : 'not-allowed',
                        fontWeight: 'bold',
                        flexShrink: 0
                    }}
                >
                    ↩ Undo
                </button>
            </div>
            </>}
            {collapsed && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {STAT_CONFIG.map(stat => {
                        const mod = calculateModifier(stat.key);
                        return (
                            <span key={stat.key} style={{
                                padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold',
                                background: `${stat.color}15`, color: stat.color, border: `1px solid ${stat.color}40`
                            }}>
                                {stat.label} {trainer.stats[stat.key]}
                                <span style={{ opacity: 0.65, marginLeft: '2px' }}>({mod >= 0 ? '+' : ''}{mod})</span>
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TrainerStats;
