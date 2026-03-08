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

// ── Sub-components ───────────────────────────────────────────

const TypeChip = ({ type }) => {
    const bg    = getTypeColor(type);
    const color = getContrastTextColor(bg);
    return (
        <span style={{
            background: bg, color, padding: '2px 8px', borderRadius: '10px',
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.3px',
            flexShrink: 0, display: 'inline-block'
        }}>{type}</span>
    );
};

// Scale: HP up to 160 (legendaries), combat stats up to 25
const STAT_MAX = { hp: 160, atk: 25, def: 25, satk: 25, sdef: 25, spd: 25 };

const StatBar = ({ label, statKey, value }) => {
    const pct = Math.min(100, Math.round((value / (STAT_MAX[statKey] || 25)) * 100));
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
                width: '34px', fontSize: '10px', fontWeight: 700,
                color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0
            }}>{label}</span>
            <div style={{
                flex: 1, height: '7px',
                background: 'var(--border-medium)',
                borderRadius: '4px', overflow: 'hidden'
            }}>
                <div style={{
                    width: `${pct}%`, height: '100%',
                    background: STAT_COLORS[statKey], borderRadius: '4px',
                    transition: 'width 0.3s ease'
                }} />
            </div>
            <span style={{
                width: '22px', fontSize: '12px', fontWeight: 700,
                textAlign: 'right', flexShrink: 0, color: 'var(--text-primary)'
            }}>{value}</span>
        </div>
    );
};

const Chip = ({ label, accent }) => (
    <span style={{
        fontSize: '11px',
        background: accent ? 'rgba(245,166,35,0.12)' : 'var(--poke-gray)',
        border: `1px solid ${accent ? 'rgba(245,166,35,0.35)' : 'var(--border-light)'}`,
        color: accent ? 'var(--poke-orange-dark)' : 'var(--text-primary)',
        borderRadius: '6px', padding: '3px 8px', whiteSpace: 'nowrap',
        fontWeight: accent ? 700 : 500
    }}>{label}</span>
);

const SectionLabel = ({ children }) => (
    <div style={{
        fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '7px'
    }}>{children}</div>
);

const DetailSection = ({ children, last }) => (
    <div style={{
        padding: '12px 16px',
        borderBottom: last ? 'none' : '1px solid var(--border-light)'
    }}>{children}</div>
);

// ── Expanded panel ────────────────────────────────────────────

