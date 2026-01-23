// ============================================================
// Type Chart Section Component
// ============================================================

import React from 'react';
import { TYPE_CHART, POKEMON_TYPES } from '../../data/typeChart.js';

const TypeChartSection = () => {
    return (
        <div>
            <h3>Type Effectiveness Chart</h3>
            <div style={{ overflowX: 'auto' }}>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    marginTop: '20px',
                    fontSize: '14px'
                }}>
                    <thead>
                        <tr style={{ background: '#f8f9fa' }}>
                            <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>Type</th>
                            <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>Weak To (2x)</th>
                            <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>Resists (0.5x)</th>
                            <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>Immune (0x)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(TYPE_CHART).map(([type, data]) => (
                            <tr key={type}>
                                <td className="ref-cell-header">
                                    <span className={`type-badge type-${type.toLowerCase()}`}>{type}</span>
                                </td>
                                <td style={{ padding: '8px', border: '1px solid #dee2e6', color: '#f44336' }}>
                                    {data.weak.join(', ') || '—'}
                                </td>
                                <td style={{ padding: '8px', border: '1px solid #dee2e6', color: '#4caf50' }}>
                                    {data.resist.join(', ') || '—'}
                                </td>
                                <td style={{ padding: '8px', border: '1px solid #dee2e6', color: '#2196f3' }}>
                                    {data.immune.join(', ') || '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TypeChartSection;
