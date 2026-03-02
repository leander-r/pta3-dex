// ============================================================
// Pokédex Species Browser
// ============================================================
// Read-only browser for all species: search, type filter, accordion

import React, { useState, useMemo } from 'react';
import { useGameData } from '../../contexts/index.js';
import { getTypeColor, getContrastTextColor } from '../../utils/typeUtils.js';
import { getPokemonDisplayImage } from '../../utils/pokemonSprite.js';
import { POKEMON_TYPES } from '../../data/typeChart.js';

const STAT_LABELS = ['HP', 'ATK', 'DEF', 'SATK', 'SDEF', 'SPD'];
const STAT_KEYS   = ['hp', 'atk', 'def', 'satk', 'sdef', 'spd'];
const STAT_COLORS = {
    hp: '#4caf50', atk: '#f44336', def: '#2196f3',
    satk: '#9c27b0', sdef: '#ff9800', spd: '#00bcd4'
};

const TypeChip = ({ type }) => {
    const bg    = getTypeColor(type);
    const color = getContrastTextColor(bg);
    return (
        <span style={{
            background: bg, color, padding: '1px 7px', borderRadius: '10px',
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.3px', flexShrink: 0
        }}>{type}</span>
    );
};

const StatBar = ({ label, statKey, value }) => {
    const pct = Math.min(100, Math.round((value / 20) * 100));
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
            <span style={{ width: '32px', fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'right', flexShrink: 0 }}>{label}</span>
            <div style={{ flex: 1, height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: STAT_COLORS[statKey], borderRadius: '3px' }} />
            </div>
            <span style={{ width: '20px', fontSize: '11px', fontWeight: 700, textAlign: 'right', flexShrink: 0 }}>{value}</span>
        </div>
    );
};

const MoveChip = ({ label }) => (
    <span style={{
        fontSize: '11px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
        borderRadius: '6px', padding: '2px 7px', whiteSpace: 'nowrap'
    }}>{label}</span>
);

const SectionLabel = ({ children }) => (
    <div style={{
        fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px'
    }}>{children}</div>
);

