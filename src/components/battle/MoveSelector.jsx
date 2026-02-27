import React from 'react';
import { getTypeColor } from '../../utils/typeUtils.js';

const parseACFromFrequency = (freq) => {
    if (!freq) return 2;
    const match = freq.match(/[-–]\s*(\d+)/);
    return match ? parseInt(match[1]) : 2;
};

const MoveSelector = ({ selectedPokemon, selectedMove, onSelectMove, showDetail, gameData }) => {
    if (!selectedPokemon) return null;

    return (
        <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                Select Move
            </label>
            <div style={{ display: 'grid', gap: '6px' }}>
                {(selectedPokemon.moves || []).map((move, idx) => (
                    <div
                        key={idx}
                        style={{ display: 'flex', alignItems: 'stretch', border: `2px solid ${getTypeColor(move.type)}`, borderRadius: '6px', overflow: 'hidden' }}
                    >
                        <button
                            onClick={() => {
                                const gd = gameData?.moves?.[move.name] || {};
                                const full = { ...gd };
                                Object.entries(move).forEach(([k, v]) => { if (v !== '' && v != null) full[k] = v; });
                                onSelectMove(full);
                            }}
                            className={selectedMove?.name !== move.name ? 'move-select-btn' : ''}
                            style={{
                                flex: 1, padding: '10px',
                                background: selectedMove?.name === move.name ? getTypeColor(move.type) : undefined,
                                color: selectedMove?.name === move.name ? 'white' : undefined,
                                border: 'none', cursor: 'pointer', textAlign: 'left'
                            }}
                        >
                            <div style={{ fontWeight: 'bold' }}>{move.name}</div>
                            <div style={{ fontSize: '11px', opacity: 0.8 }}>
                                {move.type} | {move.category || gameData?.moves?.[move.name]?.category || '—'} | {move.damage || gameData?.moves?.[move.name]?.damage || 'Status'} |{' '}
                                <span title="Accuracy Class - Roll 1d20, need to meet or beat this number to hit. Natural 20 always hits and crits.">
                                    AC {parseACFromFrequency(move.frequency || move.freq)}
                                </span>
                            </div>
                        </button>
                        <button
                            onClick={() => showDetail && showDetail('move', move.name, { ...gameData?.moves?.[move.name], ...move })}
                            style={{ padding: '0 12px', background: getTypeColor(move.type), color: 'white', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                            title="View move details"
                            aria-label={`View details for ${move.name}`}
                        >
                            ℹ
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MoveSelector;
