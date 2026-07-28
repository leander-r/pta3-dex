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

    it('clamps non-HP stats to MAX_STAT (30) but leaves realistic species HP untouched', () => {
        // PTA3 species HP is a fixed Pokédex value (e.g. Snorlax 96) that routinely
        // exceeds the 1-23ish range of ATK/DEF/SATK/SDEF/SPD, so HP needs its own ceiling.
        const data = {
            ...validPokemonData,
            pokemon: {
                ...validPokemonData.pokemon,
                baseStats: { hp: 96, atk: 999, def: 999, satk: 999, sdef: 999, spd: 999 },
            },
        };
        const result = importSinglePokemon(data);
        expect(result.baseStats.hp).toBe(96);
        expect(result.baseStats.atk).toBe(30);
    });

    it('clamps extreme HP to MAX_HP_STAT (5000)', () => {
        const data = {
            ...validPokemonData,
            pokemon: { ...validPokemonData.pokemon, baseStats: { hp: 999999, atk: 5, def: 5, satk: 5, sdef: 5, spd: 5 } },
        };
        const result = importSinglePokemon(data);
        expect(result.baseStats.hp).toBe(5000);
    });

    it('preserves isShiny, teraType, and a valid specialForm on import', () => {
        const data = {
            ...validPokemonData,
            pokemon: { ...validPokemonData.pokemon, isShiny: true, teraType: 'Water', specialForm: 'alpha', specialFormDefStat: 'sdef' },
        };
        const result = importSinglePokemon(data);
        expect(result.isShiny).toBe(true);
        expect(result.teraType).toBe('Water');
        expect(result.specialForm).toBe('alpha');
        expect(result.specialFormDefStat).toBe('sdef');
    });

    it('rejects an unknown specialForm value', () => {
        const data = {
            ...validPokemonData,
            pokemon: { ...validPokemonData.pokemon, specialForm: 'not-a-real-form' },
        };
        const result = importSinglePokemon(data);
        expect(result.specialForm).toBeNull();
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
