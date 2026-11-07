// ============================================================
// Header Component
// ============================================================
// App header with trainer selector and two menus:
//   - "Data & Export" (orange): save/load, export, import, backups, demo data
//   - "Character/Account" (purple): new/clone trainer, appearance, archive/delete

import React, { useState, useRef, useEffect } from 'react';
import { useTrainerContext, useData, useUI, useModal } from '../../contexts/index.js';
import { useOnboarding } from '../../hooks/useOnboarding.js';
import toast from '../../utils/toast.js';
import { IconSave, IconPerson, IconPokeball } from './NavIcons.jsx';

const MenuItem = ({ id, icon, label, subtitle, onClick, danger, disabled, disabledReason, hoveredItem, setHoveredItem, title }) => {
    // When disabled, the reason is always shown as visible subtext — a title
    // tooltip alone doesn't work on touch devices.
    const effectiveSubtitle = disabled && disabledReason ? disabledReason : subtitle;
    return (
        <button
            onClick={() => {
                if (disabled) {
                    if (disabledReason) toast.info(disabledReason);
                    return;
                }
                onClick();
            }}
            aria-disabled={disabled}
            title={title || effectiveSubtitle}
            onMouseEnter={() => setHoveredItem(id)}
            onMouseLeave={() => setHoveredItem(null)}
            onTouchStart={() => setHoveredItem(id)}
            onTouchEnd={() => setTimeout(() => setHoveredItem(null), 150)}
            className={`header-menu-item ${hoveredItem === id ? 'hovered' : ''} ${danger ? 'danger' : ''}`}
            style={{
                width: '100%',
                padding: effectiveSubtitle ? '10px 18px' : '14px 18px',
                border: 'none',
                textAlign: 'left',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: effectiveSubtitle ? 'flex-start' : 'center',
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
                marginTop: effectiveSubtitle ? '2px' : 0,
                flexShrink: 0,
                color: hoveredItem === id && !danger ? '#f5a623' : 'inherit'
            }}>{icon}</span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                <span>{label}</span>
                {effectiveSubtitle && (
                    <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.65, lineHeight: 1.3, whiteSpace: 'normal' }}>
                        {effectiveSubtitle}
                    </span>
                )}
            </span>
        </button>
    );
};

/** Small uppercase micro-header for grouping related menu items, e.g. "Backup & Sharing" */
const GroupLabel = ({ children }) => (
    <div style={{
        padding: '6px 18px 2px',
        fontSize: '10px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.6px',
        opacity: 0.5
    }}>
        {children}
    </div>
);

const MenuDivider = () => (
    <hr style={{ margin: '0 12px', border: 'none', borderTop: '1px solid #ffc966' }} />
);

/**
 * HeaderMenuButton - one of the two icon buttons that open a dropdown.
 * Both buttons share the same size/shape; only the icon and stroke colors differ.
 */
