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
                    style={{
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    + Add Pokemon
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
                <div className="section-card-purple" style={{ textAlign: 'center', padding: '40px' }}>
                    {currentList.length === 0 ? (
                        <>
                            <div style={{ fontSize: '48px', marginBottom: '15px' }}>🎮</div>
                            <div style={{ color: '#666', marginBottom: '15px' }}>
                                {pokemonView === 'party' ? 'No Pokemon in your party yet' : 'No Pokemon in reserve'}
                            </div>
                            <button
                                onClick={handleAddPokemon}
                                style={{
                                    padding: '12px 24px',
                                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Add Your First Pokemon
                            </button>
                        </>
                    ) : (
                        <div style={{ color: '#666' }}>No Pokemon match your search</div>
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
