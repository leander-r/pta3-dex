import React from 'react';
import { STATUS_CONDITIONS as CONDITIONS } from '../../data/statusConditions.js';

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
