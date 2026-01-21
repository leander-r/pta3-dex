// ============================================================
// REUSABLE UI COMPONENTS (Memoized for Performance)
// ============================================================

import React from 'react';

/**
 * Stat Display Box - For showing stats with labels
 */
export const StatDisplay = React.memo(({ label, value, color = '#333', subtext }) => (
    <div className="stat-display">
        <div className="stat-label">{label}</div>
        <div className="stat-value" style={{ color }}>{value}</div>
        {subtext && <div className="text-xs text-muted mt-sm">{subtext}</div>}
    </div>
));
StatDisplay.displayName = 'StatDisplay';

/**
 * Badge Component - Consistent badge styling
 */
export const Badge = React.memo(({ children, color = 'orange', small = false }) => {
    const colors = {
        orange: 'badge-orange',
        green: 'badge-green', 
        red: 'badge-red',
        blue: 'badge-blue',
        purple: 'badge-purple'
    };
    return (
        <span className={`badge ${colors[color] || 'badge-orange'}`} style={small ? { fontSize: '9px', padding: '1px 5px' } : {}}>
            {children}
        </span>
    );
});
Badge.displayName = 'Badge';

/**
 * Icon Button - Small icon-only button
 */
export const IconButton = React.memo(({ onClick, icon, title, variant = 'secondary', disabled = false }) => {
    const baseStyle = {
        padding: '6px 10px',
        fontSize: '12px',
        border: 'none',
        borderRadius: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease'
    };
    const variants = {
        primary: { ...baseStyle, background: 'var(--poke-orange)', color: 'white' },
        secondary: { ...baseStyle, background: '#e0e0e0', color: '#333' },
        danger: { ...baseStyle, background: 'var(--poke-red)', color: 'white' }
    };
    return (
        <button onClick={onClick} style={variants[variant]} disabled={disabled} title={title}>
            {icon}
        </button>
    );
});
IconButton.displayName = 'IconButton';

/**
 * Empty State - Placeholder when no items
 */
export const EmptyState = React.memo(({ message, subMessage }) => (
    <div className="empty-state">
        <p>{message}</p>
        {subMessage && <p className="text-sm text-muted mt-sm">{subMessage}</p>}
    </div>
));
EmptyState.displayName = 'EmptyState';

/**
 * Progress Bar - For EXP, HP, etc.
 */
export const ProgressBar = React.memo(({ current, max, color = 'var(--poke-green)', showText = true }) => {
    const percentage = Math.min(100, Math.max(0, (current / max) * 100));
    return (
        <div>
            <div className="exp-progress">
                <div 
                    className="exp-progress-bar" 
                    style={{ width: `${percentage}%`, background: color }}
                />
            </div>
            {showText && (
                <div className="exp-text">{current} / {max}</div>
            )}
        </div>
    );
});
ProgressBar.displayName = 'ProgressBar';

/**
 * Type Badge - Pokemon type styling
 */
export const TypeBadge = React.memo(({ type }) => (
    <span className={`type-badge type-${type?.toLowerCase()}`}>
        {type}
    </span>
));
TypeBadge.displayName = 'TypeBadge';

/**
 * Tooltip - Info tooltip with hover
 */
export const Tooltip = React.memo(({ text }) => (
    <span className="info-tooltip">
        ?
        <span className="tooltip-text">{text}</span>
    </span>
));
Tooltip.displayName = 'Tooltip';
