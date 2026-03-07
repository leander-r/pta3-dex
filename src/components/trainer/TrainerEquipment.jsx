// ============================================================
// Trainer Equipment Component
// ============================================================
// Shows equipped items grouped by type with equip/unequip and
// daily bonus tracking.

import React, { useState, useMemo } from 'react';
import { useTrainerContext } from '../../contexts/index.js';
import { useGameData } from '../../contexts/GameDataContext.jsx';

const TYPE_COLORS = {
    armor:     '#546e7a',
    weapon:    '#b71c1c',
    clothing:  '#795548',
    accessory: '#6a1b9a',
};

const EQUIPPABLE_TYPES = ['armor', 'weapon', 'clothing', 'accessory'];

const TypeBadge = ({ type }) => (
    <span style={{
        display: 'inline-block',
        padding: '1px 7px',
        borderRadius: '8px',
        background: TYPE_COLORS[type] || '#555',
        color: 'white',
        fontSize: '10px',
        fontWeight: 'bold',
        textTransform: 'capitalize',
        marginRight: '6px',
        flexShrink: 0,
    }}>
        {type}
    </span>
);

const ARMOR_CHIP = {
    'Chainmail':        'DEF +1',
    'Full Plate Armor': 'DEF +2',
    'Heavy Full Plate': 'DEF +3',
    'Nimble Spandex':   'SDEF +1',
};

/**
 * TrainerEquipment — collapsible panel showing trainer-equipped items.
 */
const TrainerEquipment = () => {
    const { trainer, equipItem, unequipItem, markBonusUsed, resetDailyBonus } = useTrainerContext();
    const { GAME_DATA } = useGameData();
    const [collapsed, setCollapsed] = useState(false);
    const [quickEquipValue, setQuickEquipValue] = useState('');

    const equippedItems = trainer.equippedItems || [];
    const dailyBonusUsed = trainer.dailyBonusUsed || '';

    // All available inventory items that are equippable and not yet equipped
    const allItems = GAME_DATA?.items || {};
    const equippableNotEquipped = useMemo(() =>
        Object.entries(allItems)
            .filter(([name, data]) => EQUIPPABLE_TYPES.includes(data?.type) && !equippedItems.includes(name))
            .map(([name]) => name)
            .sort(),
        [allItems, equippedItems]
    );

    // Group equipped items by type
    const grouped = useMemo(() => {
        const groups = { armor: [], weapon: [], clothing: [], accessory: [] };
        equippedItems.forEach(name => {
            const data = allItems[name];
            const t = data?.type;
            if (groups[t]) groups[t].push({ name, data });
        });
        return groups;
    }, [equippedItems, allItems]);

    const handleQuickEquip = () => {
        if (!quickEquipValue) return;
        equipItem(quickEquipValue);
        setQuickEquipValue('');
    };

    return (
        <div className="section-card-purple" style={{ marginBottom: '16px' }}>
            {/* Header */}
            <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: collapsed ? 0 : '12px' }}
                onClick={() => setCollapsed(c => !c)}
            >
                <h3 className="section-title-purple" style={{ margin: 0 }}>
                    <span>🛡️</span> Equipment
                    {equippedItems.length > 0 && (
                        <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: 'normal', opacity: 0.8 }}>
                            ({equippedItems.length} equipped)
                        </span>
                    )}
                </h3>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', userSelect: 'none' }}>
                    {collapsed ? '▶' : '▼'}
                </span>
            </div>

            {/* Collapsed chip view */}
            {collapsed && equippedItems.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {equippedItems.map(name => (
                        <span key={name} style={{ padding: '2px 8px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '11px' }}>
                            {name}
                        </span>
                    ))}
                </div>
            )}

            {/* Expanded view */}
            {!collapsed && (
                <>
                    {equippedItems.length === 0 ? (
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', textAlign: 'center', margin: '8px 0' }}>
                            No items equipped — equip from the Inventory tab or use the selector below.
                        </p>
                    ) : (
                        <>
                            {/* Daily bonus reset */}
                            {dailyBonusUsed && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', padding: '6px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)' }}>
                                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)' }}>
                                        Daily bonus used: <strong>{dailyBonusUsed}</strong>
                                    </span>
                                    <button
                                        onClick={resetDailyBonus}
                                        style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                                    >
                                        Reset
                                    </button>
                                </div>
                            )}

                            {/* Groups */}
                            {['armor', 'weapon', 'clothing', 'accessory'].map(groupType => {
                                const items = grouped[groupType];
                                if (!items.length) return null;
                                return (
                                    <div key={groupType} style={{ marginBottom: '10px' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                                            {groupType === 'clothing' ? 'Clothing & Accessories' : groupType.charAt(0).toUpperCase() + groupType.slice(1)}
                                        </div>
                                        {items.map(({ name, data }) => {
                                            const armorChip = groupType === 'armor' ? ARMOR_CHIP[name] : null;
                                            const isSkillItem = groupType === 'clothing' || groupType === 'accessory';
                                            const bonusUsed = dailyBonusUsed === name;
                                            const canMarkBonus = isSkillItem && !bonusUsed && !dailyBonusUsed;
                                            return (
                                                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', marginBottom: '4px', flexWrap: 'wrap' }}>
                                                    <TypeBadge type={groupType} />
                                                    <span style={{ flex: 1, fontSize: '13px', color: 'white', fontWeight: 'bold', minWidth: '100px' }} title={data?.effect || ''}>
                                                        {name}
                                                    </span>
                                                    {armorChip && (
                                                        <span style={{ padding: '2px 7px', borderRadius: '8px', background: '#546e7a', color: 'white', fontSize: '10px', fontWeight: 'bold' }}>
                                                            {armorChip}
                                                        </span>
                                                    )}
                                                    {isSkillItem && bonusUsed && (
                                                        <span style={{ padding: '2px 7px', borderRadius: '8px', background: '#2e7d32', color: 'white', fontSize: '10px', fontWeight: 'bold' }}>
                                                            ✓ Used
                                                        </span>
                                                    )}
                                                    {canMarkBonus && (
                                                        <button
                                                            onClick={() => markBonusUsed(name)}
                                                            style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                                                        >
                                                            Mark used
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => unequipItem(name)}
                                                        title={`Unequip ${name}`}
                                                        style={{ padding: '2px 6px', background: 'rgba(255,100,100,0.3)', color: 'white', border: '1px solid rgba(255,100,100,0.4)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', lineHeight: 1 }}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </>
                    )}

                    {/* Quick-equip from item catalog */}
                    {equippableNotEquipped.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                            <select
                                value={quickEquipValue}
                                onChange={(e) => setQuickEquipValue(e.target.value)}
                                style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '13px' }}
                            >
                                <option value="">Equip an item…</option>
                                {equippableNotEquipped.map(name => {
                                    const t = allItems[name]?.type || '';
                                    return (
                                        <option key={name} value={name} style={{ color: '#000', background: '#fff' }}>
                                            [{t.charAt(0).toUpperCase() + t.slice(1)}] {name}
                                        </option>
                                    );
                                })}
                            </select>
                            <button
                                onClick={handleQuickEquip}
                                disabled={!quickEquipValue}
                                style={{ padding: '6px 12px', background: quickEquipValue ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', cursor: quickEquipValue ? 'pointer' : 'default', fontSize: '13px' }}
                            >
                                Equip ↑
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default TrainerEquipment;
