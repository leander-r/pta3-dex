import React, { useState, useMemo } from 'react';
import { Z_MOVE_TABLE } from '../../data/constants.js';
import { getTypeColor } from '../../utils/typeUtils.js';

const TypeChip = ({ type, selected, onClick }) => (
    <button
        onClick={onClick}
        style={{
            padding: '4px 10px', borderRadius: '12px', border: selected ? '2px solid white' : '2px solid transparent',
            background: getTypeColor(type), color: 'white', fontSize: '12px', fontWeight: 'bold',
            cursor: 'pointer', opacity: onClick ? 1 : 0.6
        }}
    >
        {type}
    </button>
);

const ZMovePanel = ({ selectedPokemon, gameData, zMoveUsed, onZMoveRoll, onReset, disabled }) => {
    const [selectedType, setSelectedType] = useState(null);

    // Collect unique types from moves that have a Z-Move
    const availableTypes = useMemo(() => {
        if (!selectedPokemon?.moves?.length) return [];
        const types = new Set();
        selectedPokemon.moves.forEach(m => {
            if (m.type && Z_MOVE_TABLE[m.type]) types.add(m.type);
        });
        return [...types];
    }, [selectedPokemon]);

    const uniqueZ = useMemo(() => {
        if (!selectedPokemon?.species || !gameData?.uniqueZMoves) return null;
        return gameData.uniqueZMoves[selectedPokemon.species] || null;
    }, [selectedPokemon, gameData]);

    if (!selectedPokemon || (availableTypes.length === 0 && !uniqueZ)) return null;

    const selectedZMove = selectedType ? Z_MOVE_TABLE[selectedType] : null;

    const panelStyle = {
        marginBottom: '12px', padding: '10px', borderRadius: '8px',
        background: 'linear-gradient(135deg, #ff6b6b 0%, #c62a2a 100%)',
        opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto'
    };

    return (
        <div style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'white' }}>Z-Move</span>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {zMoveUsed && (
                        <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', color: 'white' }}>
                            Used
                        </span>
                    )}
                    {zMoveUsed && (
                        <button
                            onClick={onReset}
                            style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Type selector */}
            {availableTypes.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                    {availableTypes.map(type => (
                        <TypeChip
                            key={type}
                            type={type}
                            selected={selectedType === type}
                            onClick={() => setSelectedType(prev => prev === type ? null : type)}
                        />
                    ))}
                </div>
            )}

            {/* Selected generic Z-Move details */}
            {selectedZMove && (
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '8px', marginBottom: '8px', fontSize: '12px', color: 'white' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{selectedZMove.name}</div>
                    <div style={{ opacity: 0.85 }}>{selectedZMove.range} — {selectedZMove.damage} — {selectedZMove.category}</div>
                    <button
                        onClick={() => !zMoveUsed && onZMoveRoll({ ...selectedZMove, moveType: selectedType })}
                        disabled={zMoveUsed}
                        style={{
                            marginTop: '8px', width: '100%', padding: '8px', borderRadius: '6px', border: 'none',
                            background: zMoveUsed ? 'rgba(255,255,255,0.15)' : 'white',
                            color: zMoveUsed ? 'rgba(255,255,255,0.5)' : '#c62a2a',
                            fontWeight: 'bold', fontSize: '13px', cursor: zMoveUsed ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {zMoveUsed ? 'Z-Move Used' : `Roll ${selectedZMove.damage}`}
                    </button>
                </div>
            )}

            {/* Species-specific Z-Move */}
            {uniqueZ && (
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px', fontSize: '12px', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                        {uniqueZ.name}
                        <span style={{ marginLeft: '6px', padding: '1px 6px', borderRadius: '8px', background: getTypeColor(uniqueZ.type), fontSize: '10px' }}>{uniqueZ.type}</span>
                    </div>
                    <div style={{ opacity: 0.85 }}>{uniqueZ.range} — {uniqueZ.damage || 'Effect'} — {uniqueZ.category}</div>
                    {uniqueZ.effect && <div style={{ opacity: 0.75, marginTop: '2px' }}>{uniqueZ.effect}</div>}
                    {uniqueZ.damage && (
                        <button
                            onClick={() => !zMoveUsed && onZMoveRoll({ ...uniqueZ, moveType: uniqueZ.type })}
                            disabled={zMoveUsed}
                            style={{
                                marginTop: '8px', width: '100%', padding: '8px', borderRadius: '6px', border: 'none',
                                background: zMoveUsed ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)',
                                color: zMoveUsed ? 'rgba(255,255,255,0.5)' : '#c62a2a',
                                fontWeight: 'bold', fontSize: '13px', cursor: zMoveUsed ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {zMoveUsed ? 'Z-Move Used' : `Roll ${uniqueZ.damage}`}
                        </button>
                    )}
                </div>
            )}

            {!selectedZMove && !uniqueZ && (
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                    Select a move type above to see available Z-Move.
                </div>
            )}
        </div>
    );
};

export default ZMovePanel;
