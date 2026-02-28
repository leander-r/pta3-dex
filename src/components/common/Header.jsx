// ============================================================
// Header Component
// ============================================================
// App header with trainer selector and menu

import React, { useState, useRef, useEffect } from 'react';
import { useTrainerContext, useData, useUI, useModal } from '../../contexts/index.js';
import toast from '../../utils/toast.js';

const MenuItem = ({ id, icon, label, onClick, danger, disabled, hoveredItem, setHoveredItem, title }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        onMouseEnter={() => setHoveredItem(id)}
        onMouseLeave={() => setHoveredItem(null)}
        onTouchStart={() => setHoveredItem(id)}
        onTouchEnd={() => setTimeout(() => setHoveredItem(null), 150)}
        className={`header-menu-item ${hoveredItem === id ? 'hovered' : ''} ${danger ? 'danger' : ''}`}
        style={{
            width: '100%',
            padding: '14px 18px',
            border: 'none',
            textAlign: 'left',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            opacity: disabled ? 0.5 : 1,
            transition: 'all 0.15s ease',
            borderLeft: hoveredItem === id && !danger ? '3px solid #f5a623' : '3px solid transparent',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation'
        }}
    >
        <span style={{
            width: '20px',
            display: 'flex',
            justifyContent: 'center',
            color: hoveredItem === id && !danger ? '#f5a623' : 'inherit'
        }}>{icon}</span>
        <span>{label}</span>
    </button>
);

/**
 * Header - App header with trainer selector and character menu
 * Uses TrainerContext for trainer data, DataContext for import/export, UIContext for theme
 */
