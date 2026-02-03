// ============================================================
// Moves Section Component
// ============================================================

import React, { useState, useMemo } from 'react';
import { GAME_DATA } from '../../data/configs.js';
import { getTypeColor } from '../../utils/typeUtils.js';
import { POKEMON_TYPES } from '../../data/typeChart.js';
import { useUI } from '../../contexts/index.js';

/**
 * MovesSection - Display and search moves database
 * Uses UIContext for showDetail
 */
const MovesSection = () => {
    const { showDetail } = useUI();
    const [filter, setFilter] = useState({
        search: '',
        type: '',
        category: '',
        frequency: '',
        sortBy: 'name',
        sortDir: 'asc'
    });

    const filteredMoves = useMemo(() => {
        return Object.entries(GAME_DATA.moves || {})
            .filter(([name, data]) => {
                const searchLower = filter.search.toLowerCase();
                const matchesSearch = !filter.search ||
                    name.toLowerCase().includes(searchLower) ||
                    (data.effect && data.effect.toLowerCase().includes(searchLower)) ||
                    (data.description && data.description.toLowerCase().includes(searchLower));
                const matchesType = !filter.type || data.type === filter.type;
                const matchesCategory = !filter.category || data.category === filter.category;
                const matchesFrequency = !filter.frequency ||
                    (data.frequency && data.frequency.toLowerCase().includes(filter.frequency.toLowerCase()));
                return matchesSearch && matchesType && matchesCategory && matchesFrequency;
            })
            .sort((a, b) => {
                let cmp = 0;
                switch (filter.sortBy) {
                    case 'type':
                        cmp = a[1].type.localeCompare(b[1].type);
                        break;
                    case 'category':
                        cmp = a[1].category.localeCompare(b[1].category);
                        break;
                    case 'damage':
                        const getDamageValue = (d) => {
                            if (!d) return 0;
                            const match = d.match(/(\d+)d(\d+)/);
                            return match ? parseInt(match[1]) * parseInt(match[2]) : 0;
                        };
                        cmp = getDamageValue(b[1].damage) - getDamageValue(a[1].damage);
                        break;
                    default:
                        cmp = a[0].localeCompare(b[0]);
                }
                return filter.sortDir === 'asc' ? cmp : -cmp;
            });
    }, [filter]);

    const totalMoves = Object.keys(GAME_DATA.moves || {}).length;

    return (
        <div>
            <h3 style={{ marginBottom: '15px' }}>Moves Database ({totalMoves} moves)</h3>

            {/* Search and Filters */}
            <div className="section-card" style={{ marginBottom: '15px' }}>
                <div style={{ marginBottom: '12px' }}>
                    <input
                        type="text"
                        placeholder="Search by name, effect, or description..."
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
                        value={filter.type}
                        onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-medium)',
                            fontSize: '13px',
                            background: filter.type ? getTypeColor(filter.type) : 'var(--input-bg)',
                            color: filter.type ? 'white' : 'var(--text-primary)'
                        }}
                    >
                        <option value="">All Types</option>
                        {POKEMON_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>

                    <select
                        value={filter.category}
                        onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '13px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                    >
                        <option value="">All Categories</option>
                        <option value="Physical">Physical (ATK)</option>
                        <option value="Special">Special (SATK)</option>
                        <option value="Status">Status</option>
                    </select>

                    <select
                        value={filter.frequency}
                        onChange={(e) => setFilter(prev => ({ ...prev, frequency: e.target.value }))}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '13px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                    >
                        <option value="">All Frequencies</option>
                        <option value="At-Will">At-Will</option>
                        <option value="EOT">EOT</option>
                        <option value="Battle">Battle</option>
                        <option value="Center">Center</option>
                        <option value="Daily">Daily</option>
                    </select>

                    <select
                        value={filter.sortBy}
                        onChange={(e) => setFilter(prev => ({ ...prev, sortBy: e.target.value }))}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '13px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                    >
                        <option value="name">Sort: Name</option>
                        <option value="type">Sort: Type</option>
                        <option value="category">Sort: Category</option>
                        <option value="damage">Sort: Damage</option>
                    </select>

                    <button
                        onClick={() => setFilter(prev => ({ ...prev, sortDir: prev.sortDir === 'asc' ? 'desc' : 'asc' }))}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}
                    >
                        {filter.sortDir === 'asc' ? ' A-Z' : ' Z-A'}
                    </button>

                    {(filter.search || filter.type || filter.category || filter.frequency) && (
                        <button
                            onClick={() => setFilter({ search: '', type: '', category: '', frequency: '', sortBy: 'name', sortDir: 'asc' })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', background: '#dc3545', color: 'white', cursor: 'pointer', fontSize: '13px' }}
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Type Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '15px' }}>
                {POKEMON_TYPES.map(type => (
                    <button
                        key={type}
                        onClick={() => setFilter(prev => ({ ...prev, type: prev.type === type ? '' : type }))}
                        style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: filter.type === type ? '2px solid var(--moves-type-btn-border)' : '1px solid transparent',
                            background: getTypeColor(type),
                            color: ['Electric', 'Ice', 'Ground', 'Steel'].includes(type) ? '#333' : 'white',
                            cursor: 'pointer',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            opacity: filter.type && filter.type !== type ? 0.5 : 1
                        }}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Results Count */}
            <div style={{ marginBottom: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
                Showing {filteredMoves.length} of {totalMoves} moves
            </div>

            {/* Moves List */}
            <div style={{ maxHeight: '550px', overflowY: 'auto' }}>
                {filteredMoves.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--moves-empty-text)' }}>
                        No moves found matching your filters.
                    </div>
                ) : (
                    filteredMoves.map(([move, data]) => (
                        <div
                            key={move}
                            style={{
                                marginBottom: '10px',
                                padding: '12px',
                                background: 'var(--moves-card-bg)',
                                borderRadius: '8px',
                                borderLeft: `4px solid ${getTypeColor(data.type)}`,
                                boxShadow: '0 1px 3px var(--moves-card-shadow)',
                                cursor: 'pointer'
                            }}
                            onClick={() => showDetail && showDetail('move', move, data)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{move}</strong>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        background: getTypeColor(data.type),
                                        color: ['Electric', 'Ice', 'Ground', 'Steel'].includes(data.type) ? '#333' : 'white'
                                    }}>
                                        {data.type}
                                    </span>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontSize: '10px',
                                        background: data.category === 'Physical' ? 'var(--moves-category-physical-bg)' : data.category === 'Special' ? 'var(--moves-category-special-bg)' : 'var(--moves-category-status-bg)',
                                        color: data.category === 'Physical' ? 'var(--moves-category-physical-text)' : data.category === 'Special' ? 'var(--moves-category-special-text)' : 'var(--moves-category-status-text)'
                                    }}>
                                        {data.category}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    {data.damage && (
                                        <span style={{ fontWeight: 'bold', color: 'var(--moves-damage-text)' }}>
                                            {data.damage}
                                        </span>
                                    )}
                                    <span style={{ color: 'var(--moves-frequency-text)' }}>{data.frequency}</span>
                                </div>
                            </div>
                            {data.range && (
                                <div style={{ fontSize: '11px', color: 'var(--moves-range-text)', marginTop: '4px' }}>
                                    {data.range}
                                </div>
                            )}
                            {data.effect && (
                                <div style={{ fontSize: '12px', color: 'var(--moves-effect-text)', marginTop: '6px', lineHeight: '1.4' }}>
                                    {data.effect.length > 150 ? data.effect.substring(0, 150) + '...' : data.effect}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MovesSection;
