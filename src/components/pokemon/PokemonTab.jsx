// ============================================================
// Pokemon Tab Component
// ============================================================
// Main Pokemon management tab

import React, { useState, useMemo, useRef, useEffect } from 'react';
import PokemonCard from './PokemonCard.jsx';
import { MAX_PARTY_SIZE } from '../../data/constants.js';
import { importSinglePokemon } from '../../utils/exportUtils.js';

/**
 * PokemonTab - Main Pokemon management container
 */
const PokemonTab = ({
    party,
    reserve,
    pokemonView,
    setPokemonView,
    editingPokemonId,
    setEditingPokemonId,
    addPokemon,
    updatePokemon,
    deletePokemon,
    moveToParty,
    moveToReserve,
    movePokemonUp,
    movePokemonDown,
    pokedex,
    GAME_DATA,
    showDetail,
    getEvolutionOptions,
    evolvePokemon,
    devolvePokemon,
    importPokemon
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showImportOptions, setShowImportOptions] = useState(false);
    const fileInputRef = useRef(null);
    const importDropdownRef = useRef(null);

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

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const pokemon = importSinglePokemon(e.target.result);
                if (pokemon) {
                    importPokemon(pokemon, pokemonView === 'party');
                    alert(`${pokemon.name || pokemon.species} was added to your ${pokemonView}!`);
                } else {
                    alert('Invalid Pokemon file. Please use a valid PTA Pokemon export file.');
                }
            } catch (err) {
                alert('Error reading file: ' + err.message);
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
                alert(`${pokemon.name || pokemon.species} was added to your ${pokemonView}!`);
            } else {
                alert('Invalid Pokemon data in clipboard. Make sure you copied a valid PTA Pokemon export.');
            }
        } catch (err) {
            alert('Could not read from clipboard. Please use the file import option instead.');
        }
        setShowImportOptions(false);
    };

    // Current pokemon list based on view
    const currentList = pokemonView === 'party' ? party : reserve;

    // Filtered list
    const filteredList = useMemo(() => {
        if (!searchQuery.trim()) return currentList;
        const query = searchQuery.toLowerCase();
        return currentList.filter(p =>
            (p.name || '').toLowerCase().includes(query) ||
            (p.species || '').toLowerCase().includes(query) ||
            p.types?.some(t => t.toLowerCase().includes(query))
        );
    }, [currentList, searchQuery]);

    const handleAddPokemon = () => {
        addPokemon();
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
                    onClick={handleAddPokemon}
                    className="btn btn-purple"
                    style={{ padding: '10px 20px' }}
                >
                    + Add Pokémon
                </button>
            </div>

            {/* Search */}
            <div style={{ marginBottom: '15px' }}>
                <input
                    type="text"
                    placeholder="Search by name, species, or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px 15px',
                        borderRadius: '8px',
                        border: '2px solid #e8e3f3',
                        fontSize: '14px'
                    }}
                />
            </div>

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
                                    ? 'Add Pokémon to your party to take them on your adventure!'
                                    : 'Move Pokémon here from your party or add new ones.'}
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
                                Try a different search term or clear the search.
                            </p>
                            <button
                                onClick={() => setSearchQuery('')}
                                className="btn btn-secondary"
                                style={{ marginTop: '12px' }}
                            >
                                Clear Search
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                    {filteredList.map((pokemon, index) => (
                        <PokemonCard
                            key={pokemon.id}
                            pokemon={pokemon}
                            isEditing={editingPokemonId === pokemon.id}
                            setEditing={(editing) => setEditingPokemonId(editing ? pokemon.id : null)}
                            updatePokemon={(updates) => updatePokemon(pokemon.id, updates)}
                            deletePokemon={() => deletePokemon(pokemon.id)}
                            isInParty={pokemonView === 'party'}
                            canMoveToParty={pokemonView === 'reserve' && party.length < MAX_PARTY_SIZE}
                            onMoveToParty={() => moveToParty(pokemon.id)}
                            onMoveToReserve={() => moveToReserve(pokemon.id)}
                            onMoveUp={() => movePokemonUp(pokemon.id, pokemonView === 'party')}
                            onMoveDown={() => movePokemonDown(pokemon.id, pokemonView === 'party')}
                            canMoveUp={index > 0}
                            canMoveDown={index < filteredList.length - 1}
                            pokedex={pokedex}
                            GAME_DATA={GAME_DATA}
                            showDetail={showDetail}
                            getEvolutionOptions={getEvolutionOptions}
                            evolvePokemon={evolvePokemon}
                            devolvePokemon={devolvePokemon}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default PokemonTab;
