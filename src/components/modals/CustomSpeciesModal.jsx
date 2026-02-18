// ============================================================
// Custom Species Modal Component
// ============================================================
// Modal for creating custom Pokemon species for homebrew/newer Pokemon

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { getTypeColor } from '../../utils/typeUtils.js';
import { GAME_DATA } from '../../data/configs.js';
import { POKEMON_TYPES } from '../../data/typeChart.js';
import useModalKeyboard from '../../hooks/useModalKeyboard.js';
import { useUI, useGameData } from '../../contexts/index.js';

const TYPE_LIST = [
    'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
    'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
    'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
];

const DEFAULT_SPECIES = {
    species: '',
    types: ['Normal'],
    baseStats: { hp: 5, atk: 5, def: 5, satk: 5, sdef: 5, spd: 5 },
    abilities: { basic: [], adv: [], high: [] },
    levelUpMoves: [],
    eggMoves: [],
    tutorMoves: [],
    skills: { overland: 3, swim: 1, jump: 1, power: 1, sky: 0, burrow: 0, surface: 0, levitate: 0, teleporter: 0, intelligence: 3 },
    evolvesTo: [],
    evolvesFrom: null,
    isCustom: true
};

const SKILL_FIELDS = [
    { key: 'overland', label: 'Overland', max: 10, color: '#4caf50' },
    { key: 'swim', label: 'Swim', max: 10, color: '#2196f3' },
    { key: 'jump', label: 'Jump', max: 10, color: '#ff9800' },
    { key: 'power', label: 'Power', max: 10, color: '#f44336' },
    { key: 'sky', label: 'Sky', max: 10, color: '#90caf9' },
    { key: 'burrow', label: 'Burrow', max: 10, color: '#795548' },
    { key: 'surface', label: 'Surface', max: 10, color: '#00bcd4' },
    { key: 'levitate', label: 'Levitate', max: 10, color: '#9c27b0' },
    { key: 'teleporter', label: 'Teleporter', max: 10, color: '#e91e63' },
    { key: 'intelligence', label: 'Intelligence', max: 6, color: '#673ab7' }
];

const EVOLUTION_METHODS = [
    { value: 'level', label: 'Level' },
    { value: 'stone', label: 'Evolution Stone' },
    { value: 'trade', label: 'Trade' },
    { value: 'happiness', label: 'Happiness' },
    { value: 'other', label: 'Other/Special' }
];

const EVOLUTION_STONES = [
    'Fire Stone',
    'Water Stone',
    'Thunder Stone',
    'Leaf Stone',
    'Moon Stone',
    'Sun Stone',
    'Shiny Stone',
    'Dusk Stone',
    'Dawn Stone',
    'Ice Stone',
    'Oval Stone',
    'Everstone'
];

