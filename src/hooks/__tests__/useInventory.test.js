// ============================================================
// useInventory Hook Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInventory } from '../useInventory.js';

describe('useInventory', () => {
    // ── addItem ─────────────────────────────────────────────
    describe('addItem', () => {
        it('adds a new item to an empty inventory', () => {
            const { result } = renderHook(() => useInventory());

            act(() => {
                result.current.addItem({ name: 'Potion', category: 'healing' }, 2);
            });

            expect(result.current.inventory).toHaveLength(1);
            expect(result.current.inventory[0]).toMatchObject({ name: 'Potion', quantity: 2 });
        });

        it('increments quantity when adding a duplicate item (case-insensitive)', () => {
            const { result } = renderHook(() =>
                useInventory([{ name: 'Potion', quantity: 3 }])
            );

            act(() => {
                result.current.addItem({ name: 'potion' }, 2);
            });

            expect(result.current.inventory).toHaveLength(1);
            expect(result.current.inventory[0].quantity).toBe(5);
        });

        it('handles string shorthand (adds with quantity 1)', () => {
            const { result } = renderHook(() => useInventory());

            act(() => {
                result.current.addItem('Antidote');
            });

            expect(result.current.inventory[0]).toMatchObject({ name: 'Antidote', quantity: 1 });
        });
    });

    // ── removeItem ───────────────────────────────────────────
    describe('removeItem', () => {
        it('reduces quantity by 1 by default', () => {
            const { result } = renderHook(() =>
                useInventory([{ name: 'Potion', quantity: 3 }])
            );

            act(() => {
                result.current.removeItem('Potion');
            });

            expect(result.current.inventory[0].quantity).toBe(2);
        });

        it('removes item when quantity hits 0', () => {
            const { result } = renderHook(() =>
                useInventory([{ name: 'Potion', quantity: 1 }])
            );

            act(() => {
                result.current.removeItem('Potion');
            });

            expect(result.current.inventory).toHaveLength(0);
        });

        it('ignores unknown item name (no change)', () => {
            const { result } = renderHook(() =>
                useInventory([{ name: 'Potion', quantity: 2 }])
            );

            act(() => {
                result.current.removeItem('SuperPotion');
            });

            expect(result.current.inventory).toHaveLength(1);
            expect(result.current.inventory[0].quantity).toBe(2);
        });
    });

    // ── deleteItem ───────────────────────────────────────────
    describe('deleteItem', () => {
        it('removes item completely regardless of quantity', () => {
            const { result } = renderHook(() =>
                useInventory([{ name: 'Potion', quantity: 99 }])
            );

            act(() => {
                result.current.deleteItem('Potion');
            });

            expect(result.current.inventory).toHaveLength(0);
        });
    });

    // ── hasItem / getItemQuantity ────────────────────────────
    describe('hasItem / getItemQuantity', () => {
        it('hasItem returns true when item exists', () => {
            const { result } = renderHook(() =>
                useInventory([{ name: 'Potion', quantity: 1 }])
            );

            expect(result.current.hasItem('Potion')).toBe(true);
        });

        it('hasItem returns false when item does not exist', () => {
            const { result } = renderHook(() => useInventory());

            expect(result.current.hasItem('Potion')).toBe(false);
        });

        it('getItemQuantity returns the correct count', () => {
            const { result } = renderHook(() =>
                useInventory([{ name: 'Potion', quantity: 7 }])
            );

            expect(result.current.getItemQuantity('Potion')).toBe(7);
        });

        it('getItemQuantity returns 0 for an unknown item', () => {
            const { result } = renderHook(() => useInventory());

            expect(result.current.getItemQuantity('Potion')).toBe(0);
        });
    });

    // ── setItemQuantity ──────────────────────────────────────
    describe('setItemQuantity', () => {
        it('sets quantity directly to the given value', () => {
            const { result } = renderHook(() =>
                useInventory([{ name: 'Potion', quantity: 3 }])
            );

            act(() => {
                result.current.setItemQuantity('Potion', 10);
            });

            expect(result.current.inventory[0].quantity).toBe(10);
        });

        it('removes item when quantity is set to 0', () => {
            const { result } = renderHook(() =>
                useInventory([{ name: 'Potion', quantity: 3 }])
            );

            act(() => {
                result.current.setItemQuantity('Potion', 0);
            });

            expect(result.current.inventory).toHaveLength(0);
        });
    });

    // ── filteredInventory ────────────────────────────────────
    describe('filteredInventory', () => {
        const initial = [
            { name: 'Potion',     category: 'healing', quantity: 1 },
            { name: 'Pokeball',   category: 'ball',    quantity: 5 },
            { name: 'Rare Candy', category: 'misc',    quantity: 2 },
        ];

        it('filters by category', () => {
            const { result } = renderHook(() => useInventory(initial));

            act(() => {
                result.current.setFilter('ball');
            });

            expect(result.current.filteredInventory).toHaveLength(1);
            expect(result.current.filteredInventory[0].name).toBe('Pokeball');
        });

        it('filters by search query (case-insensitive)', () => {
            const { result } = renderHook(() => useInventory(initial));

            act(() => {
                result.current.setSearchQuery('candy');
            });

            expect(result.current.filteredInventory).toHaveLength(1);
            expect(result.current.filteredInventory[0].name).toBe('Rare Candy');
        });

        it('applies both category and search filters together', () => {
            const { result } = renderHook(() => useInventory(initial));

            act(() => {
                result.current.setFilter('healing');
                result.current.setSearchQuery('Potion');
            });

            expect(result.current.filteredInventory).toHaveLength(1);
            expect(result.current.filteredInventory[0].name).toBe('Potion');
        });
    });

    // ── totalItemCount / uniqueItemCount ─────────────────────
    describe('totalItemCount / uniqueItemCount', () => {
        it('totalItemCount sums all item quantities', () => {
            const { result } = renderHook(() =>
                useInventory([
                    { name: 'Potion',   quantity: 3 },
                    { name: 'Antidote', quantity: 7 },
                ])
            );

            expect(result.current.totalItemCount).toBe(10);
        });

        it('uniqueItemCount equals the number of distinct items', () => {
            const { result } = renderHook(() =>
                useInventory([
                    { name: 'Potion',   quantity: 3 },
                    { name: 'Antidote', quantity: 7 },
                ])
            );

            expect(result.current.uniqueItemCount).toBe(2);
        });
    });

    // ── clearInventory ───────────────────────────────────────
    describe('clearInventory', () => {
        it('empties the entire inventory', () => {
            const { result } = renderHook(() =>
                useInventory([
                    { name: 'Potion',   quantity: 3 },
                    { name: 'Antidote', quantity: 7 },
                ])
            );

            act(() => {
                result.current.clearInventory();
            });

            expect(result.current.inventory).toHaveLength(0);
        });
    });

    // ── bulkAddItems ─────────────────────────────────────────
    describe('bulkAddItems', () => {
        it('adds all items from a mixed array', () => {
            const { result } = renderHook(() => useInventory());

            act(() => {
                result.current.bulkAddItems([
                    { name: 'Potion',   quantity: 2 },
                    { name: 'Antidote', quantity: 3 },
                    'Pokeball',   // string shorthand → quantity 1
                ]);
            });

            expect(result.current.inventory).toHaveLength(3);
            expect(result.current.getItemQuantity('Potion')).toBe(2);
            expect(result.current.getItemQuantity('Antidote')).toBe(3);
            expect(result.current.getItemQuantity('Pokeball')).toBe(1);
        });
    });
});
