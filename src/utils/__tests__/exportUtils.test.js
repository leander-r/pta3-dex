import { describe, it, expect } from 'vitest';
import { importSinglePokemon } from '../exportUtils.js';

const validPokemonData = {
    type: 'pta-pokemon',
    pokemon: {
        name: 'Pikachu',
        species: 'Pikachu',
        level: 25,
        experience: 4750,
        types: ['Electric'],
        nature: 'Jolly',
        ability: 'Static',
        abilities: ['Static'],
        moves: [],
        baseStats: { hp: 10, atk: 10, def: 8, satk: 8, sdef: 8, spd: 12 },
        addedStats: { hp: 0, atk: 0, def: 0, satk: 0, sdef: 0, spd: 0 },
        statPointsAvailable: 0,
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

    it('clamps level above 100 to 100', () => {
        const data = {
            ...validPokemonData,
            pokemon: { ...validPokemonData.pokemon, level: 999 },
        };
        const result = importSinglePokemon(data);
        expect(result.level).toBe(100);
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
