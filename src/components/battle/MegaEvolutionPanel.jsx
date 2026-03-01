import React, { useState, useEffect } from 'react';

const MegaEvolutionPanel = ({ selectedPokemon, megaForms, megaEvolved, currentMegaForm, onMegaEvolve, onMegaRevert, label = 'Mega Evolution' }) => {
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => { if (e.key === 'Escape') setShowModal(false); };
        if (showModal) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [showModal]);

    if (!selectedPokemon || megaForms.length === 0) return null;

    return (
        <>
            <div style={{ marginBottom: '12px', padding: '10px', borderRadius: '8px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'white' }}>{label}</span>
                        {megaEvolved && currentMegaForm && (
                            <span style={{ marginLeft: '8px', fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', color: 'white' }}>
                                {currentMegaForm.name} Active
                            </span>
                        )}
                    </div>
                    {!megaEvolved ? (
                        <button
                            onClick={() => megaForms.length === 1 ? onMegaEvolve(megaForms[0]) : setShowModal(true)}
                            style={{ padding: '6px 12px', background: 'white', color: '#667eea', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
                        >
                            {label === 'Mega Evolution' ? 'Mega Evolve' : 'Transform'}
                        </button>
                    ) : (
                        <button
                            onClick={onMegaRevert}
                            style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
                        >
                            Revert
                        </button>
                    )}
                </div>
                {megaEvolved && currentMegaForm && (
                    <div style={{ marginTop: '8px', fontSize: '10px', color: 'rgba(255,255,255,0.9)' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {currentMegaForm.types && <span>Type: {currentMegaForm.types.join('/')}</span>}
                            {currentMegaForm.ability && <span>• Ability: {currentMegaForm.ability}</span>}
                        </div>
                        <div style={{ marginTop: '4px' }}>
                            Stat Changes: {Object.entries(currentMegaForm.statBoosts || {})
                                .filter(([, v]) => v !== 0)
                                .map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k.toUpperCase()}`)
                                .join(', ') || 'None'}
                        </div>
                    </div>
                )}
            </div>

            {/* Multi-form selection modal */}
            {showModal && megaForms.length > 1 && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
                    onClick={() => setShowModal(false)}
                    role="presentation"
                >
                    <div
                        style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', maxWidth: '400px', width: '90%' }}
                        onClick={e => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="mega-form-modal-title"
                    >
                        <h3 id="mega-form-modal-title" style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Choose Mega Form</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {megaForms.map((form, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => { onMegaEvolve(form); setShowModal(false); }}
                                    style={{ padding: '12px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}
                                >
                                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{form.name}</div>
                                    <div style={{ fontSize: '11px', opacity: 0.9 }}>
                                        {form.types?.join('/') || 'Unknown Type'}{form.ability && ` • ${form.ability}`}
                                    </div>
                                    <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '4px' }}>
                                        {Object.entries(form.statBoosts || {}).filter(([, v]) => v !== 0).map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k.toUpperCase()}`).join(', ')}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowModal(false)}
                            style={{ marginTop: '12px', width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)' }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default MegaEvolutionPanel;
