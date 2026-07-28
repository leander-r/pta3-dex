// ============================================================
// Special Form Info
// ============================================================
// Shared lookup for Pokémon special forms (Alpha/Totem/Titan/Shadow/Purified)
// so PokemonCard, CardExportModal, and text/print exports stay in sync.

export const SPECIAL_FORM_INFO = {
    alpha:    { label: 'Alpha',    color: '#b71c1c', icon: '🔴', desc: 'HP ×2, ATK +5, SATK +5, one defense raised to 15. Gains Alpha Beam/Impact (1/day 5d20, recharge turn, −2 Accuracy Check) and Alpha Restoration (3/day 1d12 heal). Needs ≤50% HP or Master Ball to capture.' },
    totem:    { label: 'Totem',    color: '#e65100', icon: '🟠', desc: 'HP ×2, ATK +5, SATK +5, one defense raised to 15. Gains Totemic Power, Totemic Call, and Totemic Guardian (3/day 3d8 heal).' },
    titan:    { label: 'Titan',    color: '#37474f', icon: '⚫', desc: 'HP ×10, size Huge+. Melee attacks become Ranged(15ft Burst); ranged attacks gain 15ft Blast. Cannot be captured normally.' },
    shadow:   { label: 'Shadow',   color: '#311b92', icon: '🌑', desc: 'Shadow Aura: can make Stealth checks; attacks deal +4 damage but lose 4 HP after each hit. Uses Shadow Rush.' },
    purified: { label: 'Purified', color: '#00695c', icon: '🌟', desc: 'Light Aura: when below 20 HP, attacks deal +4 damage. Can use Guiding Light (+5 to Pokémon Handling checks).' },
};

export const VALID_SPECIAL_FORMS = Object.keys(SPECIAL_FORM_INFO);
