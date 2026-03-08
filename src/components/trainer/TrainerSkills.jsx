// ============================================================
// Trainer Skills Component (PTA3)
// ============================================================

import React, { useState, useMemo } from 'react';
import { useTrainerContext, useGameData, useModal, useUI } from '../../contexts/index.js';
import { HELP_BTN_STYLE } from '../common/helpBtnStyle.js';

const SKILL_STATS = ['ATK', 'DEF', 'SATK', 'SDEF', 'SPD'];

// PTA3 talent bonus: 0 talents → +0, 1 talent → +2, 2 talents → +5
const TALENT_BONUS = [0, 2, 5];

const getSkillTalents = (skills, skillName) => {
    if (!skills) return 0;
    if (Array.isArray(skills)) return skills.includes(skillName) ? 1 : 0;
    return skills[skillName] || 0;
};

const countTrainedSkills = (skills) => {
    if (!skills) return 0;
    if (Array.isArray(skills)) return skills.length;
    return Object.values(skills).filter(t => t > 0).length;
};

const getTrainedSkillsList = (skills) => {
    if (!skills) return [];
    if (Array.isArray(skills)) return skills.map(name => ({ name, talents: 1 }));
    return Object.entries(skills)
        .filter(([_, t]) => t > 0)
        .map(([name, talents]) => ({ name, talents }));
};

/**
 * Calculate PTA3 skill check total for display:
 * 1d20 + ⌊stat/2⌋ + talent bonus
 */
const getSkillCheckBonus = (statValue, talents) => {
    const mod = Math.floor((statValue || 0) / 2);
    return mod + (TALENT_BONUS[talents] || 0);
};

/**
 * TrainerSkills - Manage trainer skills (PTA3: 18 skills, talent system)
 */
