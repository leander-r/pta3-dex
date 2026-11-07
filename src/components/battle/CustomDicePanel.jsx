import React from 'react';

const QUICK_DICE = ['1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '2d6', '3d6'];

const CustomDicePanel = ({ customDice, setCustomDice, onRoll }) => (
    <div>
        <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
            Dice Notation (e.g., 2d6+5, 1d20)
        </label>
        <input
            type="text"
            value={customDice}
            onChange={(e) => setCustomDice(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && customDice) onRoll(); }}
            placeholder="2d6+5"
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-medium)', marginBottom: '12px' }}
        />
        <div className="detail-tile-grid" style={{ marginBottom: '12px' }}>
            {QUICK_DICE.map(dice => (
                <button
                    key={dice}
                    onClick={() => setCustomDice(dice)}
                    className={`detail-tile dice-quick-btn ${customDice === dice ? 'selected' : ''}`}
                    style={{ cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                >
                    {dice}
                </button>
            ))}
        </div>
        <button
            onClick={onRoll}
            disabled={!customDice}
            style={{
                width: '100%', padding: '15px',
                background: customDice ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#ccc',
                color: 'white', border: 'none', borderRadius: '8px',
                cursor: customDice ? 'pointer' : 'not-allowed',
                fontSize: '16px', fontWeight: 'bold'
            }}
        >
            Roll!
        </button>
    </div>
);

export default CustomDicePanel;
