// ============================================================
// Bulk EXP Award Modal Component
// ============================================================
// Modal for awarding EXP to multiple party Pokemon at once

import React, { useState, useMemo } from 'react';
import useModalKeyboard from '../../hooks/useModalKeyboard.js';
import { useUI, usePokemonContext } from '../../contexts/index.js';
import { useTrainerContext } from '../../contexts/TrainerContext.jsx';
import { calculatePokemonLevel } from '../../utils/dataUtils.js';
import { getTypeColor } from '../../utils/typeUtils.js';

const BulkExpModal = () => {
    const { showBulkExpModal, setShowBulkExpModal } = useUI();
    const { party } = useTrainerContext();
    const { updatePokemon } = usePokemonContext();

    const [selectedIds, setSelectedIds] = useState(new Set());
    const [expAmount, setExpAmount] = useState(100);
    const [results, setResults] = useState([]);

    const handleClose = () => {
        setShowBulkExpModal(false);
        setSelectedIds(new Set());
        setExpAmount(100);
        setResults([]);
    };

    const { modalRef } = useModalKeyboard(showBulkExpModal, handleClose);

    // Toggle selection for a Pokemon
    const toggleSelection = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Select all party Pokemon
    const selectAll = () => {
        setSelectedIds(new Set(party.map(p => p.id)));
    };

    // Clear selection
    const clearSelection = () => {
        setSelectedIds(new Set());
    };

    // Award EXP to selected Pokemon
    const handleAwardExp = () => {
        if (selectedIds.size === 0 || expAmount <= 0) return;

        const newResults = [];

        selectedIds.forEach(id => {
            const pokemon = party.find(p => p.id === id);
            if (pokemon) {
                const oldLevel = pokemon.level;
                const oldExp = pokemon.exp || 0;
                const newExp = oldExp + expAmount;
                const newLevel = calculatePokemonLevel(newExp);

                // Update the Pokemon
                updatePokemon(id, { exp: newExp });

                newResults.push({
                    id,
                    name: pokemon.name || pokemon.species,
                    oldLevel,
                    newLevel,
                    oldExp,
                    newExp,
                    leveledUp: newLevel > oldLevel
                });
            }
        });

        setResults(newResults);
        setSelectedIds(new Set()); // Clear for next round
    };

    // Calculate preview info
    const previewInfo = useMemo(() => {
        if (selectedIds.size === 0) return null;

        const previews = [];
        selectedIds.forEach(id => {
            const pokemon = party.find(p => p.id === id);
            if (pokemon) {
                const oldLevel = pokemon.level;
                const newExp = (pokemon.exp || 0) + expAmount;
                const newLevel = calculatePokemonLevel(newExp);
                previews.push({
                    name: pokemon.name || pokemon.species,
                    oldLevel,
                    newLevel,
                    willLevelUp: newLevel > oldLevel
                });
            }
        });
        return previews;
    }, [selectedIds, expAmount, party]);

    if (!showBulkExpModal) return null;

    return (
        <div className="modal-overlay" onClick={handleClose} role="presentation">
            <div
                ref={modalRef}
                className="modal"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="bulk-exp-modal-title"
                style={{ maxWidth: '500px', width: '95%' }}
            >
                <div className="modal-header" style={{ background: 'linear-gradient(135deg, #f5a623, #f7b731)' }}>
                    <h3 id="bulk-exp-modal-title" style={{ margin: 0, color: 'white' }}>
                        Award EXP
                    </h3>
                    <button
                        onClick={handleClose}
                        className="modal-close-btn"
                        aria-label="Close modal"
                    >
                        ×
                    </button>
                </div>

                <div className="modal-content" style={{ padding: '20px' }}>
                    {/* Party Pokemon List */}
                    {party.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                            No Pokemon in your party.
                        </div>
                    ) : (
                        <>
                            {/* Selection Controls */}
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                <button
                                    onClick={selectAll}
                                    className="btn btn-secondary"
                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                >
                                    Select All
                                </button>
                                <button
                                    onClick={clearSelection}
                                    className="btn btn-secondary"
                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                    disabled={selectedIds.size === 0}
                                >
                                    Clear
                                </button>
                                <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#666', alignSelf: 'center' }}>
                                    {selectedIds.size} selected
                                </span>
                            </div>

                            {/* Pokemon Checkboxes */}
                            <div style={{
                                border: '1px solid var(--border-medium)',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                marginBottom: '15px'
                            }}>
                                {party.map((pokemon, index) => {
                                    const isSelected = selectedIds.has(pokemon.id);
                                    const primaryType = pokemon.types?.[0] || 'Normal';

                                    return (
                                        <label
                                            key={pokemon.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '10px 12px',
                                                cursor: 'pointer',
                                                borderBottom: index < party.length - 1 ? '1px solid var(--border-light)' : 'none',
                                                background: isSelected ? 'var(--bg-selected, #e3f2fd)' : 'transparent',
                                                transition: 'background 0.15s'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelection(pokemon.id)}
                                                style={{ marginRight: '12px', width: '18px', height: '18px' }}
                                            />
                                            <div style={{
                                                width: '8px',
                                                height: '32px',
                                                borderRadius: '4px',
                                                background: getTypeColor(primaryType),
                                                marginRight: '12px'
                                            }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '600', fontSize: '14px' }}>
                                                    {pokemon.name || pokemon.species}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>
                                                    {pokemon.species !== pokemon.name && pokemon.name ? pokemon.species : ''}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: '600', fontSize: '14px' }}>
                                                    Lv {pokemon.level}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#888' }}>
                                                    {pokemon.exp || 0} EXP
                                                </div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>

                            {/* EXP Input */}
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>
                                    EXP to Award
                                </label>
                                <input
                                    type="number"
                                    value={expAmount}
                                    onChange={(e) => setExpAmount(Math.max(0, parseInt(e.target.value) || 0))}
                                    min="0"
                                    step="50"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        fontSize: '16px',
                                        borderRadius: '8px',
                                        border: '2px solid var(--border-medium)',
                                        background: 'var(--input-bg)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                            </div>

                            {/* Preview */}
                            {previewInfo && previewInfo.length > 0 && expAmount > 0 && (
                                <div style={{
                                    background: 'var(--bg-secondary, #f5f5f5)',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    marginBottom: '15px',
                                    fontSize: '13px'
                                }}>
                                    <div style={{ fontWeight: '600', marginBottom: '8px' }}>Preview:</div>
                                    {previewInfo.map((p, i) => (
                                        <div key={i} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '4px 0',
                                            color: p.willLevelUp ? '#4caf50' : 'inherit'
                                        }}>
                                            <span>{p.name}</span>
                                            <span>
                                                Lv {p.oldLevel} → {p.newLevel}
                                                {p.willLevelUp && ' ⬆️'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Results from last award */}
                            {results.length > 0 && (
                                <div style={{
                                    background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    marginBottom: '15px',
                                    fontSize: '13px',
                                    border: '1px solid #a5d6a7'
                                }}>
                                    <div style={{ fontWeight: '600', marginBottom: '8px', color: '#2e7d32' }}>
                                        EXP Awarded!
                                    </div>
                                    {results.map((r, i) => (
                                        <div key={i} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '4px 0'
                                        }}>
                                            <span>{r.name}</span>
                                            <span style={{ color: r.leveledUp ? '#2e7d32' : '#666' }}>
                                                {r.leveledUp
                                                    ? `Lv ${r.oldLevel} → ${r.newLevel}! 🎉`
                                                    : `+${expAmount} EXP`
                                                }
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Award Button */}
                            <button
                                onClick={handleAwardExp}
                                disabled={selectedIds.size === 0 || expAmount <= 0}
                                className="btn btn-purple"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    fontSize: '15px',
                                    opacity: (selectedIds.size === 0 || expAmount <= 0) ? 0.5 : 1
                                }}
                            >
                                Award {expAmount} EXP to {selectedIds.size} Pokemon
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulkExpModal;
