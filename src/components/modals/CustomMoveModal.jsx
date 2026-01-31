// ============================================================
// Custom Move Modal Component
// ============================================================
// Modal for creating custom Pokemon moves

import React from 'react';
import useModalKeyboard from '../../hooks/useModalKeyboard.js';

const TYPE_LIST = [
    'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
    'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
    'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
];

const FREQUENCY_OPTIONS = [
    'At-Will', 'At-Will - 2', 'At-Will - 3',
    'EOT', 'EOT - 2',
    'Battle', 'Battle - 2',
    'Center', 'Center - 2',
    'Daily'
];

const CustomMoveModal = ({
    showCustomMoveModal,
    setShowCustomMoveModal,
    customMove,
    setCustomMove,
    customMoveForPokemon,
    pokemon,
    updatePokemon
}) => {
    const handleClose = () => setShowCustomMoveModal(false);

    const { modalRef } = useModalKeyboard(showCustomMoveModal, handleClose);

    if (!showCustomMoveModal) return null;

    const handleAddMove = () => {
        if (!customMove.name || !customMoveForPokemon) return;

        const targetPoke = pokemon.find(p => p.id === customMoveForPokemon);
        if (!targetPoke) return;

        // Check for duplicate move
        const alreadyKnows = targetPoke.moves.some(m =>
            m.name?.toLowerCase() === customMove.name?.toLowerCase()
        );
        if (alreadyKnows) {
            alert(`${targetPoke.name || targetPoke.species} already knows ${customMove.name}!`);
            return;
        }

        // Check move limits
        const naturalMoves = targetPoke.moves.filter(m => m.source === 'natural').length;
        const taughtMoves = targetPoke.moves.filter(m => m.source === 'taught').length;

        if (customMove.source === 'natural' && naturalMoves >= 4) {
            alert('This Pokémon already has 4 Natural moves.');
            return;
        }
        if (customMove.source === 'taught' && taughtMoves >= 4) {
            alert('This Pokémon already has 4 Taught moves.');
            return;
        }
        if (targetPoke.moves.length >= 8) {
            alert('This Pokémon already has 8 moves.');
            return;
        }

        updatePokemon(customMoveForPokemon, {
            moves: [...targetPoke.moves, { ...customMove }]
        });

        setShowCustomMoveModal(false);
    };

    return (
        <div className="modal-overlay" onClick={handleClose} role="presentation">
            <div
                ref={modalRef}
                className="modal"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '550px' }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="custom-move-modal-title"
            >
                <div className="modal-header">
                    <h3 id="custom-move-modal-title">Create Custom Move</h3>
                    <button
                        onClick={handleClose}
                        aria-label="Close modal"
                        style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
                    >
                        ×
                    </button>
                </div>
                <div className="modal-content">
                    <div className="form-group">
                        <label>Move Name *</label>
                        <input
                            type="text"
                            value={customMove.name}
                            onChange={(e) => setCustomMove(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Thunder Claw"
                        />
                    </div>

                    <div className="grid-responsive-2 gap-sm">
                        <div className="form-group">
                            <label>Type</label>
                            <select
                                value={customMove.type}
                                onChange={(e) => setCustomMove(prev => ({ ...prev, type: e.target.value }))}
                            >
                                {TYPE_LIST.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Category</label>
                            <select
                                value={customMove.category}
                                onChange={(e) => setCustomMove(prev => ({ ...prev, category: e.target.value }))}
                            >
                                <option value="Physical">Physical</option>
                                <option value="Special">Special</option>
                                <option value="Status">Status</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid-responsive-2 gap-sm">
                        <div className="form-group">
                            <label>Frequency</label>
                            <select
                                value={customMove.frequency}
                                onChange={(e) => setCustomMove(prev => ({ ...prev, frequency: e.target.value }))}
                            >
                                {FREQUENCY_OPTIONS.map(freq => (
                                    <option key={freq} value={freq}>{freq}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Move Source</label>
                            <select
                                value={customMove.source}
                                onChange={(e) => setCustomMove(prev => ({ ...prev, source: e.target.value }))}
                            >
                                <option value="natural">Natural / Level-Up</option>
                                <option value="taught">Taught / TM / Tutor</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid-responsive-2 gap-sm">
                        <div className="form-group">
                            <label>Damage Dice</label>
                            <input
                                type="text"
                                value={customMove.damage}
                                onChange={(e) => setCustomMove(prev => ({ ...prev, damage: e.target.value }))}
                                placeholder="e.g., 2d10+8 or leave empty for Status"
                            />
                        </div>

                        <div className="form-group">
                            <label>Range</label>
                            <input
                                type="text"
                                value={customMove.range}
                                onChange={(e) => setCustomMove(prev => ({ ...prev, range: e.target.value }))}
                                placeholder="e.g., Melee, Ranged 6, Self"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Effect Tags</label>
                        <input
                            type="text"
                            value={customMove.effect}
                            onChange={(e) => setCustomMove(prev => ({ ...prev, effect: e.target.value }))}
                            placeholder="e.g., 1 Target, Burst, Column, Push"
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={customMove.description}
                            onChange={(e) => setCustomMove(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe any special effects, conditions, or rules for this move..."
                            rows={3}
                            style={{ width: '100%', resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button className="btn btn-secondary" onClick={handleClose}>
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            disabled={!customMove.name}
                            onClick={handleAddMove}
                        >
                            Add Move
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomMoveModal;
