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
 * Get stat color for display
 */
export const getStatColor = (stat) => STAT_COLORS[stat?.toLowerCase()] || '#666';
