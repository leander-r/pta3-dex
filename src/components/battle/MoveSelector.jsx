import React from 'react';
import { getTypeColor, getContrastTextColor } from '../../utils/typeUtils.js';

// PTA3: accuracy is checked against the target's stat value (DEF/SDEF/SPD), not a fixed AC.
const accTargetLabel = (category) =>
    category === 'Physical' ? 'vs DEF' : category === 'Status' ? 'vs SPD' : 'vs SDEF';

const MoveSelector = ({
    selectedPokemon, moves, selectedMove, onSelectMove, showDetail, gameData,
    isDynamaxed, canGigantamax, gMaxMoveUsed,
    onDynamaxActivate, onDynamaxRevert, dynamaxDisabled,
}) => {
    if (!selectedPokemon) return null;

    const displayMoves = moves || selectedPokemon?.moves || [];
    const dynamaxLabel = canGigantamax ? 'Gigantamax' : 'Dynamax';

    return (
        <div style={{ marginBottom: '12px' }}>

            {/* ── Header bar ─────────────────────────────────────────── */}
            {isDynamaxed ? (
                // Active: purple strip with status info + Revert
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 10px', borderRadius: '8px 8px 0 0', marginBottom: '0',
                    background: 'linear-gradient(135deg, #4a0080, #9b27af)',
                    boxShadow: '0 0 8px #9b27af55'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'white', letterSpacing: '0.5px' }}>
                            {canGigantamax ? 'GIGANTAMAX' : 'DYNAMAX'} ACTIVE
                        </span>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', display: 'flex', gap: '8px' }}>
                            <span>HP ×5</span><span>·</span><span>10ft/turn</span><span>·</span><span>1 min</span>
                        </span>
                    </div>
                    <button
                        onClick={onDynamaxRevert}
                        style={{
                            padding: '3px 10px', fontSize: '12px', fontWeight: 'bold',
                            background: 'rgba(255,255,255,0.15)', color: 'white',
                            border: '1px solid rgba(255,255,255,0.3)', borderRadius: '5px', cursor: 'pointer'
                        }}
                    >
                        Revert
                    </button>
                </div>
            ) : (
                // Inactive: "Select Move" label + Dynamax button
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Select Move</label>
                    <button
                        onClick={onDynamaxActivate}
                        disabled={dynamaxDisabled}
                        style={{
                            padding: '3px 10px', fontSize: '12px', fontWeight: 'bold',
                            background: dynamaxDisabled ? 'var(--bg-light, #eee)' : 'linear-gradient(135deg, #7b1fa2, #9b27af)',
                            color: dynamaxDisabled ? 'var(--text-muted)' : 'white',
                            border: 'none', borderRadius: '5px',
                            cursor: dynamaxDisabled ? 'not-allowed' : 'pointer',
                            opacity: dynamaxDisabled ? 0.5 : 1
                        }}
                        title={dynamaxDisabled ? 'Another mechanic is active' : `${dynamaxLabel} this Pokémon`}
                    >
                        {dynamaxLabel}!
                    </button>
                </div>
            )}

            {/* ── Move list ──────────────────────────────────────────── */}
            <div style={{
                display: 'grid', gap: '6px',
                border: isDynamaxed ? '2px solid #9b27af' : undefined,
                borderTop: 'none',
                borderRadius: isDynamaxed ? '0 0 8px 8px' : undefined,
                padding: isDynamaxed ? '8px' : undefined,
                boxShadow: isDynamaxed ? '0 0 8px #9b27af33' : undefined,
            }}>
                {displayMoves.length === 0 && (
                    <div className="text-muted" style={{ textAlign: 'center', padding: '12px', fontSize: '13px' }}>
                        No moves learned yet
                    </div>
                )}
                {displayMoves.map((move, idx) => {
                    const typeColor = getTypeColor(move.type);
                    const isSelected = selectedMove?.name === move.name;
                    const isGMax = move.isGMaxMove;
                    const isUsed = isGMax && gMaxMoveUsed;
                    const borderColor = isGMax ? '#ffd700' : isDynamaxed ? '#9b27af' : typeColor;
                    const category = move.category || gameData?.moves?.[move.name]?.category;
                    const damage = move.damage || gameData?.moves?.[move.name]?.damage;

                    return (
                        <div
                            key={idx}
                            style={{
                                display: 'flex', alignItems: 'stretch',
                                border: `2px solid ${isUsed ? '#88888866' : borderColor}`,
                                borderRadius: '6px', overflow: 'hidden',
                                opacity: isUsed ? 0.55 : 1,
                                boxShadow: isGMax && !isUsed ? `0 0 8px #ffd70066` : isDynamaxed && !isGMax ? `0 0 4px ${borderColor}44` : undefined,
                            }}
                        >
                            <button
                                onClick={() => {
                                    if (isUsed) return;
                                    if (move.isMaxMove || move.isGMaxMove) { onSelectMove(move); return; }
                                    const gd = gameData?.moves?.[move.name] || {};
                                    const full = { ...gd };
                                    Object.entries(move).forEach(([k, v]) => { if (v !== '' && v != null) full[k] = v; });
                                    onSelectMove(full);
                                }}
                                className={!isSelected && !isUsed ? 'move-select-btn' : ''}
                                style={{
                                    flex: 1, padding: '10px',
                                    background: isSelected
                                        ? (isGMax ? 'linear-gradient(135deg, #b8860b, #ffd700)' : isDynamaxed ? 'linear-gradient(135deg, #4a0080, #9b27af)' : typeColor)
                                        : undefined,
                                    color: isSelected ? (isGMax ? '#1a1a00' : 'white') : undefined,
                                    border: 'none', cursor: isUsed ? 'not-allowed' : 'pointer', textAlign: 'left'
                                }}
                            >
                                <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {move.name}
                                    {isGMax && (
                                        <span style={{
                                            fontSize: '9px', fontWeight: 'bold', padding: '1px 5px', borderRadius: '5px',
                                            background: isSelected ? 'rgba(0,0,0,0.2)' : '#ffd70033',
                                            color: isSelected ? '#1a1a00' : '#b8860b', letterSpacing: '0.5px'
                                        }}>
                                            {isUsed ? 'G-MAX USED' : 'G-MAX ★'}
                                        </span>
                                    )}
                                    {isDynamaxed && !isGMax && (
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
                                    {!move.isMaxMove && !isGMax && (
                                        <span title="PTA3: Roll 1d20 + accuracy bonus against the target's stat value.">
                                            {' '}| {accTargetLabel(category)}
                                        </span>
                                    )}
                                    {(move.isMaxMove && !move.isMaxGuard) || isGMax ? (
                                        <span style={{ opacity: 0.7 }}> | At-Will, always hits</span>
                                    ) : null}
                                </div>
                            </button>
                            {!move.isMaxMove && !isGMax && (
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
