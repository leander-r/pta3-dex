// ============================================================
// Type Chart Section Component
// ============================================================
// Interactive type effectiveness lookup with dual-type support

import React, { useState, useMemo } from 'react';
import { TYPE_CHART, POKEMON_TYPES, getCombinedTypeEffectiveness } from '../../data/typeChart.js';
import { getTypeColor } from '../../utils/typeUtils.js';

// Helper: determine if a type color is too light for white text
const needsDarkText = (type) => ['Electric', 'Ice', 'Ground', 'Steel', 'Normal'].includes(type);

// Type badge pill used throughout the component
const TypeBadge = ({ type, size = 'md', onClick, style = {} }) => {
    const sizes = {
        sm: { padding: '2px 8px', fontSize: '10px', borderRadius: '10px' },
        md: { padding: '4px 12px', fontSize: '12px', borderRadius: '12px' },
        lg: { padding: '6px 14px', fontSize: '13px', borderRadius: '14px' }
    };
    return (
        <span
            onClick={onClick}
            style={{
                ...sizes[size],
                background: getTypeColor(type),
                color: needsDarkText(type) ? '#333' : 'white',
                fontWeight: 'bold',
                display: 'inline-flex',
                alignItems: 'center',
                cursor: onClick ? 'pointer' : 'default',
                ...style
            }}
        >
            {type}
        </span>
    );
};

// Effectiveness tier section
const EffectivenessTier = ({ label, icon, types, bgColor, borderColor, labelColor }) => {
    if (!types || types.length === 0) return null;
    return (
        <div style={{
            padding: '10px 12px',
            background: bgColor,
            borderRadius: '8px',
            border: `1px solid ${borderColor}`,
            marginBottom: '8px'
        }}>
            <div style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: labelColor,
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
            }}>
                <span>{icon}</span>
                <span>{label}</span>
                <span style={{
                    marginLeft: 'auto',
                    fontSize: '11px',
                    fontWeight: 'normal',
                    opacity: 0.7
                }}>
                    {types.length} type{types.length !== 1 ? 's' : ''}
                </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {types.map(t => (
                    <TypeBadge key={t} type={t} size="lg" />
                ))}
            </div>
        </div>
    );
};

