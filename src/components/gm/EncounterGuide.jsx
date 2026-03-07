// ============================================================
// Encounter Guide — difficulty scaling & special encounter types
// ============================================================

import React, { useState } from 'react';
import toast from '../../utils/toast.js';
import { GAME_DATA } from '../../data/configs.js';

const DIFFICULTY_ROWS = [
    { label: 'Easy',      color: '#4caf50', desc: '0–1 basic (unevolved) Pokémon' },
    { label: 'Normal',    color: '#2196f3', desc: '1–2 basic or once-evolved Pokémon' },
    { label: 'Hard',      color: '#ff9800', desc: '2–3 mostly-evolved OR 3–4 fully-evolved Pokémon' },
    { label: 'Dangerous', color: '#f44336', desc: '3–4 fully evolved OR multiple Alpha/Totem/Titan Pokémon' },
];

const FILLER_TABLE = [
    { range: '1–5',   result: 'Wild Pokémon engages in battle alone' },
    { range: '6–10',  result: 'Wild Pokémon attempts to flee' },
    { range: '11–15', result: 'A few nearby Pokémon join the battle' },
    { range: '16–18', result: 'A few nearby Pokémon help the wild Pokémon retreat' },
    { range: '19–20', result: 'Evolved Pokémon arrive to help in battle' },
];

const SPECIAL_FORMS = [
    {
        name: 'Alpha', icon: '🔴', color: '#b71c1c',
        stats: 'HP ×2 | ATK +5 | SATK +5 | One defense raised to 15',
        moves: 'Alpha Beam (1/day, 5d20) | Alpha Impact (1/day, 5d20) | Alpha Restoration (3/day, heal 1d12)',
        capture: 'Needs ≤50% HP or Master Ball to capture. When caught: gains +1 Atk or SpA and +1 Def or SpD passive.',
    },
    {
        name: 'Totem', icon: '🟠', color: '#e65100',
        stats: 'HP ×2 | ATK +5 | SATK +5 | One defense raised to 15',
        moves: 'Totemic Power (1/day, allies ATK/SATK +2 for 10 min) | Totemic Call (summon 1d4 allies) | Totemic Guardian (3/day, heal 3d8 to allies)',
        capture: 'Needs ≤50% HP or Master Ball to capture. When caught: loses Totem abilities, gains Totem Memory (1/day, allies ATK/SATK +2).',
    },
    {
        name: 'Titan', icon: '⚫', color: '#37474f',
        stats: 'HP ×10 | Size at least Huge | Melee attacks become Ranged(15ft Burst) | Ranged attacks gain 15ft Blast',
        moves: 'Normal moves with expanded ranges',
        capture: 'Cannot be captured normally. Capturable within 3 days of losing its mystical herb supply (shrinks to normal size). When caught: HP +18 (not ×10); must lose one stat passive if it had 4.',
    },
    {
        name: 'Shadow', icon: '🌑', color: '#311b92',
        stats: 'No base stat changes (wild state)',
        moves: 'Shadow Rush (−2 during Accuracy Check). Shadow Aura: +4 damage on every attack hit, then lose 4 HP.',
        capture: 'Distrustful of new trainers; may undermine trainer. Purifiable via sustained kindness + loyalty milestone → gains Light Aura + Guiding Light.',
    },
    {
        name: 'Purified', icon: '🌟', color: '#00695c',
        stats: 'No base stat changes',
        moves: "Guiding Light: +5 to Pokémon Handling checks (own or trainer's). Light Aura: when below 20 HP, attacks deal +4 damage.",
        capture: 'Result of rehabilitating a Shadow Pokémon. Shadow Rush and Shadow Aura are lost.',
    },
];

const SKILL_DC_TABLE = [
    { dc: 5,  label: 'Very Easy',          color: '#4caf50' },
    { dc: 10, label: 'Easy',               color: '#8bc34a' },
    { dc: 15, label: 'Medium',             color: '#ff9800' },
    { dc: 20, label: 'Hard',               color: '#ff5722' },
    { dc: 25, label: 'Very Hard',          color: '#f44336' },
    { dc: 30, label: 'Nearly Impossible',  color: '#b71c1c' },
];

