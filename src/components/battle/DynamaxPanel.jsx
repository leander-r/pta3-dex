import React, { useMemo } from 'react';
import { getTypeColor } from '../../utils/typeUtils.js';

const DynamaxPanel = ({ selectedPokemon, gameData, isDynamaxed, gMaxMoveUsed, onActivate, onRevert, onGMaxRoll, disabled }) => {

    const gMaxData = useMemo(() => {
        if (!selectedPokemon?.species || !gameData?.gigantamaxForms) return null;
        return gameData.gigantamaxForms[selectedPokemon.species] || null;
    }, [selectedPokemon, gameData]);

    const canGigantamax = !!gMaxData;
    const label = canGigantamax ? 'Gigantamax' : 'Dynamax';

    if (!selectedPokemon) return null;

    return (
        <div style={{
            marginBottom: '12px', padding: '10px', borderRadius: '8px',
            background: isDynamaxed
                ? 'linear-gradient(135deg, #4a0080 0%, #9b27af 100%)'
                : 'linear-gradient(135deg, #7b1fa2 0%, #9b27af 100%)',
            opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'white' }}>{label}</span>
                    {isDynamaxed && (
                        <span style={{ marginLeft: '8px', fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', color: 'white' }}>
                            Active — moves replaced with Max Moves
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
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.85)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span>HP ×5</span>
                    <span>Movement: 10ft/turn</span>
                    <span>Duration: 1 min</span>
                </div>
            )}

            {/* G-Max move — one-time roll, shown only when active */}
            {isDynamaxed && canGigantamax && gMaxData.gMaxMove && (
                <div style={{ marginTop: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '8px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '12px', color: 'white', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {gMaxData.gMaxMove.name}
                        <span style={{ padding: '1px 6px', borderRadius: '8px', background: getTypeColor(gMaxData.gMaxMove.type), fontSize: '10px' }}>
                            {gMaxData.gMaxMove.type}
                        </span>
                        <span style={{ fontSize: '10px', opacity: 0.7 }}>Ranged (80ft, 30ft blast)</span>
                    </div>
                    {gMaxData.gMaxMove.effect && (
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)' }}>{gMaxData.gMaxMove.effect}</div>
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
        </div>
    );
};

export default DynamaxPanel;