const TypeChartSection = () => {
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [showNeutral, setShowNeutral] = useState(false);
    const [showFullTable, setShowFullTable] = useState(false);

    // Toggle a type in selection (max 2)
    const toggleType = (type) => {
        setSelectedTypes(prev => {
            if (prev.includes(type)) {
                return prev.filter(t => t !== type);
            }
            if (prev.length >= 2) {
                // Replace oldest
                return [prev[1], type];
            }
            return [...prev, type];
        });
    };

    // Compute matchup results
    const matchup = useMemo(() => {
        if (selectedTypes.length === 0) return null;
        return getCombinedTypeEffectiveness(selectedTypes);
    }, [selectedTypes]);

    return (
        <div>
            <h3>Type Effectiveness Chart</h3>
            <p style={{ marginBottom: '15px', fontSize: '13px', color: 'var(--text-muted)' }}>
                Select 1 or 2 types to see their defensive matchups.
            </p>

            {/* Type Selector Grid */}
            <div className="section-card" style={{ marginBottom: '16px' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))',
                    gap: '6px'
                }}>
                    {POKEMON_TYPES.map(type => {
                        const isSelected = selectedTypes.includes(type);
                        return (
                            <button
                                key={type}
                                onClick={() => toggleType(type)}
                                style={{
                                    padding: '10px 6px',
                                    borderRadius: '8px',
                                    border: isSelected
                                        ? '3px solid var(--text-primary)'
                                        : '2px solid transparent',
                                    background: getTypeColor(type),
                                    color: needsDarkText(type) ? '#333' : 'white',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                                    transition: 'transform 0.15s ease, border-color 0.15s ease',
                                    boxShadow: isSelected
                                        ? '0 3px 10px rgba(0,0,0,0.3)'
                                        : '0 1px 3px rgba(0,0,0,0.15)',
                                    opacity: selectedTypes.length > 0 && !isSelected ? 0.65 : 1
                                }}
                            >
                                {type}
                            </button>
                        );
                    })}
                </div>

                {/* Selected types display */}
                {selectedTypes.length > 0 && (
                    <div style={{
                        marginTop: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap'
                    }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                            Selected:
                        </span>
                        {selectedTypes.map(type => (
                            <TypeBadge
                                key={type}
                                type={type}
                                size="lg"
                                onClick={() => toggleType(type)}
                                style={{ cursor: 'pointer' }}
                            />
                        ))}
                        {selectedTypes.length < 2 && (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                + pick a 2nd type for dual-type lookup
                            </span>
                        )}
                        <button
                            onClick={() => setSelectedTypes([])}
                            style={{
                                marginLeft: 'auto',
                                padding: '4px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#dc3545',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: 'bold'
                            }}
                        >
                            Clear
                        </button>
                    </div>
                )}
            </div>

            {/* Matchup Results */}
            {matchup && (
                <div className="section-card-purple" style={{ marginBottom: '16px' }}>
                    <h3 className="section-title-purple" style={{ marginBottom: '4px' }}>
                        <span>🛡️</span>
                        <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                            {selectedTypes.map((type, i) => (
                                <span key={type} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    {i > 0 && <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>/</span>}
                                    <TypeBadge type={type} size="md" />
                                </span>
                            ))}
                            <span style={{ fontWeight: 'normal', fontSize: '13px' }}>
                                Defensive Matchups
                            </span>
                        </span>
                    </h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                        How attacking types affect {selectedTypes.length === 2
                            ? `a ${selectedTypes[0]}/${selectedTypes[1]} Pokemon`
                            : `a ${selectedTypes[0]}-type Pokemon`
                        }
                    </p>

                    {/* 4x — Super Weak (dual-type only) */}
                    <EffectivenessTier
                        label="Super Weak (+2 dice)"
                        icon="💀"
                        types={matchup.superWeak}
                        bgColor="var(--roll-miss-bg, #ffebee)"
                        borderColor="#e57373"
                        labelColor="#c62828"
                    />

                    {/* 2x — Weak */}
                    <EffectivenessTier
                        label="Weak To (+1 die)"
                        icon="⚠️"
                        types={matchup.weak}
                        bgColor="var(--roll-miss-bg, #fff3e0)"
                        borderColor="#ffb74d"
                        labelColor="#e65100"
                    />

                    {/* 1x — Neutral (toggleable) */}
                    {matchup.neutral && matchup.neutral.length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                            <button
                                onClick={() => setShowNeutral(!showNeutral)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-medium)',
                                    background: 'var(--bg-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    color: 'var(--text-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <span>➖</span>
                                <span>Neutral — {matchup.neutral.length} types</span>
                                <span style={{ marginLeft: 'auto', fontSize: '10px' }}>
                                    {showNeutral ? '▲ Hide' : '▼ Show'}
                                </span>
                            </button>
                            {showNeutral && (
                                <div style={{
                                    padding: '10px 12px',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '0 0 8px 8px',
                                    borderTop: 'none',
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '6px'
                                }}>
                                    {matchup.neutral.map(t => (
                                        <TypeBadge key={t} type={t} size="md" style={{ opacity: 0.7 }} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 0.5x — Resists */}
                    <EffectivenessTier
                        label="Resists (−1 die)"
                        icon="🛡️"
                        types={matchup.resist}
                        bgColor="var(--roll-hit-bg, #e8f5e9)"
                        borderColor="#81c784"
                        labelColor="#2e7d32"
                    />

                    {/* 0.25x — Super Resists (dual-type only) */}
                    <EffectivenessTier
                        label="Super Resists (−2 dice)"
                        icon="🏰"
                        types={matchup.superResist}
                        bgColor="#e0f2f1"
                        borderColor="#4db6ac"
                        labelColor="#00695c"
                    />

                    {/* 0x — Immune */}
                    <EffectivenessTier
                        label="Immune (no damage)"
                        icon="✨"
                        types={matchup.immune}
                        bgColor="#e3f2fd"
                        borderColor="#64b5f6"
                        labelColor="#1565c0"
                    />

                    {/* Summary bar */}
                    <div style={{
                        marginTop: '4px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'var(--bg-secondary)',
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '12px',
                        justifyContent: 'center'
                    }}>
                        {matchup.superWeak.length > 0 && (
                            <span style={{ color: '#c62828' }}>
                                <strong>{matchup.superWeak.length}</strong> super weak
                            </span>
                        )}
                        {matchup.weak.length > 0 && (
                            <span style={{ color: '#e65100' }}>
                                <strong>{matchup.weak.length}</strong> weak
                            </span>
                        )}
                        {matchup.neutral?.length > 0 && (
                            <span>
                                <strong>{matchup.neutral.length}</strong> neutral
                            </span>
                        )}
                        {matchup.resist.length > 0 && (
                            <span style={{ color: '#2e7d32' }}>
                                <strong>{matchup.resist.length}</strong> resist
                            </span>
                        )}
                        {matchup.superResist.length > 0 && (
                            <span style={{ color: '#00695c' }}>
                                <strong>{matchup.superResist.length}</strong> super resist
                            </span>
                        )}
                        {matchup.immune.length > 0 && (
                            <span style={{ color: '#1565c0' }}>
                                <strong>{matchup.immune.length}</strong> immune
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {!matchup && (
                <div className="empty-state" style={{ margin: '0 0 16px 0' }}>
                    <span className="empty-state-icon">🔍</span>
                    <p className="empty-state-title">Select a type above</p>
                    <p className="empty-state-description">
                        Click one type for single-type matchups, or two types for dual-type analysis.
                    </p>
                </div>
            )}

            {/* Full Table Toggle */}
            <button
                onClick={() => setShowFullTable(!showFullTable)}
                style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium)',
                    background: showFullTable ? 'var(--bg-light)' : 'var(--bg-secondary)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: 'var(--text-secondary)',
                    marginBottom: showFullTable ? '12px' : 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                }}
            >
                <span>{showFullTable ? '▲' : '▼'}</span>
                {showFullTable ? 'Hide Full Table' : 'Show Full Type Chart Table'}
            </button>

            {/* Full Table View */}
            {showFullTable && (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '13px'
                    }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-light)' }}>
                                <th style={{ padding: '10px', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', textAlign: 'left', minWidth: '80px' }}>Type</th>
                                <th style={{ padding: '10px', border: '1px solid var(--border-medium)', color: '#c62828', textAlign: 'left' }}>Weak To (+1 die)</th>
                                <th style={{ padding: '10px', border: '1px solid var(--border-medium)', color: '#2e7d32', textAlign: 'left' }}>Resists (−1 die)</th>
                                <th style={{ padding: '10px', border: '1px solid var(--border-medium)', color: '#1565c0', textAlign: 'left' }}>Immune</th>
                            </tr>
                        </thead>
                        <tbody>
                            {POKEMON_TYPES.map((type, idx) => {
                                const data = TYPE_CHART[type];
                                return (
                                    <tr
                                        key={type}
                                        style={{
                                            background: idx % 2 === 0 ? 'var(--input-bg)' : 'var(--bg-primary, white)',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => {
                                            setSelectedTypes([type]);
                                            setShowFullTable(false);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        title={`Click to view ${type} matchups`}
                                    >
                                        <td style={{ padding: '8px', border: '1px solid var(--border-medium)' }}>
                                            <TypeBadge type={type} size="md" />
                                        </td>
                                        <td style={{ padding: '8px', border: '1px solid var(--border-medium)' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                {data.weak.length > 0
                                                    ? data.weak.map(t => <TypeBadge key={t} type={t} size="sm" />)
                                                    : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                                                }
                                            </div>
                                        </td>
                                        <td style={{ padding: '8px', border: '1px solid var(--border-medium)' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                {data.resist.length > 0
                                                    ? data.resist.map(t => <TypeBadge key={t} type={t} size="sm" />)
                                                    : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                                                }
                                            </div>
                                        </td>
                                        <td style={{ padding: '8px', border: '1px solid var(--border-medium)' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                {data.immune.length > 0
                                                    ? data.immune.map(t => <TypeBadge key={t} type={t} size="sm" />)
                                                    : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                                                }
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default TypeChartSection;
