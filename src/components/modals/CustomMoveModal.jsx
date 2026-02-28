// ============================================================
// Custom Move Modal Component
// ============================================================
// Modal for creating custom Pokemon moves

import React from 'react';
import useModalKeyboard from '../../hooks/useModalKeyboard.js';
import { useModal, usePokemonContext } from '../../contexts/index.js';
import toast from '../../utils/toast.js';

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

/**
 * CustomMoveModal - Modal for creating custom Pokemon moves
 * Uses UIContext for modal state, PokemonContext for pokemon data
 */
const CustomMoveModal = () => {
    // Get from contexts
    const { showCustomMoveModal, setShowCustomMoveModal, customMove, setCustomMove, customMoveForPokemon } = useModal();
    const { party, reserve, updatePokemon } = usePokemonContext();

    const handleClose = () => setShowCustomMoveModal(false);

    const { modalRef } = useModalKeyboard(showCustomMoveModal, handleClose);

    if (!showCustomMoveModal) return null;

    // Combine party and reserve for searching
    const allPokemon = [...(party || []), ...(reserve || [])];

    const handleAddMove = () => {
        if (!customMove.name || !customMoveForPokemon) return;

        const targetPoke = allPokemon.find(p => p.id === customMoveForPokemon);
        if (!targetPoke) return;

        // Check for duplicate move
        const alreadyKnows = targetPoke.moves.some(m =>
            m.name?.toLowerCase() === customMove.name?.toLowerCase()
        );
        if (alreadyKnows) {
            toast.warning(`${targetPoke.name || targetPoke.species} already knows ${customMove.name}!`);
            return;
        }

        // Check move limits
        const source = customMove.source === 'taught' ? 'taught' : 'natural';
        const naturalMoves = targetPoke.moves.filter(m => m.source === 'natural').length;
        const taughtMoves = targetPoke.moves.filter(m => m.source === 'taught').length;

        if (source === 'natural' && naturalMoves >= 4) {
            toast.warning('This Pokemon already has 4 Natural moves.');
            return;
        }
        if (source === 'taught' && taughtMoves >= 4) {
            toast.warning('This Pokemon already has 4 Taught moves.');
            return;
        }
        if (targetPoke.moves.length >= 8) {
            toast.warning('This Pokemon already has 8 moves.');
            return;
        }

        updatePokemon(customMoveForPokemon, {
            moves: [...targetPoke.moves, { ...customMove, source }]
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
                <div
                    className="modal-header"
                    style={{
                        background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                        color: 'white',
                        margin: '-25px -25px 20px -25px',
                        padding: '18px 20px',
                        borderRadius: '17px 17px 0 0',
                        borderBottom: 'none'
                    }}
                >
                    <h3
                        id="custom-move-modal-title"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            margin: 0,
                            fontSize: '18px',
                            fontWeight: '800',
                            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                        }}
                    >
                        <span style={{ fontSize: '22px' }}>⚔️</span>
                        Create Custom Move
                    </h3>
                    <button
                        onClick={handleClose}
                        aria-label="Close modal"
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: '2px solid rgba(255,255,255,0.3)',
                            fontSize: '18px',
                            cursor: 'pointer',
                            color: 'white',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            fontWeight: 'bold'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(255,255,255,0.35)';
                            e.target.style.transform = 'rotate(90deg)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(255,255,255,0.2)';
                            e.target.style.transform = 'rotate(0deg)';
                        }}
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
