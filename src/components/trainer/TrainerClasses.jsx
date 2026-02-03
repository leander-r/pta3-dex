// ============================================================
// Trainer Classes Component
// ============================================================

import React, { useState } from 'react';
import { useTrainerContext, useGameData } from '../../contexts/index.js';

/**
 * TrainerClasses - Manage trainer classes
 * Uses contexts for state management
 */
const TrainerClasses = () => {
    const { trainer, setTrainer } = useTrainerContext();
    const { GAME_DATA } = useGameData();
    const maxClasses = trainer.level < 5 ? 1 : trainer.level < 12 ? 2 : trainer.level < 24 ? 3 : 4;
    const currentClasses = trainer.classes || [];

    // State for skill selection when adding a class
    const [pendingClass, setPendingClass] = useState(null);
    const [selectedClassSkills, setSelectedClassSkills] = useState([]);

    // Get skill pool for a class
    const getClassSkillPool = (className) => {
        const classData = GAME_DATA.trainerClasses?.[className];
        if (!classData?.skillPool) {
            // Default skill pools based on class type if not defined
            return Object.keys(GAME_DATA.skills || {});
        }
        return classData.skillPool;
    };

    // Get how many skills a class grants
    const getSkillCount = (className) => {
        const classData = GAME_DATA.trainerClasses?.[className];
        return classData?.type === 'base' ? 3 : 1;
    };

    // Helper to get skill rank from skills object (handles legacy array format)
    const getSkillRank = (skillName) => {
        const skills = trainer.skills || {};
        if (Array.isArray(skills)) {
            return skills.filter(s => s === skillName).length;
        }
        return skills[skillName] || 0;
    };

    // Check if a skill is already at max (rank 2, except HP skills which cap at rank 1)
    const isSkillMaxed = (skillName) => {
        const rank = getSkillRank(skillName);
        const skillData = GAME_DATA.skills?.[skillName];
        const isHPSkill = skillData?.stat === 'HP';
        return isHPSkill ? rank >= 1 : rank >= 2;
    };

    const handleRemoveClass = (cls) => {
        if (!confirm(`Remove ${cls} class? This will also remove associated skills and features.`)) {
            return;
        }

        const classData = GAME_DATA.trainerClasses[cls];
        const isBaseClass = classData?.type === 'base';
        const isFirstClass = currentClasses.indexOf(cls) === 0 && currentClasses.length > 0;

        // Find base features for this class that should be removed
        const baseFeaturesToRemove = isBaseClass ? Object.entries(GAME_DATA.features || {})
            .filter(([_, f]) => f.category === cls && f.isBase)
            .map(([name, _]) => name) : [];

        // Get skills that were granted by this class
        const classSkillsToRemove = (trainer.classSkills || {})[cls] || [];

        // Calculate feat point refund
        let featPointRefund = 0;
        if (!isFirstClass && currentClasses.length > 1) {
            featPointRefund = 1;
        }

        setTrainer(prev => {
            // Handle skills - convert legacy array to object if needed
            let prevSkills = prev.skills || {};
            if (Array.isArray(prevSkills)) {
                prevSkills = prevSkills.reduce((acc, s) => {
                    acc[s] = (acc[s] || 0) + 1;
                    return acc;
                }, {});
            }

            // Remove class skills by reducing rank
            const updatedSkills = { ...prevSkills };
            classSkillsToRemove.forEach(skillToRemove => {
                if (updatedSkills[skillToRemove]) {
                    updatedSkills[skillToRemove] -= 1;
                    if (updatedSkills[skillToRemove] <= 0) {
                        delete updatedSkills[skillToRemove];
                    }
                }
            });

            const newClassSkills = { ...(prev.classSkills || {}) };
            delete newClassSkills[cls];

            return {
                ...prev,
                classes: (prev.classes || []).filter(c => c !== cls),
                features: (prev.features || []).filter(f => !baseFeaturesToRemove.includes(f)),
                skills: updatedSkills,
                classSkills: newClassSkills,
                featPoints: (prev.featPoints || 0) + featPointRefund
            };
        });
    };

    const handleStartAddClass = () => {
        const select = document.getElementById('classSelectCombined');
        if (!select.value) return;

        const cls = select.value;
        const classData = GAME_DATA.trainerClasses[cls];
        const isFirstClass = currentClasses.length === 0;

        // Determine feat point cost
        let featPointChange = 0;
        if (classData?.type === 'base' && isFirstClass) {
            featPointChange = 2; // First base class grants 2 features
        } else if (currentClasses.length >= 1) {
            featPointChange = -1; // Additional classes cost 1 feat point
        }

        // Check if can afford
        if (featPointChange < 0 && (trainer.featPoints || 0) < Math.abs(featPointChange)) {
            alert('Not enough feat points for another class!');
            return;
        }

        // Check max classes
        if (currentClasses.length >= maxClasses) {
            alert(`Maximum ${maxClasses} class(es) at level ${trainer.level}`);
            return;
        }

        // Start skill selection process
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

        const classData = GAME_DATA.trainerClasses[pendingClass];
        const isBaseClass = classData?.type === 'base';
        const isFirstClass = currentClasses.length === 0;

        // Determine feat point cost
        let featPointChange = 0;
        if (isBaseClass && isFirstClass) {
            featPointChange = 2;
        } else if (currentClasses.length >= 1) {
            featPointChange = -1;
        }

        // Get base features for this class
        const baseFeatures = isBaseClass ? Object.entries(GAME_DATA.features || {})
            .filter(([_, f]) => f.category === pendingClass && f.isBase)
            .map(([name, _]) => name) : [];

        setTrainer(prev => {
            // Handle skills - convert legacy array to object if needed
            let prevSkills = prev.skills || {};
            if (Array.isArray(prevSkills)) {
                prevSkills = prevSkills.reduce((acc, s) => {
                    acc[s] = (acc[s] || 0) + 1;
                    return acc;
                }, {});
            }

            // Add selected skills (increment rank or add with rank 1)
            const updatedSkills = { ...prevSkills };
            selectedClassSkills.forEach(skill => {
                updatedSkills[skill] = (updatedSkills[skill] || 0) + 1;
            });

            return {
                ...prev,
                classes: [...(prev.classes || []), pendingClass],
                features: [...(prev.features || []), ...baseFeatures],
                featPoints: (prev.featPoints || 0) + featPointChange,
                skills: updatedSkills,
                classSkills: {
                    ...(prev.classSkills || {}),
                    [pendingClass]: selectedClassSkills
                }
            };
        });

        setPendingClass(null);
        setSelectedClassSkills([]);
    };

    const handleCancelClass = () => {
        setPendingClass(null);
        setSelectedClassSkills([]);
    };

    return (
        <div className="section-card-purple" style={{ marginBottom: '20px' }}>
            <h3 className="section-title-purple">
                <span>🎓</span> Classes
                <span className="text-muted" style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 'normal' }}>
                    {currentClasses.length === 0 ? 'First class grants +2 feat points!' : `${currentClasses.length}/${maxClasses} classes`}
                </span>
            </h3>
            <p className="section-description" style={{ fontSize: '11px' }}>
                Classes unlock features and skills. Lv1-4: 1 class | Lv5-11: 2 | Lv12-23: 3 | Lv24+: 4.
                {currentClasses.length >= 1 && ' Additional classes cost 1 feat point.'}
            </p>

            {/* Current Classes */}
            {currentClasses.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
                    {currentClasses.map((cls, index) => (
                        <div key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            borderRadius: '20px',
                            color: 'white'
                        }}>
                            <span className="font-bold">{cls}</span>
                            {GAME_DATA.trainerClasses[cls] && (
                                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>
                                    {GAME_DATA.trainerClasses[cls].type === 'base' ? 'Base' : 'Adv'}
                                </span>
                            )}
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
                    ))}
                </div>
            )}

            {/* Skill Selection Modal */}
            {pendingClass && (
                <div style={{
                    marginBottom: '15px',
                    padding: '15px',
                    background: 'var(--skill-picker-bg, linear-gradient(135deg, #e8f5e9, #c8e6c9))',
                    borderRadius: '8px',
                    border: '2px solid #4caf50'
                }}>
                    <div style={{ marginBottom: '10px' }}>
                        <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Adding: {pendingClass}</strong>
                        <span style={{
                            marginLeft: '8px',
                            padding: '2px 8px',
                            background: GAME_DATA.trainerClasses[pendingClass]?.type === 'base' ? '#667eea' : '#9c27b0',
                            color: 'white',
                            borderRadius: '10px',
                            fontSize: '11px'
                        }}>
                            {GAME_DATA.trainerClasses[pendingClass]?.type === 'base' ? 'Base' : 'Advanced'}
                        </span>
                    </div>
                    <div style={{ fontSize: '12px', marginBottom: '10px', color: 'var(--text-primary)' }}>
                        Select {getSkillCount(pendingClass)} skill{getSkillCount(pendingClass) > 1 ? 's' : ''} from the class skill pool:
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                            Trained skills add +2 to rolls. Getting the same skill twice adds another +2. HP skills can only be taken once.
                        </span>
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
                                        background: isSelected ? '#4caf50' : isMaxed ? 'var(--skill-btn-disabled-bg, #e0e0e0)' : alreadyHas ? 'var(--skill-btn-has-bg, #fff3e0)' : 'var(--skill-btn-bg, white)',
                                        color: isSelected ? 'white' : isMaxed ? 'var(--skill-btn-disabled-text, #999)' : 'var(--skill-btn-text, #333)',
                                        border: `2px solid ${isSelected ? '#4caf50' : isMaxed ? 'var(--skill-btn-disabled-border, #bdbdbd)' : alreadyHas ? '#ff9800' : 'var(--skill-btn-border, #ddd)'}`,
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
                                background: selectedClassSkills.length >= getSkillCount(pendingClass) ? '#4caf50' : '#ccc',
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
                            style={{
                                padding: '10px 20px',
                                background: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Add Class */}
            {!pendingClass && (
                <div className="input-row input-row-purple">
                    <select id="classSelectCombined">
                        <option value="">Add a class...</option>
                        <optgroup label="━━ Base Classes ━━">
                            {Object.entries(GAME_DATA.trainerClasses || {})
                                .filter(([_, data]) => data.type === 'base')
                                .map(([cls, _]) => (
                                    <option key={cls} value={cls} disabled={currentClasses.includes(cls)}>{cls}</option>
                                ))}
                        </optgroup>
                        <optgroup label="━━ Advanced Classes ━━">
                            {Object.entries(GAME_DATA.trainerClasses || {})
                                .filter(([_, data]) => data.type === 'advanced')
                                .map(([cls, _]) => (
                                    <option key={cls} value={cls} disabled={currentClasses.includes(cls)}>{cls}</option>
                                ))}
                        </optgroup>
                    </select>
                    <button className="btn btn-primary" onClick={handleStartAddClass}>
                        Add Class
                    </button>
                </div>
            )}
        </div>
    );
};

export default TrainerClasses;
