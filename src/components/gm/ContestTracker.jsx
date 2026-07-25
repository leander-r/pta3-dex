// ============================================================
// Contest Tracker
// ============================================================

import React, { useState } from 'react';
import { useUI } from '../../contexts/index.js';
import { HELP_BTN_STYLE } from '../common/helpBtnStyle.js';
import toast from '../../utils/toast.js';

const CONTEST_TYPES = ['Cool', 'Beauty', 'Cute', 'Clever', 'Tough'];

const NPC_RESULTS = [
    { range: [1, 5],   label: 'Novice',             color: '#4caf50', desc: 'Confident but no contest strategy; may lack type-matching moves.' },
    { range: [6, 15],  label: 'Prepared',            color: '#2196f3', desc: 'Knows 2 Star Point categories; plans to earn at least 1.' },
    { range: [16, 20], label: 'Expert Coordinator',  color: '#9c27b0', desc: 'Knows 4 categories; plans to earn 2+ Star Points.' },
];

// GMG p.34 — a separate table from NPC_RESULTS above: how many/what kind of
// *additional* judges (beyond the main host judge) show up when players join a
// contest suddenly.
const JUDGE_PANEL_RESULTS = [
    { range: [1, 5],   label: 'Two Basic Judges',       color: '#4caf50', desc: 'Two additional judges who judge based on Contest types and basic categories.' },
    { range: [6, 15],  label: 'One Basic, One Advanced', color: '#2196f3', desc: 'Two additional judges — one judges basic categories, one judges advanced categories.' },
    { range: [16, 19], label: 'Mixed Advanced Panel',    color: '#ff9800', desc: 'Two additional judges who judge on a combination of basic and advanced categories.' },
    { range: [20, 20], label: 'Full Advanced Panel',     color: '#9c27b0', desc: 'Two or three additional judges who judge on advanced categories, or categories they decide privately right when the contest starts.' },
];

