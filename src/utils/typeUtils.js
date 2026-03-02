// ============================================================
// TYPE AND STAT COLOR UTILITIES
// ============================================================

/**
 * Global color constants for consistency
 */
export const TYPE_COLORS = {
    normal: '#A8A878', fire: '#F08030', water: '#6890F0', electric: '#F8D030',
    grass: '#78C850', ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0',
    ground: '#E0C068', flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
    rock: '#B8A038', ghost: '#705898', dragon: '#7038F8', dark: '#705848',
    steel: '#B8B8D0', fairy: '#EE99AC'
};

export const STAT_COLORS = {
    HP: '#4caf50', ATK: '#f44336', DEF: '#2196f3',
    SATK: '#9c27b0', SDEF: '#ff9800', SPD: '#00bcd4',
    hp: '#4caf50', atk: '#f44336', def: '#2196f3',
    satk: '#9c27b0', sdef: '#ff9800', spd: '#00bcd4'
};

/**
 * Get type color for styling
 */
export const getTypeColor = (type) => TYPE_COLORS[type?.toLowerCase()] || '#999';

/**
 * Returns 'white' or a dark text color for best WCAG contrast against hexColor.
 * Threshold: luminance > 0.179 → use dark text (contrast ≥ 4.5:1 with both).
 */
export const getContrastTextColor = (hexColor) => {
    if (!hexColor || hexColor.length < 7) return 'white';
    const hex = hexColor.replace('#', '');
    const toLinear = (c) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    const r = toLinear(parseInt(hex.substring(0, 2), 16) / 255);
    const g = toLinear(parseInt(hex.substring(2, 4), 16) / 255);
    const b = toLinear(parseInt(hex.substring(4, 6), 16) / 255);
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 0.179 ? '#1a1a2e' : 'white';
};

/**
 * Get stat color for display
 */
export const getStatColor = (stat) => STAT_COLORS[stat?.toLowerCase()] || '#666';
