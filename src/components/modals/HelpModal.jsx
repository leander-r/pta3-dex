import React from 'react';
import useModalKeyboard from '../../hooks/useModalKeyboard.js';
import { useUI } from '../../contexts/index.js';

const HELP_CONTENT = {
    'stat-allocation': {
        title: 'Trainer Stats',
        body: () => (
            <>
                <p>Trainers have <strong>5 stats</strong> (ATK, DEF, SATK, SDEF, SPD) on a <strong>1–10 scale</strong>. Each stat has a <strong>modifier = ⌊stat ÷ 2⌋</strong> used in skill rolls and accuracy checks. HP is separate and fixed at 20 base.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Creation Point-Buy (25 pts)</h4>
                <ul style={{ paddingLeft: '18px', margin: '0 0 10px', lineHeight: '1.8' }}>
                    <li>Stat 1 = 1 pt &nbsp;|&nbsp; Stat 2 = 2 pts &nbsp;|&nbsp; Stat 3 = 3 pts</li>
                    <li>Stat 4 = 6 pts &nbsp;|&nbsp; Stat 5 = 8 pts &nbsp;|&nbsp; Stat 6 = 11 pts</li>
                    <li>Maximum of <strong>6</strong> in any stat at creation</li>
                </ul>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Milestone Stat Points</h4>
                <p>At levels <strong>3, 7, and 11</strong> you gain <strong>2 stat points</strong> to spend immediately. Each of those 2 points <strong>must go to a different stat</strong> — you cannot put both into the same stat at once.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Undo</h4>
                <p>The <strong>↩ Undo</strong> button restores the last stat change so you can experiment freely before committing.</p>
            </>
        )
    },
    'classes': {
        title: 'Trainer Classes',
        body: () => (
            <>
                <p>Classes define your trainer's playstyle and unlock unique <strong>features</strong> and <strong>skill talents</strong>.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Class Slots</h4>
                <ul style={{ paddingLeft: '18px', margin: '0 0 10px', lineHeight: '1.8' }}>
                    <li><strong>Lv 1:</strong> 1st class</li>
                    <li><strong>Lv 3:</strong> 2nd class</li>
                    <li><strong>Lv 7:</strong> 3rd class</li>
                    <li><strong>Lv 11:</strong> 4th class</li>
                </ul>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Base vs Advanced</h4>
                <p>Your <strong>first class</strong> must be one of the 7 Base classes. Additional slots unlock Advanced classes. Each class provides a <strong>skill pool</strong> — you gain talents in skills from that pool (max 2 talents per skill).</p>
            </>
        )
    },
    'move-slots': {
        title: 'Move Slots',
        body: () => (
            <>
                <p>Each Pokémon can know up to <strong>6 moves</strong> in a single pool — there is no distinction between Natural and Taught moves.</p>
                <p style={{ margin: '10px 0' }}>Moves come directly from the species' Pokédex entry. Frequencies are <strong>At-Will</strong>, <strong>3/day</strong>, or <strong>1/day</strong>.</p>
                <p style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>Tip: When all 6 slots are full, you'll be prompted to replace an existing move before learning a new one.</p>
            </>
        )
    },
    'combat-stages': {
        title: 'Combat Stages',
        body: () => (
            <>
                <p>Combat Stages track temporary <strong>stat buffs and debuffs</strong> applied by moves during battle.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Flat Stage Bonus</h4>
                <ul style={{ paddingLeft: '18px', margin: '0 0 10px', lineHeight: '1.8' }}>
                    <li><strong>+1 stage</strong> = +2 flat to the stat</li>
                    <li><strong>−1 stage</strong> = −2 flat to the stat</li>
                    <li>Example: ATK 8 at +3 stages → effective ATK 14</li>
                </ul>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Limits & Reset</h4>
                <p>Stages range from <strong>−6 to +6</strong> (stat change: −12 to +12). They reset when the Pokémon switches out or the battle ends. Use the Reset button to clear all stages at once.</p>
            </>
        )
    },
    'save-slots': {
        title: 'Save & Export',
        body: () => (
            <>
                <p>PTA3 Dex offers two ways to preserve your data:</p>
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
                <p>Features are special abilities granted automatically when your class level advances. There are no feat points — features are simply unlocked at each class level milestone.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Auto-Granted Features</h4>
                <p>Every time your trainer levels up, each class also advances one level and automatically grants any features tied to that class level. You don't need to pick or buy them.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Feature Drop</h4>
                <p>When a new feature is granted, you may optionally <strong>drop</strong> it in exchange for <strong>+1 to any stat</strong>. You can do this up to <strong>4 times</strong> total across your career. If you keep all features, the prompt disappears.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Level 15 Capstone</h4>
                <p>Only your <strong>first base class</strong> ever grants its Level 15 capstone feature. All other classes (advanced or secondary base) do not receive a Level 15 feature.</p>
            </>
        )
    },
    'trainer-skills': {
        title: 'Trainer Skills',
        body: () => (
            <>
                <p>There are <strong>18 skills</strong>, each linked to one of the 5 trainer stats. Skill checks are <strong>1d20 + ⌊stat ÷ 2⌋ + talent bonus</strong>.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Talent Bonus</h4>
                <ul style={{ paddingLeft: '18px', margin: '0 0 10px', lineHeight: '1.8' }}>
                    <li><strong>0 talents:</strong> no bonus</li>
                    <li><strong>1 talent:</strong> +2</li>
                    <li><strong>2 talents:</strong> +5</li>
                </ul>
                <p>Click a skill to cycle talents (0 → 1 → 2 → 0). <strong>Concentration</strong> and <strong>Constitution</strong> are passive — they are invoked by the GM, not rolled manually. Max 2 talents per skill.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Gaining Talents</h4>
                <p>Talents come from your class skill pools. Each class grants access to a set of skills; choosing a class lets you apply talents to those skills.</p>
            </>
        )
    },
    'pokemon-stats': {
        title: 'Pokémon Stats',
        body: () => (
            <>
                <p>Pokémon have <strong>6 stats</strong> (HP, ATK, DEF, SATK, SDEF, SPD). All stats are <strong>fixed by the species</strong> Pokédex entry — there are no level-up stat points to allocate.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Nature Modifier</h4>
                <p>A Pokémon's nature raises one stat by <strong>+1</strong> and lowers another by <strong>−1</strong>. The five neutral natures (Hardy, Docile, Serious, Bashful, Quirky) have no effect.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>HP</h4>
                <p>Max HP is the species HP stat after the nature modifier. It does <em>not</em> scale with level.</p>
            </>
        )
    },
    'pokemon-skills': {
        title: 'Pokémon Capabilities',
        body: () => (
            <>
                <p>Pokémon <strong>capabilities</strong> are named traits that describe what a Pokémon can do outside of battle. They are fixed by species and cannot be changed.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Examples</h4>
                <ul style={{ paddingLeft: '18px', margin: '0 0 10px', lineHeight: '1.8' }}>
                    <li><strong>Sprouter</strong> — can grow plants through cracks in surfaces</li>
                    <li><strong>Sinker</strong> — can sink to the bottom of bodies of water</li>
                    <li><strong>Firestarter</strong> — can ignite flammable materials at will</li>
                    <li><strong>Threaded</strong> — can weave or spin thread-like substances</li>
                </ul>
                <p style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>Speed (in feet per round) is listed separately on the species entry.</p>
            </>
        )
    },
    'honors': {
        title: 'Honors & Leveling',
        body: () => (
            <>
                <p><strong>Honors</strong> represent your trainer's reputation and accomplishments. They determine when you can level up — <em>they are not the same as Badges</em>.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Sources of Honors</h4>
                <ul style={{ paddingLeft: '18px', margin: '0 0 10px', lineHeight: '1.8' }}>
                    <li><strong>Gym Badges</strong> — each badge typically earns 1 Honor</li>
                    <li><strong>Contest Ribbons</strong> — each ribbon typically earns 1 Honor</li>
                    <li><strong>Story Milestones</strong> — GM-awarded at major events</li>
                </ul>
                <p>Badges are tracked separately as trophies. Earning a badge does <em>not</em> automatically add an Honor — the GM awards them explicitly.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Leveling Up</h4>
                <p>Once you have enough Honors for the next level, click the <strong>+</strong> button next to your level. Leveling up does <em>not</em> happen automatically when you earn honors.</p>
                <ul style={{ paddingLeft: '18px', margin: '0 0 10px', lineHeight: '1.8' }}>
                    <li>Levels 1–2: free (character creation)</li>
                    <li>Each level beyond that requires a set number of Honors</li>
                    <li>Maximum trainer level: <strong>15</strong></li>
                </ul>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Class Slots</h4>
                <p>New class slots unlock at levels <strong>3, 7, and 11</strong>. At level 11, you may take a second Base class instead of an Advanced class (grants 1 talent, no Level 15 feature).</p>
            </>
        )
    },
    'z-moves': {
        title: 'Z-Moves',
        body: () => (
            <>
                <p>Z-Moves are powerful once-per-battle attacks that require a <strong>Z-Crystal</strong> matching the move's type. The Pokémon must be holding the crystal and know at least one move of that type.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Mechanics</h4>
                <ul style={{ paddingLeft: '18px', margin: '0 0 10px', lineHeight: '1.8' }}>
                    <li>Deal <strong>8d12</strong> base damage (10d12 for certain species-specific Z-Moves)</li>
                    <li>Can only be used <strong>once per battle</strong> — the button greys out after use</li>
                    <li>Replaces the triggering move for that action</li>
                    <li>Automatically hits — no accuracy roll</li>
                </ul>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Species-Specific Z-Moves</h4>
                <p>Certain species (Pikachu, Snorlax, Decidueye, etc.) have unique Z-Moves that appear as a separate section in the Z-Move panel. These often have different ranges or special effects in addition to damage.</p>
            </>
        )
    },
    'dynamax': {
        title: 'Dynamax & Gigantamax',
        body: () => (
            <>
                <p>Dynamax requires a <strong>Power Spot</strong> (Gym, den, or similar) and Pokémon loyalty ≥2. Gigantamax additionally requires loyalty ≥3 and the species to be Gigantamax-capable.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Dynamax Effects</h4>
                <ul style={{ paddingLeft: '18px', margin: '0 0 10px', lineHeight: '1.8' }}>
                    <li><strong>HP ×5</strong> — HP scales up on activation and clamps back on revert</li>
                    <li><strong>Movement</strong> reduced to 10ft per turn</li>
                    <li>All moves become <strong>Max Moves</strong> (80ft range, 30ft blast, 4d12, secondary terrain/stat effect)</li>
                    <li>Duration: <strong>1 minute</strong> (≈10 rounds); reverts automatically</li>
                </ul>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Gigantamax</h4>
                <p>Replaces the generic Max Move for that type with a species-specific <strong>G-Max Move</strong> (unique damage and effect). The G-Max roll button is one-use per Dynamax session.</p>
            </>
        )
    },
    'terastallization': {
        title: 'Terastallization',
        body: () => (
            <>
                <p>Terastallization replaces a Pokémon's typing with its <strong>Tera Type</strong> for the duration of the battle. Set the Tera Type on the Pokémon card before battle.</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Effects While Terastallized</h4>
                <ul style={{ paddingLeft: '18px', margin: '0 0 10px', lineHeight: '1.8' }}>
                    <li>Type changes to Tera Type — type matchups recalculate accordingly</li>
                    <li><strong>DEF +3</strong> and <strong>SDEF +3</strong> (shown as combat stage bonuses)</li>
                    <li><strong>Tera Aura</strong>: all Tera-type moves used nearby get STAB</li>
                </ul>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Tera Crown</h4>
                <p>While Terastallized, the Pokémon gains a special skill and an <strong>At-Will move</strong> tied to its Tera Type (e.g., Fire Tera Crown grants <em>Firestarter</em> + <em>Emberish</em>).</p>
                <h4 style={{ margin: '14px 0 6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Tera Blast</h4>
                <p>A Tera-type Ranged (40ft) attack dealing <strong>3d12</strong> damage using the higher of ATK or SATK. Usable <strong>3 times per battle</strong>.</p>
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
