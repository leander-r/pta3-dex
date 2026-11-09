// ============================================================
// MoveLearnModal Component Tests
// ============================================================

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MoveLearnModal from '../MoveLearnModal.jsx';
import { useModal, useGameData, usePokemonContext } from '../../../contexts/index.js';

vi.mock('../../../contexts/index.js', () => ({
    useModal: vi.fn(),
    useGameData: vi.fn(),
    usePokemonContext: vi.fn(),
}));

const GAME_DATA = {
    moves: {
        'Tackle': { type: 'Normal', category: 'Physical', damage: '2d6', frequency: 'At-Will' },
        'Growl':  { type: 'Normal', category: 'Effect',   damage: null,  frequency: 'At-Will' },
    },
};

let setShowMoveLearnModal, setMoveLearnData, learnMove, showDetail;

function setup(moveLearnData) {
    setShowMoveLearnModal = vi.fn();
    setMoveLearnData = vi.fn();
    learnMove = vi.fn();
    showDetail = vi.fn();

    useModal.mockReturnValue({
        showDetail,
        showMoveLearnModal: !!moveLearnData,
        setShowMoveLearnModal,
        moveLearnData,
        setMoveLearnData,
    });
    useGameData.mockReturnValue({ GAME_DATA });
    usePokemonContext.mockReturnValue({ learnMove });

    return render(<MoveLearnModal />);
}

beforeEach(() => {
    vi.clearAllMocks();
});

const baseMoveLearnData = {
    pokemonId: 1,
    pokemonName: 'Bulbasaur',
    newMove: { move: 'Tackle', type: 'Normal', level: 10 },
    currentMoves: [
        { name: 'Growl', learnedAtLevel: 1 },
        { name: 'Tail Whip' },
    ],
    inParty: true,
};

describe('MoveLearnModal', () => {
    it('renders nothing when closed', () => {
        const { container } = setup(null);
        expect(container).toBeEmptyDOMElement();
    });

    it('shows the new move name and the full current-moves list (at the 6-move cap)', () => {
        setup(baseMoveLearnData);
        expect(screen.getByText(/Bulbasaur wants to learn/)).toBeInTheDocument();
        expect(screen.getByText('Tackle')).toBeInTheDocument();
        expect(screen.getByText('Growl')).toBeInTheDocument();
        expect(screen.getByText('Tail Whip')).toBeInTheDocument();
        expect(screen.getByText(/already knows 6 moves/)).toBeInTheDocument();
    });

    it('forgetting a move calls learnMove with that slot as the replace index, then closes', () => {
        setup(baseMoveLearnData);
        const growlRow = screen.getByText('Growl').closest('.move-learn-item');
        fireEvent.click(growlRow.querySelector('.move-learn-forget-btn'));

        expect(learnMove).toHaveBeenCalledWith(1, baseMoveLearnData.newMove, 0, true);
        expect(setShowMoveLearnModal).toHaveBeenCalledWith(false);
        expect(setMoveLearnData).toHaveBeenCalledWith(null);
    });

    it('"Don\'t Learn Move" closes the modal without calling learnMove', () => {
        setup(baseMoveLearnData);
        fireEvent.click(screen.getByText("Don't Learn Move"));
        expect(learnMove).not.toHaveBeenCalled();
        expect(setShowMoveLearnModal).toHaveBeenCalledWith(false);
    });

    it('falls back to the move\'s own inline data when it is not in GAME_DATA.moves (custom move)', () => {
        setup({
            ...baseMoveLearnData,
            newMove: { move: 'Homebrew Slam', type: 'Fighting', category: 'Physical', damage: '3d8', level: 5 },
        });
        expect(screen.getByText('Homebrew Slam')).toBeInTheDocument();
        expect(screen.getByText('Fighting')).toBeInTheDocument();
    });
});
