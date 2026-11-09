// ============================================================
// PokemonContext Tests
// ============================================================
// Covers PTA3 Pokemon CRUD, the 6-move cap, and evolution/devolution
// item handling. Sibling contexts (GameData/UI/Modal/Data) are replaced
// with minimal stateful stand-ins so PokemonContext's own logic — which
// leans on the real TrainerContext for party/reserve storage — can be
// exercised end-to-end without network calls or unrelated app state.

import React, { createContext, useContext, useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { TrainerProvider, useTrainerContext } from '../TrainerContext.jsx';
import { PokemonProvider, usePokemonContext } from '../PokemonContext.jsx';

// ── Minimal stand-ins for sibling contexts ───────────────────

const GameDataCtx = createContext(null);
vi.mock('../GameDataContext.jsx', () => ({
    useGameData: () => useContext(GameDataCtx),
}));

let confirmImpl = (opts) => opts.onConfirm && opts.onConfirm();
const UICtx = createContext(null);
vi.mock('../UIContext.jsx', () => ({
    useUI: () => useContext(UICtx),
}));
const ModalCtx = createContext(null);
vi.mock('../ModalContext.jsx', () => ({
    useModal: () => useContext(ModalCtx),
}));
const DataCtx = createContext(null);
vi.mock('../DataContext.jsx', () => ({
    useData: () => useContext(DataCtx),
}));

const showLevelUpNotification = vi.fn();

function GameDataStub({ pokedex = [], customSpecies = [], children }) {
    return <GameDataCtx.Provider value={{ pokedex, customSpecies }}>{children}</GameDataCtx.Provider>;
}

function UIStub({ children }) {
    const [pokemonView, setPokemonView] = useState('party');
    const [editingPokemon, setEditingPokemon] = useState(null);
    return (
        <UICtx.Provider value={{ showLevelUpNotification, pokemonView, setPokemonView, editingPokemon, setEditingPokemon }}>
            {children}
        </UICtx.Provider>
    );
}

function ModalStub({ children }) {
    const [showMoveLearnModal, setShowMoveLearnModal] = useState(false);
    const [moveLearnData, setMoveLearnData] = useState(null);
    const [pendingMoveLearn, setPendingMoveLearn] = useState([]);
    const showConfirm = (opts) => confirmImpl(opts);
    return (
        <ModalCtx.Provider value={{
            showConfirm, showMoveLearnModal, setShowMoveLearnModal,
            moveLearnData, setMoveLearnData, pendingMoveLearn, setPendingMoveLearn,
        }}>
            {children}
        </ModalCtx.Provider>
    );
}

function DataStub({ children }) {
    const [inventory, setInventory] = useState([]);
    return <DataCtx.Provider value={{ inventory, setInventory }}>{children}</DataCtx.Provider>;
}

const BULBASAUR = {
    id: 1, species: 'Bulbasaur', types: ['Grass', 'Poison'],
    baseStats: { hp: 30, atk: 5, def: 6, satk: 7, sdef: 7, spd: 5 },
    abilities: { basic: ['Overgrow'], adv: [], high: [] },
    skills: ['Sprouter', 'Threaded'],
    levelUpMoves: [{ name: 'Tackle' }, { name: 'Vine Whip' }],
};

function useCombined() {
    return { trainer: useTrainerContext(), pokemon: usePokemonContext() };
}

function makeWrapper({ pokedex = [BULBASAUR], customSpecies = [] } = {}) {
    return ({ children }) => (
        <GameDataStub pokedex={pokedex} customSpecies={customSpecies}>
            <UIStub>
                <ModalStub>
                    <TrainerProvider>
                        <DataStub>
                            <PokemonProvider>{children}</PokemonProvider>
                        </DataStub>
                    </TrainerProvider>
                </ModalStub>
            </UIStub>
        </GameDataStub>
    );
}

function renderCombined(opts) {
    return renderHook(() => useCombined(), { wrapper: makeWrapper(opts) });
}

beforeEach(() => {
    showLevelUpNotification.mockClear();
    confirmImpl = (opts) => opts.onConfirm && opts.onConfirm();
});

// ── addPokemon ────────────────────────────────────────────────

describe('addPokemon', () => {
    it('adds a blank Pokemon to the party by default', () => {
        const { result } = renderCombined();
        act(() => result.current.pokemon.addPokemon());
        expect(result.current.trainer.party).toHaveLength(1);
        expect(result.current.trainer.party[0].species).toBe('');
    });

    it('spills over into reserve once the party is full (6)', () => {
        const { result } = renderCombined();
        act(() => result.current.trainer.setParty(
            Array.from({ length: 6 }, (_, i) => ({ id: i, species: 'Rattata' }))
        ));
        act(() => result.current.pokemon.addPokemon());
        expect(result.current.trainer.party).toHaveLength(6);
        expect(result.current.trainer.reserve).toHaveLength(1);
    });
});

// ── applySpeciesToPokemon ────────────────────────────────────

describe('applySpeciesToPokemon', () => {
    it('copies stats, types, and ability directly from the Pokedex entry (no stat allocation)', () => {
        const { result } = renderCombined();
        act(() => result.current.pokemon.addPokemon());
        const id = result.current.trainer.party[0].id;
        act(() => result.current.pokemon.applySpeciesToPokemon(id, BULBASAUR, null));
        const poke = result.current.trainer.party[0];
        expect(poke.species).toBe('Bulbasaur');
        expect(poke.types).toEqual(['Grass', 'Poison']);
        expect(poke.baseStats).toEqual(BULBASAUR.baseStats);
        expect(poke.ability).toBe('Overgrow');
    });

    it('converts the new-format string-array skills into {name} chip objects', () => {
        const { result } = renderCombined();
        act(() => result.current.pokemon.addPokemon());
        const id = result.current.trainer.party[0].id;
        act(() => result.current.pokemon.applySpeciesToPokemon(id, BULBASAUR, null));
        expect(result.current.trainer.party[0].pokemonSkills).toEqual([
            { name: 'Sprouter' }, { name: 'Threaded' },
        ]);
    });

    it('grants starting level-up moves (capped at MAX_TOTAL_MOVES) for a fresh Pokemon', () => {
        const { result } = renderCombined();
        act(() => result.current.pokemon.addPokemon());
        const id = result.current.trainer.party[0].id;
        act(() => result.current.pokemon.applySpeciesToPokemon(id, BULBASAUR, null));
        const moveNames = result.current.trainer.party[0].moves.map(m => m.name);
        expect(moveNames).toEqual(['Tackle', 'Vine Whip']);
    });
});

// ── learnMove / 6-move cap ───────────────────────────────────

describe('learnMove', () => {
    function partyWithMoves(moves) {
        return [{ id: 1, species: 'Bulbasaur', moves }];
    }

    it('adds a known move from GAME_DATA with its real data filled in', () => {
        const { result } = renderCombined();
        act(() => result.current.trainer.setParty(partyWithMoves([])));
        act(() => result.current.pokemon.learnMove(1, { move: 'Tackle', level: 5 }, null, true));
        const move = result.current.trainer.party[0].moves[0];
        expect(move).toMatchObject({ name: 'Tackle', type: 'Normal', frequency: 'At-Will', source: 'natural' });
    });

    it('refuses to add a move the Pokemon already knows (case-insensitive)', () => {
        const { result } = renderCombined();
        act(() => result.current.trainer.setParty(partyWithMoves([{ name: 'tackle' }])));
        act(() => result.current.pokemon.learnMove(1, { move: 'Tackle', level: 5 }, null, true));
        expect(result.current.trainer.party[0].moves).toHaveLength(1);
    });

    it('replaces a move at replaceIndex and records it in moveHistory', () => {
        const { result } = renderCombined();
        act(() => result.current.trainer.setParty(partyWithMoves([{ name: 'Growl' }])));
        act(() => result.current.pokemon.learnMove(1, { move: 'Tackle', level: 5 }, 0, true));
        const poke = result.current.trainer.party[0];
        expect(poke.moves[0].name).toBe('Tackle');
        expect(poke.moveHistory[0]).toMatchObject({ name: 'Growl', replacedAtLevel: 5, slotIndex: 0 });
    });
});

// ── updatePokemon / restorePokemon ───────────────────────────

describe('updatePokemon', () => {
    it('merges updates into the matching party Pokemon', () => {
        const { result } = renderCombined();
        act(() => result.current.trainer.setParty([{ id: 1, species: 'Eevee', nickname: '' }]));
        act(() => result.current.pokemon.updatePokemon(1, { nickname: 'Eve' }));
        expect(result.current.trainer.party[0].nickname).toBe('Eve');
    });

    it('finds and updates a Pokemon living in reserve', () => {
        const { result } = renderCombined();
        act(() => result.current.trainer.setReserve([{ id: 2, species: 'Magikarp' }]));
        act(() => result.current.pokemon.updatePokemon(2, { nature: 'Hardy' }));
        expect(result.current.trainer.reserve[0].nature).toBe('Hardy');
    });
});

describe('restorePokemon', () => {
    it('replaces the Pokemon entirely with the given snapshot', () => {
        const { result } = renderCombined();
        act(() => result.current.trainer.setParty([{ id: 1, species: 'Eevee', level: 5 }]));
        const snapshot = { id: 1, species: 'Eevee', level: 1 };
        act(() => result.current.pokemon.restorePokemon(1, snapshot));
        expect(result.current.trainer.party[0]).toEqual(snapshot);
    });
});

// ── deletePokemon (with undo) ─────────────────────────────────

describe('deletePokemon', () => {
    it('removes the Pokemon once the confirmation is accepted', () => {
        const { result } = renderCombined();
        act(() => result.current.trainer.setParty([{ id: 1, species: 'Eevee' }]));
        act(() => result.current.pokemon.deletePokemon(1));
        expect(result.current.trainer.party).toEqual([]);
    });

    it('leaves the Pokemon untouched if the confirmation is declined', () => {
        confirmImpl = () => {}; // simulate cancel
        const { result } = renderCombined();
        act(() => result.current.trainer.setParty([{ id: 1, species: 'Eevee' }]));
        act(() => result.current.pokemon.deletePokemon(1));
        expect(result.current.trainer.party).toHaveLength(1);
    });
});

// ── Evolution / Devolution ────────────────────────────────────

const IVYSAUR = {
    id: 2, species: 'Ivysaur', types: ['Grass', 'Poison'],
    baseStats: { hp: 45, atk: 7, def: 8, satk: 9, sdef: 9, spd: 6 },
    abilities: { basic: ['Overgrow'], adv: [], high: [] },
    skills: ['Sprouter'],
    levelUpMoves: [],
};

describe('evolvePokemon', () => {
    it('evolves and updates species/stats from the target Pokedex entry', () => {
        const { result } = renderCombined({ pokedex: [BULBASAUR, IVYSAUR] });
        act(() => result.current.trainer.setParty([{ id: 1, species: 'Bulbasaur', baseStats: BULBASAUR.baseStats }]));
        act(() => result.current.pokemon.evolvePokemon(1, 'Ivysaur', null, null));
        const poke = result.current.trainer.party[0];
        expect(poke.species).toBe('Ivysaur');
        expect(poke.baseStats).toEqual(IVYSAUR.baseStats);
        expect(poke.evolvedFrom).toBe('Bulbasaur');
    });

    it('refuses a stone evolution when the required item is missing from inventory', () => {
        const { result } = renderCombined({ pokedex: [BULBASAUR, IVYSAUR] });
        act(() => result.current.trainer.setParty([{ id: 1, species: 'Bulbasaur' }]));
        act(() => result.current.pokemon.evolvePokemon(1, 'Ivysaur', null, 'Leaf Stone'));
        // No inventory item was supplied -> evolution should not proceed
        expect(result.current.trainer.party[0].species).toBe('Bulbasaur');
    });
});

describe('getEvolutionOptions', () => {
    it('returns no evolution options for a species with no evolution data', () => {
        const { result } = renderCombined();
        const options = result.current.pokemon.getEvolutionOptions({ species: 'Unknown Species' });
        expect(options).toEqual({ canEvolve: [], canDevolve: null });
    });
});

// ── Inventory helpers ──────────────────────────────────────────

describe('inventory helpers', () => {
    it('hasItemInInventory treats an empty/unknown item as "not required" (true)', () => {
        const { result } = renderCombined();
        expect(result.current.pokemon.hasItemInInventory('')).toBe(true);
    });
});
