// ============================================================
// CustomFeatureModal Component Tests
// ============================================================

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomFeatureModal from '../CustomFeatureModal.jsx';
import { useModal, useTrainerContext } from '../../../contexts/index.js';

vi.mock('../../../contexts/index.js', () => ({
    useModal: vi.fn(),
    useTrainerContext: vi.fn(),
}));

const BLANK = { name: '', category: 'Custom', prerequisites: '', frequency: '', trigger: '', target: '', effect: '' };

let setShowCustomFeatureModal, setCustomFeature, setTrainer;

function setup(customFeature) {
    setShowCustomFeatureModal = vi.fn();
    setCustomFeature = vi.fn();
    setTrainer = vi.fn();

    useModal.mockReturnValue({
        showCustomFeatureModal: true,
        setShowCustomFeatureModal,
        customFeature,
        setCustomFeature,
    });
    useTrainerContext.mockReturnValue({ setTrainer });

    return render(<CustomFeatureModal />);
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('CustomFeatureModal', () => {
    it('renders nothing when closed', () => {
        useModal.mockReturnValue({ showCustomFeatureModal: false, customFeature: BLANK, setCustomFeature: vi.fn(), setShowCustomFeatureModal: vi.fn() });
        useTrainerContext.mockReturnValue({ setTrainer: vi.fn() });
        const { container } = render(<CustomFeatureModal />);
        expect(container).toBeEmptyDOMElement();
    });

    // Regression: closing or adding used to leave the shared `customFeature` context
    // state populated with the just-used values, so the next time this modal opened
    // it silently pre-filled the previous feature's name/effect/etc.
    it('resets the shared customFeature state when closed via the × button', () => {
        setup({ ...BLANK, name: 'Old Feature', effect: 'Old effect text' });
        fireEvent.click(screen.getByRole('button', { name: 'Close modal' }));
        expect(setCustomFeature).toHaveBeenCalledWith(BLANK);
        expect(setShowCustomFeatureModal).toHaveBeenCalledWith(false);
    });

    it('resets the shared customFeature state when closed via Cancel', () => {
        setup({ ...BLANK, name: 'Old Feature', effect: 'Old effect text' });
        fireEvent.click(screen.getByText('Cancel'));
        expect(setCustomFeature).toHaveBeenCalledWith(BLANK);
    });

    it('resets the shared customFeature state after successfully adding a feature', () => {
        setup({ ...BLANK, name: 'Type Specialist', effect: 'Does a thing' });
        fireEvent.click(screen.getByText('Add Feature'));

        expect(setTrainer).toHaveBeenCalled();
        expect(setShowCustomFeatureModal).toHaveBeenCalledWith(false);
        expect(setCustomFeature).toHaveBeenCalledWith(BLANK);
    });

    it('does not reset or add when required fields (name/effect) are missing', () => {
        setup({ ...BLANK, name: '', effect: '' });
        expect(screen.getByText('Add Feature')).toBeDisabled();
    });
});
