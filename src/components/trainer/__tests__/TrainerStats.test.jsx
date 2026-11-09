// ============================================================
// TrainerStats Component Tests
// ============================================================
// All contexts consumed via '../../../contexts/index.js' are mocked with
// static vi.fn() return values — this is a leaf UI component, not the
// context logic itself (that's covered in contexts/__tests__/TrainerContext.test.jsx).

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import TrainerStats from '../TrainerStats.jsx';
import { useTrainerContext, useUI, usePokemonContext } from '../../../contexts/index.js';

vi.mock('../../../contexts/index.js', () => ({
    useTrainerContext: vi.fn(),
    useUI: vi.fn(),
    usePokemonContext: vi.fn(),
}));

function makeTrainer(overrides = {}) {
    return {
        level: 0,
        stats: { atk: 3, def: 3, satk: 3, sdef: 3, spd: 3 },
        hpRolls: [],
        currentDamage: 0,
        statPoints: 10,
        levelStatPoints: 0,
        levelStatAllocations: [],
        equippedItems: [],
        ...overrides,
    };
}

let trainer;
let updateTrainerStat;
let rollMilestoneHP;
let setTrainer;

function setup(overrides = {}) {
    trainer = makeTrainer(overrides);
    updateTrainerStat = vi.fn();
    rollMilestoneHP = vi.fn();
    setTrainer = vi.fn();

    useTrainerContext.mockReturnValue({
        trainer,
        updateTrainerStat,
        calculateModifier: (statValue) => Math.floor((statValue || 0) / 2),
        calculateMaxHP: () => 20 + (trainer.hpRolls || []).reduce((s, v) => s + v, 0),
        undoStatAllocation: vi.fn(),
        canUndoStat: false,
        rollMilestoneHP,
        restAndRecover: vi.fn(),
        setTrainer,
    });
    useUI.mockReturnValue({ showHelp: vi.fn() });
    usePokemonContext.mockReturnValue({ updatePokemon: vi.fn(), party: [], reserve: [] });

    const utils = render(<TrainerStats />);
    // Expand the collapsed panel by default
    fireEvent.click(screen.getByRole('button', { name: /expand stats/i }));
    return utils;
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('stat modifier display', () => {
    // Regression test: calculateModifier used to do an internal trainer.stats[key]
    // lookup, but every real caller here passes the raw stat VALUE — which made every
    // modifier badge always show +0 regardless of the actual stat. Pin the real formula.
    it('shows the correct floor(value / 2) modifier for a raised stat, not +0', () => {
        setup({ stats: { atk: 7, def: 3, satk: 3, sdef: 3, spd: 3 } });
        const atkTile = screen.getByText('ATK').closest('div');
        expect(within(atkTile.parentElement).getByText('+3')).toBeInTheDocument();
    });

    it('shows +0 for a genuinely minimum stat (1)', () => {
        setup({ stats: { atk: 1, def: 3, satk: 3, sdef: 3, spd: 3 } });
        const atkTile = screen.getByText('ATK').closest('div');
        expect(within(atkTile.parentElement).getByText('+0')).toBeInTheDocument();
    });
});

describe('HP panel', () => {
    it('shows current/max HP with no damage taken', () => {
        setup();
        expect(screen.getByText(/20 \/ 20/)).toBeInTheDocument();
    });

    it('reflects hpRolls in the max HP total', () => {
        setup({ hpRolls: [3, 1] });
        expect(screen.getByText(/24 \/ 24/)).toBeInTheDocument();
    });

    it('subtracts currentDamage from max HP for the current HP display', () => {
        setup({ currentDamage: 5 });
        expect(screen.getByText(/15 \/ 20/)).toBeInTheDocument();
    });

    it('shows the Roll HP Bonus button once a milestone level is reached and unrolled', () => {
        setup({ level: 3, hpRolls: [] });
        expect(screen.getByRole('button', { name: /roll hp bonus/i })).toBeInTheDocument();
    });

    it('hides the Roll HP Bonus button once the milestone roll is claimed', () => {
        setup({ level: 3, hpRolls: [2] });
        expect(screen.queryByRole('button', { name: /roll hp bonus/i })).not.toBeInTheDocument();
    });

    it('calls rollMilestoneHP when the roll button is clicked', () => {
        setup({ level: 3, hpRolls: [] });
        fireEvent.click(screen.getByRole('button', { name: /roll hp bonus/i }));
        expect(rollMilestoneHP).toHaveBeenCalled();
    });
});

describe('stat +/- buttons', () => {
    it('calls updateTrainerStat with value+1 when + is clicked', () => {
        setup();
        fireEvent.click(screen.getByRole('button', { name: 'Increase ATK' }));
        expect(updateTrainerStat).toHaveBeenCalledWith('atk', 4);
    });

    it('calls updateTrainerStat with value-1 when - is clicked', () => {
        setup();
        fireEvent.click(screen.getByRole('button', { name: 'Decrease ATK' }));
        expect(updateTrainerStat).toHaveBeenCalledWith('atk', 2);
    });

    it('disables the decrease button at the stat minimum (1)', () => {
        setup({ stats: { atk: 1, def: 3, satk: 3, sdef: 3, spd: 3 } });
        const btn = screen.getByRole('button', { name: 'Decrease ATK' });
        expect(btn).toHaveAttribute('aria-disabled', 'true');
        fireEvent.click(btn);
        expect(updateTrainerStat).not.toHaveBeenCalled();
    });

    it('disables the increase button once a stat already used its level point this milestone', () => {
        setup({
            stats: { atk: 6, def: 3, satk: 3, sdef: 3, spd: 3 },
            levelStatPoints: 1,
            levelStatAllocations: ['atk'],
        });
        const btn = screen.getByRole('button', { name: 'Increase ATK' });
        expect(btn).toHaveAttribute('aria-disabled', 'true');
        fireEvent.click(btn);
        expect(updateTrainerStat).not.toHaveBeenCalled();
    });
});

describe('collapsed summary', () => {
    it('shows HP and stat pills when collapsed', () => {
        setup();
        // Re-collapse
        fireEvent.click(screen.getByRole('button', { name: /collapse stats/i }));
        expect(screen.getByText(/HP 20\/20/)).toBeInTheDocument();
        expect(screen.getByText(/\bATK 3/)).toBeInTheDocument();
    });
});