const ContestTracker = () => {
    const { showHelp } = useUI();
    const [contestType, setContestType]         = useState('Cool');
    const [contestants, setContestants]         = useState(['', '', '', '']);
    const [judgeCategories, setJudgeCategories] = useState(['', '', '']);
    const [heartPoints, setHeartPoints]         = useState([[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]);
    const [starPoints, setStarPoints]           = useState([null, null, null]);
    const [npcRoll, setNpcRoll]                 = useState(null);
    const [judgePanelRoll, setJudgePanelRoll]   = useState(null);

    // GMG: "most contests will have four or five competitors."
    const addContestant = () => {
        if (contestants.length >= 5) return;
        setContestants(prev => [...prev, '']);
        setHeartPoints(prev => [...prev, [0, 0, 0]]);
    };

    const removeContestant = () => {
        if (contestants.length <= 4) return;
        setContestants(prev => prev.slice(0, -1));
        setHeartPoints(prev => prev.slice(0, -1));
    };

    const updateHeart = (ci, ji, delta) => {
        setHeartPoints(prev => {
            const next = prev.map(row => [...row]);
            next[ci][ji] = Math.max(0, next[ci][ji] + delta);
            return next;
        });
    };

    const colTotal = (ji) => heartPoints.reduce((sum, row) => sum + row[ji], 0);

    const totalHeartPoints = (ci) => heartPoints[ci].reduce((sum, v) => sum + v, 0);

    // Returns the contestant indices leading a given judge's category. Per the GMG, a tie is
    // first broken by each contestant's total Heart Points across all judges; if still tied,
    // the Star Point is awarded to all still-tied contestants rather than withheld.
    const leadContestants = (ji) => {
        const totals = contestants.map((_, ci) => heartPoints[ci][ji]);
        const max = Math.max(...totals);
        if (max === 0) return [];
        let leaders = totals.map((v, ci) => ci).filter(ci => totals[ci] === max);
        if (leaders.length > 1) {
            const maxTotal = Math.max(...leaders.map(totalHeartPoints));
            leaders = leaders.filter(ci => totalHeartPoints(ci) === maxTotal);
        }
        return leaders;
    };

    const awardStar = (ji) => {
        const leaders = leadContestants(ji);
        if (leaders.length === 0) {
            toast.warning('No clear leader for this judge yet.');
            return;
        }
        setStarPoints(prev => {
            const next = [...prev];
            next[ji] = leaders;
            return next;
        });
        const names = leaders.map(ci => contestants[ci] || `Contestant ${ci + 1}`).join(' & ');
        toast.success(`⭐ Star awarded to ${names}!`);
    };

    const rollNpc = () => {
        const r = Math.floor(Math.random() * 20) + 1;
        const result = NPC_RESULTS.find(x => r >= x.range[0] && r <= x.range[1]);
        setNpcRoll({ roll: r, ...result });
        toast.info(`NPC d20 = ${r} → ${result?.label}`);
    };

    const rollJudgePanel = () => {
        const r = Math.floor(Math.random() * 20) + 1;
        const result = JUDGE_PANEL_RESULTS.find(x => r >= x.range[0] && r <= x.range[1]);
        setJudgePanelRoll({ roll: r, ...result });
        toast.info(`Judge panel d20 = ${r} → ${result?.label}`);
    };

    const reset = () => {
        setHeartPoints(contestants.map(() => [0, 0, 0]));
        setStarPoints([null, null, null]);
        setNpcRoll(null);
        setJudgePanelRoll(null);
        toast.info('Contest reset.');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Setup */}
            <div className="section-card-purple">
                <h3 className="section-title-purple" aria-label="Contest Setup">
                    🏆 Contest Setup
                    <button
                        onClick={(e) => { e.stopPropagation(); showHelp('gm-contest'); }}
                        style={HELP_BTN_STYLE}
                        aria-label="Help: Contest Tracker"
                        title="About the contest tracker"
                    >?</button>
                </h3>

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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                            Contestants
                            <span style={{ marginLeft: '6px', fontSize: '10px', fontWeight: 'normal', textTransform: 'none', letterSpacing: 0 }}>(GMG: four or five)</span>
                        </div>
                        {contestants.length < 5 ? (
                            <button onClick={addContestant} style={{ padding: '3px 10px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>+ 5th Contestant</button>
                        ) : (
                            <button onClick={removeContestant} style={{ padding: '3px 10px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: '#f44336', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>− Remove 5th</button>
                        )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {contestants.map((name, i) => (
                            <input
                                key={i}
                                type="text"
                                placeholder={`Contestant ${i + 1}`}
                                value={name}
                                onChange={e => setContestants(prev => { const n = [...prev]; n[i] = e.target.value; return n; })}
                                style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', fontSize: '13px', color: 'var(--text-primary)', width: '100%', minWidth: 0, boxSizing: 'border-box' }}
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
                                style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', fontSize: '12px', color: 'var(--text-primary)', width: '100%', minWidth: 0, boxSizing: 'border-box' }}
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
                                        const isLead = leadContestants(ji).includes(ci);
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
                        const leaders = leadContestants(ji);
                        const awarded = starPoints[ji];
                        return (
                            <div key={ji} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px', background: 'var(--input-bg)' }}>
                                <span style={{ fontWeight: 'bold', minWidth: '100px', fontSize: '13px' }}>{cat || `Judge ${ji + 1}`}</span>
                                <span style={{ flex: 1, fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {leaders.length > 0
                                        ? `Leader: ${leaders.map(ci => contestants[ci] || `Contestant ${ci + 1}`).join(' & ')}`
                                        : 'No leader yet'}
                                </span>
                                {awarded && awarded.length > 0 && (
                                    <span style={{ fontSize: '12px', color: '#f9a825', fontWeight: 'bold' }}>
                                        ⭐ {awarded.map(ci => contestants[ci] || `Contestant ${ci + 1}`).join(' & ')}
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

            {/* Additional Judges Roll */}
            <div className="section-card-purple">
                <h3 className="section-title-purple">🧑‍⚖️ Additional Judges (Impromptu Contest)</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    A contest always has 3 judges total. If your players join one suddenly, roll d20 to decide the 2 (or 3) judges beyond the main host judge.
                </p>
                <button
                    onClick={rollJudgePanel}
                    style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '12px' }}
                >
                    🎲 Roll d20
                </button>
                {judgePanelRoll && (
                    <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'var(--input-bg)', border: `2px solid ${judgePanelRoll.color}44`, borderLeft: `4px solid ${judgePanelRoll.color}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '20px', color: judgePanelRoll.color }}>{judgePanelRoll.roll}</span>
                            <span style={{ fontWeight: 'bold', fontSize: '14px', color: judgePanelRoll.color }}>{judgePanelRoll.label}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{judgePanelRoll.desc}</div>
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
