// ============================================================
// Initiative Tracker — turn order for NPCs, players, and wild Pokémon
// ============================================================
// Session scratchpad: combatants are snapshots taken at add-time (not
// live references), persisted to localStorage so a page refresh doesn't
// lose an in-progress encounter. Not part of export/import/save slots —
// permanent HP changes are still applied back in the Trainer/Pokémon tab.

import React, { useState, useEffect, useMemo } from 'react';
import { useUI, useModal, useData, useTrainerContext } from '../../contexts/index.js';
import { HELP_BTN_STYLE } from '../common/helpBtnStyle.js';
import { getPokemonDisplayImage } from '../../utils/pokemonSprite.js';
import { getTypeColor, getContrastTextColor } from '../../utils/typeUtils.js';
import { getActualStats, calculatePokemonHP } from '../../utils/dataUtils.js';
import toast from '../../utils/toast.js';

const STORAGE_KEY = 'pta3-initiative-tracker';
const STAT_KEYS = ['atk', 'def', 'satk', 'sdef', 'spd'];
const STAT_LABELS = { atk: 'ATK', def: 'DEF', satk: 'SATK', sdef: 'SDEF', spd: 'SPD' };

const loadTracker = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch {}
    return { combatants: [], round: 1, currentTurn: 0 };
};

const newId = () => Date.now() * 1000 + Math.floor(Math.random() * 999);

const hpColor = (current, max) => {
    if (max <= 0) return '#4caf50';
    const percent = (current / max) * 100;
    return percent > 50 ? '#4caf50' : percent > 25 ? '#ff9800' : '#f44336';
};

const KIND_LABELS = { trainer: 'Player', pokemon: "Player's Pokémon", npc: 'NPC', 'npc-pokemon': "NPC's Pokémon", custom: 'Custom' };
const KIND_COLORS = { trainer: '#2196f3', pokemon: '#4caf50', npc: '#e65100', 'npc-pokemon': '#ff9800', custom: '#9c27b0' };

const trainerToCombatant = (t) => ({
    id: newId(), name: t.name || 'Unnamed Trainer', kind: 'trainer',
    initiative: null, spd: t.stats?.spd ?? 3,
    hp: { current: Math.max(0, (20 + (t.hpRolls || []).reduce((s, v) => s + v, 0)) - (t.currentDamage || 0)), max: 20 + (t.hpRolls || []).reduce((s, v) => s + v, 0) },
    stats: { ...t.stats }, types: [], moves: [], features: (t.features || []).map(f => typeof f === 'object' ? f.name : f),
    avatar: t.avatar || ''
});

const pokemonToCombatant = (p, kind = 'pokemon') => {
    const actualStats = getActualStats(p);
    const maxHP = calculatePokemonHP(p);
    return {
        id: newId(), name: p.name || p.species || 'Pokémon', kind,
        initiative: null, spd: actualStats.spd,
        hp: { current: Math.max(0, maxHP - (p.currentDamage || 0)), max: maxHP },
        stats: actualStats, types: p.types || [], moves: (p.moves || []).map(m => m.name), features: [],
        avatar: getPokemonDisplayImage(p) || ''
    };
};

const npcToCombatant = (n) => ({
    id: newId(), name: n.name, kind: 'npc',
    initiative: null, spd: n.stats?.spd ?? 3,
    hp: { current: Math.max(0, (n.maxHp ?? 20) - (n.currentDamage || 0)), max: n.maxHp ?? 20 },
    stats: { ...n.stats }, types: [], moves: [], features: [],
    avatar: ''
});

