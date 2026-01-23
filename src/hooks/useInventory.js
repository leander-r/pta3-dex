// ============================================================
// useInventory Hook
// ============================================================
// Inventory management for PTA items

import { useState, useCallback, useMemo } from 'react';

/**
 * Item categories
 */
export const ITEM_CATEGORIES = [
    'all',
    'healing',
    'ball',
    'battle',
    'berry',
    'held',
    'evolution',
    'key',
    'misc'
];

/**
 * Custom hook for inventory management
 * @param {Array} initialInventory - Initial inventory items
 * @returns {Object} - Inventory state and functions
 */
export const useInventory = (initialInventory = []) => {
    const [inventory, setInventory] = useState(initialInventory);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Add item to inventory
    const addItem = useCallback((item, quantity = 1) => {
        setInventory(prev => {
            const existingIndex = prev.findIndex(i =>
                i.name.toLowerCase() === item.name?.toLowerCase() ||
                i.name.toLowerCase() === item?.toLowerCase()
            );

            if (existingIndex >= 0) {
                const newInventory = [...prev];
                newInventory[existingIndex] = {
                    ...newInventory[existingIndex],
                    quantity: (newInventory[existingIndex].quantity || 1) + quantity
                };
                return newInventory;
            } else {
                const newItem = typeof item === 'string'
                    ? { name: item, quantity }
                    : { ...item, quantity };
                return [...prev, newItem];
            }
        });
    }, []);

    // Remove item from inventory (reduce quantity by 1)
    const removeItem = useCallback((itemName, quantity = 1) => {
        setInventory(prev => {
            const idx = prev.findIndex(item =>
                item.name.toLowerCase() === itemName.toLowerCase()
            );
            if (idx === -1) return prev;

            const newInventory = [...prev];
            const currentQty = newInventory[idx].quantity || 1;

            if (currentQty <= quantity) {
                newInventory.splice(idx, 1);
            } else {
                newInventory[idx] = {
                    ...newInventory[idx],
                    quantity: currentQty - quantity
                };
            }
            return newInventory;
        });
    }, []);

    // Delete item completely from inventory
    const deleteItem = useCallback((itemName) => {
        setInventory(prev => prev.filter(item =>
            item.name.toLowerCase() !== itemName.toLowerCase()
        ));
    }, []);

    // Check if item exists in inventory
    const hasItem = useCallback((itemName) => {
        return inventory.some(item =>
            item.name.toLowerCase() === itemName.toLowerCase() &&
            (item.quantity || 1) > 0
        );
    }, [inventory]);

    // Get item quantity
    const getItemQuantity = useCallback((itemName) => {
        const item = inventory.find(i =>
            i.name.toLowerCase() === itemName.toLowerCase()
        );
        return item ? (item.quantity || 1) : 0;
    }, [inventory]);

    // Update item quantity directly
    const setItemQuantity = useCallback((itemName, quantity) => {
        setInventory(prev => {
            const idx = prev.findIndex(item =>
                item.name.toLowerCase() === itemName.toLowerCase()
            );

            if (idx === -1) {
                if (quantity > 0) {
                    return [...prev, { name: itemName, quantity }];
                }
                return prev;
            }

            const newInventory = [...prev];
            if (quantity <= 0) {
                newInventory.splice(idx, 1);
            } else {
                newInventory[idx] = { ...newInventory[idx], quantity };
            }
            return newInventory;
        });
    }, []);

    // Filtered inventory (memoized)
    const filteredInventory = useMemo(() => {
        let result = inventory;

        // Filter by category
        if (filter !== 'all') {
            result = result.filter(item =>
                (item.type || item.category || 'misc').toLowerCase() === filter.toLowerCase()
            );
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(item =>
                item.name.toLowerCase().includes(query) ||
                (item.effect || '').toLowerCase().includes(query) ||
                (item.description || '').toLowerCase().includes(query)
            );
        }

        return result;
    }, [inventory, filter, searchQuery]);

    // Get total item count
    const totalItemCount = useMemo(() => {
        return inventory.reduce((sum, item) => sum + (item.quantity || 1), 0);
    }, [inventory]);

    // Get unique item count
    const uniqueItemCount = inventory.length;

    // Clear all inventory
    const clearInventory = useCallback(() => {
        setInventory([]);
    }, []);

    // Bulk add items
    const bulkAddItems = useCallback((items) => {
        items.forEach(item => {
            if (typeof item === 'string') {
                addItem(item, 1);
            } else {
                addItem(item, item.quantity || 1);
            }
        });
    }, [addItem]);

    return {
        inventory,
        setInventory,
        filter,
        setFilter,
        searchQuery,
        setSearchQuery,
        filteredInventory,
        addItem,
        removeItem,
        deleteItem,
        hasItem,
        getItemQuantity,
        setItemQuantity,
        clearInventory,
        bulkAddItems,
        totalItemCount,
        uniqueItemCount
    };
};

export default useInventory;
