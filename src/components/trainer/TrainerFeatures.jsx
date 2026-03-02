// ============================================================
// Trainer Features Component
// ============================================================

import React, { useState, useMemo } from 'react';
import { useModal, useTrainerContext, useGameData, useUI } from '../../contexts/index.js';
import { HELP_BTN_STYLE } from '../common/helpBtnStyle.js';
import toast from '../../utils/toast.js';

// Features that modify trainer stats when acquired
// Format: { featureName: { stat: 'statName', value: number } } for auto-apply
// Or: { featureName: { choices: ['stat1', 'stat2'], value: number } } for user choice
// Or: { featureName: { stat: 'statName', calculated: { baseStat: 'stat', formula: 'halfMod' } } } for calculated values
const STAT_MODIFYING_FEATURES = {
    'League Member': { stat: 'sdef', value: 2 },
    'Study Session': { choices: ['satk', 'sdef'], value: 1, label: 'Choose stat to boost (+1)' },
    'Workout': { choices: ['hp', 'atk', 'def', 'spd'], value: 1, label: 'Choose stat to boost (+1)' },
    'Alacrity': { stat: 'spd', calculated: { baseStat: 'atk', formula: 'halfMod' }, label: 'Adds half ATK modifier to Speed' },
    'Martial Endurance': { hpBonus: 'half', label: 'Adds (half ATK mod + half DEF mod) × 5 to Max HP' },
    'Improved Martial Endurance': { hpBonus: 'full', label: 'Adds (ATK mod + DEF mod) × 5 to Max HP', replaces: 'Martial Endurance' },
    'Mystic Veil': { hpBonus: 'mystic', label: 'Adds DEF modifier × 3 to Max HP' }
};

// Calculate stat modifier (PTA formula)
const calculateModifier = (stat) => {
    if (stat === 10) return 0;
    if (stat < 10) return -(10 - stat);
    return Math.floor((stat - 10) / 2);
};

const STAT_LABELS = {
    hp: 'HP',
    atk: 'Attack',
    def: 'Defense',
    satk: 'Sp. Attack',
    sdef: 'Sp. Defense',
    spd: 'Speed'
};

/**
 * TrainerFeatures - Manage trainer features/abilities
 * Uses contexts for state management
 */
