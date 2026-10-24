// ============================================================
// Nav / Header Icon Set
// ============================================================
// One shared stroke-icon style used by both the sidebar/bottom-bar
// nav and the header menu buttons: 24x24 viewBox, fill="none",
// stroke="currentColor" (unless overridden), strokeWidth=2, round
// caps/joins. Nav usages rely on CSS (.nav-icon svg { width/height: 1em })
// to size via the wrapper's font-size; header usages pass an explicit
// `size` + `stroke` since each menu button needs its own idle/active color.

const base = (stroke, strokeWidth) => ({
    fill: 'none',
    stroke: stroke || 'currentColor',
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
});

export const IconPerson = ({ size = 24, stroke, strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(stroke, strokeWidth)}>
        <circle cx="12" cy="7" r="4" />
        <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
    </svg>
);

/** Circle-with-center-dot — echoes the app's own header logo mark. */
export const IconPokeball = ({ size = 24, stroke, strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(stroke, strokeWidth)}>
        <circle cx="12" cy="12" r="9" />
        <line x1="3" y1="12" x2="8" y2="12" />
        <line x1="16" y1="12" x2="21" y2="12" />
        <circle cx="12" cy="12" r="2.5" fill={stroke || 'currentColor'} stroke="none" />
    </svg>
);

export const IconBag = ({ size = 24, stroke, strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(stroke, strokeWidth)}>
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
);

/** Rounded square with 3 pips — dice / battle roller. */
export const IconDice = ({ size = 24, stroke, strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(stroke, strokeWidth)}>
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <circle cx="8" cy="8" r="1.3" fill={stroke || 'currentColor'} stroke="none" />
        <circle cx="12" cy="12" r="1.3" fill={stroke || 'currentColor'} stroke="none" />
        <circle cx="16" cy="16" r="1.3" fill={stroke || 'currentColor'} stroke="none" />
    </svg>
);

export const IconBook = ({ size = 24, stroke, strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(stroke, strokeWidth)}>
        <path d="M2 4.5A2.5 2.5 0 0 1 4.5 2H11v20H4.5A2.5 2.5 0 0 1 2 19.5v-15z" />
        <path d="M22 4.5A2.5 2.5 0 0 0 19.5 2H13v20h6.5a2.5 2.5 0 0 0 2.5-2.5v-15z" />
    </svg>
);

export const IconFileText = ({ size = 24, stroke, strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(stroke, strokeWidth)}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
);

export const IconMap = ({ size = 24, stroke, strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(stroke, strokeWidth)}>
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
);

export const IconKebab = ({ size = 24, stroke, strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(stroke, strokeWidth)}>
        <circle cx="12" cy="5" r="1.6" fill={stroke || 'currentColor'} stroke="none" />
        <circle cx="12" cy="12" r="1.6" fill={stroke || 'currentColor'} stroke="none" />
        <circle cx="12" cy="19" r="1.6" fill={stroke || 'currentColor'} stroke="none" />
    </svg>
);

export const IconSave = ({ size = 24, stroke, strokeWidth = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base(stroke, strokeWidth)}>
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
    </svg>
);
