// ============================================================
// Detail Modal Component
// ============================================================
// Shows full info for moves, features, abilities, skills, items

import React from 'react';
import { getTypeColor } from '../../utils/typeUtils.js';

const DetailModal = ({ detailModal, setDetailModal }) => {
    if (!detailModal.show) return null;

    const closeModal = () => setDetailModal({ show: false, type: '', name: '', data: null });

    const getHeaderBackground = () => {
        switch (detailModal.type) {
            case 'move':
                return `linear-gradient(135deg, ${getTypeColor(detailModal.data?.type)}, ${getTypeColor(detailModal.data?.type)}dd)`;
            case 'feature':
                return 'linear-gradient(135deg, #667eea, #764ba2)';
            case 'ability':
                return 'linear-gradient(135deg, #f093fb, #f5576c)';
            case 'skill':
                return 'linear-gradient(135deg, #4facfe, #00f2fe)';
            case 'item':
                return 'linear-gradient(135deg, #fa709a, #fee140)';
            default:
                return 'linear-gradient(135deg, #667eea, #764ba2)';
        }
    };

    const getIcon = () => {
        switch (detailModal.type) {
            case 'move': return '⚔️';
            case 'feature': return '⚡';
            case 'ability': return '✨';
            case 'skill': return '🎯';
            case 'item': return '🎒';
            default: return '📋';
        }
    };

    const getContestTypeColor = (contestType) => {
        switch (contestType) {
            case 'Beauty': return '#e91e63';
            case 'Cool': return '#2196f3';
            case 'Cute': return '#ff9800';
            case 'Smart': return '#4caf50';
            case 'Tough': return '#795548';
            default: return '#9c27b0';
        }
    };

    const getStatColor = (stat) => {
        const colors = {
            HP: '#4caf50',
            ATK: '#f44336',
            DEF: '#2196f3',
            SATK: '#9c27b0',
            SDEF: '#ff9800',
            SPD: '#00bcd4'
        };
        return colors[stat] || '#667eea';
    };

    return (
        <div className="modal-overlay" onClick={closeModal}>
            <div
                className="modal"
                style={{ maxWidth: '550px', maxHeight: '80vh', overflow: 'auto' }}
                onClick={e => e.stopPropagation()}
            >
                <div
                    className="modal-header"
                    style={{ background: getHeaderBackground(), color: 'white' }}
                >
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>{getIcon()}</span>
                        {detailModal.name}
                    </h3>
                    <button
                        onClick={closeModal}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            fontSize: '20px',
                            cursor: 'pointer',
                            color: 'white',
                            borderRadius: '50%',
                            width: '30px',
                            height: '30px'
                        }}
                    >
                        ×
                    </button>
                </div>

                <div className="p-20">
                    {/* Move Details */}
                    {detailModal.type === 'move' && detailModal.data && (
                        <MoveDetails data={detailModal.data} getContestTypeColor={getContestTypeColor} />
                    )}

                    {/* Feature Details */}
                    {detailModal.type === 'feature' && (
                        <FeatureDetails data={detailModal.data} name={detailModal.name} />
                    )}

                    {/* Ability Details */}
                    {detailModal.type === 'ability' && (
                        <AbilityDetails data={detailModal.data} />
                    )}

                    {/* Skill Details */}
                    {detailModal.type === 'skill' && detailModal.data && (
                        <SkillDetails data={detailModal.data} getStatColor={getStatColor} />
                    )}

                    {/* Item Details */}
                    {detailModal.type === 'item' && detailModal.data && (
                        <ItemDetails data={detailModal.data} />
                    )}
                </div>
            </div>
        </div>
    );
};

