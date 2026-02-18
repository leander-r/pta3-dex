// ============================================================
// Skill Picker Modal Component
// ============================================================
// Modal for picking skills when adding a trainer class

import React from 'react';
import useModalKeyboard from '../../hooks/useModalKeyboard.js';
import { useUI, useTrainerContext, useGameData } from '../../contexts/index.js';

/**
 * SkillPickerModal - Modal for picking skills when adding a trainer class
 * Uses UIContext for modal state, TrainerContext for updating trainer, GameDataContext for skills data
 */
const SkillPickerModal = () => {
    // Get from contexts
    const { skillPickerModal, setSkillPickerModal } = useUI();
    const { setTrainer } = useTrainerContext();
    const { GAME_DATA } = useGameData();
    const handleClose = () => setSkillPickerModal({ ...skillPickerModal, show: false });

    const { modalRef } = useModalKeyboard(skillPickerModal.show, handleClose);

    if (!skillPickerModal.show) return null;

    const handleSkillToggle = (skill) => {
        const isSelected = skillPickerModal.selectedSkills.includes(skill);
        const canSelect = isSelected || skillPickerModal.selectedSkills.length < skillPickerModal.skillCount;

        if (isSelected) {
            setSkillPickerModal(prev => ({
                ...prev,
                selectedSkills: prev.selectedSkills.filter(s => s !== skill)
            }));
        } else if (canSelect) {
            setSkillPickerModal(prev => ({
                ...prev,
                selectedSkills: [...prev.selectedSkills, skill]
            }));
        }
    };

    const handleConfirm = () => {
        if (skillPickerModal.selectedSkills.length !== skillPickerModal.skillCount) {
            alert(`Please select exactly ${skillPickerModal.skillCount} skill(s)`);
            return;
        }

        const { cls, baseFeatures, featPointChange, isBaseClass } = skillPickerModal.pendingClassData;

        setTrainer(prev => {
            const existingFeatures = prev.features || [];
            const newFeatures = baseFeatures.filter(f => !existingFeatures.includes(f));

            // Handle legacy array format for skills
            const prevSkills = prev.skills || {};
            const skillsObj = Array.isArray(prevSkills)
                ? prevSkills.reduce((acc, s) => ({ ...acc, [s]: 1 }), {})
                : prevSkills;

            // Add new skills with rank 1
            const newSkills = skillPickerModal.selectedSkills.reduce((acc, skill) => {
                acc[skill] = 1;
                return acc;
            }, {});

            return {
                ...prev,
                classes: [...(prev.classes || []), cls],
                features: [...existingFeatures, ...newFeatures],
                skills: { ...skillsObj, ...newSkills },
                classSkills: {
                    ...(prev.classSkills || {}),
                    [cls]: skillPickerModal.selectedSkills
                },
                featPoints: (prev.featPoints || 0) + featPointChange
            };
        });

        setSkillPickerModal({
            show: false,
            className: '',
            skillPool: [],
            skillCount: 0,
            selectedSkills: [],
            pendingClassData: null
        });
    };

    return (
        <div className="modal-overlay" onClick={handleClose} role="presentation">
            <div
                ref={modalRef}
                className="modal"
                style={{ maxWidth: '500px' }}
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="skill-picker-modal-title"
            >
                <div
                    className="modal-header"
                    style={{
                        background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
                        color: 'white',
                        margin: '-25px -25px 20px -25px',
                        padding: '18px 20px',
                        borderRadius: '17px 17px 0 0',
                        borderBottom: 'none'
                    }}
                >
                    <h3
                        id="skill-picker-modal-title"
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
                        <span style={{ fontSize: '22px' }}>🎯</span>
                        Pick Skills for {skillPickerModal.className}
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

                <div className="p-20">
                    <p style={{ marginBottom: '15px', color: '#666' }}>
                        Select <strong>{skillPickerModal.skillCount}</strong> skill{skillPickerModal.skillCount > 1 ? 's' : ''} from the {skillPickerModal.className} skill pool:
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
                        {skillPickerModal.skillPool.map(skill => {
                            const isSelected = skillPickerModal.selectedSkills.includes(skill);
                            const skillData = GAME_DATA.skills[skill];
                            const canSelect = isSelected || skillPickerModal.selectedSkills.length < skillPickerModal.skillCount;

                            return (
                                <button
                                    key={skill}
                                    onClick={() => handleSkillToggle(skill)}
                                    style={{
                                        padding: '12px',
                                        border: isSelected ? '2px solid #4caf50' : '2px solid #ddd',
                                        borderRadius: '8px',
                                        background: isSelected ? '#e8f5e9' : (canSelect ? 'white' : '#f5f5f5'),
                                        cursor: canSelect || isSelected ? 'pointer' : 'not-allowed',
                                        opacity: canSelect || isSelected ? 1 : 0.5,
                                        textAlign: 'left'
                                    }}
                                >
                                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                        {isSelected && '✓ '}{skill}
                                    </div>
                                    <div className="text-muted-sm">
                                        {skillData?.stat || ''} • {skillData?.description?.substring(0, 50)}...
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex-between">
                        <span style={{
                            color: skillPickerModal.selectedSkills.length === skillPickerModal.skillCount ? '#4caf50' : '#ff9800'
                        }}>
                            Selected: {skillPickerModal.selectedSkills.length} / {skillPickerModal.skillCount}
                        </span>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={handleClose}
                                style={{
                                    padding: '10px 20px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    background: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={skillPickerModal.selectedSkills.length !== skillPickerModal.skillCount}
                                className="btn btn-primary"
                                style={{
                                    padding: '10px 20px',
                                    opacity: skillPickerModal.selectedSkills.length === skillPickerModal.skillCount ? 1 : 0.5
                                }}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkillPickerModal;
