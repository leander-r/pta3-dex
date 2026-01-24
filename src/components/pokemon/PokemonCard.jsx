// ============================================================
// Pokemon Card Component
// ============================================================

import React, { useState, useMemo } from 'react';
import { getTypeColor } from '../../utils/typeUtils.js';
import { getActualStats, calculatePokemonHP, calculateSTAB } from '../../utils/dataUtils.js';

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

    const actualStats = useMemo(() => getActualStats(pokemon), [pokemon]);
    const maxHP = useMemo(() => calculatePokemonHP(pokemon), [pokemon]);
    const currentHP = maxHP - (pokemon.currentDamage || 0);
    const stabBonus = useMemo(() => calculateSTAB(pokemon.level || 1), [pokemon.level]);

    const primaryType = pokemon.types?.[0] || 'Normal';
    const borderColor = getTypeColor(primaryType);

    // Filter species for selection
    const filteredSpecies = useMemo(() => {
        if (!pokedex || !speciesSearch) return [];
        const search = speciesSearch.toLowerCase();
        return pokedex.filter(p =>
            p.species.toLowerCase().includes(search)
        ).slice(0, 20);
    }, [pokedex, speciesSearch]);

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
        const availableAbilities = getAvailableAbilities(speciesData);
        // Start with first basic ability selected
        const initialAbilities = availableAbilities.length > 0 ? [availableAbilities[0].name] : [];
        updatePokemon({
            species: speciesData.species,
            name: pokemon.name === 'New Pokemon' || !pokemon.name ? speciesData.species : pokemon.name,
            types: speciesData.types || [],
            baseStats: speciesData.baseStats || { hp: 10, atk: 10, def: 10, satk: 10, sdef: 10, spd: 10 },
            abilities: initialAbilities,
            availableAbilities: availableAbilities,
            availableLevelUpMoves: speciesData.levelUpMoves || [],
            pokemonSkills: speciesData.skills ? Object.entries(speciesData.skills).map(([name, value]) => ({ name, value })) : []
        });
        setSpeciesSearch('');
    };

    // Collapsed view
    if (!isEditing) {
        return (
            <div
                style={{
                    background: 'white',
                    borderRadius: '12px',
                    borderLeft: `5px solid ${borderColor}`,
                    padding: '15px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    cursor: 'pointer'
                }}
                onClick={() => setEditing(true)}
            >
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    {/* Avatar */}
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${borderColor}, ${borderColor}88)`,
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
                                <span style={{ color: '#666', fontSize: '13px' }}>({pokemon.species})</span>
                            )}
                            <span style={{ fontSize: '13px', color: '#666' }}>Lv.{pokemon.level || 1}</span>
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

                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
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
                    <div style={{ display: 'flex', gap: '4px', flexDirection: 'column' }}>
                        {canMoveUp && (
                            <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} style={quickBtnStyle}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="18 15 12 9 6 15"></polyline>
                                </svg>
                            </button>
                        )}
                        {canMoveDown && (
                            <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} style={quickBtnStyle}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
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
            style={{
                background: 'white',
                borderRadius: '12px',
                borderLeft: `5px solid ${borderColor}`,
                boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                overflow: 'hidden'
            }}
        >
            {/* Header */}
            <div style={{
                background: `linear-gradient(135deg, ${borderColor}, ${borderColor}dd)`,
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
            <div className="tabs" style={{ padding: '0 15px', background: '#f8f9fa' }}>
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
                                <input
                                    type="text"
                                    value={speciesSearch || pokemon.species || ''}
                                    onChange={(e) => setSpeciesSearch(e.target.value)}
                                    placeholder="Search species..."
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                />
                                {speciesSearch && filteredSpecies.length > 0 && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        background: 'white',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        zIndex: 10
                                    }}>
                                        {filteredSpecies.map(sp => (
                                            <div
                                                key={sp.id}
                                                onClick={() => handleSelectSpecies(sp)}
                                                style={{
                                                    padding: '10px',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid #eee',
                                                    display: 'flex',
                                                    justifyContent: 'space-between'
                                                }}
                                            >
                                                <span style={{ fontWeight: 'bold' }}>{sp.species}</span>
                                                <span style={{ fontSize: '12px', color: '#666' }}>{sp.types?.join('/')}</span>
                                            </div>
                                        ))}
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
                                <span style={{ fontWeight: 'normal', color: '#666' }}>
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
                                <div style={{ padding: '10px', background: '#f0f4ff', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
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
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        padding: '4px 10px',
                                                        borderRadius: '12px',
                                                        fontSize: '11px',
                                                        background: isSelected ? '#e8f5e9' : 'white',
                                                        color: isSelected ? '#4caf50' : '#333',
                                                        border: `1px solid ${isSelected ? '#4caf50' : '#ddd'}`,
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
                                    <div style={{ fontSize: '10px', color: '#999', marginTop: '8px' }}>
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
                            ) : canMoveToParty && (
                                <button
                                    onClick={onMoveToParty}
                                    style={{ padding: '8px 16px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                >
                                    Move to Party
                                </button>
                            )}
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
                        <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
                            Stat Points Available: <strong>{pokemon.statPointsAvailable || 0}</strong>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                            {['hp', 'atk', 'def', 'satk', 'sdef', 'spd'].map(stat => (
                                <div key={stat} style={{ background: '#f8f9fa', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#667eea', marginBottom: '4px' }}>
                                        {stat.toUpperCase()}
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#999' }}>
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
                        <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
                            Moves: {(pokemon.moves || []).length}/8 (4 natural + 4 taught)
                        </div>

                        {(pokemon.moves || []).map((move, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '10px',
                                    marginBottom: '6px',
                                    background: 'white',
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
                                    <div style={{ fontSize: '11px', color: '#666' }}>
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
                            <div style={{ marginTop: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '6px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Add Move</div>
                                <select
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            const moveData = GAME_DATA.moves[e.target.value];
                                            if (moveData) {
                                                updatePokemon({
                                                    moves: [...(pokemon.moves || []), {
                                                        name: e.target.value,
                                                        type: moveData.type,
                                                        category: moveData.category,
                                                        damage: moveData.damage,
                                                        frequency: moveData.frequency,
                                                        range: moveData.range,
                                                        effect: moveData.effect,
                                                        source: 'taught'
                                                    }]
                                                });
                                            }
                                            e.target.value = '';
                                        }
                                    }}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                >
                                    <option value="">Select a move...</option>
                                    {Object.entries(GAME_DATA.moves || {}).slice(0, 100).map(([name, data]) => (
                                        <option key={name} value={name}>{name} ({data.type})</option>
                                    ))}
                                </select>
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
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '10px 12px',
                                            background: 'white',
                                            borderRadius: '6px',
                                            borderLeft: `4px solid ${skill.value !== undefined ? '#9c27b0' : '#4caf50'}`
                                        }}
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
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '10px',
                                                        marginBottom: '6px',
                                                        background: evo.canEvolveNow ? '#e8f5e9' : '#fff3e0',
                                                        borderRadius: '6px'
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ fontWeight: 'bold' }}>{evo.species}</div>
                                                        <div style={{ fontSize: '11px', color: '#666' }}>
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
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '10px',
                                                background: '#ffebee',
                                                borderRadius: '6px'
                                            }}>
                                                <div>
                                                    <div style={{ fontWeight: 'bold' }}>{canDevolve.species}</div>
                                                    <div style={{ fontSize: '11px', color: '#666' }}>
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
                                        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
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
