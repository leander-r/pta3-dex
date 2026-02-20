// ============================================================
// Confirm Modal Component
// ============================================================
// Reusable confirm/prompt dialog replacing window.confirm() and window.prompt()

import React, { useState, useEffect } from 'react';
import useModalKeyboard from '../../hooks/useModalKeyboard.js';
import { useUI } from '../../contexts/index.js';

const DEFAULT_STATE = {
    show: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    danger: false,
    inputConfig: null,
    onConfirm: null,
    onCancel: null
};

const ConfirmModal = () => {
    const { confirmModal, setConfirmModal } = useUI();
    const [inputValue, setInputValue] = useState('');

    // Reset input when modal opens
    useEffect(() => {
        if (confirmModal.show) {
            setInputValue(confirmModal.inputConfig?.defaultValue || '');
        }
    }, [confirmModal.show, confirmModal.inputConfig]);

    const handleClose = () => {
        const { onCancel } = confirmModal;
        setConfirmModal({ ...DEFAULT_STATE });
        if (onCancel) onCancel();
    };

    const handleConfirm = () => {
        const { onConfirm, inputConfig } = confirmModal;
        const value = inputConfig ? inputValue : undefined;
        setConfirmModal({ ...DEFAULT_STATE });
        if (onConfirm) onConfirm(value);
    };

    const { modalRef } = useModalKeyboard(confirmModal.show, handleClose);

    if (!confirmModal.show) return null;

    const { title, message, confirmLabel, cancelLabel, danger, inputConfig } = confirmModal;

    const headerBg = danger
        ? 'linear-gradient(135deg, #e74c3c, #c0392b)'
        : 'linear-gradient(135deg, #667eea, #764ba2)';

    return (
        <div className="modal-overlay" onClick={handleClose} role="presentation">
            <div
                ref={modalRef}
                className="modal"
                style={{ maxWidth: '480px' }}
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-modal-title"
            >
                <div
                    className="modal-header"
                    style={{
                        background: headerBg,
                        color: 'white',
                        margin: '-25px -25px 20px -25px',
                        padding: '18px 20px',
                        borderRadius: '17px 17px 0 0',
                        borderBottom: 'none'
                    }}
                >
                    <h3
                        id="confirm-modal-title"
                        style={{
                            margin: 0,
                            fontSize: '18px',
                            fontWeight: '800',
                            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                        }}
                    >
                        {title}
                    </h3>
                    <button
                        onClick={handleClose}
                        aria-label="Close modal"
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: '2px solid rgba(255,255,255,0.3)',
                            fontSize: '18px',
                            cursor: 'pointer',
                            color: 'white',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            fontWeight: 'bold',
                            flexShrink: 0
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.35)';
                            e.currentTarget.style.transform = 'rotate(90deg)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                            e.currentTarget.style.transform = 'rotate(0deg)';
                        }}
                    >
                        ×
                    </button>
                </div>

                <div style={{ padding: '0 25px 8px 25px' }}>
                    {message.split('\n').map((line, i) => (
                        <p key={i} style={{ margin: '0 0 6px 0', lineHeight: '1.5' }}>{line}</p>
                    ))}

                    {inputConfig && (
                        <input
                            type="text"
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            placeholder={inputConfig.placeholder || ''}
                            onKeyDown={e => { if (e.key === 'Enter') handleConfirm(); }}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                marginTop: '10px',
                                border: '1px solid var(--border-color, #ccc)',
                                borderRadius: '6px',
                                background: 'var(--input-bg, #fff)',
                                color: 'var(--text-color, #333)',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                            autoFocus
                        />
                    )}
                </div>

                <div style={{
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'flex-end',
                    padding: '16px 25px 25px 25px'
                }}>
                    <button
                        onClick={handleClose}
                        style={{
                            padding: '10px 20px',
                            border: '1px solid var(--border-color, #ddd)',
                            borderRadius: '6px',
                            background: 'var(--surface-bg, white)',
                            color: 'var(--text-color, #333)',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={handleConfirm}
                        style={{
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '6px',
                            background: danger ? '#e74c3c' : 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600'
                        }}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
