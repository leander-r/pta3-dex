// ============================================================
// Trainer Profile Component
// ============================================================

import React from 'react';
import { useTrainerContext } from '../../contexts/index.js';

/**
 * TrainerProfile - Trainer profile management
 * Uses TrainerContext for state management
 */
const TrainerProfile = () => {
    const {
        trainer,
        setTrainer,
        levelUpTrainer,
        levelDownTrainer,
        respecTrainer,
        calculateMaxHP
    } = useTrainerContext();
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const maxSize = 150;
                    let width = img.width, height = img.height;
                    if (width > height) {
                        if (width > maxSize) { height *= maxSize / width; width = maxSize; }
                    } else {
                        if (height > maxSize) { width *= maxSize / height; height = maxSize; }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                    setTrainer(prev => ({ ...prev, avatar: canvas.toDataURL('image/jpeg', 0.8) }));
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddBadge = () => {
        const badgeName = prompt('Enter badge name:');
        if (badgeName && badgeName.trim()) {
            setTrainer(prev => ({
                ...prev,
                badges: [...(prev.badges || []), {
                    name: badgeName.trim(),
                    id: Date.now(),
                    earnedAt: new Date().toISOString()
                }]
            }));
        }
    };

    const handleRemoveBadge = (badgeId, badgeName, index) => {
        if (confirm(`Remove "${badgeName}" badge?`)) {
            setTrainer(prev => ({
                ...prev,
                badges: (prev.badges || []).filter((b, i) => {
                    if (typeof b === 'string') return i !== index;
                    return b.id !== badgeId;
                })
            }));
        }
    };

    const isLevel0 = trainer.level === 0;
    const creationPointsRemaining = trainer.statPoints || 0;
    const hasClass = (trainer.classes || []).length > 0;
    const canLevelUp = !isLevel0 || (creationPointsRemaining === 0 && hasClass);

    return (
        <div className="section-card-purple">
            <h3 className="section-title-purple">
                <span>👤</span> Profile
            </h3>
            {isLevel0 && (
                <div style={{
                    background: 'linear-gradient(135deg, #fff3e0, #ffe0b2)',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    fontSize: '12px',
                    color: '#e65100',
                    border: '1px solid #ffcc80'
                }}>
                    <strong>Character Creation:</strong> Allocate your stat points (30 total, range 6-14), select a class, then level up to start playing!
                </div>
            )}

            {/* Avatar and Name Row */}
            <div className="trainer-profile-row" style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                {/* Avatar */}
                <div className="trainer-avatar-container" style={{ flexShrink: 0 }}>
                    {trainer.avatar ? (
                        <img
                            src={trainer.avatar}
                            alt="Avatar"
                            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #667eea' }}
                        />
                    ) : (
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: 'white' }}>
                            👤
                        </div>
                    )}
                    <div style={{ textAlign: 'center', marginTop: '5px' }}>
                        <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="trainerAvatarInput"
                            onChange={handleAvatarChange}
                        />
                        <button
                            className="btn btn-secondary"
                            style={{ padding: '3px 8px', fontSize: '10px' }}
                            onClick={() => document.getElementById('trainerAvatarInput').click()}
                        >
                            Change
                        </button>
                    </div>
                </div>

                {/* Name, Gender, Age */}
                <div className="trainer-info-inputs" style={{ flex: 1 }}>
                    <div style={{ marginBottom: '10px' }}>
                        <input
                            type="text"
                            value={trainer.name}
                            onChange={(e) => setTrainer(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Trainer Name..."
                            style={{ fontSize: '18px', fontWeight: 'bold', width: '100%', color: '#667eea' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                <input type="radio" name="trainerGender" checked={trainer.gender === 'male'} onChange={() => setTrainer(prev => ({ ...prev, gender: 'male' }))} />
                                <span style={{ color: '#2196f3' }}>♂</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                <input type="radio" name="trainerGender" checked={trainer.gender === 'female'} onChange={() => setTrainer(prev => ({ ...prev, gender: 'female' }))} />
                                <span style={{ color: '#e91e63' }}>♀</span>
                            </label>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ fontSize: '12px', color: '#667eea', fontWeight: '500' }}>Age:</span>
                            <input
                                type="number"
                                value={trainer.age || ''}
                                onChange={(e) => setTrainer(prev => ({ ...prev, age: e.target.value }))}
                                placeholder="—"
                                min="1"
                                max="999"
                                style={{ width: '55px', padding: '4px 6px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', textAlign: 'center', color: '#667eea', fontWeight: '500' }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Level Controls */}
            <div className="level-controls">
                <button
                    className="level-btn"
                    onClick={levelDownTrainer}
                    disabled={trainer.level <= 1}
                    aria-label="Decrease level"
                >
                    −
                </button>
                <div className="level-display">
                    <div className="level-label">LEVEL</div>
                    <div className="level-value">{trainer.level}</div>
                </div>
                <button
                    className="level-btn"
                    onClick={levelUpTrainer}
                    disabled={!canLevelUp}
                    title={!canLevelUp ? `Complete character creation first` : 'Level up trainer'}
                    aria-label="Increase level"
                >
                    +
                </button>
            </div>

            {/* Level 0 Checklist */}
            {isLevel0 && (
                <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    background: 'linear-gradient(135deg, #fff3e0, #ffe0b2)',
                    borderRadius: '8px',
                    border: '1px solid #ffcc80',
                    fontSize: '11px'
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#e65100' }}>
                        Character Creation Checklist
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: creationPointsRemaining === 0 ? '#2e7d32' : '#c62828' }}>
                        <span>{creationPointsRemaining === 0 ? '✓' : '○'}</span>
                        <span>Spend all 30 Creation points ({30 - creationPointsRemaining}/30)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasClass ? '#2e7d32' : '#c62828' }}>
                        <span>{hasClass ? '✓' : '○'}</span>
                        <span>Pick your first class</span>
                    </div>
                </div>
            )}

            {/* Respec Button */}
            <button
                onClick={respecTrainer}
                style={{
                    width: '100%',
                    marginTop: '10px',
                    padding: '8px',
                    fontSize: '11px',
                    background: 'linear-gradient(135deg, #ff9800, #f57c00)',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: '500'
                }}
                title="Reset trainer to Level 0 for character recreation (keeps Pokemon)"
            >
                🔄 Respec Trainer
            </button>

            {/* Quick Stats */}
            <div className="trainer-quick-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '15px' }}>
                <div style={{ textAlign: 'center', padding: '10px', background: '#fff', borderRadius: '8px' }} title="Max HP = (HP stat × 4) + (Level × 4)">
                    <div style={{ fontSize: '10px', color: '#666' }}>MAX HP</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e53935' }}>{calculateMaxHP()}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px', background: '#fff', borderRadius: '8px' }} title="Feat points are used to buy features. Gain points from leveling up.">
                    <div style={{ fontSize: '10px', color: '#666' }}>FEAT PTS</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: trainer.featPoints > 0 ? '#4caf50' : '#999' }}>{trainer.featPoints || 0}</div>
                </div>
            </div>

            {/* Money Input */}
            <div style={{ marginTop: '15px', padding: '12px', background: 'linear-gradient(135deg, #ffd700, #ffb300)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 'bold', color: '#5d4e00', fontSize: '12px' }}>💰 MONEY</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontWeight: 'bold', color: '#5d4e00', fontSize: '18px' }}>₽</span>
                        <input
                            type="number"
                            value={trainer.money || 0}
                            onChange={(e) => setTrainer(prev => ({ ...prev, money: parseInt(e.target.value) || 0 }))}
                            style={{
                                width: '100px',
                                padding: '5px 8px',
                                border: '2px solid #c9a800',
                                borderRadius: '6px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                textAlign: 'right',
                                background: 'rgba(255,255,255,0.9)'
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Badges Section */}
            <div style={{ marginTop: '15px', padding: '12px', background: 'linear-gradient(135deg, #e8eaf6, #c5cae9)', borderRadius: '10px', border: '1px solid #9fa8da' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: '#303f9f', fontSize: '12px' }}>🏅 BADGES ({(trainer.badges || []).length})</span>
                    <button
                        onClick={handleAddBadge}
                        style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            background: 'linear-gradient(135deg, #5c6bc0, #3f51b5)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        + Add Badge
                    </button>
                </div>

                {(trainer.badges || []).length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {(trainer.badges || []).map((badge, index) => {
                            const badgeName = typeof badge === 'string' ? badge : badge.name;
                            const badgeId = typeof badge === 'string' ? index : badge.id;
                            return (
                                <div
                                    key={badgeId}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '4px 8px',
                                        background: 'linear-gradient(135deg, #ffd54f, #ffb300)',
                                        borderRadius: '12px',
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        color: '#5d4e00',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                                        border: '1px solid #ffc107'
                                    }}
                                >
                                    <span>🏅</span>
                                    <span>{badgeName}</span>
                                    <button
                                        onClick={() => handleRemoveBadge(badgeId, badgeName, index)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '0 2px',
                                            fontSize: '10px',
                                            color: '#8d6e00',
                                            opacity: 0.7
                                        }}
                                        title="Remove badge"
                                    >
                                        ✕
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '10px',
                        color: '#5c6bc0',
                        fontSize: '11px',
                        fontStyle: 'italic',
                        background: 'rgba(255,255,255,0.5)',
                        borderRadius: '6px'
                    }}>
                        No badges earned yet
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrainerProfile;
