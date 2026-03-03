import { describe, it, expect } from 'vitest';
import { importSinglePokemon } from '../exportUtils.js';

const validPokemonData = {
    type: 'pta-pokemon',
    pokemon: {
        name: 'Pikachu',
        species: 'Pikachu',
        level: 25,
        types: ['Electric'],
        nature: 'Jolly',
        ability: 'Static',
        abilities: ['Static'],
        moves: [],
        baseStats: { hp: 35, atk: 5, def: 4, satk: 5, sdef: 5, spd: 7 },
        currentDamage: 0,
        gender: 'male',
        avatar: '',
    },
    exportedAt: new Date().toISOString(),
    version: '1.0',
};

describe('importSinglePokemon', () => {
    it('returns a sanitized pokemon object with a new ID for valid data', () => {
        const result = importSinglePokemon(validPokemonData);
        expect(result).not.toBeNull();
        expect(result.name).toBe('Pikachu');
        expect(result.id).toBeDefined();
    });

    it('assigns a new ID that is a number', () => {
        const result = importSinglePokemon(validPokemonData);
        expect(typeof result.id).toBe('number');
    });

    it('strips HTML tags from the name', () => {
        const data = {
            ...validPokemonData,
            pokemon: { ...validPokemonData.pokemon, name: '<b>Pikachu</b>' },
        };
        const result = importSinglePokemon(data);
        expect(result.name).toBe('Pikachu');
        expect(result.name).not.toContain('<b>');
    });

    it('clamps base stats above MAX_STAT (50) to 50', () => {
        const data = {
            ...validPokemonData,
            pokemon: {
                ...validPokemonData.pokemon,
                baseStats: { hp: 999, atk: 999, def: 999, satk: 999, sdef: 999, spd: 999 },
            },
        };
        const result = importSinglePokemon(data);
        expect(result.baseStats.hp).toBe(50);
        expect(result.baseStats.atk).toBe(50);
    });

    it('returns null for missing required type field', () => {
        const data = { pokemon: validPokemonData.pokemon };
        const result = importSinglePokemon(data);
        expect(result).toBeNull();
    });

    it('returns null when type is wrong', () => {
        const data = { ...validPokemonData, type: 'wrong-type' };
        const result = importSinglePokemon(data);
        expect(result).toBeNull();
    });

    it('returns null when pokemon field is missing', () => {
        const data = { type: 'pta-pokemon' };
        const result = importSinglePokemon(data);
        expect(result).toBeNull();
    });
});
