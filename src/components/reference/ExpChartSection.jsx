// ============================================================
// Honor Thresholds Section Component (PTA3)
// ============================================================
// Replaces the old EXP chart — PTA3 uses Honors for leveling

import React from 'react';
import { HONOR_THRESHOLDS, HP_MILESTONE_LEVELS, CLASS_2_MIN_LEVEL, CLASS_3_MIN_LEVEL, CLASS_4_MIN_LEVEL } from '../../data/constants.js';

const HonorThresholdsSection = () => {
    const levels = Object.keys(HONOR_THRESHOLDS).map(Number).sort((a, b) => a - b);

    const getNotesForLevel = (level) => {
        const notes = [];
        if (level === 1) notes.push('1st class');
        if (level === CLASS_2_MIN_LEVEL) notes.push('2nd class');
        if (level === CLASS_3_MIN_LEVEL) notes.push('3rd class');
        if (level === CLASS_4_MIN_LEVEL) notes.push('4th class');
        if (HP_MILESTONE_LEVELS.includes(level)) notes.push('HP roll (1d4)');
        return notes.join(', ');
    };

    return (
        <div>
            <h3>Trainer Level — Honor Thresholds</h3>
            <p style={{ marginBottom: '15px', fontSize: '13px', color: 'var(--text-muted)' }}>
                Trainers level up by earning <strong>Honors</strong> (Gym Badges, Contest Ribbons, story milestones, etc.).
                Each level grants <strong>+2 stat points</strong>. HP milestone rolls (1d4) occur at levels 3, 7, and 11.
                New class slots unlock at levels 3, 7, and 11.
            </p>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ background: 'var(--color-purple)', color: 'white' }}>
                            <th style={{ padding: '10px', textAlign: 'center', width: '70px' }}>Level</th>
                            <th style={{ padding: '10px', textAlign: 'center', width: '110px' }}>Honors Needed</th>
                            <th style={{ padding: '10px', textAlign: 'center', width: '110px' }}>Stat Points</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Unlocks / Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {levels.map((level, idx) => {
                            const honors = HONOR_THRESHOLDS[level];
                            const notes = getNotesForLevel(level);
                            const isSpecial = HP_MILESTONE_LEVELS.includes(level) ||
                                [CLASS_2_MIN_LEVEL, CLASS_3_MIN_LEVEL, CLASS_4_MIN_LEVEL].includes(level);
                            return (
                                <tr
                                    key={level}
                                    style={{
                                        background: isSpecial
                                            ? 'var(--highlight-row-bg, rgba(102,126,234,0.08))'
                                            : idx % 2 === 0 ? 'var(--bg-light)' : 'var(--input-bg)'
                                    }}
                                >
                                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: isSpecial ? 'var(--color-purple)' : 'var(--text-primary)' }}>
                                        {level}
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'center', color: 'var(--text-primary)' }}>
                                        {honors}
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'center', color: '#4caf50', fontWeight: 'bold' }}>
                                        {level === 0 ? '—' : '+2'}
                                    </td>
                                    <td style={{ padding: '8px', fontSize: '12px', color: isSpecial ? 'var(--color-purple)' : 'var(--text-muted)' }}>
                                        {notes || '—'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '20px', padding: '15px', background: 'var(--bg-secondary, #e8eaf6)', borderRadius: '8px' }}>
                <h4 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>Quick Summary</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', fontSize: '13px' }}>
                    <div style={{ padding: '10px', background: 'var(--bg-primary)', borderRadius: '6px' }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--color-purple)' }}>Max Level</div>
                        <div>Level 15 (40 Honors)</div>
                    </div>
                    <div style={{ padding: '10px', background: 'var(--bg-primary)', borderRadius: '6px' }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--color-purple)' }}>Stat Points</div>
                        <div>+2 per level, up to +28 total</div>
                    </div>
                    <div style={{ padding: '10px', background: 'var(--bg-primary)', borderRadius: '6px' }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--color-purple)' }}>HP Milestones</div>
                        <div>Roll 1d4 at Levels 3, 7, 11</div>
                    </div>
                    <div style={{ padding: '10px', background: 'var(--bg-primary)', borderRadius: '6px' }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--color-purple)' }}>Class Slots</div>
                        <div>1st at Lv1 · 2nd at Lv3 · 3rd at Lv7 · 4th at Lv11</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HonorThresholdsSection;
