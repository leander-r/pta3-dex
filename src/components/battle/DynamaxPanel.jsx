import React, { useMemo } from 'react';
import { MAX_MOVE_TABLE } from '../../data/constants.js';
import { getTypeColor } from '../../utils/typeUtils.js';

const DynamaxPanel = ({ selectedPokemon, gameData, isDynamaxed, gMaxMoveUsed, onActivate, onRevert, onGMaxRoll, onMaxMoveRoll, disabled }) => {

    const gMaxData = useMemo(() => {
        if (!selectedPokemon?.species || !gameData?.gigantamaxForms) return null;
        return gameData.gigantamaxForms[selectedPokemon.species] || null;
    }, [selectedPokemon, gameData]);

    // Derive Max Moves from the Pokémon's current move list.
    // Attack moves (Physical/Special) → typed Max Move; Status moves → Max Guard.
    const derivedMaxMoves = useMemo(() => {
        if (!selectedPokemon?.moves?.length) return [];
        const attackTypes = new Set();
        let hasStatusMove = false;
        selectedPokemon.moves.forEach(m => {
            if ((m.category === 'Physical' || m.category === 'Special') && m.type && MAX_MOVE_TABLE[m.type]) {
                attackTypes.add(m.type);
            } else if (m.category === 'Status') {
                hasStatusMove = true;
            }
        });
        const moves = [...attackTypes].map(type => ({ ...MAX_MOVE_TABLE[type], type, isGuard: false }));
        if (hasStatusMove) {
            moves.push({ name: 'Max Guard', type: 'Normal', isGuard: true, damage: null, effect: 'Blocks all damage and effects targeting the user until the start of its next turn.' });
        }
        return moves;
    }, [selectedPokemon]);

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
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
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
                                <span style={{ fontSize: '10px', opacity: 0.75 }}>Ranged (80ft, 30ft blast)</span>
                            </div>
                            {gMaxData.gMaxMove.effect && (
                                <div style={{ opacity: 0.75, marginTop: '2px', fontSize: '11px' }}>{gMaxData.gMaxMove.effect}</div>
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

                    {/* Derived Max Moves from the Pokémon's move list */}
                    {derivedMaxMoves.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '2px' }}>
                                Max Moves — derived from {selectedPokemon.name || selectedPokemon.species}'s moves:
                            </div>
                            {derivedMaxMoves.map((mv) => (
                                <div
                                    key={mv.name}
                                    style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '7px 8px' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                        <span style={{ fontWeight: 'bold', fontSize: '12px' }}>{mv.name}</span>
                                        <span style={{ padding: '1px 6px', borderRadius: '8px', background: getTypeColor(mv.type), fontSize: '10px' }}>
                                            {mv.type}
                                        </span>
                                        {!mv.isGuard && (
                                            <span style={{ fontSize: '10px', opacity: 0.7, marginLeft: 'auto' }}>Ranged (80ft, 30ft blast)</span>
                                        )}
                                    </div>
                                    {mv.effect && (
                                        <div style={{ fontSize: '11px', opacity: 0.75 }}>{mv.effect}</div>
                                    )}
                                    {!mv.isGuard && (
                                        <button
                                            onClick={() => onMaxMoveRoll(mv)}
                                            style={{
                                                marginTop: '6px', width: '100%', padding: '5px', borderRadius: '5px', border: 'none',
                                                background: 'rgba(255,255,255,0.85)', color: '#7b1fa2',
                                                fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
                                            }}
                                        >
                                            Roll 4d12
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ fontSize: '11px', opacity: 0.7, fontStyle: 'italic' }}>
                            No moves known — add moves in the Pokémon tab to unlock Max Moves.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DynamaxPanel;
