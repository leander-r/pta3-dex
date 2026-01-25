// ============================================================
// Inventory Tab Component
// ============================================================

import React, { useState, useMemo } from 'react';
import { GAME_DATA } from '../../data/configs.js';

const InventoryTab = ({ inventory, setInventory, showDetail }) => {
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddItem, setShowAddItem] = useState(false);
    const [itemSearch, setItemSearch] = useState('');
    const [addQuantity, setAddQuantity] = useState(1);
    const [expandedItem, setExpandedItem] = useState(null);
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

    // Filtered inventory
    const filteredInventory = useMemo(() => {
        let result = inventory;

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
        if (confirm(`Delete all "${itemName}" from inventory?`)) {
            setInventory(prev => prev.filter(item =>
                item.name.toLowerCase() !== itemName.toLowerCase()
            ));
        }
    };

    const handleSetQuantity = (itemName, quantity) => {
        const qty = parseInt(quantity) || 0;
        if (qty <= 0) {
            handleDeleteItem(itemName);
            return;
        }

        setInventory(prev => prev.map(item => {
            if (item.name.toLowerCase() === itemName.toLowerCase()) {
                return { ...item, quantity: qty };
            }
            return item;
        }));
    };

    const totalItems = inventory.reduce((sum, item) => sum + (item.quantity || 1), 0);

    return (
        <div>
            <h2 className="section-title">Inventory</h2>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px', marginTop: '-5px' }}>
                Track items, medicine, Poké Balls, and equipment. Tap an item for details or to adjust quantity.
            </p>

            <div className="section-card-purple">
                <h3 className="section-title-purple">
                    <span>🎒</span> Items
                    <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 'normal', color: '#666' }}>
                        {totalItems} items ({inventory.length} unique)
                    </span>
                </h3>

                {/* Search and Filter */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Search inventory..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ flex: 1, minWidth: '150px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
                    />
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
                    >
                        {availableTypes.map(cat => (
                            <option key={cat} value={cat}>
                                {cat === 'all' ? 'All Items' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </option>
                        ))}
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
                    <div style={{ marginBottom: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', border: '2px solid #667eea' }}>
                        {/* Search and Quantity Row */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="Search items by name or effect..."
                                    value={itemSearch}
                                    onChange={(e) => setItemSearch(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', paddingRight: itemSearch ? '32px' : '12px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }}
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
                                    >✕</button>
                                )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white', padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd' }}>
                                <span style={{ fontSize: '12px', color: '#666' }}>Qty:</span>
                                <input
                                    type="number"
                                    value={addQuantity}
                                    onChange={(e) => setAddQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    min="1"
                                    style={{ width: '50px', padding: '4px', borderRadius: '4px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}
                                />
                            </div>
                        </div>

                        {/* Filter and Sort Row */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                            {/* Type Filter */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Type:</span>
                                <select
                                    value={addItemFilter}
                                    onChange={(e) => setAddItemFilter(e.target.value)}
                                    style={{
                                        padding: '6px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid #ddd',
                                        background: addItemFilter !== 'all' ? getTypeColor(addItemFilter) : 'white',
                                        color: addItemFilter !== 'all' ? 'white' : '#333',
                                        fontWeight: 'bold',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        textTransform: 'capitalize'
                                    }}
                                >
                                    <option value="all">All Types</option>
                                    <option value="healing">Healing</option>
                                    <option value="medicine">Medicine</option>
                                    <option value="ball">Poke Ball</option>
                                    <option value="pokeball">Pokeball</option>
                                    <option value="battle">Battle</option>
                                    <option value="berry">Berry</option>
                                    <option value="held">Held Item</option>
                                    <option value="hold item">Hold Item</option>
                                    <option value="evolution">Evolution</option>
                                    <option value="key">Key Item</option>
                                    <option value="tm">TM</option>
                                    <option value="food">Food</option>
                                    <option value="misc">Misc</option>
                                </select>
                            </div>

                            {/* Sort */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Sort:</span>
                                <select
                                    value={addItemSort}
                                    onChange={(e) => setAddItemSort(e.target.value)}
                                    style={{
                                        padding: '6px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid #ddd',
                                        background: 'white',
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
                            <span style={{ fontSize: '11px', color: '#999', marginLeft: 'auto' }}>
                                {availableItems.length} items
                            </span>
                        </div>

                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {availableItems.map(([name, data]) => {
                                const isExpanded = expandedItem === name;
                                return (
                                    <div
                                        key={name}
                                        style={{
                                            marginBottom: '6px',
                                            background: 'white',
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
                                                <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                                                    {data.price ? `₽${data.price}` : 'No price'}
                                                    {data.effect && (
                                                        <span style={{ marginLeft: '8px', color: '#999' }}>
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
                                            <div style={{
                                                padding: '10px 12px',
                                                background: '#f0f4ff',
                                                borderTop: '1px solid #e0e0e0',
                                                fontSize: '12px',
                                                color: '#333'
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
                                        <div style={{ fontSize: '11px', color: '#666' }}>Not in database - will be added as misc item</div>
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
                                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                    {itemSearch || addItemFilter !== 'all'
                                        ? 'No items match your search/filter'
                                        : 'Browse items using the filters above or search by name'}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Inventory List */}
                {filteredInventory.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                        {inventory.length === 0 ? 'Inventory is empty' : 'No items match your filter'}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '8px' }}>
                        {filteredInventory.map((item, index) => {
                            const itemType = (item.type || 'misc').toLowerCase();
                            return (
                                <div
                                    key={`${item.name}-${index}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px',
                                        background: 'white',
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
                                            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                                {item.effect}
                                            </div>
                                        )}
                                        {item.price > 0 && (
                                            <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                                                ₽{item.price} each
                                            </div>
                                        )}
                                    </div>

                                    {/* Quantity Controls */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <button
                                            onClick={() => handleRemoveItem(item.name)}
                                            style={{
                                                width: '28px',
                                                height: '28px',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                background: 'white',
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
                                            value={item.quantity || 1}
                                            onChange={(e) => handleSetQuantity(item.name, e.target.value)}
                                            min="0"
                                            style={{
                                                width: '50px',
                                                textAlign: 'center',
                                                padding: '4px',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                fontSize: '14px',
                                                fontWeight: 'bold'
                                            }}
                                        />
                                        <button
                                            onClick={() => handleAddItem(item.name, item, 1)}
                                            style={{
                                                width: '28px',
                                                height: '28px',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                background: 'white',
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
