// ============================================================
// Trainer Features Component (PTA3)
// ============================================================
// Features come from trainer classes and unlock at specific class levels.
// No feat point cost — features are freely available once prerequisites are met.

import React, { useState, useMemo } from 'react';
import { useModal, useTrainerContext, useGameData, useUI } from '../../contexts/index.js';
import { HELP_BTN_STYLE } from '../common/helpBtnStyle.js';

// Features that modify trainer stats when acquired (keep existing stat-mod logic)
const STAT_MODIFYING_FEATURES = {
    'League Member': { stat: 'sdef', value: 2 },
    'Study Session': { choices: ['satk', 'sdef'], value: 1, label: 'Choose stat to boost (+1)' },
    'Workout': { choices: ['atk', 'def', 'spd'], value: 1, label: 'Choose stat to boost (+1)' },
    'Alacrity': { stat: 'spd', calculated: { baseStat: 'atk', formula: 'halfMod' }, label: 'Adds half ATK modifier to Speed' },
    'Martial Endurance': { hpBonus: 'half', label: 'Adds (half ATK mod + half DEF mod) × 5 to Max HP' },
    'Improved Martial Endurance': { hpBonus: 'full', label: 'Adds (ATK mod + DEF mod) × 5 to Max HP', replaces: 'Martial Endurance' },
    'Mystic Veil': { hpBonus: 'mystic', label: 'Adds DEF modifier × 3 to Max HP' }
};

const calculateModifier = (stat) => Math.floor((stat || 0) / 2);

const STAT_LABELS = {
    atk: 'Attack', def: 'Defense', satk: 'Sp. Attack', sdef: 'Sp. Defense', spd: 'Speed'
};

/**
 * Parse a PTA3 feature prerequisite string.
 * "Level X"       → requires class level ≥ X
 * "Requires [F]"  → requires owning feature F
 */
const parsePrerequisite = (prerequisite, classLevel, ownedFeatureNames) => {
    if (!prerequisite) return { met: true, display: null };

    const levelMatch = prerequisite.match(/^Level\s+(\d+)/i);
    if (levelMatch) {
        const reqLevel = parseInt(levelMatch[1]);
        return { met: (classLevel || 1) >= reqLevel, display: `Class Lv ${reqLevel}` };
    }

    const reqMatch = prerequisite.match(/^Requires?\s+(.+)/i);
    if (reqMatch) {
        const featureReq = reqMatch[1].trim();
        return { met: ownedFeatureNames.has(featureReq), display: `Requires: ${featureReq}` };
    }

    return { met: false, display: prerequisite };
};

/**
 * TrainerFeatures — Manage trainer features (PTA3 class-based system)
 */
