// ============================================================
// Custom Origin Modal Component
// ============================================================
// Modal for creating homebrew Trainer Origins. HB1 p.91 explicitly invites
// this: "work out origins that make sense with your GM. You should generally
// gain two skill talents, and have a feature that relates to the proper use
// of those talents." Saved to the shared customOrigins catalog (like custom
// species/moves) so any trainer can pick it, not just the one it was made for.

import React, { useState, useEffect, useCallback } from 'react';
import useModalKeyboard from '../../hooks/useModalKeyboard.js';
import { useModal, useGameData } from '../../contexts/index.js';
import { GAME_DATA } from '../../data/configs.js';
import toast from '../../utils/toast.js';

const LIFESTYLE_OPTIONS = ['Difficult', 'Modest', 'Comfortable', 'Wealthy', 'Special'];

const DEFAULT_ORIGIN = {
    name: '',
    lifestyle: 'Modest',
    savings: '',
    startingEquipment: '',
    startingPokemon: '',
    note: '',
    skillPool: [],
    chooseMode: false,
    chooseN: 2,
    featureName: '',
    featureEffect: ''
};

const CustomOriginModal = () => {
    const { showCustomOriginModal, setShowCustomOriginModal, editingCustomOriginId, setEditingCustomOriginId, showConfirm } = useModal();
    const { customOrigins, setCustomOrigins } = useGameData();

    const [origin, setOrigin] = useState({ ...DEFAULT_ORIGIN });
    const [editingIndex, setEditingIndex] = useState(null);

    const allSkills = Object.keys(GAME_DATA.skills || {});

    // Auto-load an existing custom origin for editing when the modal opens with an id
    useEffect(() => {
        if (showCustomOriginModal && editingCustomOriginId && customOrigins) {
            const index = customOrigins.findIndex(o => o.id === editingCustomOriginId);
            if (index !== -1) {
                const data = customOrigins[index];
                const group = data.skillTalents?.[0] || {};
                setOrigin({
                    ...DEFAULT_ORIGIN,
                    name: data.name || '',
                    lifestyle: data.lifestyle || 'Modest',
                    savings: data.savings || '',
                    startingEquipment: data.startingEquipment || '',
                    startingPokemon: data.startingPokemon || '',
                    note: data.note || '',
                    skillPool: group.fixed || group.pool || [],
                    chooseMode: !!group.chooseN,
                    chooseN: group.chooseN || 2,
                    featureName: data.feature?.name || '',
                    featureEffect: data.feature?.effect || ''
                });
                setEditingIndex(index);
            }
        }
    }, [showCustomOriginModal, editingCustomOriginId, customOrigins]);

    const doClose = useCallback(() => {
        setShowCustomOriginModal(false);
        setOrigin({ ...DEFAULT_ORIGIN });
        setEditingIndex(null);
        if (setEditingCustomOriginId) setEditingCustomOriginId(null);
    }, [setShowCustomOriginModal, setEditingCustomOriginId]);

    const handleClose = useCallback(() => {
        const hasUnsaved = origin.name.trim() || origin.skillPool.length > 0 || origin.featureName.trim();
        if (hasUnsaved && editingIndex === null) {
            showConfirm({
                title: 'Discard new origin?',
                message: 'You have unsaved changes to this new Origin. Close without saving?',
                confirmLabel: 'Discard',
                danger: true,
                onConfirm: doClose
            });
        } else {
            doClose();
        }
    }, [origin, editingIndex, showConfirm, doClose]);

    const { modalRef } = useModalKeyboard(showCustomOriginModal, handleClose);

    if (!showCustomOriginModal) return null;

    const toggleSkill = (skill) => {
        setOrigin(prev => ({
            ...prev,
            skillPool: prev.skillPool.includes(skill)
                ? prev.skillPool.filter(s => s !== skill)
                : [...prev.skillPool, skill]
        }));
    };

    const handleSave = () => {
        const name = origin.name.trim();
        if (!name) {
            toast.warning('Origin name is required!');
            return;
        }
        if (GAME_DATA.origins?.[name]) {
            toast.warning(`"${name}" is already an official Origin. Choose a different name.`);
            return;
        }
        const collisionIndex = customOrigins.findIndex((o, i) =>
            o.name.toLowerCase() === name.toLowerCase() && i !== editingIndex
        );
        if (collisionIndex !== -1) {
            toast.warning(`A custom Origin named "${name}" already exists.`);
            return;
        }
        if (origin.featureName.trim() && !origin.featureEffect.trim()) {
            toast.warning('Give the feature an effect, or clear its name to skip having a feature.');
            return;
        }

        const skillTalents = origin.skillPool.length === 0
            ? []
            : origin.chooseMode
                ? [{ chooseN: Math.min(origin.chooseN, origin.skillPool.length), pool: origin.skillPool }]
                : [{ fixed: origin.skillPool }];

        const cleanedOrigin = {
            id: editingIndex !== null ? customOrigins[editingIndex].id : 'custom-origin-' + Date.now(),
            name,
            lifestyle: origin.lifestyle,
            savings: origin.savings.trim(),
            startingEquipment: origin.startingEquipment.trim(),
            startingPokemon: origin.startingPokemon.trim(),
            note: origin.note.trim() || undefined,
            skillTalents,
            feature: origin.featureName.trim()
                ? { name: origin.featureName.trim(), effect: origin.featureEffect.trim(), category: 'Custom Origin' }
                : null,
            isCustom: true
        };

        if (editingIndex !== null) {
            const updated = [...customOrigins];
            updated[editingIndex] = cleanedOrigin;
            setCustomOrigins(updated);
        } else {
            setCustomOrigins([...customOrigins, cleanedOrigin]);
        }

        doClose();
    };

    return (
        <div className="modal-overlay" onClick={handleClose} role="presentation">
            <div
                ref={modalRef}
                className="modal"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: 'min(95vw, 600px)', width: '100%', maxHeight: '90vh', overflow: 'auto' }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="custom-origin-modal-title"
            >
                <div
                    className="modal-header"
                    style={{
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: 'white',
                        margin: '-25px -25px 20px -25px',
                        padding: '18px 20px',
                        borderRadius: '17px 17px 0 0',
                        borderBottom: 'none'
                    }}
                >
                    <h3
                        id="custom-origin-modal-title"
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0, fontSize: '18px', fontWeight: '800', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                    >
                        <span style={{ fontSize: '22px' }}>📜</span>
                        {editingIndex !== null ? 'Edit Custom Origin' : 'Create Custom Origin'}
                    </h3>
                    <button
                        onClick={handleClose}
                        aria-label="Close modal"
                        title="Close"
                        style={{
                            background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.3)',
                            fontSize: '18px', cursor: 'pointer', color: 'white', borderRadius: '50%',
                            width: '36px', height: '36px', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontWeight: 'bold'
                        }}
                    >×</button>
                </div>
                <div className="modal-content">
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 0 }}>
                        Per HB1 p.91: work this out with your GM. Generally 2 skill talents and a feature related to their use.
                    </p>

                    <div className="form-group">
                        <label>Origin Name *</label>
                        <input
                            type="text"
                            value={origin.name}
                            onChange={(e) => setOrigin(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Ultra Wormhole Survivor"
                        />
                    </div>

                    <div className="form-group">
                        <label>Skill Talents</label>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Pick the skills this Origin grants.
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                            {allSkills.map(skill => {
                                const selected = origin.skillPool.includes(skill);
                                return (
                                    <button
                                        key={skill}
                                        onClick={() => toggleSkill(skill)}
                                        style={{
                                            padding: '4px 10px', borderRadius: '14px', fontSize: '11px',
                                            border: `1px solid ${selected ? '#667eea' : 'var(--border-medium)'}`,
                                            background: selected ? '#667eea' : 'var(--bg-primary)',
                                            color: selected ? 'white' : 'var(--text-primary)',
                                            cursor: 'pointer'
                                        }}
                                    >{skill}</button>
                                );
                            })}
                        </div>
                        {origin.skillPool.length > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                                    <input
                                        type="checkbox"
                                        checked={origin.chooseMode}
                                        onChange={(e) => setOrigin(prev => ({ ...prev, chooseMode: e.target.checked }))}
                                    />
                                    Let the player choose only some of these
                                </label>
                                {origin.chooseMode && (
                                    <input
                                        type="number"
                                        min="1"
                                        max={origin.skillPool.length}
                                        value={origin.chooseN}
                                        onChange={(e) => setOrigin(prev => ({ ...prev, chooseN: Math.max(1, Math.min(origin.skillPool.length, parseInt(e.target.value, 10) || 1)) }))}
                                        style={{ width: '50px', padding: '4px', borderRadius: '4px', border: '1px solid var(--border-medium)', textAlign: 'center' }}
                                    />
                                )}
                                {origin.chooseMode && <span style={{ color: 'var(--text-secondary)' }}>of {origin.skillPool.length}</span>}
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Feature Name</label>
                        <input
                            type="text"
                            value={origin.featureName}
                            onChange={(e) => setOrigin(prev => ({ ...prev, featureName: e.target.value }))}
                            placeholder="e.g., Wormhole Instinct (leave blank for no feature)"
                        />
                    </div>
                    <div className="form-group">
                        <label>Feature Effect</label>
                        <textarea
                            value={origin.featureEffect}
                            onChange={(e) => setOrigin(prev => ({ ...prev, featureEffect: e.target.value }))}
                            placeholder="Describe what the feature does..."
                            rows={3}
                            style={{ width: '100%', resize: 'vertical' }}
                        />
                    </div>

                    <div className="grid-responsive-2 gap-sm">
                        <div className="form-group">
                            <label>Lifestyle</label>
                            <select
                                value={origin.lifestyle}
                                onChange={(e) => setOrigin(prev => ({ ...prev, lifestyle: e.target.value }))}
                            >
                                {LIFESTYLE_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Savings</label>
                            <input
                                type="text"
                                value={origin.savings}
                                onChange={(e) => setOrigin(prev => ({ ...prev, savings: e.target.value }))}
                                placeholder="e.g., 20,000 credits"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Starting Equipment</label>
                        <input
                            type="text"
                            value={origin.startingEquipment}
                            onChange={(e) => setOrigin(prev => ({ ...prev, startingEquipment: e.target.value }))}
                            placeholder="e.g., Traveler's Pack, 6 Basic Balls, 2 Potions"
                        />
                    </div>
                    <div className="form-group">
                        <label>Starting Pokémon</label>
                        <input
                            type="text"
                            value={origin.startingPokemon}
                            onChange={(e) => setOrigin(prev => ({ ...prev, startingPokemon: e.target.value }))}
                            placeholder="e.g., One starter Pokémon, up to one common pet Pokémon"
                        />
                    </div>
                    <div className="form-group">
                        <label>Note (optional)</label>
                        <input
                            type="text"
                            value={origin.note}
                            onChange={(e) => setOrigin(prev => ({ ...prev, note: e.target.value }))}
                            placeholder="Any special GM-negotiated rule for this Origin"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                        {editingIndex !== null && (
                            <button className="btn btn-secondary" onClick={() => { setOrigin({ ...DEFAULT_ORIGIN }); setEditingIndex(null); }} style={{ marginRight: 'auto' }}>Cancel Edit</button>
                        )}
                        <button className="btn btn-secondary" onClick={handleClose}>Close</button>
                        <button className="btn btn-primary" disabled={!origin.name.trim()} onClick={handleSave}>
                            {editingIndex !== null ? 'Update Origin' : 'Create Origin'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomOriginModal;
