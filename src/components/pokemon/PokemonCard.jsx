// ============================================================
// Pokemon Card Component
// ============================================================

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { getTypeColor, getContrastTextColor } from '../../utils/typeUtils.js';
import { getActualStats, calculatePokemonHP, calculateSTAB } from '../../utils/dataUtils.js';
import { exportSinglePokemon, copyPokemonToClipboard } from '../../utils/exportUtils.js';
import toast from '../../utils/toast.js';
import { useGameData, useModal, usePokemonContext, useUI } from '../../contexts/index.js';
import { MAX_TOTAL_MOVES } from '../../data/constants.js';
import { getPokemonDisplayImage, getPokemonSprite } from '../../utils/pokemonSprite.js';

import { HELP_BTN_STYLE } from '../common/helpBtnStyle.js';

const STATUS_CONDITIONS = [
    { key: 'burned',    label: 'Burned',    icon: '🔥', color: '#f44336' },
    { key: 'frozen',    label: 'Frozen',    icon: '🧊', color: '#42a5f5' },
    { key: 'paralyzed', label: 'Paralyzed', icon: '⚡', color: '#ffc107' },
    { key: 'poisoned',  label: 'Poisoned',  icon: '☠️', color: '#9c27b0' },
    { key: 'asleep',    label: 'Asleep',    icon: '💤', color: '#607d8b' },
    { key: 'confused',  label: 'Confused',  icon: '💫', color: '#ff9800' },
    { key: 'flinched',  label: 'Flinched',  icon: '😵', color: '#795548' },
    { key: 'fainted',   label: 'Fainted',   icon: '✖',  color: '#333'    },
];