const EncounterGuide = () => {
    const [d20Roll, setD20Roll] = useState(null);
    const [natureRoll, setNatureRoll] = useState(null);

    const rollNature = () => {
        const natures = Object.entries(GAME_DATA.natures || {});
        if (!natures.length) return;
        const [name, data] = natures[Math.floor(Math.random() * natures.length)];
        setNatureRoll({ name, ...data });
        const desc = data.buff ? `+${data.buff.toUpperCase()} / −${data.nerf.toUpperCase()}` : 'Neutral';
        toast.info(`Nature: ${name} (${desc})`);
    };

    const rollD20 = () => {
        const r = Math.floor(Math.random() * 20) + 1;
        setD20Roll(r);
        const entry = FILLER_TABLE.find(row => {
            const [lo, hi] = row.range.split('–').map(Number);
            return r >= lo && r <= hi;
        });
        toast.info(`d20 = ${r} → ${entry?.result}`);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Difficulty Table */}
            <div className="section-card-purple">
                <h3 className="section-title-purple">⚔️ Encounter Difficulty</h3>
                <div style={{ display: 'grid', gap: '8px' }}>
                    {DIFFICULTY_ROWS.map(row => (
                        <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px', borderLeft: `4px solid ${row.color}`, background: `${row.color}11` }}>
                            <span style={{ fontWeight: 'bold', color: row.color, minWidth: '80px' }}>{row.label}</span>
                            <span style={{ fontSize: '13px' }}>{row.desc}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Wild Filler Behavior */}
            <div className="section-card-purple">
                <h3 className="section-title-purple">🎲 Wild Filler Behavior (d20)</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    When nearby Pokémon might react to a battle, roll d20 to determine their behavior.
                </p>
                <div style={{ display: 'grid', gap: '6px', marginBottom: '12px' }}>
                    {FILLER_TABLE.map(row => (
                        <div key={row.range} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '8px 12px', borderRadius: '6px', background: 'var(--input-bg)' }}>
                            <span style={{ fontWeight: 'bold', color: '#667eea', minWidth: '45px', fontSize: '13px' }}>{row.range}</span>
                            <span style={{ fontSize: '13px' }}>{row.result}</span>
                        </div>
                    ))}
                </div>
                <button onClick={rollD20}
                    style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    🎲 Roll d20
                    {d20Roll !== null && <span style={{ marginLeft: '8px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px' }}>{d20Roll}</span>}
                </button>
            </div>

            {/* Wild Nature Roller */}
            <div className="section-card-purple">
                <h3 className="section-title-purple">🎲 Wild Nature Roller</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Randomly determine the nature of a wild Pokémon.
                </p>
                <button onClick={rollNature}
                    style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    🎲 Roll Nature
                </button>
                {natureRoll && (
                    <div style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 14px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-medium)' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{natureRoll.name}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {natureRoll.buff
                                ? `+${natureRoll.buff.toUpperCase()} / −${natureRoll.nerf.toUpperCase()}`
                                : 'Neutral'}
                        </span>
                    </div>
                )}
            </div>

            {/* Special Encounter Forms */}
            <div className="section-card-purple">
                <h3 className="section-title-purple">🌟 Special Encounter Forms</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {SPECIAL_FORMS.map(sf => (
                        <div key={sf.name} style={{ borderRadius: '10px', border: `1px solid ${sf.color}55`, borderLeft: `4px solid ${sf.color}`, padding: '12px 14px' }}>
                            <div style={{ fontSize: '15px', fontWeight: 'bold', color: sf.color, marginBottom: '6px' }}>{sf.icon} {sf.name} Pokémon</div>
                            <div style={{ fontSize: '12px', marginBottom: '4px' }}><strong>Stats: </strong>{sf.stats}</div>
                            <div style={{ fontSize: '12px', marginBottom: '4px' }}><strong>Special Moves: </strong>{sf.moves}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}><strong>Capture: </strong>{sf.capture}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Skill DC Reference */}
            <div className="section-card-purple">
                <h3 className="section-title-purple">📋 Skill Check DC Scale</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    PTA3 uses a d20 + talent bonus (+0/+2/+5). Natural 20: roll again and add to 20.
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {SKILL_DC_TABLE.map(row => (
                        <div key={row.dc} style={{ flex: '1 1 120px', textAlign: 'center', padding: '10px 8px', borderRadius: '8px', background: `${row.color}15`, border: `1px solid ${row.color}44` }}>
                            <div style={{ fontSize: '22px', fontWeight: 'bold', color: row.color }}>{row.dc}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.label}</div>
                        </div>
                    ))}
                </div>
                <details>
                    <summary style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>Show DC examples per skill</summary>
                    <div style={{ display: 'grid', gap: '8px', marginTop: '8px' }}>
                        {[
                            { skill: 'Athletics',     examples: ['5 — Climb knotted rope', '10 — Swim against slow current', '15 — Force through tight space', '20 — Lift 2× bodyweight', '25 — Break handcuffs by force'] },
                            { skill: 'Concentration', examples: ['5 — Take 5 damage without flinching', '10 — Take 10 damage', '15 — Take 15 damage'] },
                            { skill: 'Constitution',  examples: ['5 — Down a single drink unaffected', '10 — Ignore food poisoning, run 1 hr', '15 — Function after 24 hrs awake', '20 — Hold breath 10 minutes'] },
                            { skill: 'Acrobatics',    examples: ['5 — Fall safely from 10ft', '10 — Land on feet after 15ft drop', '15 — Cross a 6-inch wide surface', '20 — Running jump to a 12ft wall'] },
                            { skill: 'Stealth',       examples: ['5 — Sneak by sleeping person on soft ground', '10 — Hide in cover in place', '15 — Sneak by active lookout (lots of cover)', '20 — Sneak by Pokémon with tracking', '25 — Sneak by cameras with little cover'] },
                            { skill: 'Perception',    examples: ['5 — Hear a nearby Pokémon battle', '10 — Overhear conversation details', '15 — Notice a trip wire', '20 — Notice a pressure plate', '25 — Notice well-hidden small Pokémon'] },
                            { skill: 'Investigate',   examples: ['5 — Locate bag-sized object in room', '10 — Locate bag-sized object in house', '15 — Find hidden passage/suspicious item', '20 — Find hidden device/controls in room'] },
                            { skill: 'Nature',        examples: ['5 — Follow huge Pokémon tracks', '10 — Forecast weather, locate water', '15 — Identify Pokémon, navigate terrain', '20 — Find berries in desert, ID egg species', '25 — Follow tiny Pokémon tracks'] },
                            { skill: 'Medicine',      examples: ['5 — Sterilize wound, stabilize dying trainer', '10 — Treat disease, reset broken bones', '15 — Perform surgery', '20+ — Complex procedures'] },
                            { skill: 'Bluff',         examples: ['5 — NPC wants to believe the lie', '10 — Lie is believable', '15 — Lie is unlikely', '20 — Lie is ridiculous', '25 — Lie is nearly impossible'] },
                            { skill: 'Diplomacy',     examples: ['5 — Ask for directions', '10 — Ask for detailed advice', '15 — Ask for aid while NPC is busy', '20 — Reveal important secret', '25 — Ask for dangerous aid'] },
                            { skill: 'Programming',   examples: ['10 — Access digital lock/detonator', '15 — Access personal computer', '20 — Access large network', '25 — Crash massive corporate network'] },
                            { skill: 'Pokémon Handling', examples: ['10 — Identify Pokémon mood', '15 — Stay mounted on loyal Pokémon in battle', '20 — Calm angry domestic Pokémon', '25 — Calm angry wild Pokémon'] },
                        ].map(({ skill, examples }) => (
                            <div key={skill} style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--input-bg)' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px', color: '#667eea' }}>{skill}</div>
                                {examples.map((ex, i) => (
                                    <div key={i} style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '8px' }}>• {ex}</div>
                                ))}
                            </div>
                        ))}
                    </div>
                </details>
            </div>
        </div>
    );
};

export default EncounterGuide;
