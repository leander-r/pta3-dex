// ============================================================
// Pokemon Card Component
// ============================================================

import React, { useState, useMemo } from 'react';
import { getTypeColor } from '../../utils/typeUtils.js';
import { getActualStats, calculatePokemonHP, calculateSTAB } from '../../utils/dataUtils.js';
import { exportSinglePokemon, copyPokemonToClipboard } from '../../utils/exportUtils.js';

const PokemonCard = ({
    pokemon,
    isEditing,
    setEditing,
    updatePokemon,
    deletePokemon,
    isInParty,
    canMoveToParty,
    onMoveToParty,
    onMoveToReserve,
    onMoveUp,
    onMoveDown,
    canMoveUp,
    canMoveDown,
    pokedex,
    GAME_DATA,
    showDetail,
    getEvolutionOptions,
    evolvePokemon,
    devolvePokemon
}) => {
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
    // Regional form selection state
    const [showRegionalFormSelect, setShowRegionalFormSelect] = useState(false);
    const [pendingSpeciesData, setPendingSpeciesData] = useState(null);

    const actualStats = useMemo(() => getActualStats(pokemon), [pokemon]);
    const maxHP = useMemo(() => calculatePokemonHP(pokemon), [pokemon]);
    const currentHP = maxHP - (pokemon.currentDamage || 0);
    const stabBonus = useMemo(() => calculateSTAB(pokemon.level || 1), [pokemon.level]);

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

    // Filter and sort species for selection
    const filteredSpecies = useMemo(() => {
        if (!pokedex) return [];

        let results = [...pokedex];

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

        // Apply sorting
        results.sort((a, b) => {
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
    }, [pokedex, speciesSearch, speciesTypeFilter, speciesSort]);

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

        updatePokemon({
            species: speciesData.species,
            name: pokemon.name === 'New Pokemon' || !pokemon.name ? speciesData.species : pokemon.name,
            types: types,
            baseStats: baseStats,
            abilities: initialAbilities,
            availableAbilities: availableAbilities,
            availableLevelUpMoves: levelUpMoves,
            regionalForm: isRegional ? regionalForm.name : null,
            pokemonSkills: speciesData.skills ? Object.entries(speciesData.skills).map(([name, value]) => ({ name, value })) : []
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
                style={{
                    borderLeft: secondaryType
                        ? `5px solid ${primaryColor}`
                        : `5px solid ${primaryColor}`,
                    borderRight: secondaryType
                        ? `3px solid ${secondaryColor}`
                        : 'none'
                }}
                onClick={() => setEditing(true)}
            >
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    {/* Avatar */}
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        {pokemon.avatar ? (
                            <img src={pokemon.avatar} alt="" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            <span style={{ fontSize: '24px' }}>🔴</span>
                        )}
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
                            <span className="text-muted" style={{ fontSize: '13px' }}>Lv.{pokemon.level || 1}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                            {pokemon.types?.map(type => (
                                <span
                                    key={type}
                                    style={{
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        background: getTypeColor(type),
                                        color: 'white',
                                        fontSize: '10px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {type}
                                </span>
                            ))}
                        </div>

                        <div className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>
                            HP: {currentHP}/{maxHP} | {pokemon.nature || 'Hardy'} | {
                                (pokemon.abilities && pokemon.abilities.length > 0)
                                    ? pokemon.abilities.join(', ')
                                    : (pokemon.ability || 'No Ability')
                            }
                        </div>

                        {/* Moves Preview */}
                        {(pokemon.moves || []).length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                                {(pokemon.moves || []).slice(0, 4).map((move, idx) => (
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
                                            padding: '2px 8px',
                                            borderRadius: '10px',
                                            background: getTypeColor(move.type),
                                            color: 'white',
                                            fontSize: '10px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {move.name}
                                    </span>
                                ))}
                                {(pokemon.moves || []).length > 4 && (
                                    <span style={{ fontSize: '10px', color: '#999', alignSelf: 'center' }}>
                                        +{(pokemon.moves || []).length - 4} more
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div style={{ display: 'flex', gap: '4px', flexDirection: 'column', alignItems: 'flex-end' }}>
                        {canMoveUp && (
                            <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} style={quickBtnLabelStyle}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="18 15 12 9 6 15"></polyline>
                                </svg>
                                <span>Up</span>
                            </button>
                        )}
                        {canMoveDown && (
                            <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} style={quickBtnLabelStyle}>
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
                                style={{ ...quickBtnLabelStyle, background: '#fff3e0', borderColor: '#ff9800', color: '#e65100' }}
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
                                    background: canMoveToParty ? '#e8f5e9' : '#f5f5f5',
                                    borderColor: canMoveToParty ? '#4caf50' : '#ccc',
                                    color: canMoveToParty ? '#2e7d32' : '#999',
                                    cursor: canMoveToParty ? 'pointer' : 'not-allowed',
                                    opacity: canMoveToParty ? 1 : 0.7
                                }}
                                title={canMoveToParty ? 'Move to Party' : 'Party is full (6/6)'}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={canMoveToParty ? '#2e7d32' : '#999'} strokeWidth="2">
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                            type="text"
                            value={pokemon.name || ''}
                            onChange={(e) => updatePokemon({ name: e.target.value })}
                            placeholder="Nickname"
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                width: '150px'
                            }}
                        />
                        <span style={{ opacity: 0.8 }}>Lv.{pokemon.level}</span>
                    </div>
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
                                            border: showSpeciesDropdown ? '2px solid #667eea' : '1px solid #ddd',
                                            boxSizing: 'border-box'
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
                                        background: 'white',
                                        border: '2px solid #667eea',
                                        borderTop: 'none',
                                        borderRadius: '0 0 8px 8px',
                                        zIndex: 100,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                    }}>
                                        {/* Filter & Sort Controls */}
                                        <div style={{
                                            padding: '10px',
                                            background: '#f8f9fa',
                                            borderBottom: '1px solid #eee'
                                        }}>
                                            {/* Type Filter Chips */}
                                            <div style={{ marginBottom: '8px' }}>
                                                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>Filter by Type:</div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                    <button
                                                        onClick={() => setSpeciesTypeFilter('all')}
                                                        style={{
                                                            padding: '4px 8px',
                                                            borderRadius: '12px',
                                                            border: 'none',
                                                            background: speciesTypeFilter === 'all' ? '#667eea' : '#e0e0e0',
                                                            color: speciesTypeFilter === 'all' ? 'white' : '#666',
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
                                                                background: speciesTypeFilter === type ? getTypeColor(type) : '#e0e0e0',
                                                                color: speciesTypeFilter === type ? 'white' : '#666',
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
                                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#666' }}>Sort:</span>
                                                    <select
                                                        value={speciesSort}
                                                        onChange={(e) => setSpeciesSort(e.target.value)}
                                                        style={{
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            border: '1px solid #ddd',
                                                            fontSize: '11px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <option value="name">Name (A-Z)</option>
                                                        <option value="id">Dex Number</option>
                                                        <option value="bst-high">BST (High → Low)</option>
                                                        <option value="bst-low">BST (Low → High)</option>
                                                    </select>
                                                </div>
                                                <span style={{ fontSize: '10px', color: '#999' }}>
                                                    {filteredSpecies.length} results
                                                </span>
                                            </div>
                                        </div>

                                        {/* Species List */}
                                        <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                            {filteredSpecies.length > 0 ? (
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
                                                            style={{
                                                                padding: '10px 12px',
                                                                cursor: 'pointer',
                                                                borderBottom: '1px solid #eee',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                transition: 'background 0.15s'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                                        >
                                                            <div>
                                                                <span style={{ fontWeight: 'bold' }}>{sp.species}</span>
                                                                <span style={{ fontSize: '11px', color: '#999', marginLeft: '6px' }}>
                                                                    #{sp.id || '???'}
                                                                </span>
                                                                {hasRegionalForms && (
                                                                    <span style={{ fontSize: '10px', color: '#9c27b0', marginLeft: '6px' }}>
                                                                        🌍
                                                                    </span>
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
                                                                <span style={{ fontSize: '10px', color: '#999', marginLeft: '4px' }}>
                                                                    BST: {getBaseStatTotal(sp)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                                                    {speciesSearch || speciesTypeFilter !== 'all'
                                                        ? 'No Pokemon match your search/filter'
                                                        : 'Use filters or search to find Pokemon'}
                                                </div>
                                            )}
                                        </div>

                                        {/* Close Button */}
                                        <div style={{
                                            padding: '8px',
                                            borderTop: '1px solid #eee',
                                            background: '#f8f9fa',
                                            textAlign: 'center'
                                        }}>
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
                                        background: 'white',
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                        zIndex: 1001,
                                        marginTop: '4px'
                                    }}>
                                        <div style={{
                                            padding: '12px',
                                            borderBottom: '1px solid #eee',
                                            background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)',
                                            borderRadius: '8px 8px 0 0',
                                            color: 'white'
                                        }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                                🌍 Choose Form for {pendingSpeciesData.species}
                                            </div>
                                            <div style={{ fontSize: '11px', opacity: 0.9 }}>
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
                                                    borderBottom: '1px solid #eee',
                                                    transition: 'background 0.15s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
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
                                                        borderBottom: '1px solid #eee',
                                                        transition: 'background 0.15s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = '#e3f2fd'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
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
                                            borderTop: '1px solid #eee',
                                            background: '#f8f9fa',
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

                        {/* Level & EXP */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>Level</label>
                                <input
                                    type="number"
                                    value={pokemon.level || 1}
                                    onChange={(e) => updatePokemon({ level: parseInt(e.target.value) || 1 })}
                                    min="1"
                                    max="100"
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                />
                            </div>
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
                        </div>

                        {/* Gender */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>Gender</label>
                            <select
                                value={pokemon.gender || ''}
                                onChange={(e) => updatePokemon({ gender: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                            >
                                <option value="">Unknown</option>
                                <option value="male">Male ♂</option>
                                <option value="female">Female ♀</option>
                                <option value="genderless">Genderless</option>
                            </select>
                        </div>

                        {/* Abilities Section - Up to 3 */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Abilities</span>
                                <span className="text-muted" style={{ fontWeight: 'normal' }}>
                                    {(pokemon.abilities || []).length}/3 selected
                                </span>
                            </label>

                            {/* Selected Abilities */}
                            {(pokemon.abilities || []).length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                                    {(pokemon.abilities || []).map((abilityName, idx) => {
                                        const abilityData = GAME_DATA.abilities?.[abilityName];
                                        return (
                                            <div
                                                key={idx}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '6px 10px',
                                                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                                    color: 'white',
                                                    borderRadius: '16px',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                <span
                                                    onClick={() => {
                                                        if (showDetail && abilityData) {
                                                            showDetail('ability', abilityName, abilityData);
                                                        }
                                                    }}
                                                    style={{ cursor: showDetail ? 'pointer' : 'default' }}
                                                >
                                                    {abilityName}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        const newAbilities = (pokemon.abilities || []).filter(a => a !== abilityName);
                                                        updatePokemon({ abilities: newAbilities });
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
                                        );
                                    })}
                                </div>
                            )}

                            {/* Available Abilities to Add */}
                            {derivedAbilities.length > 0 ? (
                                <div className="abilities-available-box" style={{ padding: '10px', borderRadius: '8px' }}>
                                    <div className="text-muted" style={{ fontSize: '11px', marginBottom: '8px' }}>
                                        Tap to add (tap name for details):
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {derivedAbilities.map((ab, idx) => {
                                            const isSelected = (pokemon.abilities || []).includes(ab.name);
                                            const canAdd = (pokemon.abilities || []).length < 3;
                                            const abilityData = GAME_DATA.abilities?.[ab.name];
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`ability-option ${isSelected ? 'selected' : ''}`}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        padding: '4px 10px',
                                                        borderRadius: '12px',
                                                        fontSize: '11px',
                                                        opacity: isSelected || canAdd ? 1 : 0.5
                                                    }}
                                                >
                                                    <span
                                                        onClick={() => {
                                                            if (showDetail && abilityData) {
                                                                showDetail('ability', ab.name, abilityData);
                                                            }
                                                        }}
                                                        style={{ cursor: showDetail ? 'pointer' : 'default' }}
                                                    >
                                                        {ab.name}
                                                    </span>
                                                    <span style={{ marginLeft: '4px', marginRight: '6px', opacity: 0.7, fontSize: '10px' }}>
                                                        {ab.type === 'Basic' ? '●' : ab.type === 'Advanced' ? '★' : '◆'}
                                                    </span>
                                                    {!isSelected && canAdd && (
                                                        <button
                                                            onClick={() => {
                                                                const newAbilities = [...(pokemon.abilities || []), ab.name];
                                                                updatePokemon({ abilities: newAbilities });
                                                            }}
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
                                                                justifyContent: 'center'
                                                            }}
                                                        >
                                                            +
                                                        </button>
                                                    )}
                                                    {isSelected && (
                                                        <span style={{ color: '#4caf50', fontSize: '12px' }}>✓</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="text-light" style={{ fontSize: '10px', marginTop: '8px' }}>
                                        ● Basic  ★ Advanced  ◆ High
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Enter ability name and press Enter..."
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && e.target.value.trim()) {
                                                const newAbilities = [...(pokemon.abilities || [])];
                                                if (newAbilities.length < 3 && !newAbilities.includes(e.target.value.trim())) {
                                                    newAbilities.push(e.target.value.trim());
                                                    updatePokemon({ abilities: newAbilities });
                                                }
                                                e.target.value = '';
                                            }
                                        }}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Pokemon Image */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                                Pokemon Image
                            </label>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                {pokemon.avatar ? (
                                    <div style={{ position: 'relative' }}>
                                        <img
                                            src={pokemon.avatar}
                                            alt={pokemon.name || pokemon.species}
                                            style={{
                                                width: '80px',
                                                height: '80px',
                                                borderRadius: '8px',
                                                objectFit: 'cover',
                                                border: '2px solid #ddd'
                                            }}
                                        />
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
                                    </div>
                                ) : (
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
                                )}
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
                                    <div style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>
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
                                    if (confirm(`Delete ${pokemon.name || pokemon.species || 'this Pokemon'}?`)) {
                                        deletePokemon();
                                    }
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
                        <div className="text-muted" style={{ marginBottom: '10px', fontSize: '12px' }}>
                            Stat Points Available: <strong>{pokemon.statPointsAvailable || 0}</strong>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                            {['hp', 'atk', 'def', 'satk', 'sdef', 'spd'].map(stat => (
                                <div key={stat} className="bg-light" style={{ padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#667eea', marginBottom: '4px' }}>
                                        {stat.toUpperCase()}
                                    </div>
                                    <div className="text-light" style={{ fontSize: '10px' }}>
                                        Base: {pokemon.baseStats?.[stat] || 10}
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#4caf50' }}>
                                        +{pokemon.addedStats?.[stat] || 0}
                                    </div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                        {actualStats[stat]}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '4px' }}>
                                        <button
                                            onClick={() => {
                                                if ((pokemon.addedStats?.[stat] || 0) > 0) {
                                                    // Remove last occurrence of this stat from history
                                                    const history = [...(pokemon.statAllocationHistory || [])];
                                                    const lastIdx = history.lastIndexOf(stat);
                                                    if (lastIdx !== -1) {
                                                        history.splice(lastIdx, 1);
                                                    }
                                                    updatePokemon({
                                                        addedStats: { ...pokemon.addedStats, [stat]: (pokemon.addedStats?.[stat] || 0) - 1 },
                                                        statPointsAvailable: (pokemon.statPointsAvailable || 0) + 1,
                                                        statAllocationHistory: history
                                                    });
                                                }
                                            }}
                                            disabled={(pokemon.addedStats?.[stat] || 0) <= 0}
                                            style={{ ...statBtnStyle, opacity: (pokemon.addedStats?.[stat] || 0) <= 0 ? 0.5 : 1 }}
                                        >
                                            −
                                        </button>
                                        <button
                                            onClick={() => {
                                                if ((pokemon.statPointsAvailable || 0) > 0) {
                                                    updatePokemon({
                                                        addedStats: { ...pokemon.addedStats, [stat]: (pokemon.addedStats?.[stat] || 0) + 1 },
                                                        statPointsAvailable: (pokemon.statPointsAvailable || 0) - 1,
                                                        statAllocationHistory: [...(pokemon.statAllocationHistory || []), stat]
                                                    });
                                                }
                                            }}
                                            disabled={(pokemon.statPointsAvailable || 0) <= 0}
                                            style={{ ...statBtnStyle, opacity: (pokemon.statPointsAvailable || 0) <= 0 ? 0.5 : 1 }}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '15px', padding: '10px', background: '#e8f5e9', borderRadius: '8px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center', fontSize: '12px' }}>
                                <div>
                                    <div style={{ color: '#666' }}>Max HP</div>
                                    <div style={{ fontWeight: 'bold', color: '#e53935' }}>{maxHP}</div>
                                </div>
                                <div>
                                    <div style={{ color: '#666' }}>STAB Bonus</div>
                                    <div style={{ fontWeight: 'bold', color: '#667eea' }}>+{stabBonus}</div>
                                </div>
                                <div>
                                    <div style={{ color: '#666' }}>Current HP</div>
                                    <div style={{ fontWeight: 'bold', color: '#4caf50' }}>{currentHP}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {editTab === 'moves' && (
                    <div>
                        <div className="text-muted" style={{ marginBottom: '10px', fontSize: '12px' }}>
                            Moves: {(pokemon.moves || []).length}/8 (4 natural + 4 taught)
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
                                    <div className="text-muted" style={{ fontSize: '11px' }}>
                                        {move.type} | {move.category} | {move.damage || 'Status'}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const newMoves = [...(pokemon.moves || [])];
                                        newMoves.splice(idx, 1);
                                        updatePokemon({ moves: newMoves });
                                    }}
                                    style={{
                                        background: '#f44336',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        cursor: 'pointer',
                                        fontSize: '11px'
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}

                        {(pokemon.moves || []).length < 6 && (
                            <div className="add-move-panel" style={{ marginTop: '10px', padding: '12px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '10px', color: '#667eea' }}>Add Move</div>

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
                                        >✕</button>
                                    )}
                                </div>

                                {/* Filter Controls */}
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    {/* Type Filter */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>Type:</span>
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
                                                color: moveTypeFilter !== 'all' ? 'white' : '#333'
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
                                        <span className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>Cat:</span>
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

                                    <span className="text-light" style={{ fontSize: '10px', marginLeft: 'auto' }}>
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
                                                    <div
                                                        style={{ flex: 1, cursor: 'pointer' }}
                                                        onClick={() => {
                                                            updatePokemon({
                                                                moves: [...(pokemon.moves || []), {
                                                                    name: name,
                                                                    type: data.type,
                                                                    category: data.category,
                                                                    damage: data.damage,
                                                                    frequency: data.frequency,
                                                                    range: data.range,
                                                                    effect: data.effect,
                                                                    source: 'taught'
                                                                }]
                                                            });
                                                            setMoveSearch('');
                                                            setMoveTypeFilter('all');
                                                            setMoveCategoryFilter('all');
                                                        }}
                                                    >
                                                        <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{name}</span>
                                                        <div className="text-muted" style={{ fontSize: '10px' }}>
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
                                                                marginLeft: '4px'
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
                                        fontSize: '11px',
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
                        <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
                            Pokemon Skills (from species data)
                        </div>

                        {(pokemon.pokemonSkills || []).length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                No skills data for this species
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '8px' }}>
                                {(pokemon.pokemonSkills || []).map((skill, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            if (showDetail) {
                                                const skillData = GAME_DATA?.pokemonSkills?.[skill.name];
                                                showDetail('pokemonSkill', skill.name, { ...skillData, value: skill.value });
                                            }
                                        }}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '10px 12px',
                                            background: 'white',
                                            borderRadius: '6px',
                                            borderLeft: `4px solid ${skill.value !== undefined ? '#9c27b0' : '#4caf50'}`,
                                            cursor: showDetail ? 'pointer' : 'default',
                                            transition: 'background 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => { if (showDetail) e.currentTarget.style.background = '#f5f5f5'; }}
                                        onMouseLeave={(e) => { if (showDetail) e.currentTarget.style.background = 'white'; }}
                                    >
                                        <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                                            {skill.name}
                                        </div>
                                        {skill.value !== undefined && (
                                            <div style={{
                                                padding: '4px 10px',
                                                background: '#9c27b0',
                                                color: 'white',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}>
                                                {skill.value}d6
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
    padding: '4px 8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '10px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#666',
    whiteSpace: 'nowrap'
};

const statBtnStyle = {
    width: '24px',
    height: '24px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '14px'
};

export default PokemonCard;
