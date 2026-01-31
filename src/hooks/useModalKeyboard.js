// ============================================================
// Modal Keyboard Navigation Hook
// ============================================================
// Provides keyboard support for modals:
// - Escape to close
// - Tab/Shift+Tab focus trapping
// - Auto-focus first focusable element

import { useEffect, useRef, useCallback } from 'react';

const FOCUSABLE_SELECTORS = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])'
].join(', ');

/**
 * Hook for modal keyboard navigation
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Function to call when Escape is pressed
 * @param {object} options - Optional settings
 * @param {boolean} options.trapFocus - Whether to trap focus within modal (default: true)
 * @param {boolean} options.autoFocus - Whether to auto-focus first element (default: true)
 * @param {boolean} options.closeOnEscape - Whether Escape closes modal (default: true)
 * @returns {object} - { modalRef } to attach to the modal container
 */
const useModalKeyboard = (isOpen, onClose, options = {}) => {
    const {
        trapFocus = true,
        autoFocus = true,
        closeOnEscape = true
    } = options;

    const modalRef = useRef(null);
    const previousActiveElement = useRef(null);

    // Get all focusable elements within the modal
    const getFocusableElements = useCallback(() => {
        if (!modalRef.current) return [];
        return Array.from(modalRef.current.querySelectorAll(FOCUSABLE_SELECTORS));
    }, []);

    // Handle keydown events
    const handleKeyDown = useCallback((event) => {
        if (!isOpen) return;

        // Escape to close
        if (event.key === 'Escape' && closeOnEscape) {
            event.preventDefault();
            event.stopPropagation();
            onClose();
            return;
        }

        // Tab focus trapping
        if (event.key === 'Tab' && trapFocus) {
            const focusableElements = getFocusableElements();
            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (event.shiftKey) {
                // Shift+Tab: if on first element, go to last
                if (document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab: if on last element, go to first
                if (document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement.focus();
                }
            }
        }
    }, [isOpen, onClose, closeOnEscape, trapFocus, getFocusableElements]);

    // Set up event listeners and focus management
    useEffect(() => {
        if (isOpen) {
            // Store the previously focused element
            previousActiveElement.current = document.activeElement;

            // Add keydown listener
            document.addEventListener('keydown', handleKeyDown);

            // Auto-focus first focusable element
            if (autoFocus) {
                // Small delay to ensure modal is rendered
                const timer = setTimeout(() => {
                    const focusableElements = getFocusableElements();
                    if (focusableElements.length > 0) {
                        // Try to focus the close button or first input
                        const closeBtn = modalRef.current?.querySelector('button[aria-label="Close modal"]');
                        const firstInput = modalRef.current?.querySelector('input, select, textarea');
                        (firstInput || closeBtn || focusableElements[0])?.focus();
                    }
                }, 50);
                return () => {
                    clearTimeout(timer);
                    document.removeEventListener('keydown', handleKeyDown);
                };
            }

            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        } else {
            // Restore focus when modal closes
            if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
                previousActiveElement.current.focus();
            }
        }
    }, [isOpen, handleKeyDown, autoFocus, getFocusableElements]);

    return { modalRef };
};

export default useModalKeyboard;
