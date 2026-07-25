// ============================================================
// Gym Leader & Elite Four Difficulty Guide
// ============================================================

import React from 'react';
import { useUI } from '../../contexts/index.js';
import { HELP_BTN_STYLE } from '../common/helpBtnStyle.js';
import { GYM_STAT_PASSIVES, GYM_ABILITY_PASSIVES, GYM_TRAINER_FEATURES, ELITE_STAT_PASSIVES, ELITE_ABILITY_PASSIVES } from '../../data/gymPassives.js';

const BADGE_SCALING = [
    { range: '0–1', level: 'Easy',      color: '#4caf50', desc: '1 Pokémon (basic/unevolved). Gym trainers use first-stage Pokémon.' },
    { range: '2–4', level: 'Normal',    color: '#2196f3', desc: '2 Pokémon, one may be fully evolved. Gym trainers avoid fully evolved.' },
    { range: '5–6', level: 'Hard',      color: '#ff9800', desc: '3 Pokémon with special moves/passives. Gym trainers synergize (buffs, heals). GM uses trainer actions.' },
    { range: '7+',  level: 'Dangerous', color: '#f44336', desc: '4–5 Pokémon. Complex sequencing, heavy passives/stats. May use Z-Moves or Terastallization.' },
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

const GymLeaderGuide = () => {
    const { showHelp } = useUI();
    return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Badge Count Scaling */}
        <div className="section-card-purple">
            <h3 className="section-title-purple" aria-label="Gym Leader Difficulty (by Badge Count)">
                🏅 Gym Leader Difficulty (by Badge Count)
                <button
                    onClick={(e) => { e.stopPropagation(); showHelp('gm-gym'); }}
                    style={HELP_BTN_STYLE}
                    aria-label="Help: Gym Guide"
                    title="About the gym guide"
                >?</button>
            </h3>
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
};

export default GymLeaderGuide;
