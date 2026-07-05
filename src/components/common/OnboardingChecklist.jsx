// ============================================================
// Onboarding Checklist Component
// ============================================================
// "Getting Started" steps + all-done state. Used inside the
// GettingStartedModal so it's reachable on mobile (the sidebar
// version in MainNavigation.jsx is hidden on small screens).

import React from 'react';
import { useOnboarding } from '../../hooks/useOnboarding.js';

const OnboardingChecklist = ({ setActiveTab, onClose }) => {
    const { steps, allDone, dismissed, dismiss } = useOnboarding();

    if (dismissed) {
        return (
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
                You've dismissed the Getting Started checklist.
            </p>
        );
    }

    const handleDismiss = () => {
        dismiss();
        onClose?.();
    };

    const handleStepClick = (tab) => {
        setActiveTab(tab);
        onClose?.();
    };

    if (allDone) {
        return (
            <div style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: '#e8f5e9',
                border: '1px solid #a5d6a7',
                fontSize: '13px',
                color: '#2e7d32',
                lineHeight: '1.5'
            }}>
                <div style={{ fontWeight: 700, marginBottom: '6px' }}>✓ All set! You're ready to play.</div>
                <button
                    onClick={handleDismiss}
                    style={{
                        background: 'none', border: 'none', color: '#2e7d32',
                        cursor: 'pointer', fontSize: '13px', padding: '4px 0',
                        textDecoration: 'underline'
                    }}
                >Dismiss</button>
            </div>
        );
    }

    return (
        <div>
            <div style={{ padding: '4px 0 10px' }}>
                {steps.map(step => (
                    step.done ? (
                        <div key={step.id} style={{
                            padding: '7px 4px', display: 'flex', alignItems: 'center', gap: '8px',
                            color: '#2e7d32', fontWeight: 600, fontSize: '13px'
                        }}>
                            <span>✓</span>
                            <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>{step.label}</span>
                        </div>
                    ) : (
                        <button
                            key={step.id}
                            onClick={() => handleStepClick(step.tab)}
                            style={{
                                width: '100%', background: 'none', border: 'none', textAlign: 'left',
                                padding: '7px 4px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                gap: '8px', color: 'var(--text-primary)', fontSize: '13px'
                            }}
                        >
                            <span>○</span>
                            <span>{step.label}</span>
                        </button>
                    )
                ))}
            </div>
            <div style={{
                padding: '8px 0 0', borderTop: '1px solid var(--border-light)',
                color: 'var(--text-muted)', fontSize: '12px', lineHeight: '1.5',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px'
            }}>
                <span>ⓘ Auto-saves every minute.</span>
                <button
                    onClick={handleDismiss}
                    style={{
                        background: 'none', border: 'none', color: 'var(--text-muted)',
                        cursor: 'pointer', fontSize: '12px', textDecoration: 'underline', flexShrink: 0
                    }}
                >Dismiss</button>
            </div>
        </div>
    );
};

export default OnboardingChecklist;
