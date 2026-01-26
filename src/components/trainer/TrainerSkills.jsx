// ============================================================
// Trainer Skills Component
// ============================================================

import React from 'react';

const SKILL_STATS = ['HP', 'ATK', 'DEF', 'SATK', 'SDEF', 'SPD'];

const TrainerSkills = ({ trainer, setTrainer, GAME_DATA }) => {
    const currentSkills = trainer.skills || [];

    const handleToggleSkill = (skillName) => {
        if (currentSkills.includes(skillName)) {
            setTrainer(prev => ({
                ...prev,
                skills: (prev.skills || []).filter(s => s !== skillName)
            }));
        } else {
            setTrainer(prev => ({
                ...prev,
                skills: [...(prev.skills || []), skillName]
            }));
        }
    };

    // Group skills by stat
    const skillsByStat = SKILL_STATS.reduce((acc, stat) => {
        acc[stat] = Object.entries(GAME_DATA.skills || {})
            .filter(([_, data]) => data.stat === stat)
            .map(([name, data]) => ({ name, ...data }));
        return acc;
    }, {});

    return (
        <div className="section-card-purple" style={{ marginBottom: '20px' }}>
            <h3 className="section-title-purple">
                <span>🎯</span> Skills
                <span className="text-muted" style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 'normal' }}>
                    {currentSkills.length} trained skills
                </span>
            </h3>

            <p className="section-description">
                Trained skills grant +2 bonus on skill checks. Click to toggle training.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                {SKILL_STATS.map(stat => (
                    <div key={stat} className="bg-light" style={{ borderRadius: '8px', padding: '10px' }}>
                        <div style={{
                            fontWeight: 'bold',
                            fontSize: '12px',
                            color: stat === 'HP' ? '#e53935' :
                                   stat === 'ATK' ? '#ff5722' :
                                   stat === 'DEF' ? '#2196f3' :
                                   stat === 'SATK' ? '#9c27b0' :
                                   stat === 'SDEF' ? '#ff9800' : '#00bcd4',
                            marginBottom: '8px',
                            borderBottom: '1px solid #ddd',
                            paddingBottom: '4px'
                        }}>
                            {stat} Skills
                        </div>

                        {skillsByStat[stat].map(skill => {
                            const isTrained = currentSkills.includes(skill.name);
                            return (
                                <div
                                    key={skill.name}
                                    onClick={() => handleToggleSkill(skill.name)}
                                    className={!isTrained ? 'skill-list-item' : ''}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '6px 8px',
                                        marginBottom: '4px',
                                        background: isTrained ? 'linear-gradient(135deg, #667eea, #764ba2)' : undefined,
                                        color: isTrained ? 'white' : undefined,
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        transition: 'all 0.2s ease'
                                    }}
                                    title={skill.description}
                                >
                                    <span style={{
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '4px',
                                        border: isTrained ? 'none' : '2px solid #ddd',
                                        background: isTrained ? 'rgba(255,255,255,0.3)' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '10px'
                                    }}>
                                        {isTrained ? '✓' : ''}
                                    </span>
                                    <span style={{ fontWeight: isTrained ? 'bold' : 'normal' }}>{skill.name}</span>
                                    {isTrained && <span style={{ marginLeft: 'auto', fontSize: '10px', opacity: 0.8 }}>+2</span>}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Current Skills Summary */}
            {currentSkills.length > 0 && (
                <div className="skill-search-section" style={{ marginTop: '15px', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '6px', color: '#303f9f' }}>
                        Trained Skills:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {currentSkills.map(skill => (
                            <span
                                key={skill}
                                style={{
                                    padding: '3px 8px',
                                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                    color: 'white',
                                    borderRadius: '10px',
                                    fontSize: '11px'
                                }}
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrainerSkills;
