// ============================================================
// Natures Section Component
// ============================================================

import React, { useState, useMemo } from 'react';
import { GAME_DATA } from '../../data/configs.js';

const STAT_OPTIONS = ['', 'hp', 'atk', 'def', 'satk', 'sdef', 'spd'];
const STAT_LABELS = { '': 'All', 'hp': 'HP', 'atk': 'ATK', 'def': 'DEF', 'satk': 'SATK', 'sdef': 'SDEF', 'spd': 'SPD' };

const NaturesSection = () => {
    const [filter, setFilter] = useState({
        search: '',
        buffStat: '',
        nerfStat: '',
        sortBy: 'name',
        sortDir: 'asc'
    });

    const totalNatures = Object.keys(GAME_DATA.natures || {}).length;

    const filteredNatures = useMemo(() => {
        let entries = Object.entries(GAME_DATA.natures || {});

        // Search filter
        if (filter.search) {
            const query = filter.search.toLowerCase();
            entries = entries.filter(([name, data]) =>
                name.toLowerCase().includes(query) ||
                (data.buff || '').toLowerCase().includes(query) ||
                (data.nerf || '').toLowerCase().includes(query) ||
                (data.likedFlavor || '').toLowerCase().includes(query) ||
                (data.dislikedFlavor || '').toLowerCase().includes(query)
            );
        }

        // Buff stat filter
        if (filter.buffStat) {
            entries = entries.filter(([_, data]) =>
                data.buff === filter.buffStat
            );
        }

        // Nerf stat filter
        if (filter.nerfStat) {
            entries = entries.filter(([_, data]) =>
                data.nerf === filter.nerfStat
            );
        }

        // Sorting
        entries.sort((a, b) => {
            let cmp = 0;
            switch (filter.sortBy) {
                case 'buff':
                    cmp = (a[1].buff || 'zzz').localeCompare(b[1].buff || 'zzz');
                    break;
                case 'nerf':
                    cmp = (a[1].nerf || 'zzz').localeCompare(b[1].nerf || 'zzz');
                    break;
                default:
                    cmp = a[0].localeCompare(b[0]);
            }
            return filter.sortDir === 'asc' ? cmp : -cmp;
        });

        return entries;
    }, [filter]);

    const quickStats = ['atk', 'def', 'satk', 'sdef', 'spd'];

    return (
        <div>
            <h3>Nature Effects ({totalNatures} Natures)</h3>
            <p style={{ marginBottom: '15px', fontSize: '13px', color: 'var(--text-muted)' }}>
                Natures modify base stats by +1/-1. HP modifications are always just +1 or -1 to the HP Base Stat.
            </p>

            {/* Search and Filters */}
            <div className="section-card" style={{ marginBottom: '15px' }}>
                <div style={{ marginBottom: '12px' }}>
                    <input
                        type="text"
                        placeholder="Search by name, stat, or flavor..."
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
                        value={filter.buffStat}
                        onChange={(e) => setFilter(prev => ({ ...prev, buffStat: e.target.value }))}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-medium)',
                            fontSize: '13px',
                            background: filter.buffStat ? '#4caf50' : 'var(--input-bg)',
                            color: filter.buffStat ? 'white' : 'var(--text-primary)'
                        }}
                    >
                        {STAT_OPTIONS.map(stat => (
                            <option key={stat} value={stat}>Raises: {STAT_LABELS[stat]}</option>
                        ))}
                    </select>

                    <select
                        value={filter.nerfStat}
                        onChange={(e) => setFilter(prev => ({ ...prev, nerfStat: e.target.value }))}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-medium)',
                            fontSize: '13px',
                            background: filter.nerfStat ? '#f44336' : 'var(--input-bg)',
                            color: filter.nerfStat ? 'white' : 'var(--text-primary)'
                        }}
                    >
                        {STAT_OPTIONS.map(stat => (
                            <option key={stat} value={stat}>Lowers: {STAT_LABELS[stat]}</option>
                        ))}
                    </select>

                    <select
                        value={filter.sortBy}
                        onChange={(e) => setFilter(prev => ({ ...prev, sortBy: e.target.value }))}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '13px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                    >
                        <option value="name">Sort: Name</option>
                        <option value="buff">Sort: Raises</option>
                        <option value="nerf">Sort: Lowers</option>
                    </select>

                    <button
                        onClick={() => setFilter(prev => ({ ...prev, sortDir: prev.sortDir === 'asc' ? 'desc' : 'asc' }))}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}
                    >
                        {filter.sortDir === 'asc' ? ' A-Z' : ' Z-A'}
                    </button>

                    {(filter.search || filter.buffStat || filter.nerfStat) && (
                        <button
                            onClick={() => setFilter({ search: '', buffStat: '', nerfStat: '', sortBy: 'name', sortDir: 'asc' })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', background: '#dc3545', color: 'white', cursor: 'pointer', fontSize: '13px' }}
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* Quick Stat Buttons */}
                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '4px' }}>Quick +Stat:</span>
                    {quickStats.map(stat => (
                        <button
                            key={stat}
                            onClick={() => setFilter(prev => ({ ...prev, buffStat: prev.buffStat === stat ? '' : stat }))}
                            style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                border: filter.buffStat === stat ? '2px solid #4caf50' : '1px solid var(--border-medium)',
                                background: filter.buffStat === stat ? '#4caf50' : 'var(--input-bg)',
                                color: filter.buffStat === stat ? 'white' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: 'bold'
                            }}
                        >
                            +{stat.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results Count */}
            <div style={{ marginBottom: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
                Showing {filteredNatures.length} of {totalNatures} natures
            </div>

            <div style={{ overflowX: 'auto' }}>
                {filteredNatures.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No natures found matching your filters.
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: 'var(--color-purple)', color: 'white' }}>
                                <th style={{ padding: '10px', textAlign: 'left' }}>Nature</th>
                                <th style={{ padding: '10px', textAlign: 'center' }}>Raises</th>
                                <th style={{ padding: '10px', textAlign: 'center' }}>Lowers</th>
                                <th style={{ padding: '10px', textAlign: 'center' }}>Likes</th>
                                <th style={{ padding: '10px', textAlign: 'center' }}>Dislikes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredNatures.map(([nature, data], index) => (
                                <tr key={nature} style={{ background: index % 2 === 0 ? 'var(--bg-light)' : 'var(--input-bg)' }}>
                                    <td style={{ padding: '8px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{nature}</td>
                                    <td style={{ padding: '8px', textAlign: 'center', color: '#4caf50', fontWeight: 'bold' }}>
                                        {data.buff ? data.buff.toUpperCase() : '—'}
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'center', color: '#f44336', fontWeight: 'bold' }}>
                                        {data.nerf ? data.nerf.toUpperCase() : '—'}
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        {data.likedFlavor || 'None'}
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        {data.dislikedFlavor || 'None'}
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

export default NaturesSection;
