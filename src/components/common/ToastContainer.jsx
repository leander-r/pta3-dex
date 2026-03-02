// ============================================================
// Toast Container Component
// ============================================================
// Renders toast notifications from the global toast utility

import React, { useState, useEffect, useCallback } from 'react';
import toast from '../../utils/toast.js';

const ToastContainer = () => {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        return toast.subscribe(t => {
            setToasts(prev => [...prev, { ...t, exiting: false }]);
            // Start exit animation before removal
            setTimeout(() => {
                setToasts(prev => prev.map(x => x.id === t.id ? { ...x, exiting: true } : x));
            }, t.duration - 300);
            setTimeout(() => {
                setToasts(prev => prev.filter(x => x.id !== t.id));
            }, t.duration);
        });
    }, []);

    const dismissToast = useCallback((id) => {
        setToasts(prev => prev.map(x => x.id === id ? { ...x, exiting: true } : x));
        setTimeout(() => {
            setToasts(prev => prev.filter(x => x.id !== id));
        }, 300);
    }, []);

    if (toasts.length === 0) return null;

    const typeStyles = {
        success: { bg: '#e8f5e9', border: '#4caf50', icon: '\u2713', color: '#2e7d32' },
        error: { bg: '#ffebee', border: '#f44336', icon: '\u2717', color: '#c62828' },
        warning: { bg: '#fff3e0', border: '#ff9800', icon: '\u26A0', color: '#e65100' },
        info: { bg: '#e3f2fd', border: '#2196f3', icon: '\u2139', color: '#1565c0' }
    };

    return (
        <div style={{
            position: 'fixed',
            top: '16px',
            right: '16px',
            zIndex: 100000,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxWidth: '400px',
            width: '90vw',
            pointerEvents: 'none'
        }}>
            {toasts.map(t => {
                const s = typeStyles[t.type] || typeStyles.info;
                return (
                    <div
                        key={t.id}
                        role="alert"
                        className={`toast-notification toast-${t.type}`}
                        style={{
                            background: s.bg,
                            border: `2px solid ${s.border}`,
                            borderRadius: '10px',
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                            pointerEvents: 'auto',
                            animation: t.exiting ? 'toastOut 0.3s ease forwards' : 'toastIn 0.3s ease',
                            cursor: 'pointer',
                            whiteSpace: 'pre-line',
                            fontSize: '14px',
                            lineHeight: '1.4'
                        }}
                        onClick={() => dismissToast(t.id)}
                    >
                        <span style={{
                            fontSize: '18px',
                            lineHeight: '1',
                            flexShrink: 0,
                            marginTop: '1px',
                            color: s.color
                        }}>{s.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ color: s.color, fontWeight: 500 }}>
                                {t.message}
                            </span>
                            {t.action && (
                                <div style={{ marginTop: '6px' }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            t.action.onClick();
                                            dismissToast(t.id);
                                        }}
                                        style={{
                                            padding: '3px 12px',
                                            background: s.color,
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: 700
                                        }}
                                    >
                                        {t.action.label}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ToastContainer;
