// ============================================================
// Capture Rate Calculator (GMG rules)
// ============================================================
// Players roll d100; success if roll < target number.
// Base rates by rarity × evolution stage, then modifiers.
// ============================================================

import React, { useState, useMemo } from 'react';
import toast from '../../utils/toast.js';

// Base capture rates: rarity → [stage1, stage2, stage3]
const BASE_RATES = {
    common:   [50, 35, 20],
    uncommon: [40, 25, 10],
    rare:     [30, 15, 0],
};

const RARITY_LABELS = { common: '⭘ Common', uncommon: '♦ Uncommon', rare: '⭐ Rare' };

// Pokéball modifiers (common balls; GM can adjust)
const POKEBALL_MODS = {
    'Poké Ball':    0,
    'Great Ball':  +10,
    'Ultra Ball':  +20,
    'Master Ball': +999,  // auto-capture
    'Quick Ball':  +15,
    'Dusk Ball':   +15,
    'Nest Ball':   +5,
    'Net Ball':    +5,
    'Repeat Ball': +10,
    'Timer Ball':  +10,
    'Luxury Ball':  0,
    'Premier Ball': 0,
    'Heal Ball':    0,
};

// GMG p.22 — HP modifiers (pick most applicable tier; only one applies)
const HP_MODS = [
    { label: 'At Max HP',             mod: -25 },
    { label: 'Damaged (above half)',   mod: -10 },
    { label: 'Below half Max HP',      mod:   0 },
    { label: 'Below 10 HP',           mod: +20 },
    { label: 'At 0 HP or lower',      mod: +75 },
];

const STATUS_MODS = [
    { label: 'None',                              mod: 0  },
    { label: 'Burn / Confusion / Infatuation / Poison', mod: +10 },
    { label: 'Freeze / Paralysis / Sleep',        mod: +15 },
];

const INITIATIVE_MODS = [
    { label: 'Wild ambushed trainer',     mod: -25 },
    { label: 'Wild initiated combat',     mod:   0 },
    { label: 'Trainer initiated combat',  mod: +10 },
    { label: 'Wild knew about trainers',  mod: -10 },
];