const HPStepper = ({ current, max, onChange }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button onClick={() => onChange(Math.max(0, current - 1))} title="Damage 1"
            style={{ width: '22px', height: '22px', borderRadius: '4px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: '#f44336', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>−</button>
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: hpColor(current, max), minWidth: '52px', textAlign: 'center' }}>{current}/{max}</span>
        <button onClick={() => onChange(Math.min(max, current + 1))} title="Heal 1"
            style={{ width: '22px', height: '22px', borderRadius: '4px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: '#4caf50', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>+</button>
    </div>
);

const AddFromNpcRoster = ({ npcs, onAdd }) => (
    <div style={{ padding: '10px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-medium)', maxHeight: '260px', overflowY: 'auto' }}>
        {npcs.length === 0 && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No saved NPCs — build one in NPC Roster first.</div>}
        {npcs.map(n => (
            <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ flex: 1, fontSize: '13px', fontWeight: 'bold' }}>{n.name}</span>
                <button onClick={() => onAdd(npcToCombatant(n))}
                    style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', cursor: 'pointer', fontSize: '11px' }}>
                    ＋ NPC
                </button>
                <button onClick={() => { onAdd(npcToCombatant(n)); (n.team || []).forEach(p => onAdd(pokemonToCombatant(p, 'npc-pokemon'))); }}
                    disabled={!n.team || n.team.length === 0}
                    style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', cursor: (!n.team || n.team.length === 0) ? 'not-allowed' : 'pointer', fontSize: '11px', opacity: (!n.team || n.team.length === 0) ? 0.5 : 1 }}>
                    ＋ NPC + Team
                </button>
            </div>
        ))}
    </div>
);

