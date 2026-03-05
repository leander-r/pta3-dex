// ============================================================
// Trainer Features Component (PTA3)
// ============================================================
// Features are automatically granted when a class is taken or
// leveled up, and automatically removed when leveling down.
// Custom/GM-granted features can still be added manually.

import React, { useState, useMemo } from 'react';
import { useModal, useTrainerContext, useGameData, useUI } from '../../contexts/index.js';
import { HELP_BTN_STYLE } from '../common/helpBtnStyle.js';

// Features that modify trainer stats (preserved for display/removal logic)
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
 * TrainerFeatures — Shows automatically-managed class features.
 * Features are granted/removed automatically via TrainerContext level-up/down logic.
 * Only custom (GM-granted) features require manual management.
 */
const TrainerFeatures = () => {
    const { showDetail, setShowCustomFeatureModal } = useModal();
    const { trainer, setTrainer, pendingFeatureDrop, dropFeatureForStat, dismissFeatureDrop } = useTrainerContext();
    const { GAME_DATA } = useGameData();
    const { showHelp } = useUI();
    const [collapsed, setCollapsed] = useState(true);
    const [showUpcoming, setShowUpcoming] = useState(false);
    const [dropTarget, setDropTarget] = useState(null); // feature name selected to drop

    // Auto-expand when a feature drop is pending so the player sees the panel
    React.useEffect(() => {
        if (pendingFeatureDrop) { setCollapsed(false); setDropTarget(null); }
    }, [pendingFeatureDrop]);

    const currentFeatures = trainer.features || [];
    const trainerClasses = trainer.classes || [];
    const classLevels = trainer.classLevels || {};

    const ownedFeatureNames = useMemo(() =>
        new Set(currentFeatures.map(f => typeof f === 'object' ? f.name : f)),
        [currentFeatures]
    );

    // Upcoming features: those unlocking at classLevel + 1 for each class
    const upcomingFeatures = useMemo(() => {
        const results = [];
        Object.entries(classLevels).forEach(([cls, clvl]) => {
            const nextClvl = clvl + 1;
            Object.entries(GAME_DATA.features || {}).forEach(([name, data]) => {
                if (data.category !== cls) return;
                if (ownedFeatureNames.has(name)) return;
                const m = (data.prerequisites || '').match(/^Level (\d+)$/i);
                if (m && parseInt(m[1]) === nextClvl) {
                    results.push({ name, data, classLevel: nextClvl });
                }
            });
        });
        return results.sort((a, b) => a.name.localeCompare(b.name));
    }, [GAME_DATA.features, classLevels, ownedFeatureNames]);

    const handleRemoveCustomFeature = (featureName) => {
        const featureEntry = currentFeatures.find(f =>
            (typeof f === 'object' ? f.name : f) === featureName
        );

        let statReduction = null;
        if (featureEntry && typeof featureEntry === 'object' && featureEntry.statBoost) {
            statReduction = featureEntry.statBoost;
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

    const isCustomFeature = (featureName) => {
        return !GAME_DATA.features?.[featureName];
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
                    Features are automatically granted and removed as your classes level up or down.
                </p>

                {/* Feature Drop Panel — shown after level-up when drops are available */}
                {pendingFeatureDrop && (
                    <div style={{
                        marginBottom: '14px', padding: '12px',
                        background: 'linear-gradient(135deg, #fff3e0, #ffe0b2)',
                        border: '2px solid #f57c00', borderRadius: '8px'
                    }}>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#e65100', marginBottom: '6px' }}>
                            🔄 Feature Drop Available ({pendingFeatureDrop.dropsRemaining} remaining)
                        </div>
                        <p style={{ fontSize: '12px', margin: '0 0 8px 0', color: '#5d4037' }}>
                            You may drop one newly gained feature in exchange for +1 to a trainer stat.
                            Max 4 drops per career. This is optional — dismiss to keep all features.
                        </p>
                        {!dropTarget ? (
                            <>
                                <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                                    Select a feature to drop:
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                                    {pendingFeatureDrop.features.map(name => (
                                        <button
                                            key={name}
                                            onClick={() => setDropTarget(name)}
                                            style={{
                                                padding: '5px 10px', borderRadius: '6px', fontSize: '12px',
                                                background: '#f57c00', color: 'white', border: 'none',
                                                cursor: 'pointer', fontWeight: '600'
                                            }}
                                        >{name}</button>
                                    ))}
                                </div>
                                <button
                                    onClick={dismissFeatureDrop}
                                    style={{
                                        fontSize: '12px', background: 'none', border: '1px solid #bcaaa4',
                                        borderRadius: '6px', padding: '5px 12px', cursor: 'pointer',
                                        color: '#795548'
                                    }}
                                >Keep all features</button>
                            </>
                        ) : (
                            <>
                                <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                                    Drop <strong>{dropTarget}</strong> — choose stat to boost (+1):
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                                    {Object.entries(STAT_LABELS).map(([stat, label]) => {
                                        const val = trainer.stats[stat] || 1;
                                        const atCap = val >= 10;
                                        return (
                                            <button
                                                key={stat}
                                                onClick={() => { if (!atCap) { dropFeatureForStat(dropTarget, stat); setDropTarget(null); } }}
                                                disabled={atCap}
                                                style={{
                                                    padding: '5px 10px', borderRadius: '6px', fontSize: '12px',
                                                    background: atCap ? '#ddd' : 'linear-gradient(135deg, #667eea, #764ba2)',
                                                    color: atCap ? '#999' : 'white', border: 'none',
                                                    cursor: atCap ? 'not-allowed' : 'pointer', fontWeight: '600'
                                                }}
                                            >{label} ({val}→{Math.min(val + 1, 10)})</button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => setDropTarget(null)}
                                    style={{
                                        fontSize: '12px', background: 'none', border: '1px solid #bcaaa4',
                                        borderRadius: '6px', padding: '5px 12px', cursor: 'pointer',
                                        color: '#795548'
                                    }}
                                >← Back</button>
                            </>
                        )}
                    </div>
                )}

                {/* Current Features */}
                {currentFeatures.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
                        {trainerClasses.length === 0
                            ? 'Add a class above to unlock features.'
                            : 'No features yet — level up to gain features.'}
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
                        {currentFeatures.map((feature, index) => {
                            const featureName = typeof feature === 'object' ? feature.name : feature;
                            const featureData = GAME_DATA.features?.[featureName];
                            const isClass = !isCustomFeature(featureName);

                            return (
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 10px',
                                        background: isClass
                                            ? 'linear-gradient(135deg, #667eea, #764ba2)'
                                            : 'linear-gradient(135deg, var(--poke-orange, #f5a623), var(--poke-orange-dark, #e8941c))',
                                        borderRadius: '15px',
                                        color: 'white',
                                        fontSize: '12px',
                                        cursor: featureData ? 'pointer' : 'default'
                                    }}
                                    onClick={() => featureData && showDetail && showDetail('feature', featureName, featureData)}
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
                                    {/* Only custom features can be manually removed */}
                                    {isCustomFeature(featureName) && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRemoveCustomFeature(featureName); }}
                                            title="Remove custom feature"
                                            style={{
                                                background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
                                                width: '16px', height: '16px', color: 'white', cursor: 'pointer',
                                                fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                        >×</button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Upcoming Features */}
                {upcomingFeatures.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                        <button
                            onClick={() => setShowUpcoming(u => !u)}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: '12px', color: 'var(--text-muted)', padding: '4px 0',
                                display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                        >
                            <span style={{ display: 'inline-block', transform: showUpcoming ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', fontSize: '10px' }}>▶</span>
                            Unlocks at Level {(trainer.level || 0) + 1} ({upcomingFeatures.length} feature{upcomingFeatures.length !== 1 ? 's' : ''})
                        </button>
                        {showUpcoming && (
                            <div style={{ marginTop: '6px', padding: '8px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                                {upcomingFeatures.map(({ name, data }) => (
                                    <div
                                        key={name}
                                        style={{ fontSize: '12px', padding: '4px 0', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                        onClick={() => showDetail && showDetail('feature', name, data)}
                                    >
                                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{name}</span>
                                        <span style={{ marginLeft: '8px', color: 'var(--text-muted)' }}>{data.category}</span>
                                        {(data.effect || data.description) && (
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                                                {(data.effect || data.description).substring(0, 80)}…
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Custom / GM-granted feature */}
                <div style={{ borderTop: '1px solid var(--border-light, #eee)', paddingTop: '8px' }}>
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
            </>}

            {collapsed && (
                currentFeatures.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {currentFeatures.slice(0, 8).map((f, i) => {
                            const name = typeof f === 'object' ? f.name : f;
                            const featureData = GAME_DATA.features?.[name];
                            const isClass = !isCustomFeature(name);
                            return (
                                <span
                                    key={i}
                                    onClick={() => featureData && showDetail && showDetail('feature', name, featureData)}
                                    title={featureData ? `View ${name} details` : name}
                                    style={{
                                        padding: '3px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold',
                                        background: isClass
                                            ? 'linear-gradient(135deg, #667eea, #764ba2)'
                                            : 'linear-gradient(135deg, var(--poke-orange, #f5a623), var(--poke-orange-dark, #e8941c))',
                                        color: 'white', cursor: featureData ? 'pointer' : 'default'
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
