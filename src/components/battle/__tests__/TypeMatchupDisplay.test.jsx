// ============================================================
// TypeMatchupDisplay Tests
// ============================================================
// Pure props-driven component backed by the real typeChart.js data.

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TypeMatchupDisplay from '../TypeMatchupDisplay.jsx';

describe('TypeMatchupDisplay', () => {
    it('renders nothing without a selected Pokemon or with no types', () => {
        const { container: c1 } = render(<TypeMatchupDisplay selectedPokemon={null} />);
        expect(c1).toBeEmptyDOMElement();

        const { container: c2 } = render(<TypeMatchupDisplay selectedPokemon={{ types: [] }} />);
        expect(c2).toBeEmptyDOMElement();
    });

    it('buckets a dual-type (Grass/Poison) matchup into weak/resist/super-resist rows', () => {
        render(<TypeMatchupDisplay selectedPokemon={{ types: ['Grass', 'Poison'] }} />);
        // +1 die (weak, 2x): Fire, Ice, Flying, Psychic
        const weakRow = screen.getByText('+1 die').closest('div');
        ['Fire', 'Ice', 'Flying', 'Psychic'].forEach(t => expect(weakRow).toHaveTextContent(t));

        // -1 die (resist, 0.5x): Water, Electric, Fighting, Fairy
        const resistRow = screen.getByText('−1 die').closest('div');
        ['Water', 'Electric', 'Fighting', 'Fairy'].forEach(t => expect(resistRow).toHaveTextContent(t));

        // -2 dice (super-resist, 0.25x): Grass (both Grass's own resist to itself, stacked with Poison's)
        const superResistRow = screen.getByText('−2 dice').closest('div');
        expect(superResistRow).toHaveTextContent('Grass');
    });

    it('shows the Immune row for a single immune-granting type (Ghost: immune to Normal/Fighting)', () => {
        render(<TypeMatchupDisplay selectedPokemon={{ types: ['Ghost'] }} />);
        const immuneRow = screen.getByText('Immune').closest('div');
        expect(immuneRow).toHaveTextContent('Normal');
        expect(immuneRow).toHaveTextContent('Fighting');
    });

    it('omits a row entirely when its bucket is empty', () => {
        render(<TypeMatchupDisplay selectedPokemon={{ types: ['Ghost'] }} />);
        // Ghost alone has no superWeak (4x) entries
        expect(screen.queryByText('+2 dice')).not.toBeInTheDocument();
    });

    it('labels the Mega Evolution branch when megaEvolved + currentMegaForm supply different types', () => {
        render(
            <TypeMatchupDisplay
                selectedPokemon={{ types: ['Normal'] }}
                megaEvolved={true}
                currentMegaForm={{ types: ['Psychic'] }}
            />
        );
        expect(screen.getByText('(Mega)')).toBeInTheDocument();
        // Psychic's own weaknesses should now be shown instead of Normal's
        const weakRow = screen.getByText('+1 die').closest('div');
        expect(weakRow).toHaveTextContent('Bug');
    });

    it('labels the Tera branch when activeTypes is explicitly supplied and differs from the base types', () => {
        render(
            <TypeMatchupDisplay
                selectedPokemon={{ types: ['Normal'] }}
                activeTypes={['Fire']}
            />
        );
        expect(screen.getByText('(Tera)')).toBeInTheDocument();
    });
});
