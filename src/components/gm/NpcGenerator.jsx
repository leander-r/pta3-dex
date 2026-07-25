// ============================================================
// NPC Trainer Stat Block Generator
// ============================================================

import React, { useState } from 'react';
import { useGameData, useUI, useData } from '../../contexts/index.js';
import { HELP_BTN_STYLE } from '../common/helpBtnStyle.js';
import { HP_MILESTONE_LEVELS } from '../../data/constants.js';
import toast from '../../utils/toast.js';

const NPC_STATS = {
    junior: {
        'Ace Trainer':    { atk: 4, def: 3, satk: 4, sdef: 3, spd: 4 },
        'Breeder':        { atk: 3, def: 4, satk: 3, sdef: 4, spd: 4 },
        'Coordinator':    { atk: 4, def: 3, satk: 3, sdef: 4, spd: 4 },
        'Ranger':         { atk: 4, def: 4, satk: 3, sdef: 3, spd: 4 },
        'Researcher':     { atk: 3, def: 4, satk: 4, sdef: 4, spd: 3 },
        'Martial Artist': { atk: 4, def: 4, satk: 3, sdef: 3, spd: 4 },
        'Psychic':        { atk: 3, def: 3, satk: 4, sdef: 4, spd: 4 },
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
    { id: 'junior',     label: 'Junior',     color: '#4caf50', desc: 'New trainer, 7 classes' },
    { id: 'experienced', label: 'Experienced', color: '#2196f3', desc: 'Seasoned trainer, 7 classes' },
    { id: 'veteran',    label: 'Veteran',    color: '#9c27b0', desc: 'Expert trainer, 7 classes' },
];

// GMG (p.20): "NPC Trainers can be level 1... give them access to what all
// level 1s of their class have access to." The book doesn't tie a specific
// level to each tier, so these are just reasonable starting suggestions —
// freely editable below, independent of tier.
const TIER_DEFAULT_LEVEL = { junior: 1, experienced: 6, veteran: 11 };

const STAT_KEYS = ['atk', 'def', 'satk', 'sdef', 'spd'];
const STAT_LABELS = { atk: 'ATK', def: 'DEF', satk: 'SATK', sdef: 'SDEF', spd: 'SPD' };

const NpcGenerator = () => {
    const [tier, setTier] = useState('junior');
    const [trainerClass, setTrainerClass] = useState('Ace Trainer');
    const [level, setLevel] = useState(TIER_DEFAULT_LEVEL.junior);
    const { GAME_DATA } = useGameData();
    const { showHelp } = useUI();
    const { setNpcs } = useData();

    const classes = Object.keys(NPC_STATS[tier]);
    const selectedClass = classes.includes(trainerClass) ? trainerClass : classes[0];
    const stats = NPC_STATS[tier][selectedClass];

    // Only features this NPC would actually have at its level (GMG: NPCs
    // default to level 1 and get level-1 class features, not the full catalog).
    const classFeatures = Object.entries(GAME_DATA.features || {})
        .filter(([, f]) => f.category === selectedClass)
        .map(([name, f]) => [name, f, parseInt((f.prerequisites || '').match(/Level\s+(\d+)/i)?.[1] || 99)])
        .filter(([, , lv]) => lv <= level)
        .sort((a, b) => a[2] - b[2])
        .map(([name, f]) => [name, f]);

    const milestonesAtLevel = HP_MILESTONE_LEVELS.filter(l => l <= level).length;

    const copyToClipboard = () => {
        const lines = [
            `NPC Trainer — ${selectedClass} (${tier.charAt(0).toUpperCase() + tier.slice(1)})`,
            milestonesAtLevel > 0 ? `HP: 20 + ${milestonesAtLevel}d4 (roll in NPC Roster)` : `HP: 20`,
            ...STAT_KEYS.map(k => `${STAT_LABELS[k]}: ${stats[k]} (+${Math.floor(stats[k] / 2)})`),
        ];
        navigator.clipboard?.writeText(lines.join('\n')).then(() => {
            toast.success('Stat block copied to clipboard');
        }).catch(() => {
            toast.error('Could not copy to clipboard');
        });
    };

    const saveAsNpc = () => {
        const tierLabel = TIER_LABELS.find(t => t.id === tier)?.label || tier;
        setNpcs(prev => [...prev, {
            id: Date.now(),
            // Level is not baked into the name — it's a live field (editable in
            // NPC Roster), shown separately everywhere so it can't go stale.
            name: `${selectedClass} (${tierLabel})`,
            tier,
            trainerClass: selectedClass,
            level,
            stats: { ...stats },
            hpRolls: [],
            currentDamage: 0,
            notes: '',
            team: []
        }]);
        toast.success(milestonesAtLevel > 0
            ? `Saved to NPC Roster — it has ${milestonesAtLevel} pending HP milestone roll${milestonesAtLevel > 1 ? 's' : ''} (Lv ${level}), roll it there.`
            : 'Saved to NPC Roster — rename it and add a team there.');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="section-card-purple">
                <h3 className="section-title-purple" aria-label="NPC Trainer Stat Blocks">
                    🧑 NPC Trainer Stat Blocks
                    <button
                        onClick={(e) => { e.stopPropagation(); showHelp('gm-npc'); }}
                        style={HELP_BTN_STYLE}
                        aria-label="Help: NPC Stats"
                        title="About NPC stats"
                    >?</button>
                </h3>
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
                                onClick={() => { setTier(t.id); setLevel(TIER_DEFAULT_LEVEL[t.id]); }}
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

                {/* Level */}
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                        Level
                        <span style={{ marginLeft: '6px', fontSize: '10px', fontWeight: 'normal', textTransform: 'none', letterSpacing: 0 }}>
                            (controls which class features this NPC has — not tied to tier by the book)
                        </span>
                    </div>
                    <input
                        type="number" min={0} max={15}
                        aria-label="NPC Level"
                        value={level}
                        onChange={(e) => setLevel(Math.max(0, Math.min(15, parseInt(e.target.value) || 0)))}
                        style={{ width: '70px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 'bold' }}
                    />
                </div>

                {/* Stat block */}
                <div style={{ background: 'var(--input-bg)', borderRadius: '10px', padding: '16px', border: '1px solid var(--border-medium)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{selectedClass}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                {TIER_LABELS.find(t => t.id === tier)?.label} NPC Trainer · Level {level}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={saveAsNpc}
                                style={{ padding: '6px 14px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                            >
                                💾 Save as NPC
                            </button>
                            <button
                                onClick={copyToClipboard}
                                style={{ padding: '6px 14px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                            >
                                📋 Copy
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '6px', background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.3)', marginBottom: '10px' }}>
                        <span style={{ fontWeight: 'bold', color: '#4caf50', fontSize: '14px' }}>HP</span>
                        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                            20{milestonesAtLevel > 0 && (
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}>
                                    + {milestonesAtLevel}d4 (roll after saving)
                                </span>
                            )}
                        </span>
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

                {classFeatures.length > 0 ? (
                    <details style={{ marginTop: '14px' }} open>
                        <summary style={{ cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', padding: '4px 0' }}>
                            ▸ {selectedClass} Features up to Level {level} ({classFeatures.length})
                        </summary>
                        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {classFeatures.map(([name, f]) => (
                                <div key={name} style={{ padding: '8px 10px', background: 'var(--bg-section)', borderRadius: '6px', fontSize: '12px' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                                        {name}
                                        <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                                            {f.prerequisites}
                                            {f.frequency && ` · ${f.frequency}`}
                                        </span>
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{f.effect}</div>
                                </div>
                            ))}
                        </div>
                    </details>
                ) : (
                    <p style={{ marginTop: '14px', fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No {selectedClass} features at level {level} — per the GMG, most NPCs are level 0 with no mechanically unique traits unless you give them one.
                    </p>
                )}
            </div>
        </div>
    );
};

export default NpcGenerator;
