import React, { useRef } from 'react';

const HPTracker = ({ label, currentHP, maxHP, onDamage, onHeal, onFull }) => {
    const inputRef = useRef(null);
    const hpPercent = maxHP > 0 ? (currentHP / maxHP) * 100 : 0;

    return (
        <div className="hp-tracker-box" style={{ marginBottom: '12px', padding: '10px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{label}</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: hpPercent > 50 ? '#4caf50' : hpPercent > 25 ? '#ff9800' : '#f44336' }}>
                    {currentHP} / {maxHP}
                </span>
            </div>
            <div style={{ background: 'var(--collapsed-hp-track)', borderRadius: '4px', height: '12px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{
                    width: `${hpPercent}%`,
                    height: '100%',
                    background: hpPercent > 50 ? '#4caf50' : hpPercent > 25 ? '#ff9800' : '#f44336',
                    transition: 'width 0.3s ease'
                }} />
            </div>
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <span className="text-muted" style={{ fontSize: '10px', width: '100%', textAlign: 'center', marginBottom: '4px' }}>
                    Damage ← → Heal
                </span>
                {[10, 5, 1].map(val => (
                    <button
                        key={`dmg-${val}`}
                        onClick={() => onDamage(val)}
                        style={{ padding: '4px 8px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                    >
                        +{val}
                    </button>
                ))}
                <button
                    onClick={onFull}
                    style={{ padding: '4px 8px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                >
                    Full
                </button>
                {[1, 5, 10].map(val => (
                    <button
                        key={`heal-${val}`}
                        onClick={() => onHeal(val)}
                        style={{ padding: '4px 8px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                    >
                        -{val}
                    </button>
                ))}
            </div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '6px', justifyContent: 'center' }}>
                <input
                    ref={inputRef}
                    type="number"
                    min="1"
                    placeholder="Custom"
                    style={{ width: '70px', padding: '4px 6px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '11px', textAlign: 'center' }}
                />
                <button
                    onClick={() => {
                        const val = parseInt(inputRef.current?.value);
                        if (val > 0) { onDamage(val); inputRef.current.value = ''; }
                    }}
                    style={{ padding: '4px 8px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                >
                    Damage
                </button>
                <button
                    onClick={() => {
                        const val = parseInt(inputRef.current?.value);
                        if (val > 0) { onHeal(val); inputRef.current.value = ''; }
                    }}
                    style={{ padding: '4px 8px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                >
                    Heal
                </button>
            </div>
        </div>
    );
};

export default HPTracker;
