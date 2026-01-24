// ============================================================
// Header Component
// ============================================================
// App header with trainer selector and menu

import React, { useState, useRef, useEffect } from 'react';

/**
 * Header - App header with trainer selector and character menu
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
    onImport,
    onExportCard
}) => {
    const [showCharacterMenu, setShowCharacterMenu] = useState(false);
    const [hoveredItem, setHoveredItem] = useState(null);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowCharacterMenu(false);
            }
        };

        if (showCharacterMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCharacterMenu]);

    const MenuItem = ({ id, icon, label, onClick, danger, disabled }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            onMouseEnter={() => setHoveredItem(id)}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
                width: '100%',
                padding: '12px 16px',
                background: hoveredItem === id ? (danger ? '#ffebee' : '#f5f5f5') : 'none',
                border: 'none',
                textAlign: 'left',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: danger ? '#e53935' : (disabled ? '#bbb' : '#333'),
                opacity: disabled ? 0.5 : 1,
                transition: 'background 0.15s'
            }}
        >
            <span style={{ width: '20px', display: 'flex', justifyContent: 'center' }}>{icon}</span>
            <span>{label}</span>
        </button>
    );

    return (
        <header style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '12px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 100
        }}>
            {/* App Title */}
            <h1 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="white" strokeWidth="2"/>
                    <circle cx="12" cy="12" r="4" fill="white"/>
                    <line x1="2" y1="12" x2="8" y2="12" stroke="white" strokeWidth="2"/>
                    <line x1="16" y1="12" x2="22" y2="12" stroke="white" strokeWidth="2"/>
                </svg>
                <span>PTA Dex</span>
            </h1>

            {/* Right Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Money Display */}
                <div style={{
                    background: 'rgba(255,255,255,0.2)',
                    padding: '8px 14px',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backdropFilter: 'blur(10px)'
                }}>
                    <span style={{ color: '#ffd700' }}>₽</span>
                    <span>{(trainer.money || 0).toLocaleString()}</span>
                </div>

                {/* Trainer Selector */}
                <div style={{
                    background: 'rgba(255,255,255,0.95)',
                    borderRadius: '10px',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <select
                        value={activeTrainerId || ''}
                        onChange={(e) => setActiveTrainerId(parseInt(e.target.value))}
                        style={{
                            padding: '8px 12px',
                            paddingRight: '30px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'transparent',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '14px',
                            minWidth: '140px',
                            appearance: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23667eea' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 10px center'
                        }}
                    >
                        {trainers.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.name || 'Unnamed'} (Lv.{t.level})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Menu Button */}
                <div style={{ position: 'relative' }} ref={menuRef}>
                    <button
                        onClick={() => setShowCharacterMenu(!showCharacterMenu)}
                        style={{
                            width: '42px',
                            height: '42px',
                            background: showCharacterMenu ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.2s'
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showCharacterMenu && (
                        <div style={{
                            position: 'absolute',
                            right: 0,
                            top: 'calc(100% + 8px)',
                            background: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 4px 25px rgba(0,0,0,0.15)',
                            minWidth: '220px',
                            zIndex: 1000,
                            overflow: 'hidden',
                            animation: 'fadeIn 0.15s ease-out'
                        }}>
                            {/* Header */}
                            <div style={{
                                padding: '12px 16px',
                                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                Character Menu
                            </div>

                            {/* Trainer Section */}
                            <div style={{ padding: '8px 0' }}>
                                <MenuItem
                                    id="new"
                                    icon={
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="12" y1="5" x2="12" y2="19"></line>
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                    }
                                    label="New Trainer"
                                    onClick={() => {
                                        addNewTrainer();
                                        setShowCharacterMenu(false);
                                    }}
                                />
                                <MenuItem
                                    id="clone"
                                    icon={
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                    }
                                    label="Clone Trainer"
                                    onClick={() => {
                                        duplicateTrainer(activeTrainerId);
                                        setShowCharacterMenu(false);
                                    }}
                                />
                            </div>

                            <hr style={{ margin: 0, border: 'none', borderTop: '1px solid #eee' }} />

                            {/* Card Export Section */}
                            <div style={{ padding: '8px 0' }}>
                                <MenuItem
                                    id="export-card"
                                    icon={
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                            <polyline points="21 15 16 10 5 21"></polyline>
                                        </svg>
                                    }
                                    label="Export Cards"
                                    onClick={() => {
                                        if (onExportCard) onExportCard();
                                        setShowCharacterMenu(false);
                                    }}
                                />
                            </div>

                            <hr style={{ margin: 0, border: 'none', borderTop: '1px solid #eee' }} />

                            {/* Data Section */}
                            <div style={{ padding: '8px 0' }}>
                                <MenuItem
                                    id="export-one"
                                    icon={
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="7 10 12 15 17 10"></polyline>
                                            <line x1="12" y1="15" x2="12" y2="3"></line>
                                        </svg>
                                    }
                                    label="Export Trainer JSON"
                                    onClick={() => {
                                        exportSingleTrainer(trainer);
                                        setShowCharacterMenu(false);
                                    }}
                                />
                                <MenuItem
                                    id="export-all"
                                    icon={
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="7 10 12 15 17 10"></polyline>
                                            <line x1="12" y1="15" x2="12" y2="3"></line>
                                        </svg>
                                    }
                                    label="Export All Data"
                                    onClick={() => {
                                        exportAllData();
                                        setShowCharacterMenu(false);
                                    }}
                                />
                                <label
                                    onMouseEnter={() => setHoveredItem('import')}
                                    onMouseLeave={() => setHoveredItem(null)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        background: hoveredItem === 'import' ? '#f5f5f5' : 'none',
                                        border: 'none',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        color: '#333',
                                        transition: 'background 0.15s',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    <span style={{ width: '20px', display: 'flex', justifyContent: 'center' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="17 8 12 3 7 8"></polyline>
                                            <line x1="12" y1="3" x2="12" y2="15"></line>
                                        </svg>
                                    </span>
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
                            </div>

                            <hr style={{ margin: 0, border: 'none', borderTop: '1px solid #eee' }} />

                            {/* Danger Zone */}
                            <div style={{ padding: '8px 0' }}>
                                <MenuItem
                                    id="delete"
                                    icon={
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    }
                                    label="Delete Trainer"
                                    danger
                                    disabled={trainers.length <= 1}
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
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
