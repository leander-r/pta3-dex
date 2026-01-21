// ============================================================
// APPLICATION CONTEXT (For scalable state management)
// ============================================================

import React from 'react';

/**
 * App Context - Provides global state access without prop drilling
 * Currently set up for future scalability; main state still in PTAManager
 */
export const AppContext = React.createContext(null);

/**
 * useAppContext - Hook to access app context
 */
export const useAppContext = () => {
    const context = React.useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within AppProvider');
    }
    return context;
};

export default AppContext;
