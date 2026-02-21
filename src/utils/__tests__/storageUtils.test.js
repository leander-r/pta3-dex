import { describe, it, expect, beforeEach } from 'vitest';
import { safeLocalStorageGet, safeLocalStorageSet } from '../storageUtils.js';

beforeEach(() => {
    localStorage.clear();
});

describe('safeLocalStorageGet', () => {
    it('returns fallback for a missing key', () => {
        expect(safeLocalStorageGet('nonexistent_key', 'default')).toBe('default');
    });

    it('returns null fallback when no fallback provided and key is missing', () => {
        expect(safeLocalStorageGet('nonexistent_key')).toBeNull();
    });

    it('returns parsed value for an existing key', () => {
        localStorage.setItem('test_key', JSON.stringify({ foo: 'bar' }));
        expect(safeLocalStorageGet('test_key', null)).toEqual({ foo: 'bar' });
    });

    it('returns fallback for corrupt JSON without throwing', () => {
        localStorage.setItem('corrupt_key', '{not valid json}');
        expect(() => safeLocalStorageGet('corrupt_key', 'fallback')).not.toThrow();
        expect(safeLocalStorageGet('corrupt_key', 'fallback')).toBe('fallback');
    });
});

describe('safeLocalStorageSet', () => {
    it('stores a value retrievable by safeLocalStorageGet', () => {
        safeLocalStorageSet('save_key', { level: 5 });
        expect(safeLocalStorageGet('save_key', null)).toEqual({ level: 5 });
    });

    it('returns true on success', () => {
        expect(safeLocalStorageSet('ok_key', 42)).toBe(true);
    });

    it('stores and retrieves a string value', () => {
        safeLocalStorageSet('str_key', 'hello');
        expect(safeLocalStorageGet('str_key', null)).toBe('hello');
    });
});
