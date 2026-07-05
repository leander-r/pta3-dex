import React from 'react';
import useModalKeyboard from '../../hooks/useModalKeyboard.js';
import { useUI } from '../../contexts/index.js';
import { HELP_CONTENT } from './HelpModal.jsx';

/**
 * HelpHubModal — a single reachable entry point listing every help topic.
 * Exists because the per-panel "?" buttons that open HelpModal only live on
 * Trainer/Pokémon/Battle panels; this hub (opened from the header menu, which
 * is not hidden on mobile) makes all topics reachable from anywhere.
 */
const HelpHubModal = () => {
    const { showHelpHub, closeHelpHub, showHelp } = useUI();
    const { modalRef } = useModalKeyboard(showHelpHub, closeHelpHub);

    if (!showHelpHub) return null;

    const topics = Object.entries(HELP_CONTENT);

    return (
        <div className="modal-overlay" onClick={closeHelpHub} role="presentation">
            <div
                ref={modalRef}
                className="modal"
                style={{ maxWidth: 'min(95vw, 420px)' }}
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="help-hub-modal-title"
            >
                <div
                    className="modal-header"
                    style={{
                        background: 'linear-gradient(135deg, #f5a623, #e8941c)',
                        color: 'white',
                        margin: '-25px -25px 20px -25px',
                        padding: '18px 20px',
                        borderRadius: '17px 17px 0 0',
                        borderBottom: 'none'
                    }}
                >
                    <h3
                        id="help-hub-modal-title"
                        style={{ margin: 0, fontSize: '18px', fontWeight: '800', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                    >
                        ❓ Help Topics
                    </h3>
                    <button
                        onClick={closeHelpHub}
                        aria-label="Close"
                        title="Close"
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

                <div style={{ padding: '0 25px 25px' }}>
                    {topics.map(([key, { title }]) => (
                        <button
                            key={key}
                            onClick={() => {
                                closeHelpHub();
                                showHelp(key);
                            }}
                            style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '11px 12px',
                                marginBottom: '6px',
                                border: '1px solid var(--border-light)',
                                borderRadius: '8px',
                                background: 'var(--surface-bg)',
                                color: 'var(--text-primary)',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            {title}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HelpHubModal;
