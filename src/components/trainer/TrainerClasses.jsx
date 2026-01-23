// ============================================================
// Trainer Classes Component
// ============================================================

import React from 'react';

const TrainerClasses = ({ trainer, setTrainer, GAME_DATA }) => {
    const maxClasses = trainer.level < 5 ? 1 : trainer.level < 12 ? 2 : trainer.level < 24 ? 3 : 4;
    const currentClasses = trainer.classes || [];

    const handleRemoveClass = (cls) => {
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
            let updatedSkills = [...(prev.skills || [])];
            classSkillsToRemove.forEach(skillToRemove => {
                const idx = updatedSkills.indexOf(skillToRemove);
                if (idx !== -1) {
                    updatedSkills.splice(idx, 1);
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

    const handleAddClass = () => {
        const select = document.getElementById('classSelectCombined');
        if (!select.value) return;

        const cls = select.value;
        const classData = GAME_DATA.trainerClasses[cls];
        const isBaseClass = classData?.type === 'base';
        const isFirstClass = currentClasses.length === 0;

        // Determine feat point cost
        let featPointChange = 0;
        if (isBaseClass && isFirstClass) {
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

        // Get base features for this class
        const baseFeatures = isBaseClass ? Object.entries(GAME_DATA.features || {})
            .filter(([_, f]) => f.category === cls && f.isBase)
            .map(([name, _]) => name) : [];

        setTrainer(prev => ({
            ...prev,
            classes: [...(prev.classes || []), cls],
            features: [...(prev.features || []), ...baseFeatures],
            featPoints: (prev.featPoints || 0) + featPointChange
        }));

        select.value = '';
    };

    return (
        <div className="section-card-purple" style={{ marginBottom: '20px' }}>
            <h3 className="section-title-purple">
                <span>🎓</span> Classes
                <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 'normal', color: '#666' }}>
                    {currentClasses.length === 0 ? 'First class grants +2 feat points!' : `${currentClasses.length}/${maxClasses} classes`}
                </span>
            </h3>

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

            {/* Add Class */}
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
                <button className="btn btn-primary" onClick={handleAddClass}>
                    Add Class
                </button>
            </div>
        </div>
    );
};

export default TrainerClasses;
