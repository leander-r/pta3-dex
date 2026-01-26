// ============================================================
// Trainer Features Component
// ============================================================

import React, { useState, useMemo } from 'react';

const TrainerFeatures = ({ trainer, setTrainer, GAME_DATA, showDetail }) => {
    const [featureFilter, setFeatureFilter] = useState('all');
    const [featureSearch, setFeatureSearch] = useState('');

    const currentFeatures = trainer.features || [];

    // Get available features for selection
    const availableFeatures = useMemo(() => {
        return Object.entries(GAME_DATA.features || {})
            .filter(([name, data]) => {
                // Don't show already owned features
                if (currentFeatures.some(f => (typeof f === 'object' ? f.name : f) === name)) return false;

                // Filter by category
                if (featureFilter !== 'all' && data.category !== featureFilter) return false;

                // Filter by search
                if (featureSearch) {
                    const search = featureSearch.toLowerCase();
                    if (!name.toLowerCase().includes(search) &&
                        !data.description?.toLowerCase().includes(search)) return false;
                }

                return true;
            })
            .sort((a, b) => a[0].localeCompare(b[0]));
    }, [GAME_DATA.features, currentFeatures, featureFilter, featureSearch]);

    // Get unique categories
    const categories = useMemo(() => {
        const cats = new Set(['all']);
        Object.values(GAME_DATA.features || {}).forEach(f => {
            if (f.category) cats.add(f.category);
        });
        return Array.from(cats);
    }, [GAME_DATA.features]);

    const handleAddFeature = (featureName) => {
        const featureData = GAME_DATA.features[featureName];
        const isFree = featureData?.category === 'General (Free)' || featureData?.isBase;

        if (!isFree && (trainer.featPoints || 0) <= 0) {
            alert('Not enough feat points!');
            return;
        }

        setTrainer(prev => ({
            ...prev,
            features: [...(prev.features || []), featureName],
            featPoints: isFree ? prev.featPoints : (prev.featPoints || 0) - 1
        }));
    };

    const handleRemoveFeature = (featureName) => {
        const featureData = GAME_DATA.features[featureName];
        const isFree = featureData?.category === 'General (Free)' || featureData?.isBase;

        setTrainer(prev => ({
            ...prev,
            features: (prev.features || []).filter(f =>
                (typeof f === 'object' ? f.name : f) !== featureName
            ),
            featPoints: isFree ? prev.featPoints : (prev.featPoints || 0) + 1
        }));
    };

    return (
        <div className="section-card-purple" style={{ marginBottom: '20px' }}>
            <h3 className="section-title-purple">
                <span>⭐</span> Features
                <span className="text-muted" style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 'normal' }}>
                    {currentFeatures.length} features | {trainer.featPoints || 0} points available
                </span>
            </h3>
            <p className="section-description" style={{ fontSize: '11px' }}>
                Features give special abilities. Most cost 1 feat point. "General (Free)" features are free. Green badges are class base features.
            </p>

            {/* Current Features */}
            {currentFeatures.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
                    {currentFeatures.map((feature, index) => {
                        const featureName = typeof feature === 'object' ? feature.name : feature;
                        const featureData = GAME_DATA.features[featureName];
                        const isBase = featureData?.isBase;

                        return (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 10px',
                                    background: isBase ? 'linear-gradient(135deg, #4caf50, #388e3c)' : 'linear-gradient(135deg, #667eea, #764ba2)',
                                    borderRadius: '15px',
                                    color: 'white',
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                }}
                                onClick={() => showDetail && showDetail('feature', featureName, featureData)}
                            >
                                <span>{featureName}</span>
                                {isBase && <span style={{ fontSize: '9px', opacity: 0.8 }}>(Base)</span>}
                                {!isBase && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveFeature(featureName);
                                        }}
                                        style={{
                                            background: 'rgba(255,255,255,0.2)',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '16px',
                                            height: '16px',
                                            color: 'white',
                                            cursor: 'pointer',
                                            fontSize: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Feature Section */}
            <div className="bg-light" style={{ padding: '12px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Search features..."
                        value={featureSearch}
                        onChange={(e) => setFeatureSearch(e.target.value)}
                        style={{ flex: 1, minWidth: '150px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
                    />
                    <select
                        value={featureFilter}
                        onChange={(e) => setFeatureFilter(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>
                                {cat === 'all' ? 'All Categories' : cat}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Feature List */}
                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    {availableFeatures.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                            No features found
                        </div>
                    ) : (
                        availableFeatures.slice(0, 50).map(([name, data]) => (
                            <div
                                key={name}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    padding: '8px',
                                    marginBottom: '4px',
                                    background: 'white',
                                    borderRadius: '6px',
                                    borderLeft: `3px solid ${data.category === 'General (Free)' ? '#4caf50' : '#667eea'}`,
                                    cursor: 'pointer'
                                }}
                                onClick={() => showDetail && showDetail('feature', name, data)}
                            >
                                <div style={{ flex: 1, marginRight: '10px' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{name}</div>
                                    <div style={{ fontSize: '11px', color: '#666' }}>{data.category}</div>
                                    {data.description && (
                                        <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                                            {data.description.length > 100 ? data.description.substring(0, 100) + '...' : data.description}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleAddFeature(name); }}
                                    disabled={data.category !== 'General (Free)' && (trainer.featPoints || 0) <= 0}
                                    style={{
                                        padding: '4px 12px',
                                        background: data.category === 'General (Free)' ? '#4caf50' : '#667eea',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        opacity: (data.category !== 'General (Free)' && (trainer.featPoints || 0) <= 0) ? 0.5 : 1
                                    }}
                                >
                                    {data.category === 'General (Free)' ? 'Add Free' : 'Add (1 pt)'}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrainerFeatures;