const SpeciesDetail = ({ species }) => {
    const {
        baseStats = {},
        abilities = {},
        skills,
        passives,
        moves,
        levelUpMoves = [],
        eggMoves,
        tutorMoves,
        evolvedFrom,
        evolutions,
        types = [],
        size,
        weight,
        speedFt,
        accuracyMods,
    } = species;

    // New PTA3 format: skills is a string array; old format: object
    const isPTA3 = Array.isArray(skills);
    const moveName = (m) => (typeof m === 'string' ? m : m?.name || '');

    // Moves: prefer the raw `moves` array for PTA3, fall back to levelUpMoves
    const displayMoves = isPTA3 ? (moves || levelUpMoves) : levelUpMoves;

    const bst = STAT_KEYS.reduce((sum, k) => sum + (baseStats[k] || 0), 0);
    const accentColor = types[0] ? getTypeColor(types[0]) : '#f5a623';
    const accentTextColor = getContrastTextColor(accentColor);

    const hasAbilities = !isPTA3 && (abilities.basic?.length > 0 || abilities.adv?.length > 0 || abilities.high?.length > 0);
    const hasSkills    = isPTA3 ? skills.length > 0 : (skills && Object.keys(skills).length > 0);
    const hasPassives  = isPTA3 && passives?.length > 0;
    const hasMoves     = displayMoves.length > 0;
    const hasEggMoves  = !isPTA3 && eggMoves?.length > 0;
    const hasTutor     = !isPTA3 && tutorMoves?.length > 0;
    const hasEvo       = evolvedFrom || evolutions?.length > 0;

    return (
        <div style={{ background: 'var(--bg-section)', borderTop: `2px solid ${accentColor}` }}>

            {/* Stats */}
            <DetailSection>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <SectionLabel>Base Stats</SectionLabel>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {size && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{size}</span>}
                        {weight && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{weight}</span>}
                        {speedFt && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{speedFt}ft</span>}
                        <span style={{
                            fontSize: '11px', fontWeight: 700, color: accentTextColor,
                            background: accentColor, padding: '2px 8px', borderRadius: '8px'
                        }}>BST {bst}</span>
                    </div>
                </div>
                {STAT_KEYS.map((key, i) => (
                    <StatBar key={key} label={STAT_LABELS[i]} statKey={key} value={baseStats[key] || 0} />
                ))}
            </DetailSection>

            {/* Passives (PTA3) */}
            {hasPassives && (
                <DetailSection>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <SectionLabel>Passives</SectionLabel>
                        {isPTA3 && accuracyMods && (
                            <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                                {accuracyMods.atk != null && <span title="Attack accuracy bonus">ATK +{accuracyMods.atk}</span>}
                                {accuracyMods.satk != null && <span title="Special Attack accuracy bonus">SATK +{accuracyMods.satk}</span>}
                                {accuracyMods.eff != null && <span title="Effect accuracy bonus">EFF +{accuracyMods.eff}</span>}
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {passives.map((p, i) => <Chip key={i} label={p} accent />)}
                    </div>
                </DetailSection>
            )}

            {/* Skills / Capabilities */}
            {hasSkills && (
                <DetailSection>
                    <SectionLabel>Capabilities</SectionLabel>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {isPTA3
                            ? skills.map((s, i) => <Chip key={i} label={s} />)
                            : Object.entries(skills).map(([name, value]) => (
                                <Chip key={name} label={`${name.charAt(0).toUpperCase() + name.slice(1)} ${value}`} />
                            ))
                        }
                    </div>
                </DetailSection>
            )}

            {/* Abilities (old format only) */}
            {hasAbilities && (
                <DetailSection>
                    <SectionLabel>Abilities</SectionLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                        {abilities.basic?.length > 0 && (
                            <div>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '11px' }}>Basic </span>
                                {abilities.basic.join(', ')}
                            </div>
                        )}
                        {abilities.adv?.length > 0 && (
                            <div>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '11px' }}>Advanced </span>
                                {abilities.adv.join(', ')}
                            </div>
                        )}
                        {abilities.high?.length > 0 && (
                            <div>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '11px' }}>Hidden </span>
                                {abilities.high.join(', ')}
                            </div>
                        )}
                    </div>
                </DetailSection>
            )}

            {/* Moves */}
            {hasMoves && (
                <DetailSection>
                    <SectionLabel>Moves</SectionLabel>
                    <div style={{
                        maxHeight: '220px', overflowY: 'auto',
                        border: '1px solid var(--border-light)', borderRadius: '6px',
                        background: 'var(--poke-white)'
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-section)' }}>
                                    {!isPTA3 && <th style={{ padding: '5px 8px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 700, borderBottom: '1px solid var(--border-light)', width: '36px' }}>Lv</th>}
                                    <th style={{ padding: '5px 8px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, borderBottom: '1px solid var(--border-light)' }}>Move</th>
                                    <th style={{ padding: '5px 8px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, borderBottom: '1px solid var(--border-light)' }}>Type</th>
                                    {isPTA3 && <th style={{ padding: '5px 8px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, borderBottom: '1px solid var(--border-light)' }}>Cat.</th>}
                                    {isPTA3 && <th style={{ padding: '5px 8px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, borderBottom: '1px solid var(--border-light)' }}>Range</th>}
                                    {isPTA3 && <th style={{ padding: '5px 8px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, borderBottom: '1px solid var(--border-light)' }}>Freq</th>}
                                    {isPTA3 && <th style={{ padding: '5px 8px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, borderBottom: '1px solid var(--border-light)' }}>Dmg</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {displayMoves.map((move, i) => (
                                    <tr key={i} style={{
                                        borderBottom: i < displayMoves.length - 1 ? '1px solid var(--border-light)' : 'none',
                                        background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)'
                                    }}>
                                        {!isPTA3 && (
                                            <td style={{ padding: '5px 8px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>
                                                {move.level ?? '—'}
                                            </td>
                                        )}
                                        <td style={{ padding: '5px 8px', color: 'var(--text-primary)', fontWeight: 500 }}>
                                            {move.name || moveName(move)}
                                        </td>
                                        <td style={{ padding: '5px 8px' }}>
                                            {move.type && <TypeChip type={move.type} />}
                                        </td>
                                        {isPTA3 && (
                                            <td style={{ padding: '5px 8px', color: 'var(--text-muted)', fontSize: '11px', whiteSpace: 'nowrap' }}>
                                                {move.category || '—'}
                                            </td>
                                        )}
                                        {isPTA3 && (
                                            <td style={{ padding: '5px 8px', color: 'var(--text-muted)', fontSize: '11px', whiteSpace: 'nowrap' }}>
                                                {move.range || '—'}
                                            </td>
                                        )}
                                        {isPTA3 && (
                                            <td style={{ padding: '5px 8px', color: 'var(--text-muted)', fontSize: '11px', whiteSpace: 'nowrap' }}>
                                                {move.frequency || '—'}
                                            </td>
                                        )}
                                        {isPTA3 && (
                                            <td style={{ padding: '5px 8px', color: 'var(--text-primary)', fontWeight: 600, fontSize: '11px' }}>
                                                {move.damage || '—'}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </DetailSection>
            )}

            {/* Egg & Tutor Moves (old format only) */}
            {(hasEggMoves || hasTutor) && (
                <DetailSection>
                    {hasEggMoves && (
                        <div style={{ marginBottom: hasTutor ? '10px' : 0 }}>
                            <SectionLabel>Egg Moves</SectionLabel>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {eggMoves.map((m, i) => <Chip key={i} label={moveName(m)} />)}
                            </div>
                        </div>
                    )}
                    {hasTutor && (
                        <div>
                            <SectionLabel>Tutor Moves</SectionLabel>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {tutorMoves.map((m, i) => <Chip key={i} label={moveName(m)} />)}
                            </div>
                        </div>
                    )}
                </DetailSection>
            )}

            {/* Mega Forms */}
            {species.megaForms?.length > 0 && (
                <DetailSection last={!hasEvo}>
                    <SectionLabel>Mega Forms</SectionLabel>
                    {species.megaForms.map((form, fi) => (
                        <div key={fi} style={{ marginBottom: fi < species.megaForms.length - 1 ? '18px' : 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <span style={{ fontWeight: 700, fontSize: '13px' }}>{form.name}</span>
                                {form.types?.map(t => <TypeChip key={t} type={t} />)}
                                {form.speedFt && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{form.speedFt}ft</span>}
                            </div>
                            {form.stats && STAT_KEYS.map((key, i) => (
                                <StatBar key={key} label={STAT_LABELS[i]} statKey={key} value={form.stats[key] || 0} />
                            ))}
                            {form.additionalSkills?.length > 0 && (
                                <div style={{ marginTop: '6px' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Additional Capabilities</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {form.additionalSkills.map((sk, i) => <Chip key={i} label={sk} />)}
                                    </div>
                                </div>
                            )}
                            {form.moves?.length > 0 && (
                                <div style={{ marginTop: '6px' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Additional Moves</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {form.moves.map((m, i) => (
                                            <span key={i} style={{ fontSize: '11px', background: 'var(--poke-gray)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', borderRadius: '6px', padding: '3px 8px', fontWeight: 500 }}>
                                                {m.name} <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{m.frequency} {m.damage || ''}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </DetailSection>
            )}

            {/* Evolution */}
            {hasEvo && (
                <DetailSection last>
                    <SectionLabel>Evolution</SectionLabel>
                    <div style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--text-primary)' }}>
                        {evolvedFrom && (
                            <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>
                                ← Evolves from{' '}
                                <strong style={{ color: 'var(--text-primary)' }}>
                                    {typeof evolvedFrom === 'string' ? evolvedFrom : (evolvedFrom.species || evolvedFrom.name || String(evolvedFrom))}
                                </strong>
                            </div>
                        )}
                        {evolutions?.length > 0 && evolutions.map((evo, i) => (
                            <div key={i}>
                                {'→ '}
                                <strong>{evo.into || evo.species || evo.name || String(evo)}</strong>
                                {evo.level && <span style={{ color: 'var(--text-muted)' }}>{` (Lv. ${evo.level})`}</span>}
                                {evo.condition && <span style={{ color: 'var(--text-muted)' }}>{` — ${evo.condition}`}</span>}
                            </div>
                        ))}
                    </div>
                </DetailSection>
            )}
        </div>
    );
};

// ── Main component ────────────────────────────────────────────

const PokedexSection = () => {
    const { pokedex, customSpecies, pokedexLoading } = useGameData();
    const [search, setSearch]         = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [hoveredId, setHoveredId]   = useState(null);

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
            <div style={{
                textAlign: 'center', padding: '56px 24px',
                color: 'var(--text-muted)', fontSize: '14px'
            }}>
                Loading Pokédex…
            </div>
        );
    }

    return (
        <div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                {/* Search with clear button */}
                <div style={{ flex: 1, minWidth: '160px', position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="Search species…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            width: '100%', padding: '8px 32px 8px 12px',
                            borderRadius: '8px', border: '1px solid var(--input-border)',
                            background: 'var(--input-bg)', fontSize: '14px',
                            color: 'var(--text-primary)', outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            aria-label="Clear search"
                            style={{
                                position: 'absolute', right: '8px', top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1,
                                padding: '2px 4px'
                            }}
                        >×</button>
                    )}
                </div>
                <select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    style={{
                        padding: '8px 10px', borderRadius: '8px',
                        border: '1px solid var(--input-border)',
                        background: 'var(--input-bg)', fontSize: '14px',
                        color: 'var(--text-primary)', cursor: 'pointer'
                    }}
                >
                    <option value="">All Types</option>
                    {POKEMON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            {/* Count */}
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                {filtered.length === allSpecies.length
                    ? `${allSpecies.length} species`
                    : `${filtered.length} of ${allSpecies.length} species`}
            </div>

            {/* Species List */}
            <div style={{
                border: '1px solid var(--border-light)', borderRadius: '10px',
                overflow: 'hidden', background: 'var(--poke-white)'
            }}>
                {filtered.length === 0 ? (
                    <div style={{
                        padding: '40px', textAlign: 'center',
                        color: 'var(--text-muted)', fontSize: '14px'
                    }}>
                        No species found.
                    </div>
                ) : (
                    filtered.map((s, idx) => {
                        const rowId      = s.id ?? s.species;
                        const isExpanded = expandedId === rowId;
                        const isHovered  = hoveredId === rowId && !isExpanded;
                        const spriteUrl  = getPokemonDisplayImage(s);

                        return (
                            <div
                                key={rowId}
                                style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--border-light)' }}
                            >
                                {/* Collapsed row */}
                                <button
                                    onClick={() => handleRowClick(rowId)}
                                    onMouseEnter={() => setHoveredId(rowId)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '7px 12px', border: 'none', cursor: 'pointer',
                                        textAlign: 'left', color: 'var(--text-primary)',
                                        transition: 'background 0.12s',
                                        background: isExpanded
                                            ? 'var(--bg-section)'
                                            : isHovered
                                                ? 'var(--hover-bg)'
                                                : 'transparent'
                                    }}
                                >
                                    {/* Sprite */}
                                    <div style={{ width: '40px', height: '40px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {spriteUrl ? (
                                            <img
                                                src={spriteUrl}
                                                alt={s.species}
                                                style={{ width: '40px', height: '40px', imageRendering: 'pixelated' }}
                                                onError={e => { e.target.style.display = 'none'; }}
                                            />
                                        ) : null}
                                    </div>
                                    {/* Dex # */}
                                    <span style={{
                                        fontSize: '11px', color: 'var(--text-muted)',
                                        fontWeight: 600, width: '34px', flexShrink: 0, textAlign: 'right'
                                    }}>#{s.id || '?'}</span>
                                    {/* Name */}
                                    <span style={{ fontWeight: 700, fontSize: '14px', flex: 1, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        {s.species}
                                        {s.legendary && <span title="Legendary Pokémon" style={{ color: '#f9a825', fontSize: '13px' }}>⭐</span>}
                                    </span>
                                    {/* Types */}
                                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                        {(s.types || []).map(t => <TypeChip key={t} type={t} />)}
                                    </div>
                                    {/* Chevron */}
                                    <svg
                                        width="13" height="13" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" strokeWidth="2.5"
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
