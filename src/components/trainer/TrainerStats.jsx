// ============================================================
// Trainer Stats Component (PTA3)
// ============================================================

import React, { useState } from 'react';
import { useTrainerContext, useUI } from '../../contexts/index.js';
import { HELP_BTN_STYLE } from '../common/helpBtnStyle.js';
import { HP_MILESTONE_LEVELS } from '../../data/constants.js';

const STAT_CONFIG = [
    { key: 'atk',  label: 'ATK',  color: '#ff5722' },
    { key: 'def',  label: 'DEF',  color: '#2196f3' },
    { key: 'satk', label: 'SATK', color: '#9c27b0' },
    { key: 'sdef', label: 'SDEF', color: '#ff9800' },
    { key: 'spd',  label: 'SPD',  color: '#00bcd4' }
];

/**
 * TrainerStats - Trainer stats management (PTA3: 5 stats, 1–10 scale, flat HP)
 */
const TrainerStats = () => {
    const {
        trainer,
        updateTrainerStat,
        calculateModifier,
        calculateMaxHP,
        undoStatAllocation,
        canUndoStat,
        rollMilestoneHP
    } = useTrainerContext();
    const { showHelp } = useUI();
    const [collapsed, setCollapsed] = useState(true);

    const maxHp = calculateMaxHP();
    const hpRolls = trainer.hpRolls || [];

    // How many milestone rolls should be available at this level
    const milestonesReached = HP_MILESTONE_LEVELS.filter(l => l <= trainer.level).length;
    const rollsPending = milestonesReached - hpRolls.length;

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
                    <span
                        style={{
                            fontSize: '12px',
                            fontWeight: (trainer.levelStatPoints || 0) > 0 ? 'bold' : 'normal',
                            color: (trainer.levelStatPoints || 0) > 0 ? '#e65100' : 'var(--text-muted)'
                        }}
                        title="Creation points used during character creation (point-buy). Level points gained by leveling up."
                    >
                        Creation: {trainer.statPoints ?? 0} | Level: {trainer.levelStatPoints || 0}
                        {(trainer.levelStatPoints || 0) > 0 && ' ⬆'}
                    </span>
                    <button
                        onClick={(e) => { e.stopPropagation(); setCollapsed(c => !c); }}
                        aria-label={collapsed ? 'Expand Stats' : 'Collapse Stats'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: 'inherit' }}
                    >
                        <span style={{ display: 'inline-block', transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', fontSize: '12px' }}>▼</span>
                    </button>
                </span>
            </h3>

            {!collapsed && (
                <>
                    {/* HP Panel */}
                    <div style={{
                        marginBottom: '10px',
                        padding: '8px 12px',
                        borderRadius: '7px',
                        background: 'linear-gradient(180deg, #e5393525 0%, transparent 70%)',
                        border: '1px solid #e5393555',
                        borderTop: '3px solid #e53935',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px'
                    }}>
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#e53935', marginBottom: '2px' }}>
                                HP (Fixed)
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                {maxHp}
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                                    (20 base{hpRolls.length > 0 ? ` + ${hpRolls.join('+')} from rolls` : ''})
                                </span>
                            </div>
                        </div>
                        {rollsPending > 0 && (
                            <button
                                onClick={rollMilestoneHP}
                                style={{
                                    padding: '6px 14px',
                                    background: 'linear-gradient(135deg, #e53935, #b71c1c)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '13px'
                                }}
                                title={`Roll 1d4 HP bonus (${rollsPending} pending)`}
                            >
                                🎲 Roll HP Bonus (+1d4)
                            </button>
                        )}
                        {milestonesReached > 0 && rollsPending === 0 && (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                All milestone rolls used
                            </span>
                        )}
                    </div>

                    {/* 5 Stats Grid */}
                    <div className="trainer-stats-compact">
                        {STAT_CONFIG.map(stat => {
                            const val = trainer.stats[stat.key] ?? 3;
                            const mod = calculateModifier(val);
                            const btnStyle = (disabled) => ({
                                width: '28px', height: '28px',
                                border: `1.5px solid ${stat.color}99`,
                                borderRadius: '5px',
                                background: disabled ? 'transparent' : `${stat.color}22`,
                                color: disabled ? 'var(--text-muted)' : stat.color,
                                cursor: disabled ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold', fontSize: '16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, lineHeight: 1, padding: 0
                            });
                            return (
                                <div
                                    key={stat.key}
                                    style={{
                                        borderRadius: '7px',
                                        padding: '9px 6px',
                                        textAlign: 'center',
                                        border: `1px solid ${stat.color}55`,
                                        borderTop: `3px solid ${stat.color}`,
                                        background: `linear-gradient(180deg, ${stat.color}25 0%, transparent 70%)`
                                    }}
                                >
                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: stat.color, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {stat.label}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                        <button
                                            onClick={() => updateTrainerStat(stat.key, val - 1)}
                                            disabled={val <= 1}
                                            style={btnStyle(val <= 1)}
                                            aria-label={`Decrease ${stat.label}`}
                                        >−</button>
                                        <span style={{
                                            minWidth: '28px', textAlign: 'center',
                                            fontSize: '18px', fontWeight: 'bold',
                                            color: 'var(--text-primary)', lineHeight: 1
                                        }}>{val}</span>
                                        <button
                                            onClick={() => updateTrainerStat(stat.key, val + 1)}
                                            disabled={val >= 10 || (
                                                (trainer.levelStatAllocations || []).includes(stat.key) &&
                                                (trainer.levelStatPoints || 0) > 0 &&
                                                (trainer.statPoints || 0) === 0
                                            )}
                                            style={btnStyle(val >= 10 || (
                                                (trainer.levelStatAllocations || []).includes(stat.key) &&
                                                (trainer.levelStatPoints || 0) > 0 &&
                                                (trainer.statPoints || 0) === 0
                                            ))}
                                            title={(trainer.levelStatAllocations || []).includes(stat.key) && (trainer.levelStatPoints || 0) > 0 ? 'Already raised this level-up — choose a different stat' : undefined}
                                            aria-label={`Increase ${stat.label}`}
                                        >+</button>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#4caf50', fontWeight: 'bold', marginTop: '4px' }}>
                                        +{mod}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Defense Values + Undo */}
                    <div style={{ marginTop: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <div className="evasion-box-phys" style={{ flex: 1, textAlign: 'center', padding: '5px 4px', borderRadius: '6px' }} title="Physical Defense value (raw DEF stat). Incoming physical attacks roll vs. this.">
                            <div style={{ fontSize: '12px', color: '#1565c0' }}>DEF</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1565c0' }}>{trainer.stats.def ?? 3}</div>
                        </div>
                        <div className="evasion-box-spec" style={{ flex: 1, textAlign: 'center', padding: '5px 4px', borderRadius: '6px' }} title="Special Defense value (raw SDEF stat). Incoming special attacks roll vs. this.">
                            <div style={{ fontSize: '12px', color: '#e65100' }}>SDEF</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#e65100' }}>{trainer.stats.sdef ?? 3}</div>
                        </div>
                        <div className="evasion-box-spd" style={{ flex: 1, textAlign: 'center', padding: '5px 4px', borderRadius: '6px' }} title="Speed value (raw SPD stat). Used for Effect-type move evasion.">
                            <div style={{ fontSize: '12px', color: '#00838f' }}>SPD</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#00838f' }}>{trainer.stats.spd ?? 3}</div>
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
                </>
            )}

            {collapsed && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    <span style={{
                        padding: '3px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold',
                        background: '#e5393515', color: '#e53935', border: '1px solid #e5393540'
                    }}>
                        HP {maxHp}
                    </span>
                    {STAT_CONFIG.map(stat => {
                        const mod = calculateModifier(trainer.stats[stat.key] ?? 3);
                        return (
                            <span key={stat.key} style={{
                                padding: '3px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold',
                                background: `${stat.color}15`, color: stat.color, border: `1px solid ${stat.color}40`
                            }}>
                                {stat.label} {trainer.stats[stat.key] ?? 3}
                                <span style={{ opacity: 0.65, marginLeft: '2px' }}>(+{mod})</span>
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TrainerStats;
