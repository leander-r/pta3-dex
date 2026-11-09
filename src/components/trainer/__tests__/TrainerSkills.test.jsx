// ============================================================
// TrainerSkills Component Tests
// ============================================================

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import TrainerSkills from '../TrainerSkills.jsx';
import { useTrainerContext, useGameData, useModal, useUI } from '../../../contexts/index.js';

vi.mock('../../../contexts/index.js', () => ({
    useTrainerContext: vi.fn(),
    useGameData: vi.fn(),
    useModal: vi.fn(),
    useUI: vi.fn(),
}));

const GAME_DATA = {
    skills: {
        'Athletics':     { stat: 'ATK', type: 'check',   description: 'Running, jumping, climbing.' },
        'Concentration': { stat: 'DEF', type: 'passive', description: 'Maintaining focus; invoked by GM.' },
    },
    trainerClasses: {},
};

let setTrainer;

function setup(trainerOverrides = {}) {
    const trainer = {
        stats: { atk: 10, def: 10, satk: 3, sdef: 3, spd: 3 },
        skills: {},
        classes: [],
        ...trainerOverrides,
    };
    setTrainer = vi.fn();
    useTrainerContext.mockReturnValue({ trainer, setTrainer });
    useGameData.mockReturnValue({ GAME_DATA });
    useModal.mockReturnValue({ showDetail: vi.fn() });
    useUI.mockReturnValue({ showHelp: vi.fn() });

    render(<TrainerSkills />);
    fireEvent.click(screen.getByRole('button', { name: /expand skills/i }));
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('talent cycling', () => {
    it('cycles a skill from 0 -> 1 talent on click', () => {
        setup();
        fireEvent.click(screen.getByText('Athletics'));
        expect(setTrainer).toHaveBeenCalled();
        const updater = setTrainer.mock.calls[0][0];
        const result = updater({ skills: {} });
        expect(result.skills).toEqual({ Athletics: 1 });
    });

    it('cycles 1 -> 2 talents', () => {
        setup({ skills: { Athletics: 1 } });
        fireEvent.click(screen.getByText('Athletics'));
        const updater = setTrainer.mock.calls[0][0];
        const result = updater({ skills: { Athletics: 1 } });
        expect(result.skills).toEqual({ Athletics: 2 });
    });

    it('cycles 2 -> 0 (removes the skill entry)', () => {
        setup({ skills: { Athletics: 2 } });
        fireEvent.click(screen.getByText('Athletics'));
        const updater = setTrainer.mock.calls[0][0];
        const result = updater({ skills: { Athletics: 2 } });
        expect(result.skills).toEqual({});
    });
});

describe('talent bonus display', () => {
    it('shows +2 bonus badge for 1 talent', () => {
        setup({ skills: { Athletics: 1 }, stats: { atk: 10, def: 10, satk: 3, sdef: 3, spd: 3 } });
        // mod = floor(10/2) = 5, + talent bonus 2 = 7
        const tile = screen.getByText('Athletics').closest('.detail-tile-filled');
        expect(within(tile).getByText('+7')).toBeInTheDocument();
    });

    it('shows +5 bonus badge for 2 talents', () => {
        setup({ skills: { Athletics: 2 } });
        // mod 5 + talent bonus 5 = 10
        const tile = screen.getByText('Athletics').closest('.detail-tile-filled');
        expect(within(tile).getByText('+10')).toBeInTheDocument();
    });
});

describe('passive skills', () => {
    it('marks a passive skill with "(Passive)"', () => {
        setup();
        const tile = screen.getByText('Concentration').closest('.detail-tile');
        expect(within(tile).getByText('(Passive)')).toBeInTheDocument();
    });
});

describe('collapsed summary', () => {
    it('shows "No trained skills yet" when nothing is trained', () => {
        setup();
        fireEvent.click(screen.getByRole('button', { name: /collapse skills/i }));
        expect(screen.getByText('No trained skills yet')).toBeInTheDocument();
    });

    it('lists trained skills as chips when collapsed', () => {
        setup({ skills: { Athletics: 2 } });
        fireEvent.click(screen.getByRole('button', { name: /collapse skills/i }));
        expect(screen.getByText('Athletics')).toBeInTheDocument();
    });
});
