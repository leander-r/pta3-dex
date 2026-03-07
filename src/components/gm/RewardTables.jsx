// ============================================================
// Reward Tables — Pokécredit payouts & wild goods d100 roller
// ============================================================

import React, { useState } from 'react';
import toast from '../../utils/toast.js';

const WILD_GOODS = [
    { range: [1,  60],  label: 'Common Berries',    value: '1–100 P',          color: '#4caf50' },
    { range: [61, 70],  label: 'Uncommon Berries',  value: '10–50 P',          color: '#8bc34a' },
    { range: [71, 75],  label: 'Rare Berries',      value: '50–200 P',         color: '#cddc39' },
    { range: [76, 80],  label: 'Rare Fungi',        value: '200–800 P',        color: '#ff9800' },
    { range: [81, 85],  label: 'Trainer Items',     value: 'Variable',         color: '#03a9f4' },
    { range: [86, 90],  label: 'Precious Gems',     value: '1,000 P',          color: '#9c27b0' },
    { range: [91, 94],  label: 'Rare Stones',       value: '2,500 P',          color: '#673ab7' },
    { range: [95, 98],  label: 'Rare Materials',    value: '15,000 P',         color: '#e91e63' },
    { range: [99, 100], label: 'Ancient Relics',    value: '20,000–200,000 P', color: '#ffd700' },
];

const POKECREDIT_PAYOUTS = [
    { category: 'League Battles',    rows: [
        { label: 'NPC wager',                value: 'Up to 500 P per battle' },
        { label: 'Exhibition at gym (loser)', value: '15–25 P' },
        { label: 'Exhibition at gym (winner)', value: 'Double loser amount' },
    ]},
    { category: 'Gym Battles',        rows: [
        { label: 'Standard gym',             value: '1,000–3,000 P' },
        { label: 'Defeating gym leader',      value: 'Up to 10,000 P' },
        { label: 'Well-funded gym',           value: '2,500–10,000 P' },
    ]},
    { category: 'Tournaments',        rows: [
        { label: 'Entry-fee pool (winner)',   value: '≥50% of pool' },
        { label: 'Regional — 1st place',      value: 'Up to 250,000 P' },
        { label: 'Regional — 8th place',      value: 'Up to 50,000 P' },
    ]},
    { category: 'Contests',           rows: [
        { label: 'Local contest — 1st place', value: 'Up to 2,000 P' },
        { label: 'Grand Festival champion',   value: '400,000+ P' },
    ]},
    { category: 'Odd Jobs',           rows: [
        { label: 'Simple labor (per hour)',   value: '5–25 P' },
        { label: 'Skilled labor (per hour)',  value: '25–60 P' },
        { label: 'Tip: Roll 15+ or well-suited Pokémon', value: 'Upper range of scale' },
    ]},
];

const RewardTables = () => {
    const [d100Roll, setD100Roll] = useState(null);
    const [d100Result, setD100Result] = useState(null);

    const rollD100 = () => {
        const r = Math.floor(Math.random() * 100) + 1;
        const result = WILD_GOODS.find(g => r >= g.range[0] && r <= g.range[1]);
        setD100Roll(r);
        setD100Result(result);
        toast.success(`d100 = ${r} → ${result?.label} (${result?.value})`);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Wild Goods d100 Roller */}
            <div className="section-card-purple">
                <h3 className="section-title-purple">🌿 Wild Goods Finder (d100)</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Roll d100 when trainers search wild areas for valuables.
                </p>
                <div style={{ display: 'grid', gap: '6px', marginBottom: '14px' }}>
                    {WILD_GOODS.map(g => {
                        const isResult = d100Result?.label === g.label;
                        return (
                            <div key={g.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', borderRadius: '6px', background: isResult ? `${g.color}22` : 'var(--input-bg)', border: isResult ? `2px solid ${g.color}` : '1px solid var(--border-light)', transition: 'all 0.2s' }}>
                                <span style={{ color: g.color, fontWeight: 'bold', minWidth: '45px', fontSize: '12px' }}>{g.range[0]}–{g.range[1]}</span>
                                <span style={{ flex: 1, fontSize: '13px', fontWeight: isResult ? 'bold' : 'normal' }}>{g.label}</span>
                                <span style={{ fontSize: '12px', color: g.color, fontWeight: 'bold' }}>{g.value}</span>
                            </div>
                        );
                    })}
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button onClick={rollD100}
                        style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' }}>
                        🎲 Roll d100
                    </button>
                    {d100Roll !== null && (
                        <div style={{ padding: '8px 16px', borderRadius: '8px', background: d100Result ? `${d100Result.color}22` : 'var(--input-bg)', border: `2px solid ${d100Result?.color || '#667eea'}` }}>
                            <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{d100Roll}</span>
                            <span style={{ marginLeft: '10px', color: d100Result?.color, fontWeight: 'bold' }}>{d100Result?.label}</span>
                            <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>{d100Result?.value}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Pokécredit Payout Tables */}
            <div className="section-card-purple">
                <h3 className="section-title-purple">💰 Pokécredit Reward Tables</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {POKECREDIT_PAYOUTS.map(cat => (
                        <div key={cat.category}>
                            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#667eea', marginBottom: '6px', paddingBottom: '4px', borderBottom: '1px solid var(--border-light)' }}>
                                {cat.category}
                            </div>
                            {cat.rows.map(row => (
                                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderRadius: '4px' }} className="hover-bg">
                                    <span style={{ fontSize: '13px' }}>{row.label}</span>
                                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#4caf50' }}>{row.value}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Loyalty Downtime Hours */}
            <div className="section-card-purple">
                <h3 className="section-title-purple">💙 Loyalty Progression (Downtime Hours)</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    During downtime, trainers can invest quality time to improve Pokémon loyalty.
                </p>
                {[
                    { from: 0, to: 1, hours: '10+ hours (20+ if particularly bad capture)', color: '#b71c1c' },
                    { from: 1, to: 2, hours: '5+ hours', color: '#e65100' },
                    { from: 2, to: 3, hours: '5+ hours of regular play and exercise', color: '#f57f17' },
                    { from: 3, to: 4, hours: '3+ months minimum — intense personal connection', color: '#2e7d32' },
                    { from: 4, to: 5, hours: 'Extremely rare — a lifetime bond', color: '#1565c0' },
                ].map(row => (
                    <div key={`${row.from}-${row.to}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', borderRadius: '6px', marginBottom: '6px', borderLeft: `4px solid ${row.color}`, background: `${row.color}11` }}>
                        <span style={{ fontWeight: 'bold', color: row.color, minWidth: '60px', fontSize: '13px' }}>{row.from} → {row.to}</span>
                        <span style={{ fontSize: '13px' }}>{row.hours}</span>
                    </div>
                ))}

                <div style={{ marginTop: '12px', padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <strong>Rest Recovery (GMG):</strong> After 8+ hours rest — Trainers recover 1d6 HP, Pokémon recover 1/6 max HP. Pokémon Centers restore full HP but not move frequencies.
                </div>
            </div>
        </div>
    );
};

export default RewardTables;
