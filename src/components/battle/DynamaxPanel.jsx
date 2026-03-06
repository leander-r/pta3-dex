import React, { useState, useMemo } from 'react';
import { MAX_MOVE_TABLE } from '../../data/constants.js';
import { getTypeColor } from '../../utils/typeUtils.js';

const DynamaxPanel = ({ selectedPokemon, gameData, isDynamaxed, gMaxMoveUsed, onActivate, onRevert, onGMaxRoll, disabled }) => {
    const [showMaxMoves, setShowMaxMoves] = useState(false);

    const gMaxData = useMemo(() => {
        if (!selectedPokemon?.species || !gameData?.gigantamaxForms) return null;
        return gameData.gigantamaxForms[selectedPokemon.species] || null;
    }, [selectedPokemon, gameData]);

    const canGigantamax = !!gMaxData;
    const label = canGigantamax ? 'Gigantamax' : 'Dynamax';

    if (!selectedPokemon) return null;

    const panelStyle = {
        marginBottom: '12px', padding: '10px', borderRadius: '8px',
        background: isDynamaxed
            ? 'linear-gradient(135deg, #4a0080 0%, #9b27af 100%)'
            : 'linear-gradient(135deg, #7b1fa2 0%, #9b27af 100%)',
        opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto'
    };

    return (
        <div style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'white' }}>{label}</span>
                    {isDynamaxed && (
                        <span style={{ marginLeft: '8px', fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', color: 'white' }}>
                            Active
                        </span>
                    )}
                </div>
                {!isDynamaxed ? (
                    <button
                        onClick={onActivate}
                        style={{ padding: '6px 12px', background: 'white', color: '#7b1fa2', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                    >
                        {canGigantamax ? 'Gigantamax!' : 'Dynamax!'}
                    </button>
                ) : (
                    <button
                        onClick={onRevert}
                        style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                    >
                        Revert
                    </button>
                )}
            </div>

            {isDynamaxed && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.9)' }}>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span>HP ×5 (active)</span>
                        <span>Movement: 10ft/turn</span>
                        <span>Duration: 1 min (10 turns)</span>
                    </div>

                    {/* G-Max move */}
                    {canGigantamax && gMaxData.gMaxMove && (
                        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '8px', marginBottom: '8px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {gMaxData.gMaxMove.name}
                                <span style={{ padding: '1px 6px', borderRadius: '8px', background: getTypeColor(gMaxData.gMaxMove.type), fontSize: '10px' }}>
                                    {gMaxData.gMaxMove.type}
                                </span>
                            </div>
                            <div style={{ opacity: 0.85 }}>
                                Ranged (80ft, 30ft blast) — {gMaxData.gMaxMove.damage}
                            </div>
                            {gMaxData.gMaxMove.effect && (
                                <div style={{ opacity: 0.75, marginTop: '2px' }}>{gMaxData.gMaxMove.effect}</div>
                            )}
                            <button
                                onClick={() => !gMaxMoveUsed && onGMaxRoll(gMaxData.gMaxMove)}
                                disabled={gMaxMoveUsed}
                                style={{
                                    marginTop: '8px', width: '100%', padding: '7px', borderRadius: '6px', border: 'none',
                                    background: gMaxMoveUsed ? 'rgba(255,255,255,0.15)' : 'white',
                                    color: gMaxMoveUsed ? 'rgba(255,255,255,0.5)' : '#7b1fa2',
                                    fontWeight: 'bold', fontSize: '13px', cursor: gMaxMoveUsed ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {gMaxMoveUsed ? 'G-Max Used' : `Roll ${gMaxData.gMaxMove.damage}`}
                            </button>
                        </div>
                    )}

                    {/* Max Move reference */}
                    <button
                        onClick={() => setShowMaxMoves(v => !v)}
                        style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', width: '100%' }}
                    >
                        {showMaxMoves ? '▲ Hide Max Moves' : '▼ Show Max Moves Reference'}
                    </button>

                    {showMaxMoves && (
                        <div style={{ marginTop: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                            <div style={{ fontSize: '11px', opacity: 0.75, marginBottom: '4px' }}>All Max Moves: Ranged (80ft, 30ft blast) — At-Will — 4d12</div>
                            {Object.entries(MAX_MOVE_TABLE).map(([type, mv]) => (
                                <div key={type} style={{ marginBottom: '5px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px' }}>
                                    <span style={{ fontWeight: 'bold' }}>{mv.name}</span>
                                    <span style={{ marginLeft: '6px', padding: '1px 5px', borderRadius: '6px', background: getTypeColor(type), fontSize: '10px' }}>{type}</span>
                                    <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '1px' }}>{mv.effect}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DynamaxPanel;