const TrainerFeatures = () => {
    const { showDetail } = useModal();
    const { trainer, setTrainer } = useTrainerContext();
    const { GAME_DATA } = useGameData();
    const { showHelp } = useUI();
    const [featureFilter, setFeatureFilter] = useState('all');
    const [featureSearch, setFeatureSearch] = useState('');
    const [pendingStatFeature, setPendingStatFeature] = useState(null); // { name, data, featureData }
    const [collapsed, setCollapsed] = useState(true);

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
            toast.warning('Not enough feat points!');
            return;
        }

        // Check if this feature modifies stats
        const statMod = STAT_MODIFYING_FEATURES[featureName];

        if (statMod) {
            if (statMod.choices) {
                // Feature requires user to choose which stat to boost
                setPendingStatFeature({ name: featureName, data: statMod, featureData, isFree });
                return;
            } else if (statMod.hpBonus) {
                // HP bonus feature (like Martial Endurance) - just add the feature, HP calc handles it
                // If this feature replaces another, remove the old one
                setTrainer(prev => {
                    let newFeatures = [...(prev.features || [])];
                    if (statMod.replaces) {
                        newFeatures = newFeatures.filter(f =>
                            (typeof f === 'object' ? f.name : f) !== statMod.replaces
                        );
                    }
                    return {
                        ...prev,
                        features: [...newFeatures, { name: featureName, hpBonus: statMod.hpBonus }],
                        featPoints: isFree ? prev.featPoints : (prev.featPoints || 0) - 1
                    };
                });
                return;
            } else if (statMod.calculated) {
                // Calculate the value based on another stat
                const baseStat = trainer.stats[statMod.calculated.baseStat] || 10;
                const modifier = calculateModifier(baseStat);
                let calculatedValue = 0;

                if (statMod.calculated.formula === 'halfMod') {
                    calculatedValue = Math.floor(modifier / 2);
                }

                // Only apply if there's a positive bonus
                if (calculatedValue > 0) {
                    applyFeatureWithStat(featureName, statMod.stat, calculatedValue, isFree);
                } else {
                    // Still add the feature but with 0 bonus (show it was applied)
                    applyFeatureWithStat(featureName, statMod.stat, 0, isFree);
                }
                return;
            } else {
                // Auto-apply fixed stat boost
                applyFeatureWithStat(featureName, statMod.stat, statMod.value, isFree);
                return;
            }
        }

        // No stat modification, just add the feature normally
        setTrainer(prev => ({
            ...prev,
            features: [...(prev.features || []), featureName],
            featPoints: isFree ? prev.featPoints : (prev.featPoints || 0) - 1
        }));
    };

    const applyFeatureWithStat = (featureName, chosenStat, value, isFree) => {
        setTrainer(prev => ({
            ...prev,
            features: [...(prev.features || []), { name: featureName, statBoost: { stat: chosenStat, value } }],
            featPoints: isFree ? prev.featPoints : (prev.featPoints || 0) - 1,
            stats: {
                ...prev.stats,
                [chosenStat]: (prev.stats[chosenStat] || 6) + value
            }
        }));
    };

    const handleStatChoice = (chosenStat) => {
        if (!pendingStatFeature) return;
        const { name, data, isFree } = pendingStatFeature;
        applyFeatureWithStat(name, chosenStat, data.value, isFree);
        setPendingStatFeature(null);
    };

    const handleRemoveFeature = (featureName) => {
        const featureData = GAME_DATA.features[featureName];
        const isFree = featureData?.category === 'General (Free)' || featureData?.isBase;

        // Find the feature in current features (might be string or object with statBoost)
        const featureEntry = currentFeatures.find(f =>
            (typeof f === 'object' ? f.name : f) === featureName
        );

        // Check if this feature had a stat boost that needs to be reversed
        let statReduction = null;
        if (featureEntry && typeof featureEntry === 'object' && featureEntry.statBoost) {
            statReduction = featureEntry.statBoost;
        } else if (STAT_MODIFYING_FEATURES[featureName] && !STAT_MODIFYING_FEATURES[featureName].choices) {
            // Auto-applied stat boost (like League Member)
            statReduction = {
                stat: STAT_MODIFYING_FEATURES[featureName].stat,
                value: STAT_MODIFYING_FEATURES[featureName].value
            };
        }

        setTrainer(prev => {
            const newState = {
                ...prev,
                features: (prev.features || []).filter(f =>
                    (typeof f === 'object' ? f.name : f) !== featureName
                ),
                featPoints: isFree ? prev.featPoints : (prev.featPoints || 0) + 1
            };

            // Reverse the stat boost if applicable
            if (statReduction) {
                newState.stats = {
                    ...prev.stats,
                    [statReduction.stat]: Math.max(6, (prev.stats[statReduction.stat] || 6) - statReduction.value)
                };
            }

            return newState;
        });
    };

    return (
        <div className="section-card-purple" style={{ marginBottom: '20px' }}>
            <h3 className="section-title-purple" onClick={() => setCollapsed(c => !c)} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <span>⭐</span> Features
                <button
                    onClick={(e) => { e.stopPropagation(); showHelp('trainer-features'); }}
                    style={HELP_BTN_STYLE}
                    aria-label="Help: Trainer Features"
                    title="About trainer features"
                >?</button>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="text-muted" style={{ fontSize: '12px', fontWeight: 'normal' }}>
                        {currentFeatures.length} features | {trainer.featPoints || 0} points available
                    </span>
                    <button
                        onClick={(e) => { e.stopPropagation(); setCollapsed(c => !c); }}
                        aria-label={collapsed ? 'Expand Features' : 'Collapse Features'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: 'inherit' }}
                    >
                        <span style={{ display: 'inline-block', transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', fontSize: '12px' }}>▼</span>
                    </button>
                </span>
            </h3>
            {!collapsed && <>
            <p className="section-description" style={{ fontSize: '12px' }}>
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
                                    background: isBase ? 'linear-gradient(135deg, var(--poke-orange, #f5a623), var(--poke-orange-dark, #e8941c))' : 'linear-gradient(135deg, #667eea, #764ba2)',
                                    borderRadius: '15px',
                                    color: 'white',
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                }}
                                onClick={() => showDetail && showDetail('feature', featureName, featureData)}
                            >
                                <span>{featureName}</span>
                                {isBase && <span style={{ fontSize: '9px', opacity: 0.8 }}>(Base)</span>}
                                {typeof feature === 'object' && feature.statBoost && feature.statBoost.value > 0 && (
                                    <span style={{ fontSize: '9px', opacity: 0.9, background: 'rgba(255,255,255,0.2)', padding: '1px 4px', borderRadius: '4px' }}>
                                        +{feature.statBoost.value} {STAT_LABELS[feature.statBoost.stat]}
                                    </span>
                                )}
                                {typeof feature === 'object' && feature.hpBonus && (() => {
                                    const atkMod = calculateModifier(trainer.stats.atk || 10);
                                    const defMod = calculateModifier(trainer.stats.def || 10);
                                    let hpBonusValue = 0;
                                    if (feature.hpBonus === 'full') {
                                        hpBonusValue = (atkMod + defMod) * 5;
                                    } else if (feature.hpBonus === 'half') {
                                        hpBonusValue = (Math.floor(atkMod / 2) + Math.floor(defMod / 2)) * 5;
                                    } else if (feature.hpBonus === 'mystic') {
                                        hpBonusValue = defMod * 3;
                                    }
                                    return hpBonusValue > 0 ? (
                                        <span style={{ fontSize: '9px', opacity: 0.9, background: 'rgba(255,255,255,0.2)', padding: '1px 4px', borderRadius: '4px' }}>
                                            +{hpBonusValue} Max HP
                                        </span>
                                    ) : null;
                                })()}
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
                                            fontSize: '12px',
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

            {/* Stat Choice Picker — inline panel, shown instead of add-section */}
            {pendingStatFeature && (
                <div style={{
                    padding: '15px',
                    background: 'var(--bg-light, #f5f5f5)',
                    borderRadius: '8px',
                    border: '2px solid var(--color-purple, #667eea)'
                }}>
                    <h4 style={{ margin: '0 0 6px 0', color: 'var(--color-purple, #667eea)', fontSize: '14px' }}>
                        {pendingStatFeature.name}
                    </h4>
                    <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {pendingStatFeature.data.label || 'Choose which stat to boost:'}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '10px' }}>
                        {pendingStatFeature.data.choices.map(stat => (
                            <button
                                key={stat}
                                onClick={() => handleStatChoice(stat)}
                                style={{
                                    padding: '10px',
                                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: 'bold'
                                }}
                            >
                                {STAT_LABELS[stat]} +{pendingStatFeature.data.value}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setPendingStatFeature(null)}
                        style={{
                            width: '100%',
                            padding: '8px',
                            background: 'none',
                            border: '1px solid var(--border-medium, #ddd)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: 'var(--text-muted)'
                        }}
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Add Feature Section */}
            {!pendingStatFeature && <div className="bg-light" style={{ padding: '12px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Search features..."
                        value={featureSearch}
                        onChange={(e) => setFeatureSearch(e.target.value)}
                        style={{ flex: 1, minWidth: '150px', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-medium, #ddd)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                    />
                    <select
                        value={featureFilter}
                        onChange={(e) => setFeatureFilter(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-medium, #ddd)' }}
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>
                                {cat === 'all' ? 'All Categories' : cat}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Feature List */}
                <div>
                    {availableFeatures.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
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
                                    background: 'var(--input-bg)',
                                    borderRadius: '6px',
                                    borderLeft: `3px solid ${data.category === 'General (Free)' ? 'var(--poke-orange, #f5a623)' : '#667eea'}`,
                                    cursor: 'pointer'
                                }}
                                onClick={() => showDetail && showDetail('feature', name, data)}
                            >
                                <div style={{ flex: 1, marginRight: '10px' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                                                {name}
                                                {STAT_MODIFYING_FEATURES[name] && (() => {
                                                    const statMod = STAT_MODIFYING_FEATURES[name];
                                                    let displayValue = statMod.value;
                                                    let displayStat = statMod.stat ? STAT_LABELS[statMod.stat] : 'stat';

                                                    // Calculate preview for calculated features
                                                    if (statMod.hpBonus) {
                                                        // Calculate HP bonus preview for HP bonus features
                                                        const atkMod = calculateModifier(trainer.stats.atk || 10);
                                                        const defMod = calculateModifier(trainer.stats.def || 10);
                                                        let hpBonusValue = 0;
                                                        if (statMod.hpBonus === 'full') {
                                                            hpBonusValue = (atkMod + defMod) * 5;
                                                        } else if (statMod.hpBonus === 'half') {
                                                            hpBonusValue = (Math.floor(atkMod / 2) + Math.floor(defMod / 2)) * 5;
                                                        } else if (statMod.hpBonus === 'mystic') {
                                                            hpBonusValue = defMod * 3;
                                                        }
                                                        return (
                                                            <span style={{ marginLeft: '6px', fontSize: '12px', color: hpBonusValue > 0 ? '#e53935' : '#999', fontWeight: 'normal' }}>
                                                                (+{hpBonusValue} Max HP)
                                                            </span>
                                                        );
                                                    } else if (statMod.calculated) {
                                                        const baseStat = trainer.stats[statMod.calculated.baseStat] || 10;
                                                        const modifier = calculateModifier(baseStat);
                                                        if (statMod.calculated.formula === 'halfMod') {
                                                            displayValue = Math.floor(modifier / 2);
                                                        }
                                                        displayStat = STAT_LABELS[statMod.stat];
                                                        return (
                                                            <span style={{ marginLeft: '6px', fontSize: '12px', color: displayValue > 0 ? '#4caf50' : '#999', fontWeight: 'normal' }}>
                                                                (+{displayValue} {displayStat} from {STAT_LABELS[statMod.calculated.baseStat]})
                                                            </span>
                                                        );
                                                    } else if (statMod.choices) {
                                                        return (
                                                            <span style={{ marginLeft: '6px', fontSize: '12px', color: '#4caf50', fontWeight: 'normal' }}>
                                                                (+{displayValue} to choice)
                                                            </span>
                                                        );
                                                    } else {
                                                        return (
                                                            <span style={{ marginLeft: '6px', fontSize: '12px', color: '#4caf50', fontWeight: 'normal' }}>
                                                                (+{displayValue} {displayStat})
                                                            </span>
                                                        );
                                                    }
                                                })()}
                                            </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{data.category}</div>
                                    {data.description && (
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            {data.description.length > 100 ? data.description.substring(0, 100) + '...' : data.description}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleAddFeature(name); }}
                                    disabled={data.category !== 'General (Free)' && (trainer.featPoints || 0) <= 0}
                                    style={{
                                        padding: '4px 12px',
                                        background: data.category === 'General (Free)' ? 'var(--poke-orange, #f5a623)' : '#667eea',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        opacity: (data.category !== 'General (Free)' && (trainer.featPoints || 0) <= 0) ? 0.5 : 1
                                    }}
                                >
                                    {data.category === 'General (Free)' ? 'Add Free' : 'Add (1 pt)'}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>}
            </>}
            {collapsed && (
                currentFeatures.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {currentFeatures.slice(0, 8).map((f, i) => {
                            const name = typeof f === 'object' ? f.name : f;
                            const featureData = GAME_DATA.features[name];
                            const isBase = featureData?.isBase;
                            return (
                                <span
                                    key={i}
                                    onClick={() => showDetail && showDetail('feature', name, featureData)}
                                    title={`View ${name} details`}
                                    style={{
                                        padding: '3px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold',
                                        background: isBase ? 'linear-gradient(135deg, var(--poke-orange, #f5a623), var(--poke-orange-dark, #e8941c))' : 'linear-gradient(135deg, #667eea, #764ba2)',
                                        color: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {name}
                                </span>
                            );
                        })}
                        {currentFeatures.length > 8 && (
                            <span style={{ padding: '3px 8px', fontSize: '12px', color: 'var(--text-muted)', alignSelf: 'center' }}>
                                +{currentFeatures.length - 8} more
                            </span>
                        )}
                    </div>
                ) : (
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No features yet — earn feat points to unlock abilities!
                    </p>
                )
            )}
        </div>
    );
};

export default TrainerFeatures;
