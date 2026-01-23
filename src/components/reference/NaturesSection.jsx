// ============================================================
// Natures Section Component
// ============================================================

import React from 'react';
import { GAME_DATA } from '../../data/configs.js';

const NaturesSection = () => {
    return (
        <div>
            <h3>Nature Effects ({Object.keys(GAME_DATA.natures || {}).length} Natures)</h3>
            <p style={{ marginBottom: '15px', fontSize: '13px', color: '#666' }}>
                Natures modify base stats by +1/-1. HP modifications are always just +1 or -1 to the HP Base Stat.
            </p>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ background: '#667eea', color: 'white' }}>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Nature</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>Raises</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>Lowers</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>Likes</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>Dislikes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(GAME_DATA.natures || {}).map(([nature, data], index) => (
                            <tr key={nature} style={{ background: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                                <td style={{ padding: '8px', fontWeight: 'bold' }}>{nature}</td>
                                <td style={{ padding: '8px', textAlign: 'center', color: '#4caf50' }}>
                                    {data.buff ? data.buff.toUpperCase() : '—'}
                                </td>
                                <td style={{ padding: '8px', textAlign: 'center', color: '#f44336' }}>
                                    {data.nerf ? data.nerf.toUpperCase() : '—'}
                                </td>
                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                    {data.likedFlavor || 'None'}
                                </td>
                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                    {data.dislikedFlavor || 'None'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default NaturesSection;
