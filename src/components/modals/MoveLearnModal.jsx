// ============================================================
// Move Learn Modal Component
// ============================================================
// Modal that appears when a Pokemon levels up and learns a new move,
// or when manually adding a move via N/T buttons and at the limit

import React from 'react';
import useModalKeyboard from '../../hooks/useModalKeyboard.js';
import { useUI, useGameData, usePokemonContext } from '../../contexts/index.js';

/**
 * MoveLearnModal - Modal for learning new moves (level-up or manual)
 * Uses UIContext for modal state, PokemonContext for learnMove, GameDataContext for move data
 *
 * moveLearnData shape:
 * {
 *   pokemonId: string,
 *   pokemonName: string,
 *   newMove: { move: string, type: string, level?: number, source?: 'natural'|'taught', ...moveData },
 *   currentMoves: array,
 *   inParty: boolean,
 *   source: 'natural'|'taught' (optional, defaults to newMove.source or 'natural')
 * }
 */
const MoveLearnModal = () => {
    // Get from contexts
    const { showDetail, showMoveLearnModal, setShowMoveLearnModal, moveLearnData, setMoveLearnData } = useUI();
    const { GAME_DATA } = useGameData();
    const { learnMove } = usePokemonContext();
    const handleClose = () => {
        setShowMoveLearnModal(false);
        setMoveLearnData(null);
    };

    const { modalRef } = useModalKeyboard(showMoveLearnModal && !!moveLearnData, handleClose);

    if (!showMoveLearnModal || !moveLearnData) return null;

    // Determine the source type (natural or taught)
    const moveSource = moveLearnData.source || moveLearnData.newMove?.source || 'natural';
    const isNatural = moveSource === 'natural';

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
        <div className="modal-overlay" onClick={() => {}} role="presentation">
            <div
                ref={modalRef}
                className={`modal move-learn-modal ${isNatural ? 'natural' : 'taught'}`}
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="move-learn-modal-title"
            >
                <div className={`modal-header move-learn-header ${isNatural ? 'natural' : 'taught'}`}>
                    <h3 id="move-learn-modal-title">🎉 New Move Available!</h3>
                </div>

                <div className="move-learn-content">
                    <div className="move-learn-new-move-section">
                        <div className="move-learn-pokemon-name">
                            {moveLearnData.pokemonName} wants to learn
                        </div>
                        <div
                            className="move-learn-new-move"
                            onClick={() => {
                                showDetail('move', moveLearnData.newMove.move, {
                                    ...moveData,
                                    type: moveLearnData.newMove.type
                                });
                            }}
                            title="Tap to view move details"
                        >
                            {moveLearnData.newMove.move}
                            <span className="move-learn-info-icon">ℹ️</span>
                        </div>
                        <div className="move-learn-move-info">
                            <span
                                className={`type-badge type-${(moveData.type || moveLearnData.newMove.type || 'Normal').toLowerCase()}`}
                            >
                                {moveData.type || moveLearnData.newMove.type || 'Normal'}
                            </span>
                            <span>{moveData.category || 'Physical'}</span>
                            {moveData.damage && <span> • {moveData.damage}</span>}
                        </div>
                        {moveLearnData.newMove.level && (
                            <div className="move-learn-level">
                                Learned at Level {moveLearnData.newMove.level}
                            </div>
                        )}
                    </div>

                    <div className={`move-learn-warning ${isNatural ? 'natural' : 'taught'}`}>
                        <strong>⚠️ {moveLearnData.pokemonName} already knows 4 {isNatural ? 'Natural' : 'Taught'} moves!</strong>
                        <div className="move-learn-warning-text">
                            Tap a move to view details. Choose a move to forget, or skip learning.
                        </div>
                    </div>

                    <div className="move-learn-current-moves">
                        <div className="move-learn-section-title">
                            Current {isNatural ? 'Natural' : 'Taught'} Moves:
                        </div>
                        <div className="move-learn-moves-list">
                            {(moveLearnData.currentMoves || [])
                                .map((move, index) => ({ move, index }))
                                .filter(({ move }) => move.source === moveSource)
                                .map(({ move, index }) => {
                                    const moveDef = GAME_DATA.moves[move.name] || move;
                                    return (
                                        <div
                                            key={index}
                                            className="move-learn-item"
                                        >
                                            <div
                                                className="move-learn-item-info"
                                                onClick={() => showDetail('move', move.name, { ...moveDef, ...move })}
                                            >
                                                <div className="move-name">
                                                    {move.name}
                                                    <span className="move-learn-info-icon-small">ℹ️</span>
                                                    {move.learnedAtLevel && (
                                                        <span className="move-level">
                                                            (Lv.{move.learnedAtLevel})
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="move-details">
                                                    <span
                                                        className={`type-badge type-badge-small type-${(moveDef.type || 'Normal').toLowerCase()}`}
                                                    >
                                                        {moveDef.type || 'Normal'}
                                                    </span>
                                                    {moveDef.category}
                                                    {moveDef.damage && ` • ${moveDef.damage}`}
                                                </div>
                                            </div>
                                            <button
                                                className="btn move-learn-forget-btn"
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

                    <div className="move-learn-actions">
                        <button
                            className="btn btn-secondary"
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
