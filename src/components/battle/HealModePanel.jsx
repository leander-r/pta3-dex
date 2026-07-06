import React from 'react';
import { calculatePokemonHP, parseHealFormula } from '../../utils/dataUtils.js';
import PokemonSpritePicker from './PokemonSpritePicker.jsx';

const getHP = (p) => {
    const max = calculatePokemonHP(p);
    return { current: max - (p.currentDamage || 0), max };
};

const HealModePanel = ({ selectedPokemonId, setSelectedPokemonId, party, healingInventory, onUseItem }) => (
    <div>
        <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                Target Pokémon
            </label>
            <PokemonSpritePicker
                party={party}
                selectedId={selectedPokemonId}
                onSelect={setSelectedPokemonId}
                getHP={getHP}
            />
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
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
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
                                    fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap'
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
