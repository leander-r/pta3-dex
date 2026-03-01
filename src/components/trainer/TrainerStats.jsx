// ============================================================
// Trainer Stats Component
// ============================================================

import React from 'react';
import { useTrainerContext, useUI } from '../../contexts/index.js';

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
    return (
        <div className="section-card-purple">
            <h3 className="section-title-purple">
                <span>📊</span> Stats
                <button
                    onClick={() => showHelp('stat-allocation')}
                    style={HELP_BTN_STYLE}
                    aria-label="Help: Trainer Stats"
                    title="About stat allocation"
                >?</button>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="text-muted" style={{ fontSize: '12px', fontWeight: 'normal' }} title="Creation points are used during character creation (min 6, max 14). Level points are gained when leveling up.">
                        Creation: {trainer.statPoints} | Level: {trainer.levelStatPoints || 0}
                    </span>
                    <button
                        onClick={undoStatAllocation}
                        disabled={!canUndoStat}
                        title="Undo last stat change"
                        style={{
                            padding: '2px 8px',
                            fontSize: '11px',
                            background: canUndoStat ? '#ff9800' : '#ccc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: canUndoStat ? 'pointer' : 'not-allowed',
                            fontWeight: 'bold'
                        }}
                    >
                        ↩ Undo
                    </button>
                </span>
            </h3>
            <p className="section-description" style={{ fontSize: '11px' }}>
                Stats determine your trainer's capabilities. The modifier (shown below each stat) affects skill rolls.
            </p>

            <div className="grid-responsive-3 trainer-stats-grid">
                {STAT_CONFIG.map(stat => {
                    const mod = calculateModifier(stat.key);
                    return (
                        <div
                            key={stat.key}
                            className="bg-card"
                            style={{
                                borderRadius: '8px',
                                padding: '10px',
                                textAlign: 'center',
                                border: `2px solid ${stat.color}20`
                            }}
                        >
                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: stat.color, marginBottom: '5px' }}>
                                {stat.label}
                            </div>
                            <input
                                type="number"
                                value={trainer.stats[stat.key]}
                                onChange={(e) => updateTrainerStat(stat.key, e.target.value)}
                                min="6"
                                style={{
                                    width: '60px',
                                    textAlign: 'center',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    padding: '5px'
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

            {/* Evasion Display */}
            <div style={{ marginTop: '15px' }}>
                <div className="text-muted" style={{ fontSize: '10px', marginBottom: '6px', textAlign: 'center' }}>
                    Evasion bonuses make you harder to hit. Added to AC when targeted.
                </div>
                <div className="grid-responsive-3">
                    <div className="evasion-box-phys" style={{ textAlign: 'center', padding: '8px', borderRadius: '6px' }} title="Physical Evasion = DEF ÷ 5 (rounded down). Applies vs Physical attacks.">
                        <div style={{ fontSize: '10px', color: '#1565c0' }}>Phys Eva</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1565c0' }}>+{Math.floor(trainer.stats.def / 5)}</div>
                    </div>
                    <div className="evasion-box-spec" style={{ textAlign: 'center', padding: '8px', borderRadius: '6px' }} title="Special Evasion = SDEF ÷ 5 (rounded down). Applies vs Special attacks.">
                        <div style={{ fontSize: '10px', color: '#e65100' }}>Spec Eva</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#e65100' }}>+{Math.floor(trainer.stats.sdef / 5)}</div>
                    </div>
                    <div className="evasion-box-spd" style={{ textAlign: 'center', padding: '8px', borderRadius: '6px' }} title="Speed Evasion = SPD modifier (capped 0-6). Applies to dodge-based checks.">
                        <div style={{ fontSize: '10px', color: '#00838f' }}>Spd Eva</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#00838f' }}>+{Math.min(6, Math.max(0, calculateModifier(trainer.stats.spd)))}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrainerStats;
