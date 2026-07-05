import React from 'react';
import useModalKeyboard from '../../hooks/useModalKeyboard.js';
import { useUI } from '../../contexts/index.js';
import OnboardingChecklist from '../common/OnboardingChecklist.jsx';

const GettingStartedModal = () => {
    const { showGettingStarted, closeGettingStarted, setActiveTab } = useUI();
    const { modalRef } = useModalKeyboard(showGettingStarted, closeGettingStarted);

    if (!showGettingStarted) return null;

    return (
        <div className="modal-overlay" onClick={closeGettingStarted} role="presentation">
            <div
                ref={modalRef}
                className="modal"
                style={{ maxWidth: 'min(95vw, 420px)' }}
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="getting-started-modal-title"
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
                        id="getting-started-modal-title"
                        style={{ margin: 0, fontSize: '18px', fontWeight: '800', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                    >
                        ✦ Getting Started
                    </h3>
                    <button
                        onClick={closeGettingStarted}
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

                <div style={{ padding: '0 25px 25px', fontSize: '14px', lineHeight: '1.6', color: 'var(--text-color)' }}>
                    <OnboardingChecklist setActiveTab={setActiveTab} onClose={closeGettingStarted} />
                </div>
            </div>
        </div>
    );
};

export default GettingStartedModal;
