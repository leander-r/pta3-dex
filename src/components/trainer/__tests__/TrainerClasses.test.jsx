// ============================================================
// TrainerClasses Component Tests
// ============================================================

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TrainerClasses from '../TrainerClasses.jsx';
import { useTrainerContext, useGameData, useModal, useUI } from '../../../contexts/index.js';
import toast from '../../../utils/toast.js';

vi.mock('../../../contexts/index.js', () => ({
    useTrainerContext: vi.fn(),
    useGameData: vi.fn(),
    useModal: vi.fn(),
    useUI: vi.fn(),
}));
vi.mock('../../../utils/toast.js', () => ({
    default: { warning: vi.fn(), success: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

const GAME_DATA = {
    trainerClasses: {
        'Ace Trainer': { type: 'base', skillPool: ['Athletics', 'Perception'] },
        'Breeder':     { type: 'base', skillPool: ['Athletics', 'Perform'] },
        'Stat Ace':    { type: 'advanced', skillPool: ['Athletics'] },
    },
    features: {
        'Capable':  { category: 'Ace Trainer', prerequisites: 'Level 1' },
        'Advance3': { category: 'Ace Trainer', prerequisites: 'Level 3' },
    },
    skills: { Athletics: {}, Perception: {}, Perform: {} },
};

let setTrainer, showConfirm;

function setup(trainerOverrides = {}) {
    const trainer = {
        level: 0,
        classes: [],
        classLevels: {},
        skills: {},
        features: [],
        ...trainerOverrides,
    };
    setTrainer = vi.fn();
    showConfirm = vi.fn((opts) => opts.onConfirm && opts.onConfirm());
    useTrainerContext.mockReturnValue({ trainer, setTrainer });
    useGameData.mockReturnValue({ GAME_DATA });
    useModal.mockReturnValue({ showConfirm });
    useUI.mockReturnValue({ showHelp: vi.fn() });

    render(<TrainerClasses />);
    fireEvent.click(screen.getByRole('button', { name: /expand classes/i }));
    return { trainer };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('class-slot gating by level', () => {
    it('allows only 1 class at level 0', () => {
        setup({ level: 0, classes: ['Ace Trainer'] });
        expect(screen.getByText(/Maximum 1 class reached/)).toBeInTheDocument();
    });

    it('allows 2 classes at level 3', () => {
        setup({ level: 3, classes: ['Ace Trainer'] });
        expect(screen.getByRole('combobox')).toBeInTheDocument();
        expect(screen.getByText('1 slot open')).toBeInTheDocument();
    });

    it('allows 4 classes at level 11', () => {
        setup({ level: 11, classes: ['Ace Trainer', 'Breeder', 'Stat Ace'] });
        expect(screen.getByText('1 slot open')).toBeInTheDocument();
    });
});

describe('first class must be a base class', () => {
    it('rejects an advanced class as the first pick', () => {
        setup({ level: 0, classes: [] });
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'Stat Ace' } });
        fireEvent.click(screen.getByRole('button', { name: 'Add Class' }));
        expect(toast.warning).toHaveBeenCalledWith('Your first class must be a Base class.');
        // No skill-selection flow should have opened
        expect(screen.queryByText(/Adding: Stat Ace/)).not.toBeInTheDocument();
    });

    it('accepts a base class as the first pick and opens skill selection', () => {
        setup({ level: 0, classes: [] });
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'Ace Trainer' } });
        fireEvent.click(screen.getByRole('button', { name: 'Add Class' }));
        expect(screen.getByText(/Adding: Ace Trainer/)).toBeInTheDocument();
    });
});

