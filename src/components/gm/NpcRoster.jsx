// ============================================================
// NPC Roster — saved NPC stat blocks + Pokémon teams
// ============================================================

import React, { useState, useMemo } from 'react';
import { useGameData, useUI, useModal, useData } from '../../contexts/index.js';
import { HELP_BTN_STYLE } from '../common/helpBtnStyle.js';
import { getPokemonDisplayImage } from '../../utils/pokemonSprite.js';
import { getTypeColor, getContrastTextColor } from '../../utils/typeUtils.js';
import { getActualStats, calculatePokemonHP } from '../../utils/dataUtils.js';
import { HP_MILESTONE_LEVELS } from '../../data/constants.js';
import toast from '../../utils/toast.js';

const STAT_KEYS = ['atk', 'def', 'satk', 'sdef', 'spd'];
const STAT_LABELS = { atk: 'ATK', def: 'DEF', satk: 'SATK', sdef: 'SDEF', spd: 'SPD' };

// PTA3: trainers (NPCs included) get a flat 20 HP + 1d4 rolled at levels 3/7/11.
// NPC level is a directly-editable field rather than something leveled up one
// step at a time, so max HP is always derived from hpRolls instead of a stored
// stat — see rollNpcMilestoneHP below for how rolls get added/trimmed.
const npcMaxHp = (npc) => 20 + (npc.hpRolls || []).reduce((s, v) => s + (v || 0), 0);
const npcMilestonesAtLevel = (level) => HP_MILESTONE_LEVELS.filter(l => l <= level).length;

const hpColor = (current, max) => {
    if (max <= 0) return '#4caf50';
    const percent = (current / max) * 100;
    return percent > 50 ? '#4caf50' : percent > 25 ? '#ff9800' : '#f44336';
};

