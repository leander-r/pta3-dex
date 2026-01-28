// ============================================================
// Type Chart Section Component
// ============================================================

import React, { useState, useMemo } from 'react';
import { TYPE_CHART, POKEMON_TYPES } from '../../data/typeChart.js';
import { getTypeColor } from '../../utils/typeUtils.js';

const TypeChartSection = () => {
    const [filter, setFilter] = useState({
        search: '',
        sortBy: 'name',
        sortDir: 'asc'
    });

    const filteredTypes = useMemo(() => {
        let entries = Object.entries(TYPE_CHART);

        // Search filter
        if (filter.search) {
            const query = filter.search.toLowerCase();
            entries = entries.filter(([type, data]) =>
                type.toLowerCase().includes(query) ||
                data.weak.some(t => t.toLowerCase().includes(query)) ||
                data.resist.some(t => t.toLowerCase().includes(query)) ||
                data.immune.some(t => t.toLowerCase().includes(query))
            );
        }

        // Sorting
        entries.sort((a, b) => {
            let cmp = 0;
            switch (filter.sortBy) {
                case 'weaknesses':
                    cmp = b[1].weak.length - a[1].weak.length;
                    break;
                case 'resistances':
                    cmp = b[1].resist.length - a[1].resist.length;
                    break;
                default:
                    cmp = a[0].localeCompare(b[0]);
            }
            return filter.sortDir === 'asc' ? cmp : -cmp;
        });

        return entries;
    }, [filter]);

    return (
        <div>
            <h3>Type Effectiveness Chart</h3>

            {/* Search and Filters */}
            <div className="section-card" style={{ marginBottom: '15px' }}>
                <div style={{ marginBottom: '12px' }}>
                    <input
                        type="text"
                        placeholder="Search types..."
                        value={filter.search}
                        onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                        style={{
                            width: '100%',
                            padding: '10px 15px',
                            borderRadius: '8px',
                            border: '2px solid var(--border-medium)',
                            fontSize: '14px',
                            background: 'var(--input-bg)',
                            color: 'var(--text-primary)'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                    <select
                        value={filter.sortBy}
                        onChange={(e) => setFilter(prev => ({ ...prev, sortBy: e.target.value }))}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '13px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                    >
                        <option value="name">Sort: Name</option>
                        <option value="weaknesses">Sort: Most Weaknesses</option>
                        <option value="resistances">Sort: Most Resistances</option>
                    </select>

                    <button
                        onClick={() => setFilter(prev => ({ ...prev, sortDir: prev.sortDir === 'asc' ? 'desc' : 'asc' }))}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}
                    >
                        {filter.sortDir === 'asc' ? ' A-Z' : ' Z-A'}
                    </button>

                    {filter.search && (
                        <button
                            onClick={() => setFilter({ search: '', sortBy: 'name', sortDir: 'asc' })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', background: '#dc3545', color: 'white', cursor: 'pointer', fontSize: '13px' }}
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* Quick Type Buttons */}
                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {POKEMON_TYPES.map(type => (
                        <button
                            key={type}
                            onClick={() => setFilter(prev => ({ ...prev, search: prev.search === type ? '' : type }))}
                            style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: filter.search === type ? '2px solid var(--text-primary)' : '1px solid transparent',
                                background: getTypeColor(type),
                                color: ['Electric', 'Ice', 'Ground', 'Steel'].includes(type) ? '#333' : 'white',
                                cursor: 'pointer',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                opacity: filter.search && filter.search !== type ? 0.5 : 1
                            }}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results Count */}
            <div style={{ marginBottom: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
                Showing {filteredTypes.length} of {POKEMON_TYPES.length} types
            </div>

            <div style={{ overflowX: 'auto' }}>
                {filteredTypes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No types found matching your search.
                    </div>
                ) : (
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '14px'
                    }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-light)' }}>
                                <th style={{ padding: '10px', border: '1px solid var(--border-medium)', color: 'var(--text-primary)' }}>Type</th>
                                <th style={{ padding: '10px', border: '1px solid var(--border-medium)', color: 'var(--text-primary)' }}>Weak To (2x)</th>
                                <th style={{ padding: '10px', border: '1px solid var(--border-medium)', color: 'var(--text-primary)' }}>Resists (0.5x)</th>
                                <th style={{ padding: '10px', border: '1px solid var(--border-medium)', color: 'var(--text-primary)' }}>Immune (0x)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTypes.map(([type, data]) => (
                                <tr key={type}>
                                    <td className="ref-cell-header" style={{ background: 'var(--input-bg)' }}>
                                        <span className={`type-badge type-${type.toLowerCase()}`}>{type}</span>
                                    </td>
                                    <td style={{ padding: '8px', border: '1px solid var(--border-medium)', color: '#f44336', background: 'var(--input-bg)' }}>
                                        {data.weak.join(', ') || '—'}
                                    </td>
                                    <td style={{ padding: '8px', border: '1px solid var(--border-medium)', color: '#4caf50', background: 'var(--input-bg)' }}>
                                        {data.resist.join(', ') || '—'}
                                    </td>
                                    <td style={{ padding: '8px', border: '1px solid var(--border-medium)', color: '#2196f3', background: 'var(--input-bg)' }}>
                                        {data.immune.join(', ') || '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default TypeChartSection;
