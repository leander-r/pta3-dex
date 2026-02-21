import { describe, it, expect } from 'vitest';
import {
    calcModifier,
    formatNumber,
    parseDice,
    calculatePokemonLevel,
    getExpToNextLevel,
    applyCombatStage,
    applyNature,
    calculatePokemonHP,
    calculateSTAB,
} from '../dataUtils.js';

describe('calcModifier', () => {
    it('returns 0 for stat 10', () => {
        expect(calcModifier(10)).toBe(0);
    });

    it('returns 2 for stat 14', () => {
        expect(calcModifier(14)).toBe(2);
    });

    it('returns -1 for stat 8', () => {
        expect(calcModifier(8)).toBe(-1);
    });

    it('returns -5 for stat 1', () => {
        expect(calcModifier(1)).toBe(-5);
    });
});

describe('formatNumber', () => {
    it('formats 1234567 with commas', () => {
        expect(formatNumber(1234567)).toBe('1,234,567');
    });

    it('returns 0 for falsy values', () => {
        expect(formatNumber(0)).toBe('0');
    });
});

describe('parseDice', () => {
    it('parses 2d6+5', () => {
        expect(parseDice('2d6+5')).toEqual({ count: 2, sides: 6, bonus: 5 });
    });

    it('parses 1d20 with no bonus', () => {
        expect(parseDice('1d20')).toEqual({ count: 1, sides: 20, bonus: 0 });
    });

    it('returns zeros for empty input', () => {
        expect(parseDice('')).toEqual({ count: 0, sides: 0, bonus: 0 });
    });

    it('returns zeros for null input', () => {
        expect(parseDice(null)).toEqual({ count: 0, sides: 0, bonus: 0 });
    });
});

describe('calculatePokemonLevel', () => {
    it('returns level 1 for 0 exp', () => {
        expect(calculatePokemonLevel(0)).toBe(1);
    });

    it('returns level 10 for 1000 exp', () => {
        expect(calculatePokemonLevel(1000)).toBe(10);
    });

    it('returns level 100 for max exp', () => {
        expect(calculatePokemonLevel(2000000)).toBe(100);
    });
});

describe('getExpToNextLevel', () => {
    it('returns 0 when already at max level with max exp', () => {
        expect(getExpToNextLevel(2000000, 100)).toBe(0);
    });

    it('returns positive number at level 1 with 0 exp', () => {
        expect(getExpToNextLevel(0, 1)).toBeGreaterThan(0);
    });
});

describe('applyCombatStage', () => {
    it('returns base stat unchanged at stage 0', () => {
        expect(applyCombatStage(100, 0)).toBe(100);
    });

    it('applies +25% per positive stage at +2', () => {
        expect(applyCombatStage(100, 2)).toBe(150);
    });

    it('applies -10% per negative stage at -2', () => {
        expect(applyCombatStage(100, -2)).toBe(80);
    });
});

describe('applyNature', () => {
    const baseStats = { hp: 10, atk: 10, def: 10, satk: 10, sdef: 10, spd: 10 };

    it('Adamant boosts ATK and lowers SATK', () => {
        const result = applyNature(baseStats, 'Adamant');
        expect(result.atk).toBe(12);
        expect(result.satk).toBe(8);
    });

    it('Hardy (neutral) returns stats unchanged', () => {
        const result = applyNature(baseStats, 'Hardy');
        expect(result).toEqual(baseStats);
    });
});

describe('calculatePokemonHP', () => {
    it('calculates HP as level + (hp_stat × 3)', () => {
        const pokemon = {
            level: 10,
            baseStats: { hp: 10, atk: 10, def: 10, satk: 10, sdef: 10, spd: 10 },
            addedStats: { hp: 0, atk: 0, def: 0, satk: 0, sdef: 0, spd: 0 },
            nature: 'Hardy',
        };
        expect(calculatePokemonHP(pokemon)).toBe(40);
    });

    it('returns 0 for null input', () => {
        expect(calculatePokemonHP(null)).toBe(0);
    });
});

describe('calculateSTAB', () => {
    it('returns 0 at level 1', () => {
        expect(calculateSTAB(1)).toBe(0);
    });

    it('returns 10 at level 50', () => {
        expect(calculateSTAB(50)).toBe(10);
    });

    it('returns 20 at level 100', () => {
        expect(calculateSTAB(100)).toBe(20);
    });
});
