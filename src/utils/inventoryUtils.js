// ============================================================
// Inventory Utilities
// ============================================================
// Shared by InventoryTab's own "Add Custom" card and the standalone
// CreateCustomItemModal (opened from the Custom Content hub) so both
// entry points merge quantities into an existing stack the same way.

/**
 * Adds an item to inventory, merging quantity into an existing stack
 * (case-insensitive name match) instead of creating a duplicate entry.
 */
export const addItemToInventory = (inventory, itemName, itemData = {}, quantity = 1) => {
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const existingIndex = inventory.findIndex(i => i.name.toLowerCase() === itemName.toLowerCase());

    if (existingIndex >= 0) {
        const updated = [...inventory];
        updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: (updated[existingIndex].quantity || 1) + qty
        };
        return updated;
    }

    return [...inventory, {
        name: itemName,
        quantity: qty,
        type: itemData.type || 'misc',
        effect: itemData.effect || '',
        price: itemData.price || 0
    }];
};
