// ============================================================
// Move Learn Modal Component
// ============================================================
// Modal that appears when a Pokemon levels up and learns a new move

import React from 'react';

const MoveLearnModal = ({
    showMoveLearnModal,
    setShowMoveLearnModal,
    moveLearnData,
    setMoveLearnData,
    learnMove,
    showDetail,
    GAME_DATA
}) => {
    if (!showMoveLearnModal || !moveLearnData) return null;

    const handleClose = () => {
        setShowMoveLearnModal(false);
        setMoveLearnData(null);
    };

    const handleForgetMove = (index) => {
        learnMove(
            moveLearnData.pokemonId,
            moveLearnData.newMove,
            index,
            moveLearnData.inParty
        );
        setShowMoveLearnModal(false);
        setMoveLearnData(null);
    };

    const moveData = GAME_DATA.moves[moveLearnData.newMove.move] || {};

    return (
        <div className="modal-overlay" onClick={() => {}}>
            <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header" style={{ background: 'linear-gradient(135deg, #4caf50, #2e7d32)' }}>
                    <h3>🎉 New Move Available!</h3>
                </div>

                <div style={{ padding: '20px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                            {moveLearnData.pokemonName} wants to learn
                        </div>
                        <div
                            style={{
                                fontSize: '24px',
                                fontWeight: 'bold',
                                color: '#4caf50',
                                padding: '10px 20px',
                                background: '#e8f5e9',
                                borderRadius: '10px',
                                display: 'inline-block',
                                cursor: 'pointer'
                            }}
                            onClick={() => {
                                showDetail('move', moveLearnData.newMove.move, {
                                    ...moveData,
                                    type: moveLearnData.newMove.type
                                });
                            }}
                            title="Tap to view move details"
                        >
                            {moveLearnData.newMove.move}
                            <span style={{ fontSize: '12px', marginLeft: '8px', opacity: 0.7 }}>ℹ️</span>
                        </div>
                        <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                            <span
                                className={`type-badge type-${(moveData.type || moveLearnData.newMove.type || 'Normal').toLowerCase()}`}
                                style={{ marginRight: '8px' }}
                            >
                                {moveData.type || moveLearnData.newMove.type || 'Normal'}
                            </span>
                            <span>{moveData.category || 'Physical'}</span>
                            {moveData.damage && <span> • {moveData.damage}</span>}
                        </div>
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
                            Learned at Level {moveLearnData.newMove.level}
                        </div>
                    </div>

                    <div style={{
                        background: '#fff3cd',
                        border: '1px solid #ffc107',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '20px',
                        textAlign: 'center'
                    }}>
                        <strong>⚠️ {moveLearnData.pokemonName} already knows 4 Natural moves!</strong>
                        <div style={{ fontSize: '13px', marginTop: '4px' }}>
                            Tap a move to view details. Choose a move to forget, or skip learning.
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '14px' }}>
                            Current Natural Moves:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {(moveLearnData.currentMoves || [])
                                .map((move, index) => ({ move, index }))
                                .filter(({ move }) => move.source === 'natural')
                                .map(({ move, index }) => {
                                    const moveDef = GAME_DATA.moves[move.name] || move;
                                    return (
                                        <div
                                            key={index}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '10px 12px',
                                                background: '#f8f9fa',
                                                borderRadius: '8px',
                                                border: '1px solid #dee2e6',
                                                cursor: 'pointer',
                                                transition: 'background 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}
                                        >
                                            <div
                                                style={{ flex: 1 }}
                                                onClick={() => showDetail('move', move.name, { ...moveDef, ...move })}
                                            >
                                                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                                    {move.name}
                                                    <span style={{ fontSize: '11px', marginLeft: '6px', opacity: 0.6 }}>ℹ️</span>
                                                    {move.learnedAtLevel && (
                                                        <span style={{ fontSize: '10px', color: '#888', marginLeft: '8px' }}>
                                                            (Lv.{move.learnedAtLevel})
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>
                                                    <span
                                                        className={`type-badge type-${(moveDef.type || 'Normal').toLowerCase()}`}
                                                        style={{ fontSize: '10px', padding: '1px 6px', marginRight: '6px' }}
                                                    >
                                                        {moveDef.type || 'Normal'}
                                                    </span>
                                                    {moveDef.category}
                                                    {moveDef.damage && ` • ${moveDef.damage}`}
                                                </div>
                                            </div>
                                            <button
                                                className="btn"
                                                style={{
                                                    background: 'linear-gradient(135deg, #f44336, #d32f2f)',
                                                    color: 'white',
                                                    padding: '3px 8px',
                                                    fontSize: '10px',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    whiteSpace: 'nowrap',
                                                    marginLeft: '8px'
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleForgetMove(index);
                                                }}
                                            >
                                                Forget
                                            </button>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button
                            className="btn btn-secondary"
                            style={{ padding: '10px 24px' }}
                            onClick={handleClose}
                        >
                            Don't Learn Move
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MoveLearnModal;
