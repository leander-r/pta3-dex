// ============================================================
// Bulk Honor Award Modal Component (PTA3)
// ============================================================
// Modal for awarding Honors to the active trainer
// (Replaces the old Bulk EXP modal — PTA3 uses Honors for leveling)

import React, { useState } from 'react';
import useModalKeyboard from '../../hooks/useModalKeyboard.js';
import { useModal } from '../../contexts/index.js';
import { useTrainerContext } from '../../contexts/TrainerContext.jsx';
import toast from '../../utils/toast.js';
import { HONOR_THRESHOLDS, MAX_TRAINER_LEVEL } from '../../data/constants.js';

const getLevelForHonors = (honors) => {
    const levels = Object.keys(HONOR_THRESHOLDS).map(Number).sort((a, b) => a - b);
    let level = levels[0] ?? 1;
    for (const lvl of levels) {
        if (honors >= HONOR_THRESHOLDS[lvl]) {
            level = lvl;
        } else {
            break;
        }
    }
    return Math.min(level, MAX_TRAINER_LEVEL);
};

const BulkHonorsModal = () => {
    const { showBulkHonorsModal, setShowBulkHonorsModal } = useModal();
    const { trainer, awardHonors } = useTrainerContext();

    const [honorAmount, setHonorAmount] = useState(1);
    const [lastResult, setLastResult] = useState(null);

    const handleClose = () => {
        setShowBulkHonorsModal(false);
        setHonorAmount(1);
        setLastResult(null);
    };

    const { modalRef } = useModalKeyboard(showBulkHonorsModal, handleClose);

    const currentHonors = trainer?.honors || 0;
    const currentLevel  = trainer?.level  || 1;
    const newHonors     = currentHonors + honorAmount;
    const newLevel      = getLevelForHonors(newHonors);
    const levelsGained  = newLevel - currentLevel;

    const nextLevel = Math.min(currentLevel + 1, MAX_TRAINER_LEVEL);
    const honorsForNext = HONOR_THRESHOLDS[nextLevel] ?? HONOR_THRESHOLDS[MAX_TRAINER_LEVEL] ?? 0;
    const honorsToNext  = Math.max(0, honorsForNext - currentHonors);

    const handleAwardHonors = () => {
        if (honorAmount <= 0) return;
        awardHonors(honorAmount);
        setLastResult({ honorAmount, newHonors, levelsGained, newLevel });
        if (levelsGained > 0) {
            const milestones = [3, 7, 11].filter(m => m > currentLevel && m <= newLevel);
            const parts = [`Reached Level ${newLevel}!`];
            if (milestones.length > 0) parts.push(`+2 stat points & HP roll at level${milestones.length > 1 ? 's' : ''} ${milestones.join(', ')}`);
            toast.success(parts.join(' — '));
        }
        setHonorAmount(1);
    };

    if (!showBulkHonorsModal) return null;

    return (
        <div className="modal-overlay" onClick={handleClose} role="presentation">
            <div
                ref={modalRef}
                className="modal"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="bulk-honors-modal-title"
                style={{ maxWidth: '420px', width: '95%' }}
            >
                <div
                    className="modal-header"
                    style={{
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: 'white',
                        margin: '-25px -25px 20px -25px',
                        padding: '18px 20px',
                        borderRadius: '17px 17px 0 0',
                        borderBottom: 'none'
                    }}
                >
                    <h3
                        id="bulk-honors-modal-title"
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0, fontSize: '18px', fontWeight: '800', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                    >
                        Award Honors
                    </h3>
                    <button
                        onClick={handleClose}
                        aria-label="Close modal"
                        title="Close"
                        style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.3)', fontSize: '18px', cursor: 'pointer', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', fontWeight: 'bold' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; e.currentTarget.style.transform = 'rotate(90deg)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'rotate(0deg)'; }}
                    >
                        ×
                    </button>
                </div>

                <div className="modal-content" style={{ padding: '20px' }}>
                    {/* Current Status */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                        <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Current Level</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--color-purple)' }}>{currentLevel}</div>
                        </div>
                        <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Current Honors</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--color-purple)' }}>{currentHonors}</div>
                        </div>
                    </div>

                    {currentLevel < MAX_TRAINER_LEVEL && (
                        <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                            {honorsToNext === 0
                                ? 'Ready to level up! Use the Level Up button in Trainer Stats.'
                                : `${honorsToNext} more Honor${honorsToNext !== 1 ? 's' : ''} needed for Level ${nextLevel}`
                            }
                        </div>
                    )}
                    {currentLevel >= MAX_TRAINER_LEVEL && (
                        <div style={{ marginBottom: '16px', fontSize: '13px', color: '#4caf50', textAlign: 'center', fontWeight: '600' }}>
                            Maximum level reached!
                        </div>
                    )}

                    {/* Honors Input */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>
                            Honors to Award
                        </label>
                        <input
                            type="number"
                            value={honorAmount}
                            onChange={(e) => setHonorAmount(Math.max(1, parseInt(e.target.value) || 1))}
                            min="1"
                            step="1"
                            style={{ width: '100%', padding: '10px 12px', fontSize: '16px', borderRadius: '8px', border: '2px solid var(--border-medium)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                        />
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Honors are earned from Gym Badges, Contest Ribbons, and story milestones.
                        </div>
                    </div>

                    {/* Preview */}
                    {honorAmount > 0 && (
                        <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                            <div style={{ fontWeight: '600', marginBottom: '8px' }}>Preview:</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span>Honors</span>
                                <span>{currentHonors} → <strong>{newHonors}</strong></span>
                            </div>
                            {levelsGained > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4caf50', fontWeight: '600' }}>
                                    <span>Level threshold</span>
                                    <span>Lv {currentLevel} → Lv {newLevel} (+{levelsGained})</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Result from last award */}
                    {lastResult && (
                        <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', border: '1px solid #a5d6a7' }}>
                            <div style={{ fontWeight: '600', color: '#2e7d32', marginBottom: '6px' }}>Honors Awarded!</div>
                            <div>+{lastResult.honorAmount} Honor{lastResult.honorAmount !== 1 ? 's' : ''} — total now {lastResult.newHonors}</div>
                            {lastResult.levelsGained > 0 && (
                                <div style={{ color: '#2e7d32', marginTop: '4px', fontWeight: '600' }}>
                                    Leveled up to {lastResult.newLevel}! Check Stats for any pending HP rolls.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Award Button */}
                    <button
                        onClick={handleAwardHonors}
                        disabled={honorAmount <= 0}
                        className="btn btn-purple"
                        style={{ width: '100%', padding: '12px', fontSize: '15px', opacity: honorAmount <= 0 ? 0.5 : 1, cursor: honorAmount <= 0 ? 'not-allowed' : 'pointer' }}
                    >
                        Award {honorAmount} Honor{honorAmount !== 1 ? 's' : ''}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkHonorsModal;
