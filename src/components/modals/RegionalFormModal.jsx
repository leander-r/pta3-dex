// ============================================================
// Regional Form Modal Component
// ============================================================
// Modal for selecting regional form variants when evolving Pokemon

import React from 'react';
import useModalKeyboard from '../../hooks/useModalKeyboard.js';
import { useUI, usePokemonContext } from '../../contexts/index.js';

/**
 * RegionalFormModal - Modal for selecting regional form variants
 * Uses UIContext for modal state, PokemonContext for applying species
 */
const RegionalFormModal = () => {
    // Get from contexts
    const { showRegionalFormModal, setShowRegionalFormModal, regionalFormData, setRegionalFormData } = useUI();
    const { applySpeciesToPokemon } = usePokemonContext();

    const handleClose = () => {
        setShowRegionalFormModal(false);
        setRegionalFormData(null);
    };

    const { modalRef } = useModalKeyboard(showRegionalFormModal && !!regionalFormData, handleClose);

    if (!showRegionalFormModal || !regionalFormData) return null;

    const handleRegionalFormSelect = (form) => {
        if (!regionalFormData) return;

        applySpeciesToPokemon(
            regionalFormData.pokemonId,
            regionalFormData.speciesData,
            form
        );

        setShowRegionalFormModal(false);
        setRegionalFormData(null);
    };

    return (
        <div className="modal-overlay" onClick={handleClose} role="presentation">
            <div
                ref={modalRef}
                className="modal"
                style={{ maxWidth: '450px' }}
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="regional-form-modal-title"
            >
                <div className="modal-header" style={{ background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)' }}>
                    <h3 id="regional-form-modal-title">🌍 Choose Form</h3>
                    <button
                        onClick={handleClose}
                        aria-label="Close modal"
                        style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'white' }}
                    >
                        ×
                    </button>
                </div>

                <div style={{ padding: '20px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
                            {regionalFormData.speciesData.species}
                        </div>
                        <div style={{ fontSize: '13px', color: '#666' }}>
                            This Pokémon has regional variants. Choose which form to use:
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {regionalFormData.forms.map((form, index) => {
                            const isBase = form.isBase;
                            const types = isBase ? regionalFormData.speciesData.types : form.types;
                            const abilities = isBase
                                ? regionalFormData.speciesData.abilities
                                : form.abilities;
                            const stats = isBase
                                ? regionalFormData.speciesData.baseStats
                                : form.baseStats;

                            return (
                                <div
                                    key={index}
                                    onClick={() => handleRegionalFormSelect(form)}
                                    className="regional-form-option"
                                    style={{
                                        padding: '16px',
                                        background: isBase
                                            ? 'linear-gradient(135deg, #f5f5f5, #e0e0e0)'
                                            : 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
                                        borderRadius: '12px',
                                        border: isBase
                                            ? '2px solid #9e9e9e'
                                            : '2px solid #2196f3',
                                        cursor: 'pointer',
                                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.02)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '10px'
                                    }}>
                                        <div style={{
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            {isBase ? '🔵' : '🌴'} {form.name} Form
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {types.map((t, i) => (
                                                <span
                                                    key={i}
                                                    className={`type-badge type-${t.toLowerCase()}`}
                                                    style={{ fontSize: '11px', padding: '2px 8px' }}
                                                >
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {abilities && (
                                        <div style={{ fontSize: '12px', color: '#555', marginBottom: '8px' }}>
                                            <strong>Abilities:</strong> {[
                                                ...(abilities.basic || []),
                                                ...(abilities.adv || []),
                                                ...(abilities.high || [])
                                            ].slice(0, 3).join(', ')}
                                            {[...(abilities.basic || []), ...(abilities.adv || []), ...(abilities.high || [])].length > 3 && '...'}
                                        </div>
                                    )}

                                    {stats && (
                                        <div style={{
                                            display: 'flex',
                                            gap: '8px',
                                            fontSize: '11px',
                                            flexWrap: 'wrap'
                                        }}>
                                            <span style={{ background: '#ffcdd2', padding: '2px 6px', borderRadius: '4px' }}>
                                                HP {stats.hp}
                                            </span>
                                            <span style={{ background: '#ffe0b2', padding: '2px 6px', borderRadius: '4px' }}>
                                                Atk {stats.atk}
                                            </span>
                                            <span style={{ background: '#fff9c4', padding: '2px 6px', borderRadius: '4px' }}>
                                                Def {stats.def}
                                            </span>
                                            <span style={{ background: '#c8e6c9', padding: '2px 6px', borderRadius: '4px' }}>
                                                SpA {stats.satk}
                                            </span>
                                            <span style={{ background: '#b3e5fc', padding: '2px 6px', borderRadius: '4px' }}>
                                                SpD {stats.sdef}
                                            </span>
                                            <span style={{ background: '#e1bee7', padding: '2px 6px', borderRadius: '4px' }}>
                                                Spd {stats.spd}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div style={{
                        marginTop: '16px',
                        textAlign: 'center',
                        fontSize: '12px',
                        color: '#888'
                    }}>
                        Click a form to select it
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegionalFormModal;
