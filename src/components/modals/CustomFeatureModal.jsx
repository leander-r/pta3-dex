// ============================================================
// Custom Feature Modal Component
// ============================================================
// Modal for creating custom trainer features

import React from 'react';

const CustomFeatureModal = ({
    showCustomFeatureModal,
    setShowCustomFeatureModal,
    customFeature,
    setCustomFeature,
    setTrainer
}) => {
    if (!showCustomFeatureModal) return null;

    const handleClose = () => setShowCustomFeatureModal(false);

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
                className="modal"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '500px' }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="custom-feature-modal-title"
            >
                <div className="modal-header">
                    <h3 id="custom-feature-modal-title">Create Custom Feature</h3>
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
