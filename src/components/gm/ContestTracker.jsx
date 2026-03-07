// ============================================================
// Contest Tracker
// ============================================================

import React, { useState } from 'react';
import toast from '../../utils/toast.js';

const CONTEST_TYPES = ['Cool', 'Beautiful', 'Cute', 'Clever', 'Tough'];

const NPC_RESULTS = [
    { range: [1, 5],   label: 'Novice',             color: '#4caf50', desc: 'Confident but no contest strategy; may lack type-matching moves.' },
    { range: [6, 15],  label: 'Prepared',            color: '#2196f3', desc: 'Knows 2 Star Point categories; plans to earn at least 1.' },
    { range: [16, 20], label: 'Expert Coordinator',  color: '#9c27b0', desc: 'Knows 4 categories; plans to earn 2+ Star Points.' },
];

const ContestTracker = () => {
    const [contestType, setContestType]         = useState('Cool');
    const [contestants, setContestants]         = useState(['', '', '', '']);
    const [judgeCategories, setJudgeCategories] = useState(['', '', '']);
    const [heartPoints, setHeartPoints]         = useState([[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]);
    const [starPoints, setStarPoints]           = useState([null, null, null]);
    const [npcRoll, setNpcRoll]                 = useState(null);

    const updateHeart = (ci, ji, delta) => {
        setHeartPoints(prev => {
            const next = prev.map(row => [...row]);
            next[ci][ji] = Math.max(0, next[ci][ji] + delta);
            return next;
        });
    };

    const colTotal = (ji) => heartPoints.reduce((sum, row) => sum + row[ji], 0);

    const leadContestant = (ji) => {
        const totals = contestants.map((_, ci) => heartPoints[ci][ji]);
        const max = Math.max(...totals);
        if (max === 0) return null;
        const leaders = totals.map((v, ci) => ({ ci, v })).filter(x => x.v === max);
        return leaders.length === 1 ? leaders[0].ci : null;
    };

    const awardStar = (ji) => {
        const lead = leadContestant(ji);
        if (lead === null) {
            toast.warning('No clear leader for this judge yet.');
            return;
        }
        setStarPoints(prev => {
            const next = [...prev];
            next[ji] = lead;
            return next;
        });
        toast.success(`⭐ Star awarded to ${contestants[lead] || `Contestant ${lead + 1}`}!`);
    };

    const rollNpc = () => {
        const r = Math.floor(Math.random() * 20) + 1;
        const result = NPC_RESULTS.find(x => r >= x.range[0] && r <= x.range[1]);
        setNpcRoll({ roll: r, ...result });
        toast.info(`NPC d20 = ${r} → ${result?.label}`);
    };

    const reset = () => {
        setHeartPoints([[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]);
        setStarPoints([null, null, null]);
        setNpcRoll(null);
        toast.info('Contest reset.');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Setup */}
            <div className="section-card-purple">
                <h3 className="section-title-purple">🏆 Contest Setup</h3>

                {/* Contest type */}
                <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Contest Type</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {CONTEST_TYPES.map(t => (
                            <button
                                key={t}
                                onClick={() => setContestType(t)}
                                style={{
                                    padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
                                    background: contestType === t ? '#667eea' : 'var(--input-bg)',
                                    color: contestType === t ? 'white' : 'var(--text-muted)',
                                    border: contestType === t ? '2px solid #667eea' : '1px solid var(--border-medium)'
                                }}
                            >{t}</button>
                        ))}
                    </div>
                </div>

                {/* Contestants */}
                <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Contestants</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {contestants.map((name, i) => (
                            <input
                                key={i}
                                type="text"
                                placeholder={`Contestant ${i + 1}`}
                                value={name}
                                onChange={e => setContestants(prev => { const n = [...prev]; n[i] = e.target.value; return n; })}
                                style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', fontSize: '13px', color: 'var(--text-primary)' }}
                            />
                        ))}
                    </div>
                </div>

                {/* Judge categories */}
                <div>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Judge Categories</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        {judgeCategories.map((cat, i) => (
                            <input
                                key={i}
                                type="text"
                                placeholder={`Judge ${i + 1} category`}
                                value={cat}
                                onChange={e => setJudgeCategories(prev => { const n = [...prev]; n[i] = e.target.value; return n; })}
                                style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', fontSize: '12px', color: 'var(--text-primary)' }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Heart Points Table */}
            <div className="section-card-purple">
                <h3 className="section-title-purple">❤️ Heart Points</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '11px' }}>Contestant</th>
                                {judgeCategories.map((cat, ji) => (
                                    <th key={ji} style={{ textAlign: 'center', padding: '6px 10px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '11px' }}>
                                        {cat || `Judge ${ji + 1}`}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {contestants.map((name, ci) => (
                                <tr key={ci} style={{ borderTop: '1px solid var(--border-light)' }}>
                                    <td style={{ padding: '8px 10px', fontWeight: 'bold' }}>{name || `Contestant ${ci + 1}`}</td>
                                    {heartPoints[ci].map((val, ji) => {
                                        const isLead = leadContestant(ji) === ci;
                                        return (
                                            <td key={ji} style={{ padding: '6px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                    <button
                                                        onClick={() => updateHeart(ci, ji, -1)}
                                                        style={{ width: '24px', height: '24px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', lineHeight: 1 }}
                                                    >−</button>
                                                    <span style={{
                                                        minWidth: '28px', textAlign: 'center', fontWeight: 'bold', fontSize: '15px',
                                                        color: isLead ? '#e91e63' : 'var(--text-primary)'
                                                    }}>{val}{isLead && ' ♥'}</span>
                                                    <button
                                                        onClick={() => updateHeart(ci, ji, 1)}
                                                        style={{ width: '24px', height: '24px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', lineHeight: 1 }}
                                                    >+</button>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            {/* Totals row */}
                            <tr style={{ borderTop: '2px solid var(--border-medium)', background: 'var(--input-bg)' }}>
                                <td style={{ padding: '8px 10px', fontWeight: 'bold', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Total</td>
                                {judgeCategories.map((_, ji) => (
                                    <td key={ji} style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 'bold' }}>{colTotal(ji)}</td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Star Points */}
            <div className="section-card-purple">
                <h3 className="section-title-purple">⭐ Star Points</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Award a Star Point to the current leader for each judge category.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {judgeCategories.map((cat, ji) => {
                        const lead = leadContestant(ji);
                        const awarded = starPoints[ji];
                        return (
                            <div key={ji} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px', background: 'var(--input-bg)' }}>
                                <span style={{ fontWeight: 'bold', minWidth: '100px', fontSize: '13px' }}>{cat || `Judge ${ji + 1}`}</span>
                                <span style={{ flex: 1, fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {lead !== null
                                        ? `Leader: ${contestants[lead] || `Contestant ${lead + 1}`}`
                                        : 'No leader yet'}
                                </span>
                                {awarded !== null && (
                                    <span style={{ fontSize: '12px', color: '#f9a825', fontWeight: 'bold' }}>
                                        ⭐ {contestants[awarded] || `Contestant ${awarded + 1}`}
                                    </span>
                                )}
                                <button
                                    onClick={() => awardStar(ji)}
                                    style={{ padding: '5px 12px', background: '#f9a825', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                                >
                                    Award ⭐
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* NPC Competitor Roll */}
            <div className="section-card-purple">
                <h3 className="section-title-purple">🎲 NPC Competitor Roll</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Roll d20 to determine how prepared an NPC coordinator is.
                </p>
                <button
                    onClick={rollNpc}
                    style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '12px' }}
                >
                    🎲 Roll d20
                </button>
                {npcRoll && (
                    <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'var(--input-bg)', border: `2px solid ${npcRoll.color}44`, borderLeft: `4px solid ${npcRoll.color}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '20px', color: npcRoll.color }}>{npcRoll.roll}</span>
                            <span style={{ fontWeight: 'bold', fontSize: '14px', color: npcRoll.color }}>{npcRoll.label}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{npcRoll.desc}</div>
                    </div>
                )}
            </div>

            {/* Reset */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={reset}
                    style={{ padding: '8px 20px', background: '#f44336', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                >
                    🔄 Reset Contest
                </button>
            </div>
        </div>
    );
};

export default ContestTracker;
