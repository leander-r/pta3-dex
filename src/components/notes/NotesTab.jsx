// ============================================================
// Notes Tab Component
// ============================================================
// Campaign notes editor

import React from 'react';

/**
 * NotesTab - Campaign notes editor
 * @param {Object} props
 * @param {Object} props.trainer - Current trainer object
 * @param {Function} props.setTrainer - Function to update trainer
 */
const NotesTab = ({ trainer, setTrainer }) => {
    const handleNotesChange = (e) => {
        setTrainer(prev => ({ ...prev, notes: e.target.value }));
    };

    return (
        <div>
            <h2 className="section-title">Campaign Notes</h2>

            <div className="section-card-purple">
                <h3 className="section-title-purple">
                    <span>📝</span> {trainer.name || 'Trainer'}'s Notes
                </h3>

                <textarea
                    value={trainer.notes || ''}
                    onChange={handleNotesChange}
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
                        padding: '15px',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        border: '2px solid #e8e3f3',
                        borderRadius: '8px',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                    }}
                />

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '10px',
                    fontSize: '12px',
                    color: '#666'
                }}>
                    <span>
                        {(trainer.notes || '').length} characters
                    </span>
                    <span>
                        Auto-saved
                    </span>
                </div>
            </div>
        </div>
    );
};

export default NotesTab;