const CaptureCalculator = () => {
    const [rarity, setRarity]       = useState('common');
    const [stage, setStage]         = useState(0);   // 0=first, 1=second, 2=third
    const [hpMod, setHpMod]         = useState(1);   // index into HP_MODS (damaged above half = common default)
    const [statusMod, setStatusMod] = useState(0);   // index
    const [initMod, setInitMod]     = useState(1);   // index (wild initiated = default)
    const [ball, setBall]           = useState('Poké Ball');
    const [roll, setRoll]           = useState(null);
    const [lastTarget, setLastTarget] = useState(null);

    const target = useMemo(() => {
        const base = BASE_RATES[rarity][stage];
        return base
            + HP_MODS[hpMod].mod
            + STATUS_MODS[statusMod].mod
            + INITIATIVE_MODS[initMod].mod
            + (POKEBALL_MODS[ball] ?? 0);
    }, [rarity, stage, hpMod, statusMod, initMod, ball]);

    const handleRoll = () => {
        if (ball === 'Master Ball') {
            setRoll(null);
            setLastTarget(null);
            toast.success('Master Ball — automatic capture!');
            return;
        }
        const r = Math.floor(Math.random() * 100) + 1;
        setRoll(r);
        setLastTarget(target);
        if (r < target) {
            toast.success(`Rolled ${r} — captured! (needed < ${target})`);
        } else {
            toast.warning(`Rolled ${r} — escaped! (needed < ${target})`);
        }
    };

    const isMaster = ball === 'Master Ball';
    const succeeded = roll !== null && lastTarget !== null && roll < lastTarget;
    const clampedTarget = Math.max(0, Math.min(100, target));

    return (
        <div className="section-card-purple">
            <h3 className="section-title-purple">🎯 Capture Rate Calculator</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Roll d100 — capture succeeds if the roll is strictly <strong>less than</strong> the target number. Ties are failures.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                {/* Rarity */}
                <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Species Rarity</label>
                    <select value={rarity} onChange={e => setRarity(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}>
                        {Object.entries(RARITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                        Base: {BASE_RATES[rarity].map((r, i) => `Stage ${i+1}: ${r}`).join(' | ')}
                    </div>
                </div>

                {/* Evolution Stage */}
                <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Evolution Stage</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {['1st Stage', '2nd Stage', '3rd Stage'].map((lbl, i) => (
                            <button key={i} onClick={() => setStage(i)}
                                style={{ flex: 1, padding: '8px 4px', borderRadius: '6px', border: '1px solid var(--border-medium)', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
                                    background: stage === i ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'var(--input-bg)',
                                    color: stage === i ? 'white' : 'var(--text-muted)' }}>
                                {lbl}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Pokéball */}
                <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Pokéball</label>
                    <select value={ball} onChange={e => setBall(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}>
                        {Object.entries(POKEBALL_MODS).map(([k, v]) => (
                            <option key={k} value={k}>{k} ({v >= 999 ? 'auto' : v >= 0 ? `+${v}` : v})</option>
                        ))}
                    </select>
                </div>

                {/* HP% */}
                <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Current HP</label>
                    <select value={hpMod} onChange={e => setHpMod(Number(e.target.value))}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}>
                        {HP_MODS.map((m, i) => <option key={i} value={i}>{m.label} ({m.mod >= 0 ? '+' : ''}{m.mod})</option>)}
                    </select>
                </div>

                {/* Status */}
                <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Status Condition</label>
                    <select value={statusMod} onChange={e => setStatusMod(Number(e.target.value))}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}>
                        {STATUS_MODS.map((m, i) => <option key={i} value={i}>{m.label} ({m.mod >= 0 ? '+' : ''}{m.mod})</option>)}
                    </select>
                </div>

                {/* Initiative */}
                <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Who Initiated?</label>
                    <select value={initMod} onChange={e => setInitMod(Number(e.target.value))}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}>
                        {INITIATIVE_MODS.map((m, i) => <option key={i} value={i}>{m.label} ({m.mod >= 0 ? '+' : ''}{m.mod})</option>)}
                    </select>
                </div>
            </div>

            {/* Result Display */}
            <div style={{ padding: '16px', borderRadius: '10px', background: isMaster ? '#1b5e2022' : 'var(--input-bg)', border: `2px solid ${isMaster ? '#4caf50' : '#667eea'}`, marginBottom: '14px', textAlign: 'center' }}>
                {isMaster ? (
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#4caf50' }}>Master Ball — Guaranteed Capture!</div>
                ) : (
                    <>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            Target Number (roll strictly under this)
                        </div>
                        <div style={{ fontSize: '42px', fontWeight: 'bold', color: clampedTarget <= 0 ? '#f44336' : clampedTarget >= 80 ? '#4caf50' : '#667eea', lineHeight: 1 }}>
                            {clampedTarget <= 0 ? 'Impossible' : clampedTarget}
                        </div>
                        {target !== clampedTarget && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(raw {target}, clamped to 0–100)</div>}
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {clampedTarget <= 0 ? 'Cannot be captured this way.' : `${clampedTarget}% chance of capture`}
                        </div>

                        {/* HP progress bar */}
                        <div style={{ marginTop: '10px', height: '8px', background: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.max(0, Math.min(100, clampedTarget))}%`, height: '100%', background: clampedTarget <= 20 ? '#f44336' : clampedTarget <= 50 ? '#ff9800' : '#4caf50', borderRadius: '4px', transition: 'width 0.3s' }} />
                        </div>

                        {roll !== null && (
                            <div style={{ marginTop: '10px', padding: '8px', borderRadius: '8px', background: succeeded ? '#e8f5e9' : '#fbe9e7', border: `1px solid ${succeeded ? '#4caf50' : '#f44336'}` }}>
                                <span style={{ fontSize: '20px', fontWeight: 'bold', color: succeeded ? '#4caf50' : '#f44336' }}>
                                    {succeeded ? '✓ Captured!' : '✗ Escaped!'}
                                </span>
                                <span style={{ fontSize: '14px', color: 'var(--text-muted)', marginLeft: '10px' }}>
                                    Rolled {roll} (needed &lt; {lastTarget})
                                </span>
                            </div>
                        )}
                    </>
                )}
            </div>

            <button
                onClick={handleRoll}
                style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
            >
                🎲 Roll d100
            </button>

            {/* Modifier breakdown */}
            <details style={{ marginTop: '12px' }}>
                <summary style={{ cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Show modifier breakdown</summary>
                <div style={{ marginTop: '8px', fontSize: '12px', padding: '10px', background: 'var(--input-bg)', borderRadius: '6px' }}>
                    <div>Base ({RARITY_LABELS[rarity]}, Stage {stage + 1}): <strong>{BASE_RATES[rarity][stage]}</strong></div>
                    <div>HP: <strong>{HP_MODS[hpMod].mod >= 0 ? '+' : ''}{HP_MODS[hpMod].mod}</strong></div>
                    <div>Status: <strong>{STATUS_MODS[statusMod].mod >= 0 ? '+' : ''}{STATUS_MODS[statusMod].mod}</strong></div>
                    <div>Initiative: <strong>{INITIATIVE_MODS[initMod].mod >= 0 ? '+' : ''}{INITIATIVE_MODS[initMod].mod}</strong></div>
                    <div>Ball: <strong>{POKEBALL_MODS[ball] >= 999 ? 'auto' : POKEBALL_MODS[ball] >= 0 ? `+${POKEBALL_MODS[ball]}` : POKEBALL_MODS[ball]}</strong></div>
                    <div style={{ marginTop: '6px', fontWeight: 'bold', borderTop: '1px solid var(--border-light)', paddingTop: '6px' }}>Total: {target} → clamped to {clampedTarget}</div>
                </div>
            </details>
        </div>
    );
};

export default CaptureCalculator;
