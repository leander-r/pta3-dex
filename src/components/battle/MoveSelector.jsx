import React from 'react';
import { getTypeColor, getContrastTextColor } from '../../utils/typeUtils.js';

// PTA3: accuracy is checked against the target's stat value (DEF/SDEF/SPD), not a fixed AC.
const accTargetLabel = (category) =>
    category === 'Physical' ? 'vs DEF' : category === 'Status' ? 'vs SPD' : 'vs SDEF';

const MoveSelector = ({ selectedPokemon, moves, selectedMove, onSelectMove, showDetail, gameData, isDynamaxed }) => {
    if (!selectedPokemon) return null;

    const displayMoves = moves || selectedPokemon?.moves || [];

    return (
        <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>
                    Select Move
                </label>
                {isDynamaxed && (
                    <span style={{
                        fontSize: '10px', fontWeight: 'bold', padding: '1px 7px', borderRadius: '8px',
                        background: 'linear-gradient(135deg, #7b1fa2, #9b27af)', color: 'white', letterSpacing: '0.5px'
                    }}>
                        DYNAMAXED
                    </span>
                )}
            </div>
            <div style={{ display: 'grid', gap: '6px' }}>
                {displayMoves.length === 0 && (
                    <div className="text-muted" style={{ textAlign: 'center', padding: '12px', fontSize: '13px' }}>
                        No moves learned yet
                    </div>
                )}
                {displayMoves.map((move, idx) => {
                    const typeColor = getTypeColor(move.type);
                    const isSelected = selectedMove?.name === move.name;
                    const borderColor = isDynamaxed ? '#9b27af' : typeColor;
                    const category = move.category || gameData?.moves?.[move.name]?.category;
                    const damage = move.damage || gameData?.moves?.[move.name]?.damage;

                    return (
                        <div
                            key={idx}
                            style={{
                                display: 'flex', alignItems: 'stretch',
                                border: `2px solid ${borderColor}`,
                                borderRadius: '6px', overflow: 'hidden',
                                boxShadow: isDynamaxed ? `0 0 6px ${borderColor}55` : undefined
                            }}
                        >
                            <button
                                onClick={() => {
                                    if (move.isMaxMove) { onSelectMove(move); return; }
                                    const gd = gameData?.moves?.[move.name] || {};
                                    const full = { ...gd };
                                    Object.entries(move).forEach(([k, v]) => { if (v !== '' && v != null) full[k] = v; });
                                    onSelectMove(full);
                                }}
                                className={!isSelected ? 'move-select-btn' : ''}
                                style={{
                                    flex: 1, padding: '10px',
                                    background: isSelected ? (isDynamaxed ? 'linear-gradient(135deg, #7b1fa2, #9b27af)' : typeColor) : undefined,
                                    color: isSelected ? 'white' : undefined,
                                    border: 'none', cursor: 'pointer', textAlign: 'left'
                                }}
                            >
                                <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {move.name}
                                    {isDynamaxed && (
                                        <span style={{
                                            fontSize: '9px', fontWeight: 'bold', padding: '1px 5px', borderRadius: '5px',
                                            background: isSelected ? 'rgba(255,255,255,0.25)' : '#7b1fa244',
                                            color: isSelected ? 'white' : '#9b27af', letterSpacing: '0.5px'
                                        }}>
                                            {move.isMaxGuard ? 'GUARD' : 'MAX'}
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                                    {move.type} | {category || '—'} |{' '}
                                    {move.isMaxGuard ? 'No Damage' : (damage || 'Status')}
                                    {!move.isMaxMove && (
                                        <span title="PTA3: Roll 1d20 + accuracy bonus against the target's stat value.">
                                            {' '}| {accTargetLabel(category)}
                                        </span>
                                    )}
                                    {move.isMaxMove && !move.isMaxGuard && (
                                        <span style={{ opacity: 0.7 }}> | At-Will, always hits</span>
                                    )}
                                </div>
                            </button>
                            {!move.isMaxMove && (
                                <button
                                    onClick={() => showDetail && showDetail('move', move.name, { ...gameData?.moves?.[move.name], ...move })}
                                    style={{ padding: '0 12px', background: typeColor, color: getContrastTextColor(typeColor), border: 'none', cursor: 'pointer', fontSize: '14px' }}
                                    title="View move details"
                                    aria-label={`View details for ${move.name}`}
                                >
                                    ℹ
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MoveSelector;
