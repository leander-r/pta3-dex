// ============================================================
// Game Rules Section Component
// ============================================================

import React, { useState } from 'react';
import { GAME_DATA } from '../../data/configs.js';

const GameRulesSection = () => {
    const [expandedSection, setExpandedSection] = useState('combat');

    const sections = [
        {
            id: 'combat',
            title: 'Combat Basics',
            content: (
                <div>
                    <h4>Turn Order</h4>
                    <ul>
                        <li>Speed determines initiative order (highest first)</li>
                        <li>Ties are resolved by Speed stat, then coin flip</li>
                    </ul>

                    <h4>Actions Per Turn</h4>
                    <ul>
                        <li><strong>Standard Action:</strong> Attack, use item, use ability</li>
                        <li><strong>Shift Action:</strong> Move up to your Speed in meters</li>
                        <li><strong>Swift Action:</strong> Minor actions (free recall, etc.)</li>
                    </ul>

                    <h4>Accuracy Rolls</h4>
                    <ul>
                        <li>Roll 1d20 to hit</li>
                        <li>Compare against target's Evasion</li>
                        <li>Natural 20 = Critical Hit (double damage dice)</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'damage',
            title: 'Damage & HP',
            content: (
                <div>
                    <h4>Damage Calculation</h4>
                    <p>Total Damage = Dice Roll + Stat Bonus + STAB</p>
                    <ul>
                        <li>Physical moves use ATK stat</li>
                        <li>Special moves use SATK stat</li>
                        <li>STAB: +1 at Lv5, +2 at Lv10, etc.</li>
                    </ul>

                    <h4>HP Formula</h4>
                    <ul>
                        <li><strong>Pokemon:</strong> Level + (HP Stat x 3)</li>
                        <li><strong>Trainer:</strong> (HP Stat x 4) + (Level x 4)</li>
                    </ul>

                    <h4>Type Effectiveness</h4>
                    <ul>
                        <li>Super Effective: 1.5x damage (not 2x)</li>
                        <li>Not Very Effective: 0.5x damage</li>
                        <li>Immune: 0 damage</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'stats',
            title: 'Stats & Combat Stages',
            content: (
                <div>
                    <h4>Combat Stages</h4>
                    <p>Buffs and debuffs affect stats through Combat Stages (-6 to +6)</p>
                    <ul>
                        <li>Each +1 stage: +25% of base stat</li>
                        <li>Each -1 stage: -10% of base stat</li>
                        <li>At +6: 250% of original</li>
                        <li>At -6: 40% of original</li>
                    </ul>

                    <h4>Evasion</h4>
                    <ul>
                        <li>Physical Evasion = DEF / 5</li>
                        <li>Special Evasion = SDEF / 5</li>
                        <li>Speed Evasion = min(6, SPD modifier)</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'trainer',
            title: 'Trainer Rules',
            content: (
                <div>
                    <h4>Character Creation</h4>
                    <ul>
                        <li>Start at Level 0 with 30 stat points</li>
                        <li>Each stat starts at 6, cap at 14 during creation</li>
                        <li>Level up to 1 after spending points and picking a class</li>
                    </ul>

                    <h4>Level Progression</h4>
                    <ul>
                        <li>Gain stat points and features at each level</li>
                        <li>Max 1 class until Level 5</li>
                        <li>Max 2 classes from Level 5-11</li>
                        <li>Max 3 classes from Level 12-23</li>
                        <li>Max 4 classes from Level 24+</li>
                    </ul>

                    <h4>Skill Checks</h4>
                    <ul>
                        <li>Roll 2d6 + stat modifier</li>
                        <li>Trained skills: +2 bonus</li>
                        <li>Stat modifier = (Stat - 10)</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'capture',
            title: 'Capture Rules',
            content: (
                <div>
                    <h4>Capture Formula</h4>
                    <p>Roll 1d100 against Capture DC</p>

                    <h4>Capture Modifiers</h4>
                    <ul>
                        <li>HP remaining affects DC</li>
                        <li>Status conditions lower DC</li>
                        <li>Ball type provides modifier</li>
                    </ul>

                    <h4>Ball Modifiers</h4>
                    <ul>
                        <li>Poke Ball: +0</li>
                        <li>Great Ball: -10</li>
                        <li>Ultra Ball: -15</li>
                        <li>Master Ball: Auto-capture</li>
                    </ul>
                </div>
            )
        }
    ];

    return (
        <div>
            <h3>Game Rules Quick Reference</h3>
            <p style={{ marginBottom: '15px', fontSize: '13px', color: '#666' }}>
                Essential rules for Pokemon Tabletop Adventures gameplay.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sections.map(section => (
                    <div
                        key={section.id}
                        style={{
                            border: '1px solid #dee2e6',
                            borderRadius: '8px',
                            overflow: 'hidden'
                        }}
                    >
                        <button
                            onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                            style={{
                                width: '100%',
                                padding: '12px 15px',
                                background: expandedSection === section.id ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f8f9fa',
                                color: expandedSection === section.id ? 'white' : '#333',
                                border: 'none',
                                textAlign: 'left',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <span>{section.title}</span>
                            <span>{expandedSection === section.id ? '' : '+'}</span>
                        </button>

                        {expandedSection === section.id && (
                            <div style={{
                                padding: '15px 20px',
                                background: 'white',
                                fontSize: '13px',
                                lineHeight: '1.6'
                            }}
                            className="game-rules-content"
                            >
                                {section.content}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GameRulesSection;