// Move Details Sub-component
const MoveDetails = ({ data, getContestTypeColor }) => (
    <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
            <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 'bold',
                background: getTypeColor(data.type),
                color: 'white'
            }}>
                {data.type}
            </span>
            <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                background: data.category === 'Physical' ? '#f44336' : data.category === 'Special' ? '#2196f3' : '#9e9e9e',
                color: 'white'
            }}>
                {data.category}
            </span>
            {data.frequency && (
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', background: '#ff9800', color: 'white' }}>
                    {data.frequency}
                </span>
            )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '15px' }}>
            {data.damage && (
                <div style={{ background: '#ffebee', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', color: '#c62828', fontWeight: 'bold' }}>DAMAGE</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#b71c1c' }}>{data.damage}</div>
                </div>
            )}
            {data.ac && (
                <div style={{ background: '#e3f2fd', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', color: '#1565c0', fontWeight: 'bold' }}>ACCURACY</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0d47a1' }}>{data.ac}</div>
                </div>
            )}
            {data.range && (
                <div style={{ background: '#f3e5f5', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', color: '#7b1fa2', fontWeight: 'bold' }}>RANGE</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#4a148c' }}>{data.range}</div>
                </div>
            )}
        </div>

        {data.effect && (
            <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: '#2e7d32', fontWeight: 'bold', marginBottom: '5px' }}>TARGET / EFFECT</div>
                <div style={{ fontSize: '14px', lineHeight: '1.5', color: '#1b5e20' }}>{data.effect}</div>
            </div>
        )}

        {data.description && (
            <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: '#666', fontWeight: 'bold', marginBottom: '5px' }}>DESCRIPTION</div>
                <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#333' }}>{data.description}</div>
            </div>
        )}

        {(data.contestType || data.contestEffect || data.contest) && (
            <div style={{
                background: 'linear-gradient(135deg, #fce4ec, #f3e5f5)',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '10px',
                border: '1px solid #f8bbd9'
            }}>
                <div style={{ fontSize: '11px', color: '#ad1457', fontWeight: 'bold', marginBottom: '8px' }}>🎭 CONTEST</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    {data.contestType && (
                        <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            background: getContestTypeColor(data.contestType),
                            color: 'white'
                        }}>
                            {data.contestType}
                        </span>
                    )}
                    {data.contestDice && (
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#7b1fa2' }}>
                            🎲 {data.contestDice}
                        </span>
                    )}
                </div>
                {data.contestEffect && (
                    <div style={{ fontSize: '13px', lineHeight: '1.5', color: '#6a1b9a', marginTop: '8px' }}>
                        {data.contestEffect}
                    </div>
                )}
                {data.contest && !data.contestType && (
                    <div style={{ fontSize: '13px', lineHeight: '1.5', color: '#6a1b9a' }}>
                        {data.contest}
                    </div>
                )}
            </div>
        )}

        {data.notes && (
            <div style={{ background: '#fff3e0', padding: '15px', borderRadius: '8px', marginBottom: '10px', border: '1px solid #ffcc80' }}>
                <div style={{ fontSize: '11px', color: '#e65100', fontWeight: 'bold', marginBottom: '5px' }}>📝 NOTES</div>
                <div style={{ fontSize: '13px', lineHeight: '1.5', color: '#bf360c' }}>{data.notes}</div>
            </div>
        )}
    </div>
);

// Feature Details Sub-component
const FeatureDetails = ({ data, name }) => {
    // Handle missing data gracefully
    if (!data) {
        return (
            <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#666' }}>
                    Feature data not found in database. This feature may be custom or from an external source.
                </div>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
                {data.category && (
                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: '#667eea', color: 'white' }}>
                        {data.category}
                    </span>
                )}
                {data.isBase && (
                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: '#ff9800', color: 'white' }}>
                        Base Feature
                    </span>
                )}
                {data.frequency && (
                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', background: '#4caf50', color: 'white' }}>
                        {data.frequency}
                    </span>
                )}
            </div>

            {data.prerequisites && (
                <div style={{ background: '#fff3e0', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#e65100', fontWeight: 'bold', marginBottom: '3px' }}>PREREQUISITES</div>
                    <div className="text-13">{data.prerequisites}</div>
                </div>
            )}

            {data.trigger && (
                <div style={{ background: '#fce4ec', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#c2185b', fontWeight: 'bold', marginBottom: '3px' }}>TRIGGER</div>
                    <div className="text-13">{data.trigger}</div>
                </div>
            )}

            {data.target && (
                <div style={{ background: '#e8eaf6', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#303f9f', fontWeight: 'bold', marginBottom: '3px' }}>TARGET</div>
                    <div className="text-13">{data.target}</div>
                </div>
            )}

            {data.effect && (
                <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#666', fontWeight: 'bold', marginBottom: '5px' }}>EFFECT</div>
                    <div style={{ fontSize: '14px', lineHeight: '1.6' }}>{data.effect}</div>
                </div>
            )}

            {data.description && !data.effect && (
                <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#666', fontWeight: 'bold', marginBottom: '5px' }}>DESCRIPTION</div>
                    <div style={{ fontSize: '14px', lineHeight: '1.6' }}>{data.description}</div>
                </div>
            )}
        </div>
    );
};

// Ability Details Sub-component
const AbilityDetails = ({ data }) => (
    <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
        <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
            {typeof data === 'string' ? data : data?.effect || data?.description || 'No description available.'}
        </div>
    </div>
);

// Skill Details Sub-component
const SkillDetails = ({ data, getStatColor }) => (
    <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
            {data.stat && (
                <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    background: getStatColor(data.stat),
                    color: 'white'
                }}>
                    {data.stat}
                </span>
            )}
            {data.type && (
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', background: '#e0e0e0', color: '#333' }}>
                    {data.type}
                </span>
            )}
        </div>

        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                {data.description || 'No description available.'}
            </div>
        </div>
    </div>
);

// Item Details Sub-component
const ItemDetails = ({ data }) => (
    <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
            {data.category && (
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: '#ff9800', color: 'white' }}>
                    {data.category}
                </span>
            )}
            {data.price && (
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', background: '#ffd700', color: '#5d4e00' }}>
                    ₽{data.price}
                </span>
            )}
        </div>

        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                {data.effect || data.description || 'No description available.'}
            </div>
        </div>
    </div>
);

export default DetailModal;
