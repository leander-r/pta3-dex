// ============================================================
// Print Sheet Modal
// ============================================================
// Shows a preview of the trainer + party, then opens a new tab
// with a print-ready HTML page and auto-triggers window.print().

import React from 'react';
import useModalKeyboard from '../../hooks/useModalKeyboard.js';
import { useModal } from '../../contexts/index.js';
import { useTrainerContext } from '../../contexts/TrainerContext.jsx';
import { usePokemonContext } from '../../contexts/PokemonContext.jsx';
import { generatePrintSheetHTML } from '../../utils/exportUtils.js';

const PrintSheetModal = () => {
    const { showPrintSheetModal, closePrintSheet } = useModal();
    const { trainer } = useTrainerContext();
    const { party }   = usePokemonContext();

    const { modalRef } = useModalKeyboard(showPrintSheetModal, closePrintSheet);

    if (!showPrintSheetModal) return null;

    const handlePrint = () => {
        const html = generatePrintSheetHTML(trainer, party);
        const win  = window.open('', '_blank');
        if (!win) return;
        win.document.write(html);
        win.document.close();
    };

    const classesDisplay = trainer.classes?.length > 0 ? trainer.classes.join(' / ') : 'Trainer';

    return (
        <div
            className="modal-overlay"
            style={{ zIndex: 10000 }}
            onClick={e => e.target === e.currentTarget && closePrintSheet()}
        >
            <div
                ref={modalRef}
                className="modal"
                style={{ maxWidth: '480px', width: '90%' }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="print-sheet-title"
            >
                {/* Header */}
                <div className="modal-header" style={{ background: 'linear-gradient(135deg, #f5a623, #e8941c)' }}>
                    <h2 id="print-sheet-title" style={{ margin: 0, color: 'white', fontSize: '16px', fontWeight: 700 }}>
                        Print Character Sheet
                    </h2>
                    <button
                        aria-label="Close modal"
                        onClick={closePrintSheet}
                        style={{
                            background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.3)',
                            fontSize: '18px', cursor: 'pointer', color: 'white', borderRadius: '50%',
                            width: '36px', height: '36px', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontWeight: 'bold', flexShrink: 0
                        }}
                    >×</button>
                </div>

                {/* Body */}
                <div style={{ padding: '20px' }}>
                    <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Click <strong>Print / Save as PDF</strong> to open a print-ready sheet in a new tab.
                        Your browser's print dialog will appear — choose "Save as PDF" to export.
                    </p>

                    {/* Preview */}
                    <div style={{
                        border: '1px solid var(--border-color)', borderRadius: '8px',
                        padding: '14px 16px', background: 'var(--bg-secondary)', marginBottom: '20px'
                    }}>
                        <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>
                            {trainer.name || 'Unnamed'}{' '}
                            {trainer.gender === 'male' ? '♂' : trainer.gender === 'female' ? '♀' : ''}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                            Level {trainer.level ?? 0} {classesDisplay}
                        </div>

                        {party.length === 0 ? (
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No Pokémon in party</div>
                        ) : (
                            party.map(poke => (
                                <div
                                    key={poke.id}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '5px 0', borderBottom: '1px solid var(--border-color)',
                                        fontSize: '13px'
                                    }}
                                >
                                    <span style={{ fontWeight: 600 }}>{poke.name || poke.species || 'Unknown'}</span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                                        {(poke.types || []).join('/')}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button
                            onClick={closePrintSheet}
                            className="btn btn-secondary"
                            style={{ padding: '9px 18px' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handlePrint}
                            className="btn btn-primary"
                            style={{ padding: '9px 18px' }}
                        >
                            🖨 Print / Save as PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintSheetModal;
