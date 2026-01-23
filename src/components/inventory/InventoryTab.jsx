// ============================================================
// Inventory Tab Component
// ============================================================

import React, { useState, useMemo } from 'react';
import { GAME_DATA } from '../../data/configs.js';

const ITEM_CATEGORIES = ['all', 'healing', 'ball', 'battle', 'berry', 'held', 'evolution', 'key', 'misc'];

const InventoryTab = ({ inventory, setInventory }) => {
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddItem, setShowAddItem] = useState(false);
    const [itemSearch, setItemSearch] = useState('');

    // Filtered inventory
    const filteredInventory = useMemo(() => {
        let result = inventory;

        if (filter !== 'all') {
            result = result.filter(item =>
                (item.type || item.category || 'misc').toLowerCase() === filter.toLowerCase()
            );
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

    // Available items from game data
    const availableItems = useMemo(() => {
        return Object.entries(GAME_DATA.items || {})
            .filter(([name, _]) => {
                if (!itemSearch) return true;
                return name.toLowerCase().includes(itemSearch.toLowerCase());
            })
            .slice(0, 50);
    }, [itemSearch]);

    const handleAddItem = (itemName, itemData = {}) => {
        setInventory(prev => {
            const existingIndex = prev.findIndex(i =>
                i.name.toLowerCase() === itemName.toLowerCase()
            );

            if (existingIndex >= 0) {
                const newInventory = [...prev];
                newInventory[existingIndex] = {
                    ...newInventory[existingIndex],
                    quantity: (newInventory[existingIndex].quantity || 1) + 1
                };
                return newInventory;
            } else {
                return [...prev, {
                    name: itemName,
                    quantity: 1,
                    type: itemData.type || 'misc',
                    effect: itemData.effect || '',
                    price: itemData.price || 0
                }];
            }
        });
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
                        {ITEM_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>
                                {cat === 'all' ? 'All Items' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={() => setShowAddItem(!showAddItem)}
                        style={{
                            padding: '8px 16px',
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        + Add Item
                    </button>
                </div>

                {/* Add Item Panel */}
                {showAddItem && (
                    <div style={{ marginBottom: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                        <input
                            type="text"
                            placeholder="Search items to add..."
                            value={itemSearch}
                            onChange={(e) => setItemSearch(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ddd', marginBottom: '10px' }}
                        />

                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {availableItems.map(([name, data]) => (
                                <div
                                    key={name}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '8px 10px',
                                        marginBottom: '4px',
                                        background: 'white',
                                        borderRadius: '6px'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{name}</div>
                                        <div style={{ fontSize: '11px', color: '#666' }}>
                                            {data.type && <span>{data.type}</span>}
                                            {data.price && <span> | ₽{data.price}</span>}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAddItem(name, data)}
                                        style={{
                                            padding: '4px 12px',
                                            background: '#4caf50',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        Add
                                    </button>
                                </div>
                            ))}

                            {/* Custom Item */}
                            {itemSearch && !availableItems.some(([name]) => name.toLowerCase() === itemSearch.toLowerCase()) && (
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '8px 10px',
                                        background: '#e8f5e9',
                                        borderRadius: '6px',
                                        marginTop: '8px'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '13px' }}>Add Custom: "{itemSearch}"</div>
                                        <div style={{ fontSize: '11px', color: '#666' }}>Not in database</div>
                                    </div>
                                    <button
                                        onClick={() => handleAddItem(itemSearch, { type: 'misc' })}
                                        style={{
                                            padding: '4px 12px',
                                            background: '#667eea',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        Add Custom
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Inventory List */}
                {filteredInventory.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                        {inventory.length === 0 ? 'Inventory is empty' : 'No items match your search'}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '8px' }}>
                        {filteredInventory.map((item, index) => (
                            <div
                                key={`${item.name}-${index}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px',
                                    background: 'white',
                                    borderRadius: '8px',
                                    borderLeft: `4px solid ${
                                        item.type === 'healing' ? '#4caf50' :
                                        item.type === 'ball' ? '#f44336' :
                                        item.type === 'battle' ? '#ff9800' :
                                        item.type === 'berry' ? '#e91e63' :
                                        item.type === 'evolution' ? '#9c27b0' :
                                        '#667eea'
                                    }`
                                }}
                            >
                                {/* Item Info */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{item.name}</div>
                                    {item.effect && (
                                        <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                            {item.effect}
                                        </div>
                                    )}
                                    <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                                        {item.type && <span style={{ textTransform: 'capitalize' }}>{item.type}</span>}
                                        {item.price && <span> | ₽{item.price}</span>}
                                    </div>
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
                                            fontSize: '16px'
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
                                        onClick={() => handleAddItem(item.name, item)}
                                        style={{
                                            width: '28px',
                                            height: '28px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            background: 'white',
                                            cursor: 'pointer',
                                            fontSize: '16px'
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
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventoryTab;
