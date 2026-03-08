// ============================================================
// Game Rules Section Component (PTA3)
// ============================================================

import React, { useState } from 'react';

const GameRulesSection = () => {
    const [expandedSection, setExpandedSection] = useState('combat');

    const sections = [
        {
            id: 'combat',
            title: 'Combat Basics',
            content: (
                <div>
                    <h4>Accuracy Roll</h4>
                    <p>Roll 1d20 + stat modifier vs. the target's opposing stat value (not a fixed AC).</p>
                    <ul>
                        <li><strong>Attack move:</strong> 1d20 + ATK mod vs. target DEF value</li>
                        <li><strong>Special Attack move:</strong> 1d20 + SATK mod vs. target SDEF value</li>
                        <li><strong>Effect move:</strong> 1d20 + SATK mod vs. target SPD value</li>
                        <li><strong>Natural 20:</strong> All damage dice deal maximum (not ×2 rolls)</li>
                    </ul>

                    <h4>Turn Order</h4>
                    <ul>
                        <li>Highest SPD acts first; ties resolved by SPD value then coin flip</li>
                    </ul>

                    <h4>Actions Per Turn</h4>
                    <ul>
                        <li><strong>Standard Action:</strong> Use a move, item, or ability</li>
                        <li><strong>Shift Action:</strong> Move up to your Speed in feet</li>
                        <li><strong>Swift Action:</strong> Minor action (recall, activate trait, etc.)</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'damage',
            title: 'Damage & Type Effectiveness',
            content: (
                <div>
                    <h4>Damage Formula</h4>
                    <p><strong>Total = Dice + modifier + STAB + type bonus/penalty</strong></p>
                    <ul>
                        <li>Physical moves add ATK modifier (⌊ATK/2⌋)</li>
                        <li>Special moves add SATK modifier (⌊SATK/2⌋)</li>
                        <li><strong>STAB:</strong> +4 flat (same type attack bonus)</li>
                        <li><strong>Critical hit:</strong> All damage dice deal maximum value</li>
                    </ul>

                    <h4>Type Effectiveness (die count)</h4>
                    <ul>
                        <li><strong>Super Effective (×2):</strong> Roll +1 extra damage die</li>
                        <li><strong>Extremely Effective (×4):</strong> Roll +2 extra damage dice</li>
                        <li><strong>Resistant (×½):</strong> Roll −1 damage die (minimum 1)</li>
                        <li><strong>Highly Resistant (×¼):</strong> Roll −2 damage dice (minimum 1)</li>
                        <li><strong>Immune (×0):</strong> No damage</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'hp',
            title: 'HP & Recovery',
            content: (
                <div>
                    <h4>Trainer HP</h4>
                    <ul>
                        <li>Base: <strong>20 HP</strong></li>
                        <li>+1d4 at levels <strong>3, 7, and 11</strong> (milestone rolls)</li>
                        <li>Example: Lv11 trainer with rolls of 3, 1, 4 → <strong>28 HP</strong></li>
                    </ul>

                    <h4>Pokémon HP</h4>
                    <ul>
                        <li>HP is a <strong>fixed species value</strong> from the Pokédex entry</li>
                        <li>Nature modifier applies: ±1 to the affected stat (including HP)</li>
                        <li>No level-based HP scaling</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'stats',
            title: 'Stats & Combat Stages',
            content: (
                <div>
                    <h4>Stat Modifier</h4>
                    <p><strong>modifier = ⌊stat / 2⌋</strong></p>
                    <ul>
                        <li>Stat 2 → mod +1 | Stat 4 → mod +2 | Stat 6 → mod +3</li>
                        <li>Stat 8 → mod +4 | Stat 10 → mod +5</li>
                    </ul>

                    <h4>Combat Stages</h4>
                    <p>Each stage = <strong>+2 flat</strong> to the stat (both + and −).</p>
                    <ul>
                        <li>Range: −6 to +6 stages → stat changes by −12 to +12</li>
                        <li>Example: ATK 8, +3 stages → effective ATK 14</li>
                        <li>ACC / EVA stages are pure modifiers added to/subtracted from rolls</li>
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
                        <li>5 stats (ATK, DEF, SATK, SDEF, SPD) — no HP stat</li>
                        <li>Point-buy budget: <strong>25 points</strong></li>
                        <li>Cumulative cost to reach: 1=1pt | 2=2pt | 3=3pt | 4=6pt | 5=8pt | 6=11pt</li>
                        <li>Max stat at creation: <strong>6</strong> — can reach 10 via level-up (flat 1pt per +1)</li>
                    </ul>

                    <h4>Leveling (Honor-based)</h4>
                    <ul>
                        <li>Levels advance by earning <strong>Honors</strong> (Gym Badges, Ribbons, etc.)</li>
                        <li>Max level: <strong>15</strong></li>
                        <li>Each level: +2 stat points</li>
                        <li>Class slots: 1st at Lv1 | 2nd at Lv3 | 3rd at Lv7 | 4th at Lv11</li>
                        <li>HP milestone rolls (1d4) at levels <strong>3, 7, and 11</strong></li>
                    </ul>

                    <h4>Skill Checks</h4>
                    <ul>
                        <li>Roll: <strong>1d20 + ⌊stat/2⌋ + talent bonus</strong></li>
                        <li>0 talents: +0 | 1 talent: +2 | 2 talents: +5</li>
                        <li>18 skills across 5 stats; Concentration and Constitution are Passive</li>
                        <li>Check: roll vs. a DC set by GM | Opposed: roll vs. target's roll</li>
                    </ul>
                </div>
            )
        }
    ];

    return (
        <div>
            <h3>Game Rules Quick Reference (PTA3)</h3>
            <p style={{ marginBottom: '15px', fontSize: '13px', color: '#666' }}>
                Essential rules for Pokémon Tabletop Adventures 3rd Edition.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sections.map(section => (
                    <div
                        key={section.id}
                        style={{ border: '1px solid #dee2e6', borderRadius: '8px', overflow: 'hidden' }}
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
                            <span>{expandedSection === section.id ? '−' : '+'}</span>
                        </button>

                        {expandedSection === section.id && (
                            <div
                                style={{ padding: '15px 20px', background: 'white', fontSize: '13px', lineHeight: '1.6' }}
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