const SpeciesDetail = ({ species }) => {
    const {
        baseStats = {},
        abilities = {},
        skills = {},
        levelUpMoves = [],
        eggMoves,
        tutorMoves,
        evolvedFrom,
        evolutions
    } = species;

    const moveName = (m) => (typeof m === 'string' ? m : m?.name || '');

    return (
        <div style={{
            padding: '14px 16px',
            background: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border-color)'
        }}>
            {/* Base Stats */}
            <div style={{ marginBottom: '14px' }}>
                <SectionLabel>Base Stats</SectionLabel>
                {STAT_KEYS.map((key, i) => (
                    <StatBar key={key} label={STAT_LABELS[i]} statKey={key} value={baseStats[key] || 0} />
                ))}
            </div>

            {/* Abilities */}
            {(abilities.basic?.length > 0 || abilities.adv?.length > 0 || abilities.high?.length > 0) && (
                <div style={{ marginBottom: '14px' }}>
                    <SectionLabel>Abilities</SectionLabel>
                    {abilities.basic?.length > 0 && (
                        <div style={{ fontSize: '12px', marginBottom: '3px' }}>
                            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Basic: </span>
                            {abilities.basic.join(', ')}
                        </div>
                    )}
                    {abilities.adv?.length > 0 && (
                        <div style={{ fontSize: '12px', marginBottom: '3px' }}>
                            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Advanced: </span>
                            {abilities.adv.join(', ')}
                        </div>
                    )}
                    {abilities.high?.length > 0 && (
                        <div style={{ fontSize: '12px' }}>
                            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Hidden: </span>
                            {abilities.high.join(', ')}
                        </div>
                    )}
                </div>
            )}

            {/* Skills */}
            {skills && Object.keys(skills).length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                    <SectionLabel>Skills</SectionLabel>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {Object.entries(skills).map(([name, value]) => (
                            <MoveChip key={name} label={`${name.charAt(0).toUpperCase() + name.slice(1)} ${value}`} />
                        ))}
                    </div>
                </div>
            )}

            {/* Level-up Moves */}
            {levelUpMoves.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                    <SectionLabel>Level-up Moves</SectionLabel>
                    <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <tbody>
                                {levelUpMoves.map((move, i) => (
                                    <tr key={i} style={{ borderBottom: i < levelUpMoves.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                        <td style={{ padding: '4px 8px', color: 'var(--text-muted)', fontWeight: 600, width: '32px', textAlign: 'right' }}>
                                            {move.level ?? '—'}
                                        </td>
                                        <td style={{ padding: '4px 8px', fontWeight: 500 }}>{move.name || moveName(move)}</td>
                                        <td style={{ padding: '4px 8px' }}>
                                            {move.type && <TypeChip type={move.type} />}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Egg Moves */}
            {eggMoves?.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                    <SectionLabel>Egg Moves</SectionLabel>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {eggMoves.map((m, i) => <MoveChip key={i} label={moveName(m)} />)}
                    </div>
                </div>
            )}

            {/* Tutor Moves */}
            {tutorMoves?.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                    <SectionLabel>Tutor Moves</SectionLabel>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {tutorMoves.map((m, i) => <MoveChip key={i} label={moveName(m)} />)}
                    </div>
                </div>
            )}

            {/* Evolution */}
            {(evolvedFrom || evolutions?.length > 0) && (
                <div>
                    <SectionLabel>Evolution</SectionLabel>
                    {evolvedFrom && (
                        <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                            Evolves from: <strong>
                                {typeof evolvedFrom === 'string' ? evolvedFrom : (evolvedFrom.species || evolvedFrom.name || String(evolvedFrom))}
                            </strong>
                        </div>
                    )}
                    {evolutions?.length > 0 && evolutions.map((evo, i) => (
                        <div key={i} style={{ fontSize: '12px', marginBottom: '2px' }}>
                            {'→ '}
                            <strong>{evo.into || evo.species || evo.name || String(evo)}</strong>
                            {evo.level ? ` (Lv. ${evo.level})` : ''}
                            {evo.condition ? ` — ${evo.condition}` : ''}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const PokedexSection = () => {
    const { pokedex, customSpecies, pokedexLoading } = useGameData();
    const [search, setSearch]       = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    const allSpecies = useMemo(() =>
        [...(pokedex || []), ...(customSpecies || [])],
        [pokedex, customSpecies]
    );

    const filtered = useMemo(() =>
        allSpecies
            .filter(s => {
                const matchName = !search || s.species?.toLowerCase().includes(search.toLowerCase());
                const matchType = !typeFilter || s.types?.includes(typeFilter);
                return matchName && matchType;
            })
            .sort((a, b) => (a.id || 0) - (b.id || 0)),
        [allSpecies, search, typeFilter]
    );

    const handleRowClick = (id) => setExpandedId(prev => prev === id ? null : id);

    if (pokedexLoading) {
        return (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                Loading Pokédex…
            </div>
        );
    }

    return (
        <div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    placeholder="Search species…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                        flex: 1, minWidth: '160px', padding: '8px 12px',
                        borderRadius: '8px', border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)', fontSize: '14px', color: 'var(--text-primary)'
                    }}
                />
                <select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    style={{
                        padding: '8px 10px', borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)', fontSize: '14px', color: 'var(--text-primary)'
                    }}
                >
                    <option value="">All Types</option>
                    {POKEMON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                {filtered.length} {filtered.length === 1 ? 'species' : 'species'}
            </div>

            {/* Species List */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                {filtered.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No species found.
                    </div>
                ) : (
                    filtered.map((s, idx) => {
                        const rowId      = s.id ?? s.species;
                        const isExpanded = expandedId === rowId;
                        const spriteUrl  = getPokemonDisplayImage(s);

                        return (
                            <div
                                key={rowId}
                                style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--border-color)' }}
                            >
                                {/* Collapsed row */}
                                <button
                                    onClick={() => handleRowClick(rowId)}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '6px 12px',
                                        background: isExpanded ? 'var(--bg-secondary)' : 'var(--bg-card)',
                                        border: 'none', cursor: 'pointer', textAlign: 'left',
                                        transition: 'background 0.15s'
                                    }}
                                >
                                    {/* Sprite */}
                                    {spriteUrl ? (
                                        <img
                                            src={spriteUrl}
                                            alt={s.species}
                                            style={{ width: '40px', height: '40px', imageRendering: 'pixelated', flexShrink: 0 }}
                                            onError={e => { e.target.style.display = 'none'; }}
                                        />
                                    ) : (
                                        <div style={{ width: '40px', height: '40px', flexShrink: 0 }} />
                                    )}
                                    {/* Dex # */}
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, width: '34px', flexShrink: 0, textAlign: 'right' }}>
                                        #{s.id || '?'}
                                    </span>
                                    {/* Name */}
                                    <span style={{ fontWeight: 700, fontSize: '14px', flex: 1, textAlign: 'left' }}>{s.species}</span>
                                    {/* Types */}
                                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                        {(s.types || []).map(t => <TypeChip key={t} type={t} />)}
                                    </div>
                                    {/* Chevron */}
                                    <svg
                                        width="14" height="14" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" strokeWidth="2"
                                        style={{
                                            flexShrink: 0, color: 'var(--text-muted)',
                                            transform: isExpanded ? 'rotate(90deg)' : 'none',
                                            transition: 'transform 0.2s'
                                        }}
                                    >
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </button>

                                {/* Expanded panel */}
                                {isExpanded && <SpeciesDetail species={s} />}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default PokedexSection;
