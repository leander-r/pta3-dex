// ============================================================
// Trainer Origin Component (PTA3, HB1 pp. 90-99)
// ============================================================
// Origins are a one-time chargen choice that grant skill talents and a
// free Origin Feature. Lifestyle/starting equipment/starting Pokémon are
// shown as reference text only — those are one-time choices the player
// applies to their own inventory/roster, not tracked ongoing state.

import React, { useState } from 'react';
import { useTrainerContext, useGameData, useModal, useUI } from '../../contexts/index.js';
import { HELP_BTN_STYLE } from '../common/helpBtnStyle.js';
import toast from '../../utils/toast.js';

const TrainerOrigin = () => {
    const { trainer, setTrainer } = useTrainerContext();
    const { GAME_DATA, customOrigins } = useGameData();
    const { showConfirm, showDetail, setShowCustomOriginModal, setEditingCustomOriginId } = useModal();
    const { showHelp } = useUI();
    const [collapsed, setCollapsed] = useState(true);
    const [pendingOrigin, setPendingOrigin] = useState(null);
    const [selectedByGroup, setSelectedByGroup] = useState({}); // { groupIndex: string[] }

    // Official origins are keyed by name in GAME_DATA.origins; custom ones are a
    // flat array (like customSpecies/customMoves) — look up by name in either.
    const getOriginData = (name) => {
        if (!name) return null;
        if (GAME_DATA.origins?.[name]) return GAME_DATA.origins[name];
        return customOrigins.find(o => o.name === name) || null;
    };

    // Official origins reference their feature by name (resolved against the remote
    // GAME_DATA.features catalog); custom origins carry the feature inline as
    // {name, effect} since there's no shared catalog entry for a homebrew feature.
    const getFeatureInfo = (origin) => {
        if (!origin?.feature) return null;
        if (typeof origin.feature === 'string') {
            return { name: origin.feature, data: GAME_DATA.features?.[origin.feature] };
        }
        return { name: origin.feature.name, data: origin.feature };
    };

    const currentOrigin = trainer.origin || '';
    const originData = getOriginData(currentOrigin);
    const pendingData = getOriginData(pendingOrigin);
    const currentFeatureInfo = getFeatureInfo(originData);
    const pendingFeatureInfo = getFeatureInfo(pendingData);

    const handleNewCustomOrigin = () => {
        if (setEditingCustomOriginId) setEditingCustomOriginId(null);
        setShowCustomOriginModal(true);
    };

    const getSkillRank = (skillName) => {
        const skills = trainer.skills || {};
        if (Array.isArray(skills)) return skills.filter(s => s === skillName).length;
        return skills[skillName] || 0;
    };
    const isSkillMaxed = (skillName) => getSkillRank(skillName) >= 2;

    const handleStartChoose = () => {
        const select = document.getElementById('originSelectCombined');
        if (!select?.value) return;
        setPendingOrigin(select.value);
        setSelectedByGroup({});
        select.value = '';
    };

    const handleCancel = () => {
        setPendingOrigin(null);
        setSelectedByGroup({});
    };

    const handleToggleSkill = (groupIndex, skillName, chooseN) => {
        setSelectedByGroup(prev => {
            const current = prev[groupIndex] || [];
            if (current.includes(skillName)) {
                return { ...prev, [groupIndex]: current.filter(s => s !== skillName) };
            }
            if (current.length < chooseN) {
                return { ...prev, [groupIndex]: [...current, skillName] };
            }
            return prev;
        });
    };

    const groups = pendingData?.skillTalents || [];
    const allFixedSkills = groups.flatMap(g => g.fixed || []);
    const readyToConfirm = groups.every((g, i) => {
        if (g.fixed) return true;
        return (selectedByGroup[i] || []).length >= (g.chooseN || 0);
    });

    const handleConfirm = () => {
        if (!pendingOrigin || !readyToConfirm) return;

        const chosenSkills = [
            ...allFixedSkills,
            ...groups.flatMap((g, i) => g.fixed ? [] : (selectedByGroup[i] || []))
        ];

        const existingFeatureNames = new Set(
            (trainer.features || []).map(f => typeof f === 'object' ? f.name : f)
        );
        const grantFeature = pendingFeatureInfo && !existingFeatureNames.has(pendingFeatureInfo.name);
        // Official origins grant the feature by name (resolved against GAME_DATA.features
        // elsewhere); custom origins have no catalog entry, so grant the full inline object.
        const featureToGrant = grantFeature
            ? (typeof pendingData.feature === 'string'
                ? pendingFeatureInfo.name
                : { name: pendingFeatureInfo.name, effect: pendingFeatureInfo.data?.effect, category: pendingFeatureInfo.data?.category || 'Custom Origin' })
            : null;

        setTrainer(prev => {
            let prevSkills = prev.skills || {};
            if (Array.isArray(prevSkills)) {
                prevSkills = prevSkills.reduce((acc, s) => { acc[s] = (acc[s] || 0) + 1; return acc; }, {});
            }
            const updatedSkills = { ...prevSkills };
            chosenSkills.forEach(skill => {
                const rank = updatedSkills[skill] || 0;
                if (rank < 2) updatedSkills[skill] = rank + 1;
            });

            return {
                ...prev,
                origin: pendingOrigin,
                originSkills: chosenSkills,
                skills: updatedSkills,
                features: featureToGrant ? [...(prev.features || []), featureToGrant] : (prev.features || [])
            };
        });

        toast.success(`${pendingOrigin} set as Origin! Gained ${chosenSkills.length} skill talent${chosenSkills.length !== 1 ? 's' : ''}${grantFeature ? ` and the ${pendingFeatureInfo.name} feature` : ''}.`);
        setPendingOrigin(null);
        setSelectedByGroup({});
    };

    const doRemoveOrigin = () => {
        const featureName = currentFeatureInfo?.name;
        const skillsToRemove = trainer.originSkills || [];

        setTrainer(prev => {
            let prevSkills = prev.skills || {};
            if (Array.isArray(prevSkills)) {
                prevSkills = prevSkills.reduce((acc, s) => { acc[s] = (acc[s] || 0) + 1; return acc; }, {});
            }
            const updatedSkills = { ...prevSkills };
            skillsToRemove.forEach(skill => {
                if (updatedSkills[skill]) {
                    updatedSkills[skill] -= 1;
                    if (updatedSkills[skill] <= 0) delete updatedSkills[skill];
                }
            });

            return {
                ...prev,
                origin: '',
                originSkills: [],
                skills: updatedSkills,
                features: (prev.features || []).filter(f => (typeof f === 'object' ? f.name : f) !== featureName)
            };
        });
    };

    const handleRemoveOrigin = () => {
        showConfirm({
            title: 'Remove Origin',
            message: `Remove ${currentOrigin}? This will also remove the skill talents and feature it granted.`,
            danger: true,
            onConfirm: doRemoveOrigin
        });
    };

    const renderGroupLabel = (g) => {
        if (g.fixed) return `Automatic: ${g.fixed.join(', ')}`;
        return `Choose ${g.chooseN}:`;
    };

    return (
        <div className="section-card-purple" style={{ marginBottom: '20px' }}>
            <h3 className="section-title-purple" onClick={() => setCollapsed(c => !c)} style={{ cursor: 'pointer', userSelect: 'none' }} aria-label="Origin">
                <span>📜</span> Origin
                <button
                    onClick={(e) => { e.stopPropagation(); showHelp('origin'); }}
                    style={HELP_BTN_STYLE}
                    aria-label="Help: Trainer Origin"
                    title="About trainer origins"
                >?</button>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="text-muted" style={{ fontSize: '12px', fontWeight: 'normal' }}>
                        {currentOrigin || 'None chosen'}
                    </span>
                    <button
                        onClick={(e) => { e.stopPropagation(); setCollapsed(c => !c); }}
                        aria-label={collapsed ? 'Expand Origin' : 'Collapse Origin'}
                        aria-expanded={!collapsed}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: 'inherit' }}
                    >
                        <span style={{ display: 'inline-block', transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', fontSize: '12px' }}>▼</span>
                    </button>
                </span>
            </h3>
            {!collapsed && <>
                <p className="section-description" style={{ fontSize: '12px' }}>
                    A one-time chargen choice. Grants skill talents and a free Origin Feature. Lifestyle, starting equipment,
                    and starting Pokémon are shown for reference — apply those yourself to your inventory/roster.
                </p>

                {/* Current Origin */}
                {currentOrigin && !pendingOrigin && (
                    <div style={{
                        padding: '12px', borderRadius: '8px', marginBottom: '10px',
                        background: 'var(--skill-picker-bg, linear-gradient(135deg, #e8f5e9, #c8e6c9))',
                        border: '2px solid var(--color-purple, #667eea)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{currentOrigin}</strong>
                            {currentFeatureInfo && (
                                <span
                                    onClick={() => showDetail && showDetail('feature', currentFeatureInfo.name, currentFeatureInfo.data)}
                                    style={{
                                        padding: '2px 8px', background: 'var(--poke-orange, #f5a623)', color: 'white',
                                        borderRadius: '10px', fontSize: '11px', cursor: currentFeatureInfo.data ? 'pointer' : 'default'
                                    }}
                                    title="View feature details"
                                >⚡ {currentFeatureInfo.name}</span>
                            )}
                            <span style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                                {originData?.isCustom && (
                                    <button
                                        onClick={() => { setEditingCustomOriginId(originData.id); setShowCustomOriginModal(true); }}
                                        style={{ background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '11px' }}
                                    >Edit</button>
                                )}
                                <button
                                    onClick={handleRemoveOrigin}
                                    style={{ background: '#f44336', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '11px' }}
                                >Remove</button>
                            </span>
                        </div>
                        {(trainer.originSkills || []).length > 0 && (
                            <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                                <strong>Skill talents:</strong> {trainer.originSkills.join(', ')}
                            </div>
                        )}
                        {originData && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                <div><strong>Lifestyle:</strong> {originData.lifestyle} ({originData.savings})</div>
                                <div><strong>Starting Equipment:</strong> {originData.startingEquipment}</div>
                                <div><strong>Starting Pokémon:</strong> {originData.startingPokemon}</div>
                                {originData.note && <div style={{ marginTop: '4px', fontStyle: 'italic' }}>{originData.note}</div>}
                            </div>
                        )}
                    </div>
                )}

                {/* Skill selection for pending origin */}
                {pendingOrigin && pendingData && (
                    <div style={{
                        marginBottom: '15px', padding: '15px', borderRadius: '8px',
                        background: 'var(--skill-picker-bg, linear-gradient(135deg, #e8f5e9, #c8e6c9))',
                        border: '2px solid var(--color-purple, #667eea)'
                    }}>
                        <strong style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block', marginBottom: '10px' }}>
                            Choosing: {pendingOrigin}
                        </strong>
                        {groups.length === 0 && (
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>This origin grants no skill talents.</p>
                        )}
                        {groups.map((g, i) => (
                            <div key={i} style={{ marginBottom: '10px' }}>
                                <div style={{ fontSize: '12px', marginBottom: '6px', color: 'var(--text-primary)' }}>
                                    {renderGroupLabel(g)}
                                </div>
                                {!g.fixed && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {g.pool.map(skillName => {
                                            const isSelected = (selectedByGroup[i] || []).includes(skillName);
                                            const isMaxed = isSkillMaxed(skillName);
                                            const currentRank = getSkillRank(skillName);
                                            const alreadyHas = currentRank > 0;
                                            return (
                                                <button
                                                    key={skillName}
                                                    onClick={() => !isMaxed && handleToggleSkill(i, skillName, g.chooseN)}
                                                    disabled={isMaxed}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: isSelected ? 'var(--poke-orange, #f5a623)' : isMaxed ? 'var(--skill-btn-disabled-bg, #e0e0e0)' : alreadyHas ? 'var(--skill-btn-has-bg, #fff3e0)' : 'var(--skill-btn-bg, white)',
                                                        color: isSelected ? 'white' : isMaxed ? 'var(--skill-btn-disabled-text, #999)' : 'var(--skill-btn-text, #333)',
                                                        border: `2px solid ${isSelected ? 'var(--poke-orange-dark, #e8941c)' : isMaxed ? 'var(--skill-btn-disabled-border, #bdbdbd)' : alreadyHas ? '#ff9800' : 'var(--skill-btn-border, #e0d0f0)'}`,
                                                        borderRadius: '20px', cursor: isMaxed ? 'not-allowed' : 'pointer', fontSize: '12px'
                                                    }}
                                                >
                                                    {skillName}
                                                    {alreadyHas && !isMaxed && <span style={{ marginLeft: '4px' }}>+1</span>}
                                                    {isMaxed && <span style={{ marginLeft: '4px' }}>(max)</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                        {pendingFeatureInfo && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '6px 0 12px' }}>
                                <strong>Feature:</strong> {pendingFeatureInfo.name}
                                {pendingFeatureInfo.data?.effect && ` — ${pendingFeatureInfo.data.effect}`}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={handleConfirm}
                                disabled={!readyToConfirm}
                                style={{
                                    flex: 1, padding: '10px',
                                    background: readyToConfirm ? 'linear-gradient(135deg, var(--poke-orange, #f5a623), var(--poke-orange-dark, #e8941c))' : '#ccc',
                                    color: 'white', border: 'none', borderRadius: '6px',
                                    cursor: readyToConfirm ? 'pointer' : 'not-allowed', fontWeight: 'bold'
                                }}
                            >Confirm Origin</button>
                            <button
                                onClick={handleCancel}
                                style={{ padding: '10px 20px', background: '#f44336', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                            >Cancel</button>
                        </div>
                    </div>
                )}

                {/* Choose Origin */}
                {!pendingOrigin && !currentOrigin && (
                    <>
                        <div className="input-row input-row-purple">
                            <select id="originSelectCombined">
                                <option value="">Choose an origin...</option>
                                <optgroup label="━━ Official (HB1) ━━">
                                    {Object.keys(GAME_DATA.origins || {}).sort().map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </optgroup>
                                {customOrigins.length > 0 && (
                                    <optgroup label="━━ Custom ━━">
                                        {customOrigins.map(o => (
                                            <option key={o.id} value={o.name}>{o.name}</option>
                                        ))}
                                    </optgroup>
                                )}
                            </select>
                            <button className="btn btn-primary" onClick={handleStartChoose}>
                                Choose Origin
                            </button>
                        </div>
                        <button
                            onClick={handleNewCustomOrigin}
                            style={{ marginTop: '8px', background: 'none', border: 'none', color: 'var(--color-purple, #667eea)', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline', padding: 0 }}
                        >+ Create a custom Origin</button>
                    </>
                )}
            </>}
            {collapsed && (
                currentOrigin ? (
                    <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white',
                        fontSize: '11px', fontWeight: 'bold'
                    }}>{currentOrigin}</span>
                ) : (
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No origin yet — pick one to gain skill talents and a free feature!
                    </p>
                )
            )}
        </div>
    );
};

export default TrainerOrigin;