const TrainerFeatures = () => {
    const { showDetail, setShowCustomFeatureModal } = useModal();
    const { trainer, setTrainer } = useTrainerContext();
    const { GAME_DATA } = useGameData();
    const { showHelp } = useUI();
    const [featureFilter, setFeatureFilter] = useState('all');
    const [featureSearch, setFeatureSearch] = useState('');
    const [pendingStatFeature, setPendingStatFeature] = useState(null);
    const [collapsed, setCollapsed] = useState(true);
    const [showLocked, setShowLocked] = useState(false);

    const currentFeatures = trainer.features || [];
    const trainerClasses = trainer.classes || [];
    const classLevels = trainer.classLevels || {};

    // Set of owned feature names for fast lookup
    const ownedFeatureNames = useMemo(() =>
        new Set(currentFeatures.map(f => typeof f === 'object' ? f.name : f)),
        [currentFeatures]
    );

    // Available (not yet owned) features from trainer's classes
    const availableFeatures = useMemo(() => {
        const trainerClassSet = new Set(trainerClasses);

        return Object.entries(GAME_DATA.features || {})
            .filter(([name, data]) => {
                if (ownedFeatureNames.has(name)) return false;
                if (!trainerClassSet.has(data.category)) return false;
                if (featureFilter !== 'all' && data.category !== featureFilter) return false;
                if (featureSearch) {
                    const s = featureSearch.toLowerCase();
                    if (!name.toLowerCase().includes(s) &&
                        !(data.effect || data.description || '').toLowerCase().includes(s)) return false;
                }
                return true;
            })
            .map(([name, data]) => {
                const classLevel = classLevels[data.category] ?? trainer.level;
                const { met, display } = parsePrerequisite(data.prerequisites, classLevel, ownedFeatureNames);
                return { name, data, met, display };
            })
            .sort((a, b) => {
                if (a.met !== b.met) return a.met ? -1 : 1;
                const aLevel = parseInt(a.display?.match(/\d+/)?.[0] || '0');
                const bLevel = parseInt(b.display?.match(/\d+/)?.[0] || '0');
                return aLevel - bLevel || a.name.localeCompare(b.name);
            });
    }, [GAME_DATA.features, ownedFeatureNames, trainerClasses, classLevels, trainer.level, featureSearch, featureFilter]);

    const visibleFeatures = showLocked ? availableFeatures : availableFeatures.filter(f => f.met);
    const lockedCount = availableFeatures.filter(f => !f.met).length;

    const handleAddFeature = (featureName) => {
        const statMod = STAT_MODIFYING_FEATURES[featureName];

        if (statMod) {
            if (statMod.choices) {
                setPendingStatFeature({ name: featureName, data: statMod });
                return;
            } else if (statMod.hpBonus) {
                setTrainer(prev => {
                    let newFeatures = [...(prev.features || [])];
                    if (statMod.replaces) {
                        newFeatures = newFeatures.filter(f =>
                            (typeof f === 'object' ? f.name : f) !== statMod.replaces
                        );
                    }
                    return { ...prev, features: [...newFeatures, { name: featureName, hpBonus: statMod.hpBonus }] };
                });
                return;
            } else if (statMod.calculated) {
                const baseStat = trainer.stats[statMod.calculated.baseStat] || 3;
                const modifier = calculateModifier(baseStat);
                const calculatedValue = statMod.calculated.formula === 'halfMod' ? Math.floor(modifier / 2) : 0;
                applyFeatureWithStat(featureName, statMod.stat, calculatedValue);
                return;
            } else {
                applyFeatureWithStat(featureName, statMod.stat, statMod.value);
                return;
            }
        }

        setTrainer(prev => ({
            ...prev,
            features: [...(prev.features || []), featureName]
        }));
    };

    const applyFeatureWithStat = (featureName, chosenStat, value) => {
        setTrainer(prev => ({
            ...prev,
            features: [...(prev.features || []), { name: featureName, statBoost: { stat: chosenStat, value } }],
            stats: { ...prev.stats, [chosenStat]: (prev.stats[chosenStat] || 3) + value }
        }));
    };

    const handleStatChoice = (chosenStat) => {
        if (!pendingStatFeature) return;
        const { name, data } = pendingStatFeature;
        applyFeatureWithStat(name, chosenStat, data.value);
        setPendingStatFeature(null);
    };

    const handleRemoveFeature = (featureName) => {
        const featureEntry = currentFeatures.find(f =>
            (typeof f === 'object' ? f.name : f) === featureName
        );

        let statReduction = null;
        if (featureEntry && typeof featureEntry === 'object' && featureEntry.statBoost) {
            statReduction = featureEntry.statBoost;
        } else if (STAT_MODIFYING_FEATURES[featureName] && !STAT_MODIFYING_FEATURES[featureName].choices) {
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
                )
            };
            if (statReduction) {
                newState.stats = {
                    ...prev.stats,
                    [statReduction.stat]: Math.max(1, (prev.stats[statReduction.stat] || 3) - statReduction.value)
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
                        {currentFeatures.length} features
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
                    Features unlock from your classes as your class level increases.
                    Level 1 features are granted automatically when a class is taken.
                </p>

                {/* Current Features */}
                {currentFeatures.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
                        {currentFeatures.map((feature, index) => {
                            const featureName = typeof feature === 'object' ? feature.name : feature;
                            const featureData = GAME_DATA.features?.[featureName];
                            const isClassFeature = featureData && trainerClasses.includes(featureData.category);

                            return (
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 10px',
                                        background: isClassFeature
                                            ? 'linear-gradient(135deg, #667eea, #764ba2)'
                                            : 'linear-gradient(135deg, var(--poke-orange, #f5a623), var(--poke-orange-dark, #e8941c))',
                                        borderRadius: '15px',
                                        color: 'white',
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => showDetail && showDetail('feature', featureName, featureData)}
                                >
                                    <span>{featureName}</span>
                                    {typeof feature === 'object' && feature.statBoost && feature.statBoost.value > 0 && (
                                        <span style={{ fontSize: '9px', opacity: 0.9, background: 'rgba(255,255,255,0.2)', padding: '1px 4px', borderRadius: '4px' }}>
                                            +{feature.statBoost.value} {STAT_LABELS[feature.statBoost.stat]}
                                        </span>
                                    )}
                                    {typeof feature === 'object' && feature.hpBonus && (() => {
                                        const atkMod = calculateModifier(trainer.stats.atk || 3);
                                        const defMod = calculateModifier(trainer.stats.def || 3);
                                        let hpBonusValue = 0;
                                        if (feature.hpBonus === 'full') hpBonusValue = (atkMod + defMod) * 5;
                                        else if (feature.hpBonus === 'half') hpBonusValue = (Math.floor(atkMod / 2) + Math.floor(defMod / 2)) * 5;
                                        else if (feature.hpBonus === 'mystic') hpBonusValue = defMod * 3;
                                        return hpBonusValue > 0 ? (
                                            <span style={{ fontSize: '9px', opacity: 0.9, background: 'rgba(255,255,255,0.2)', padding: '1px 4px', borderRadius: '4px' }}>
                                                +{hpBonusValue} Max HP
                                            </span>
                                        ) : null;
                                    })()}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRemoveFeature(featureName); }}
                                        style={{
                                            background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
                                            width: '16px', height: '16px', color: 'white', cursor: 'pointer',
                                            fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >×</button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Stat Choice Picker */}
                {pendingStatFeature && (
                    <div style={{
                        padding: '15px', background: 'var(--bg-light, #f5f5f5)',
                        borderRadius: '8px', border: '2px solid var(--color-purple, #667eea)'
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
                                        padding: '10px', background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                        color: 'white', border: 'none', borderRadius: '6px',
                                        cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
                                    }}
                                >
                                    {STAT_LABELS[stat]} +{pendingStatFeature.data.value}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setPendingStatFeature(null)}
                            style={{
                                width: '100%', padding: '8px', background: 'none',
                                border: '1px solid var(--border-medium, #ddd)', borderRadius: '6px',
                                cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)'
                            }}
                        >Cancel</button>
                    </div>
                )}

                {/* Available Features from Classes */}
                {!pendingStatFeature && (
                    trainerClasses.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '15px 0' }}>
                            Pick a class above to unlock features.
                        </p>
                    ) : (
                        <div className="bg-light" style={{ padding: '12px', borderRadius: '8px' }}>
                            {/* Filters */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    placeholder="Search features..."
                                    value={featureSearch}
                                    onChange={(e) => setFeatureSearch(e.target.value)}
                                    style={{
                                        flex: 1, minWidth: '120px', padding: '6px 10px',
                                        borderRadius: '6px', border: '1px solid var(--border-medium, #ddd)',
                                        background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '13px'
                                    }}
                                />
                                <select
                                    value={featureFilter}
                                    onChange={(e) => setFeatureFilter(e.target.value)}
                                    style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-medium, #ddd)', fontSize: '13px' }}
                                >
                                    <option value="all">All My Classes</option>
                                    {trainerClasses.map(cls => (
                                        <option key={cls} value={cls}>{cls}</option>
                                    ))}
                                </select>
                                {lockedCount > 0 && (
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={showLocked}
                                            onChange={(e) => setShowLocked(e.target.checked)}
                                        />
                                        Show locked ({lockedCount})
                                    </label>
                                )}
                            </div>

                            {/* Feature list */}
                            <div>
                                {visibleFeatures.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                                        {availableFeatures.length === 0
                                            ? 'All features from your classes have been taken!'
                                            : 'No features available yet — level up to unlock more.'}
                                    </div>
                                ) : (
                                    visibleFeatures.slice(0, 60).map(({ name, data, met, display }) => (
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
                                                borderLeft: `3px solid ${met ? '#667eea' : '#ccc'}`,
                                                opacity: met ? 1 : 0.65,
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => showDetail && showDetail('feature', name, data)}
                                        >
                                            <div style={{ flex: 1, marginRight: '10px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                    <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{name}</span>
                                                    {display && (
                                                        <span style={{
                                                            fontSize: '10px', padding: '1px 6px', borderRadius: '8px',
                                                            background: met ? '#e8f5e9' : '#fff3e0',
                                                            color: met ? '#2e7d32' : '#e65100',
                                                            border: `1px solid ${met ? '#a5d6a7' : '#ffcc80'}`
                                                        }}>
                                                            {display}
                                                        </span>
                                                    )}
                                                    {STAT_MODIFYING_FEATURES[name] && (() => {
                                                        const statMod = STAT_MODIFYING_FEATURES[name];
                                                        if (statMod.hpBonus) {
                                                            const atkMod = calculateModifier(trainer.stats.atk || 3);
                                                            const defMod = calculateModifier(trainer.stats.def || 3);
                                                            let hp = 0;
                                                            if (statMod.hpBonus === 'full') hp = (atkMod + defMod) * 5;
                                                            else if (statMod.hpBonus === 'half') hp = (Math.floor(atkMod / 2) + Math.floor(defMod / 2)) * 5;
                                                            else if (statMod.hpBonus === 'mystic') hp = defMod * 3;
                                                            return <span style={{ fontSize: '11px', color: '#e53935' }}>(+{hp} Max HP)</span>;
                                                        }
                                                        if (statMod.choices) return <span style={{ fontSize: '11px', color: '#4caf50' }}>(+{statMod.value} to choice)</span>;
                                                        if (statMod.calculated) {
                                                            const base = trainer.stats[statMod.calculated.baseStat] || 3;
                                                            const val = Math.floor(calculateModifier(base) / 2);
                                                            return <span style={{ fontSize: '11px', color: '#4caf50' }}>(+{val} {STAT_LABELS[statMod.stat]})</span>;
                                                        }
                                                        return <span style={{ fontSize: '11px', color: '#4caf50' }}>(+{statMod.value} {STAT_LABELS[statMod.stat]})</span>;
                                                    })()}
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{data.category}</div>
                                                {(data.effect || data.description) && (
                                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                        {(data.effect || data.description).substring(0, 100)}…
                                                    </div>
                                                )}
                                            </div>
                                            {met ? (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleAddFeature(name); }}
                                                    style={{
                                                        flexShrink: 0, padding: '4px 12px', background: '#667eea',
                                                        color: 'white', border: 'none', borderRadius: '4px',
                                                        cursor: 'pointer', fontSize: '13px'
                                                    }}
                                                >
                                                    Add
                                                </button>
                                            ) : (
                                                <span style={{ fontSize: '16px', opacity: 0.4, flexShrink: 0 }}>🔒</span>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Custom feature button */}
                            <div style={{ marginTop: '10px', borderTop: '1px solid var(--border-light, #eee)', paddingTop: '8px' }}>
                                <button
                                    onClick={() => setShowCustomFeatureModal && setShowCustomFeatureModal(true)}
                                    style={{
                                        fontSize: '12px', background: 'none', border: '1px dashed var(--border-medium, #ddd)',
                                        borderRadius: '6px', padding: '6px 12px', cursor: 'pointer',
                                        color: 'var(--text-muted)', width: '100%'
                                    }}
                                >
                                    + Add Custom / GM-Granted Feature
                                </button>
                            </div>
                        </div>
                    )
                )}
            </>}

            {collapsed && (
                currentFeatures.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {currentFeatures.slice(0, 8).map((f, i) => {
                            const name = typeof f === 'object' ? f.name : f;
                            const featureData = GAME_DATA.features?.[name];
                            const isClassFeature = featureData && trainerClasses.includes(featureData.category);
                            return (
                                <span
                                    key={i}
                                    onClick={() => showDetail && showDetail('feature', name, featureData)}
                                    title={`View ${name} details`}
                                    style={{
                                        padding: '3px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold',
                                        background: isClassFeature
                                            ? 'linear-gradient(135deg, #667eea, #764ba2)'
                                            : 'linear-gradient(135deg, var(--poke-orange, #f5a623), var(--poke-orange-dark, #e8941c))',
                                        color: 'white', cursor: 'pointer'
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
                        No features yet — add a class to unlock features!
                    </p>
                )
            )}
        </div>
    );
};

export default TrainerFeatures;
