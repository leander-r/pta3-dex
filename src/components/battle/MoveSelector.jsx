import React from 'react';
import { getTypeColor, getContrastTextColor } from '../../utils/typeUtils.js';

// PTA3: accuracy is checked against the target's stat value (DEF/SDEF/SPD), not a fixed AC.
const accTargetLabel = (category) =>
    category === 'Physical' ? 'vs DEF' : category === 'Status' ? 'vs SPD' : 'vs SDEF';

const MoveSelector = ({
    selectedPokemon, moves, selectedMove, onSelectMove, showDetail, gameData,
    // Dynamax
    isDynamaxed, canGigantamax, gMaxMoveUsed,
    onDynamaxActivate, onDynamaxRevert, dynamaxDisabled,
    // Z-Move
    zMoveActive, zMoveUsed, hasZMoves,
    onZMoveActivate, onZMoveDeactivate, onZMoveReset, zMoveDisabled,
    // Terastallization
    isTerastallized, teraType, teraBlastUsesLeft,
    onTeraActivate, onTeraRevert, teraDisabled,
}) => {
    if (!selectedPokemon) return null;

    const displayMoves = moves || selectedPokemon?.moves || [];
    const dynamaxLabel = canGigantamax ? 'Gigantamax' : 'Dynamax';
    const hasTeraType = !!teraType;

    // ── Active mechanic state ─────────────────────────────────────────────
    const activeMode = isDynamaxed ? 'dynamax' : zMoveActive ? 'zmove' : isTerastallized ? 'tera' : null;

    const teraColor = hasTeraType ? getTypeColor(teraType) : '#9c27b0';
    const teraTextColor = hasTeraType ? getContrastTextColor(teraColor) : 'white';

    return (
        <div style={{ marginBottom: '12px' }}>

            {/* ── Header bar ─────────────────────────────────────────── */}
            {activeMode === 'dynamax' && (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 10px', borderRadius: '8px 8px 0 0',
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
            )}

            {activeMode === 'zmove' && (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 10px', borderRadius: '8px 8px 0 0',
                    background: 'linear-gradient(135deg, #b71c1c, #e53935)',
                    boxShadow: '0 0 8px #e5393555'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'white', letterSpacing: '0.5px' }}>
                            Z-MOVE READY
                        </span>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', display: 'flex', gap: '8px' }}>
                            <span>8d12 dmg</span><span>·</span><span>Always hits</span><span>·</span>
                            <span style={{ color: zMoveUsed ? '#ffcdd2' : 'rgba(255,255,255,0.75)' }}>
                                {zMoveUsed ? '✓ Used' : '1/day'}
                            </span>
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {zMoveUsed && (
                            <button
                                onClick={onZMoveReset}
                                style={{
                                    padding: '3px 10px', fontSize: '12px', fontWeight: 'bold',
                                    background: 'rgba(255,255,255,0.15)', color: 'white',
                                    border: '1px solid rgba(255,255,255,0.3)', borderRadius: '5px', cursor: 'pointer'
                                }}
                            >
                                Reset
                            </button>
                        )}
                        <button
                            onClick={onZMoveDeactivate}
                            style={{
                                padding: '3px 10px', fontSize: '12px', fontWeight: 'bold',
                                background: 'rgba(255,255,255,0.15)', color: 'white',
                                border: '1px solid rgba(255,255,255,0.3)', borderRadius: '5px', cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {activeMode === 'tera' && (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 10px', borderRadius: '8px 8px 0 0',
                    background: `linear-gradient(135deg, ${teraColor}dd, ${teraColor})`,
                    boxShadow: `0 0 8px ${teraColor}55`
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: teraTextColor, letterSpacing: '0.5px' }}>
                            TERASTALLIZED
                        </span>
                        <span style={{
                            fontSize: '11px', padding: '1px 8px', borderRadius: '10px',
                            background: 'rgba(255,255,255,0.25)', color: teraTextColor, fontWeight: 'bold'
                        }}>
                            {teraType} Type
                        </span>
                        <span style={{ fontSize: '11px', color: `${teraTextColor}cc`, display: 'flex', gap: '8px' }}>
                            <span>DEF +3</span><span>·</span><span>SDEF +3</span><span>·</span><span>10 min</span>
                        </span>
                    </div>
                    <button
                        onClick={onTeraRevert}
                        style={{
                            padding: '3px 10px', fontSize: '12px', fontWeight: 'bold',
                            background: 'rgba(255,255,255,0.2)', color: teraTextColor,
                            border: `1px solid ${teraTextColor}55`, borderRadius: '5px', cursor: 'pointer'
                        }}
                    >
                        Revert
                    </button>
                </div>
            )}

            {/* Inactive: "Select Move" label + mechanic buttons */}
            {!activeMode && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Select Move</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {hasZMoves && (
                            <button
                                onClick={onZMoveActivate}
                                disabled={zMoveDisabled}
                                style={{
                                    padding: '3px 8px', fontSize: '12px', fontWeight: 'bold',
                                    background: zMoveDisabled ? 'var(--bg-light, #eee)' : 'linear-gradient(135deg, #b71c1c, #e53935)',
                                    color: zMoveDisabled ? 'var(--text-muted)' : 'white',
                                    border: 'none', borderRadius: '5px',
                                    cursor: zMoveDisabled ? 'not-allowed' : 'pointer',
                                    opacity: zMoveDisabled ? 0.5 : 1
                                }}
                                title={zMoveDisabled ? 'Another mechanic is active' : 'Use a Z-Move (1/day, 8d12)'}
                            >
                                Z-Move!
                            </button>
                        )}
                        {hasTeraType && (
                            <button
                                onClick={onTeraActivate}
                                disabled={teraDisabled}
                                style={{
                                    padding: '3px 8px', fontSize: '12px', fontWeight: 'bold',
                                    background: teraDisabled ? 'var(--bg-light, #eee)' : `linear-gradient(135deg, ${teraColor}cc, ${teraColor})`,
                                    color: teraDisabled ? 'var(--text-muted)' : teraTextColor,
                                    border: 'none', borderRadius: '5px',
                                    cursor: teraDisabled ? 'not-allowed' : 'pointer',
                                    opacity: teraDisabled ? 0.5 : 1
                                }}
                                title={teraDisabled ? 'Another mechanic is active' : `Terastallize into ${teraType} type`}
                            >
                                Tera!
                            </button>
                        )}
                        <button
                            onClick={onDynamaxActivate}
                            disabled={dynamaxDisabled}
                            style={{
                                padding: '3px 8px', fontSize: '12px', fontWeight: 'bold',
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
                </div>
            )}

            {/* ── Move list ──────────────────────────────────────────── */}
            <div style={{
                display: 'grid', gap: '6px',
                border: activeMode === 'dynamax' ? '2px solid #9b27af'
                    : activeMode === 'zmove' ? '2px solid #e53935'
                    : activeMode === 'tera' ? `2px solid ${teraColor}`
                    : undefined,
                borderTop: 'none',
                borderRadius: activeMode ? '0 0 8px 8px' : undefined,
                padding: activeMode ? '8px' : undefined,
                boxShadow: activeMode === 'dynamax' ? '0 0 8px #9b27af33'
                    : activeMode === 'zmove' ? '0 0 8px #e5393533'
                    : activeMode === 'tera' ? `0 0 8px ${teraColor}33`
                    : undefined,
            }}>
                {displayMoves.length === 0 && (
                    <div className="text-muted" style={{ textAlign: 'center', padding: '12px', fontSize: '13px' }}>
                        No moves learned yet
                    </div>
                )}
                {displayMoves.map((move, idx) => {
                    const typeColor = getTypeColor(move.type);
                    const isSelected = selectedMove?.name === move.name;

                    // Special move flags
                    const isGMax = move.isGMaxMove;
                    const isZMove = move.isZMove;
                    const isTeraBlast = move.isTeraBlast;
                    const isTeraCrown = move.isTeraCrown;
                    const isTeraMove = move.isTeraMove;

                    const isGMaxUsed = isGMax && gMaxMoveUsed;
                    const isZMoveUsed = isZMove && zMoveUsed;
                    const isTeraBlastExhausted = isTeraBlast && teraBlastUsesLeft <= 0;
                    const isUsed = isGMaxUsed || isZMoveUsed || isTeraBlastExhausted;

                    // Border color
                    const borderColor = isGMax ? '#ffd700'
                        : isZMove ? '#ef5350'
                        : isTeraMove ? teraColor
                        : isDynamaxed ? '#9b27af'
                        : typeColor;

                    const category = move.category || gameData?.moves?.[move.name]?.category;
                    const damage = move.damage || gameData?.moves?.[move.name]?.damage;

                    // Background when selected
                    const selectedBg = isGMax ? 'linear-gradient(135deg, #b8860b, #ffd700)'
                        : isZMove ? 'linear-gradient(135deg, #b71c1c, #e53935)'
                        : isTeraMove ? `linear-gradient(135deg, ${teraColor}cc, ${teraColor})`
                        : isDynamaxed ? 'linear-gradient(135deg, #4a0080, #9b27af)'
                        : typeColor;
                    const selectedFg = isGMax ? '#1a1a00' : isTeraMove ? teraTextColor : 'white';

                    // Badge
                    const badge = isGMax
                        ? <span style={{ fontSize: '9px', fontWeight: 'bold', padding: '1px 5px', borderRadius: '5px', background: isSelected ? 'rgba(0,0,0,0.2)' : '#ffd70033', color: isSelected ? '#1a1a00' : '#b8860b', letterSpacing: '0.5px' }}>
                            {isGMaxUsed ? 'G-MAX USED' : 'G-MAX ★'}
                          </span>
                        : isZMove
                        ? <span style={{ fontSize: '9px', fontWeight: 'bold', padding: '1px 5px', borderRadius: '5px', background: isSelected ? 'rgba(255,255,255,0.2)' : '#ef535033', color: isSelected ? 'white' : '#ef5350', letterSpacing: '0.5px' }}>
                            {isZMoveUsed ? 'Z-USED' : move.isUniqueZ ? 'Z-★' : 'Z-MOVE'}
                          </span>
                        : isTeraBlast
                        ? <span style={{ fontSize: '9px', fontWeight: 'bold', padding: '1px 5px', borderRadius: '5px', background: isSelected ? 'rgba(255,255,255,0.25)' : `${teraColor}33`, color: isSelected ? teraTextColor : teraColor, letterSpacing: '0.5px' }}>
                            TERA BLAST {teraBlastUsesLeft}/3
                          </span>
                        : isTeraCrown
                        ? <span style={{ fontSize: '9px', fontWeight: 'bold', padding: '1px 5px', borderRadius: '5px', background: isSelected ? 'rgba(255,255,255,0.25)' : `${teraColor}33`, color: isSelected ? teraTextColor : teraColor, letterSpacing: '0.5px' }}>
                            TERA ★
                          </span>
                        : isDynamaxed && !isGMax
                        ? <span style={{ fontSize: '9px', fontWeight: 'bold', padding: '1px 5px', borderRadius: '5px', background: isSelected ? 'rgba(255,255,255,0.25)' : '#7b1fa244', color: isSelected ? 'white' : '#9b27af', letterSpacing: '0.5px' }}>
                            {move.isMaxGuard ? 'GUARD' : 'MAX'}
                          </span>
                        : null;

                    return (
                        <div
                            key={idx}
                            style={{
                                display: 'flex', alignItems: 'stretch',
                                border: `2px solid ${isUsed ? '#88888866' : borderColor}`,
                                borderRadius: '6px', overflow: 'hidden',
                                opacity: isUsed ? 0.55 : 1,
                                boxShadow: isGMax && !isGMaxUsed ? `0 0 8px #ffd70066`
                                    : isZMove && !isZMoveUsed ? `0 0 6px #ef535044`
                                    : isTeraMove && !isTeraBlastExhausted ? `0 0 6px ${teraColor}44`
                                    : isDynamaxed && !isGMax ? `0 0 4px ${borderColor}44`
                                    : undefined,
                            }}
                        >
                            <button
                                onClick={() => {
                                    if (isUsed) return;
                                    if (move.isMaxMove || move.isGMaxMove || move.isZMove || move.isTeraMove) { onSelectMove(move); return; }
                                    const gd = gameData?.moves?.[move.name] || {};
                                    const full = { ...gd };
                                    Object.entries(move).forEach(([k, v]) => { if (v !== '' && v != null) full[k] = v; });
                                    onSelectMove(full);
                                }}
                                className={!isSelected && !isUsed ? 'move-select-btn' : ''}
                                style={{
                                    flex: 1, padding: '10px',
                                    background: isSelected ? selectedBg : undefined,
                                    color: isSelected ? selectedFg : undefined,
                                    border: 'none', cursor: isUsed ? 'not-allowed' : 'pointer', textAlign: 'left'
                                }}
                            >
                                <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {move.name}
                                    {badge}
                                </div>
                                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                                    {move.type} | {category || '—'} |{' '}
                                    {move.isMaxGuard ? 'No Damage' : (damage || 'Status')}
                                    {!move.isMaxMove && !isGMax && !isZMove && !isTeraMove && (
                                        <span title="PTA3: Roll 1d20 + accuracy bonus against the target's stat value.">
                                            {' '}| {accTargetLabel(category)}
                                        </span>
                                    )}
                                    {((move.isMaxMove && !move.isMaxGuard) || isGMax || isZMove) ? (
                                        <span style={{ opacity: 0.7 }}> | At-Will, always hits</span>
                                    ) : null}
                                    {isTeraBlast && (
                                        <span style={{ opacity: 0.7 }}> | Always hits</span>
                                    )}
                                    {isTeraCrown && (
                                        <span style={{ opacity: 0.7 }}> | At-Will</span>
                                    )}
                                </div>
                            </button>
                            {!move.isMaxMove && !isGMax && !isZMove && !isTeraMove && (
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
