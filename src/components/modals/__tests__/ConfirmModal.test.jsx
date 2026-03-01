// ============================================================
// ConfirmModal Component Tests
// ============================================================

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ConfirmModal from '../ConfirmModal.jsx';
import ModalContext from '../../../contexts/ModalContext.jsx';

afterEach(cleanup);

/**
 * Render ConfirmModal wrapped in a minimal ModalContext.
 * Only the fields used by ConfirmModal are required.
 */
const BASE = {
    show: true,
    title: 'Test Title',
    message: 'Test message',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    danger: false,
    inputConfig: null,
    onConfirm: null,
    onCancel: null,
};

const renderModal = (confirmModal, setConfirmModal = vi.fn()) =>
    render(
        <ModalContext.Provider value={{ confirmModal, setConfirmModal }}>
            <ConfirmModal />
        </ModalContext.Provider>
    );

// ── Visibility ───────────────────────────────────────────────
describe('ConfirmModal', () => {
    it('renders nothing when show is false', () => {
        const { container } = renderModal({ ...BASE, show: false });
        expect(container.firstChild).toBeNull();
    });

    it('renders title and message when show is true', () => {
        renderModal({ ...BASE, title: 'Delete Item', message: 'Are you sure?' });
        expect(screen.getByText('Delete Item')).toBeVisible();
        expect(screen.getByText('Are you sure?')).toBeVisible();
    });

    // ── Cancel button ─────────────────────────────────────────
    it('calls setConfirmModal with show:false and onCancel when Cancel is clicked', () => {
        const onCancel = vi.fn();
        const setConfirmModal = vi.fn();

        renderModal({ ...BASE, onCancel }, setConfirmModal);

        fireEvent.click(screen.getByText('Cancel'));

        expect(setConfirmModal).toHaveBeenCalledWith(
            expect.objectContaining({ show: false })
        );
        expect(onCancel).toHaveBeenCalled();
    });

    // ── Confirm button ────────────────────────────────────────
    it('calls onConfirm and resets modal when Confirm is clicked', () => {
        const onConfirm = vi.fn();
        const setConfirmModal = vi.fn();

        renderModal({ ...BASE, onConfirm }, setConfirmModal);

        fireEvent.click(screen.getByText('Confirm'));

        expect(onConfirm).toHaveBeenCalled();
        expect(setConfirmModal).toHaveBeenCalledWith(
            expect.objectContaining({ show: false })
        );
    });

    // ── Danger mode ───────────────────────────────────────────
    it('applies red background to the header in danger mode', () => {
        renderModal({ ...BASE, danger: true });

        const header = document.querySelector('.modal-header');
        expect(header).not.toBeNull();
        expect(header.style.background).toContain('#e74c3c');
    });

    it('applies purple gradient in non-danger mode', () => {
        renderModal({ ...BASE, danger: false });

        const header = document.querySelector('.modal-header');
        expect(header.style.background).toContain('#667eea');
    });

    // ── inputConfig ───────────────────────────────────────────
    it('disables Confirm when inputConfig is present and input is empty', () => {
        renderModal({
            ...BASE,
            inputConfig: { placeholder: 'Enter name...' },
        });

        expect(screen.getByText('Confirm')).toBeDisabled();
    });

    it('enables Confirm and fires onConfirm when input is filled', () => {
        const onConfirm = vi.fn();
        const setConfirmModal = vi.fn();

        renderModal(
            { ...BASE, inputConfig: { placeholder: 'Enter name...' }, onConfirm },
            setConfirmModal
        );

        const input = screen.getByPlaceholderText('Enter name...');
        fireEvent.change(input, { target: { value: 'Boulder Badge' } });

        const confirmBtn = screen.getByText('Confirm');
        expect(confirmBtn).not.toBeDisabled();

        fireEvent.click(confirmBtn);
        expect(onConfirm).toHaveBeenCalledWith('Boulder Badge');
    });

    it('Enter key in the input triggers confirm', () => {
        const onConfirm = vi.fn();

        renderModal({
            ...BASE,
            inputConfig: { placeholder: 'Badge name...' },
            onConfirm,
        });

        const input = screen.getByPlaceholderText('Badge name...');
        fireEvent.change(input, { target: { value: 'Cascade Badge' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(onConfirm).toHaveBeenCalledWith('Cascade Badge');
    });

    // ── Escape key ────────────────────────────────────────────
    it('pressing Escape calls setConfirmModal with show:false', () => {
        const setConfirmModal = vi.fn();

        renderModal({ ...BASE }, setConfirmModal);

        // useModalKeyboard attaches keydown listener to document when show=true
        fireEvent.keyDown(document, { key: 'Escape' });

        expect(setConfirmModal).toHaveBeenCalledWith(
            expect.objectContaining({ show: false })
        );
    });
});