const PokemonCard = ({
    // Pokemon-specific props (must be passed per-card)
    pokemon,
    isEditing,
    setEditing,
    updatePokemon,
    restorePokemon,
    deletePokemon,
    isInParty,
    canMoveToParty,
    onMoveToParty,
    onMoveToReserve,
    onMoveUp,
    onMoveDown,
    canMoveUp,
    canMoveDown,
    // These props are kept for backward compatibility during migration
    evolvePokemon,
    devolvePokemon,
    // Drag-and-drop props
    isDragging,
    isDragOver,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    // Compare mode props
    compareMode,
    isCompareSelected,
    onToggleCompare
}) => {
    // Get shared state from contexts
    const { pokedex, pokedexLoading, GAME_DATA, customSpecies, setCustomSpecies } = useGameData();
    const { showDetail, setShowCustomSpeciesModal, setEditingCustomSpeciesId, setShowMoveLearnModal, setMoveLearnData, showConfirm } = useModal();
    const { getEvolutionOptions } = usePokemonContext();
    const { showHelp } = useUI();
    const [editTab, setEditTab] = useState('info');
    const [speciesSearch, setSpeciesSearch] = useState('');
    const [speciesTypeFilter, setSpeciesTypeFilter] = useState('all');
    const [speciesSort, setSpeciesSort] = useState('name'); // 'name', 'bst-high', 'bst-low', 'id'
    const [showSpeciesDropdown, setShowSpeciesDropdown] = useState(false);
    // Move selection state
    const [moveSearch, setMoveSearch] = useState('');
    const [moveTypeFilter, setMoveTypeFilter] = useState('all');
    const [moveCategoryFilter, setMoveCategoryFilter] = useState('all');
    const [showMoveDropdown, setShowMoveDropdown] = useState(false);
    // Held item selection state
    const [heldItemSearch, setHeldItemSearch] = useState('');
    const [showHeldItemDropdown, setShowHeldItemDropdown] = useState(false);
    // Collapsed view expanded sections
    const [expandedSection, setExpandedSection] = useState(null); // 'abilities', 'moves', 'skills', or null
    // Regional form selection state
    const [showRegionalFormSelect, setShowRegionalFormSelect] = useState(false);
    const [pendingSpeciesData, setPendingSpeciesData] = useState(null);

    // Snapshot taken when editing opens — used to revert on Cancel.
    // Only captured once per edit session (not updated as the user types).
    const [snapshot, setSnapshot] = useState(null);
    const snapshotTaken = useRef(false);
    useEffect(() => {
        if (isEditing && !snapshotTaken.current) {
            snapshotTaken.current = true;
            setSnapshot({ ...pokemon });
        } else if (!isEditing) {
            snapshotTaken.current = false;
            setSnapshot(null);
        }
        // Intentionally omit `pokemon` — we want the state at edit-open, not on every change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing]);

    const actualStats = useMemo(() => getActualStats(pokemon), [pokemon]);
    const maxHP = useMemo(() => calculatePokemonHP(pokemon), [pokemon]);
    const currentHP = maxHP - (pokemon.currentDamage || 0);
    const stabBonus = useMemo(() => calculateSTAB(), []);

    const primaryType = pokemon.types?.[0] || 'Normal';
    const secondaryType = pokemon.types?.[1] || null;
    const primaryColor = getTypeColor(primaryType);
    const secondaryColor = secondaryType ? getTypeColor(secondaryType) : primaryColor;
    // For backwards compatibility
    const borderColor = primaryColor;

    // Pokemon type colors for filter chips
    const pokemonTypes = ['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'];

    // Calculate base stat total
    const getBaseStatTotal = (pokemon) => {
        if (!pokemon.baseStats) return 0;
        const stats = pokemon.baseStats;
        return (stats.hp || 0) + (stats.atk || 0) + (stats.def || 0) + (stats.satk || 0) + (stats.sdef || 0) + (stats.spd || 0);
    };

    // Filter and sort species for selection (includes custom species)
    const filteredSpecies = useMemo(() => {
        if (!pokedex) return [];

        // Combine pokedex with custom species
        let results = [...pokedex, ...(customSpecies || [])];

        // Apply type filter (check both base form and regional forms)
        if (speciesTypeFilter !== 'all') {
            results = results.filter(p => {
                // Check base form types
                const baseMatch = p.types && p.types.some(t => t.toLowerCase() === speciesTypeFilter.toLowerCase());
                if (baseMatch) return true;

                // Check regional form types
                if (p.regionalForms) {
                    return p.regionalForms.some(form =>
                        form.types && form.types.some(t => t.toLowerCase() === speciesTypeFilter.toLowerCase())
                    );
                }
                return false;
            });
        }

        // Apply search filter (check species name and regional form names)
        if (speciesSearch) {
            const search = speciesSearch.toLowerCase();
            results = results.filter(p => {
                // Check species name
                if (p.species.toLowerCase().includes(search)) return true;

                // Check regional form names (e.g., "Alolan", "Galarian")
                if (p.regionalForms) {
                    return p.regionalForms.some(form =>
                        form.name && form.name.toLowerCase().includes(search)
                    );
                }
                return false;
            });
        }

        // Apply sorting (custom species first when sorting by name)
        results.sort((a, b) => {
            // Custom species always come first
            if (a.isCustom && !b.isCustom) return -1;
            if (!a.isCustom && b.isCustom) return 1;

            switch (speciesSort) {
                case 'name':
                    return a.species.localeCompare(b.species);
                case 'bst-high':
                    return getBaseStatTotal(b) - getBaseStatTotal(a);
                case 'bst-low':
                    return getBaseStatTotal(a) - getBaseStatTotal(b);
                case 'id':
                    return (a.id || 0) - (b.id || 0);
                default:
                    return a.species.localeCompare(b.species);
            }
        });

        return results.slice(0, 50); // Increased limit
    }, [pokedex, customSpecies, speciesSearch, speciesTypeFilter, speciesSort]);

    // Filter held items for selection
    const filteredHeldItems = useMemo(() => {
        if (!GAME_DATA?.items) return [];
        let items = Object.entries(GAME_DATA.items);
        // Prefer items tagged as held/hold; if none, show all
        const heldItems = items.filter(([_, d]) =>
            typeof d.type === 'string' && /held|hold/i.test(d.type)
        );
        const sourceItems = heldItems.length > 0 ? heldItems : items;
        if (heldItemSearch) {
            const q = heldItemSearch.toLowerCase();
            return sourceItems.filter(([name, d]) =>
                name.toLowerCase().includes(q) || (d.effect || '').toLowerCase().includes(q)
            ).slice(0, 50);
        }
        return sourceItems.slice(0, 50);
    }, [heldItemSearch, GAME_DATA]);

    // Filter and sort moves for selection
    const filteredMoves = useMemo(() => {
        if (!GAME_DATA?.moves) return [];

        let moves = Object.entries(GAME_DATA.moves);

        // Apply type filter
        if (moveTypeFilter !== 'all') {
            moves = moves.filter(([_, data]) =>
                data.type && data.type.toLowerCase() === moveTypeFilter.toLowerCase()
            );
        }

        // Apply category filter
        if (moveCategoryFilter !== 'all') {
            moves = moves.filter(([_, data]) =>
                data.category && data.category.toLowerCase() === moveCategoryFilter.toLowerCase()
            );
        }

        // Apply search filter
        if (moveSearch) {
            const search = moveSearch.toLowerCase();
            moves = moves.filter(([name, data]) =>
                name.toLowerCase().includes(search) ||
                (data.effect || '').toLowerCase().includes(search)
            );
        }

        // Sort alphabetically by name
        moves.sort((a, b) => a[0].localeCompare(b[0]));

        return moves.slice(0, 100);
    }, [moveSearch, moveTypeFilter, moveCategoryFilter, GAME_DATA]);

    // Helper function to add a move to the pool
    const addMoveWithSource = (moveName, moveData, source) => {
        // Check if already knows move
        const alreadyKnows = pokemon.moves?.some(m =>
            m.name?.toLowerCase() === moveName?.toLowerCase()
        );
        if (alreadyKnows) {
            toast.warning(`${pokemon.name || pokemon.species} already knows ${moveName}!`);
            return;
        }

        // PTA3: single pool of MAX_TOTAL_MOVES (6) — show replacement modal when at limit
        if ((pokemon.moves?.length || 0) >= MAX_TOTAL_MOVES) {
            setMoveLearnData({
                pokemonId: pokemon.id,
                pokemonName: pokemon.name || pokemon.species,
                newMove: {
                    move: moveName,
                    type: moveData.type,
                    category: moveData.category,
                    damage: moveData.damage,
                    frequency: moveData.frequency,
                    range: moveData.range,
                    effect: moveData.effect,
                    source: source
                },
                currentMoves: pokemon.moves || [],
                inParty: isInParty,
                source: source
            });
            setShowMoveLearnModal(true);
            return;
        }

        updatePokemon({
            moves: [...(pokemon.moves || []), {
                name: moveName,
                type: moveData.type,
                category: moveData.category,
                damage: moveData.damage,
                frequency: moveData.frequency,
                range: moveData.range,
                effect: moveData.effect,
                source: source
            }]
        });

        setMoveSearch('');
        setMoveTypeFilter('all');
        setMoveCategoryFilter('all');
    };

    // Get all available abilities from species data
    const getAvailableAbilities = (speciesData) => {
        const abilities = [];
        if (speciesData?.abilities) {
            if (speciesData.abilities.basic) {
                speciesData.abilities.basic.forEach(a => abilities.push({ name: a, type: 'Basic' }));
            }
            if (speciesData.abilities.adv) {
                speciesData.abilities.adv.forEach(a => abilities.push({ name: a, type: 'Advanced' }));
            }
            if (speciesData.abilities.high) {
                speciesData.abilities.high.forEach(a => abilities.push({ name: a, type: 'High' }));
            }
        }
        return abilities;
    };

    // Derive available abilities from pokedex if not stored on pokemon
    const derivedAbilities = useMemo(() => {
        if (pokemon.availableAbilities && pokemon.availableAbilities.length > 0) {
            return pokemon.availableAbilities;
        }
        if (pokedex && pokemon.species) {
            const speciesData = pokedex.find(p => p.species === pokemon.species);
            if (speciesData) {
                return getAvailableAbilities(speciesData);
            }
        }
        return [];
    }, [pokemon.availableAbilities, pokemon.species, pokedex]);

    const handleSelectSpecies = (speciesData) => {
        // Check if species has regional forms - let user choose
        if (speciesData.regionalForms && speciesData.regionalForms.length > 0) {
            setPendingSpeciesData(speciesData);
            setShowRegionalFormSelect(true);
            setShowSpeciesDropdown(false);
            return;
        }

        // No regional forms, apply directly
        applySpeciesForm(speciesData, null);
    };

    const applySpeciesForm = (speciesData, regionalForm) => {
        const isRegional = regionalForm && !regionalForm.isBase;
        const formData = isRegional ? regionalForm : null;

        // Use form-specific data if regional, otherwise use base species data
        const types = formData?.types || speciesData.types || [];
        const baseStats = formData?.baseStats || speciesData.baseStats || { hp: 10, atk: 10, def: 10, satk: 10, sdef: 10, spd: 10 };
        const abilities = formData?.abilities || speciesData.abilities;
        const levelUpMoves = formData?.levelUpMoves || speciesData.levelUpMoves || [];

        // Build available abilities from the correct form
        const availableAbilities = [];
        if (abilities) {
            if (abilities.basic) abilities.basic.forEach(a => availableAbilities.push({ name: a, tier: 'Basic' }));
            if (abilities.adv) abilities.adv.forEach(a => availableAbilities.push({ name: a, tier: 'Advanced' }));
            if (abilities.high) abilities.high.forEach(a => availableAbilities.push({ name: a, tier: 'High' }));
        }

        const initialAbilities = availableAbilities.length > 0 ? [availableAbilities[0].name] : [];

        // Auto-add starting moves (PTA3: all moves available, no level gate)
        const startingMoves = levelUpMoves
            .slice(0, MAX_TOTAL_MOVES)
            .map(m => ({
                name: m.name || m.move,
                source: 'natural',
                learnedAtLevel: m.level,
                type: m.type || 'Normal',
                category: m.category || 'Physical',
                frequency: m.frequency || 'At-Will',
                damage: m.damage || '',
                range: m.range || 'Melee',
                effect: m.effect || ''
            }));

        updatePokemon({
            species: speciesData.species,
            name: pokemon.name === 'New Pokemon' || !pokemon.name ? speciesData.species : pokemon.name,
            types: types,
            baseStats: baseStats,
            abilities: initialAbilities,
            availableAbilities: availableAbilities,
            availableLevelUpMoves: levelUpMoves,
            moves: startingMoves,
            passives: formData?.passives || speciesData.passives || [],
            regionalForm: isRegional ? regionalForm.name : null,
            pokemonSkills: Array.isArray(speciesData.skills)
                ? speciesData.skills.filter(Boolean).map(s => ({ name: s }))
                : speciesData.skills
                    ? Object.entries(speciesData.skills).map(([name, value]) => ({ name, value }))
                    : []
        });
        setSpeciesSearch('');
        setShowSpeciesDropdown(false);
        setShowRegionalFormSelect(false);
        setPendingSpeciesData(null);
        setSpeciesTypeFilter('all');
    };

    // Collapsed view
    if (!isEditing) {
        return (
            <div
                className="pokemon-card pokemon-card-collapsed"
                draggable={!compareMode}
                onDragStart={!compareMode ? (e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart?.(pokemon.id); } : undefined}
                onDragOver={!compareMode ? (e) => { e.preventDefault(); onDragOver?.(pokemon.id); } : undefined}
                onDrop={!compareMode ? (e) => { e.preventDefault(); onDrop?.(pokemon.id); } : undefined}
                onDragEnd={!compareMode ? () => onDragEnd?.() : undefined}
                style={{
                    borderLeft: secondaryType
                        ? `5px solid ${primaryColor}`
                        : `5px solid ${primaryColor}`,
                    borderRight: secondaryType
                        ? `3px solid ${secondaryColor}`
                        : 'none',
                    opacity: isDragging ? 0.4 : 1,
                    outline: isDragOver ? '2px dashed #667eea' : 'none',
                    transition: 'opacity 0.2s, outline 0.1s'
                }}
                onClick={() => { if (!compareMode) setEditing(true); }}
            >
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    {/* Drag grip handle or Compare checkbox */}
                    {compareMode ? (
                        <div
                            onClick={(e) => { e.stopPropagation(); onToggleCompare?.(pokemon.id); }}
                            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px' }}
                        >
                            <input
                                type="checkbox"
                                checked={!!isCompareSelected}
                                onChange={() => onToggleCompare?.(pokemon.id)}
                                onClick={(e) => e.stopPropagation()}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                        </div>
                    ) : (
                        <div
                            title="Drag to reorder"
                            style={{ flexShrink: 0, cursor: 'grab', fontSize: '18px', color: 'var(--text-muted, #aaa)', userSelect: 'none', width: '20px', textAlign: 'center' }}
                        >
                            ⠿
                        </div>
                    )}
                    {/* Avatar */}
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: `radial-gradient(circle at 38% 32%, rgba(255,255,255,0.3) 0%, ${primaryColor}88 50%, ${secondaryColor}ee 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        overflow: 'hidden',
                        boxShadow: `0 2px 10px ${primaryColor}55`
                    }}>
                        {(() => {
                            const img = getPokemonDisplayImage(pokemon);
                            return img
                                ? <img src={img} alt="" style={{ width: '56px', height: '56px', objectFit: 'cover' }} />
                                : <span style={{ fontSize: '24px' }}>🔴</span>;
                        })()}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                                {pokemon.name || pokemon.species || 'Unknown'}
                            </span>
                            {pokemon.species && pokemon.species !== pokemon.name && (
                                <span className="text-muted" style={{ fontSize: '13px' }}>({pokemon.species})</span>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                            {pokemon.types?.map(type => (
                                <span
                                    key={type}
                                    style={{
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        background: getTypeColor(type),
                                        color: getContrastTextColor(getTypeColor(type)),
                                        fontSize: '10px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {type}
                                </span>
                            ))}
                            {pokemon.heldItem && (() => {
                                const itemData = GAME_DATA?.items?.[pokemon.heldItem];
                                return (
                                    <span
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (showDetail && itemData) showDetail('item', pokemon.heldItem, itemData);
                                        }}
                                        title={itemData ? 'Click to view item details' : pokemon.heldItem}
                                        style={{
                                            padding: '2px 8px',
                                            borderRadius: '10px',
                                            background: 'rgba(102,126,234,0.15)',
                                            color: 'var(--text-primary)',
                                            fontSize: '10px',
                                            fontWeight: 'bold',
                                            border: '1px solid rgba(102,126,234,0.3)',
                                            cursor: showDetail && itemData ? 'pointer' : 'default'
                                        }}
                                    >
                                        🎒 {pokemon.heldItem}
                                    </span>
                                );
                            })()}
                        </div>

                        {/* Status Conditions — read-only display */}
                        {(() => {
                            const active = STATUS_CONDITIONS.filter(c => pokemon.statusConditions?.[c.key]);
                            if (!active.length) return null;
                            return (
                                <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                                    {active.map(c => (
                                        <span key={c.key} style={{
                                            padding: '1px 6px', borderRadius: '10px',
                                            background: c.color, color: 'white',
                                            fontSize: '10px', fontWeight: 'bold'
                                        }}>
                                            {c.icon} {c.label}
                                        </span>
                                    ))}
                                </div>
                            );
                        })()}

                        {/* HP Bar - More Visible */}
                        <div style={{ marginTop: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    flex: 1,
                                    height: '8px',
                                    background: 'var(--collapsed-hp-track)',
                                    borderRadius: '4px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${Math.max(0, Math.min(100, (currentHP / maxHP) * 100))}%`,
                                        height: '100%',
                                        background: currentHP / maxHP > 0.5 ? '#4caf50' : currentHP / maxHP > 0.25 ? '#ff9800' : '#f44336',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: currentHP / maxHP > 0.5 ? '#4caf50' : currentHP / maxHP > 0.25 ? '#ff9800' : '#f44336', minWidth: '55px' }}>
                                    {currentHP}/{maxHP}
                                </span>
                            </div>
                            <span className="text-muted" style={{ fontSize: '12px' }}>
                                {pokemon.nature || 'Hardy'} Nature
                            </span>
                        </div>

                        {/* Expandable Section Buttons */}
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                            {/* Passives Button */}
                            {(() => {
                                const passives = (pokemon.passives && pokemon.passives.length > 0)
                                    ? pokemon.passives
                                    : (pokemon.abilities && pokemon.abilities.length > 0)
                                        ? pokemon.abilities
                                        : (pokemon.ability ? [pokemon.ability] : []);
                                return passives.length > 0 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedSection(expandedSection === 'abilities' ? null : 'abilities');
                                        }}
                                        style={{
                                            padding: '4px 10px',
                                            borderRadius: '12px',
                                            border: 'none',
                                            background: expandedSection === 'abilities' ? 'linear-gradient(135deg, #f093fb, #f5576c)' : 'var(--collapsed-btn-bg)',
                                            color: expandedSection === 'abilities' ? 'white' : 'var(--collapsed-btn-text)',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <span>✨</span> Passives ({passives.length})
                                    </button>
                                );
                            })()}
                            {/* Moves Button */}
                            {(pokemon.moves || []).length > 0 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedSection(expandedSection === 'moves' ? null : 'moves');
                                    }}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: expandedSection === 'moves' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'var(--collapsed-btn-bg)',
                                        color: expandedSection === 'moves' ? 'white' : 'var(--collapsed-btn-text)',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    <span>⚔️</span> Moves ({(pokemon.moves || []).length})
                                </button>
                            )}
                            {/* Skills Button */}
                            {(pokemon.pokemonSkills || []).filter(s => s.name && (s.value === undefined || s.value > 0)).length > 0 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedSection(expandedSection === 'skills' ? null : 'skills');
                                    }}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: expandedSection === 'skills' ? 'linear-gradient(135deg, #9c27b0, #4caf50)' : 'var(--collapsed-btn-bg)',
                                        color: expandedSection === 'skills' ? 'white' : 'var(--collapsed-btn-text)',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    <span>🐾</span> Skills ({(pokemon.pokemonSkills || []).filter(s => s.name && (s.value === undefined || s.value > 0)).length})
                                </button>
                            )}
                        </div>

                        {/* Expanded Passives */}
                        {expandedSection === 'abilities' && (() => {
                            const abilities = (pokemon.passives && pokemon.passives.length > 0)
                                ? pokemon.passives
                                : (pokemon.abilities && pokemon.abilities.length > 0)
                                    ? pokemon.abilities
                                    : (pokemon.ability ? [pokemon.ability] : []);
                            return (
                                <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap', padding: '8px', background: 'var(--collapsed-abilities-bg)', borderRadius: '8px' }}>
                                    {abilities.map((abilityName, idx) => (
                                        <span
                                            key={idx}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (showDetail) {
                                                    const abilityData = GAME_DATA?.abilities?.[abilityName];
                                                    if (abilityData) showDetail('ability', abilityName, abilityData);
                                                }
                                            }}
                                            style={{
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                                                color: 'white',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {abilityName}
                                        </span>
                                    ))}
                                </div>
                            );
                        })()}

                        {/* Expanded Moves */}
                        {expandedSection === 'moves' && (
                            <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap', padding: '8px', background: 'var(--collapsed-moves-bg)', borderRadius: '8px' }}>
                                {(pokemon.moves || []).map((move, idx) => (
                                    <span
                                        key={idx}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (showDetail) {
                                                const moveData = GAME_DATA?.moves?.[move.name] || move;
                                                showDetail('move', move.name, { ...moveData, type: move.type });
                                            }
                                        }}
                                        style={{
                                            padding: '4px 10px',
                                            borderRadius: '12px',
                                            background: getTypeColor(move.type),
                                            color: getContrastTextColor(getTypeColor(move.type)),
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {move.name}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Expanded Skills */}
                        {expandedSection === 'skills' && (
                            <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap', padding: '8px', background: 'var(--collapsed-skills-bg)', borderRadius: '8px' }}>
                                {(pokemon.pokemonSkills || []).filter(s => s.name && (s.value === undefined || s.value > 0)).map((skill, idx) => (
                                    <span
                                        key={idx}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (showDetail) {
                                                let skillData = GAME_DATA?.pokemonSkills?.[skill.name];
                                                if (!skillData && GAME_DATA?.pokemonSkills) {
                                                    const normalizedName = skill.name.toLowerCase().replace(/\s+/g, '');
                                                    const matchingKey = Object.keys(GAME_DATA.pokemonSkills).find(key =>
                                                        key.toLowerCase().replace(/\s+/g, '') === normalizedName
                                                    );
                                                    if (matchingKey) skillData = GAME_DATA.pokemonSkills[matchingKey];
                                                }
                                                showDetail('pokemonSkill', skill.name, { ...skillData, value: skill.value });
                                            }
                                        }}
                                        style={{
                                            padding: '4px 10px',
                                            borderRadius: '12px',
                                            background: skill.value !== undefined
                                                ? 'linear-gradient(135deg, #9c27b0, #7b1fa2)'
                                                : 'linear-gradient(135deg, #4caf50, #388e3c)',
                                            color: 'white',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {skill.name}{skill.value !== undefined ? ` ${skill.value}` : ''}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div style={{ display: 'flex', gap: '4px', flexDirection: 'column', alignItems: 'flex-end' }}>
                        {canMoveUp && (
                            <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} style={quickBtnLabelStyle} className="quick-action-btn">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="18 15 12 9 6 15"></polyline>
                                </svg>
                                <span>Up</span>
                            </button>
                        )}
                        {canMoveDown && (
                            <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} style={quickBtnLabelStyle} className="quick-action-btn">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                                <span>Down</span>
                            </button>
                        )}
                        {/* Move to Party/Reserve Button */}
                        {isInParty ? (
                            <button
                                onClick={(e) => { e.stopPropagation(); onMoveToReserve && onMoveToReserve(); }}
                                style={{ ...quickBtnLabelStyle, background: 'var(--collapsed-reserve-btn-bg)', borderColor: '#ff9800', color: '#e65100' }}
                                className="quick-action-btn"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e65100" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7"/>
                                </svg>
                                <span>Reserve</span>
                            </button>
                        ) : (
                            <button
                                onClick={(e) => { e.stopPropagation(); canMoveToParty && onMoveToParty && onMoveToParty(); }}
                                disabled={!canMoveToParty}
                                style={{
                                    ...quickBtnLabelStyle,
                                    background: canMoveToParty ? 'var(--collapsed-party-btn-bg)' : 'var(--collapsed-btn-bg)',
                                    borderColor: canMoveToParty ? '#4caf50' : 'var(--collapsed-quick-btn-border)',
                                    color: canMoveToParty ? '#2e7d32' : 'var(--collapsed-btn-text)',
                                    cursor: canMoveToParty ? 'pointer' : 'not-allowed',
                                    opacity: canMoveToParty ? 1 : 0.7
                                }}
                                title={canMoveToParty ? 'Move to Party' : 'Party is full (6/6)'}
                                className="quick-action-btn"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={canMoveToParty ? '#2e7d32' : 'var(--collapsed-btn-text)'} strokeWidth="2">
                                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                                </svg>
                                <span>Party</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Expanded/Editing view
    return (
        <div
            className="pokemon-card pokemon-card-expanded"
            style={{
                borderLeft: `5px solid ${primaryColor}`,
                borderRight: secondaryType ? `3px solid ${secondaryColor}` : 'none'
            }}
        >
            {/* Header */}
            <div style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                padding: '15px',
                color: 'white'
            }}>
                <div className="pokemon-expanded-header">
                    <div className="pokemon-expanded-header-left">
                        <input
                            type="text"
                            value={pokemon.name || ''}
                            onChange={(e) => updatePokemon({ name: e.target.value })}
                            placeholder="Nickname"
                            className="pokemon-expanded-nickname"
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: 'bold',
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button
                            onClick={() => {
                                if (snapshot && restorePokemon) {
                                    restorePokemon(snapshot);
                                }
                                setEditing(false);
                            }}
                            style={{
                                background: 'rgba(0,0,0,0.25)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => setEditing(false)}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit Tabs */}
            <div className="tabs pokemon-card-tabs" style={{ padding: '0 15px' }}>
                {['info', 'stats', 'moves', 'skills', 'evolution'].map(tab => (
                    <button
                        key={tab}
                        className={`tab ${editTab === tab ? 'active' : ''}`}
                        onClick={() => setEditTab(tab)}
                        style={{ textTransform: 'capitalize' }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div style={{ padding: '15px' }}>
                {editTab === 'info' && (
                    <div>
                        {/* Species Selection */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                                Species
                            </label>
                            <div style={{ position: 'relative' }}>
                                {/* Search Input */}
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        value={speciesSearch || (showSpeciesDropdown ? '' : pokemon.species) || ''}
                                        onChange={(e) => {
                                            setSpeciesSearch(e.target.value);
                                            setShowSpeciesDropdown(true);
                                        }}
                                        onFocus={() => setShowSpeciesDropdown(true)}
                                        placeholder="Search species by name..."
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            paddingRight: speciesSearch ? '32px' : '10px',
                                            borderRadius: '6px',
                                            border: showSpeciesDropdown ? '2px solid #667eea' : '1px solid var(--species-input-border)',
                                            boxSizing: 'border-box',
                                            background: 'var(--species-dropdown-bg)',
                                            color: 'var(--text-primary)'
                                        }}
                                    />
                                    {speciesSearch && (
                                        <button
                                            onClick={() => setSpeciesSearch('')}
                                            style={{
                                                position: 'absolute',
                                                right: '8px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'var(--species-muted-text)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '20px',
                                                height: '20px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            aria-label="Clear species search"
                                        >✕</button>
                                    )}
                                </div>

                                {/* Species Dropdown */}
                                {showSpeciesDropdown && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        background: 'var(--species-dropdown-bg)',
                                        border: '2px solid #667eea',
                                        borderTop: 'none',
                                        borderRadius: '0 0 8px 8px',
                                        zIndex: 100,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                    }}>
                                        {/* Filter & Sort Controls */}
                                        <div style={{
                                            padding: '10px',
                                            background: 'var(--species-filter-bg)',
                                            borderBottom: '1px solid var(--species-border)'
                                        }}>
                                            {/* Type Filter Chips */}
                                            <div style={{ marginBottom: '8px' }}>
                                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--species-label-text)', marginBottom: '4px' }}>Filter by Type:</div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                    <button
                                                        onClick={() => setSpeciesTypeFilter('all')}
                                                        style={{
                                                            padding: '4px 8px',
                                                            borderRadius: '12px',
                                                            border: 'none',
                                                            background: speciesTypeFilter === 'all' ? '#667eea' : 'var(--species-filter-inactive)',
                                                            color: speciesTypeFilter === 'all' ? 'white' : 'var(--species-label-text)',
                                                            fontSize: '10px',
                                                            fontWeight: 'bold',
                                                            cursor: 'pointer'
                                                        }}
                                                    >All</button>
                                                    {pokemonTypes.map(type => (
                                                        <button
                                                            key={type}
                                                            onClick={() => setSpeciesTypeFilter(type)}
                                                            style={{
                                                                padding: '4px 8px',
                                                                borderRadius: '12px',
                                                                border: 'none',
                                                                background: speciesTypeFilter === type ? getTypeColor(type) : 'var(--species-filter-inactive)',
                                                                color: speciesTypeFilter === type ? 'white' : 'var(--species-label-text)',
                                                                fontSize: '10px',
                                                                fontWeight: 'bold',
                                                                cursor: 'pointer'
                                                            }}
                                                        >{type}</button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Sort Controls */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--species-label-text)' }}>Sort:</span>
                                                    <select
                                                        value={speciesSort}
                                                        onChange={(e) => setSpeciesSort(e.target.value)}
                                                        style={{
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            border: '1px solid var(--species-input-border)',
                                                            fontSize: '12px',
                                                            cursor: 'pointer',
                                                            background: 'var(--species-dropdown-bg)',
                                                            color: 'var(--text-primary)'
                                                        }}
                                                    >
                                                        <option value="name">Name (A-Z)</option>
                                                        <option value="id">Dex Number</option>
                                                        <option value="bst-high">BST (High → Low)</option>
                                                        <option value="bst-low">BST (Low → High)</option>
                                                    </select>
                                                </div>
                                                <span style={{ fontSize: '11px', color: 'var(--species-muted-text)' }}>
                                                    {filteredSpecies.length} results
                                                </span>
                                            </div>
                                        </div>

                                        {/* Species List */}
                                        <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                            {pokedexLoading ? (
                                                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--species-muted-text)' }}>
                                                    <div style={{
                                                        width: '24px',
                                                        height: '24px',
                                                        border: '3px solid var(--border-light)',
                                                        borderTopColor: '#667eea',
                                                        borderRadius: '50%',
                                                        animation: 'spin 1s linear infinite',
                                                        margin: '0 auto 10px'
                                                    }} />
                                                    <div style={{ fontSize: '12px' }}>Loading Pokédex...</div>
                                                </div>
                                            ) : filteredSpecies.length > 0 ? (
                                                filteredSpecies.map(sp => {
                                                    const hasRegionalForms = sp.regionalForms && sp.regionalForms.length > 0;
                                                    // Get all unique types from regional forms
                                                    const regionalTypes = hasRegionalForms
                                                        ? [...new Set(sp.regionalForms.flatMap(f => f.types || []))]
                                                            .filter(t => !sp.types?.includes(t))
                                                        : [];

                                                    return (
                                                        <div
                                                            key={sp.id}
                                                            onClick={() => handleSelectSpecies(sp)}
                                                            className="species-list-item"
                                                            style={{
                                                                padding: '10px 12px',
                                                                cursor: 'pointer',
                                                                borderBottom: '1px solid var(--species-border)',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                transition: 'background 0.15s'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--species-hover-bg)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <span style={{ fontWeight: 'bold' }}>{sp.species}</span>
                                                                {sp.isCustom ? (
                                                                    <span style={{
                                                                        fontSize: '9px',
                                                                        color: 'white',
                                                                        background: '#667eea',
                                                                        padding: '1px 4px',
                                                                        borderRadius: '4px',
                                                                        fontWeight: 'bold'
                                                                    }}>
                                                                        Custom
                                                                    </span>
                                                                ) : (
                                                                    <span style={{ fontSize: '11px', color: 'var(--species-muted-text)' }}>
                                                                        #{sp.id || '???'}
                                                                    </span>
                                                                )}
                                                                {hasRegionalForms && (
                                                                    <span style={{ fontSize: '10px', color: '#9c27b0' }}>
                                                                        🌍
                                                                    </span>
                                                                )}
                                                                {/* Edit/Delete buttons for custom species */}
                                                                {sp.isCustom && setCustomSpecies && (
                                                                    <>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (setEditingCustomSpeciesId) {
                                                                                    setEditingCustomSpeciesId(sp.id);
                                                                                }
                                                                                if (setShowCustomSpeciesModal) {
                                                                                    setShowCustomSpeciesModal(true);
                                                                                }
                                                                                setShowSpeciesDropdown(false);
                                                                            }}
                                                                            style={{
                                                                                padding: '1px 5px',
                                                                                background: '#667eea',
                                                                                color: 'white',
                                                                                border: 'none',
                                                                                borderRadius: '3px',
                                                                                fontSize: '9px',
                                                                                cursor: 'pointer',
                                                                                marginLeft: '4px'
                                                                            }}
                                                                            title="Edit custom species"
                                                                        >Edit</button>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                showConfirm({
                                                                                    title: 'Delete Species',
                                                                                    message: `Delete custom species "${sp.species}"?`,
                                                                                    danger: true,
                                                                                    onConfirm: () => setCustomSpecies(prev => prev.filter(s => s.id !== sp.id))
                                                                                });
                                                                            }}
                                                                            style={{
                                                                                padding: '1px 5px',
                                                                                background: '#f44336',
                                                                                color: 'white',
                                                                                border: 'none',
                                                                                borderRadius: '3px',
                                                                                fontSize: '9px',
                                                                                cursor: 'pointer'
                                                                            }}
                                                                            title="Delete custom species"
                                                                            aria-label="Delete custom species"
                                                                        >×</button>
                                                                    </>
                                                                )}
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                                {sp.types?.map(t => (
                                                                    <span
                                                                        key={t}
                                                                        style={{
                                                                            padding: '2px 6px',
                                                                            background: getTypeColor(t),
                                                                            color: 'white',
                                                                            borderRadius: '8px',
                                                                            fontSize: '10px',
                                                                            fontWeight: 'bold'
                                                                        }}
                                                                    >{t}</span>
                                                                ))}
                                                                {regionalTypes.map(t => (
                                                                    <span
                                                                        key={`regional-${t}`}
                                                                        style={{
                                                                            padding: '2px 6px',
                                                                            background: getTypeColor(t),
                                                                            color: 'white',
                                                                            borderRadius: '8px',
                                                                            fontSize: '10px',
                                                                            fontWeight: 'bold',
                                                                            opacity: 0.6,
                                                                            border: '1px dashed white'
                                                                        }}
                                                                        title="Regional form type"
                                                                    >{t}</span>
                                                                ))}
                                                                <span style={{ fontSize: '10px', color: 'var(--species-muted-text)', marginLeft: '4px' }}>
                                                                    BST: {getBaseStatTotal(sp)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--species-muted-text)' }}>
                                                    {speciesSearch || speciesTypeFilter !== 'all'
                                                        ? 'No Pokemon match your search/filter'
                                                        : 'Use filters or search to find Pokemon'}
                                                </div>
                                            )}
                                        </div>

                                        {/* Bottom Buttons */}
                                        <div style={{
                                            padding: '8px',
                                            borderTop: '1px solid var(--species-border)',
                                            background: 'var(--species-filter-bg)',
                                            display: 'flex',
                                            gap: '8px',
                                            justifyContent: 'center'
                                        }}>
                                            {setShowCustomSpeciesModal && (
                                                <button
                                                    onClick={() => {
                                                        setShowSpeciesDropdown(false);
                                                        setShowCustomSpeciesModal(true);
                                                    }}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: '#667eea',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        fontSize: '11px',
                                                        fontWeight: 'bold',
                                                        cursor: 'pointer'
                                                    }}
                                                >+ Custom Species</button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setShowSpeciesDropdown(false);
                                                    setSpeciesSearch('');
                                                    setSpeciesTypeFilter('all');
                                                }}
                                                style={{
                                                    padding: '6px 16px',
                                                    background: '#f44336',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer'
                                                }}
                                            >Close</button>
                                        </div>
                                    </div>
                                )}

                                {/* Regional Form Selection Modal */}
                                {showRegionalFormSelect && pendingSpeciesData && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        background: 'var(--species-dropdown-bg)',
                                        border: '1px solid var(--species-input-border)',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                        zIndex: 1001,
                                        marginTop: '4px'
                                    }}>
                                        <div style={{
                                            padding: '12px',
                                            borderBottom: '1px solid var(--species-border)',
                                            background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)',
                                            borderRadius: '8px 8px 0 0',
                                            color: 'white'
                                        }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                                🌍 Choose Form for {pendingSpeciesData.species}
                                            </div>
                                            <div style={{ fontSize: '12px', opacity: 0.9 }}>
                                                This Pokémon has regional variants
                                            </div>
                                        </div>

                                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            {/* Normal Form */}
                                            <div
                                                onClick={() => applySpeciesForm(pendingSpeciesData, { isBase: true })}
                                                style={{
                                                    padding: '12px',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid var(--species-border)',
                                                    transition: 'background 0.15s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--species-hover-bg)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <span style={{ fontWeight: 'bold' }}>🔵 Normal Form</span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        {pendingSpeciesData.types?.map(t => (
                                                            <span
                                                                key={t}
                                                                style={{
                                                                    padding: '2px 6px',
                                                                    background: getTypeColor(t),
                                                                    color: 'white',
                                                                    borderRadius: '8px',
                                                                    fontSize: '10px',
                                                                    fontWeight: 'bold'
                                                                }}
                                                            >{t}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Regional Forms */}
                                            {pendingSpeciesData.regionalForms.map((form, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => applySpeciesForm(pendingSpeciesData, form)}
                                                    style={{
                                                        padding: '12px',
                                                        cursor: 'pointer',
                                                        borderBottom: '1px solid var(--species-border)',
                                                        transition: 'background 0.15s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--species-regional-hover)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <span style={{ fontWeight: 'bold' }}>🌴 {form.name} Form</span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                            {form.types?.map(t => (
                                                                <span
                                                                    key={t}
                                                                    style={{
                                                                        padding: '2px 6px',
                                                                        background: getTypeColor(t),
                                                                        color: 'white',
                                                                        borderRadius: '8px',
                                                                        fontSize: '10px',
                                                                        fontWeight: 'bold'
                                                                    }}
                                                                >{t}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Cancel Button */}
                                        <div style={{
                                            padding: '8px',
                                            borderTop: '1px solid var(--species-border)',
                                            background: 'var(--species-filter-bg)',
                                            textAlign: 'center',
                                            borderRadius: '0 0 8px 8px'
                                        }}>
                                            <button
                                                onClick={() => {
                                                    setShowRegionalFormSelect(false);
                                                    setPendingSpeciesData(null);
                                                }}
                                                style={{
                                                    padding: '6px 16px',
                                                    background: '#f44336',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer'
                                                }}
                                            >Cancel</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Nature & Gender */}
                        <div className="pokemon-info-grid">
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>Nature</label>
                                <select
                                    value={pokemon.nature || 'Hardy'}
                                    onChange={(e) => updatePokemon({ nature: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                >
                                    {Object.keys(GAME_DATA.natures || {}).map(nature => (
                                        <option key={nature} value={nature}>{nature}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>Gender</label>
                                <select
                                    value={pokemon.gender || ''}
                                    onChange={(e) => updatePokemon({ gender: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                >
                                    <option value="">Unknown</option>
                                    <option value="male">Male ♂</option>
                                    <option value="female">Female ♀</option>
                                    <option value="genderless">Genderless ⚪</option>
                                </select>
                            </div>
                        </div>

                        {/* Species Passives — up to 3, sourced from Pokédex pool */}
                        {(() => {
                            const speciesEntry = pokedex?.find(p => p.species === pokemon.species);
                            const passivePool = speciesEntry?.passives || [];
                            const selectedPassives = pokemon.passives || [];
                            const unselectedPassives = passivePool.filter(p => !selectedPassives.includes(p));
                            if (passivePool.length === 0 && selectedPassives.length === 0) return null;
                            return (
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Passives</span>
                                        <span className="text-muted" style={{ fontWeight: 'normal' }}>
                                            {selectedPassives.length}/3 selected
                                        </span>
                                    </label>

                                    {/* Selected Passives */}
                                    {selectedPassives.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                                            {selectedPassives.map((passive, idx) => (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '6px 10px',
                                                        background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                                                        color: 'white',
                                                        borderRadius: '16px',
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    <span
                                                        onClick={() => {
                                                            if (!showDetail) return;
                                                            const abilityData = GAME_DATA.abilities?.[passive];
                                                            showDetail(abilityData ? 'ability' : 'feature', passive, abilityData || null);
                                                        }}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        {passive}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            updatePokemon({ passives: selectedPassives.filter(p => p !== passive) });
                                                        }}
                                                        style={{
                                                            background: 'rgba(255,255,255,0.3)',
                                                            border: 'none',
                                                            borderRadius: '50%',
                                                            width: '18px',
                                                            height: '18px',
                                                            color: 'white',
                                                            cursor: 'pointer',
                                                            fontSize: '12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Available Passives to Add */}
                                    {unselectedPassives.length > 0 && (
                                        <div className="abilities-available-box" style={{ padding: '10px', borderRadius: '8px' }}>
                                            <div className="text-muted" style={{ fontSize: '12px', marginBottom: '8px' }}>
                                                Tap to view details, + to add:
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {unselectedPassives.map((passive, idx) => {
                                                    const canAdd = selectedPassives.length < 3;
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className="ability-option"
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                padding: '4px 10px',
                                                                borderRadius: '12px',
                                                                fontSize: '12px',
                                                                opacity: canAdd ? 1 : 0.5
                                                            }}
                                                        >
                                                            <span
                                                                onClick={() => {
                                                                    if (!showDetail) return;
                                                                    const abilityData = GAME_DATA.abilities?.[passive];
                                                                    showDetail(abilityData ? 'ability' : 'feature', passive, abilityData || null);
                                                                }}
                                                                style={{ cursor: 'pointer' }}
                                                            >
                                                                {passive}
                                                            </span>
                                                            {canAdd && (
                                                                <button
                                                                    onClick={() => updatePokemon({ passives: [...selectedPassives, passive] })}
                                                                    style={{
                                                                        background: '#4caf50',
                                                                        border: 'none',
                                                                        borderRadius: '50%',
                                                                        width: '16px',
                                                                        height: '16px',
                                                                        color: 'white',
                                                                        cursor: 'pointer',
                                                                        fontSize: '12px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        marginLeft: '4px'
                                                                    }}
                                                                >
                                                                    +
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Held Item */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                                Held Item
                            </label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        placeholder="Search or type item name..."
                                        value={heldItemSearch || pokemon.heldItem || ''}
                                        onChange={(e) => {
                                            setHeldItemSearch(e.target.value);
                                            setShowHeldItemDropdown(true);
                                        }}
                                        onFocus={() => setShowHeldItemDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowHeldItemDropdown(false), 150)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && heldItemSearch.trim()) {
                                                updatePokemon({ heldItem: heldItemSearch.trim() });
                                                setHeldItemSearch('');
                                                setShowHeldItemDropdown(false);
                                            }
                                        }}
                                        style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px' }}
                                    />
                                    {pokemon.heldItem && (
                                        <button
                                            onClick={() => { updatePokemon({ heldItem: '' }); setHeldItemSearch(''); }}
                                            style={{ padding: '8px 12px', background: '#f44336', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}
                                            title="Clear held item"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                                {pokemon.heldItem && !heldItemSearch && (
                                    <div style={{ marginTop: '6px', padding: '6px 10px', borderRadius: '8px', background: 'var(--badge-bg, rgba(102,126,234,0.1))', fontSize: '12px', fontWeight: 'bold' }}>
                                        🎒 {pokemon.heldItem}
                                    </div>
                                )}
                                {showHeldItemDropdown && filteredHeldItems.length > 0 && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'var(--card-bg, #fff)', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', maxHeight: '200px', overflowY: 'auto', marginTop: '4px' }}>
                                        {filteredHeldItems.map(([name, data]) => (
                                            <div
                                                key={name}
                                                onMouseDown={() => {
                                                    updatePokemon({ heldItem: name });
                                                    setHeldItemSearch('');
                                                    setShowHeldItemDropdown(false);
                                                }}
                                                style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-light, #eee)', fontSize: '13px' }}
                                                className="pokemon-import-option"
                                            >
                                                <div style={{ fontWeight: 'bold' }}>{name}</div>
                                                {data.effect && <div style={{ fontSize: '11px', color: 'var(--text-muted, #888)', marginTop: '2px' }}>{data.effect}</div>}
                                            </div>
                                        ))}
                                        {heldItemSearch && !filteredHeldItems.some(([n]) => n.toLowerCase() === heldItemSearch.toLowerCase()) && (
                                            <div
                                                onMouseDown={() => {
                                                    updatePokemon({ heldItem: heldItemSearch.trim() });
                                                    setHeldItemSearch('');
                                                    setShowHeldItemDropdown(false);
                                                }}
                                                style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '13px', color: '#667eea', fontWeight: 'bold' }}
                                            >
                                                + Use "{heldItemSearch.trim()}" as custom item
                                            </div>
                                        )}
                                    </div>
                                )}
                                {showHeldItemDropdown && filteredHeldItems.length === 0 && heldItemSearch && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'var(--card-bg, #fff)', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', marginTop: '4px' }}>
                                        <div
                                            onMouseDown={() => {
                                                updatePokemon({ heldItem: heldItemSearch.trim() });
                                                setHeldItemSearch('');
                                                setShowHeldItemDropdown(false);
                                            }}
                                            style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '13px', color: '#667eea', fontWeight: 'bold' }}
                                        >
                                            + Use "{heldItemSearch.trim()}" as custom item
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pokemon Image */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                                Pokemon Image
                            </label>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                {(() => {
                                    const autoSprite = getPokemonSprite(pokemon);
                                    const displayImg = pokemon.avatar || autoSprite;
                                    if (displayImg) {
                                        return (
                                            <div style={{ position: 'relative' }}>
                                                <img
                                                    src={displayImg}
                                                    alt={pokemon.name || pokemon.species}
                                                    style={{
                                                        width: '80px',
                                                        height: '80px',
                                                        borderRadius: '8px',
                                                        objectFit: 'cover',
                                                        border: pokemon.avatar ? '2px solid #ddd' : '2px solid transparent',
                                                        imageRendering: !pokemon.avatar ? 'pixelated' : 'auto',
                                                    }}
                                                />
                                                {pokemon.avatar && (
                                                    <button
                                                        onClick={() => updatePokemon({ avatar: '' })}
                                                        style={{
                                                            position: 'absolute',
                                                            top: '-8px',
                                                            right: '-8px',
                                                            width: '22px',
                                                            height: '22px',
                                                            borderRadius: '50%',
                                                            background: '#f44336',
                                                            color: 'white',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            fontSize: '12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    }
                                    return (
                                        <div style={{
                                            width: '80px',
                                            height: '80px',
                                            borderRadius: '8px',
                                            background: '#f0f0f0',
                                            border: '2px dashed #ccc',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#999'
                                        }}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                <polyline points="21 15 16 10 5 21"></polyline>
                                            </svg>
                                        </div>
                                    );
                                })()}
                                <div style={{ flex: 1 }}>
                                    <label
                                        style={{
                                            display: 'inline-block',
                                            padding: '10px 20px',
                                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                            color: 'white',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        Choose Image
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                        updatePokemon({ avatar: event.target.result });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                    <div style={{ fontSize: '12px', color: '#999', marginTop: '6px' }}>
                                        Upload an image file (PNG, JPG, etc.)
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Move Buttons */}
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {isInParty ? (
                                <button
                                    onClick={onMoveToReserve}
                                    style={{ padding: '8px 16px', background: '#ff9800', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                >
                                    Move to Reserve
                                </button>
                            ) : (
                                <button
                                    onClick={canMoveToParty ? onMoveToParty : undefined}
                                    disabled={!canMoveToParty}
                                    title={canMoveToParty ? 'Move to Party' : 'Party is full (6/6)'}
                                    style={{
                                        padding: '8px 16px',
                                        background: canMoveToParty ? '#4caf50' : '#ccc',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: canMoveToParty ? 'pointer' : 'not-allowed',
                                        opacity: canMoveToParty ? 1 : 0.6
                                    }}
                                >
                                    Move to Party
                                </button>
                            )}
                            <button
                                onClick={() => exportSinglePokemon(pokemon)}
                                className="pokemon-action-btn export"
                                title="Export this Pokemon as a file for trading"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                Export
                            </button>
                            <button
                                onClick={() => copyPokemonToClipboard(pokemon)}
                                className="pokemon-action-btn export"
                                style={{ background: '#9c27b0' }}
                                title="Copy Pokemon data to clipboard for sharing"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                                Copy
                            </button>
                            <button
                                onClick={() => {
                                    showConfirm({
                                        title: 'Delete Pokémon',
                                        message: `Delete ${pokemon.name || pokemon.species || 'this Pokémon'}? This cannot be undone.`,
                                        danger: true,
                                        onConfirm: () => deletePokemon()
                                    });
                                }}
                                style={{ padding: '8px 16px', background: '#f44336', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                )}

                {editTab === 'stats' && (
                    <div>
                        <div className="text-muted" style={{ marginBottom: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>Stats are fixed from species data. Nature applies ±1 to highlighted stats.</span>
                            <button
                                onClick={() => showHelp('pokemon-stats')}
                                style={HELP_BTN_STYLE}
                                aria-label="Help: Pokémon Stats"
                                title="About Pokémon stats"
                            >?</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                            {['hp', 'atk', 'def', 'satk', 'sdef', 'spd'].map(stat => {
                                const natureData = GAME_DATA?.natures?.[pokemon.nature || 'Hardy'] || {};
                                const isBuff = natureData.buff === stat;
                                const isNerf = natureData.nerf === stat;
                                return (
                                    <div key={stat} className="bg-light" style={{ padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: isBuff ? '#4caf50' : isNerf ? '#f44336' : '#667eea', marginBottom: '4px' }}>
                                            {stat.toUpperCase()}{isBuff ? ' ▲' : isNerf ? ' ▼' : ''}
                                        </div>
                                        <div className="text-light" style={{ fontSize: '11px' }} title="Base stat from the species Pokédex entry.">
                                            Base: {pokemon.baseStats?.[stat] ?? 0}
                                        </div>
                                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: isBuff ? '#4caf50' : isNerf ? '#f44336' : 'inherit' }} title="Final stat after nature modifier (±1). Used for damage and skill checks.">
                                            {actualStats[stat]}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ marginTop: '15px', padding: '10px', background: '#e8f5e9', borderRadius: '8px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center', fontSize: '12px' }}>
                                <div title="Maximum Hit Points — fixed species HP stat with nature ±1 applied.">
                                    <div style={{ color: '#666' }}>Max HP</div>
                                    <div style={{ fontWeight: 'bold', color: '#e53935' }}>{maxHP}</div>
                                </div>
                                <div title="Same Type Attack Bonus: flat +4 when using moves matching your Pokémon's type.">
                                    <div style={{ color: '#666' }}>STAB Bonus</div>
                                    <div style={{ fontWeight: 'bold', color: '#667eea' }}>+{stabBonus}</div>
                                </div>
                                <div title="Current HP after damage. When reduced to 0, the Pokémon faints.">
                                    <div style={{ color: '#666' }}>Current HP</div>
                                    <div style={{ fontWeight: 'bold', color: '#4caf50' }}>{currentHP}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {editTab === 'moves' && (
                    <div>
                        <div className="text-muted" style={{ marginBottom: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>Moves: {(pokemon.moves || []).length}/{MAX_TOTAL_MOVES} (single pool)</span>
                            <button
                                onClick={() => showHelp('move-slots')}
                                style={HELP_BTN_STYLE}
                                aria-label="Help: Move Slots"
                                title="About move slots"
                            >?</button>
                        </div>

                        {(pokemon.moves || []).map((move, idx) => (
                            <div
                                key={idx}
                                className="move-card"
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '10px',
                                    marginBottom: '6px',
                                    borderRadius: '6px',
                                    borderLeft: `4px solid ${getTypeColor(move.type)}`,
                                    cursor: showDetail ? 'pointer' : 'default'
                                }}
                                onClick={() => {
                                    if (showDetail) {
                                        const moveData = GAME_DATA?.moves?.[move.name] || move;
                                        showDetail('move', move.name, { ...moveData, type: move.type });
                                    }
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{move.name}</div>
                                    <div className="text-muted" style={{ fontSize: '12px' }}>
                                        {move.type} | {move.category} | {move.damage || 'Status'}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        showConfirm({
                                            title: 'Remove Move',
                                            message: `Remove ${move.name} from ${pokemon.name || pokemon.species}?`,
                                            danger: true,
                                            onConfirm: () => {
                                                const newMoves = [...(pokemon.moves || [])];
                                                newMoves.splice(idx, 1);
                                                updatePokemon({ moves: newMoves });
                                            }
                                        });
                                    }}
                                    style={{
                                        background: '#f44336',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}

                        {(pokemon.moves || []).length < MAX_TOTAL_MOVES && (
                            <div className="add-move-panel" style={{ marginTop: '10px', padding: '12px', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#667eea' }}>Add Move</span>
                                    <span style={{ fontSize: '11px', color: '#666' }}>
                                        <span style={{ fontWeight: 'bold' }}>{(pokemon.moves || []).length}/{MAX_TOTAL_MOVES}</span> moves
                                    </span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#888', marginBottom: '10px', fontStyle: 'italic' }}>
                                    Search below, then click <span style={{ background: '#4caf50', color: 'white', padding: '1px 4px', borderRadius: '3px', fontWeight: 'bold', fontStyle: 'normal' }}>+</span> to add a move
                                </div>

                                {/* Search Input */}
                                <div style={{ position: 'relative', marginBottom: '10px' }}>
                                    <input
                                        type="text"
                                        value={moveSearch}
                                        onChange={(e) => {
                                            setMoveSearch(e.target.value);
                                            setShowMoveDropdown(true);
                                        }}
                                        onFocus={() => setShowMoveDropdown(true)}
                                        placeholder="Search moves by name or effect..."
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            paddingRight: moveSearch ? '32px' : '10px',
                                            borderRadius: '6px',
                                            border: '1px solid #ddd',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                    {moveSearch && (
                                        <button
                                            onClick={() => setMoveSearch('')}
                                            style={{
                                                position: 'absolute',
                                                right: '8px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: '#999',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '20px',
                                                height: '20px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            aria-label="Clear move search"
                                        >✕</button>
                                    )}
                                </div>

                                {/* Filter Controls */}
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    {/* Type Filter */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span className="text-muted" style={{ fontSize: '12px', fontWeight: 'bold' }}>Type:</span>
                                        <select
                                            value={moveTypeFilter}
                                            onChange={(e) => setMoveTypeFilter(e.target.value)}
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                border: '1px solid #ddd',
                                                fontSize: '11px',
                                                cursor: 'pointer',
                                                background: moveTypeFilter !== 'all' ? getTypeColor(moveTypeFilter) : 'white',
                                                color: moveTypeFilter !== 'all' ? getContrastTextColor(getTypeColor(moveTypeFilter)) : '#333'
                                            }}
                                        >
                                            <option value="all">All</option>
                                            {pokemonTypes.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Category Filter */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span className="text-muted" style={{ fontSize: '12px', fontWeight: 'bold' }}>Cat:</span>
                                        <select
                                            value={moveCategoryFilter}
                                            onChange={(e) => setMoveCategoryFilter(e.target.value)}
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                border: '1px solid #ddd',
                                                fontSize: '11px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="all">All</option>
                                            <option value="Physical">Physical</option>
                                            <option value="Special">Special</option>
                                            <option value="Status">Status</option>
                                        </select>
                                    </div>

                                    <span className="text-light" style={{ fontSize: '11px', marginLeft: 'auto' }}>
                                        {filteredMoves.length} moves
                                    </span>
                                </div>

                                {/* Move List */}
                                {showMoveDropdown && (
                                    <div className="move-list-container" style={{
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        borderRadius: '6px'
                                    }}>
                                        {filteredMoves.length > 0 ? (
                                            filteredMoves.map(([name, data]) => (
                                                <div
                                                    key={name}
                                                    className="move-list-item"
                                                    style={{
                                                        padding: '8px 10px',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <div style={{ flex: 1 }}>
                                                        <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{name}</span>
                                                        <div className="text-muted" style={{ fontSize: '11px' }}>
                                                            {data.damage || 'Status'} | {data.frequency || 'At-Will'}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <span style={{
                                                            padding: '2px 6px',
                                                            background: getTypeColor(data.type),
                                                            color: 'white',
                                                            borderRadius: '8px',
                                                            fontSize: '9px',
                                                            fontWeight: 'bold'
                                                        }}>{data.type}</span>
                                                        <span style={{
                                                            padding: '2px 6px',
                                                            background: data.category === 'Physical' ? '#e65100' : data.category === 'Special' ? '#1565c0' : '#616161',
                                                            color: 'white',
                                                            borderRadius: '8px',
                                                            fontSize: '9px',
                                                            fontWeight: 'bold'
                                                        }}>{data.category?.charAt(0) || '?'}</span>
                                                        <button
                                                            onClick={() => addMoveWithSource(name, data, 'species')}
                                                            style={{
                                                                padding: '2px 6px',
                                                                background: (pokemon.moves?.length || 0) >= MAX_TOTAL_MOVES ? '#ff9800' : '#4caf50',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                fontSize: '10px',
                                                                fontWeight: 'bold',
                                                                cursor: 'pointer'
                                                            }}
                                                            title={(pokemon.moves?.length || 0) >= MAX_TOTAL_MOVES ? "Replace a move (at limit)" : "Add move"}
                                                        >
                                                            +
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (showDetail) {
                                                                    showDetail('move', name, { ...data, type: data.type });
                                                                }
                                                            }}
                                                            style={{
                                                                padding: '2px 6px',
                                                                background: getTypeColor(data.type),
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '8px',
                                                                fontSize: '11px',
                                                                cursor: 'pointer',
                                                                marginLeft: '2px'
                                                            }}
                                                            title="View move details"
                                                        >
                                                            ℹ
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-light" style={{ padding: '20px', textAlign: 'center' }}>
                                                {moveSearch || moveTypeFilter !== 'all' || moveCategoryFilter !== 'all'
                                                    ? 'No moves match your filters'
                                                    : 'Search or filter to find moves'}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Toggle Button */}
                                <button
                                    onClick={() => setShowMoveDropdown(!showMoveDropdown)}
                                    style={{
                                        width: '100%',
                                        marginTop: '8px',
                                        padding: '6px',
                                        background: showMoveDropdown ? '#f44336' : '#667eea',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {showMoveDropdown ? '▲ Hide Moves' : '▼ Browse Moves'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {editTab === 'skills' && (
                    <div>
                        <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>Pokemon Skills (from species data)</span>
                            <button
                                onClick={() => showHelp('pokemon-skills')}
                                style={HELP_BTN_STYLE}
                                aria-label="Help: Pokémon Skills"
                                title="About Pokémon skills"
                            >?</button>
                        </div>

                        {(pokemon.pokemonSkills || []).filter(s => s.name && (s.value === undefined || s.value > 0)).length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                No skills data for this species
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '8px' }}>
                                {(pokemon.pokemonSkills || []).filter(s => s.name && (s.value === undefined || s.value > 0)).map((skill, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            if (showDetail) {
                                                // Try exact match first, then case-insensitive search
                                                let skillData = GAME_DATA?.pokemonSkills?.[skill.name];
                                                if (!skillData && GAME_DATA?.pokemonSkills) {
                                                    // Try to find a matching skill name (handles "Mindlock" vs "Mind Lock", etc.)
                                                    const normalizedName = skill.name.toLowerCase().replace(/\s+/g, '');
                                                    const matchingKey = Object.keys(GAME_DATA.pokemonSkills).find(key =>
                                                        key.toLowerCase().replace(/\s+/g, '') === normalizedName
                                                    );
                                                    if (matchingKey) skillData = GAME_DATA.pokemonSkills[matchingKey];
                                                }
                                                showDetail('pokemonSkill', skill.name, { ...skillData, value: skill.value });
                                            }
                                        }}
                                        className="skill-display-item"
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '10px 12px',
                                            background: 'var(--bg-primary)',
                                            borderRadius: '6px',
                                            borderLeft: `4px solid ${skill.value !== undefined ? 'var(--skill-value-color, #9c27b0)' : 'var(--skill-no-value-color, #4caf50)'}`,
                                            cursor: showDetail ? 'pointer' : 'default',
                                            transition: 'background 0.2s ease'
                                        }}
                                    >
                                        <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                                            {skill.name}
                                        </div>
                                        {skill.value !== undefined && (
                                            <div style={{
                                                padding: '4px 10px',
                                                background: 'var(--skill-value-color, #9c27b0)',
                                                color: 'white',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}>
                                                {skill.value}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {editTab === 'evolution' && (
                    <div>
                        {getEvolutionOptions && (() => {
                            const { canEvolve, canDevolve } = getEvolutionOptions(pokemon);
                            return (
                                <>
                                    {canEvolve && canEvolve.length > 0 && (
                                        <div style={{ marginBottom: '15px' }}>
                                            <h4 style={{ marginBottom: '10px' }}>Evolution Options</h4>
                                            {canEvolve.map((evo, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`evolution-option-card ${evo.canEvolveNow ? 'can-evolve' : 'cannot-evolve'}`}
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '10px',
                                                        marginBottom: '6px',
                                                        borderRadius: '6px'
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ fontWeight: 'bold' }}>
                                                            {evo.regionalForm ? `${evo.regionalForm} ${evo.species}` : evo.species}
                                                        </div>
                                                        <div className="text-muted" style={{ fontSize: '11px' }}>
                                                            {evo.reason || evo.requirement}
                                                            {evo.note && ` (${evo.note})`}
                                                        </div>
                                                    </div>
                                                    {evo.canEvolveNow && evolvePokemon && (
                                                        <button
                                                            onClick={() => evolvePokemon(pokemon.id, evo.species, evo.regionalForm, evo.needsItem)}
                                                            style={{
                                                                padding: '6px 12px',
                                                                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px'
                                                            }}
                                                        >
                                                            Evolve{evo.needsItem ? ` (uses ${evo.needsItem})` : ''}
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {canDevolve && devolvePokemon && (
                                        <div>
                                            <h4 style={{ marginBottom: '10px' }}>Devolution</h4>
                                            <div
                                                className="evolution-option-card devolve"
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '10px',
                                                    borderRadius: '6px'
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: 'bold' }}>{canDevolve.species}</div>
                                                    <div className="text-muted" style={{ fontSize: '11px' }}>
                                                        Revert to previous form
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => devolvePokemon(pokemon.id, canDevolve.species)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: '#f44336',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    Devolve
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {(!canEvolve || canEvolve.length === 0) && !canDevolve && (
                                        <div className="text-light" style={{ textAlign: 'center', padding: '20px' }}>
                                            No evolution options available for {pokemon.species || 'this Pokemon'}
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>

        </div>
    );
};

const quickBtnStyle = {
    width: '28px',
    height: '28px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666'
};

const quickBtnLabelStyle = {
    padding: '6px 10px',
    border: '1px solid var(--collapsed-quick-btn-border)',
    borderRadius: '4px',
    background: 'var(--collapsed-quick-btn-bg)',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: 'var(--collapsed-btn-text)',
    whiteSpace: 'nowrap'
};

const statBtnStyle = {
    width: '30px',
    height: '30px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '16px'
};

export default PokemonCard;
