// ============================================================
// EXP Chart Section Component
// ============================================================

import React from 'react';
import { GAME_DATA } from '../../data/configs.js';

const ExpChartSection = () => {
    const expChart = GAME_DATA.pokemonExpChart || {};
    const levels = Object.keys(expChart).map(Number).sort((a, b) => a - b);

    // Group levels in rows of 10 for better display
    const levelGroups = [];
    for (let i = 0; i < levels.length; i += 10) {
        levelGroups.push(levels.slice(i, i + 10));
    }

    return (
        <div>
            <h3>Pokemon Experience Chart</h3>
            <p style={{ marginBottom: '15px', fontSize: '13px', color: '#666' }}>
                Experience points required to reach each level.
            </p>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                        <tr style={{ background: '#667eea', color: 'white' }}>
                            <th style={{ padding: '8px', textAlign: 'center', width: '60px' }}>Level</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Total EXP</th>
                            <th style={{ padding: '8px', textAlign: 'center', width: '60px' }}>Level</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Total EXP</th>
                            <th style={{ padding: '8px', textAlign: 'center', width: '60px' }}>Level</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Total EXP</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: Math.ceil(levels.length / 3) }).map((_, rowIdx) => {
                            const level1 = levels[rowIdx];
                            const level2 = levels[rowIdx + 34];
                            const level3 = levels[rowIdx + 67];

                            return (
                                <tr key={rowIdx} style={{ background: rowIdx % 2 === 0 ? '#f8f9fa' : 'white' }}>
                                    {level1 !== undefined && (
                                        <>
                                            <td style={{ padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{level1}</td>
                                            <td style={{ padding: '6px', textAlign: 'right' }}>{(expChart[level1] || 0).toLocaleString()}</td>
                                        </>
                                    )}
                                    {level1 === undefined && <><td></td><td></td></>}

                                    {level2 !== undefined && (
                                        <>
                                            <td style={{ padding: '6px', textAlign: 'center', fontWeight: 'bold', borderLeft: '2px solid #dee2e6' }}>{level2}</td>
                                            <td style={{ padding: '6px', textAlign: 'right' }}>{(expChart[level2] || 0).toLocaleString()}</td>
                                        </>
                                    )}
                                    {level2 === undefined && <><td style={{ borderLeft: '2px solid #dee2e6' }}></td><td></td></>}

                                    {level3 !== undefined && (
                                        <>
                                            <td style={{ padding: '6px', textAlign: 'center', fontWeight: 'bold', borderLeft: '2px solid #dee2e6' }}>{level3}</td>
                                            <td style={{ padding: '6px', textAlign: 'right' }}>{(expChart[level3] || 0).toLocaleString()}</td>
                                        </>
                                    )}
                                    {level3 === undefined && <><td style={{ borderLeft: '2px solid #dee2e6' }}></td><td></td></>}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Quick Reference */}
            <div style={{ marginTop: '20px', padding: '15px', background: '#e8eaf6', borderRadius: '8px' }}>
                <h4 style={{ marginBottom: '10px', color: '#303f9f' }}>Key Milestones</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                    {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(level => (
                        <div key={level} style={{ padding: '8px', background: 'white', borderRadius: '6px', textAlign: 'center' }}>
                            <div style={{ fontWeight: 'bold', color: '#667eea' }}>Level {level}</div>
                            <div style={{ fontSize: '12px' }}>{(expChart[level] || 0).toLocaleString()} EXP</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ExpChartSection;
