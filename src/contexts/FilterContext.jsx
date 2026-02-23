// ============================================================
// Filter Context
// ============================================================
// Reference tab filter state — consumed only by MovesSection
// and AbilitiesSection. Isolated so filter changes don't
// re-render the rest of the app.

import React, { createContext, useContext, useState } from 'react';

const FilterContext = createContext(null);

export const useFilter = () => {
    const context = useContext(FilterContext);
    if (!context) {
        throw new Error('useFilter must be used within FilterProvider');
    }
    return context;
};

export const FilterProvider = ({ children }) => {
    const [movesFilter, setMovesFilter] = useState({
        search: '',
        type: '',
        category: '',
        frequency: '',
        sortBy: 'name',
        sortDir: 'asc'
    });

    const [abilitiesFilter, setAbilitiesFilter] = useState({
        search: '',
        sortDir: 'asc'
    });

    const [moveSearchQuery, setMoveSearchQuery] = useState('');
    const [moveTypeFilter, setMoveTypeFilter] = useState('all');
    const [moveCategoryFilter, setMoveCategoryFilter] = useState('all');

    const value = {
        movesFilter,
        setMovesFilter,
        abilitiesFilter,
        setAbilitiesFilter,
        moveSearchQuery,
        setMoveSearchQuery,
        moveTypeFilter,
        setMoveTypeFilter,
        moveCategoryFilter,
        setMoveCategoryFilter
    };

    return (
        <FilterContext.Provider value={value}>
            {children}
        </FilterContext.Provider>
    );
};

export default FilterContext;
