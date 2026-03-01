// ============================================================
// useDiceRoller Hook Tests
// ============================================================

import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDiceRoller } from '../useDiceRoller.js';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('useDiceRoller', () => {
    // ── rollCustom ───────────────────────────────────────────
    describe('rollCustom', () => {
        it('returns correct shape for valid dice notation', () => {
            const { result } = renderHook(() => useDiceRoller());

            let roll;
            act(() => {
                roll = result.current.rollCustom('2d6+5');
            });

            expect(roll).toMatchObject({
                type: 'custom',
                dice: '2d6+5',
                rolls: expect.any(Array),
                rollTotal: expect.any(Number),
                bonus: 5,
                total: expect.any(Number),
            });
            expect(roll.rolls).toHaveLength(2);
        });

        it('total equals rollTotal + bonus', () => {
            vi.spyOn(Math, 'random').mockReturnValue(0.5); // deterministic rolls
            const { result } = renderHook(() => useDiceRoller());

            let roll;
            act(() => {
                roll = result.current.rollCustom('1d6+3');
            });

            expect(roll.total).toBe(roll.rollTotal + roll.bonus);
        });

        it('returns null for empty string', () => {
            const { result } = renderHook(() => useDiceRoller());

            let roll;
            act(() => {
                roll = result.current.rollCustom('');
            });

            expect(roll).toBeNull();
        });

        it('returns null for invalid notation', () => {
            const { result } = renderHook(() => useDiceRoller());

            let roll;
            act(() => {
                roll = result.current.rollCustom('hello');
            });

            expect(roll).toBeNull();
        });
    });

    // ── rollAccuracy ─────────────────────────────────────────
    describe('rollAccuracy', () => {
        it('returns type "accuracy" with total in range 1–20', () => {
            const { result } = renderHook(() => useDiceRoller());
            const pokemon = { name: 'Pikachu' };

            let roll;
            act(() => {
                roll = result.current.rollAccuracy(pokemon);
            });

            expect(roll.type).toBe('accuracy');
            expect(roll.total).toBeGreaterThanOrEqual(1);
            expect(roll.total).toBeLessThanOrEqual(20);
        });

        it('sets isCrit true when Math.random yields a 20', () => {
            // Math.floor(0.9999... * 20) + 1  →  Math.floor(19.999) + 1  →  19 + 1  =  20
            vi.spyOn(Math, 'random').mockReturnValue(0.9999);
            const { result } = renderHook(() => useDiceRoller());

            let roll;
            act(() => {
                roll = result.current.rollAccuracy({ name: 'Pikachu' });
            });

            expect(roll.isCrit).toBe(true);
            expect(roll.total).toBe(20);
        });

        it('sets isCrit false for non-20 rolls', () => {
            vi.spyOn(Math, 'random').mockReturnValue(0); // yields 1
            const { result } = renderHook(() => useDiceRoller());

            let roll;
            act(() => {
                roll = result.current.rollAccuracy({ name: 'Pikachu' });
            });

            expect(roll.isCrit).toBe(false);
        });
    });

    // ── rollPokemonSkill ─────────────────────────────────────
    describe('rollPokemonSkill', () => {
        it('returns correct shape with rolls.length === skillValue', () => {
            const { result } = renderHook(() => useDiceRoller());
            const pokemon = { name: 'Bulbasaur' };

            let roll;
            act(() => {
                roll = result.current.rollPokemonSkill(pokemon, 'Overland', 4);
            });

            expect(roll).toMatchObject({
                type: 'pokemonSkill',
                pokemon: 'Bulbasaur',
                skill: 'Overland',
                dice: '4d6',
                rolls: expect.any(Array),
                total: expect.any(Number),
            });
            expect(roll.rolls).toHaveLength(4);
        });

        it('returns null for missing pokemon argument', () => {
            const { result } = renderHook(() => useDiceRoller());

            let roll;
            act(() => {
                roll = result.current.rollPokemonSkill(null, 'Overland', 4);
            });

            expect(roll).toBeNull();
        });
    });

    // ── setCombatStage / resetCombatStages ───────────────────
    describe('setCombatStage / resetCombatStages', () => {
        it('updates a specific combat stage', () => {
            const { result } = renderHook(() => useDiceRoller());

            act(() => {
                result.current.setCombatStage('atk', 3);
            });

            expect(result.current.state.combatStages.atk).toBe(3);
        });

        it('leaves other stages unchanged', () => {
            const { result } = renderHook(() => useDiceRoller());

            act(() => {
                result.current.setCombatStage('atk', 2);
            });

            expect(result.current.state.combatStages.def).toBe(0);
        });

        it('resetCombatStages zeros all stages', () => {
            const { result } = renderHook(() => useDiceRoller());

            act(() => {
                result.current.setCombatStage('atk',  3);
                result.current.setCombatStage('def', -2);
                result.current.setCombatStage('spd',  1);
                result.current.resetCombatStages();
            });

            const stages = result.current.state.combatStages;
            expect(Object.values(stages).every(v => v === 0)).toBe(true);
        });
    });

    // ── roll history ─────────────────────────────────────────
    describe('roll history', () => {
        it('appends each roll to rollHistory', () => {
            const { result } = renderHook(() => useDiceRoller());

            act(() => {
                result.current.rollCustom('1d6');
                result.current.rollCustom('2d6');
            });

            expect(result.current.state.rollHistory).toHaveLength(2);
        });

        it('clearHistory empties rollHistory', () => {
            const { result } = renderHook(() => useDiceRoller());

            act(() => {
                result.current.rollCustom('1d6');
                result.current.rollCustom('1d6');
                result.current.clearHistory();
            });

            expect(result.current.state.rollHistory).toHaveLength(0);
        });

        it('caps rollHistory at 50 entries', () => {
            const { result } = renderHook(() => useDiceRoller());

            act(() => {
                for (let i = 0; i < 55; i++) {
                    result.current.rollCustom('1d6');
                }
            });

            expect(result.current.state.rollHistory).toHaveLength(50);
        });

        it('most recent roll is first in history', () => {
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            const { result } = renderHook(() => useDiceRoller());

            let roll1, roll2;
            act(() => {
                roll1 = result.current.rollCustom('1d6');
                roll2 = result.current.rollCustom('2d6');
            });

            // History is newest-first
            expect(result.current.state.rollHistory[0]).toMatchObject({ dice: '2d6' });
            expect(result.current.state.rollHistory[1]).toMatchObject({ dice: '1d6' });
        });
    });
});