const HPStepper = ({ current, max, onDamage, onHeal }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button onClick={() => onDamage(1)} title="Damage 1"
            style={{ width: '22px', height: '22px', borderRadius: '4px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: '#f44336', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>−</button>
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: hpColor(current, max), minWidth: '52px', textAlign: 'center' }}>
            {current}/{max}
        </span>
        <button onClick={() => onHeal(1)} title="Heal 1"
            style={{ width: '22px', height: '22px', borderRadius: '4px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: '#4caf50', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>+</button>
    </div>
);

// Lightweight species picker: search box + sprite grid. No regional forms / type filter
// (v1 scope — full PokemonCard picker is overkill for a GM quick-add).
const SpeciesPicker = ({ pokedex, customSpecies, onPick, onCancel }) => {
    const [search, setSearch] = useState('');

    const results = useMemo(() => {
        const all = [...(customSpecies || []), ...(pokedex || [])];
        if (!search.trim()) return all.slice(0, 30);
        const term = search.toLowerCase();
        return all.filter(p => p.species?.toLowerCase().includes(term)).slice(0, 30);
    }, [pokedex, customSpecies, search]);

    return (
        <div style={{ padding: '10px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                    autoFocus
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search species..."
                    style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '13px' }}
                />
                <button onClick={onCancel} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
                {results.length === 0 && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px' }}>No species found.</div>
                )}
                {results.map((p, idx) => (
                    <button
                        key={p.id ?? `${p.species}-${idx}`}
                        onClick={() => onPick(p)}
                        title={p.species}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', width: '64px', padding: '6px 4px', borderRadius: '8px', cursor: 'pointer', background: 'var(--input-bg)', border: '1px solid var(--border-medium)' }}
                    >
                        {(() => {
                            const img = getPokemonDisplayImage(p);
                            return img
                                ? <img src={img} alt="" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '50%' }} />
                                : <span style={{ fontSize: '20px' }}>🔴</span>;
                        })()}
                        <span style={{ fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{p.species}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const buildTeamPokemon = (speciesData) => ({
    id: Date.now() * 1000 + Math.floor(Math.random() * 999),
    name: speciesData.species,
    species: speciesData.species,
    types: [...(speciesData.types || [])],
    nature: 'Hardy',
    ability: speciesData.abilities?.basic?.[0] || speciesData.ability || '',
    baseStats: { ...(speciesData.baseStats || { hp: 30, atk: 5, def: 5, satk: 5, sdef: 5, spd: 5 }) },
    moves: (speciesData.levelUpMoves || speciesData.moves || []).slice(0, 6).map(m => ({ ...m })),
    pokemonSkills: Array.isArray(speciesData.skills)
        ? speciesData.skills.filter(Boolean).map(name => ({ name }))
        : [],
    passives: speciesData.passives ? [...speciesData.passives] : [],
    notes: '',
    loyalty: 2,
    currentDamage: 0
});

const TeamPokemonRow = ({ poke, onDamage, onHeal, onRemove }) => {
    const actualStats = getActualStats(poke);
    const maxHP = calculatePokemonHP(poke);
    const currentHP = Math.max(0, maxHP - (poke.currentDamage || 0));
    const img = getPokemonDisplayImage(poke);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', borderRadius: '8px', background: 'var(--bg-section)' }}>
            {img ? <img src={img} alt="" style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} /> : <span style={{ fontSize: '18px' }}>🔴</span>}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{poke.name || poke.species}</div>
                <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                    {(poke.types || []).map(t => (
                        <span key={t} style={{ padding: '1px 6px', borderRadius: '8px', background: getTypeColor(t), color: getContrastTextColor(getTypeColor(t)), fontSize: '9px', fontWeight: 'bold' }}>{t}</span>
                    ))}
                </div>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'none' }}>{STAT_KEYS.map(k => `${STAT_LABELS[k]} ${actualStats[k]}`).join(' ')}</div>
            <HPStepper current={currentHP} max={maxHP} onDamage={onDamage} onHeal={onHeal} />
            <button onClick={onRemove} title="Remove from team" style={{ background: 'none', border: 'none', color: '#f44336', cursor: 'pointer', fontSize: '14px', padding: '2px 4px' }}>✕</button>
        </div>
    );
};

const NpcCard = ({ npc, onUpdate, onDelete, onDuplicate }) => {
    const { GAME_DATA, pokedex, customSpecies } = useGameData();
    const [pickingSpecies, setPickingSpecies] = useState(false);

    const maxHp = npcMaxHp(npc);
    const currentHP = Math.max(0, maxHp - (npc.currentDamage || 0));
    const level = npc.level ?? 1;
    const hpRolls = npc.hpRolls || [];
    const rollsPending = npcMilestonesAtLevel(level) - hpRolls.length;

    const rollMilestoneHP = () => {
        if (rollsPending <= 0) { toast.warning('No HP milestone rolls pending.'); return; }
        const roll = 1 + Math.floor(Math.random() * 4);
        onUpdate({ hpRolls: [...hpRolls, roll] });
        toast.success(`${npc.name}: HP milestone roll +${roll}!`);
    };

    // Only features this NPC would actually have at its level (GMG: NPCs
    // default to level 1 and get level-1 class features, not the full catalog).
    const classFeatures = useMemo(() => Object.entries(GAME_DATA.features || {})
        .filter(([, f]) => f.category === npc.trainerClass)
        .map(([name, f]) => [name, f, parseInt((f.prerequisites || '').match(/Level\s+(\d+)/i)?.[1] || 99)])
        .filter(([, , lv]) => lv <= level)
        .sort((a, b) => a[2] - b[2])
        .map(([name, f]) => [name, f]), [GAME_DATA.features, npc.trainerClass, level]);

    const setStat = (key, val) => onUpdate({ stats: { ...npc.stats, [key]: Math.max(1, Math.min(10, val)) } });

    return (
        <div style={{ background: 'var(--input-bg)', borderRadius: '10px', padding: '14px', border: '1px solid var(--border-medium)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <input
                    aria-label="NPC name"
                    value={npc.name}
                    onChange={(e) => onUpdate({ name: e.target.value })}
                    style={{ flex: '1 1 160px', minWidth: 0, padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--bg-section)', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '14px' }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                    Class
                    <select
                        aria-label="NPC Class"
                        value={npc.trainerClass || ''}
                        onChange={(e) => onUpdate({ trainerClass: e.target.value })}
                        title="Class — controls which class features this NPC has"
                        style={{
                            padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold',
                            background: npc.trainerClass ? '#667eea22' : 'var(--bg-section)',
                            color: npc.trainerClass ? '#667eea' : 'var(--text-primary)',
                            border: npc.trainerClass ? '1px solid #667eea55' : '1px solid var(--border-medium)'
                        }}
                    >
                        <option value="">No class</option>
                        <optgroup label="Base Classes">
                            {Object.entries(GAME_DATA.trainerClasses || {}).filter(([, d]) => d.type === 'base').map(([cls]) => (
                                <option key={cls} value={cls}>{cls}</option>
                            ))}
                        </optgroup>
                        <optgroup label="Advanced Classes">
                            {Object.entries(GAME_DATA.trainerClasses || {}).filter(([, d]) => d.type === 'advanced').map(([cls]) => (
                                <option key={cls} value={cls}>{cls}</option>
                            ))}
                        </optgroup>
                    </select>
                </label>
                {npc.tier && npc.tier !== 'custom' && (
                    <span style={{ padding: '3px 10px', borderRadius: '10px', background: 'var(--bg-section)', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 'bold' }}>
                        {npc.tier}
                    </span>
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                    Lv
                    <input
                        type="number" min={0} max={15}
                        aria-label="NPC Level"
                        value={level}
                        onChange={(e) => {
                            const newLevel = Math.max(0, Math.min(15, parseInt(e.target.value) || 0));
                            // Trim any HP rolls that no longer correspond to a milestone at the new level.
                            const trimmedRolls = hpRolls.slice(0, npcMilestonesAtLevel(newLevel));
                            onUpdate({ level: newLevel, hpRolls: trimmedRolls });
                        }}
                        title="Level — controls which class features this NPC has and how many HP milestone rolls it's owed"
                        style={{ width: '44px', padding: '4px 6px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--bg-section)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 'bold' }}
                    />
                </label>
                <HPStepper
                    current={currentHP}
                    max={maxHp}
                    onDamage={(v) => onUpdate({ currentDamage: Math.min(maxHp, (npc.currentDamage || 0) + v) })}
                    onHeal={(v) => onUpdate({ currentDamage: Math.max(0, (npc.currentDamage || 0) - v) })}
                />
                {rollsPending > 0 && (
                    <button
                        onClick={rollMilestoneHP}
                        title={`Roll 1d4 HP — ${rollsPending} milestone roll${rollsPending > 1 ? 's' : ''} pending (Lv 3/7/11)`}
                        style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #4caf50, #2e7d32)', color: 'white', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                    >
                        🎲 Roll HP (+{rollsPending})
                    </button>
                )}
                <button onClick={onDuplicate} title="Duplicate NPC" style={{ background: 'none', border: '1px solid var(--border-medium)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', padding: '4px 8px' }}>⧉</button>
                <button onClick={onDelete} title="Delete NPC" style={{ background: 'none', border: '1px solid var(--border-medium)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', padding: '4px 8px', color: '#f44336' }}>🗑</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: '6px', marginBottom: '10px' }}>
                {STAT_KEYS.map(k => (
                    <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '6px', borderRadius: '6px', background: 'var(--bg-section)' }}>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)' }}>{STAT_LABELS[k]}</span>
                        <input
                            type="number" min={1} max={10}
                            value={npc.stats?.[k] ?? 1}
                            onChange={(e) => setStat(k, parseInt(e.target.value) || 1)}
                            style={{ width: '38px', textAlign: 'center', padding: '2px', borderRadius: '4px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 'bold' }}
                        />
                    </div>
                ))}
            </div>

            {npc.trainerClass && (
                classFeatures.length > 0 ? (
                    <details style={{ marginBottom: '10px' }}>
                        <summary style={{ cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>▸ Features up to Level {level} ({classFeatures.length})</summary>
                        <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {classFeatures.map(([name, f]) => (
                                <div key={name} style={{ padding: '8px 10px', background: 'var(--bg-section)', borderRadius: '6px', fontSize: '12px' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                                        {name}
                                        <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal' }}>{f.prerequisites}{f.frequency && ` · ${f.frequency}`}</span>
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{f.effect}</div>
                                </div>
                            ))}
                        </div>
                    </details>
                ) : (
                    <p style={{ marginBottom: '10px', fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No {npc.trainerClass} features at level {level}.
                    </p>
                )
            )}

            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Team ({npc.team?.length || 0})</span>
                    <button
                        onClick={() => setPickingSpecies(v => !v)}
                        style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                    >
                        ＋ Add Pokémon
                    </button>
                </div>
                {pickingSpecies && (
                    <div style={{ marginBottom: '8px' }}>
                        <SpeciesPicker
                            pokedex={pokedex}
                            customSpecies={customSpecies}
                            onCancel={() => setPickingSpecies(false)}
                            onPick={(speciesData) => {
                                const newPoke = buildTeamPokemon(speciesData);
                                onUpdate({ team: [...(npc.team || []), newPoke] });
                                setPickingSpecies(false);
                                toast.success(`${speciesData.species} added to ${npc.name}'s team`);
                            }}
                        />
                    </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(npc.team || []).map(poke => (
                        <TeamPokemonRow
                            key={poke.id}
                            poke={poke}
                            onDamage={(v) => {
                                const maxHP = calculatePokemonHP(poke);
                                onUpdate({ team: npc.team.map(p => p.id === poke.id ? { ...p, currentDamage: Math.min(maxHP, (p.currentDamage || 0) + v) } : p) });
                            }}
                            onHeal={(v) => {
                                onUpdate({ team: npc.team.map(p => p.id === poke.id ? { ...p, currentDamage: Math.max(0, (p.currentDamage || 0) - v) } : p) });
                            }}
                            onRemove={() => onUpdate({ team: npc.team.filter(p => p.id !== poke.id) })}
                        />
                    ))}
                    {(!npc.team || npc.team.length === 0) && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '6px' }}>No Pokémon yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

const NpcRoster = () => {
    const { npcs, setNpcs } = useData();
    const { showHelp } = useUI();
    const { showConfirm } = useModal();
    const [search, setSearch] = useState('');

    const filteredNpcs = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return npcs;
        return npcs.filter(n => n.name?.toLowerCase().includes(term) || n.trainerClass?.toLowerCase().includes(term));
    }, [npcs, search]);

    const updateNpc = (id, updates) => {
        setNpcs(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    };

    const deleteNpc = (npc) => {
        showConfirm({
            title: `Delete ${npc.name}?`,
            message: 'This will permanently remove this NPC and its Pokémon team.',
            danger: true,
            confirmLabel: 'Delete',
            onConfirm: () => setNpcs(prev => prev.filter(n => n.id !== npc.id))
        });
    };

    const duplicateNpc = (npc) => {
        setNpcs(prev => [...prev, {
            ...npc,
            id: Date.now(),
            name: `${npc.name} (Copy)`,
            team: (npc.team || []).map(p => ({ ...p, id: Date.now() * 1000 + Math.floor(Math.random() * 999) }))
        }]);
    };

    const addBlankNpc = () => {
        setNpcs(prev => [...prev, {
            id: Date.now(),
            name: 'New NPC',
            tier: 'custom',
            trainerClass: '',
            level: 1,
            stats: { atk: 3, def: 3, satk: 3, sdef: 3, spd: 3 },
            hpRolls: [],
            currentDamage: 0,
            notes: '',
            team: []
        }]);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="section-card-purple">
                <h3 className="section-title-purple" aria-label="NPC Roster">
                    🗂️ NPC Roster
                    <button
                        onClick={(e) => { e.stopPropagation(); showHelp('gm-npcroster'); }}
                        style={HELP_BTN_STYLE}
                        aria-label="Help: NPC Roster"
                        title="About the NPC roster"
                    >?</button>
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    Saved NPC stat blocks and their Pokémon teams. Generate one from NPC Stats ("💾 Save as NPC") or build one from scratch here.
                </p>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    <button
                        onClick={addBlankNpc}
                        style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                    >
                        ＋ New Blank NPC
                    </button>
                    {npcs.length > 3 && (
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="🔍 Search by name or class..."
                            aria-label="Search NPCs"
                            style={{ flex: '1 1 200px', minWidth: 0, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '12px' }}
                        />
                    )}
                </div>

                {npcs.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', background: 'var(--input-bg)', borderRadius: '8px' }}>
                        No saved NPCs yet.
                    </div>
                ) : filteredNpcs.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', background: 'var(--input-bg)', borderRadius: '8px' }}>
                        No NPCs match "{search}".
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {filteredNpcs.map(npc => (
                            <NpcCard
                                key={npc.id}
                                npc={npc}
                                onUpdate={(updates) => updateNpc(npc.id, updates)}
                                onDelete={() => deleteNpc(npc)}
                                onDuplicate={() => duplicateNpc(npc)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NpcRoster;
