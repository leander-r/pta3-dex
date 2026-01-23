// ============================================================
// Header Component
// ============================================================
// App header with trainer selector and menu

import React, { useState } from 'react';

/**
 * Header - App header with trainer selector and character menu
 * @param {Object} props
 * @param {Array} props.trainers - All trainers
 * @param {Object} props.trainer - Current active trainer
 * @param {number} props.activeTrainerId - Active trainer ID
 * @param {Function} props.setActiveTrainerId - Set active trainer
 * @param {Function} props.addNewTrainer - Add new trainer
 * @param {Function} props.deleteTrainer - Delete trainer
 * @param {Function} props.duplicateTrainer - Duplicate trainer
 * @param {Function} props.exportSingleTrainer - Export single trainer
 * @param {Function} props.exportAllData - Export all data
 * @param {Function} props.onImport - Handle import
 */
const Header = ({
    trainers,
    trainer,
    activeTrainerId,
    setActiveTrainerId,
    addNewTrainer,
    deleteTrainer,
    duplicateTrainer,
    exportSingleTrainer,
    exportAllData,
    onImport
}) => {
    const [showCharacterMenu, setShowCharacterMenu] = useState(false);

    return (
        <div className="header">
            <h1>P:TA Character Manager</h1>

            {/* Trainer Selector, Money & Menu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* Money Display */}
                <div style={{
                    background: 'linear-gradient(135deg, #ffd700, #ffb300)',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    color: '#5d4e00',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    <span>₽{(trainer.money || 0).toLocaleString()}</span>
                </div>

                {/* Trainer Selector */}
                <select
                    value={activeTrainerId || ''}
                    onChange={(e) => setActiveTrainerId(parseInt(e.target.value))}
                    style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '2px solid #667eea',
                        background: 'white',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        minWidth: '150px'
                    }}
                >
                    {trainers.map(t => (
                        <option key={t.id} value={t.id}>
                            {t.name || 'Unnamed'} (Lv.{t.level})
                        </option>
                    ))}
                </select>

                {/* Character Menu Button */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowCharacterMenu(!showCharacterMenu)}
                        style={{
                            padding: '8px 15px',
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '14px'
                        }}
                    >
                        Menu
                    </button>

                    {/* Dropdown Menu */}
                    {showCharacterMenu && (
                        <div style={{
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            marginTop: '5px',
                            background: 'white',
                            borderRadius: '10px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                            minWidth: '200px',
                            zIndex: 1000,
                            overflow: 'hidden'
                        }}>
                            <button
                                onClick={() => {
                                    addNewTrainer();
                                    setShowCharacterMenu(false);
                                }}
                                style={menuItemStyle}
                            >
                                <span>+ New Trainer</span>
                            </button>

                            <button
                                onClick={() => {
                                    duplicateTrainer(activeTrainerId);
                                    setShowCharacterMenu(false);
                                }}
                                style={menuItemStyle}
                            >
                                <span>Clone Trainer</span>
                            </button>

                            <hr style={{ margin: '5px 0', border: 'none', borderTop: '1px solid #eee' }} />

                            <button
                                onClick={() => {
                                    exportSingleTrainer(trainer);
                                    setShowCharacterMenu(false);
                                }}
                                style={menuItemStyle}
                            >
                                <span>Export Trainer</span>
                            </button>

                            <button
                                onClick={() => {
                                    exportAllData();
                                    setShowCharacterMenu(false);
                                }}
                                style={menuItemStyle}
                            >
                                <span>Export All</span>
                            </button>

                            <label style={{ ...menuItemStyle, cursor: 'pointer' }}>
                                <span>Import Data</span>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={(e) => {
                                        if (e.target.files[0]) {
                                            onImport(e.target.files[0]);
                                            setShowCharacterMenu(false);
                                        }
                                    }}
                                    style={{ display: 'none' }}
                                />
                            </label>

                            <hr style={{ margin: '5px 0', border: 'none', borderTop: '1px solid #eee' }} />

                            <button
                                onClick={() => {
                                    if (trainers.length > 1) {
                                        if (confirm(`Delete ${trainer.name || 'this trainer'}? This cannot be undone.`)) {
                                            deleteTrainer(activeTrainerId);
                                        }
                                    } else {
                                        alert('You must have at least one trainer.');
                                    }
                                    setShowCharacterMenu(false);
                                }}
                                style={{ ...menuItemStyle, color: '#e53935' }}
                                disabled={trainers.length <= 1}
                            >
                                <span>Delete Trainer</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const menuItemStyle = {
    width: '100%',
    padding: '12px 15px',
    background: 'none',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'background 0.2s',
    ':hover': {
        background: '#f5f5f5'
    }
};

export default Header;
