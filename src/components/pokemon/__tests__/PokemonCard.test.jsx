// ============================================================
// PokemonCard Component Tests (focused subset)
// ============================================================
// PokemonCard is ~2500 lines covering many editor panels; this file does not
// attempt exhaustive coverage. It focuses on: collapsed-tile rendering,
// expand-to-edit, the Stats/Moves tab readouts, and a regression test for
// a real bug found while writing these tests (see below).

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import PokemonCard from '../PokemonCard.jsx';
import { useGameData, useModal, usePokemonContext, useUI } from '../../../contexts/index.js';
import { MAX_TOTAL_MOVES } from '../../../data/constants.js';

vi.mock('../../../contexts/index.js', () => ({
    useGameData: vi.fn(),
    useModal: vi.fn(),
    usePokemonContext: vi.fn(),
    useUI: vi.fn(),
}));

const GAME_DATA = { natures: { Hardy: {} }, items: {}, moves: {} };

const BASE_POKEMON = {
    id: 1,
    name: 'Sparky',
    species: 'Pikachu',
    types: ['Electric'],
    nature: 'Hardy',
    ability: 'Static',
    baseStats: { hp: 35, atk: 55, def: 40, satk: 50, sdef: 50, spd: 90 },
    moves: [{ name: 'Thunderbolt' }, { name: 'Quick Attack' }],
    skills: [],
    currentDamage: 0,
};

let updatePokemon, restorePokemon, deletePokemon, setEditing, applySpeciesToPokemon;

