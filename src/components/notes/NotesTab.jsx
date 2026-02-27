// ============================================================
// Notes Tab Component
// ============================================================
// Campaign notes + session notes editor

import React, { useState } from 'react';
import { useTrainerContext, useModal } from '../../contexts/index.js';

/**
 * NotesTab - Campaign and session notes editor
 * Uses TrainerContext for trainer state
 */
const NotesTab = () => {
    const { trainer, setTrainer } = useTrainerContext();
    const { showConfirm } = useModal();
    const [noteTab, setNoteTab] = useState('campaign');
    const [isFocused, setIsFocused] = useState(false);

    const handleCampaignChange = (e) => {
        setTrainer(prev => ({ ...prev, notes: e.target.value }));
    };

    const handleSessionChange = (e) => {
        setTrainer(prev => ({ ...prev, sessionNotes: e.target.value }));
    };

    const handleClearSession = () => {
        showConfirm({
            title: 'Clear Session Notes?',
            message: 'This will erase all current session notes. Campaign notes are unaffected.',
            confirmText: 'Clear',
            isDanger: true,
            onConfirm: () => setTrainer(prev => ({ ...prev, sessionNotes: '' }))
        });
    };

    const isCampaign = noteTab === 'campaign';
    const activeText = isCampaign ? (trainer.notes || '') : (trainer.sessionNotes || '');
    const wordCount = activeText.trim().split(/\s+/).filter(Boolean).length;

    return (
        <div>
            <h2 className="section-title">Notes</h2>
            <p className="section-description">
                Track your adventure — quests, NPCs, story events, and session highlights.
            </p>

            {/* Tab switcher */}
            <div className="tabs" style={{ marginBottom: '15px' }}>
                <button
                    className={`tab ${isCampaign ? 'active' : ''}`}
                    onClick={() => setNoteTab('campaign')}
                >
                    📖 Campaign Notes
                </button>
                <button
                    className={`tab ${!isCampaign ? 'active' : ''}`}
                    onClick={() => setNoteTab('session')}
                >
                    🗒️ Session Notes
                </button>
            </div>

            <div className="section-card-purple" style={{
                transition: 'box-shadow 0.2s ease',
                boxShadow: isFocused ? '0 0 0 3px rgba(102, 126, 234, 0.2)' : 'none'
            }}>
                <h3 className="section-title-purple" style={{ marginBottom: '12px' }}>
                    <span>{isCampaign ? '📝' : '🗒️'}</span>
                    {isCampaign
                        ? `${trainer.name || 'Trainer'}'s Campaign Notes`
                        : 'Session Notes'}
                    {!isCampaign && (
                        <button
                            onClick={handleClearSession}
                            style={{
                                marginLeft: 'auto',
                                padding: '4px 10px',
                                background: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: 'bold'
                            }}
                            title="Clear session notes (campaign notes unaffected)"
                        >
                            Clear
                        </button>
                    )}
                </h3>

                {!isCampaign && (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px', marginTop: '-4px' }}>
                        Quick notes for this session — reminders, loot, moments. Clear between sessions without touching campaign notes.
                    </p>
                )}

                <textarea
                    key={noteTab}
                    value={activeText}
                    onChange={isCampaign ? handleCampaignChange : handleSessionChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={isCampaign
                        ? `Write your campaign notes, quest logs, NPC info, or anything else here...

Examples of what you could track:
• Current quest objectives
• Important NPCs and their locations
• Storyline events and plot points
• Battle strategies and team compositions
• Items you need to find
• Goals for your Pokémon team`
                        : `Quick notes for this session...

Examples:
• What happened today
• Items found or rewards
• New leads or rumors
• Pokémon caught or evolved
• Reminders for next session`}
                    style={{
                        width: '100%',
                        minHeight: '500px',
                        padding: '16px',
                        fontSize: '14px',
                        lineHeight: '1.7',
                        border: `2px solid ${isFocused ? 'var(--poke-orange, #667eea)' : 'var(--border-light, #e8e3f3)'}`,
                        borderRadius: '10px',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        background: isFocused ? 'var(--input-bg, #fff)' : 'var(--hover-bg, #fafafa)',
                        color: 'var(--text-primary, #333)',
                        transition: 'border-color 0.2s ease, background-color 0.2s ease',
                        outline: 'none'
                    }}
                />

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '12px',
                    padding: '8px 4px',
                    fontSize: '12px',
                    color: 'var(--text-muted, #666)',
                    borderTop: '1px solid var(--border-light, #e8e3f3)'
                }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <span><strong>{activeText.length}</strong> characters</span>
                        <span><strong>{wordCount}</strong> words</span>
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4caf50' }}>
                        <span style={{ width: '6px', height: '6px', background: '#4caf50', borderRadius: '50%', display: 'inline-block' }}></span>
                        Auto-saved
                    </span>
                </div>
            </div>
        </div>
    );
};

export default NotesTab;
