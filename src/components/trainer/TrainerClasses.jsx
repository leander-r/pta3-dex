// ============================================================
// Trainer Classes Component
// ============================================================

import React, { useState } from 'react';
import { useTrainerContext, useGameData, useModal, useUI } from '../../contexts/index.js';
import { HELP_BTN_STYLE } from '../common/helpBtnStyle.js';
import toast from '../../utils/toast.js';

/**
 * TrainerClasses - Manage trainer classes (PTA3)
 * Classes unlock features and skill talents. No feat point cost.
 */
const TrainerClasses = () => {
    const { trainer, setTrainer } = useTrainerContext();
    const { GAME_DATA } = useGameData();
    const { showConfirm } = useModal();
    const { showHelp } = useUI();
    // PTA3 class unlock levels: 1 at Lv1, 2 at Lv3, 3 at Lv7, 4 at Lv11
    const maxClasses = trainer.level < 3 ? 1 : trainer.level < 7 ? 2 : trainer.level < 11 ? 3 : 4;
    const currentClasses = trainer.classes || [];
    const classLevels = trainer.classLevels || {};

    const [pendingClass, setPendingClass] = useState(null);
    const [selectedClassSkills, setSelectedClassSkills] = useState([]);
    const [collapsed, setCollapsed] = useState(true);

    // Get skill pool for a class
    const getClassSkillPool = (className) => {
        const classData = GAME_DATA.trainerClasses?.[className];
        if (!classData?.skillPool?.length) {
            return Object.keys(GAME_DATA.skills || {});
        }
        return classData.skillPool;
    };

    // Determine if a class being added is a secondary base class
    // (trainer already has a base class → 1 talent only, no Level 15)
    const isSecondaryBaseClass = (className) => {
        const classData = GAME_DATA.trainerClasses?.[className];
        if (classData?.type !== 'base') return false;
        const existingBaseClasses = currentClasses.filter(c => GAME_DATA.trainerClasses?.[c]?.type === 'base');
        return existingBaseClasses.length > 0;
    };

    // How many skills a class grants (base = 2, advanced = 1; secondary base = 1)
    const getSkillCount = (className) => {
        const classData = GAME_DATA.trainerClasses?.[className];
        if (classData?.type !== 'base') return 1;
        return isSecondaryBaseClass(className) ? 1 : 2;
    };

    const getSkillRank = (skillName) => {
        const skills = trainer.skills || {};
        if (Array.isArray(skills)) return skills.filter(s => s === skillName).length;
        return skills[skillName] || 0;
    };

    const isSkillMaxed = (skillName) => {
        const rank = getSkillRank(skillName);
        const skillData = GAME_DATA.skills?.[skillName];
        const isPassive = skillData?.type === 'passive';
        return isPassive ? rank >= 1 : rank >= 2;
    };

    // Features granted immediately when a class is taken (Level 1 features)
    const getLevel1Features = (className) => {
        return Object.entries(GAME_DATA.features || {})
            .filter(([_, f]) => {
                if (f.category !== className) return false;
                if (!f.prerequisites) return true;
                const levelMatch = f.prerequisites.match(/^Level\s+(\d+)/i);
                return levelMatch && parseInt(levelMatch[1]) === 1;
            })
            .map(([name]) => name);
    };

    const handleRemoveClass = (cls) => {
        showConfirm({
            title: 'Remove Class',
            message: `Remove ${cls}? This will also remove all its features and skills.`,
            danger: true,
            onConfirm: () => doRemoveClass(cls)
        });
    };

    const doRemoveClass = (cls) => {
        const allClassFeatureNames = new Set(
            Object.entries(GAME_DATA.features || {})
                .filter(([_, data]) => data.category === cls)
                .map(([name]) => name)
        );
        const classSkillsToRemove = (trainer.classSkills || {})[cls] || [];

        setTrainer(prev => {
            let prevSkills = prev.skills || {};
            if (Array.isArray(prevSkills)) {
                prevSkills = prevSkills.reduce((acc, s) => {
                    acc[s] = (acc[s] || 0) + 1;
                    return acc;
                }, {});
            }

            const updatedSkills = { ...prevSkills };
            classSkillsToRemove.forEach(skillToRemove => {
                if (updatedSkills[skillToRemove]) {
                    updatedSkills[skillToRemove] -= 1;
                    if (updatedSkills[skillToRemove] <= 0) delete updatedSkills[skillToRemove];
                }
            });

            const newClassSkills = { ...(prev.classSkills || {}) };
            delete newClassSkills[cls];

            const newClassLevels = { ...(prev.classLevels || {}) };
            delete newClassLevels[cls];

            return {
                ...prev,
                classes: (prev.classes || []).filter(c => c !== cls),
                features: (prev.features || []).filter(f => {
                    const name = typeof f === 'object' ? f.name : f;
                    return !allClassFeatureNames.has(name);
                }),
                skills: updatedSkills,
                classSkills: newClassSkills,
                classLevels: newClassLevels,
                secondaryBaseClasses: (prev.secondaryBaseClasses || []).filter(c => c !== cls)
            };
        });
    };

    const handleStartAddClass = () => {
        const select = document.getElementById('classSelectCombined');
        if (!select.value) return;

        const cls = select.value;

        if (currentClasses.length >= maxClasses) {
            toast.warning(`Maximum ${maxClasses} class(es) at level ${trainer.level}. Level up to unlock more.`);
            return;
        }

        setPendingClass(cls);
        setSelectedClassSkills([]);
        select.value = '';
    };

    const handleToggleSkillSelection = (skillName) => {
        const maxSkills = getSkillCount(pendingClass);
        if (selectedClassSkills.includes(skillName)) {
            setSelectedClassSkills(prev => prev.filter(s => s !== skillName));
        } else if (selectedClassSkills.length < maxSkills) {
            setSelectedClassSkills(prev => [...prev, skillName]);
        }
    };

    const handleConfirmClass = () => {
        if (!pendingClass) return;

        const isSecondary = isSecondaryBaseClass(pendingClass);

        // Auto-grant Level 1 features (secondary base classes still get Level 1 features)
        const level1Features = getLevel1Features(pendingClass);
        const existingFeatureNames = new Set(
            (trainer.features || []).map(f => typeof f === 'object' ? f.name : f)
        );
        const newFeatures = level1Features.filter(f => !existingFeatureNames.has(f));

        setTrainer(prev => {
            let prevSkills = prev.skills || {};
            if (Array.isArray(prevSkills)) {
                prevSkills = prevSkills.reduce((acc, s) => {
                    acc[s] = (acc[s] || 0) + 1;
                    return acc;
                }, {});
            }

            const updatedSkills = { ...prevSkills };
            selectedClassSkills.forEach(skill => {
                updatedSkills[skill] = (updatedSkills[skill] || 0) + 1;
            });

            return {
                ...prev,
                classes: [...(prev.classes || []), pendingClass],
                features: [...(prev.features || []), ...newFeatures],
                skills: updatedSkills,
                classSkills: {
                    ...(prev.classSkills || {}),
                    [pendingClass]: selectedClassSkills
                },
                classLevels: {
                    ...(prev.classLevels || {}),
                    // Initial base class (taken at level 0) starts at 0 so it tracks with trainer level.
                    // Every other class (advanced or secondary base) always starts at 1 per PTA3 rules.
                    [pendingClass]: prev.level === 0 ? 0 : 1
                },
                primaryBaseClass: prev.primaryBaseClass
                    ? prev.primaryBaseClass
                    : ((prev.classes || []).length === 0 ? pendingClass : ''),
                secondaryBaseClasses: isSecondary
                    ? [...(prev.secondaryBaseClasses || []), pendingClass]
                    : (prev.secondaryBaseClasses || [])
            };
        });

        if (newFeatures.length > 0) {
            toast.success(`${pendingClass} added! Gained ${newFeatures.length} feature${newFeatures.length > 1 ? 's' : ''}: ${newFeatures.join(', ')}`);
        } else {
            toast.success(`${pendingClass} added!`);
        }

        setPendingClass(null);
        setSelectedClassSkills([]);
    };

    const handleCancelClass = () => {
        setPendingClass(null);
        setSelectedClassSkills([]);
    };

    return (
        <div className="section-card-purple" style={{ marginBottom: '20px' }}>
            <h3 className="section-title-purple" onClick={() => setCollapsed(c => !c)} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <span>🎓</span> Classes
                <button
                    onClick={(e) => { e.stopPropagation(); showHelp('classes'); }}
                    style={HELP_BTN_STYLE}
                    aria-label="Help: Trainer Classes"
                    title="About trainer classes"
                >?</button>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {currentClasses.length < maxClasses && (
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ff9800', background: '#ff980018', border: '1px solid #ff980060', borderRadius: '10px', padding: '1px 7px' }}>
                            {maxClasses - currentClasses.length} slot{maxClasses - currentClasses.length !== 1 ? 's' : ''} open
                        </span>
                    )}
                    <span className="text-muted" style={{ fontSize: '12px', fontWeight: 'normal' }}>
                        {currentClasses.length === 0 ? 'No class yet' : `${currentClasses.length}/${maxClasses} classes`}
                    </span>
                    <button
                        onClick={(e) => { e.stopPropagation(); setCollapsed(c => !c); }}
                        aria-label={collapsed ? 'Expand Classes' : 'Collapse Classes'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: 'inherit' }}
                    >
                        <span style={{ display: 'inline-block', transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', fontSize: '12px' }}>▼</span>
                    </button>
                </span>
            </h3>
            {!collapsed && <>
            <p className="section-description" style={{ fontSize: '12px' }}>
                Classes unlock features and skill talents. Lv 1: 1 class | Lv 3: 2 | Lv 7: 3 | Lv 11: 4.
                Level 1 features are granted automatically when a class is taken.
            </p>

            {/* Current Classes */}
            {currentClasses.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
                    {currentClasses.map((cls, index) => {
                        const clsLevel = classLevels[cls] ?? trainer.level;
                        const isPrimary = cls === (trainer.primaryBaseClass || currentClasses[0]);
                        const isSecondary = (trainer.secondaryBaseClasses || []).includes(cls);
                        const isBase = GAME_DATA.trainerClasses?.[cls]?.type === 'base';
                        const badgeLabel = isPrimary ? 'Primary' : isSecondary ? 'Secondary' : 'Adv';
                        const bg = isPrimary
                            ? 'linear-gradient(135deg, #f5a623, #e8941c)'
                            : isSecondary
                                ? 'linear-gradient(135deg, #4caf50, #388e3c)'
                                : 'linear-gradient(135deg, #667eea, #764ba2)';
                        return (
                            <div key={index} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 12px',
                                background: bg,
                                borderRadius: '20px',
                                color: 'white'
                            }}
                            title={isPrimary ? 'Primary base class — grants Level 15 capstone feature' : isSecondary ? 'Secondary base class — 1 talent, no Level 15 feature' : 'Advanced class'}
                            >
                                <span className="font-bold">{cls}</span>
                                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>
                                    {badgeLabel} · Lv {clsLevel}
                                </span>
                                <button
                                    onClick={() => handleRemoveClass(cls)}
                                    style={{
                                        background: 'rgba(255,255,255,0.2)',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '20px',
                                        height: '20px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Skill Selection for pending class */}
            {pendingClass && (
                <div style={{
                    marginBottom: '15px',
                    padding: '15px',
                    background: 'var(--skill-picker-bg, linear-gradient(135deg, #e8f5e9, #c8e6c9))',
                    borderRadius: '8px',
                    border: '2px solid var(--color-purple, #667eea)'
                }}>
                    <div style={{ marginBottom: '10px' }}>
                        <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Adding: {pendingClass}</strong>
                        <span style={{
                            marginLeft: '8px',
                            padding: '2px 8px',
                            background: GAME_DATA.trainerClasses?.[pendingClass]?.type === 'base' ? '#667eea' : '#9c27b0',
                            color: 'white',
                            borderRadius: '10px',
                            fontSize: '11px'
                        }}>
                            {GAME_DATA.trainerClasses?.[pendingClass]?.type === 'base' ? 'Base' : 'Advanced'}
                        </span>
                    </div>
                    <div style={{ fontSize: '12px', marginBottom: '10px', color: 'var(--text-primary)' }}>
                        Select {getSkillCount(pendingClass)} skill talent{getSkillCount(pendingClass) > 1 ? 's' : ''} from the class skill pool:
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                            1 talent = +2 bonus | 2 talents = +5 bonus | Passive skills cap at 1 talent.
                        </span>
                        {isSecondaryBaseClass(pendingClass) && (
                            <span style={{ color: '#e65100', fontSize: '11px', display: 'block', marginTop: '4px', fontWeight: '600' }}>
                                ⚠ Secondary base class: 1 talent only, and the Level 15 feature is not available.
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                        {getClassSkillPool(pendingClass).map(skillName => {
                            const isSelected = selectedClassSkills.includes(skillName);
                            const isMaxed = isSkillMaxed(skillName);
                            const currentRank = getSkillRank(skillName);
                            const alreadyHas = currentRank > 0;
                            return (
                                <button
                                    key={skillName}
                                    onClick={() => !isMaxed && handleToggleSkillSelection(skillName)}
                                    disabled={isMaxed}
                                    style={{
                                        padding: '6px 12px',
                                        background: isSelected ? 'var(--poke-orange, #f5a623)' : isMaxed ? 'var(--skill-btn-disabled-bg, #e0e0e0)' : alreadyHas ? 'var(--skill-btn-has-bg, #fff3e0)' : 'var(--skill-btn-bg, white)',
                                        color: isSelected ? 'white' : isMaxed ? 'var(--skill-btn-disabled-text, #999)' : 'var(--skill-btn-text, #333)',
                                        border: `2px solid ${isSelected ? 'var(--poke-orange-dark, #e8941c)' : isMaxed ? 'var(--skill-btn-disabled-border, #bdbdbd)' : alreadyHas ? '#ff9800' : 'var(--skill-btn-border, #e0d0f0)'}`,
                                        borderRadius: '20px',
                                        cursor: isMaxed ? 'not-allowed' : 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    {skillName}
                                    {alreadyHas && !isMaxed && <span style={{ marginLeft: '4px' }}>+1</span>}
                                    {isMaxed && <span style={{ marginLeft: '4px' }}>(max)</span>}
                                </button>
                            );
                        })}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={handleConfirmClass}
                            disabled={selectedClassSkills.length < getSkillCount(pendingClass)}
                            style={{
                                flex: 1,
                                padding: '10px',
                                background: selectedClassSkills.length >= getSkillCount(pendingClass) ? 'linear-gradient(135deg, var(--poke-orange, #f5a623), var(--poke-orange-dark, #e8941c))' : '#ccc',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: selectedClassSkills.length >= getSkillCount(pendingClass) ? 'pointer' : 'not-allowed',
                                fontWeight: 'bold'
                            }}
                        >
                            Confirm ({selectedClassSkills.length}/{getSkillCount(pendingClass)} selected)
                        </button>
                        <button
                            onClick={handleCancelClass}
                            style={{ padding: '10px 20px', background: '#f44336', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Add Class */}
            {!pendingClass && currentClasses.length >= maxClasses && (
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '8px', background: 'var(--bg-light)', borderRadius: '6px' }}>
                    Maximum {maxClasses} class{maxClasses > 1 ? 'es' : ''} reached at level {trainer.level}. Level up to unlock more.
                </p>
            )}
            {!pendingClass && currentClasses.length < maxClasses && (
                <div className="input-row input-row-purple">
                    <select id="classSelectCombined">
                        <option value="">Add a class...</option>
                        <optgroup label="━━ Base Classes ━━">
                            {Object.entries(GAME_DATA.trainerClasses || {})
                                .filter(([_, data]) => data.type === 'base')
                                .map(([cls]) => (
                                    <option key={cls} value={cls} disabled={currentClasses.includes(cls)}>{cls}</option>
                                ))}
                        </optgroup>
                        <optgroup label="━━ Advanced Classes ━━">
                            {Object.entries(GAME_DATA.trainerClasses || {})
                                .filter(([_, data]) => data.type === 'advanced')
                                .map(([cls]) => (
                                    <option key={cls} value={cls} disabled={currentClasses.includes(cls)}>{cls}</option>
                                ))}
                        </optgroup>
                    </select>
                    <button className="btn btn-primary" onClick={handleStartAddClass}>
                        Add Class
                    </button>
                </div>
            )}
            </>}
            {collapsed && (
                currentClasses.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {currentClasses.map((cls, i) => {
                            const clsLevel = classLevels[cls] ?? trainer.level;
                            return (
                                <span key={i} style={{
                                    padding: '3px 10px', borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                    color: 'white', fontSize: '11px', fontWeight: 'bold'
                                }}>
                                    {cls}
                                    <span style={{ opacity: 0.75, marginLeft: '4px', fontSize: '10px' }}>
                                        (Lv {clsLevel})
                                    </span>
                                </span>
                            );
                        })}
                    </div>
                ) : (
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No classes yet — add a class to unlock features!
                    </p>
                )
            )}
        </div>
    );
};

export default TrainerClasses;
