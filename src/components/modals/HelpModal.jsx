import React from 'react';
import useModalKeyboard from '../../hooks/useModalKeyboard.js';
import { useUI } from '../../contexts/index.js';

const HELP_CONTENT = {
    'stat-allocation': {
        title: 'Trainer Stats',
        body: () => (
            <>
                <p>Stats determine your trainer's capabilities. Each stat has a <strong>modifier</strong> that affects skill rolls.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Creation Points</h4>
                <p>At character creation you receive <strong>30 points</strong> to distribute across your 6 stats. Each stat has a <strong>minimum of 6</strong> and a <strong>maximum of 14</strong> during creation. You must spend all creation points before you can level up.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Level Points</h4>
                <p>Each time you level up you gain <strong>1 stat point</strong> with no per-stat cap. These are tracked separately from creation points.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Undo</h4>
                <p>The <strong>↩ Undo</strong> button restores the last stat change so you can experiment freely before committing.</p>
            </>
        )
    },
    'classes': {
        title: 'Trainer Classes',
        body: () => (
            <>
                <p>Classes define your trainer's playstyle and unlock unique <strong>features</strong> and <strong>skills</strong>.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>How Many Classes?</h4>
                <ul style={{ paddingLeft: '18px', margin: '0 0 10px', lineHeight: '1.8' }}>
                    <li><strong>Lv 1–4:</strong> 1 class</li>
                    <li><strong>Lv 5–11:</strong> 2 classes</li>
                    <li><strong>Lv 12–23:</strong> 3 classes</li>
                    <li><strong>Lv 24+:</strong> 4 classes</li>
                </ul>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Base vs Advanced</h4>
                <p>Your <strong>first class</strong> is a Base class — it grants <strong>3 skill ranks</strong> and +2 feat points. Additional classes are Advanced — each grants <strong>1 skill rank</strong> and costs 1 feat point.</p>
            </>
        )
    },
    'move-slots': {
        title: 'Move Slots',
        body: () => (
            <>
                <p>Each Pokémon has <strong>two independent pools</strong> of move slots:</p>
                <ul style={{ paddingLeft: '18px', margin: '10px 0', lineHeight: '1.8' }}>
                    <li><strong>4 Natural slots</strong> — moves learned by leveling up</li>
                    <li><strong>4 Taught slots</strong> — moves from TMs, Tutors, Egg moves, or custom sources</li>
                </ul>
                <p>The pools are completely separate. Forgetting a Natural move <em>never</em> affects Taught moves and vice versa. This lets your Pokémon keep a full kit of both level-up and taught moves simultaneously.</p>
                <p style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>Tip: When all 4 slots in a pool are full, you'll be prompted to replace an existing move.</p>
            </>
        )
    },
    'combat-stages': {
        title: 'Combat Stages',
        body: () => (
            <>
                <p>Combat Stages track temporary <strong>stat buffs and debuffs</strong> applied by moves during battle.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Stage Multipliers</h4>
                <ul style={{ paddingLeft: '18px', margin: '0 0 10px', lineHeight: '1.8' }}>
                    <li><strong>+1 stage</strong> = stat × 1.25 (25% increase)</li>
                    <li><strong>−1 stage</strong> = stat × 0.90 (10% decrease)</li>
                    <li>Stages stack: +3 = ×1.75, −3 = ×0.73</li>
                </ul>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Limits & Reset</h4>
                <p>Stages range from <strong>−6 to +6</strong>. They reset when the Pokémon switches out or the battle ends. Use the Reset button to clear all stages at once.</p>
            </>
        )
    },
    'save-slots': {
        title: 'Save & Export',
        body: () => (
            <>
                <p>PTA Dex offers two ways to preserve your data:</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Save Slots (browser snapshots)</h4>
                <p>Three named slots stored in your browser. Fast to create and restore — ideal for <strong>mid-session checkpoints</strong>. Note: these are browser-only and will be lost if you clear site data.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Export JSON (portable file)</h4>
                <p>Downloads a <code>.json</code> file to your device. Use this for <strong>backups</strong>, sharing with others, or moving your data to a different browser or device. Import it back via the menu.</p>
                <p style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>Tip: The app auto-saves to localStorage every minute. Use both slots and exports for peace of mind.</p>
            </>
        )
    },
    'trainer-features': {
        title: 'Trainer Features',
        body: () => (
            <>
                <p>Features are special abilities that customize your trainer's playstyle. Most cost <strong>1 feat point</strong> to acquire.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Feat Points</h4>
                <p>You earn feat points by leveling up and through certain class choices. <strong>Base classes</strong> grant +2 feat points; <strong>Advanced classes</strong> each cost 1 feat point. Unspent points carry over.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Free Features</h4>
                <p>Features listed under <em>General (Free)</em> cost <strong>0 feat points</strong>. Base class features are highlighted in green and are automatically granted — they do not cost extra points.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Removing Features</h4>
                <p>Click a feature chip and choose <em>Remove</em> to refund the feat point. Class base features cannot be removed while that class is still active.</p>
            </>
        )
    },
    'trainer-skills': {
        title: 'Trainer Skills',
        body: () => (
            <>
                <p>Skills represent your trainer's proficiency in various areas. Each skill is linked to one of your six stats.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Skill Ranks</h4>
                <ul style={{ paddingLeft: '18px', margin: '0 0 10px', lineHeight: '1.8' }}>
                    <li><strong>Rank 0:</strong> untrained — roll only the stat modifier</li>
                    <li><strong>Rank 1:</strong> trained — +2 + Stat Modifier</li>
                    <li><strong>Rank 2:</strong> expert — +4 + (2 × Stat Modifier)</li>
                </ul>
                <p>Click a skill to cycle through ranks (0 → 1 → 2 → 0). HP-linked skills cap at <strong>Rank 1</strong>.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Skill Ranks from Classes</h4>
                <p>Base classes grant <strong>3 skill ranks</strong>; Advanced classes grant <strong>1 skill rank</strong>. Ranks from classes are automatically applied when you add or change a class.</p>
            </>
        )
    },
    'pokemon-stats': {
        title: 'Pokémon Stats',
        body: () => (
            <>
                <p>Each Pokémon stat has two components that add together to form the <strong>total stat</strong> used in battle.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Base Stat</h4>
                <p>Set by the species (Pokédex entry). This cannot be changed and represents the Pokémon's natural potential.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Added Stat (+)</h4>
                <p>Points you invest from level-ups. Use the <strong>+</strong> and <strong>−</strong> buttons in each stat box to allocate your available <em>Stat Points</em>. The green number shows how many points have been added.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Stat Points</h4>
                <p>Your Pokémon gains <strong>stat points when it levels up</strong>. Unspent points are shown at the top of this tab. You can freely reallocate points as long as the Pokémon still has enough added stats to cover what you remove.</p>
            </>
        )
    },
    'pokemon-skills': {
        title: 'Pokémon Skills',
        body: () => (
            <>
                <p>Pokémon Skills represent your Pokémon's natural physical capabilities outside of battle. They are fixed by the species and cannot be changed.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Common Skills</h4>
                <ul style={{ paddingLeft: '18px', margin: '0 0 10px', lineHeight: '1.8' }}>
                    <li><strong>Overland:</strong> base movement speed on land (meters per move action)</li>
                    <li><strong>Swim:</strong> movement speed while swimming</li>
                    <li><strong>Jump:</strong> vertical jump height in meters</li>
                    <li><strong>Power:</strong> how many Combat Stages of weight the Pokémon can lift or push</li>
                </ul>
                <p style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>Some species have additional skills like Burrow, Sky, Levitate, or Stealth. Click a skill chip to see its full description.</p>
            </>
        )
    },
    'hp-tracking': {
        title: 'HP Tracking',
        body: () => (
            <>
                <p>The HP tracker lets you apply damage and healing during battle without leaving the app.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Quick Buttons</h4>
                <ul style={{ paddingLeft: '18px', margin: '0 0 10px', lineHeight: '1.8' }}>
                    <li><strong>−10 / −5 / −1</strong> — apply that much damage (red buttons)</li>
                    <li><strong>Full</strong> — instantly restore to Max HP (blue button)</li>
                    <li><strong>+1 / +5 / +10</strong> — heal that many HP (green buttons)</li>
                </ul>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Custom Amount</h4>
                <p>Type any number in the input box and click <strong>Dmg</strong> or <strong>Heal</strong> to apply an exact amount. Pressing <kbd>Enter</kbd> applies damage.</p>
                <p style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>HP is shown as a colour-coded bar: green above 50 %, orange above 25 %, red at 25 % or below.</p>
            </>
        )
    },
};

