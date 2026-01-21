// ============================================================
// SECTION CARD COMPONENT
// ============================================================

import React from 'react';

/**
 * Section Card - Consistent card styling for sections
 */
const SectionCard = React.memo(({ title, icon, headerRight, children, className = '' }) => (
    <div className={`card-orange ${className}`}>
        {title && (
            <h3 className="card-header font-bold">
                {icon && <span>{icon}</span>}
                {title}
                {headerRight && (
                    <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 'normal', color: '#666' }}>
                        {headerRight}
                    </span>
                )}
            </h3>
        )}
        {children}
    </div>
));

SectionCard.displayName = 'SectionCard';

export default SectionCard;
