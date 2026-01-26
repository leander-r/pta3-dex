// ============================================================
// Pokemon Tab Component
// ============================================================
// Main Pokemon management tab

import React, { useState, useMemo } from 'react';
import PokemonCard from './PokemonCard.jsx';
import { MAX_PARTY_SIZE } from '../../data/constants.js';

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
    devolvePokemon
}) => {
    const [searchQuery, setSearchQuery] = useState('');

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
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px', marginTop: '-5px' }}>
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