const CustomSpeciesModal = () => {
    // Get state from contexts
    const { showCustomSpeciesModal, setShowCustomSpeciesModal, editingCustomSpeciesId, setEditingCustomSpeciesId } = useUI();
    const { customSpecies, setCustomSpecies } = useGameData();

    const [species, setSpecies] = useState({ ...DEFAULT_SPECIES });
    const [editingIndex, setEditingIndex] = useState(null);

    // Ability picker state
    const [abilityFilter, setAbilityFilter] = useState({ search: '', tier: null });
    const [showAbilityPicker, setShowAbilityPicker] = useState(null); // 'basic', 'adv', 'high', or null

    // Move picker state
    const [moveFilter, setMoveFilter] = useState({ search: '', type: '', category: '' });
    const [showMovePicker, setShowMovePicker] = useState(false);
    const [pendingMoveLevel, setPendingMoveLevel] = useState(1);

    // Get total counts for display
    const totalAbilities = Object.keys(GAME_DATA.abilities || {}).length;
    const totalMoves = Object.keys(GAME_DATA.moves || {}).length;

    // Filter abilities
    const filteredAbilities = useMemo(() => {
        const abilities = Object.entries(GAME_DATA.abilities || {});
        return abilities
            .filter(([name, desc]) => {
                if (!abilityFilter.search) return true;
                const searchLower = abilityFilter.search.toLowerCase();
                return name.toLowerCase().includes(searchLower) ||
                    (desc && desc.toLowerCase().includes(searchLower));
            })
            .sort((a, b) => a[0].localeCompare(b[0]));
    }, [abilityFilter.search]);

    // Filter moves
    const filteredMoves = useMemo(() => {
        const moves = Object.entries(GAME_DATA.moves || {});
        return moves
            .filter(([name, data]) => {
                const matchesSearch = !moveFilter.search ||
                    name.toLowerCase().includes(moveFilter.search.toLowerCase()) ||
                    (data.effect && data.effect.toLowerCase().includes(moveFilter.search.toLowerCase()));
                const matchesType = !moveFilter.type || data.type === moveFilter.type;
                const matchesCategory = !moveFilter.category || data.category === moveFilter.category;
                return matchesSearch && matchesType && matchesCategory;
            })
            .sort((a, b) => a[0].localeCompare(b[0]));
    }, [moveFilter]);

    // Auto-load species for editing when modal opens with an ID
    useEffect(() => {
        if (showCustomSpeciesModal && editingCustomSpeciesId && customSpecies) {
            const index = customSpecies.findIndex(s => s.id === editingCustomSpeciesId);
            if (index !== -1) {
                const speciesData = customSpecies[index];
                setSpecies({
                    ...DEFAULT_SPECIES,
                    ...speciesData,
                    abilities: {
                        basic: speciesData.abilities?.basic || [],
                        adv: speciesData.abilities?.adv || [],
                        high: speciesData.abilities?.high || []
                    },
                    levelUpMoves: speciesData.levelUpMoves || [],
                    skills: { ...DEFAULT_SPECIES.skills, ...(speciesData.skills || {}) },
                    evolvesTo: speciesData.evolvesTo || [],
                    evolvesFrom: speciesData.evolvesFrom || null
                });
                setEditingIndex(index);
            }
        }
    }, [showCustomSpeciesModal, editingCustomSpeciesId, customSpecies]);

    const handleClose = useCallback(() => {
        setShowCustomSpeciesModal(false);
        setSpecies({ ...DEFAULT_SPECIES });
        setEditingIndex(null);
        setAbilityFilter({ search: '', tier: null });
        setMoveFilter({ search: '', type: '', category: '' });
        setShowAbilityPicker(null);
        setShowMovePicker(false);
        if (setEditingCustomSpeciesId) {
            setEditingCustomSpeciesId(null);
        }
    }, [setShowCustomSpeciesModal, setEditingCustomSpeciesId]);

    const { modalRef } = useModalKeyboard(showCustomSpeciesModal, handleClose);

    if (!showCustomSpeciesModal) return null;

    const handleSaveSpecies = () => {
        if (!species.species.trim()) {
            alert('Species name is required!');
            return;
        }

        const existingIndex = customSpecies.findIndex(s =>
            s.species.toLowerCase() === species.species.toLowerCase() &&
            (editingIndex === null || customSpecies.indexOf(s) !== editingIndex)
        );
        if (existingIndex !== -1) {
            alert('A custom species with this name already exists!');
            return;
        }

        const cleanedSpecies = {
            ...species,
            id: editingIndex !== null ? customSpecies[editingIndex].id : 'custom-' + Date.now(),
            isCustom: true
        };

        if (editingIndex !== null) {
            const updated = [...customSpecies];
            updated[editingIndex] = cleanedSpecies;
            setCustomSpecies(updated);
        } else {
            setCustomSpecies([...customSpecies, cleanedSpecies]);
        }

        handleClose();
    };

    const handleEditSpecies = (index) => {
        const speciesData = customSpecies[index];
        setSpecies({
            ...DEFAULT_SPECIES,
            ...speciesData,
            abilities: {
                basic: speciesData.abilities?.basic || [],
                adv: speciesData.abilities?.adv || [],
                high: speciesData.abilities?.high || []
            },
            levelUpMoves: speciesData.levelUpMoves || [],
            skills: { ...DEFAULT_SPECIES.skills, ...(speciesData.skills || {}) },
            evolvesTo: speciesData.evolvesTo || [],
            evolvesFrom: speciesData.evolvesFrom || null
        });
        setEditingIndex(index);
    };

    // Skills helpers
    const updateSkill = (skillKey, value) => {
        const numValue = parseInt(value) || 0;
        const skillInfo = SKILL_FIELDS.find(s => s.key === skillKey);
        const maxVal = skillInfo?.max || 10;
        setSpecies(prev => ({
            ...prev,
            skills: { ...prev.skills, [skillKey]: Math.max(0, Math.min(maxVal, numValue)) }
        }));
    };

    // Evolution helpers
    const addEvolution = () => {
        setSpecies(prev => ({
            ...prev,
            evolvesTo: [...prev.evolvesTo, { species: '', method: 'level', requirement: '' }]
        }));
    };

    const updateEvolution = (index, field, value) => {
        setSpecies(prev => ({
            ...prev,
            evolvesTo: prev.evolvesTo.map((evo, i) =>
                i === index ? { ...evo, [field]: value } : evo
            )
        }));
    };

    const removeEvolution = (index) => {
        setSpecies(prev => ({
            ...prev,
            evolvesTo: prev.evolvesTo.filter((_, i) => i !== index)
        }));
    };

    const updateEvolvesFrom = (field, value) => {
        if (!value && field === 'species') {
            setSpecies(prev => ({ ...prev, evolvesFrom: null }));
        } else {
            setSpecies(prev => ({
                ...prev,
                evolvesFrom: { ...(prev.evolvesFrom || { species: '', method: 'level', requirement: '' }), [field]: value }
            }));
        }
    };

    const handleDeleteSpecies = (index) => {
        if (window.confirm(`Delete custom species "${customSpecies[index].species}"?`)) {
            const updated = customSpecies.filter((_, i) => i !== index);
            setCustomSpecies(updated);
        }
    };

    const updateStat = (stat, value) => {
        const numValue = parseInt(value) || 0;
        setSpecies(prev => ({
            ...prev,
            baseStats: { ...prev.baseStats, [stat]: Math.max(1, Math.min(30, numValue)) }
        }));
    };

    const addAbility = (tier, ability) => {
        if (!ability || species.abilities[tier].includes(ability)) return;
        setSpecies(prev => ({
            ...prev,
            abilities: {
                ...prev.abilities,
                [tier]: [...prev.abilities[tier], ability]
            }
        }));
    };

    const removeAbility = (tier, index) => {
        setSpecies(prev => ({
            ...prev,
            abilities: {
                ...prev.abilities,
                [tier]: prev.abilities[tier].filter((_, i) => i !== index)
            }
        }));
    };

    const addLevelUpMove = (moveName) => {
        if (!moveName) return;
        if (species.levelUpMoves.some(m => m.move === moveName)) {
            alert('This move is already in the level-up list!');
            return;
        }
        setSpecies(prev => ({
            ...prev,
            levelUpMoves: [...prev.levelUpMoves, { level: pendingMoveLevel, move: moveName }]
                .sort((a, b) => a.level - b.level)
        }));
    };

    const removeLevelUpMove = (index) => {
        setSpecies(prev => ({
            ...prev,
            levelUpMoves: prev.levelUpMoves.filter((_, i) => i !== index)
        }));
    };

    const statColors = {
        hp: '#4caf50',
        atk: '#f44336',
        def: '#ff9800',
        satk: '#2196f3',
        sdef: '#9c27b0',
        spd: '#e91e63'
    };

    return (
        <div className="modal-overlay" onClick={handleClose} role="presentation">
            <div
                ref={modalRef}
                className="modal"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="custom-species-modal-title"
            >
                <div className="modal-header">
                    <h3 id="custom-species-modal-title">{editingIndex !== null ? 'Edit Custom Species' : 'Create Custom Species'}</h3>
                    <button onClick={handleClose} aria-label="Close modal" style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
                </div>
                <div className="modal-content">
                    {/* Data Status */}
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                        Game Data: {totalMoves} moves, {totalAbilities} abilities loaded
                    </div>

                    {/* Existing Custom Species List */}
                    {customSpecies.length > 0 && editingIndex === null && (
                        <div style={{ marginBottom: '20px', padding: '10px', background: 'var(--bg-secondary, #f5f5f5)', borderRadius: '8px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#667eea' }}>
                                Your Custom Species ({customSpecies.length})
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {customSpecies.map((s, idx) => (
                                    <div key={s.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', background: 'var(--bg-primary, white)', borderRadius: '4px', fontSize: '12px' }}>
                                        <span>{s.species}</span>
                                        <button onClick={() => handleEditSpecies(idx)} style={{ background: '#667eea', color: 'white', border: 'none', borderRadius: '3px', padding: '2px 6px', cursor: 'pointer', fontSize: '10px' }}>Edit</button>
                                        <button onClick={() => handleDeleteSpecies(idx)} style={{ background: '#f44336', color: 'white', border: 'none', borderRadius: '3px', padding: '2px 6px', cursor: 'pointer', fontSize: '10px' }} aria-label={`Delete ${s.species}`}>×</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Species Name */}
                    <div className="form-group">
                        <label>Species Name *</label>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            The name of this Pokémon species (e.g., Sprigatito, Fuecoco). This will appear in the species dropdown.
                        </div>
                        <input type="text" value={species.species} onChange={(e) => setSpecies(prev => ({ ...prev, species: e.target.value }))} placeholder="e.g., Sprigatito" />
                    </div>

                    {/* Types */}
                    <div className="grid-responsive-2 gap-sm">
                        <div className="form-group">
                            <label>Primary Type *</label>
                            <select value={species.types[0]} onChange={(e) => setSpecies(prev => ({ ...prev, types: [e.target.value, prev.types[1]].filter(Boolean) }))}>
                                {TYPE_LIST.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Secondary Type</label>
                            <select value={species.types[1] || ''} onChange={(e) => setSpecies(prev => ({ ...prev, types: e.target.value ? [prev.types[0], e.target.value] : [prev.types[0]] }))}>
                                <option value="">None</option>
                                {TYPE_LIST.filter(t => t !== species.types[0]).map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Base Stats */}
                    <div className="form-group">
                        <label>Base Stats</label>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            PTA base stat values (typically 1-15). These determine the species' natural strengths and are added to when leveling up.
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                            {Object.entries(species.baseStats).map(([stat, value]) => (
                                <div key={stat} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: '45px', fontWeight: 'bold', fontSize: '11px', color: statColors[stat], textTransform: 'uppercase' }}>{stat}</span>
                                    <input type="number" min="1" max="30" value={value} onChange={(e) => updateStat(stat, e.target.value)} style={{ width: '60px', padding: '6px', borderRadius: '4px', border: `2px solid ${statColors[stat]}`, textAlign: 'center', fontWeight: 'bold' }} />
                                </div>
                            ))}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '6px' }}>BST: {Object.values(species.baseStats).reduce((a, b) => a + b, 0)}</div>
                    </div>

                    {/* Abilities */}
                    <div className="form-group">
                        <label>Ability Pool</label>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            Available abilities trainers can choose from when catching this species.
                        </div>

                        {/* Selected abilities (combined from all tiers) */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                            {[...species.abilities.basic, ...species.abilities.adv, ...species.abilities.high].map((ability, idx) => {
                                // Determine which tier this ability is in for removal
                                const tier = species.abilities.basic.includes(ability) ? 'basic' :
                                             species.abilities.adv.includes(ability) ? 'adv' : 'high';
                                const tierIdx = species.abilities[tier].indexOf(ability);
                                return (
                                    <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', background: '#667eea', color: 'white', borderRadius: '12px', fontSize: '11px' }}>
                                        {ability}
                                        <button onClick={() => removeAbility(tier, tierIdx)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0 2px', fontSize: '12px', lineHeight: 1 }} aria-label={`Remove ${ability}`}>×</button>
                                    </span>
                                );
                            })}
                            {[...species.abilities.basic, ...species.abilities.adv, ...species.abilities.high].length === 0 && (
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>No abilities added yet</span>
                            )}
                        </div>

                        {/* Add ability button */}
                        <button onClick={() => { setShowAbilityPicker(showAbilityPicker === 'basic' ? null : 'basic'); setAbilityFilter({ search: '' }); }} style={{ padding: '6px 12px', background: showAbilityPicker === 'basic' ? '#f44336' : '#667eea', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
                            {showAbilityPicker === 'basic' ? 'Close' : '+ Add Ability'}
                        </button>

                        {/* Ability picker */}
                        {showAbilityPicker === 'basic' && (
                            <div style={{ marginTop: '8px', padding: '10px', background: 'var(--bg-secondary, #f5f5f5)', borderRadius: '8px' }}>
                                <input
                                    type="text"
                                    placeholder="Search abilities..."
                                    value={abilityFilter.search}
                                    onChange={(e) => setAbilityFilter({ search: e.target.value })}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-medium)', marginBottom: '8px', fontSize: '12px' }}
                                />
                                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                    Showing {filteredAbilities.length} of {totalAbilities} abilities
                                </div>
                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {filteredAbilities.slice(0, 100).map(([name, desc]) => (
                                        <div
                                            key={name}
                                            onClick={() => { addAbility('basic', name); setShowAbilityPicker(null); }}
                                            style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', fontSize: '12px' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{ fontWeight: 'bold' }}>{name}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>{desc?.substring(0, 100)}{desc?.length > 100 ? '...' : ''}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Level-Up Moves */}
                    <div className="form-group">
                        <label>Level-Up Moveset</label>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            Moves this species learns naturally as it levels up. Set the level at which each move is learned (Lv.0 or Lv.1 = known at capture).
                        </div>

                        {/* Selected moves */}
                        <div style={{ marginBottom: '10px' }}>
                            {species.levelUpMoves.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {species.levelUpMoves.map((moveEntry, idx) => {
                                        const moveData = GAME_DATA.moves?.[moveEntry.move];
                                        return (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'var(--bg-secondary, #f5f5f5)', borderRadius: '4px' }}>
                                                <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', minWidth: '35px' }}>Lv.{moveEntry.level}</span>
                                                <span style={{ fontWeight: 'bold', fontSize: '12px', flex: 1 }}>{moveEntry.move}</span>
                                                {moveData && <span style={{ padding: '2px 6px', background: getTypeColor(moveData.type), color: 'white', borderRadius: '8px', fontSize: '9px', fontWeight: 'bold' }}>{moveData.type}</span>}
                                                <button onClick={() => removeLevelUpMove(idx)} style={{ background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontSize: '11px' }} aria-label={`Remove ${moveEntry.move}`}>×</button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', padding: '8px', textAlign: 'center' }}>No moves added yet</div>
                            )}
                        </div>

                        {/* Add move button */}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '11px' }}>Lv.</span>
                            <input type="number" min="0" max="100" value={pendingMoveLevel} onChange={(e) => setPendingMoveLevel(parseInt(e.target.value) || 1)} style={{ width: '50px', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-medium)', textAlign: 'center', fontSize: '12px' }} />
                            <button onClick={() => { setShowMovePicker(!showMovePicker); setMoveFilter({ search: '', type: '', category: '' }); }} style={{ padding: '6px 12px', background: showMovePicker ? '#f44336' : '#667eea', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
                                {showMovePicker ? 'Close Move Picker' : '+ Add Move'}
                            </button>
                        </div>

                        {/* Move picker */}
                        {showMovePicker && (
                            <div style={{ padding: '10px', background: 'var(--bg-secondary, #f5f5f5)', borderRadius: '8px' }}>
                                {/* Filters */}
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder="Search moves..."
                                        value={moveFilter.search}
                                        onChange={(e) => setMoveFilter(prev => ({ ...prev, search: e.target.value }))}
                                        style={{ flex: 1, minWidth: '150px', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '12px' }}
                                    />
                                    <select value={moveFilter.type} onChange={(e) => setMoveFilter(prev => ({ ...prev, type: e.target.value }))} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '12px', background: moveFilter.type ? getTypeColor(moveFilter.type) : 'var(--input-bg)', color: moveFilter.type ? 'white' : 'var(--text-primary)' }}>
                                        <option value="">All Types</option>
                                        {POKEMON_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                    </select>
                                    <select value={moveFilter.category} onChange={(e) => setMoveFilter(prev => ({ ...prev, category: e.target.value }))} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '12px' }}>
                                        <option value="">All Categories</option>
                                        <option value="Physical">Physical</option>
                                        <option value="Special">Special</option>
                                        <option value="Status">Status</option>
                                    </select>
                                    {(moveFilter.search || moveFilter.type || moveFilter.category) && (
                                        <button onClick={() => setMoveFilter({ search: '', type: '', category: '' })} style={{ padding: '8px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Clear</button>
                                    )}
                                </div>

                                {/* Quick type buttons */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '8px' }}>
                                    {POKEMON_TYPES.map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setMoveFilter(prev => ({ ...prev, type: prev.type === type ? '' : type }))}
                                            style={{ padding: '2px 6px', borderRadius: '3px', border: moveFilter.type === type ? '2px solid var(--text-primary)' : '1px solid transparent', background: getTypeColor(type), color: 'white', cursor: 'pointer', fontSize: '9px', fontWeight: 'bold', opacity: moveFilter.type && moveFilter.type !== type ? 0.5 : 1 }}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>

                                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                    Showing {Math.min(filteredMoves.length, 100)} of {filteredMoves.length} matches ({totalMoves} total)
                                </div>

                                {/* Move list */}
                                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                    {filteredMoves.slice(0, 100).map(([name, data]) => (
                                        <div
                                            key={name}
                                            onClick={() => { addLevelUpMove(name); }}
                                            style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div>
                                                <span style={{ fontWeight: 'bold', fontSize: '12px' }}>{name}</span>
                                                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{data.damage || 'Status'} | {data.frequency}</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                <span style={{ padding: '2px 6px', background: getTypeColor(data.type), color: 'white', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold' }}>{data.type}</span>
                                                <span style={{ padding: '2px 6px', background: data.category === 'Physical' ? '#e65100' : data.category === 'Special' ? '#1565c0' : '#616161', color: 'white', borderRadius: '4px', fontSize: '9px' }}>{data.category?.charAt(0)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pokemon Skills */}
                    <div className="form-group">
                        <label>Movement & Capabilities</label>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            How this species moves and interacts with the environment. Higher values = faster/better at that movement type.
                        </div>
                        <div style={{ padding: '12px', background: 'var(--bg-secondary, #f5f5f5)', borderRadius: '8px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                                {SKILL_FIELDS.map(skill => (
                                    <div key={skill.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: 'bold',
                                            color: skill.color,
                                            minWidth: '70px'
                                        }}>
                                            {skill.label}
                                        </span>
                                        <input
                                            type="number"
                                            min="0"
                                            max={skill.max}
                                            value={species.skills?.[skill.key] || 0}
                                            onChange={(e) => updateSkill(skill.key, e.target.value)}
                                            style={{
                                                width: '50px',
                                                padding: '4px',
                                                borderRadius: '4px',
                                                border: `2px solid ${skill.color}`,
                                                textAlign: 'center',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                Movement skills (0-10), Intelligence (0-6). Set to 0 if not applicable.
                            </div>
                        </div>
                    </div>

                    {/* Evolution Chain */}
                    <div className="form-group">
                        <label>Evolution Chain</label>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            Define how this species connects to other species. Link to other custom species or official Pokédex entries.
                        </div>

                        {/* Evolves From */}
                        <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '6px', color: '#9c27b0' }}>
                                Pre-Evolution (What it evolves from)
                            </div>
                            <div style={{ padding: '10px', background: 'var(--bg-secondary, #f5f5f5)', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        placeholder="Species name (leave empty if none)"
                                        value={species.evolvesFrom?.species || ''}
                                        onChange={(e) => updateEvolvesFrom('species', e.target.value)}
                                        style={{ flex: 1, minWidth: '120px', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '12px' }}
                                    />
                                    {species.evolvesFrom?.species && (
                                        <>
                                            <select
                                                value={species.evolvesFrom?.method || 'level'}
                                                onChange={(e) => updateEvolvesFrom('method', e.target.value)}
                                                style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '11px' }}
                                            >
                                                {EVOLUTION_METHODS.map(m => (
                                                    <option key={m.value} value={m.value}>{m.label}</option>
                                                ))}
                                            </select>
                                            {species.evolvesFrom?.method === 'stone' ? (
                                                <select
                                                    value={species.evolvesFrom?.requirement || ''}
                                                    onChange={(e) => updateEvolvesFrom('requirement', e.target.value)}
                                                    style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '11px', minWidth: '120px' }}
                                                >
                                                    <option value="">Select Stone...</option>
                                                    {EVOLUTION_STONES.map(stone => (
                                                        <option key={stone} value={stone}>{stone}</option>
                                                    ))}
                                                </select>
                                            ) : species.evolvesFrom?.method === 'level' ? (
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="100"
                                                    placeholder="Level"
                                                    value={species.evolvesFrom?.requirement || ''}
                                                    onChange={(e) => updateEvolvesFrom('requirement', e.target.value)}
                                                    style={{ width: '70px', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '12px', textAlign: 'center' }}
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    placeholder={species.evolvesFrom?.method === 'trade' ? 'Item or Trade' : 'Requirement'}
                                                    value={species.evolvesFrom?.requirement || ''}
                                                    onChange={(e) => updateEvolvesFrom('requirement', e.target.value)}
                                                    style={{ width: '100px', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '12px' }}
                                                />
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Evolves To */}
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '6px', color: '#4caf50' }}>
                                Evolutions (What it evolves into)
                            </div>
                            <div style={{ padding: '10px', background: 'var(--bg-secondary, #f5f5f5)', borderRadius: '8px' }}>
                                {species.evolvesTo?.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                                        {species.evolvesTo.map((evo, idx) => (
                                            <div key={idx} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', padding: '8px', background: 'var(--bg-primary, white)', borderRadius: '4px' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Evolution species"
                                                    value={evo.species}
                                                    onChange={(e) => updateEvolution(idx, 'species', e.target.value)}
                                                    style={{ flex: 1, minWidth: '100px', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '12px' }}
                                                />
                                                <select
                                                    value={evo.method}
                                                    onChange={(e) => updateEvolution(idx, 'method', e.target.value)}
                                                    style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '11px' }}
                                                >
                                                    {EVOLUTION_METHODS.map(m => (
                                                        <option key={m.value} value={m.value}>{m.label}</option>
                                                    ))}
                                                </select>
                                                {evo.method === 'stone' ? (
                                                    <select
                                                        value={evo.requirement}
                                                        onChange={(e) => updateEvolution(idx, 'requirement', e.target.value)}
                                                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '11px', minWidth: '120px' }}
                                                    >
                                                        <option value="">Select Stone...</option>
                                                        {EVOLUTION_STONES.map(stone => (
                                                            <option key={stone} value={stone}>{stone}</option>
                                                        ))}
                                                    </select>
                                                ) : evo.method === 'level' ? (
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="100"
                                                        placeholder="Level"
                                                        value={evo.requirement}
                                                        onChange={(e) => updateEvolution(idx, 'requirement', e.target.value)}
                                                        style={{ width: '70px', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '12px', textAlign: 'center' }}
                                                    />
                                                ) : (
                                                    <input
                                                        type="text"
                                                        placeholder={evo.method === 'trade' ? 'Item or Trade' : 'Requirement'}
                                                        value={evo.requirement}
                                                        onChange={(e) => updateEvolution(idx, 'requirement', e.target.value)}
                                                        style={{ width: '100px', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '12px' }}
                                                    />
                                                )}
                                                <button
                                                    onClick={() => removeEvolution(idx)}
                                                    style={{ background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px', textAlign: 'center' }}>
                                        No evolutions defined (final form)
                                    </div>
                                )}
                                <button
                                    onClick={addEvolution}
                                    style={{ padding: '6px 12px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                                >
                                    + Add Evolution
                                </button>
                            </div>
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                            Methods: Level (enter level number), Stone (select from dropdown), Trade (item or just "Trade"), Happiness, Other/Special
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                        {editingIndex !== null && (
                            <button className="btn btn-secondary" onClick={() => { setSpecies({ ...DEFAULT_SPECIES }); setEditingIndex(null); }} style={{ marginRight: 'auto' }}>Cancel Edit</button>
                        )}
                        <button className="btn btn-secondary" onClick={handleClose}>Close</button>
                        <button className="btn btn-primary" disabled={!species.species.trim()} onClick={handleSaveSpecies}>
                            {editingIndex !== null ? 'Update Species' : 'Save Species'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomSpeciesModal;
