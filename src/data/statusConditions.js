// ============================================================
// PTA3 Status Afflictions (HB1 "Afflictions", p.122-123)
// Shared between PokemonCard.jsx (read-only display) and
// StatusConditionUI.jsx (the Battle tab's toggle editor).
// ============================================================
// A Pokémon/trainer can only have one of these afflictions at a time.
// They recover from afflictions in a Poké Ball at the same rate as out
// of one. "Fainted" isn't a book affliction — it's bookkeeping for 0 HP.

export const STATUS_CONDITIONS = [
    { key: 'burned',     label: 'Burned',     icon: '🔥', color: '#f44336', desc: 'ATK −2. Loses 1d10 HP on taking an action. Cured at 0 HP or after 1 min without attacking/moving. Fire-types immune.' },
    { key: 'frozen',     label: 'Frozen',     icon: '🧊', color: '#42a5f5', desc: "Immobilized, can't move or act. 1d20 save ≥18 to thaw, or automatically after 10 min. An ally can thaw it over 3 turns; a Fire-type attack thaws it instantly. Ice-types immune." },
    { key: 'paralyzed',  label: 'Paralyzed',  icon: '⚡', color: '#ffc107', desc: '−2 SPD. 1d20 save ≥6 to act without issue (the DC rises +2 each failed turn, capping at 16); auto-cured after 5 min.' },
    { key: 'poisoned',   label: 'Poisoned',   icon: '☠️', color: '#9c27b0', desc: '−2 SATK. Loses 1d10 HP on taking an action. Cured at 0 HP or after 1 min without attacking/moving. Poison/Steel-types immune.' },
    { key: 'toxified',   label: 'Toxified',   icon: '🧪', color: '#6a1b9a', desc: '−2 SATK. Loses HP on taking an action, escalating each turn (1d8 → 1d12 → 1d20 → 2d20 → 3d20…). Cured at 0 HP or after 1 min without attacking/moving. Poison/Steel-types immune.' },
    { key: 'asleep',     label: 'Asleep',     icon: '💤', color: '#607d8b', desc: "Can't act. 1d20 save ≥16 to wake (DC drops −2 each turn, floor of 6); an adjacent ally's turn adds +5 to the save. Auto-wakes after 1 min." },
    { key: 'confused',   label: 'Confused',   icon: '💫', color: '#ff9800', desc: '1d20 save ≥11 to act without issue; on a failed save, take 1d12 HP self-damage instead. Cured on a ≥16 save or after 2 min; an adjacent ally adds +5 to the save.' },
    { key: 'infatuated', label: 'Infatuated', icon: '💕', color: '#ec407a', desc: "Can't attack the object of infatuation unless a 1d20 save ≥13 succeeds (attacks on other targets are unaffected). Cured on a ≥19 save or after 2 min. Only Pokémon can be infatuated." },
    { key: 'cursed',     label: 'Cursed',     icon: '💀', color: '#4a148c', desc: 'Loses 1/6 of max HP on taking an action. Cured at 0 HP. Only Pokémon can be cursed.' },
    { key: 'stunned',    label: 'Stunned',    icon: '😵‍💫', color: '#795548', desc: "Loses its next turn, then recovers." },
    { key: 'fainted',    label: 'Fainted',    icon: '✖',  color: '#333',    desc: 'HP reduced to 0. Out of battle until healed.' },
];