const TrainerSkills = () => {
    const { trainer, setTrainer } = useTrainerContext();
    const { GAME_DATA } = useGameData();
    const { showHelp } = useUI();
    const { showDetail } = useModal();
    const currentSkills = trainer.skills || {};

    const handleCycleTalents = (skillName, isPassive) => {
        const currentTalents = getSkillTalents(currentSkills, skillName);
        // Passive skills (Concentration, Constitution): max 1 talent (toggle)
        // Other skills: 0 → 1 → 2 → 0
        const maxTalents = isPassive ? 1 : 2;
        const newTalents = currentTalents >= maxTalents ? 0 : currentTalents + 1;

        setTrainer(prev => {
            const prevSkills = prev.skills || {};
            const skillsObj = Array.isArray(prevSkills)
                ? prevSkills.reduce((acc, s) => ({ ...acc, [s]: 1 }), {})
                : prevSkills;

            if (newTalents === 0) {
                const { [skillName]: _removed, ...rest } = skillsObj;
                return { ...prev, skills: rest };
            }
            return { ...prev, skills: { ...skillsObj, [skillName]: newTalents } };
        });
    };

    // Skills available from the trainer's current class pools
    const classPoolSkills = useMemo(() => {
        const pool = new Set();
        (trainer.classes || []).forEach(cls => {
            const classData = GAME_DATA.trainerClasses?.[cls];
            const skills = classData?.skillPool;
            if (skills?.length) skills.forEach(s => pool.add(s));
            else Object.keys(GAME_DATA.skills || {}).forEach(s => pool.add(s)); // open pool
        });
        return pool;
    }, [trainer.classes, GAME_DATA.trainerClasses, GAME_DATA.skills]);

    // Group skills by stat
    const skillsByStat = SKILL_STATS.reduce((acc, stat) => {
        acc[stat] = Object.entries(GAME_DATA.skills || {})
            .filter(([_, data]) => data.stat === stat)
            .map(([name, data]) => ({ name, ...data }));
        return acc;
    }, {});

    const trainedCount = countTrainedSkills(currentSkills);
    const trainedList = getTrainedSkillsList(currentSkills);
    const [collapsed, setCollapsed] = useState(true);

    const statColors = {
        ATK: '#ff5722', DEF: '#2196f3', SATK: '#9c27b0', SDEF: '#ff9800', SPD: '#00bcd4'
    };

    return (
        <div className="section-card-purple" style={{ marginBottom: '20px' }}>
            <h3 className="section-title-purple" onClick={() => setCollapsed(c => !c)} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <span>🎯</span> Skills
                <button
                    onClick={(e) => { e.stopPropagation(); showHelp('trainer-skills'); }}
                    style={HELP_BTN_STYLE}
                    aria-label="Help: Trainer Skills"
                    title="About trainer skills"
                >?</button>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="text-muted" style={{ fontSize: '12px', fontWeight: 'normal' }}>
                        {trainedCount} trained skills
                    </span>
                    <button
                        onClick={(e) => { e.stopPropagation(); setCollapsed(c => !c); }}
                        aria-label={collapsed ? 'Expand Skills' : 'Collapse Skills'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: 'inherit' }}
                    >
                        <span style={{ display: 'inline-block', transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', fontSize: '12px' }}>▼</span>
                    </button>
                </span>
            </h3>

            {!collapsed && (
                <>
                    <p className="section-description">
                        Click skills to cycle talents (0→1→2). Passive skills max at 1 talent.
                        <br />
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Roll: 1d20 + ⌊stat/2⌋ | 1 talent: +2 bonus | 2 talents: +5 bonus
                        </span>
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' }}>
                        {SKILL_STATS.map(stat => {
                            const statKey = stat.toLowerCase();
                            const statValue = trainer.stats[statKey] ?? 3;
                            const color = statColors[stat];

                            return (
                                <div key={stat} className="bg-light" style={{ borderRadius: '8px', padding: '10px' }}>
                                    <div style={{
                                        fontWeight: 'bold',
                                        fontSize: '12px',
                                        color,
                                        marginBottom: '8px',
                                        borderBottom: '1px solid var(--border-light, #ddd)',
                                        paddingBottom: '4px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span>{stat} Skills</span>
                                        <span style={{ fontSize: '11px', opacity: 0.7 }}>mod +{Math.floor(statValue / 2)}</span>
                                    </div>

                                    {(skillsByStat[stat] || []).map(skill => {
                                        const talents = getSkillTalents(currentSkills, skill.name);
                                        const isTrained = talents > 0;
                                        const isPassive = skill.type === 'passive';
                                        const maxTalents = isPassive ? 1 : 2;
                                        const bonus = getSkillCheckBonus(statValue, talents);
                                        const inClassPool = classPoolSkills.size > 0 && classPoolSkills.has(skill.name);

                                        return (
                                            <div
                                                key={skill.name}
                                                onClick={() => handleCycleTalents(skill.name, isPassive)}
                                                className={!isTrained ? 'skill-list-item' : ''}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '6px 8px',
                                                    marginBottom: '4px',
                                                    background: isTrained
                                                        ? talents === 2
                                                            ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)'
                                                            : 'linear-gradient(135deg, #667eea, #764ba2)'
                                                        : undefined,
                                                    color: isTrained ? 'white' : undefined,
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                title={`${skill.description}\n\nRoll: 1d20 + ${Math.floor(statValue / 2)}${talents > 0 ? ' + ' + TALENT_BONUS[talents] : ''}${isPassive ? '\n\nPassive — invoked by the GM, not rolled. Capped at 1 talent.' : ''}\n\nClick to cycle talents (${talents}/${maxTalents})`}
                                            >
                                                {/* Talent indicator */}
                                                <span style={{ display: 'flex', gap: '2px', minWidth: isPassive ? '17px' : '30px' }}>
                                                    {[...Array(maxTalents)].map((_, i) => (
                                                        <span
                                                            key={i}
                                                            style={{
                                                                width: '13px',
                                                                height: '13px',
                                                                borderRadius: '50%',
                                                                border: isTrained ? 'none' : '2px solid var(--border-medium, #ddd)',
                                                                background: i < talents
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
                                                    {isPassive && (
                                                        <span style={{ marginLeft: '4px', fontSize: '10px', opacity: 0.8 }}>(Passive)</span>
                                                    )}
                                                </span>

                                                {!isTrained && inClassPool && (
                                                    <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '8px', background: '#667eea22', color: '#667eea', border: '1px solid #667eea44', flexShrink: 0 }} title="In your class skill pool — can be taken when adding a class">
                                                        pool
                                                    </span>
                                                )}
                                                {isTrained && (
                                                    <span style={{
                                                        fontSize: '12px',
                                                        opacity: 0.9,
                                                        background: 'rgba(255,255,255,0.2)',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px'
                                                    }}>
                                                        {isPassive ? 'Passive' : `+${bonus}`}
                                                    </span>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        showDetail && showDetail('skill', skill.name, GAME_DATA.skills?.[skill.name]);
                                                    }}
                                                    title={`View ${skill.name} details`}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        opacity: 0.7,
                                                        padding: '0 2px',
                                                        color: isTrained ? 'white' : 'var(--text-muted)'
                                                    }}
                                                >
                                                    ℹ
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {collapsed && (
                trainedCount > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {trainedList.map(({ name, talents }) => (
                            <span
                                key={name}
                                onClick={() => showDetail && showDetail('skill', name, GAME_DATA.skills?.[name])}
                                title={`View ${name} details`}
                                style={{
                                    padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold',
                                    background: talents === 2
                                        ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)'
                                        : 'linear-gradient(135deg, #667eea, #764ba2)',
                                    color: 'white', cursor: 'pointer'
                                }}
                            >
                                {name}{talents === 2 && <span style={{ marginLeft: '3px', opacity: 0.85 }}>★★</span>}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No trained skills yet
                    </p>
                )
            )}
        </div>
    );
};

export default TrainerSkills;
