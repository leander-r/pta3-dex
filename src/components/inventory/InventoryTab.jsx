// ============================================================
// Inventory Tab Component
// ============================================================

import React, { useState, useMemo } from 'react';
import { GAME_DATA } from '../../data/configs.js';
import { useData, useUI } from '../../contexts/index.js';
import toast from '../../utils/toast.js';

/**
 * InventoryTab - Inventory management interface
 * Uses DataContext for inventory state
 */
const InventoryTab = () => {
    const { inventory, setInventory } = useData();
    const { showConfirm } = useUI();
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddItem, setShowAddItem] = useState(false);
    const [itemSearch, setItemSearch] = useState('');
    const [addQuantity, setAddQuantity] = useState(1);
    const [expandedItem, setExpandedItem] = useState(null);
    const [inventorySort, setInventorySort] = useState('');
    // New states for add item panel
    const [addItemFilter, setAddItemFilter] = useState('all');
    const [addItemSort, setAddItemSort] = useState('name'); // 'name', 'price-low', 'price-high', 'type'

    // Get unique item types from GAME_DATA dynamically
    const availableTypes = useMemo(() => {
        const types = new Set(['all']);
        Object.values(GAME_DATA.items || {}).forEach(item => {
            if (item.type) {
                types.add(item.type.toLowerCase());
            }
        });
        // Also include types from current inventory
        inventory.forEach(item => {
            if (item.type) {
                types.add(item.type.toLowerCase());
            }
        });
        return Array.from(types).sort((a, b) => {
            if (a === 'all') return -1;
            if (b === 'all') return 1;
            return a.localeCompare(b);
        });
    }, [inventory]);

    // Get type color
    const getTypeColor = (type) => {
        const t = (type || '').toLowerCase();
        const colors = {
            'healing': '#4caf50',
            'medicine': '#4caf50',
            'ball': '#f44336',
            'pokeball': '#f44336',
            'battle': '#ff9800',
            'berry': '#e91e63',
            'held': '#00bcd4',
            'hold item': '#00bcd4',
            'evolution': '#9c27b0',
            'key': '#ffd700',
            'tm': '#3f51b5',
            'hm': '#3f51b5',
            'food': '#8bc34a',
            'misc': '#667eea'
        };
        return colors[t] || '#667eea';
    };

    // Filtered inventory (sorting is done via sortInventory action, not here)
    const filteredInventory = useMemo(() => {
        let result = [...inventory];

        if (filter !== 'all') {
            result = result.filter(item => {
                const itemType = (item.type || 'misc').toLowerCase();
                return itemType === filter;
            });
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(item =>
                item.name.toLowerCase().includes(query) ||
                (item.effect || '').toLowerCase().includes(query)
            );
        }

        return result;
    }, [inventory, filter, searchQuery]);

    // Sort inventory action - sorts the actual data
    const sortInventory = (sortBy) => {
        if (!sortBy) return;
        setInventory(prev => {
            const sorted = [...prev].sort((a, b) => {
                switch (sortBy) {
                    case 'name':
                        return a.name.localeCompare(b.name);
                    case 'type':
                        return (a.type || 'misc').localeCompare(b.type || 'misc') || a.name.localeCompare(b.name);
                    case 'quantity':
                        return (b.quantity || 1) - (a.quantity || 1);
                    default:
                        return 0;
                }
            });
            return sorted;
        });
    };

    // Available items from game data with filtering and sorting
    const availableItems = useMemo(() => {
        let items = Object.entries(GAME_DATA.items || {});

        // Apply type filter
        if (addItemFilter !== 'all') {
            items = items.filter(([_, data]) => {
                const itemType = (data.type || 'misc').toLowerCase();
                return itemType === addItemFilter;
            });
        }

        // Apply search filter
        if (itemSearch) {
            const search = itemSearch.toLowerCase();
            items = items.filter(([name, data]) =>
                name.toLowerCase().includes(search) ||
                (data.effect || '').toLowerCase().includes(search)
            );
        }

        // Apply sorting
        items.sort((a, b) => {
            const [nameA, dataA] = a;
            const [nameB, dataB] = b;
            switch (addItemSort) {
                case 'name':
                    return nameA.localeCompare(nameB);
                case 'price-low':
                    return (dataA.price || 0) - (dataB.price || 0);
                case 'price-high':
                    return (dataB.price || 0) - (dataA.price || 0);
                case 'type':
                    return (dataA.type || 'misc').localeCompare(dataB.type || 'misc') || nameA.localeCompare(nameB);
                default:
                    return nameA.localeCompare(nameB);
            }
        });

        return items.slice(0, 100); // Increased limit
    }, [itemSearch, addItemFilter, addItemSort]);

    const handleAddItem = (itemName, itemData = {}, quantity = 1) => {
        const qty = Math.max(1, parseInt(quantity) || 1);
        setInventory(prev => {
            const existingIndex = prev.findIndex(i =>
                i.name.toLowerCase() === itemName.toLowerCase()
            );

            if (existingIndex >= 0) {
                const newInventory = [...prev];
                newInventory[existingIndex] = {
                    ...newInventory[existingIndex],
                    quantity: (newInventory[existingIndex].quantity || 1) + qty
                };
                return newInventory;
            } else {
                return [...prev, {
                    name: itemName,
                    quantity: qty,
                    type: itemData.type || 'misc',
                    effect: itemData.effect || '',
                    price: itemData.price || 0
                }];
            }
        });
        setAddQuantity(1); // Reset quantity after adding
    };

    const handleRemoveItem = (itemName) => {
        setInventory(prev => {
            const idx = prev.findIndex(item =>
                item.name.toLowerCase() === itemName.toLowerCase()
            );
            if (idx === -1) return prev;

            const newInventory = [...prev];
            const currentQty = newInventory[idx].quantity || 1;

            if (currentQty <= 1) {
                newInventory.splice(idx, 1);
            } else {
                newInventory[idx] = {
                    ...newInventory[idx],
                    quantity: currentQty - 1
                };
            }
            return newInventory;
        });
    };

    const handleDeleteItem = (itemName) => {
        showConfirm({
            title: 'Delete Item',
            message: `Delete all "${itemName}" from inventory?`,
            danger: true,
            onConfirm: () => setInventory(prev => prev.filter(item =>
                item.name.toLowerCase() !== itemName.toLowerCase()
            ))
        });
    };

    const handleUseItem = (itemName) => {
        setInventory(prev => {
            const idx = prev.findIndex(item =>
                item.name.toLowerCase() === itemName.toLowerCase()
            );
            if (idx === -1) return prev;
            const currentQty = prev[idx].quantity || 1;
            if (currentQty <= 1) {
                toast.info(`Used last ${itemName}`);
                return prev.filter((_, i) => i !== idx);
            }
            const newInventory = [...prev];
            newInventory[idx] = { ...newInventory[idx], quantity: currentQty - 1 };
            toast.info(`Used ${itemName} (${currentQty - 1} remaining)`);
            return newInventory;
        });
    };

    const handleSetQuantity = (itemName, quantity) => {
        // Allow empty string while typing — treat as 1 temporarily
        const raw = String(quantity).trim();
        if (raw === '') {
            // User is clearing the field; keep the item but show empty
            setInventory(prev => prev.map(item => {
                if (item.name.toLowerCase() === itemName.toLowerCase()) {
                    return { ...item, quantity: 0, _editing: true };
                }
                return item;
            }));
            return;
        }
        const qty = Math.min(Math.max(parseInt(quantity) || 1, 1), 9999);

        setInventory(prev => prev.map(item => {
            if (item.name.toLowerCase() === itemName.toLowerCase()) {
                return { ...item, quantity: qty, _editing: undefined };
            }
            return item;
        }));
    };

    // Commit quantity on blur — if still 0 or empty, reset to 1
    const handleQuantityBlur = (itemName) => {
        setInventory(prev => prev.map(item => {
            if (item.name.toLowerCase() === itemName.toLowerCase()) {
                const qty = item.quantity || 1;
                return { ...item, quantity: Math.max(qty, 1), _editing: undefined };
            }
            return item;
        }));
    };

    const totalItems = inventory.reduce((sum, item) => sum + (item.quantity || 1), 0);

    return (
        <div>
            <h2 className="section-title">Inventory</h2>
            <p className="section-description">
                Track items, medicine, Poké Balls, and equipment. Tap an item for details or to adjust quantity.
            </p>

            <div className="section-card-purple">
                <h3 className="section-title-purple">
                    <span>🎒</span> Items
                    <span className="text-muted" style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 'normal' }}>
                        {totalItems} items ({inventory.length} unique)
                    </span>
                </h3>

                {/* Search and Filter */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Search inventory..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            flex: 1,
                            minWidth: '150px',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-medium)',
                            background: 'var(--input-bg)',
                            color: 'var(--text-primary)'
                        }}
                    />
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-medium)',
                            background: filter !== 'all' ? getTypeColor(filter) : 'var(--input-bg)',
                            color: filter !== 'all' ? 'white' : 'var(--text-primary)'
                        }}
                    >
                        {availableTypes.map(cat => (
                            <option key={cat} value={cat}>
                                {cat === 'all' ? 'All Items' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </option>
                        ))}
                    </select>
                    <select
                        value={inventorySort}
                        onChange={(e) => { setInventorySort(e.target.value); sortInventory(e.target.value); }}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: inventorySort ? '2px solid #667eea' : '1px solid var(--border-medium)',
                            background: inventorySort ? 'var(--input-bg-hover, var(--input-bg))' : 'var(--input-bg)',
                            color: 'var(--text-primary)'
                        }}
                    >
                        <option value="">Sort by...</option>
                        <option value="name">Name {inventorySort === 'name' ? '✓' : ''}</option>
                        <option value="type">Type {inventorySort === 'type' ? '✓' : ''}</option>
                        <option value="quantity">Quantity {inventorySort === 'quantity' ? '✓' : ''}</option>
                    </select>
                    <button
                        onClick={() => setShowAddItem(!showAddItem)}
                        style={{
                            padding: '8px 16px',
                            background: showAddItem ? '#f44336' : 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        {showAddItem ? '✕ Close' : '+ Add Item'}
                    </button>
                </div>

                {/* Add Item Panel */}
                {showAddItem && (
                    <div className="add-item-panel" style={{ marginBottom: '15px' }}>
                        {/* Search and Quantity Row */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="Search items by name or effect..."
                                    value={itemSearch}
                                    onChange={(e) => setItemSearch(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        paddingRight: itemSearch ? '32px' : '12px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border-medium)',
                                        background: 'var(--input-bg)',
                                        color: 'var(--text-primary)',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                {itemSearch && (
                                    <button
                                        onClick={() => setItemSearch('')}
                                        style={{
                                            position: 'absolute',
                                            right: '8px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: '#999',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '20px',
                                            height: '20px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        aria-label="Clear item search"
                                    >✕</button>
                                )}
                            </div>
                            <div className="quantity-input-group" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Qty:</span>
                                <input
                                    type="number"
                                    value={addQuantity}
                                    onChange={(e) => setAddQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    min="1"
                                    style={{ width: '50px', padding: '4px', borderRadius: '4px', border: '1px solid var(--border-medium)', textAlign: 'center', fontWeight: 'bold', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                                />
                            </div>
                        </div>

                        {/* Filter and Sort Row */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                            {/* Type Filter */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Type:</span>
                                <select
                                    value={addItemFilter}
                                    onChange={(e) => setAddItemFilter(e.target.value)}
                                    style={{
                                        padding: '6px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border-medium)',
                                        background: addItemFilter !== 'all' ? getTypeColor(addItemFilter) : 'var(--input-bg)',
                                        color: addItemFilter !== 'all' ? 'white' : 'var(--text-primary)',
                                        fontWeight: 'bold',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        textTransform: 'capitalize'
                                    }}
                                >
                                    {availableTypes.map(cat => (
                                        <option key={cat} value={cat}>
                                            {cat === 'all' ? 'All Types' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Sort */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Sort:</span>
                                <select
                                    value={addItemSort}
                                    onChange={(e) => setAddItemSort(e.target.value)}
                                    style={{
                                        padding: '6px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border-medium)',
                                        background: 'var(--input-bg)',
                                        color: 'var(--text-primary)',
                                        fontWeight: 'bold',
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="name">Name (A-Z)</option>
                                    <option value="price-low">Price (Low → High)</option>
                                    <option value="price-high">Price (High → Low)</option>
                                    <option value="type">Type</option>
                                </select>
                            </div>

                            {/* Results count */}
                            <span className="text-light" style={{ fontSize: '11px', marginLeft: 'auto' }}>
                                {availableItems.length} items
                            </span>
                        </div>

                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {availableItems.map(([name, data]) => {
                                const isExpanded = expandedItem === name;
                                return (
                                    <div
                                        key={name}
                                        className="item-list-card"
                                        style={{
                                            marginBottom: '6px',
                                            borderRadius: '8px',
                                            borderLeft: `4px solid ${getTypeColor(data.type)}`,
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '10px 12px',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => setExpandedItem(isExpanded ? null : name)}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {name}
                                                    <span style={{
                                                        padding: '2px 6px',
                                                        background: getTypeColor(data.type),
                                                        color: 'white',
                                                        borderRadius: '10px',
                                                        fontSize: '10px',
                                                        textTransform: 'capitalize'
                                                    }}>
                                                        {data.type || 'misc'}
                                                    </span>
                                                </div>
                                                <div className="text-muted" style={{ fontSize: '11px', marginTop: '2px' }}>
                                                    {data.price ? `₽${data.price}` : 'No price'}
                                                    {data.effect && (
                                                        <span className="text-light" style={{ marginLeft: '8px' }}>
                                                            {isExpanded ? '▼' : '▶'} Details
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAddItem(name, data, addQuantity);
                                                }}
                                                style={{
                                                    padding: '6px 14px',
                                                    background: '#4caf50',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}
                                            >
                                                <span>+{addQuantity}</span>
                                            </button>
                                        </div>

                                        {/* Expanded details */}
                                        {isExpanded && data.effect && (
                                            <div className="item-details-expanded" style={{
                                                padding: '10px 12px',
                                                borderTop: '1px solid #e0e0e0',
                                                fontSize: '12px'
                                            }}>
                                                <strong>Effect:</strong> {data.effect}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Custom Item */}
                            {itemSearch && !availableItems.some(([name]) => name.toLowerCase() === itemSearch.toLowerCase()) && (
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px',
                                        background: '#e8f5e9',
                                        borderRadius: '8px',
                                        marginTop: '8px',
                                        border: '2px dashed #4caf50'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Add Custom: "{itemSearch}"</div>
                                        <div className="text-muted" style={{ fontSize: '11px' }}>Not in database - will be added as misc item</div>
                                    </div>
                                    <button
                                        onClick={() => handleAddItem(itemSearch, { type: 'misc' }, addQuantity)}
                                        style={{
                                            padding: '6px 14px',
                                            background: '#667eea',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        +{addQuantity} Custom
                                    </button>
                                </div>
                            )}

                            {availableItems.length === 0 && (
                                <div className="empty-state" style={{ padding: '24px' }}>
                                    <span className="empty-state-icon" style={{ fontSize: '32px' }}>🔍</span>
                                    <p className="empty-state-title" style={{ fontSize: '14px' }}>
                                        {itemSearch || addItemFilter !== 'all'
                                            ? 'No items match your search'
                                            : 'Search for items'}
                                    </p>
                                    <p className="empty-state-description" style={{ fontSize: '12px' }}>
                                        {itemSearch || addItemFilter !== 'all'
                                            ? 'Try a different search term or change the filter.'
                                            : 'Use the search box or filters above to find items.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Inventory List */}
                {filteredInventory.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-state-icon">{inventory.length === 0 ? '🎒' : '🔍'}</span>
                        <p className="empty-state-title">
                            {inventory.length === 0 ? 'Inventory is empty' : 'No items found'}
                        </p>
                        <p className="empty-state-description">
                            {inventory.length === 0
                                ? 'Add items from the item database to track your supplies.'
                                : 'Try adjusting your search or filter.'}
                        </p>
                        {inventory.length === 0 && (
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowAddItem(true)}
                                style={{ marginTop: '16px' }}
                            >
                                + Add Items
                            </button>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '8px' }}>
                        {filteredInventory.map((item, index) => {
                            const itemType = (item.type || 'misc').toLowerCase();
                            return (
                                <div
                                    key={`${item.name}-${index}`}
                                    className="inventory-item-card"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        borderLeft: `4px solid ${getTypeColor(itemType)}`
                                    }}
                                >
                                    {/* Item Info */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {item.name}
                                            <span style={{
                                                padding: '2px 6px',
                                                background: getTypeColor(itemType),
                                                color: 'white',
                                                borderRadius: '10px',
                                                fontSize: '10px',
                                                textTransform: 'capitalize'
                                            }}>
                                                {itemType}
                                            </span>
                                        </div>
                                        {item.effect && (
                                            <div className="text-muted" style={{ fontSize: '12px', marginTop: '2px' }}>
                                                {item.effect}
                                            </div>
                                        )}
                                        {item.price > 0 && (
                                            <div className="text-light" style={{ fontSize: '11px', marginTop: '2px' }}>
                                                ₽{item.price} each
                                            </div>
                                        )}
                                    </div>

                                    {/* Quantity Controls */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <button
                                            onClick={() => handleRemoveItem(item.name)}
                                            className="quantity-btn"
                                            style={{
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            −
                                        </button>
                                        <input
                                            type="number"
                                            value={item._editing ? '' : (item.quantity || 1)}
                                            onChange={(e) => handleSetQuantity(item.name, e.target.value)}
                                            onBlur={() => handleQuantityBlur(item.name)}
                                            min="1"
                                            max="9999"
                                            style={{
                                                width: '50px',
                                                textAlign: 'center',
                                                padding: '4px',
                                                border: '1px solid var(--border-medium)',
                                                borderRadius: '4px',
                                                fontSize: '14px',
                                                fontWeight: 'bold',
                                                background: 'var(--input-bg)',
                                                color: 'var(--text-primary)'
                                            }}
                                        />
                                        <button
                                            onClick={() => handleAddItem(item.name, item, 1)}
                                            className="quantity-btn"
                                            style={{
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            +
                                        </button>
                                        <button
                                            onClick={() => handleUseItem(item.name)}
                                            style={{
                                                padding: '4px 8px',
                                                background: '#ff9800',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '10px',
                                                fontWeight: 'bold'
                                            }}
                                            title={`Use one ${item.name}`}
                                        >
                                            Use
                                        </button>
                                        <button
                                            onClick={() => handleDeleteItem(item.name)}
                                            style={{
                                                padding: '4px 8px',
                                                background: '#f44336',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '11px'
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventoryTab;
