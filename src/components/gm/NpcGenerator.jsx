// ============================================================
// NPC Trainer Stat Block Generator
// ============================================================

import React, { useState } from 'react';
import toast from '../../utils/toast.js';

const NPC_STATS = {
    junior: {
        'Ace Trainer':    { atk: 4, def: 3, satk: 4, sdef: 3, spd: 4 },
        'Breeder':        { atk: 3, def: 4, satk: 3, sdef: 4, spd: 4 },
        'Coordinator':    { atk: 4, def: 3, satk: 3, sdef: 4, spd: 4 },
        'Ranger':         { atk: 4, def: 4, satk: 3, sdef: 3, spd: 4 },
        'Researcher':     { atk: 3, def: 4, satk: 4, sdef: 4, spd: 3 },
        'Martial Artist': { atk: 4, def: 4, satk: 3, sdef: 3, spd: 4 },
    },
    experienced: {
        'Ace Trainer':    { atk: 6, def: 6, satk: 3, sdef: 6, spd: 4 },
        'Breeder':        { atk: 3, def: 4, satk: 6, sdef: 6, spd: 3 },
        'Coordinator':    { atk: 4, def: 3, satk: 3, sdef: 6, spd: 6 },
        'Ranger':         { atk: 4, def: 6, satk: 3, sdef: 3, spd: 6 },
        'Researcher':     { atk: 3, def: 3, satk: 6, sdef: 6, spd: 6 },
        'Martial Artist': { atk: 6, def: 3, satk: 3, sdef: 6, spd: 3 },
        'Psychic':        { atk: 3, def: 3, satk: 6, sdef: 6, spd: 3 },
    },
    veteran: {
        'Ace Trainer':    { atk: 8, def: 3, satk: 8, sdef: 4, spd: 4 },
        'Breeder':        { atk: 3, def: 8, satk: 4, sdef: 8, spd: 4 },
        'Coordinator':    { atk: 4, def: 4, satk: 3, sdef: 8, spd: 8 },
        'Ranger':         { atk: 4, def: 8, satk: 3, sdef: 4, spd: 8 },
        'Researcher':     { atk: 3, def: 4, satk: 8, sdef: 8, spd: 4 },
        'Martial Artist': { atk: 8, def: 8, satk: 3, sdef: 4, spd: 4 },
        'Psychic':        { atk: 3, def: 4, satk: 8, sdef: 4, spd: 8 },
    },
};

const TIER_LABELS = [
    { id: 'junior',     label: 'Junior',     color: '#4caf50', desc: 'New trainer, 6 classes' },
    { id: 'experienced', label: 'Experienced', color: '#2196f3', desc: 'Seasoned trainer, 7 classes' },
    { id: 'veteran',    label: 'Veteran',    color: '#9c27b0', desc: 'Expert trainer, 7 classes' },
];

const STAT_KEYS = ['atk', 'def', 'satk', 'sdef', 'spd'];
const STAT_LABELS = { atk: 'ATK', def: 'DEF', satk: 'SATK', sdef: 'SDEF', spd: 'SPD' };

const NpcGenerator = () => {
    const [tier, setTier] = useState('junior');
    const [trainerClass, setTrainerClass] = useState('Ace Trainer');

    const classes = Object.keys(NPC_STATS[tier]);
    const selectedClass = classes.includes(trainerClass) ? trainerClass : classes[0];
    const stats = NPC_STATS[tier][selectedClass];

    const copyToClipboard = () => {
        const lines = [
            `NPC Trainer — ${selectedClass} (${tier.charAt(0).toUpperCase() + tier.slice(1)})`,
            `HP: 20`,
            ...STAT_KEYS.map(k => `${STAT_LABELS[k]}: ${stats[k]} (+${Math.floor(stats[k] / 2)})`),
        ];
        navigator.clipboard?.writeText(lines.join('\n')).then(() => {
            toast.success('Stat block copied to clipboard');
        }).catch(() => {
            toast.error('Could not copy to clipboard');
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="section-card-purple">
                <h3 className="section-title-purple">🧑 NPC Trainer Stat Blocks</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    Stat blocks for NPC trainers at each experience tier, drawn from GMG tables.
                </p>

                {/* Tier selector */}
                <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Tier</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {TIER_LABELS.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTier(t.id)}
                                title={t.desc}
                                style={{
                                    padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
                                    background: tier === t.id ? t.color : 'var(--input-bg)',
                                    color: tier === t.id ? 'white' : 'var(--text-muted)',
                                    border: tier === t.id ? `2px solid ${t.color}` : '1px solid var(--border-medium)'
                                }}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Class selector */}
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Class</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {classes.map(cls => (
                            <button
                                key={cls}
                                onClick={() => setTrainerClass(cls)}
                                style={{
                                    padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
                                    background: selectedClass === cls ? '#667eea' : 'var(--input-bg)',
                                    color: selectedClass === cls ? 'white' : 'var(--text-muted)',
                                    border: selectedClass === cls ? '2px solid #667eea' : '1px solid var(--border-medium)'
                                }}
                            >
                                {cls}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stat block */}
                <div style={{ background: 'var(--input-bg)', borderRadius: '10px', padding: '16px', border: '1px solid var(--border-medium)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{selectedClass}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                {TIER_LABELS.find(t => t.id === tier)?.label} NPC Trainer
                            </div>
                        </div>
                        <button
                            onClick={copyToClipboard}
                            style={{ padding: '6px 14px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                        >
                            📋 Copy
                        </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '6px', background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.3)', marginBottom: '10px' }}>
                        <span style={{ fontWeight: 'bold', color: '#4caf50', fontSize: '14px' }}>HP</span>
                        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>20</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {STAT_KEYS.map(k => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: '6px', background: 'var(--bg-section)' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--text-muted)' }}>{STAT_LABELS[k]}</span>
                                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                    {stats[k]}
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}>
                                        (+{Math.floor(stats[k] / 2)})
                                    </span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NpcGenerator;