describe('skill selection before confirming a class', () => {
    it('keeps Confirm disabled until the required number of skills are picked', () => {
        setup({ level: 0, classes: [] });
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Ace Trainer' } });
        fireEvent.click(screen.getByRole('button', { name: 'Add Class' }));

        const confirmBtn = screen.getByRole('button', { name: /^Confirm/ });
        expect(confirmBtn).toBeDisabled();

        fireEvent.click(screen.getByRole('button', { name: 'Athletics' }));
        expect(confirmBtn).toBeDisabled(); // base class with no secondary needs 2 skills

        fireEvent.click(screen.getByRole('button', { name: 'Perception' }));
        expect(confirmBtn).toBeEnabled();
    });

    it('commits the class, its skills, and its Level 1 features on Confirm', () => {
        setup({ level: 0, classes: [] });
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Ace Trainer' } });
        fireEvent.click(screen.getByRole('button', { name: 'Add Class' }));
        fireEvent.click(screen.getByRole('button', { name: 'Athletics' }));
        fireEvent.click(screen.getByRole('button', { name: 'Perception' }));
        fireEvent.click(screen.getByRole('button', { name: /^Confirm/ }));

        expect(setTrainer).toHaveBeenCalled();
        const updater = setTrainer.mock.calls[0][0];
        const result = updater({ level: 0, classes: [], features: [], skills: {} });
        expect(result.classes).toEqual(['Ace Trainer']);
        expect(result.features).toEqual(['Capable']); // only the Level 1 feature, not Level 3
        expect(result.skills).toEqual({ Athletics: 1, Perception: 1 });
    });
});

describe('removing a class', () => {
    it('asks for confirmation, then strips its classes/features/skills', () => {
        setup({
            level: 0,
            classes: ['Ace Trainer'],
            features: ['Capable'],
            skills: { Athletics: 1 },
            classSkills: { 'Ace Trainer': ['Athletics'] },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Remove Ace Trainer' }));
        expect(showConfirm).toHaveBeenCalled();

        const updater = setTrainer.mock.calls[0][0];
        const result = updater({
            classes: ['Ace Trainer'], features: ['Capable'],
            skills: { Athletics: 1 }, classSkills: { 'Ace Trainer': ['Athletics'] },
            classLevels: { 'Ace Trainer': 0 },
        });
        expect(result.classes).toEqual([]);
        expect(result.features).toEqual([]);
        expect(result.skills).toEqual({});
    });

    // Regression: doRemoveClass used to never clear primaryBaseClass. Since the only
    // place that assigns it only fires when it's falsy, a stale value left pointing at
    // a class the trainer no longer has would permanently block any class from ever
    // reaching the Level 15 capstone again.
    it('promotes the oldest remaining secondary base class to primary when the primary is removed', () => {
        setup({
            level: 7,
            classes: ['Ace Trainer', 'Breeder'],
            primaryBaseClass: 'Ace Trainer',
            secondaryBaseClasses: ['Breeder'],
        });
        fireEvent.click(screen.getByRole('button', { name: 'Remove Ace Trainer' }));

        const updater = setTrainer.mock.calls[0][0];
        const result = updater({
            classes: ['Ace Trainer', 'Breeder'], features: [], skills: {},
            classSkills: {}, classLevels: {},
            primaryBaseClass: 'Ace Trainer', secondaryBaseClasses: ['Breeder'],
        });
        expect(result.primaryBaseClass).toBe('Breeder');
        expect(result.secondaryBaseClasses).toEqual([]);
    });

    it('clears primaryBaseClass when the primary is removed and no secondary base class remains', () => {
        setup({
            level: 0,
            classes: ['Ace Trainer'],
            primaryBaseClass: 'Ace Trainer',
            secondaryBaseClasses: [],
        });
        fireEvent.click(screen.getByRole('button', { name: 'Remove Ace Trainer' }));

        const updater = setTrainer.mock.calls[0][0];
        const result = updater({
            classes: ['Ace Trainer'], features: [], skills: {},
            classSkills: {}, classLevels: {},
            primaryBaseClass: 'Ace Trainer', secondaryBaseClasses: [],
        });
        expect(result.primaryBaseClass).toBe('');
    });

    it('leaves primaryBaseClass untouched when removing a different (non-primary) class', () => {
        setup({
            level: 7,
            classes: ['Ace Trainer', 'Stat Ace'],
            primaryBaseClass: 'Ace Trainer',
            secondaryBaseClasses: [],
        });
        fireEvent.click(screen.getByRole('button', { name: 'Remove Stat Ace' }));

        const updater = setTrainer.mock.calls[0][0];
        const result = updater({
            classes: ['Ace Trainer', 'Stat Ace'], features: [], skills: {},
            classSkills: {}, classLevels: {},
            primaryBaseClass: 'Ace Trainer', secondaryBaseClasses: [],
        });
        expect(result.primaryBaseClass).toBe('Ace Trainer');
    });
});
