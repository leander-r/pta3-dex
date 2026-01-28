// ============================================================
// Trainer Skills Component
// ============================================================

import React from 'react';

const SKILL_STATS = ['HP', 'ATK', 'DEF', 'SATK', 'SDEF', 'SPD'];

// Helper to get skill rank from skills object (handles legacy array format)
const getSkillRank = (skills, skillName) => {
    if (!skills) return 0;
    if (Array.isArray(skills)) {
        return skills.includes(skillName) ? 1 : 0;
    }
    return skills[skillName] || 0;
};

// Helper to count trained skills
const countTrainedSkills = (skills) => {
    if (!skills) return 0;
    if (Array.isArray(skills)) return skills.length;
    return Object.values(skills).filter(rank => rank > 0).length;
};

// Helper to get trained skill names with ranks
const getTrainedSkillsList = (skills) => {
    if (!skills) return [];
    if (Array.isArray(skills)) {
        return skills.map(name => ({ name, rank: 1 }));
    }
    return Object.entries(skills)
        .filter(([_, rank]) => rank > 0)
        .map(([name, rank]) => ({ name, rank }));
};

// Calculate skill bonus based on PTA rules
const calculateSkillBonus = (rank, statValue) => {
    if (rank === 0) return null;

    // Calculate stat modifier (same formula as useTrainer)
    let modifier;
    if (statValue === 10) modifier = 0;
    else if (statValue < 10) modifier = -(10 - statValue);
    else modifier = Math.floor((statValue - 10) / 2);

    // Rank 1: +2 + modifier
    // Rank 2: +4 + (2 × modifier)
    const baseBonus = rank * 2;
    const modBonus = rank * modifier;
    return baseBonus + modBonus;
};

const TrainerSkills = ({ trainer, setTrainer, GAME_DATA }) => {
    const currentSkills = trainer.skills || {};

    const handleCycleRank = (skillName, isHPSkill) => {
        const currentRank = getSkillRank(currentSkills, skillName);
        let newRank;

        if (isHPSkill) {
            // HP skills cap at rank 1: 0 → 1 → 0
            newRank = currentRank === 0 ? 1 : 0;
        } else {
            // Other skills: 0 → 1 → 2 → 0
            newRank = (currentRank + 1) % 3;
        }

        setTrainer(prev => {
            const prevSkills = prev.skills || {};
            // Handle legacy array format
            const skillsObj = Array.isArray(prevSkills)
                ? prevSkills.reduce((acc, s) => ({ ...acc, [s]: 1 }), {})
                : prevSkills;

            if (newRank === 0) {
                const { [skillName]: removed, ...rest } = skillsObj;
                return { ...prev, skills: rest };
            }
            return {
                ...prev,
                skills: { ...skillsObj, [skillName]: newRank }
            };
        });
    };

    // Group skills by stat
    const skillsByStat = SKILL_STATS.reduce((acc, stat) => {
        acc[stat] = Object.entries(GAME_DATA.skills || {})
            .filter(([_, data]) => data.stat === stat)
            .map(([name, data]) => ({ name, ...data }));
        return acc;
    }, {});

    const trainedCount = countTrainedSkills(currentSkills);
    const trainedList = getTrainedSkillsList(currentSkills);

    return (
        <div className="section-card-purple" style={{ marginBottom: '20px' }}>
            <h3 className="section-title-purple">
                <span>🎯</span> Skills
                <span className="text-muted" style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 'normal' }}>
                    {trainedCount} trained skills
                </span>
            </h3>

            <p className="section-description">
                Click skills to cycle ranks (0→1→2). HP skills max at rank 1.
                <br />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Rank 1: +2 + Stat Mod | Rank 2: +4 + (2×Stat Mod)
                </span>
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' }}>
                {SKILL_STATS.map(stat => {
                    const statKey = stat.toLowerCase();
                    const statValue = trainer.stats[statKey] || 6;
                    const isHPStat = stat === 'HP';

                    return (
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
                                borderBottom: '1px solid var(--border-light, #ddd)',
                                paddingBottom: '4px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span>{stat} Skills</span>
                                {isHPStat && <span style={{ fontSize: '10px', opacity: 0.7 }}>Max Rank 1</span>}
                            </div>

                            {skillsByStat[stat].map(skill => {
                                const rank = getSkillRank(currentSkills, skill.name);
                                const isTrained = rank > 0;
                                const bonus = isHPStat ? null : calculateSkillBonus(rank, statValue);
                                const maxRank = isHPStat ? 1 : 2;

                                return (
                                    <div
                                        key={skill.name}
                                        onClick={() => handleCycleRank(skill.name, isHPStat)}
                                        className={!isTrained ? 'skill-list-item' : ''}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '6px 8px',
                                            marginBottom: '4px',
                                            background: isTrained
                                                ? rank === 2
                                                    ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)'
                                                    : 'linear-gradient(135deg, #667eea, #764ba2)'
                                                : undefined,
                                            color: isTrained ? 'white' : undefined,
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            transition: 'all 0.2s ease'
                                        }}
                                        title={`${skill.description}\n\nClick to cycle rank (current: ${rank}/${maxRank})`}
                                    >
                                        {/* Rank indicator */}
                                        <span style={{
                                            display: 'flex',
                                            gap: '2px',
                                            minWidth: isHPStat ? '14px' : '24px'
                                        }}>
                                            {[...Array(maxRank)].map((_, i) => (
                                                <span
                                                    key={i}
                                                    style={{
                                                        width: '10px',
                                                        height: '10px',
                                                        borderRadius: '50%',
                                                        border: isTrained ? 'none' : '2px solid var(--border-medium, #ddd)',
                                                        background: i < rank
                                                            ? 'rgba(255,255,255,0.9)'
                                                            : isTrained
                                                                ? 'rgba(255,255,255,0.3)'
                                                                : 'transparent'
                                                    }}
                                                />
                                            ))}
                                        </span>

                                        <span style={{ fontWeight: isTrained ? 'bold' : 'normal', flex: 1 }}>
                                            {skill.name}
                                        </span>

                                        {/* Bonus display */}
                                        {isTrained && (
                                            <span style={{
                                                fontSize: '10px',
                                                opacity: 0.9,
                                                background: 'rgba(255,255,255,0.2)',
                                                padding: '2px 6px',
                                                borderRadius: '4px'
                                            }}>
                                                {isHPStat ? 'Passive' : (bonus >= 0 ? `+${bonus}` : bonus)}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>

            {/* Current Skills Summary */}
            {trainedCount > 0 && (
                <div className="skill-search-section" style={{ marginTop: '15px', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '6px', color: '#303f9f' }}>
                        Trained Skills:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {trainedList.map(({ name, rank }) => (
                            <span
                                key={name}
                                style={{
                                    padding: '3px 8px',
                                    background: rank === 2
                                        ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)'
                                        : 'linear-gradient(135deg, #667eea, #764ba2)',
                                    color: 'white',
                                    borderRadius: '10px',
                                    fontSize: '11px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                            >
                                {name}
                                {rank === 2 && <span style={{ opacity: 0.8 }}>★★</span>}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrainerSkills;
