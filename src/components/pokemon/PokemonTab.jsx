// ============================================================
// Pokemon Tab Component
// ============================================================
// Main Pokemon management tab

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import PokemonCard from './PokemonCard.jsx';
import { MAX_PARTY_SIZE } from '../../data/constants.js';
import { importSinglePokemon } from '../../utils/exportUtils.js';
import { POKEMON_TYPES, getCombinedTypeEffectiveness } from '../../data/typeChart.js';
import { getTypeColor } from '../../utils/typeUtils.js';
import toast from '../../utils/toast.js';
import { useGameData, useUI, useModal, useTrainerContext, usePokemonContext } from '../../contexts/index.js';
import { MAX_POKEMON_IMPORT_BYTES } from '../../data/constants.js';
import { safeLocalStorageGet, safeLocalStorageSet } from '../../utils/storageUtils.js';

/**
 * PokemonTab - Main Pokemon management container
 * Uses contexts directly for all state
 */
const PokemonTab = () => {
    // Get state from contexts
    const { pokedex, pokedexLoading, GAME_DATA, customSpecies, setCustomSpecies } = useGameData();
    const { pokemonView, setPokemonView, editingPokemon: editingPokemonId, setEditingPokemon: setEditingPokemonId } = useUI();
    const { showDetail, setShowCustomSpeciesModal, setEditingCustomSpeciesId, setShowBulkExpModal, openComparison } = useModal();
    const { trainer, setTrainer, party, reserve, setParty, setReserve, moveToParty, moveToReserve, movePokemonUp, movePokemonDown, sortPokemonList, reorderPokemon } = useTrainerContext();
    const { addPokemon, updatePokemon, restorePokemon, deletePokemon, importPokemon, getEvolutionOptions, evolvePokemon, devolvePokemon } = usePokemonContext();
    const [filter, setFilter] = useState(() => ({
        search: '',
        type: safeLocalStorageGet('pta-pokemon-filter-type', '')
    }));
    const [sortDir, setSortDir] = useState(() => safeLocalStorageGet('pta-pokemon-sort-dir', 'asc'));
    const [lastSortBy, setLastSortBy] = useState(() => safeLocalStorageGet('pta-pokemon-sort-by', ''));
    const [showImportOptions, setShowImportOptions] = useState(false);
    const fileInputRef = useRef(null);
    const importDropdownRef = useRef(null);

    // Drag-and-drop state
    const [dragId, setDragId] = useState(null);
    const [dragOverId, setDragOverId] = useState(null);

    // Compare mode state
    const [compareMode, setCompareMode] = useState(false);
    const [compareSelected, setCompareSelected] = useState([]);

    // Coverage panel
    const [showCoverage, setShowCoverage] = useState(false);

    // Party presets
    const [showPresets, setShowPresets] = useState(false);
    const [presetName, setPresetName] = useState('');
    const partyPresets = trainer.partyPresets || [];

    const handleSavePreset = () => {
        const name = presetName.trim();
        if (!name) { toast.warning('Enter a preset name.'); return; }
        if (!party.length) { toast.warning('Party is empty.'); return; }
        const preset = { id: Date.now(), name, pokemonIds: party.map(p => p.id) };
        setTrainer(prev => ({ ...prev, partyPresets: [...(prev.partyPresets || []), preset] }));
        setPresetName('');
        toast.success(`Saved preset "${name}"`);
    };

    const handleLoadPreset = (preset) => {
        const all = [...party, ...reserve];
        const ids = new Set(preset.pokemonIds);
        const newParty = preset.pokemonIds.map(id => all.find(p => p.id === id)).filter(Boolean).slice(0, MAX_PARTY_SIZE);
        const newReserve = all.filter(p => !newParty.find(np => np.id === p.id));
        setParty(newParty);
        setReserve(newReserve);
        toast.success(`Loaded preset "${preset.name}"`);
    };

    const handleDeletePreset = (presetId) => {
        setTrainer(prev => ({ ...prev, partyPresets: (prev.partyPresets || []).filter(p => p.id !== presetId) }));
    };

    // Team type coverage — computed from party types + move types
    const teamCoverage = useMemo(() => {
        if (!party.length) return null;
        const weakCount = {};
        const resistCount = {};
        const immuneCount = {};
        party.forEach(p => {
            const eff = getCombinedTypeEffectiveness(p.types || []);
            [...eff.weak, ...eff.superWeak].forEach(t => { weakCount[t] = (weakCount[t] || 0) + 1; });
            [...eff.resist, ...eff.superResist].forEach(t => { resistCount[t] = (resistCount[t] || 0) + 1; });
            eff.immune.forEach(t => { immuneCount[t] = (immuneCount[t] || 0) + 1; });
        });
        const offenseTypes = new Set();
        party.forEach(p => {
            (p.types || []).forEach(t => offenseTypes.add(t));
            (p.moves || []).forEach(m => { if (m.type) offenseTypes.add(m.type); });
        });
        return { weakCount, resistCount, immuneCount, offenseTypes };
    }, [party]);

    // Custom species export/import handlers
    const customSpeciesFileRef = useRef(null);

    const handleExportCustomSpecies = () => {
        if (!customSpecies.length) { toast.warning('No custom species to export.'); return; }
        const data = JSON.stringify({ type: 'pta-custom-species', version: '1.0', customSpecies }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pta-custom-species-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${customSpecies.length} custom species.`);
    };

    const handleImportCustomSpecies = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        if (file.size > 500_000) { toast.error('File too large (max 500 KB).'); return; }
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const parsed = JSON.parse(ev.target.result);
                if (parsed.type !== 'pta-custom-species' || !Array.isArray(parsed.customSpecies)) {
                    toast.error('Invalid custom species file.'); return;
                }
                const incoming = parsed.customSpecies.filter(s => s && typeof s.species === 'string');
                setCustomSpecies(prev => {
                    const existing = new Set(prev.map(s => s.species?.toLowerCase()));
                    const fresh = incoming.filter(s => !existing.has(s.species?.toLowerCase()));
                    toast.success(`Imported ${fresh.length} new species (${incoming.length - fresh.length} duplicates skipped).`);
                    return [...prev, ...fresh];
                });
            } catch { toast.error('Could not parse file — is it valid JSON?'); }
        };
        reader.readAsText(file);
    };

    const handleDragStart = useCallback((id) => setDragId(id), []);
    const handleDragOver = useCallback((id) => { if (id !== dragId) setDragOverId(id); }, [dragId]);
    const handleDrop = useCallback((id) => {
        if (dragId && id !== dragId) reorderPokemon(dragId, id, pokemonView === 'party');
        setDragId(null);
        setDragOverId(null);
    }, [dragId, reorderPokemon, pokemonView]);
    const handleDragEnd = useCallback(() => { setDragId(null); setDragOverId(null); }, []);

    const toggleCompareSelect = useCallback((id) => {
        setCompareSelected(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id);
            if (prev.length >= 2) return prev;
            return [...prev, id];
        });
    }, []);

    const exitCompareMode = useCallback(() => {
        setCompareMode(false);
        setCompareSelected([]);
    }, []);

    // Persist filter and sort preferences across sessions
    useEffect(() => { safeLocalStorageSet('pta-pokemon-filter-type', filter.type); }, [filter.type]);
    useEffect(() => { safeLocalStorageSet('pta-pokemon-sort-dir', sortDir); }, [sortDir]);
    useEffect(() => { safeLocalStorageSet('pta-pokemon-sort-by', lastSortBy); }, [lastSortBy]);

    // Close import dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (importDropdownRef.current && !importDropdownRef.current.contains(event.target)) {
                setShowImportOptions(false);
            }
        };

        if (showImportOptions) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showImportOptions]);

    // Handle file import
    const handleFileImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Security: Check file size before reading
        if (file.size > MAX_POKEMON_IMPORT_BYTES) {
            toast.error('File too large. Maximum file size is 100KB.');
            event.target.value = '';
            setShowImportOptions(false);
            return;
        }

        // Security: Check file type
        if (!file.name.endsWith('.json') && file.type !== 'application/json') {
            toast.error('Invalid file type. Please select a JSON file.');
            event.target.value = '';
            setShowImportOptions(false);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const pokemon = importSinglePokemon(e.target.result);
                if (pokemon) {
                    importPokemon(pokemon, pokemonView === 'party');
                    toast.success(`${pokemon.name || pokemon.species} was added to your ${pokemonView}!`);
                }
            } catch (err) {
                toast.error('Error reading file: ' + err.message);
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input
        setShowImportOptions(false);
    };

    // Handle clipboard import
    const handleClipboardImport = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const pokemon = importSinglePokemon(text);
            if (pokemon) {
                importPokemon(pokemon, pokemonView === 'party');
                toast.success(`${pokemon.name || pokemon.species} was added to your ${pokemonView}!`);
            } else {
                toast.error('Invalid Pokemon data in clipboard. Make sure you copied a valid PTA Pokemon export.');
            }
        } catch (err) {
            toast.error('Could not read from clipboard. Please use the file import option instead.');
        }
        setShowImportOptions(false);
    };

    // Current pokemon list based on view
    const currentList = pokemonView === 'party' ? party : reserve;

    // Filtered list (sorting is done via sortPokemonList action, not here)
    const filteredList = useMemo(() => {
        let result = [...currentList];

        // Search filter
        if (filter.search.trim()) {
            const query = filter.search.toLowerCase();
            result = result.filter(p =>
                (p.name || '').toLowerCase().includes(query) ||
                (p.species || '').toLowerCase().includes(query) ||
                p.types?.some(t => t.toLowerCase().includes(query))
            );
        }

        // Type filter
        if (filter.type) {
            result = result.filter(p =>
                p.types?.some(t => t.toLowerCase() === filter.type.toLowerCase())
            );
        }

        return result;
    }, [currentList, filter]);

    const handleAddPokemon = () => {
        addPokemon();
    };

    // Handle sort action - sorts the actual data
    const handleSort = (sortBy, direction) => {
        if (sortBy) {
            setLastSortBy(sortBy);
            sortPokemonList(pokemonView === 'party', sortBy, direction || sortDir);
        }
    };

    return (
        <div>
            <h2 className="section-title">Pokemon</h2>
            <p className="section-description">
                Party Pokémon travel with you (max {MAX_PARTY_SIZE}). Reserve stores additional Pokémon for later.
            </p>

            {/* View Toggle */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="tabs" style={{ flex: 1 }}>
                    <button
                        className={`tab ${pokemonView === 'party' ? 'active' : ''}`}
                        onClick={() => setPokemonView('party')}
                    >
                        Party ({party.length}/{MAX_PARTY_SIZE})
                    </button>
                    <button
                        className={`tab ${pokemonView === 'reserve' ? 'active' : ''}`}
                        onClick={() => setPokemonView('reserve')}
                    >
                        Reserve ({reserve.length})
                    </button>
                </div>

                {/* Import Pokemon Button */}
                <div ref={importDropdownRef} style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowImportOptions(!showImportOptions)}
                        className="pokemon-action-btn import"
                        title="Import a Pokemon from another trainer (trade/gift)"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        Import
                    </button>

                    {/* Import Options Dropdown */}
                    {showImportOptions && (
                        <div className="pokemon-import-dropdown" style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '4px',
                            borderRadius: '8px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                            minWidth: '200px',
                            zIndex: 100,
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                padding: '10px 14px',
                                background: 'linear-gradient(135deg, #4caf50, #43a047)',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 700
                            }}>
                                Import Pokemon
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="pokemon-import-option"
                                style={{
                                    width: '100%',
                                    padding: '12px 14px',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    fontSize: '14px',
                                    transition: 'background 0.15s'
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                </svg>
                                From File (.json)
                            </button>
                            <button
                                onClick={handleClipboardImport}
                                className="pokemon-import-option"
                                style={{
                                    width: '100%',
                                    padding: '12px 14px',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    fontSize: '14px',
                                    transition: 'background 0.15s'
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9c27b0" strokeWidth="2">
                                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                                </svg>
                                From Clipboard
                            </button>
                            <div className="pokemon-import-footer" style={{
                                padding: '8px 14px',
                                fontSize: '11px',
                                borderTop: '1px solid var(--border-light, #e8e3f3)'
                            }}>
                                Receive Pokemon from trades or gifts
                            </div>
                        </div>
                    )}

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileImport}
                        style={{ display: 'none' }}
                    />
                </div>

                <button
                    onClick={() => {
                        if (compareMode) {
                            exitCompareMode();
                        } else {
                            setCompareMode(true);
                            setCompareSelected([]);
                        }
                    }}
                    className={`btn ${compareMode ? 'btn-purple' : 'btn-secondary'}`}
                    style={{ padding: '10px 16px' }}
                    title="Compare two Pokémon side by side"
                >
                    {compareMode ? 'Exit Compare' : 'Compare'}
                </button>

                {compareMode && compareSelected.length === 2 && (
                    <button
                        onClick={() => { openComparison(compareSelected[0], compareSelected[1]); exitCompareMode(); }}
                        className="btn btn-purple"
                        style={{ padding: '10px 16px' }}
                    >
                        View Comparison →
                    </button>
                )}

                <button
                    onClick={() => setShowBulkExpModal(true)}
                    className="btn btn-secondary"
                    style={{ padding: '10px 16px' }}
                    title="Award EXP to multiple party Pokemon"
                >
                    Award EXP
                </button>

                <button
                    onClick={handleAddPokemon}
                    className="btn btn-purple"
                    style={{ padding: '10px 20px' }}
                >
                    + Add Pokémon
                </button>
            </div>

            {/* Search and Filters */}
            <div className="section-card" style={{ marginBottom: '15px' }}>
                <div style={{ marginBottom: '12px' }}>
                    <input
                        type="text"
                        placeholder="Search by name, species, or type..."
                        value={filter.search}
                        onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                        style={{
                            width: '100%',
                            padding: '10px 15px',
                            borderRadius: '8px',
                            border: '2px solid var(--border-medium)',
                            fontSize: '14px',
                            background: 'var(--input-bg)',
                            color: 'var(--text-primary)'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                    <select
                        value={filter.type}
                        onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-medium)',
                            fontSize: '13px',
                            background: filter.type ? getTypeColor(filter.type) : 'var(--input-bg)',
                            color: filter.type ? 'white' : 'var(--text-primary)'
                        }}
                    >
                        <option value="">All Types</option>
                        {POKEMON_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>

                    <select
                        value=""
                        onChange={(e) => handleSort(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '13px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                    >
                        <option value="">Sort by...</option>
                        <option value="name">Name</option>
                        <option value="level">Level</option>
                        <option value="species">Species</option>
                        <option value="type">Type</option>
                    </select>

                    <button
                        onClick={() => {
                            const newDir = sortDir === 'asc' ? 'desc' : 'asc';
                            setSortDir(newDir);
                            if (lastSortBy) handleSort(lastSortBy, newDir);
                        }}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}
                    >
                        {sortDir === 'asc' ? 'A-Z' : 'Z-A'}
                    </button>

                    {(filter.search || filter.type) && (
                        <button
                            onClick={() => setFilter({ search: '', type: '' })}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', background: '#dc3545', color: 'white', cursor: 'pointer', fontSize: '13px' }}
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Team Coverage Panel — party view only */}
            {pokemonView === 'party' && party.length > 0 && (
                <div className="section-card" style={{ marginBottom: '15px' }}>
                    <div
                        onClick={() => setShowCoverage(v => !v)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}
                    >
                        <span style={{ fontSize: '16px' }}>📊</span>
                        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Team Coverage</span>
                        <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>
                            {showCoverage ? '▲ Hide' : '▼ Show'}
                        </span>
                    </div>

                    {showCoverage && teamCoverage && (
                        <div style={{ marginTop: '14px' }}>
                            {/* Defensive weaknesses */}
                            <div style={{ marginBottom: '14px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    🛡 Defensive Weaknesses
                                </div>
                                {(() => {
                                    const sorted = POKEMON_TYPES
                                        .filter(t => teamCoverage.weakCount[t])
                                        .sort((a, b) => (teamCoverage.weakCount[b] || 0) - (teamCoverage.weakCount[a] || 0));
                                    if (!sorted.length) return (
                                        <span style={{ fontSize: '12px', color: '#4caf50' }}>✅ No shared weaknesses!</span>
                                    );
                                    return (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {sorted.map(t => (
                                                <span key={t} style={{
                                                    padding: '3px 8px',
                                                    borderRadius: '10px',
                                                    background: getTypeColor(t),
                                                    color: 'white',
                                                    fontSize: '11px',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    {t}
                                                    <span style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '0 4px', fontSize: '10px' }}>
                                                        ×{teamCoverage.weakCount[t]}
                                                    </span>
                                                </span>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Immunities */}
                            {Object.keys(teamCoverage.immuneCount).length > 0 && (
                                <div style={{ marginBottom: '14px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        ⬛ Immunities
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {POKEMON_TYPES.filter(t => teamCoverage.immuneCount[t]).map(t => (
                                            <span key={t} style={{
                                                padding: '3px 8px', borderRadius: '10px',
                                                background: '#333', color: 'white',
                                                fontSize: '11px', fontWeight: 'bold',
                                                display: 'flex', alignItems: 'center', gap: '4px'
                                            }}>
                                                {t}
                                                <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '0 4px', fontSize: '10px' }}>
                                                    ×{teamCoverage.immuneCount[t]}
                                                </span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Offensive coverage */}
                            <div>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    ⚔️ Offensive Coverage (STAB + Move Types)
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {POKEMON_TYPES.map(t => {
                                        const covered = teamCoverage.offenseTypes.has(t);
                                        return (
                                            <span key={t} style={{
                                                padding: '3px 8px', borderRadius: '10px',
                                                background: covered ? getTypeColor(t) : 'var(--border-medium)',
                                                color: covered ? 'white' : 'var(--text-muted)',
                                                fontSize: '11px', fontWeight: covered ? 'bold' : 'normal',
                                                opacity: covered ? 1 : 0.5
                                            }}>
                                                {t}
                                            </span>
                                        );
                                    })}
                                </div>
                                {teamCoverage.offenseTypes.size < POKEMON_TYPES.length && (
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                                        Missing: {POKEMON_TYPES.filter(t => !teamCoverage.offenseTypes.has(t)).join(', ')}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Party Presets */}
            {pokemonView === 'party' && (
                <div className="section-card" style={{ marginBottom: '15px' }}>
                    <div
                        onClick={() => setShowPresets(v => !v)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}
                    >
                        <span style={{ fontSize: '16px' }}>⭐</span>
                        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Party Presets</span>
                        {partyPresets.length > 0 && (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--border-medium)', borderRadius: '10px', padding: '1px 7px' }}>
                                {partyPresets.length}
                            </span>
                        )}
                        <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>
                            {showPresets ? '▲ Hide' : '▼ Show'}
                        </span>
                    </div>

                    {showPresets && (
                        <div style={{ marginTop: '12px' }}>
                            {/* Save current party */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                <input
                                    type="text"
                                    value={presetName}
                                    onChange={(e) => setPresetName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                                    placeholder="Preset name (e.g. Cave Team)"
                                    style={{
                                        flex: 1, padding: '8px 10px', borderRadius: '6px',
                                        border: '1px solid var(--border-medium)',
                                        background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '13px'
                                    }}
                                />
                                <button
                                    onClick={handleSavePreset}
                                    style={{ padding: '8px 14px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                                >
                                    Save Party
                                </button>
                            </div>

                            {/* Preset list */}
                            {partyPresets.length === 0 ? (
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '8px' }}>
                                    No presets saved yet.
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: '6px' }}>
                                    {partyPresets.map(preset => {
                                        const allPokemon = [...party, ...reserve];
                                        const members = preset.pokemonIds.map(id => allPokemon.find(p => p.id === id)).filter(Boolean);
                                        return (
                                            <div key={preset.id} style={{
                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                padding: '8px 10px', borderRadius: '6px',
                                                background: 'var(--input-bg)', border: '1px solid var(--border-medium)'
                                            }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{preset.name}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {members.length ? members.map(p => p.name || p.species).join(', ') : '(pokemon not found)'}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleLoadPreset(preset)}
                                                    style={{ padding: '5px 10px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                                                >
                                                    Load
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePreset(preset.id)}
                                                    style={{ padding: '5px 8px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                                                    title="Delete preset"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Custom Species — Export / Import */}
            {customSpecies.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {customSpecies.length} custom species
                    </span>
                    <button
                        onClick={handleExportCustomSpecies}
                        style={{ padding: '6px 12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                    >
                        ↑ Export Custom Species
                    </button>
                    <button
                        onClick={() => customSpeciesFileRef.current?.click()}
                        style={{ padding: '6px 12px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                        ↓ Import Custom Species
                    </button>
                    <input ref={customSpeciesFileRef} type="file" accept=".json" onChange={handleImportCustomSpecies} style={{ display: 'none' }} />
                </div>
            )}
            {customSpecies.length === 0 && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', alignItems: 'center' }}>
                    <button
                        onClick={() => customSpeciesFileRef.current?.click()}
                        style={{ padding: '6px 12px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                        ↓ Import Custom Species
                    </button>
                    <input ref={customSpeciesFileRef} type="file" accept=".json" onChange={handleImportCustomSpecies} style={{ display: 'none' }} />
                </div>
            )}

            {/* Pokemon List */}
            {filteredList.length === 0 ? (
                <div className="empty-state" style={{ marginTop: '10px' }}>
                    {currentList.length === 0 ? (
                        <>
                            <span className="empty-state-icon">
                                {pokemonView === 'party' ? '🎮' : '📦'}
                            </span>
                            <p className="empty-state-title">
                                {pokemonView === 'party' ? 'No Pokémon in your party' : 'Reserve is empty'}
                            </p>
                            <p className="empty-state-description">
                                {pokemonView === 'party'
                                    ? trainer.level === 0
                                        ? 'Build your team here. Party holds up to 6 Pokémon; extras go to Reserve.'
                                        : 'Add Pokémon to your party to take them on your adventure!'
                                    : 'Move Pokémon here from your party, or add new ones to store them.'}
                            </p>
                            <button
                                onClick={handleAddPokemon}
                                className="btn btn-purple"
                                style={{ marginTop: '16px' }}
                            >
                                + Add Your First Pokémon
                            </button>
                        </>
                    ) : (
                        <>
                            <span className="empty-state-icon">🔍</span>
                            <p className="empty-state-title">No matches found</p>
                            <p className="empty-state-description">
                                Try a different search term or clear the filters.
                            </p>
                            <button
                                onClick={() => setFilter({ search: '', type: '' })}
                                className="btn btn-secondary"
                                style={{ marginTop: '12px' }}
                            >
                                Clear Filters
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                    {filteredList.map((pokemon) => {
                        // Use actual position in unfiltered list for move up/down
                        const actualIndex = currentList.findIndex(p => p.id === pokemon.id);
                        return (
                            <PokemonCard
                                key={pokemon.id}
                                pokemon={pokemon}
                                isEditing={editingPokemonId === pokemon.id}
                                setEditing={(editing) => setEditingPokemonId(editing ? pokemon.id : null)}
                                updatePokemon={(updates) => updatePokemon(pokemon.id, updates)}
                                restorePokemon={(snapshot) => restorePokemon(pokemon.id, snapshot)}
                                deletePokemon={() => deletePokemon(pokemon.id)}
                                isInParty={pokemonView === 'party'}
                                canMoveToParty={pokemonView === 'reserve' && party.length < MAX_PARTY_SIZE}
                                onMoveToParty={() => moveToParty(pokemon.id)}
                                onMoveToReserve={() => moveToReserve(pokemon.id)}
                                onMoveUp={() => movePokemonUp(pokemon.id, pokemonView === 'party')}
                                onMoveDown={() => movePokemonDown(pokemon.id, pokemonView === 'party')}
                                canMoveUp={actualIndex > 0}
                                canMoveDown={actualIndex < currentList.length - 1}
                                evolvePokemon={evolvePokemon}
                                devolvePokemon={devolvePokemon}
                                isDragging={dragId === pokemon.id}
                                isDragOver={dragOverId === pokemon.id}
                                onDragStart={handleDragStart}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onDragEnd={handleDragEnd}
                                compareMode={compareMode}
                                isCompareSelected={compareSelected.includes(pokemon.id)}
                                onToggleCompare={toggleCompareSelect}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PokemonTab;
