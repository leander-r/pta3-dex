// ============================================================
// Custom Feature Modal Component
// ============================================================
// Modal for creating custom trainer features

import React from 'react';
import useModalKeyboard from '../../hooks/useModalKeyboard.js';
import { useUI, useTrainerContext } from '../../contexts/index.js';

/**
 * CustomFeatureModal - Modal for creating custom trainer features
 * Uses UIContext for modal state, TrainerContext for updating trainer
 */
const CustomFeatureModal = () => {
    // Get from contexts
    const { showCustomFeatureModal, setShowCustomFeatureModal, customFeature, setCustomFeature } = useUI();
    const { setTrainer } = useTrainerContext();

    const handleClose = () => setShowCustomFeatureModal(false);

    const { modalRef } = useModalKeyboard(showCustomFeatureModal, handleClose);

    if (!showCustomFeatureModal) return null;

    const handleAddFeature = () => {
        if (customFeature.name && customFeature.effect) {
            setTrainer(prev => ({
                ...prev,
                features: [...prev.features, { ...customFeature }],
                featPoints: (prev.featPoints || 0) - 1
            }));
            setShowCustomFeatureModal(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={handleClose} role="presentation">
            <div
                ref={modalRef}
                className="modal"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '500px' }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="custom-feature-modal-title"
            >
                <div
                    className="modal-header"
                    style={{
                        background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
                        color: 'white',
                        margin: '-25px -25px 20px -25px',
                        padding: '18px 20px',
                        borderRadius: '17px 17px 0 0',
                        borderBottom: 'none'
                    }}
                >
                    <h3
                        id="custom-feature-modal-title"
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
                        <span style={{ fontSize: '22px' }}>⚡</span>
                        Create Custom Feature
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
                        <label>Feature Name *</label>
                        <input
                            type="text"
                            value={customFeature.name}
                            onChange={(e) => setCustomFeature(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Type Specialist"
                        />
                    </div>

                    <div className="form-group">
                        <label>Category</label>
                        <select
                            value={customFeature.category}
                            onChange={(e) => setCustomFeature(prev => ({ ...prev, category: e.target.value }))}
                        >
                            <option value="Custom">Custom</option>
                            <option value="Class">Class Feature</option>
                            <option value="General">General</option>
                            <option value="Arms">Arms</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Prerequisites</label>
                        <input
                            type="text"
                            value={customFeature.prerequisites}
                            onChange={(e) => setCustomFeature(prev => ({ ...prev, prerequisites: e.target.value }))}
                            placeholder="e.g., Level 5, 14 SATK"
                        />
                    </div>

                    <div className="form-group">
                        <label>Frequency</label>
                        <input
                            type="text"
                            value={customFeature.frequency}
                            onChange={(e) => setCustomFeature(prev => ({ ...prev, frequency: e.target.value }))}
                            placeholder="e.g., At-Will, Daily, Static"
                        />
                    </div>

                    <div className="form-group">
                        <label>Trigger (if any)</label>
                        <input
                            type="text"
                            value={customFeature.trigger}
                            onChange={(e) => setCustomFeature(prev => ({ ...prev, trigger: e.target.value }))}
                            placeholder="e.g., When your Pokémon is hit by a super-effective move"
                        />
                    </div>

                    <div className="form-group">
                        <label>Target (if any)</label>
                        <input
                            type="text"
                            value={customFeature.target}
                            onChange={(e) => setCustomFeature(prev => ({ ...prev, target: e.target.value }))}
                            placeholder="e.g., Your Pokémon, An allied Trainer"
                        />
                    </div>

                    <div className="form-group">
                        <label>Effect *</label>
                        <textarea
                            value={customFeature.effect}
                            onChange={(e) => setCustomFeature(prev => ({ ...prev, effect: e.target.value }))}
                            placeholder="Describe what this feature does..."
                            rows={4}
                            style={{ width: '100%', resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button className="btn btn-secondary" onClick={handleClose}>
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            disabled={!customFeature.name || !customFeature.effect}
                            onClick={handleAddFeature}
                        >
                            Add Feature (1 point)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomFeatureModal;
