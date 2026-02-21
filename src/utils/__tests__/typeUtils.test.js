import { describe, it, expect } from 'vitest';
import { getTypeColor, getStatColor, TYPE_COLORS } from '../typeUtils.js';

describe('getTypeColor', () => {
    it('returns correct color for Fire', () => {
        expect(getTypeColor('Fire')).toBe('#F08030');
    });

    it('returns correct color for Water', () => {
        expect(getTypeColor('Water')).toBe('#6890F0');
    });

    it('is case-insensitive', () => {
        expect(getTypeColor('fire')).toBe('#F08030');
        expect(getTypeColor('WATER')).toBe('#6890F0');
    });

    it('returns fallback for unknown type', () => {
        expect(getTypeColor('UnknownType')).toBe('#999');
    });

    it('returns fallback for null', () => {
        expect(getTypeColor(null)).toBe('#999');
    });
});

describe('getStatColor', () => {
    it('returns correct color for hp', () => {
        expect(getStatColor('hp')).toBe('#4caf50');
    });

    it('returns correct color for atk', () => {
        expect(getStatColor('atk')).toBe('#f44336');
    });

    it('returns correct color for uppercase HP', () => {
        expect(getStatColor('HP')).toBe('#4caf50');
    });
});

describe('TYPE_COLORS', () => {
    const expectedTypes = [
        'normal', 'fire', 'water', 'electric', 'grass', 'ice',
        'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
        'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
    ];

    it('contains all 18 standard types', () => {
        expect(Object.keys(TYPE_COLORS)).toHaveLength(18);
    });

    it.each(expectedTypes)('has entry for %s', (type) => {
        expect(TYPE_COLORS).toHaveProperty(type);
    });
});
