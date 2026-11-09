// ============================================================
// Inventory Utilities Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import { addItemToInventory } from '../inventoryUtils.js';

describe('addItemToInventory', () => {
    it('adds a brand-new item with default fields', () => {
        const result = addItemToInventory([], 'Potion');
        expect(result).toEqual([
            { name: 'Potion', quantity: 1, type: 'misc', effect: '', price: 0 },
        ]);
    });

    it('carries over itemData fields (type/effect/price) for a new item', () => {
        const result = addItemToInventory([], 'Super Potion', { type: 'healing', effect: 'Heals 2d6', price: 700 }, 3);
        expect(result[0]).toEqual({ name: 'Super Potion', quantity: 3, type: 'healing', effect: 'Heals 2d6', price: 700 });
    });

    it('merges into an existing stack by case-insensitive name match', () => {
        const inventory = [{ name: 'Potion', quantity: 2, type: 'healing', effect: '', price: 300 }];
        const result = addItemToInventory(inventory, 'potion', {}, 1);
        expect(result).toHaveLength(1);
        expect(result[0].quantity).toBe(3);
        // Existing entry's fields are preserved, not overwritten by the (empty) itemData
        expect(result[0].type).toBe('healing');
    });

    it('does not mutate the original inventory array', () => {
        const inventory = [{ name: 'Potion', quantity: 1 }];
        const result = addItemToInventory(inventory, 'Potion', {}, 1);
        expect(inventory[0].quantity).toBe(1);
        expect(result).not.toBe(inventory);
    });

    it('defaults quantity to 1 when omitted', () => {
        const result = addItemToInventory([], 'Antidote');
        expect(result[0].quantity).toBe(1);
    });

    it('clamps non-positive or non-numeric quantities up to 1', () => {
        expect(addItemToInventory([], 'Potion', {}, 0)[0].quantity).toBe(1);
        expect(addItemToInventory([], 'Potion', {}, -5)[0].quantity).toBe(1);
        expect(addItemToInventory([], 'Potion', {}, NaN)[0].quantity).toBe(1);
        expect(addItemToInventory([], 'Potion', {}, 'abc')[0].quantity).toBe(1);
    });

    it('adds a second distinct item alongside an existing one', () => {
        const inventory = [{ name: 'Potion', quantity: 1 }];
        const result = addItemToInventory(inventory, 'Antidote', {}, 1);
        expect(result).toHaveLength(2);
        expect(result.map(i => i.name)).toEqual(['Potion', 'Antidote']);
    });
});
