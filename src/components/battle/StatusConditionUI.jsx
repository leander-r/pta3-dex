import React from 'react';

const CONDITIONS = [
    { key: 'burned',    label: 'Burned',    icon: '🔥', color: '#f44336', desc: 'ATK −2. Takes 2 damage at end of each round.' },
    { key: 'frozen',    label: 'Frozen',    icon: '🧊', color: '#42a5f5', desc: 'Cannot use moves. Thaws on 1/6 roll (1 on d6) at start of turn or when hit by Fire.' },
    { key: 'paralyzed', label: 'Paralyzed', icon: '⚡', color: '#ffc107', desc: 'SPD halved. 1/6 chance to fail action each turn (1 on d6).' },
    { key: 'poisoned',  label: 'Poisoned',  icon: '☠️', color: '#9c27b0', desc: 'Takes increasing poison damage at end of each round (1, 2, 3, … per round).' },
    { key: 'asleep',    label: 'Asleep',    icon: '💤', color: '#607d8b', desc: 'Cannot act. Wakes on 1/6 roll (1 on d6) at start of turn.' },
    { key: 'confused',  label: 'Confused',  icon: '💫', color: '#ff9800', desc: 'When using a damaging move, roll 1d6: on a 1 hits itself instead.' },
    { key: 'flinched',  label: 'Flinched',  icon: '😵', color: '#795548', desc: 'Cannot use moves this turn. Wears off at end of round.' },
    { key: 'fainted',   label: 'Fainted',   icon: '✖',  color: '#333',    desc: 'HP reduced to 0. Out of battle until healed.' },
];

const StatusConditionUI = ({ selectedPokemon, updatePokemon }) => {
    if (!selectedPokemon) return null;
    const conditions = selectedPokemon.statusConditions || {};

    return (
        <div style={{ marginBottom: '12px', padding: '8px 10px', borderRadius: '8px', background: 'var(--bg-secondary, #f5f5f5)' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Status Conditions
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {CONDITIONS.map(cond => {
                    const isActive = conditions[cond.key];
                    return (
                        <button
                            key={cond.key}
                            onClick={() => updatePokemon && updatePokemon(selectedPokemon.id, {
                                statusConditions: { ...conditions, [cond.key]: !isActive }
                            })}
                            style={{
                                padding: '3px 8px', borderRadius: '12px',
                                border: isActive ? `2px solid ${cond.color}` : '1px solid var(--border-medium, #ccc)',
                                background: isActive ? cond.color : 'transparent',
                                color: isActive ? 'white' : 'var(--text-secondary)',
                                cursor: 'pointer', fontSize: '12px',
                                fontWeight: isActive ? 'bold' : 'normal',
                                transition: 'all 0.15s ease'
                            }}
                            title={`${cond.label}: ${cond.desc}`}
                        >
                            {cond.icon} {cond.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default StatusConditionUI;
