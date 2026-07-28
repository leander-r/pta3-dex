// ============================================================
// Custom Item Modal Component
// ============================================================
// Standalone "create a custom item" form, opened from the Custom Content
// hub. InventoryTab's own "Add Item" panel has its own inline version of
// this same flow (revealed when a search doesn't match the catalog) —
// both funnel through addItemToInventory() so they behave identically.

import React, { useState, useEffect } from 'react';
import { GAME_DATA } from '../../data/configs.js';
import { EQUIPPABLE_ITEM_TYPES } from '../../data/constants.js';
import useModalKeyboard from '../../hooks/useModalKeyboard.js';
import toast from '../../utils/toast.js';

const DEFAULT_FORM = { name: '', type: 'misc', effect: '', price: '', quantity: 1 };

/**
 * CustomItemModal - Create a custom inventory item (optionally a weapon/armor/
 * clothing/accessory) without needing to know about InventoryTab's search-based
 * "not found in the catalog" discovery flow.
 *
 * Props: show, onClose, onCreate(itemName, itemData, quantity), inventory (for
 * the Type dropdown's dynamic options + a duplicate-of-official-item warning)
 */
const CustomItemModal = ({ show, onClose, onCreate, inventory }) => {
    const [form, setForm] = useState(DEFAULT_FORM);

    // Reset to a blank form every time the modal opens
    useEffect(() => {
        if (show) setForm(DEFAULT_FORM);
    }, [show]);

    const handleClose = () => onClose();
    const { modalRef } = useModalKeyboard(show, handleClose);

    if (!show) return null;

    const typeOptions = Array.from(new Set([
        ...Object.values(GAME_DATA.items || {}).map(i => (i.type || '').toLowerCase()).filter(Boolean),
        ...(inventory || []).map(i => (i.type || '').toLowerCase()).filter(Boolean),
        'misc',
        ...EQUIPPABLE_ITEM_TYPES
    ])).sort();

    const handleCreate = () => {
        const name = form.name.trim();
        if (!name) {
            toast.warning('Item name is required!');
            return;
        }
        const officialMatch = Object.keys(GAME_DATA.items || {}).find(n => n.toLowerCase() === name.toLowerCase());
        if (officialMatch) {
            toast.info(`"${officialMatch}" is already an official item — added using your custom settings instead.`);
        }
        onCreate(name, {
            type: form.type,
            effect: form.effect.trim(),
            price: Math.max(0, parseInt(form.price, 10) || 0)
        }, Math.max(1, parseInt(form.quantity, 10) || 1));
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleClose} role="presentation">
            <div
                ref={modalRef}
                className="modal"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: 'min(95vw, 480px)', width: '100%' }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="custom-item-modal-title"
            >
                <div
                    className="modal-header"
                    style={{
                        background: 'linear-gradient(135deg, #43a047, #66bb6a)',
                        color: 'white',
                        margin: '-25px -25px 20px -25px',
                        padding: '18px 20px',
                        borderRadius: '17px 17px 0 0',
                        borderBottom: 'none'
                    }}
                >
                    <h3
                        id="custom-item-modal-title"
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0, fontSize: '18px', fontWeight: '800', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                    >
                        <span style={{ fontSize: '22px' }}>🎒</span>
                        Create Custom Item
                    </h3>
                    <button
                        onClick={handleClose}
                        aria-label="Close modal"
                        title="Close"
                        style={{
                            background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.3)', fontSize: '18px',
                            cursor: 'pointer', color: 'white', borderRadius: '50%', width: '36px', height: '36px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                        }}
                    >×</button>
                </div>

                <div className="modal-content">
                    <div className="form-group">
                        <label>Item Name *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Boomerang"
                            autoFocus
                        />
                    </div>

                    <div className="grid-responsive-2 gap-sm">
                        <div className="form-group">
                            <label>Type</label>
                            <select
                                value={form.type}
                                onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                                style={{ textTransform: 'capitalize' }}
                            >
                                {typeOptions.map(t => (
                                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                ))}
                            </select>
                            {EQUIPPABLE_ITEM_TYPES.includes(form.type) && (
                                <div style={{ fontSize: '10px', color: '#4caf50', marginTop: '2px' }}>✓ Equippable in the Trainer tab</div>
                            )}
                        </div>
                        <div className="form-group">
                            <label>Quantity</label>
                            <input
                                type="number"
                                min="1"
                                value={form.quantity}
                                onChange={(e) => setForm(prev => ({ ...prev, quantity: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Price (₽, optional)</label>
                        <input
                            type="number"
                            min="0"
                            value={form.price}
                            onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))}
                            placeholder="0"
                        />
                    </div>

                    <div className="form-group">
                        <label>Effect (optional)</label>
                        <input
                            type="text"
                            value={form.effect}
                            onChange={(e) => setForm(prev => ({ ...prev, effect: e.target.value }))}
                            placeholder="e.g., Heals 20 HP when used"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button className="btn btn-secondary" onClick={handleClose}>Cancel</button>
                        <button className="btn btn-primary" disabled={!form.name.trim()} onClick={handleCreate}>
                            Create Item
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomItemModal;