const Header = () => {
    // Get from contexts
    const {
        trainers,
        trainer,
        activeTrainerId,
        setActiveTrainerId,
        addNewTrainer,
        deleteTrainer,
        duplicateTrainer,
        archiveTrainer,
        unarchiveTrainer
    } = useTrainerContext();
    const { exportSingleTrainer, exportAllData, importData, restoreAutoBackup } = useData();
    const { theme, setTheme, compactMode, setCompactMode, setEditingPokemon } = useUI();
    const { setShowCardModal, showConfirm } = useModal();

    // Active (non-archived) and archived trainer lists
    const activeTrainers = trainers.filter(t => !t.archived);
    const archivedTrainers = trainers.filter(t => t.archived);

    // Handler for trainer selection that also clears editing state
    const handleTrainerChange = (id) => {
        setActiveTrainerId(id);
        setEditingPokemon(null);
    };
    const [showCharacterMenu, setShowCharacterMenu] = useState(false);
    const [showArchivedSection, setShowArchivedSection] = useState(false);
    const [hoveredItem, setHoveredItem] = useState(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 480);
    const [isSmallMobile, setIsSmallMobile] = useState(window.innerWidth < 360);
    const menuRef = useRef(null);
    const dropdownRef = useRef(null);

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    // Track window size for responsive layout
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 480);
            setIsSmallMobile(window.innerWidth < 360);
        };

        window.addEventListener('resize', handleResize, { passive: true });
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Track scroll position for header effects (with hysteresis to prevent flickering)
    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            setIsScrolled(prev => {
                // Use different thresholds for scrolling down vs up to prevent flickering
                if (prev) {
                    // Currently scrolled - only unset when very close to top
                    return scrollY > 5;
                } else {
                    // Currently not scrolled - only set when scrolled further down
                    return scrollY > 30;
                }
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Check initial position

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Move focus to the first menu item when the dropdown opens (H3)
    useEffect(() => {
        if (showCharacterMenu && dropdownRef.current) {
            const firstBtn = dropdownRef.current.querySelector('button:not([disabled])');
            if (firstBtn) setTimeout(() => firstBtn.focus(), 50);
        }
    }, [showCharacterMenu]);

    // Close menu when clicking/touching outside, or pressing Escape
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowCharacterMenu(false);
            }
        };
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') setShowCharacterMenu(false);
        };

        if (showCharacterMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside, { passive: true });
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [showCharacterMenu]);

    const menuItemProps = { hoveredItem, setHoveredItem };

    return (
        <header style={{
            background: isScrolled
                ? 'linear-gradient(135deg, rgba(245, 166, 35, 0.97) 0%, rgba(232, 148, 28, 0.97) 100%)'
                : 'linear-gradient(135deg, #f5a623 0%, #e8941c 100%)',
            padding: isMobile
                ? (isScrolled ? '8px 10px' : '10px 12px')
                : (isScrolled ? '10px 20px' : '14px 20px'),
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: isScrolled
                ? '0 4px 20px rgba(0,0,0,0.25), 0 2px 8px rgba(245, 166, 35, 0.3)'
                : '0 4px 15px rgba(0,0,0,0.15), inset 0 2px 0 rgba(255,255,255,0.3)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            borderBottom: isScrolled ? '2px solid #e8941c' : '3px solid #e8941c',
            backdropFilter: isScrolled ? 'blur(10px)' : 'none',
            WebkitBackdropFilter: isScrolled ? 'blur(10px)' : 'none',
            transition: 'all 0.25s ease',
            gap: isMobile ? '8px' : '12px'
        }}>
            {/* App Title */}
            <h1 style={{
                margin: 0,
                fontSize: isMobile ? '16px' : (isScrolled ? '18px' : '22px'),
                fontWeight: 800,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '6px' : (isScrolled ? '8px' : '10px'),
                textShadow: '1px 1px 0 rgba(0,0,0,0.2)',
                transition: 'all 0.25s ease',
                flexShrink: 0
            }}>
                <svg
                    width={isMobile ? "20" : (isScrolled ? "22" : "26")}
                    height={isMobile ? "20" : (isScrolled ? "22" : "26")}
                    viewBox="0 0 24 24"
                    fill="white"
                    style={{ transition: 'all 0.25s ease', flexShrink: 0 }}
                >
                    <circle cx="12" cy="12" r="10" fill="none" stroke="white" strokeWidth="2.5"/>
                    <circle cx="12" cy="12" r="4" fill="white"/>
                    <line x1="2" y1="12" x2="8" y2="12" stroke="white" strokeWidth="2.5"/>
                    <line x1="16" y1="12" x2="22" y2="12" stroke="white" strokeWidth="2.5"/>
                </svg>
                {!isSmallMobile && <span>PTA Dex</span>}
            </h1>

            {/* Right Section */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '6px' : (isScrolled ? '8px' : '12px'),
                transition: 'all 0.25s ease',
                flexShrink: 1,
                minWidth: 0
            }}>
                {/* Money Display */}
                <div
                    className="header-money-display"
                    style={{
                        padding: isMobile ? '5px 8px' : (isScrolled ? '6px 12px' : '8px 16px'),
                        borderRadius: isMobile ? '8px' : '12px',
                        fontWeight: 700,
                        fontSize: isMobile ? '12px' : (isScrolled ? '13px' : '14px'),
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? '4px' : '6px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        transition: 'all 0.25s ease',
                        flexShrink: 0
                    }}
                >
                    <span style={{ color: '#f5a623', fontWeight: 800 }}>₽</span>
                    <span>{(trainer.money || 0).toLocaleString()}</span>
                </div>

                {/* Trainer Selector */}
                <div
                    className="header-trainer-selector"
                    style={{
                        borderRadius: isMobile ? '8px' : '12px',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        transition: 'all 0.25s ease',
                        flexShrink: 1,
                        minWidth: 0,
                        maxWidth: isMobile ? '110px' : 'none'
                    }}
                >
                    <select
                        value={activeTrainerId || ''}
                        onChange={(e) => handleTrainerChange(parseInt(e.target.value))}
                        title={trainer ? `${trainer.name || 'Unnamed'} (Lv.${trainer.level})` : undefined}
                        className="header-trainer-select"
                        style={{
                            paddingTop: isMobile ? '5px' : (isScrolled ? '6px' : '8px'),
                            paddingBottom: isMobile ? '5px' : (isScrolled ? '6px' : '8px'),
                            paddingLeft: isMobile ? '8px' : (isScrolled ? '10px' : '12px'),
                            paddingRight: isMobile ? '24px' : '32px',
                            borderRadius: '10px',
                            border: 'none',
                            background: 'transparent',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontSize: isMobile ? '12px' : (isScrolled ? '13px' : '14px'),
                            minWidth: 0,
                            width: '100%',
                            appearance: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23f5a623' stroke-width='3'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: isMobile ? 'right 6px center' : 'right 10px center',
                            transition: 'all 0.25s ease',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {activeTrainers.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.name || 'Unnamed'} (Lv.{t.level})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Compact Mode Toggle */}
                <button
                    onClick={() => setCompactMode(m => !m)}
                    className="theme-toggle"
                    style={{
                        width: isMobile ? '44px' : (isScrolled ? '36px' : '40px'),
                        height: isMobile ? '44px' : (isScrolled ? '36px' : '40px'),
                        opacity: compactMode ? 1 : 0.7
                    }}
                    aria-label={compactMode ? 'Switch to comfortable view' : 'Switch to compact view'}
                    title={compactMode ? 'Comfortable view' : 'Compact view'}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={compactMode ? '#ffc966' : 'white'} strokeWidth="2" strokeLinecap="round">
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                        <line x1="3" y1="14" x2="21" y2="14"/>
                        <line x1="3" y1="18" x2="21" y2="18"/>
                    </svg>
                </button>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="theme-toggle"
                    style={{
                        width: isMobile ? '44px' : (isScrolled ? '36px' : '40px'),
                        height: isMobile ? '44px' : (isScrolled ? '36px' : '40px'),
                    }}
                    aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                    {theme === 'light' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffc966" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="5"></circle>
                            <line x1="12" y1="1" x2="12" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="23"></line>
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                            <line x1="1" y1="12" x2="3" y2="12"></line>
                            <line x1="21" y1="12" x2="23" y2="12"></line>
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                        </svg>
                    )}
                </button>

                {/* Menu Button */}
                <div style={{ position: 'relative', flexShrink: 0, zIndex: 101 }} ref={menuRef}>
                    <div
                        onClick={() => setShowCharacterMenu(prev => !prev)}
                        onTouchEnd={(e) => {
                            e.preventDefault();
                            setShowCharacterMenu(prev => !prev);
                        }}
                        className={`header-menu-button ${showCharacterMenu ? 'active' : ''}`}
                        style={{
                            width: isMobile ? '44px' : (isScrolled ? '36px' : '42px'),
                            height: isMobile ? '44px' : (isScrolled ? '36px' : '42px'),
                            borderRadius: isMobile ? '8px' : '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.25s ease',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            WebkitTapHighlightColor: 'transparent',
                            touchAction: 'manipulation',
                            userSelect: 'none',
                            WebkitUserSelect: 'none'
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label="Open menu"
                    >
                        <svg
                            width={isMobile ? "18" : (isScrolled ? "18" : "20")}
                            height={isMobile ? "18" : (isScrolled ? "18" : "20")}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={showCharacterMenu ? '#e8941c' : '#f5a623'}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            style={{ transition: 'all 0.25s ease', pointerEvents: 'none', display: 'block' }}
                        >
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </div>

                    {/* Dropdown Menu */}
                    {showCharacterMenu && (
                        <div ref={dropdownRef} className="header-dropdown-menu" style={{
                            position: 'absolute',
                            right: 0,
                            top: 'calc(100% + 8px)',
                            borderRadius: '16px',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
                            minWidth: isMobile ? '200px' : '230px',
                            maxWidth: '280px',
                            zIndex: 1000,
                            overflow: 'hidden',
                            animation: 'fadeIn 0.15s ease-out',
                            border: '2px solid #ffc966'
                        }}>
                            {/* Header */}
                            <div style={{
                                padding: '14px 18px',
                                background: 'linear-gradient(135deg, #f5a623, #e8941c)',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                textShadow: '1px 1px 0 rgba(0,0,0,0.15)'
                            }}>
                                Character Menu
                            </div>

                            {/* Trainer Section */}
                            <div style={{ padding: '8px 0' }}>
                                <MenuItem {...menuItemProps}
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
                                <MenuItem {...menuItemProps}
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

                            <hr style={{ margin: '0 12px', border: 'none', borderTop: '1px solid #ffc966' }} />

                            {/* Card Export Section */}
                            <div style={{ padding: '8px 0' }}>
                                <MenuItem {...menuItemProps}
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
                                        setShowCardModal(true);
                                        setShowCharacterMenu(false);
                                    }}
                                />
                            </div>

                            <hr style={{ margin: '0 12px', border: 'none', borderTop: '1px solid #ffc966' }} />

                            {/* Data Section */}
                            <div style={{ padding: '8px 0' }}>
                                <MenuItem {...menuItemProps}
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
                                <MenuItem {...menuItemProps}
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
                                <MenuItem {...menuItemProps}
                                    id="restore-backup"
                                    icon={
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="1 4 1 10 7 10"></polyline>
                                            <path d="M3.51 15a9 9 0 1 0 .49-3.51"></path>
                                        </svg>
                                    }
                                    label="Restore Auto-Backup"
                                    onClick={() => {
                                        restoreAutoBackup();
                                        setShowCharacterMenu(false);
                                    }}
                                />
                                <label
                                    onMouseEnter={() => setHoveredItem('import')}
                                    onMouseLeave={() => setHoveredItem(null)}
                                    onTouchStart={() => setHoveredItem('import')}
                                    onTouchEnd={() => setTimeout(() => setHoveredItem(null), 150)}
                                    className={`header-menu-item ${hoveredItem === 'import' ? 'hovered' : ''}`}
                                    style={{
                                        width: '100%',
                                        padding: '14px 18px',
                                        border: 'none',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        transition: 'all 0.15s ease',
                                        boxSizing: 'border-box',
                                        borderLeft: hoveredItem === 'import' ? '3px solid #f5a623' : '3px solid transparent',
                                        WebkitTapHighlightColor: 'transparent',
                                        touchAction: 'manipulation'
                                    }}
                                >
                                    <span style={{
                                        width: '20px',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        color: hoveredItem === 'import' ? '#f5a623' : 'inherit'
                                    }}>
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
                                                importData(e.target.files[0]);
                                                setShowCharacterMenu(false);
                                            }
                                        }}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>

                            <hr style={{ margin: '0 12px', border: 'none', borderTop: '1px solid #ffc966' }} />

                            {/* Danger Zone */}
                            <div style={{ padding: '8px 0' }}>
                                <MenuItem {...menuItemProps}
                                    id="archive"
                                    icon={
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="21 8 21 21 3 21 3 8"></polyline>
                                            <rect x="1" y="3" width="22" height="5"></rect>
                                            <line x1="10" y1="12" x2="14" y2="12"></line>
                                        </svg>
                                    }
                                    label="Archive Trainer"
                                    disabled={activeTrainers.length <= 1}
                                    title={activeTrainers.length <= 1 ? 'Need at least 2 active trainers to archive one' : 'Move this trainer to the archived list'}
                                    onClick={() => {
                                        showConfirm({
                                            title: 'Archive Trainer?',
                                            message: `Archive "${trainer.name || 'Unnamed'}"? They'll move to the Archived section and can be restored later.`,
                                            confirmLabel: 'Archive',
                                            onConfirm: () => {
                                                archiveTrainer(activeTrainerId);
                                                setShowCharacterMenu(false);
                                            }
                                        });
                                    }}
                                />
                                <MenuItem {...menuItemProps}
                                    id="delete"
                                    icon={
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    }
                                    label="Delete Trainer"
                                    danger
                                    disabled={activeTrainers.length <= 1 && archivedTrainers.length === 0}
                                    title={activeTrainers.length <= 1 && archivedTrainers.length === 0 ? 'Cannot delete the only trainer' : 'Permanently delete this trainer'}
                                    onClick={() => {
                                        deleteTrainer(activeTrainerId);
                                        setShowCharacterMenu(false);
                                    }}
                                />
                            </div>

                            {/* Archived Trainers Section */}
                            {archivedTrainers.length > 0 && (
                                <>
                                    <hr style={{ margin: '0 12px', border: 'none', borderTop: '1px solid #ffc966' }} />
                                    <div style={{ padding: '4px 0' }}>
                                        <button
                                            onClick={() => setShowArchivedSection(p => !p)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 18px',
                                                border: 'none',
                                                background: 'none',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                                color: '#888',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                                style={{ transform: showArchivedSection ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                                                <polyline points="9 18 15 12 9 6"></polyline>
                                            </svg>
                                            Archived ({archivedTrainers.length})
                                        </button>
                                        {showArchivedSection && archivedTrainers.map(t => (
                                            <div key={t.id} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '6px 18px',
                                                gap: '8px'
                                            }}>
                                                <span style={{ fontSize: '13px', color: '#888', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {t.name || 'Unnamed'} (Lv.{t.level})
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        unarchiveTrainer(t.id);
                                                        setShowCharacterMenu(false);
                                                    }}
                                                    style={{
                                                        padding: '3px 10px',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        background: '#f5a623',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    Restore
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
