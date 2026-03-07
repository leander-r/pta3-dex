// ============================================================
// Gym Leader & Elite Four Difficulty Guide
// ============================================================

import React from 'react';

const BADGE_SCALING = [
    { range: '0–1', level: 'Easy',      color: '#4caf50', desc: '1 Pokémon (basic/unevolved). Gym trainers use first-stage Pokémon.' },
    { range: '2–4', level: 'Normal',    color: '#2196f3', desc: '2 Pokémon, one may be fully evolved. Gym trainers avoid fully evolved.' },
    { range: '5–6', level: 'Hard',      color: '#ff9800', desc: '3 Pokémon with special moves/passives. Gym trainers synergize (buffs, heals). GM uses trainer actions.' },
    { range: '7+',  level: 'Dangerous', color: '#f44336', desc: '4–5 Pokémon. Complex sequencing, heavy passives/stats. May use Z-Moves or Terastallization.' },
];

const GYM_STAT_PASSIVES = [
    { name: 'Gym Anchor',   effect: '+2 Defense, +2 Special Defense' },
    { name: 'Gym Blaster',  effect: '+2 Special Attack, +2 Special Defense' },
    { name: 'Gym Knight',   effect: '+2 Attack, +2 Defense' },
    { name: 'Gym Striker',  effect: '+3 Attack OR +3 Special Attack' },
    { name: "Gym Leader's", effect: '+1 Defense, +1 Special Defense' },
];

const GYM_ABILITY_PASSIVES = [
    { name: 'Healing Opportunist',   effect: 'First medicine item use each battle can be used before or after your turn in the same round.' },
    { name: 'Home Field Advantage',  effect: "While battling in your trainer's League Gym, move +10 ft per round." },
    { name: 'Rallied Gym Defenders', effect: "While adjacent to a gym trainer's Pokémon, +1 Defense and +1 Special Defense." },
];

const GYM_TRAINER_FEATURES = [
    { name: "I'll Show You Our True Power!", freq: '1/day', effect: 'Your final Pokémon gets +2 to all stats for 10 minutes.' },
    { name: "Give it All We've Got!",        freq: '1/day', effect: 'Your Pokémon deals an additional 2d6 damage on one attack.' },
    { name: "We're Not Done Yet!",           freq: '1/day', effect: 'Your Pokémon takes 10 less damage when hit by one attack.' },
];

const ELITE_STAT_PASSIVES = [
    { name: "Elite's",       effect: '+2 Defense, +2 Special Defense, +1 Speed' },
    { name: 'Elite Striker', effect: '+4 Attack OR +4 Special Attack; +1 Speed' },
    { name: 'Elite Wall',    effect: '+4 Defense OR +4 Special Defense; +1 Speed' },
];

const ELITE_ABILITY_PASSIVES = [
    { name: 'Battle Rush',      effect: 'While above half max HP, move +15 ft per round.' },
    { name: 'Healing Adept',    effect: 'First medicine item each battle usable before/after turn; also grants +6 temporary HP.' },
    { name: 'No Faults',        effect: 'First immunity-ignored attack per battle is treated as shielded instead.' },
    { name: 'Subvert Weakness', effect: 'First super-effective/extremely-effective hit per battle: attacker adds one less damage die.' },
];

const PassiveRow = ({ name, effect, freq }) => (
    <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--input-bg)', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{name}</span>
            {freq && <span style={{ fontSize: '11px', color: '#667eea', fontWeight: 'bold', background: 'rgba(102,126,234,0.1)', padding: '1px 6px', borderRadius: '8px' }}>{freq}</span>}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{effect}</div>
    </div>
);

const GymLeaderGuide = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Badge Count Scaling */}
        <div className="section-card-purple">
            <h3 className="section-title-purple">🏅 Gym Leader Difficulty (by Badge Count)</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Scale the Gym Leader's party and strategy to the party's current badge count.
            </p>
            <div style={{ display: 'grid', gap: '8px' }}>
                {BADGE_SCALING.map(row => (
                    <div key={row.range} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 14px', borderRadius: '8px', borderLeft: `4px solid ${row.color}`, background: `${row.color}11` }}>
                        <span style={{ fontWeight: 'bold', color: row.color, minWidth: '32px', fontSize: '13px' }}>{row.range}</span>
                        <span style={{ fontWeight: 'bold', color: row.color, minWidth: '76px', fontSize: '13px' }}>{row.level}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.desc}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Gym Pokémon Passives */}
        <div className="section-card-purple">
            <h3 className="section-title-purple">⚔️ Gym Pokémon Passives</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Stat passives can be assigned to Gym Leader and Gym Trainer Pokémon.
            </p>
            <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Stat Passives</div>
                {GYM_STAT_PASSIVES.map(p => <PassiveRow key={p.name} {...p} />)}
            </div>
            <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Ability Passives</div>
                {GYM_ABILITY_PASSIVES.map(p => <PassiveRow key={p.name} {...p} />)}
            </div>
        </div>

        {/* Gym Trainer Features */}
        <div className="section-card-purple">
            <h3 className="section-title-purple">🎽 Gym Trainer Features</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Gym Trainers (not the Leader) can use these once-per-day features.
            </p>
            {GYM_TRAINER_FEATURES.map(p => <PassiveRow key={p.name} {...p} />)}
        </div>

        {/* Elite Four Passives */}
        <div className="section-card-purple">
            <h3 className="section-title-purple">👑 Elite Four Passives</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Elite Four members receive stronger passives than standard Gym Leaders.
            </p>
            <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Stat Passives</div>
                {ELITE_STAT_PASSIVES.map(p => <PassiveRow key={p.name} {...p} />)}
            </div>
            <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Ability Passives</div>
                {ELITE_ABILITY_PASSIVES.map(p => <PassiveRow key={p.name} {...p} />)}
            </div>
        </div>
    </div>
);

export default GymLeaderGuide;
