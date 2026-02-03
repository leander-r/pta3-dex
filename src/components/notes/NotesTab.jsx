// ============================================================
// Notes Tab Component
// ============================================================
// Campaign notes editor

import React, { useState } from 'react';
import { useTrainerContext } from '../../contexts/index.js';

/**
 * NotesTab - Campaign notes editor
 * Uses TrainerContext for trainer state
 */
const NotesTab = () => {
    const { trainer, setTrainer } = useTrainerContext();
    const [isFocused, setIsFocused] = useState(false);

    const handleNotesChange = (e) => {
        setTrainer(prev => ({ ...prev, notes: e.target.value }));
    };

    const wordCount = (trainer.notes || '').trim().split(/\s+/).filter(Boolean).length;

    return (
        <div>
            <h2 className="section-title">Campaign Notes</h2>
            <p className="section-description">
                Keep track of your adventure - quests, NPCs, story events, and strategies.
            </p>

            <div className="section-card-purple" style={{
                transition: 'box-shadow 0.2s ease',
                boxShadow: isFocused ? '0 0 0 3px rgba(102, 126, 234, 0.2)' : 'none'
            }}>
                <h3 className="section-title-purple">
                    <span>📝</span> {trainer.name || 'Trainer'}'s Notes
                </h3>

                <textarea
                    value={trainer.notes || ''}
                    onChange={handleNotesChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Write your campaign notes, quest logs, NPC info, or anything else here...

Examples of what you could track:
• Current quest objectives
• Important NPCs and their locations
• Storyline events and plot points
• Battle strategies and team compositions
• Items you need to find
• Goals for your Pokémon team"
                    style={{
                        width: '100%',
                        minHeight: '500px',
                        padding: '16px',
                        fontSize: '14px',
                        lineHeight: '1.7',
                        border: '2px solid #e8e3f3',
                        borderRadius: '10px',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        background: '#fafafa',
                        transition: 'border-color 0.2s ease, background-color 0.2s ease',
                        outline: 'none'
                    }}
                    onFocusCapture={(e) => {
                        e.target.style.borderColor = '#667eea';
                        e.target.style.backgroundColor = '#fff';
                    }}
                    onBlurCapture={(e) => {
                        e.target.style.borderColor = '#e8e3f3';
                        e.target.style.backgroundColor = '#fafafa';
                    }}
                />

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '12px',
                    padding: '8px 4px',
                    fontSize: '12px',
                    color: '#666',
                    borderTop: '1px solid #e8e3f3'
                }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <span>
                            <strong>{(trainer.notes || '').length}</strong> characters
                        </span>
                        <span>
                            <strong>{wordCount}</strong> words
                        </span>
                    </div>
                    <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#4caf50'
                    }}>
                        <span style={{
                            width: '6px',
                            height: '6px',
                            background: '#4caf50',
                            borderRadius: '50%',
                            display: 'inline-block'
                        }}></span>
                        Auto-saved
                    </span>
                </div>
            </div>
        </div>
    );
};

export default NotesTab;