const HelpModal = () => {
    const { helpTopic, closeHelp } = useUI();
    const { modalRef } = useModalKeyboard(!!helpTopic, closeHelp);

    if (!helpTopic) return null;

    const content = HELP_CONTENT[helpTopic];
    if (!content) return null;

    const Body = content.body;

    return (
        <div className="modal-overlay" onClick={closeHelp} role="presentation">
            <div
                ref={modalRef}
                className="modal"
                style={{ maxWidth: 'min(95vw, 480px)' }}
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="help-modal-title"
            >
                <div
                    className="modal-header"
                    style={{
                        background: 'linear-gradient(135deg, #f5a623, #e8941c)',
                        color: 'white',
                        margin: '-25px -25px 20px -25px',
                        padding: '18px 20px',
                        borderRadius: '17px 17px 0 0',
                        borderBottom: 'none'
                    }}
                >
                    <h3
                        id="help-modal-title"
                        style={{ margin: 0, fontSize: '18px', fontWeight: '800', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                    >
                        {content.title}
                    </h3>
                    <button
                        onClick={closeHelp}
                        aria-label="Close help"
                        title="Close"
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: '2px solid rgba(255,255,255,0.3)',
                            fontSize: '18px',
                            cursor: 'pointer',
                            color: 'white',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            fontWeight: 'bold',
                            flexShrink: 0
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.35)';
                            e.currentTarget.style.transform = 'rotate(90deg)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                            e.currentTarget.style.transform = 'rotate(0deg)';
                        }}
                    >
                        ×
                    </button>
                </div>

                <div style={{ padding: '0 25px 25px', fontSize: '14px', lineHeight: '1.6', color: 'var(--text-color)' }}>
                    <Body />
                </div>
            </div>
        </div>
    );
};

export default HelpModal;