const AddFromPlayers = ({ trainers, onAdd }) => (
    <div style={{ padding: '10px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-medium)', maxHeight: '260px', overflowY: 'auto' }}>
        {trainers.length === 0 && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No trainers found.</div>}
        {trainers.map(t => (
            <div key={t.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ flex: 1, fontSize: '13px', fontWeight: 'bold' }}>{t.name || 'Unnamed'}</span>
                    <button onClick={() => onAdd(trainerToCombatant(t))}
                        style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', cursor: 'pointer', fontSize: '11px' }}>
                        ＋ Trainer
                    </button>
                </div>
                {(t.party || []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', paddingLeft: '4px' }}>
                        {t.party.map(p => (
                            <button key={p.id} onClick={() => onAdd(pokemonToCombatant(p, 'pokemon'))}
                                style={{ padding: '3px 8px', borderRadius: '10px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', cursor: 'pointer', fontSize: '10px' }}>
                                ＋ {p.name || p.species}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        ))}
    </div>
);

const AddCustom = ({ onAdd }) => {
    const [name, setName] = useState('');
    const [hpMax, setHpMax] = useState(20);
    const [spd, setSpd] = useState(3);

    const submit = () => {
        if (!name.trim()) { toast.warning('Enter a name first.'); return; }
        onAdd({
            id: newId(), name: name.trim(), kind: 'custom',
            initiative: null, spd: parseInt(spd) || 0,
            hp: { current: hpMax, max: hpMax },
            stats: null, types: [], moves: [], features: [], avatar: ''
        });
        setName(''); setHpMax(20); setSpd(3);
    };

    return (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
            <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)}
                style={{ flex: '1 1 140px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '13px' }} />
            <input type="number" placeholder="Max HP" value={hpMax} onChange={(e) => setHpMax(parseInt(e.target.value) || 0)}
                style={{ width: '80px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '13px' }} />
            <input type="number" placeholder="Speed" title="Speed stat — determines default turn order and the optional d20 + Speed roll" value={spd} onChange={(e) => setSpd(e.target.value)}
                style={{ width: '80px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '13px' }} />
            <button onClick={submit} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Add</button>
        </div>
    );
};

const CombatantRow = ({ c, isActive, onRoll, onHpChange, onRemove }) => (
    <div style={{
        display: 'flex', flexDirection: 'column', gap: '4px', padding: '10px 12px', borderRadius: '8px',
        background: isActive ? 'rgba(102,126,234,0.12)' : 'var(--input-bg)',
        border: isActive ? '2px solid #667eea' : '1px solid var(--border-medium)'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span
                title={c.initiative != null ? `Rolled: 1d20 + ${c.spd} Speed` : `Sorted by raw Speed (${c.spd}) — click 🎲 to roll instead`}
                style={{
                    minWidth: '30px', textAlign: 'center', padding: '3px 6px', borderRadius: '6px',
                    background: c.initiative != null ? '#667eea' : 'var(--bg-section)',
                    border: c.initiative != null ? 'none' : '1px dashed var(--border-medium)',
                    color: c.initiative != null ? 'white' : 'var(--text-muted)', fontWeight: 'bold', fontSize: '13px'
                }}>
                {c.initiative ?? c.spd}
            </span>
            {c.avatar ? <img src={c.avatar} alt="" style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }} /> : null}
            <span style={{ fontWeight: 'bold', fontSize: '13px', flex: '1 1 auto' }}>{c.name}</span>
            <span style={{ padding: '2px 8px', borderRadius: '8px', background: `${KIND_COLORS[c.kind]}22`, color: KIND_COLORS[c.kind], fontSize: '10px', fontWeight: 'bold' }}>
                {KIND_LABELS[c.kind]}
            </span>
            {(c.types || []).map(t => (
                <span key={t} style={{ padding: '1px 6px', borderRadius: '8px', background: getTypeColor(t), color: getContrastTextColor(getTypeColor(t)), fontSize: '9px', fontWeight: 'bold' }}>{t}</span>
            ))}
            <button onClick={onRoll} title="Optional variant rule: roll 1d20 + Speed instead of sorting by raw Speed"
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--bg-section)', cursor: 'pointer', fontSize: '12px' }}>🎲</button>
            <HPStepper current={c.hp.current} max={c.hp.max} onChange={onHpChange} />
            <button onClick={onRemove} title="Remove" style={{ background: 'none', border: 'none', color: '#f44336', cursor: 'pointer', fontSize: '14px' }}>✕</button>
        </div>
        {(c.stats || c.moves?.length > 0 || c.features?.length > 0) && (
            <details>
                <summary style={{ cursor: 'pointer', fontSize: '11px', color: 'var(--text-muted)' }}>▸ Details</summary>
                <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {c.stats && <div>{STAT_KEYS.map(k => `${STAT_LABELS[k]} ${c.stats[k]}`).join('  ·  ')}</div>}
                    {c.moves?.length > 0 && <div><strong>Moves:</strong> {c.moves.join(', ')}</div>}
                    {c.features?.length > 0 && <div><strong>Features:</strong> {c.features.join(', ')}</div>}
                </div>
            </details>
        )}
    </div>
);

const InitiativeTracker = () => {
    const initial = useMemo(loadTracker, []);
    const [combatants, setCombatants] = useState(initial.combatants || []);
    const [round, setRound] = useState(initial.round || 1);
    const [currentTurn, setCurrentTurn] = useState(initial.currentTurn || 0);
    const [addPanel, setAddPanel] = useState('none'); // 'none' | 'npc' | 'player' | 'custom'

    const { npcs } = useData();
    const { trainers } = useTrainerContext();
    const { showHelp } = useUI();
    const { showConfirm } = useModal();

    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ combatants, round, currentTurn })); } catch {}
    }, [combatants, round, currentTurn]);

    // PTA3 default rule (PHB1 "Rules of Engagement"): turn order is raw Speed,
    // highest first — no roll required. "Roll For Initiative" (d20 + Speed) is
    // an explicitly optional variant rule, offered here per-combatant via 🎲.
    // Ties under the default rule are broken by an opposed Speed check — GMs
    // can roll just the tied combatants with 🎲 to break them.
    const sorted = useMemo(() => {
        return [...combatants].sort((a, b) => {
            const av = a.initiative ?? a.spd;
            const bv = b.initiative ?? b.spd;
            return bv - av;
        });
    }, [combatants]);

    const activeIndex = combatants.length > 0 ? Math.min(currentTurn, sorted.length - 1) : 0;

    const addCombatant = (c) => setCombatants(prev => [...prev, c]);

    const rollOne = (id) => {
        setCombatants(prev => prev.map(c => {
            if (c.id !== id) return c;
            const roll = 1 + Math.floor(Math.random() * 20);
            return { ...c, initiative: roll + c.spd };
        }));
    };

    const rollAll = () => {
        setCombatants(prev => prev.map(c => {
            if (c.initiative != null) return c;
            const roll = 1 + Math.floor(Math.random() * 20);
            return { ...c, initiative: roll + c.spd };
        }));
    };

    const clearRolls = () => setCombatants(prev => prev.map(c => ({ ...c, initiative: null })));

    const nextTurn = () => {
        if (sorted.length === 0) return;
        const next = activeIndex + 1;
        if (next >= sorted.length) {
            setCurrentTurn(0);
            setRound(r => r + 1);
        } else {
            setCurrentTurn(next);
        }
    };

    const clearAll = () => {
        showConfirm({
            title: 'Clear Initiative Tracker?',
            message: 'This removes every combatant and resets the round counter.',
            danger: true,
            confirmLabel: 'Clear',
            onConfirm: () => { setCombatants([]); setRound(1); setCurrentTurn(0); }
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="section-card-purple">
                <h3 className="section-title-purple" aria-label="Initiative Tracker">
                    🎯 Initiative Tracker
                    <button
                        onClick={(e) => { e.stopPropagation(); showHelp('gm-initiative'); }}
                        style={HELP_BTN_STYLE}
                        aria-label="Help: Initiative Tracker"
                        title="About the initiative tracker"
                    >?</button>
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    Session scratchpad for turn order. Add combatants from your NPC Roster, player trainers, or a one-off custom entry. Turn order defaults to raw Speed, highest first (PTA3 default rule) — use 🎲 per combatant only if your table prefers the optional "Roll For Initiative" variant (1d20 + Speed).
                </p>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    <button onClick={() => setAddPanel(p => p === 'npc' ? 'none' : 'npc')}
                        style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: addPanel === 'npc' ? '#667eea' : 'var(--input-bg)', color: addPanel === 'npc' ? 'white' : 'var(--text-primary)', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                        ＋ From NPC Roster
                    </button>
                    <button onClick={() => setAddPanel(p => p === 'player' ? 'none' : 'player')}
                        style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: addPanel === 'player' ? '#667eea' : 'var(--input-bg)', color: addPanel === 'player' ? 'white' : 'var(--text-primary)', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                        ＋ From Players
                    </button>
                    <button onClick={() => setAddPanel(p => p === 'custom' ? 'none' : 'custom')}
                        style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: addPanel === 'custom' ? '#667eea' : 'var(--input-bg)', color: addPanel === 'custom' ? 'white' : 'var(--text-primary)', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                        ＋ Custom
                    </button>
                </div>

                {addPanel === 'npc' && <div style={{ marginBottom: '14px' }}><AddFromNpcRoster npcs={npcs} onAdd={addCombatant} /></div>}
                {addPanel === 'player' && <div style={{ marginBottom: '14px' }}><AddFromPlayers trainers={trainers} onAdd={addCombatant} /></div>}
                {addPanel === 'custom' && <div style={{ marginBottom: '14px' }}><AddCustom onAdd={addCombatant} /></div>}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '10px', padding: '10px 14px', borderRadius: '8px', background: 'var(--input-bg)' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Round {round}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={rollAll} disabled={combatants.length === 0} title='Optional variant rule: roll 1d20 + Speed for everyone still sorted by raw Speed'
                            style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--bg-section)', cursor: combatants.length === 0 ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 'bold', opacity: combatants.length === 0 ? 0.5 : 1 }}>
                            🎲 Roll All
                        </button>
                        <button onClick={clearRolls} disabled={combatants.length === 0} title="Revert to the default rule: sort by raw Speed only"
                            style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--bg-section)', cursor: combatants.length === 0 ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 'bold', opacity: combatants.length === 0 ? 0.5 : 1 }}>
                            Clear Rolls
                        </button>
                        <button onClick={nextTurn} disabled={combatants.length === 0}
                            style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', cursor: combatants.length === 0 ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 'bold', opacity: combatants.length === 0 ? 0.5 : 1 }}>
                            ⏭ Next Turn
                        </button>
                        <button onClick={clearAll} disabled={combatants.length === 0}
                            style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--bg-section)', color: '#f44336', cursor: combatants.length === 0 ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 'bold', opacity: combatants.length === 0 ? 0.5 : 1 }}>
                            Clear All
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sorted.length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', background: 'var(--input-bg)', borderRadius: '8px' }}>
                            No combatants yet — add some above.
                        </div>
                    )}
                    {sorted.map((c, idx) => (
                        <CombatantRow
                            key={c.id}
                            c={c}
                            isActive={idx === activeIndex}
                            onRoll={() => rollOne(c.id)}
                            onHpChange={(val) => setCombatants(prev => prev.map(x => x.id === c.id ? { ...x, hp: { ...x.hp, current: val } } : x))}
                            onRemove={() => setCombatants(prev => prev.filter(x => x.id !== c.id))}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default InitiativeTracker;