function renderCard({ pokedex = [], ...props } = {}) {
    useGameData.mockReturnValue({
        pokedex, pokedexLoading: false, GAME_DATA,
        customSpecies: [], setCustomSpecies: vi.fn(), customMoves: [],
    });
    useModal.mockReturnValue({
        showDetail: vi.fn(), setShowCustomSpeciesModal: vi.fn(), setEditingCustomSpeciesId: vi.fn(),
        setShowMoveLearnModal: vi.fn(), setMoveLearnData: vi.fn(), showConfirm: vi.fn(), openCustomMoveModal: vi.fn(),
    });
    applySpeciesToPokemon = vi.fn();
    usePokemonContext.mockReturnValue({
        getEvolutionOptions: () => ({ canEvolve: [], canDevolve: null }),
        applySpeciesToPokemon,
    });
    useUI.mockReturnValue({ showHelp: vi.fn() });

    updatePokemon = vi.fn();
    restorePokemon = vi.fn();
    deletePokemon = vi.fn();
    setEditing = vi.fn();

    return render(
        <PokemonCard
            pokemon={BASE_POKEMON}
            isEditing={false}
            setEditing={setEditing}
            updatePokemon={updatePokemon}
            restorePokemon={restorePokemon}
            deletePokemon={deletePokemon}
            isInParty={true}
            canMoveToParty={true}
            canMoveUp={false}
            canMoveDown={false}
            {...props}
        />
    );
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('collapsed tile', () => {
    it('shows the Pokemon name and current/max HP', () => {
        renderCard();
        expect(screen.getByText('Sparky')).toBeInTheDocument();
        expect(screen.getByText('35/35')).toBeInTheDocument();
    });

    it('reflects currentDamage in the HP readout', () => {
        renderCard({ pokemon: { ...BASE_POKEMON, currentDamage: 10 } });
        expect(screen.getByText('25/35')).toBeInTheDocument();
    });

    it('clicking the tile opens edit mode', () => {
        const { container } = renderCard();
        fireEvent.click(container.querySelector('.pokemon-card-collapsed'));
        expect(setEditing).toHaveBeenCalledWith(true);
    });
});

describe('expanded / editing view', () => {
    function renderEditing(props = {}) {
        return renderCard({ isEditing: true, ...props });
    }

    it('renders the edit tabs and defaults to the info tab', () => {
        renderEditing();
        expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
        ['info', 'stats', 'moves', 'skills', 'evolution'].forEach(tab => {
            expect(screen.getByRole('button', { name: tab })).toBeInTheDocument();
        });
    });

    it('Done collapses the card', () => {
        renderEditing();
        fireEvent.click(screen.getByRole('button', { name: 'Done' }));
        expect(setEditing).toHaveBeenCalledWith(false);
    });

    it('Cancel restores the pre-edit snapshot and collapses the card', () => {
        renderEditing();
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(restorePokemon).toHaveBeenCalledWith(BASE_POKEMON);
        expect(setEditing).toHaveBeenCalledWith(false);
    });

    it('Stats tab shows the fixed species Max HP (no allocation UI)', () => {
        renderEditing();
        fireEvent.click(screen.getByRole('button', { name: 'stats' }));
        const maxHpTile = screen.getByText('Max HP').closest('.detail-tile');
        expect(within(maxHpTile).getByText('35')).toBeInTheDocument();
    });

    it('Moves tab shows the move count against the 6-move cap', () => {
        renderEditing();
        fireEvent.click(screen.getByRole('button', { name: 'moves' }));
        expect(screen.getByText(`Moves: 2/${MAX_TOTAL_MOVES} (single pool)`)).toBeInTheDocument();
    });

    // Regression test: the Info tab's inline species-search dropdown used to
    // reimplement species/ability/move application itself instead of delegating to
    // PokemonContext.applySpeciesToPokemon (the function RegionalFormModal uses) — and
    // had diverged: it never set pokemon.ability (the field actually rendered
    // elsewhere), only an unused pokemon.abilities/availableAbilities shape. Pin that
    // picking a species from this dropdown now goes through the one real code path.
    describe('species selection (Info tab)', () => {
        const IVYSAUR = {
            id: 2, species: 'Ivysaur', types: ['Grass', 'Poison'],
            baseStats: { hp: 45, atk: 7, def: 8, satk: 9, sdef: 9, spd: 6 },
            abilities: { basic: ['Overgrow'], adv: [], high: [] },
            skills: ['Sprouter'],
        };

        it('delegates to applySpeciesToPokemon when a species with no regional forms is picked', () => {
            renderEditing({ pokedex: [IVYSAUR] });
            fireEvent.focus(screen.getByPlaceholderText('Search species by name...'));
            fireEvent.click(screen.getByText('Ivysaur'));
            expect(applySpeciesToPokemon).toHaveBeenCalledWith(BASE_POKEMON.id, IVYSAUR, null);
        });

        it('auto-names a still-default-named Pokemon to the picked species', () => {
            renderEditing({ pokedex: [IVYSAUR], pokemon: { ...BASE_POKEMON, name: 'New Pokémon' } });
            fireEvent.focus(screen.getByPlaceholderText('Search species by name...'));
            fireEvent.click(screen.getByText('Ivysaur'));
            expect(updatePokemon).toHaveBeenCalledWith({ name: 'Ivysaur' });
        });

        it('does not rename a Pokemon that already has a custom name', () => {
            renderEditing({ pokedex: [IVYSAUR] }); // BASE_POKEMON.name = 'Sparky'
            fireEvent.focus(screen.getByPlaceholderText('Search species by name...'));
            fireEvent.click(screen.getByText('Ivysaur'));
            expect(updatePokemon).not.toHaveBeenCalledWith({ name: 'Ivysaur' });
        });
    });

    // Regression test: PokemonTab.jsx binds `updatePokemon` to this card as a
    // single-argument closure — (updates) => contextUpdatePokemon(pokemon.id, updates).
    // Several HP buttons used to call it as updatePokemon(pokemon.id, updates) (two
    // args), which silently dropped the real updates object (the closure's only
    // parameter absorbed `pokemon.id` instead) — every HP +/-/Full-heal button was a
    // silent no-op. Pin the fixed single-argument call shape.
    describe('Current HP controls (regression: must call updatePokemon with ONE argument)', () => {
        it('−1 HP increases currentDamage by 1', () => {
            renderEditing();
            fireEvent.click(screen.getByRole('button', { name: 'stats' }));
            fireEvent.click(screen.getByTitle('Take 1 damage'));
            expect(updatePokemon).toHaveBeenCalledWith({ currentDamage: 1 });
        });

        it('+1 HP (heal) decreases currentDamage by 1, floored at 0', () => {
            renderEditing({ pokemon: { ...BASE_POKEMON, currentDamage: 1 } });
            fireEvent.click(screen.getByRole('button', { name: 'stats' }));
            fireEvent.click(screen.getByTitle('Heal 1 HP'));
            expect(updatePokemon).toHaveBeenCalledWith({ currentDamage: 0 });
        });

        it('Full heal sets currentDamage to 0', () => {
            renderEditing({ pokemon: { ...BASE_POKEMON, currentDamage: 20 } });
            fireEvent.click(screen.getByRole('button', { name: 'stats' }));
            fireEvent.click(screen.getByTitle('Full heal'));
            expect(updatePokemon).toHaveBeenCalledWith({ currentDamage: 0 });
        });
    });
});
