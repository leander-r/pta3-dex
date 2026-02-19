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
        secondary: { ...baseStyle, background: 'var(--border-light, #e0e0e0)', color: 'var(--text-primary, #333)' },
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
export const EmptyState = React.memo(({ message, subMessage, icon, actionLabel, onAction }) => (
    <div className="empty-state">
        {icon && <span className="empty-state-icon">{icon}</span>}
        <p className="empty-state-title">{message}</p>
        {subMessage && <p className="empty-state-description">{subMessage}</p>}
        {actionLabel && onAction && (
            <button
                className="btn btn-primary"
                onClick={onAction}
                style={{ marginTop: '16px' }}
            >
                {actionLabel}
            </button>
        )}
    </div>
));
EmptyState.displayName = 'EmptyState';

/**
 * Loading Spinner - For async operations
 */
export const LoadingSpinner = React.memo(({ size = 'md', text }) => {
    const sizes = { sm: 20, md: 32, lg: 48 };
    const spinnerSize = sizes[size] || sizes.md;
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            gap: '12px'
        }}>
            <div
                className="animate-spin"
                style={{
                    width: spinnerSize,
                    height: spinnerSize,
                    border: '3px solid #e0e0e0',
                    borderTopColor: 'var(--poke-orange)',
                    borderRadius: '50%'
                }}
            />
            {text && <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{text}</span>}
        </div>
    );
});
LoadingSpinner.displayName = 'LoadingSpinner';

/**
 * Skeleton - Loading placeholder
 */
export const Skeleton = React.memo(({ width = '100%', height = '20px', rounded = false, style = {} }) => (
    <div
        style={{
            width,
            height,
            background: 'linear-gradient(90deg, var(--hover-bg, #f0f0f0) 25%, var(--border-light, #e0e0e0) 50%, var(--hover-bg, #f0f0f0) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmerSkeleton 1.5s infinite',
            borderRadius: rounded ? '50%' : '8px',
            ...style
        }}
    />
));
Skeleton.displayName = 'Skeleton';

/**
 * Card - Generic card container
 */
export const Card = React.memo(({ children, className = '', accent = false, onClick, style = {} }) => (
    <div
        className={`${accent ? 'section-card-accent' : 'section-card'} ${className} ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
        style={style}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick(e) : undefined}
    >
        {children}
    </div>
));
Card.displayName = 'Card';

/**
 * Divider - Visual separator
 */
export const Divider = React.memo(({ spacing = 'md', color = 'var(--border-light)' }) => {
    const spacings = { sm: '8px', md: '16px', lg: '24px' };
    return (
        <hr style={{
            border: 'none',
            borderTop: `1px solid ${color}`,
            margin: `${spacings[spacing]} 0`
        }} />
    );
});
Divider.displayName = 'Divider';

/**
 * StatusIndicator - Shows online/offline/pending status
 */
export const StatusIndicator = React.memo(({ status = 'default', label, pulse = false }) => {
    const colors = {
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336',
        default: '#9e9e9e'
    };
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: colors[status],
                boxShadow: pulse ? `0 0 0 2px ${colors[status]}33` : 'none',
                animation: pulse ? 'pulse 2s ease-in-out infinite' : 'none'
            }} />
            {label && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>}
        </span>
    );
});
StatusIndicator.displayName = 'StatusIndicator';

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
