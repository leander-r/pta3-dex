// ============================================================
// Trainer Stats Component
// ============================================================

import React from 'react';

const STAT_CONFIG = [
    { key: 'hp', label: 'HP', color: '#e53935' },
    { key: 'atk', label: 'ATK', color: '#ff5722' },
    { key: 'def', label: 'DEF', color: '#2196f3' },
    { key: 'satk', label: 'SATK', color: '#9c27b0' },
    { key: 'sdef', label: 'SDEF', color: '#ff9800' },
    { key: 'spd', label: 'SPD', color: '#00bcd4' }
];

const TrainerStats = ({ trainer, updateTrainerStat, calculateModifier }) => {
    return (
        <div className="section-card-purple">
            <h3 className="section-title-purple">
                <span>📊</span> Stats
                <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 'normal', color: '#666' }}>
                    Creation: {trainer.statPoints} | Level: {trainer.levelStatPoints || 0}
                </span>
            </h3>

            <div className="grid-responsive-3 trainer-stats-grid">
                {STAT_CONFIG.map(stat => {
                    const mod = calculateModifier(stat.key);
                    return (
                        <div
                            key={stat.key}
                            style={{
                                background: '#fff',
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
            <div className="grid-responsive-3" style={{ marginTop: '15px' }}>
                <div style={{ textAlign: 'center', padding: '8px', background: '#e3f2fd', borderRadius: '6px' }}>
                    <div style={{ fontSize: '10px', color: '#1565c0' }}>Phys Eva</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1565c0' }}>+{Math.floor(trainer.stats.def / 5)}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', background: '#fff3e0', borderRadius: '6px' }}>
                    <div style={{ fontSize: '10px', color: '#e65100' }}>Spec Eva</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#e65100' }}>+{Math.floor(trainer.stats.sdef / 5)}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', background: '#e0f7fa', borderRadius: '6px' }}>
                    <div style={{ fontSize: '10px', color: '#00838f' }}>Spd Eva</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#00838f' }}>+{Math.min(6, Math.max(0, calculateModifier(trainer.stats.spd)))}</div>
                </div>
            </div>
        </div>
    );
};

export default TrainerStats;
