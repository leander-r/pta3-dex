// ============================================================
// Abilities Section Component
// ============================================================

import React, { useState, useMemo } from 'react';
import { GAME_DATA } from '../../data/configs.js';

const AbilitiesSection = ({ showDetail }) => {
    const [filter, setFilter] = useState({
        search: '',
        sortDir: 'asc'
    });

    const filteredAbilities = useMemo(() => {
        return Object.entries(GAME_DATA.abilities || {})
            .filter(([name, desc]) => {
                const searchLower = filter.search.toLowerCase();
                return !filter.search ||
                    name.toLowerCase().includes(searchLower) ||
                    desc.toLowerCase().includes(searchLower);
            })
            .sort((a, b) => {
                const cmp = a[0].localeCompare(b[0]);
                return filter.sortDir === 'asc' ? cmp : -cmp;
            });
    }, [filter]);

    const totalAbilities = Object.keys(GAME_DATA.abilities || {}).length;

    const quickTerms = ['weather', 'contact', 'stat', 'damage', 'STAB', 'immunity', 'heal', 'status'];

    return (
        <div>
            <h3 style={{ marginBottom: '15px' }}>Abilities Database ({totalAbilities} abilities)</h3>

            {/* Search and Filters */}
            <div className="section-card" style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Search abilities by name or effect..."
                        value={filter.search}
                        onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                        style={{
                            flex: '1',
                            minWidth: '200px',
                            padding: '10px 15px',
                            borderRadius: '8px',
                            border: '2px solid var(--border-medium)',
                            fontSize: '14px',
                            background: 'var(--input-bg)',
                            color: 'var(--text-primary)'
                        }}
                    />

                    <button
                        onClick={() => setFilter(prev => ({ ...prev, sortDir: prev.sortDir === 'asc' ? 'desc' : 'asc' }))}
                        style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}
                    >
                        {filter.sortDir === 'asc' ? ' A-Z' : ' Z-A'}
                    </button>

                    {filter.search && (
                        <button
                            onClick={() => setFilter({ search: '', sortDir: 'asc' })}
                            style={{ padding: '10px 15px', borderRadius: '8px', border: 'none', background: '#dc3545', color: 'white', cursor: 'pointer', fontSize: '13px' }}
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* Quick Search */}
                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '4px' }}>Quick:</span>
                    {quickTerms.map(term => (
                        <button
                            key={term}
                            onClick={() => setFilter(prev => ({ ...prev, search: prev.search === term ? '' : term }))}
                            style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                border: filter.search === term ? '2px solid var(--abilities-quick-btn-active-border)' : '1px solid var(--abilities-quick-btn-border)',
                                background: filter.search === term ? 'var(--abilities-quick-btn-active-bg)' : 'var(--abilities-quick-btn-bg)',
                                color: filter.search === term ? 'var(--abilities-quick-btn-active-text)' : 'var(--abilities-quick-btn-text)',
                                cursor: 'pointer',
                                fontSize: '11px'
                            }}
                        >
                            {term}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results Count */}
            <div style={{ marginBottom: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
                Showing {filteredAbilities.length} of {totalAbilities} abilities
            </div>

            {/* Abilities List */}
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {filteredAbilities.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--abilities-empty-text)' }}>
                        No abilities found matching your search.
                    </div>
                ) : (
                    filteredAbilities.map(([name, desc]) => (
                        <div
                            key={name}
                            style={{
                                marginBottom: '8px',
                                padding: '12px',
                                background: 'var(--abilities-card-bg)',
                                borderRadius: '8px',
                                borderLeft: '4px solid var(--abilities-card-border)',
                                boxShadow: '0 1px 3px var(--abilities-card-shadow)',
                                cursor: showDetail ? 'pointer' : 'default'
                            }}
                            onClick={() => showDetail && showDetail('ability', name, desc)}
                        >
                            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px', color: 'var(--abilities-name-text)' }}>
                                {name}
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--abilities-desc-text)', lineHeight: '1.4' }}>
                                {desc}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AbilitiesSection;
