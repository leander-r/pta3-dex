// ============================================================
// Trainer Profile Component
// ============================================================

import React from 'react';
import { useTrainerContext, useModal } from '../../contexts/index.js';
import { CREATION_STAT_POINTS } from '../../data/constants.js';

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
    const { showConfirm } = useModal();

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
        showConfirm({
            title: 'Add Badge',
            message: 'Enter badge name:',
            confirmLabel: 'Add',
            inputConfig: { placeholder: 'Badge name...', defaultValue: '' },
            onConfirm: (name) => {
                if (name?.trim()) {
                    setTrainer(prev => ({
                        ...prev,
                        badges: [...(prev.badges || []), {
                            name: name.trim(),
                            id: Date.now(),
                            earnedAt: new Date().toISOString()
                        }]
                    }));
                }
            }
        });
    };

    const handleRemoveBadge = (badgeId, badgeName, index) => {
        showConfirm({
            title: 'Remove Badge',
            message: `Remove "${badgeName}" badge?`,
            danger: true,
            onConfirm: () => {
                setTrainer(prev => ({
                    ...prev,
                    badges: (prev.badges || []).filter((b, i) => {
                        if (typeof b === 'string') return i !== index;
                        return b.id !== badgeId;
                    })
                }));
            }
        });
    };

    const isLevel0 = trainer.level === 0;
    const creationPointsRemaining = trainer.statPoints || 0;
    const hasClass = (trainer.classes || []).length > 0;
    const canLevelUp = !isLevel0 || (creationPointsRemaining === 0 && hasClass);
    const badges = trainer.badges || [];

    return (
        <div className="section-card-orange">

            {/* ── Gradient Header Banner (Pokémon-card style) ── */}
            <div style={{
                margin: '-20px -20px 16px -20px',
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '10px 10px 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative pokéball watermark circles */}
                <div style={{ position: 'absolute', right: '-28px', top: '-28px', width: '110px', height: '110px', borderRadius: '50%', border: '16px solid rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', right: '18px', bottom: '-18px', width: '70px', height: '70px', borderRadius: '50%', border: '10px solid rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', left: '-15px', bottom: '-15px', width: '60px', height: '60px', borderRadius: '50%', border: '8px solid rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

                {/* Avatar orb — click to change */}
                <div
                    style={{ position: 'relative', flexShrink: 0, cursor: 'pointer', zIndex: 1 }}
                    onClick={() => document.getElementById('trainerAvatarInput').click()}
                    title="Click to change avatar"
                >
                    <div style={{
                        width: '76px',
                        height: '76px',
                        borderRadius: '50%',
                        background: trainer.avatar
                            ? 'transparent'
                            : 'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.12) 45%, rgba(0,0,0,0.18) 100%)',
                        boxShadow: '0 3px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        border: '3px solid rgba(255,255,255,0.4)'
                    }}>
                        {trainer.avatar
                            ? <img src={trainer.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ fontSize: '34px' }}>👤</span>
                        }
                    </div>
                    {/* Camera badge */}
                    <span style={{
                        position: 'absolute', bottom: '2px', right: '0px',
                        background: 'rgba(0,0,0,0.55)', borderRadius: '50%',
                        width: '22px', height: '22px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', border: '1px solid rgba(255,255,255,0.3)',
                        pointerEvents: 'none'
                    }}>📷</span>
                    <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="trainerAvatarInput"
                        onChange={handleAvatarChange}
                    />
                </div>

                {/* Name + identity */}
                <div style={{ flex: 1, minWidth: 0, zIndex: 1 }}>
                    <input
                        type="text"
                        value={trainer.name}
                        onChange={(e) => setTrainer(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Trainer Name..."
                        className="trainer-header-input"
                        style={{
                            fontSize: '20px',
                            fontWeight: '800',
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: '2px solid rgba(255,255,255,0.35)',
                            outline: 'none',
                            padding: '2px 0',
                            color: 'white',
                            fontFamily: 'inherit'
                        }}
                    />
                    {/* Row: gender + age */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '8px' }}>
                        {/* Gender */}
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {[['male', '♂', '#90caf9'], ['female', '♀', '#f48fb1']].map(([val, sym, col]) => (
                                <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', fontSize: '15px', color: col }}>
                                    <input
                                        type="radio"
                                        name="trainerGender"
                                        checked={trainer.gender === val}
                                        onChange={() => setTrainer(prev => ({ ...prev, gender: val }))}
                                        style={{ accentColor: col }}
                                    />
                                    {sym}
                                </label>
                            ))}
                        </div>
                        {/* Age */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', fontWeight: '500' }}>Age</span>
                            <input
                                type="number"
                                value={trainer.age || ''}
                                onChange={(e) => setTrainer(prev => ({ ...prev, age: e.target.value }))}
                                placeholder="—"
                                min="1"
                                max="999"
                                className="trainer-header-input"
                                style={{
                                    width: '46px',
                                    padding: '2px 4px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    textAlign: 'center',
                                    background: 'rgba(255,255,255,0.15)',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    color: 'white',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>
                    {/* Row: class pills */}
                    {(trainer.classes || []).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
                            {(trainer.classes || []).map((cls, i) => (
                                <span key={i} style={{
                                    padding: '2px 8px',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    background: 'rgba(255,255,255,0.18)',
                                    color: 'white',
                                    border: '1px solid rgba(255,255,255,0.3)'
                                }}>
                                    {cls}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Character creation tip */}
            {isLevel0 && (
                <div style={{
                    background: 'var(--warning-bg, #fff3e0)',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    fontSize: '12px',
                    color: 'var(--warning-text, #e65100)',
                    border: '1px solid var(--warning-border, #ffcc80)'
                }}>
                    <strong>Character Creation:</strong> Allocate stat points (30 total, range 6–14), pick a class, then level up to begin!
                </div>
            )}

            {/* Level Controls */}
            <div className="level-controls">
                <button
                    className="level-btn"
                    onClick={levelDownTrainer}
                    disabled={trainer.level <= 1}
                    aria-label="Decrease level"
                >−</button>
                <div className="level-display">
                    <div className="level-label">LEVEL</div>
                    <div className="level-value">{trainer.level}</div>
                </div>
                <button
                    className="level-btn"
                    onClick={levelUpTrainer}
                    disabled={!canLevelUp}
                    title={!canLevelUp ? 'Complete character creation first' : 'Level up trainer'}
                    aria-label="Increase level"
                >+</button>
            </div>

            {/* Level 0 Checklist */}
            {isLevel0 && (
                <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    background: 'var(--warning-bg, #fff3e0)',
                    borderRadius: '8px',
                    border: '1px solid var(--warning-border, #ffcc80)',
                    fontSize: '12px'
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '6px', color: 'var(--warning-text, #e65100)' }}>
                        Character Creation Checklist
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: creationPointsRemaining === 0 ? '#2e7d32' : '#c62828' }}>
                        <span>{creationPointsRemaining === 0 ? '✓' : '○'}</span>
                        <span>Spend all {CREATION_STAT_POINTS} Creation points ({CREATION_STAT_POINTS - creationPointsRemaining}/{CREATION_STAT_POINTS})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasClass ? '#2e7d32' : '#c62828' }}>
                        <span>{hasClass ? '✓' : '○'}</span>
                        <span>Pick your first class</span>
                    </div>
                </div>
            )}

            {/* Quick Stats — 3 boxes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '14px' }}>
                <div
                    style={{ textAlign: 'center', padding: '10px 6px', background: 'linear-gradient(180deg, var(--quick-stat-hp-tint, #ffebee) 0%, var(--card-bg, #fff) 70%)', borderRadius: '8px', borderTop: '3px solid #e53935' }}
                    title="Max HP = (HP stat × 4) + (Level × 4)"
                >
                    <div style={{ fontSize: '10px', color: '#e53935', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Max HP</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e53935', lineHeight: 1.2 }}>{calculateMaxHP()}</div>
                </div>
                <div
                    style={{ textAlign: 'center', padding: '10px 6px', background: `linear-gradient(180deg, ${(trainer.featPoints || 0) > 0 ? 'var(--quick-stat-feat-tint, #fff3e0)' : 'var(--bg-light, #f5f5f5)'} 0%, var(--card-bg, #fff) 70%)`, borderRadius: '8px', borderTop: 'var(--poke-orange, #f5a623) 3px solid' }}
                    title="Feat points are used to buy features. Gain points from leveling up."
                >
                    <div style={{ fontSize: '10px', color: (trainer.featPoints || 0) > 0 ? 'var(--poke-orange-dark, #e8941c)' : 'var(--text-muted, #666)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Feat Pts</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: (trainer.featPoints || 0) > 0 ? 'var(--poke-orange, #f5a623)' : '#999', lineHeight: 1.2 }}>{trainer.featPoints || 0}</div>
                </div>
                <div
                    style={{ textAlign: 'center', padding: '10px 6px', background: 'linear-gradient(180deg, var(--quick-stat-badge-tint, #ede7f6) 0%, var(--card-bg, #fff) 70%)', borderRadius: '8px', borderTop: '3px solid var(--color-purple, #667eea)' }}
                    title="Gym Badges earned"
                >
                    <div style={{ fontSize: '10px', color: 'var(--color-purple, #667eea)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🏅 Badges</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-purple, #667eea)', lineHeight: 1.2 }}>{badges.length}</div>
                </div>
            </div>

            {/* Money + Respec row */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px', alignItems: 'center' }}>
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    background: 'linear-gradient(135deg, #ffd700, #ffb300)',
                    borderRadius: '8px'
                }}>
                    <span style={{ fontWeight: 'bold', color: '#5d4e00', fontSize: '14px' }}>💰</span>
                    <span style={{ fontWeight: 'bold', color: '#5d4e00', fontSize: '16px' }}>₽</span>
                    <input
                        type="number"
                        value={trainer.money || 0}
                        onChange={(e) => setTrainer(prev => ({ ...prev, money: parseInt(e.target.value) || 0 }))}
                        style={{
                            flex: 1,
                            padding: '3px 6px',
                            border: '2px solid #c9a800',
                            borderRadius: '5px',
                            fontSize: '15px',
                            fontWeight: 'bold',
                            textAlign: 'right',
                            background: 'rgba(255,255,255,0.88)',
                            minWidth: 0
                        }}
                    />
                </div>
                <button
                    onClick={respecTrainer}
                    style={{
                        padding: '8px 12px',
                        fontSize: '13px',
                        background: 'linear-gradient(135deg, #ff9800, #f57c00)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: '500',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                    }}
                    title="Reset trainer to Level 0 for character recreation (keeps Pokémon)"
                >
                    🔄 Respec
                </button>
            </div>

            {/* Badges */}
            <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--color-purple, #667eea)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        🏅 Badges ({badges.length})
                    </span>
                    <button
                        onClick={handleAddBadge}
                        style={{
                            padding: '3px 10px',
                            fontSize: '12px',
                            background: 'linear-gradient(135deg, var(--poke-orange, #f5a623), var(--poke-orange-dark, #e8941c))',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        + Add
                    </button>
                </div>

                {badges.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {badges.map((badge, index) => {
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
                                        fontSize: '12px',
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
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontSize: '11px', color: '#8d6e00', opacity: 0.7 }}
                                        title="Remove badge"
                                    >✕</button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '8px',
                        color: 'var(--text-muted, #999)',
                        fontSize: '12px',
                        fontStyle: 'italic',
                        background: 'var(--bg-light, #f5f5f5)',
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
