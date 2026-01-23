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

    const handleSelectSpecies = (speciesData) => {
        updatePokemon({
            species: speciesData.species,
            name: pokemon.name === 'New Pokemon' || !pokemon.name ? speciesData.species : pokemon.name,
            types: speciesData.types || [],
            baseStats: speciesData.baseStats || { hp: 10, atk: 10, def: 10, satk: 10, sdef: 10, spd: 10 },
            ability: speciesData.abilities?.basic?.[0] || '',
            availableLevelUpMoves: speciesData.levelUpMoves || []
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
                            HP: {currentHP}/{maxHP} | {pokemon.nature || 'Hardy'} | {pokemon.ability || 'No Ability'}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {canMoveUp && (
                            <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} style={quickBtnStyle}></button>
                        )}
                        {canMoveDown && (
                            <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} style={quickBtnStyle}></button>
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
                {['info', 'stats', 'moves', 'evolution'].map(tab => (
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

                        {/* Gender & Ability */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
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
                                    <option value="genderless">Genderless</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>Ability</label>
                                <input
                                    type="text"
                                    value={pokemon.ability || ''}
                                    onChange={(e) => updatePokemon({ ability: e.target.value })}
                                    placeholder="Enter ability..."
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                />
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
                                                    updatePokemon({
                                                        addedStats: { ...pokemon.addedStats, [stat]: (pokemon.addedStats?.[stat] || 0) - 1 },
                                                        statPointsAvailable: (pokemon.statPointsAvailable || 0) + 1
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
                                                        statPointsAvailable: (pokemon.statPointsAvailable || 0) - 1
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
                            Moves: {(pokemon.moves || []).length}/6 (4 natural + 2 taught)
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
                                    borderLeft: `4px solid ${getTypeColor(move.type)}`
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{move.name}</div>
                                    <div style={{ fontSize: '11px', color: '#666' }}>
                                        {move.type} | {move.category} | {move.damage || 'Status'}
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
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
                                                            onClick={() => evolvePokemon(pokemon.id, evo.species, isInParty)}
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
                                                            Evolve
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
                                                    onClick={() => devolvePokemon(pokemon.id, canDevolve.species, isInParty)}
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
    fontSize: '12px'
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
