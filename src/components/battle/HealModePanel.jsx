import React from 'react';
import { calculatePokemonHP, parseHealFormula } from '../../utils/dataUtils.js';

const HealModePanel = ({ selectedPokemonId, setSelectedPokemonId, party, healingInventory, onUseItem }) => (
    <div>
        <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                Target Pokémon
            </label>
            <select
                value={selectedPokemonId || ''}
                onChange={(e) => setSelectedPokemonId(parseInt(e.target.value) || null)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
            >
                <option value="">— Select Pokémon —</option>
                {party.map(p => {
                    const maxHP = calculatePokemonHP(p);
                    const currentHP = maxHP - (p.currentDamage || 0);
                    return (
                        <option key={p.id} value={p.id}>
                            {p.name || p.species} ({currentHP}/{maxHP} HP)
                        </option>
                    );
                })}
            </select>
        </div>

        {healingInventory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No healing items in inventory.
            </div>
        ) : (
            <div style={{ display: 'grid', gap: '6px' }}>
                {healingInventory.map(item => {
                    const formula = parseHealFormula(item.effect || '');
                    const formulaLabel = formula.type === 'dice' ? `🎲 ${formula.formula}`
                        : formula.type === 'fraction' ? `📊 ${formula.num}/${formula.denom} Max HP`
                        : '✨ Status';
                    return (
                        <div
                            key={item.name}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--border-medium)' }}
                        >
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{item.name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    {formulaLabel} · ×{item.quantity || 1}
                                </div>
                            </div>
                            <button
                                onClick={() => onUseItem(item.name)}
                                disabled={!selectedPokemonId}
                                style={{
                                    padding: '6px 14px',
                                    background: selectedPokemonId ? '#4caf50' : '#ccc',
                                    color: 'white', border: 'none', borderRadius: '4px',
                                    cursor: selectedPokemonId ? 'pointer' : 'not-allowed',
                                    fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap'
                                }}
                            >
                                Use
                            </button>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
);

export default HealModePanel;
