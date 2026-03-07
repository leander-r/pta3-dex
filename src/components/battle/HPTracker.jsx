import React, { useRef } from 'react';
import { useUI } from '../../contexts/index.js';
import { HELP_BTN_STYLE } from '../common/helpBtnStyle.js';

const HPTracker = ({ label, currentHP, maxHP, onDamage, onHeal, onFull }) => {
    const inputRef = useRef(null);
    const { showHelp } = useUI();
    const hpPercent = maxHP > 0 ? (currentHP / maxHP) * 100 : 0;

    return (
        <div className="hp-tracker-box" style={{ marginBottom: '12px', padding: '10px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 'bold' }}>
                    {label}
                    <button
                        onClick={() => showHelp('hp-tracking')}
                        style={HELP_BTN_STYLE}
                        aria-label="Help: HP tracking"
                        title="About HP tracking"
                    >?</button>
                </span>
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
                <span className="text-muted" style={{ fontSize: '12px', width: '100%', textAlign: 'center', marginBottom: '4px' }}>
                    Damage ← → Heal
                </span>
                {[10, 5, 1].map(val => (
                    <button
                        key={`dmg-${val}`}
                        onClick={() => onDamage(val)}
                        aria-label={`Deal ${val} damage to ${label}`}
                        style={{ padding: '4px 8px', minHeight: '34px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                    >
                        −{val}
                    </button>
                ))}
                <button
                    onClick={onFull}
                    aria-label={`Restore ${label} to full HP`}
                    style={{ padding: '4px 8px', minHeight: '34px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                >
                    Full
                </button>
                {[1, 5, 10].map(val => (
                    <button
                        key={`heal-${val}`}
                        onClick={() => onHeal(val)}
                        aria-label={`Heal ${val} HP for ${label}`}
                        style={{ padding: '4px 8px', minHeight: '34px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                    >
                        +{val}
                    </button>
                ))}
            </div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '6px', justifyContent: 'center' }}>
                <input
                    ref={inputRef}
                    type="number"
                    min="1"
                    aria-label={`Custom HP amount for ${label}`}
                    placeholder="Amt"
                    style={{ width: '70px', padding: '4px 6px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '13px', textAlign: 'center' }}
                />
                <button
                    onClick={() => {
                        const val = parseInt(inputRef.current?.value);
                        if (val > 0) { onDamage(val); inputRef.current.value = ''; }
                        else if (inputRef.current) inputRef.current.value = '';
                    }}
                    aria-label={`Deal custom damage to ${label}`}
                    style={{ padding: '4px 8px', minHeight: '34px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                >
                    Dmg
                </button>
                <button
                    onClick={() => {
                        const val = parseInt(inputRef.current?.value);
                        if (val > 0) { onHeal(val); inputRef.current.value = ''; }
                        else if (inputRef.current) inputRef.current.value = '';
                    }}
                    aria-label={`Heal custom HP for ${label}`}
                    style={{ padding: '4px 8px', minHeight: '34px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                >
                    Heal
                </button>
            </div>
        </div>
    );
};

export default HPTracker;