const HeaderMenuButton = ({ icon: Icon, isOpen, onClick, ariaLabel, isMobile, isScrolled, idleColor, activeColor, buttonRef }) => (
    <div
        ref={buttonRef}
        onClick={onClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
        onTouchEnd={(e) => { e.preventDefault(); onClick(); }}
        className={`header-menu-button ${isOpen ? 'active' : ''}`}
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
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={ariaLabel}
    >
        <Icon
            size={isMobile ? 18 : (isScrolled ? 18 : 20)}
            stroke={isOpen ? activeColor : idleColor}
            strokeWidth={2.5}
        />
    </div>
);

/**
 * Header - App header with trainer selector and the two menu buttons
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
    const { exportSingleTrainer, exportAllData, importData, restoreAutoBackup, loadDemoTrainer } = useData();
    const { theme, setTheme, compactMode, setCompactMode, setEditingPokemon, openGettingStarted, openHelpHub } = useUI();
    const { showConfirm, openSaveLoadModal, setShowCardModal, openPrintSheet } = useModal();
    const { dismissed: onboardingDismissed } = useOnboarding();

    // Active (non-archived) and archived trainer lists
    const activeTrainers = trainers.filter(t => !t.archived);
    const archivedTrainers = trainers.filter(t => t.archived);

    // Handler for trainer selection that also clears editing state
    const handleTrainerChange = (id) => {
        setActiveTrainerId(id);
        setEditingPokemon(null);
    };

    // Only one of the three menus can be open at a time: null | 'data' | 'account' | 'trainer'
    const [openMenu, setOpenMenu] = useState(null);
    const [showArchivedSection, setShowArchivedSection] = useState(false);
    const [hoveredItem, setHoveredItem] = useState(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 480);
    const [isSmallMobile, setIsSmallMobile] = useState(window.innerWidth < 360);
    const dataButtonRef = useRef(null);
    const accountButtonRef = useRef(null);
    const trainerButtonRef = useRef(null);
    const dataDropdownRef = useRef(null);
    const accountDropdownRef = useRef(null);
    const trainerDropdownRef = useRef(null);

    // Lookup used by the shared focus/click-outside/keyboard-nav effects below,
    // so adding a third (or fourth) menu doesn't mean touching that logic again.
    const menuRefs = {
        data: { button: dataButtonRef, dropdown: dataDropdownRef },
        account: { button: accountButtonRef, dropdown: accountDropdownRef },
        trainer: { button: trainerButtonRef, dropdown: trainerDropdownRef }
    };

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

    // Move focus to the first menu item when a dropdown opens (H3)
    useEffect(() => {
        const dropdownRef = menuRefs[openMenu]?.dropdown;
        if (dropdownRef?.current) {
            const firstBtn = dropdownRef.current.querySelector('button:not([disabled])');
            if (firstBtn) setTimeout(() => firstBtn.focus(), 50);
        }
    }, [openMenu]);

    // Close menu when clicking/touching outside, or pressing Escape
    useEffect(() => {
        if (!openMenu) return;
        const buttonRef = menuRefs[openMenu].button;
        const dropdownRef = menuRefs[openMenu].dropdown;

        const handleClickOutside = (event) => {
            if (
                buttonRef.current && !buttonRef.current.contains(event.target) &&
                (!dropdownRef.current || !dropdownRef.current.contains(event.target))
            ) {
                setOpenMenu(null);
            }
        };
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setOpenMenu(null);
            } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                const buttons = Array.from(dropdownRef.current?.querySelectorAll('button:not([disabled])') || []);
                if (buttons.length === 0) return;
                const idx = buttons.indexOf(document.activeElement);
                const next = event.key === 'ArrowDown'
                    ? buttons[(idx + 1) % buttons.length]
                    : buttons[(idx - 1 + buttons.length) % buttons.length];
                next.focus();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside, { passive: true });
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [openMenu]);

    const menuItemProps = { hoveredItem, setHoveredItem };
    const closeMenus = () => setOpenMenu(null);

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
                {!isSmallMobile && <span>PTA3 Dex</span>}
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

                {/* Trainer Selector — a button + dropdown panel rather than a native
                    <select>, because a native select has no room to show a full
                    trainer name once squeezed into the mobile header strip (and
                    many mobile browsers clip the closed value without an ellipsis
                    at all). The collapsed button only needs the level — the panel
                    it opens shows every trainer's full, untruncated name. */}
                <div
                    className="header-trainer-selector"
                    style={{
                        borderRadius: isMobile ? '8px' : '12px',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        transition: 'all 0.25s ease',
                        flexShrink: 0,
                        position: 'relative'
                    }}
                >
                    <button
                        ref={trainerButtonRef}
                        onClick={() => setOpenMenu(p => p === 'trainer' ? null : 'trainer')}
                        onTouchEnd={(e) => { e.preventDefault(); setOpenMenu(p => p === 'trainer' ? null : 'trainer'); }}
                        aria-haspopup="true"
                        aria-expanded={openMenu === 'trainer'}
                        aria-label={trainer ? `Switch trainer — currently ${trainer.name || 'Unnamed'}, level ${trainer.level}` : 'Switch trainer'}
                        title={trainer ? `${trainer.name || 'Unnamed'} (Lv.${trainer.level}) — tap to switch trainer` : undefined}
                        className="header-trainer-select"
                        style={{
                            paddingTop: isMobile ? '5px' : (isScrolled ? '6px' : '8px'),
                            paddingBottom: isMobile ? '5px' : (isScrolled ? '6px' : '8px'),
                            paddingLeft: isMobile ? '8px' : (isScrolled ? '10px' : '12px'),
                            paddingRight: isMobile ? '8px' : (isScrolled ? '10px' : '12px'),
                            borderRadius: '10px',
                            border: 'none',
                            background: 'transparent',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontSize: isMobile ? '12px' : (isScrolled ? '13px' : '14px'),
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            transition: 'all 0.25s ease',
                            WebkitTapHighlightColor: 'transparent',
                            touchAction: 'manipulation'
                        }}
                    >
                        <IconPokeball size={isMobile ? 14 : 16} stroke={openMenu === 'trainer' ? '#e8941c' : '#f5a623'} strokeWidth={2.5} />
                        <span>Lv.{trainer?.level ?? '-'}</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                            style={{ opacity: 0.7, transform: openMenu === 'trainer' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>

                    {openMenu === 'trainer' && (
                        <div ref={trainerDropdownRef} className="header-dropdown-menu menu-trainer" style={{
                            position: 'absolute',
                            // Centered under the button (rather than left/right-anchored like the
                            // other two header menus) because this button sits mid-row, not flush
                            // against a screen edge — anchoring to either side risks the panel
                            // running off the opposite edge of a narrow phone screen.
                            left: '50%',
                            transform: 'translateX(-50%)',
                            top: 'calc(100% + 8px)',
                            borderRadius: '16px',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
                            minWidth: isMobile ? 'min(80vw, 240px)' : '240px',
                            maxWidth: isMobile ? 'min(90vw, 300px)' : '320px',
                            zIndex: 1000,
                            overflow: 'hidden',
                            animation: 'fadeIn 0.15s ease-out',
                            border: '2px solid #ffc966'
                        }}>
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
                                Switch Trainer
                            </div>
                            <div style={{ padding: '8px 0', maxHeight: '50vh', overflowY: 'auto' }}>
                                {activeTrainers.map(t => {
                                    const isActive = t.id === activeTrainerId;
                                    const itemId = `trainer-${t.id}`;
                                    return (
                                        <button
                                            key={t.id}
                                            onClick={() => { handleTrainerChange(t.id); closeMenus(); }}
                                            onMouseEnter={() => setHoveredItem(itemId)}
                                            onMouseLeave={() => setHoveredItem(null)}
                                            onTouchStart={() => setHoveredItem(itemId)}
                                            onTouchEnd={() => setTimeout(() => setHoveredItem(null), 150)}
                                            className={`header-menu-item ${hoveredItem === itemId ? 'hovered' : ''}`}
                                            style={{
                                                width: '100%',
                                                padding: '10px 18px',
                                                border: 'none',
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                transition: 'all 0.15s ease',
                                                borderLeft: hoveredItem === itemId ? '3px solid #f5a623' : '3px solid transparent',
                                                WebkitTapHighlightColor: 'transparent',
                                                touchAction: 'manipulation'
                                            }}
                                        >
                                            <span style={{
                                                width: '10px',
                                                height: '10px',
                                                borderRadius: '50%',
                                                flexShrink: 0,
                                                background: isActive ? '#f5a623' : 'transparent',
                                                border: isActive ? 'none' : '2px solid currentColor',
                                                opacity: isActive ? 1 : 0.35
                                            }} />
                                            <span style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
                                                <span style={{ fontSize: '14px', fontWeight: isActive ? 700 : 600, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                                    {t.name || 'Unnamed'}
                                                </span>
                                                <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.65 }}>
                                                    Level {t.level}
                                                </span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Menu Buttons — Data & Export + Character/Account, same size, side by side */}
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px', flexShrink: 0 }}>
                    <div style={{ position: 'relative', zIndex: 101 }}>
                        <HeaderMenuButton
                            icon={IconSave}
                            isOpen={openMenu === 'data'}
                            onClick={() => setOpenMenu(p => p === 'data' ? null : 'data')}
                            ariaLabel={openMenu === 'data' ? 'Close Data & Export menu' : 'Open Data & Export menu'}
                            isMobile={isMobile}
                            isScrolled={isScrolled}
                            idleColor="#f5a623"
                            activeColor="#e8941c"
                            buttonRef={dataButtonRef}
                        />

                        {openMenu === 'data' && (
                            <div ref={dataDropdownRef} className="header-dropdown-menu menu-data" style={{
                                position: 'absolute',
                                right: 0,
                                top: 'calc(100% + 8px)',
                                borderRadius: '16px',
                                boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
                                minWidth: isMobile ? 'min(85vw, 240px)' : '240px',
                                maxWidth: isMobile ? 'min(95vw, 300px)' : '300px',
                                zIndex: 1000,
                                overflow: 'hidden',
                                animation: 'fadeIn 0.15s ease-out',
                                border: '2px solid #ffc966'
                            }}>
                                {/* Header band */}
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
                                    Data &amp; Export
                                </div>

                                {/* Save / Load snapshot */}
                                <div style={{ padding: '8px 0' }}>
                                    <MenuItem {...menuItemProps}
                                        id="save-load"
                                        icon={
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                                <polyline points="7 3 7 8 15 8"></polyline>
                                            </svg>
                                        }
                                        label="Save / Load"
                                        subtitle="Open the snapshot save/load menu"
                                        onClick={() => { openSaveLoadModal(); closeMenus(); }}
                                    />
                                </div>

                                <MenuDivider />

                                {/* Export Section */}
                                <div style={{ padding: '8px 0' }}>
                                    <GroupLabel>Export</GroupLabel>
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
                                        subtitle="Back up just this trainer, their Pokémon, and the shared inventory"
                                        onClick={() => { exportSingleTrainer(trainer); closeMenus(); }}
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
                                        subtitle="Back up every trainer you have, in one file"
                                        onClick={() => { exportAllData(); closeMenus(); }}
                                    />
                                    <MenuItem {...menuItemProps}
                                        id="export-cards"
                                        icon={
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                                                <line x1="2" y1="9" x2="22" y2="9"></line>
                                            </svg>
                                        }
                                        label="Export Cards"
                                        subtitle={`Export trainer and Pokémon cards for ${trainer?.name || 'trainer'}`}
                                        onClick={() => { setShowCardModal(true); closeMenus(); }}
                                    />
                                    <MenuItem {...menuItemProps}
                                        id="print-sheet"
                                        icon={
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                                <rect x="6" y="14" width="12" height="8"></rect>
                                            </svg>
                                        }
                                        label="Print Sheet"
                                        subtitle="Print or save a character sheet as PDF"
                                        onClick={() => { openPrintSheet(); closeMenus(); }}
                                    />
                                    <label
                                        onMouseEnter={() => setHoveredItem('import')}
                                        onMouseLeave={() => setHoveredItem(null)}
                                        onTouchStart={() => setHoveredItem('import')}
                                        onTouchEnd={() => setTimeout(() => setHoveredItem(null), 150)}
                                        className={`header-menu-item ${hoveredItem === 'import' ? 'hovered' : ''}`}
                                        style={{
                                            width: '100%',
                                            padding: '10px 18px',
                                            border: 'none',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'flex-start',
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
                                            marginTop: '2px',
                                            flexShrink: 0,
                                            color: hoveredItem === 'import' ? '#f5a623' : 'inherit'
                                        }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                <polyline points="17 8 12 3 7 8"></polyline>
                                                <line x1="12" y1="3" x2="12" y2="15"></line>
                                            </svg>
                                        </span>
                                        <span style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                                            <span>Import Data</span>
                                            <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.65, lineHeight: 1.3 }}>
                                                Load a .json file exported from this app — trainer or full backup
                                            </span>
                                        </span>
                                        <input
                                            type="file"
                                            accept=".json"
                                            onChange={(e) => {
                                                if (e.target.files[0]) {
                                                    importData(e.target.files[0]);
                                                    closeMenus();
                                                }
                                            }}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                </div>

                                <MenuDivider />

                                {/* Backup & Sharing */}
                                <div style={{ padding: '8px 0' }}>
                                    <GroupLabel>Backup &amp; Sharing</GroupLabel>
                                    <MenuItem {...menuItemProps}
                                        id="restore-backup"
                                        icon={
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="1 4 1 10 7 10"></polyline>
                                                <path d="M3.51 15a9 9 0 1 0 .49-3.51"></path>
                                            </svg>
                                        }
                                        label="Restore Auto-Backup"
                                        subtitle="Revert to the snapshot taken right before your last save"
                                        onClick={() => { restoreAutoBackup(); closeMenus(); }}
                                    />
                                    <MenuItem {...menuItemProps}
                                        id="demo"
                                        icon={
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                            </svg>
                                        }
                                        label="Load Example Trainer"
                                        subtitle="Add a pre-built trainer & team to explore the app"
                                        onClick={() => { loadDemoTrainer(); closeMenus(); }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ position: 'relative', zIndex: 101 }}>
                        <HeaderMenuButton
                            icon={IconPerson}
                            isOpen={openMenu === 'account'}
                            onClick={() => setOpenMenu(p => p === 'account' ? null : 'account')}
                            ariaLabel={openMenu === 'account' ? 'Close Character & Account menu' : 'Open Character & Account menu'}
                            isMobile={isMobile}
                            isScrolled={isScrolled}
                            idleColor="#667eea"
                            activeColor="#764ba2"
                            buttonRef={accountButtonRef}
                        />

                        {openMenu === 'account' && (
                            <div ref={accountDropdownRef} className="header-dropdown-menu menu-account" style={{
                                position: 'absolute',
                                right: 0,
                                top: 'calc(100% + 8px)',
                                borderRadius: '16px',
                                boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
                                minWidth: isMobile ? 'min(85vw, 230px)' : '230px',
                                maxWidth: isMobile ? 'min(95vw, 280px)' : '280px',
                                zIndex: 1000,
                                overflow: 'hidden',
                                animation: 'fadeIn 0.15s ease-out',
                                border: '2px solid #c3cdf7'
                            }}>
                                {/* Header band */}
                                <div style={{
                                    padding: '14px 18px',
                                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                    color: 'white',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    textShadow: '1px 1px 0 rgba(0,0,0,0.15)'
                                }}>
                                    Character &amp; Account
                                </div>

                                {/* Getting Started / Help — reachable on every screen size, unlike
                                    the sidebar checklist which is hidden on mobile */}
                                <div style={{ padding: '8px 0' }}>
                                    {!onboardingDismissed && (
                                        <MenuItem {...menuItemProps}
                                            id="getting-started"
                                            icon={
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                                </svg>
                                            }
                                            label="Getting Started"
                                            onClick={() => { openGettingStarted(); closeMenus(); }}
                                        />
                                    )}
                                    <MenuItem {...menuItemProps}
                                        id="help-hub"
                                        icon={
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                            </svg>
                                        }
                                        label="Help Topics"
                                        onClick={() => { openHelpHub(); closeMenus(); }}
                                    />
                                </div>

                                <MenuDivider />

                                {/* Trainer Section */}
                                <div style={{ padding: '8px 0' }}>
                                    <GroupLabel>Trainer</GroupLabel>
                                    <MenuItem {...menuItemProps}
                                        id="new"
                                        icon={
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                            </svg>
                                        }
                                        label="New Trainer"
                                        onClick={() => { addNewTrainer(); closeMenus(); }}
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
                                        onClick={() => { duplicateTrainer(activeTrainerId); closeMenus(); }}
                                    />
                                </div>

                                <MenuDivider />

                                {/* Preferences */}
                                <div style={{ padding: '8px 0' }}>
                                    <GroupLabel>Appearance</GroupLabel>
                                    <MenuItem {...menuItemProps}
                                        id="theme"
                                        icon={theme === 'light' ? (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                                            </svg>
                                        ) : (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                                        label={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                                        onClick={() => { toggleTheme(); closeMenus(); }}
                                    />
                                    <MenuItem {...menuItemProps}
                                        id="compact"
                                        icon={
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                <line x1="3" y1="6" x2="21" y2="6"/>
                                                <line x1="3" y1="10" x2="21" y2="10"/>
                                                <line x1="3" y1="14" x2="21" y2="14"/>
                                                <line x1="3" y1="18" x2="21" y2="18"/>
                                            </svg>
                                        }
                                        label={compactMode ? 'Comfortable View' : 'Compact View'}
                                        onClick={() => { setCompactMode(m => !m); closeMenus(); }}
                                    />
                                </div>

                                <MenuDivider />

                                {/* Danger Zone */}
                                <div style={{ padding: '8px 0' }}>
                                    <GroupLabel>Danger Zone</GroupLabel>
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
                                        disabledReason="Need at least 2 active trainers to archive one"
                                        onClick={() => {
                                            showConfirm({
                                                title: 'Archive Trainer?',
                                                message: `Archive "${trainer.name || 'Unnamed'}"? They'll move to the Archived section and can be restored later.`,
                                                confirmLabel: 'Archive',
                                                onConfirm: () => {
                                                    archiveTrainer(activeTrainerId);
                                                    closeMenus();
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
                                        disabledReason="Cannot delete the only trainer"
                                        onClick={() => {
                                            deleteTrainer(activeTrainerId);
                                            closeMenus();
                                        }}
                                    />
                                </div>

                                {/* Archived Trainers Section */}
                                {archivedTrainers.length > 0 && (
                                    <>
                                        <MenuDivider />
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
                                                            closeMenus();
                                                        }}
                                                        style={{
                                                            padding: '3px 10px',
                                                            fontSize: '11px',
                                                            fontWeight: 700,
                                                            background: '#667eea',
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
            </div>
        </header>
    );
};

export default Header;
