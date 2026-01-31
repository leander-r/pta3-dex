// ============================================================
// Skill Picker Modal Component
// ============================================================
// Modal for picking skills when adding a trainer class

import React from 'react';
import useModalKeyboard from '../../hooks/useModalKeyboard.js';

const SkillPickerModal = ({
    skillPickerModal,
    setSkillPickerModal,
    setTrainer,
    GAME_DATA
}) => {
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

        console.log(`Added ${cls} with skills:`, skillPickerModal.selectedSkills);
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
                <div className="modal-header">
                    <h3 id="skill-picker-modal-title">🎯 Pick Skills for {skillPickerModal.className}</h3>
                    <button
                        onClick={handleClose}
                        aria-label="Close modal"
                        style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
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
