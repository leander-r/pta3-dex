// ============================================================
// Custom Content Section Component
// ============================================================
// One place to see every homebrew species / move / item the user has
// created, since each lives in a different part of the app otherwise
// (species picker, a Pokémon's move list, the shared inventory).

import React, { useMemo } from 'react';
import { GAME_DATA } from '../../data/configs.js';
import { getTypeColor } from '../../utils/typeUtils.js';
import { useGameData, useModal, useTrainerContext, useData, useUI } from '../../contexts/index.js';

const ACTION_BTN = {
    padding: '3px 10px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    cursor: 'pointer',
    color: 'white'
};

const SectionHeading = ({ children, count }) => (
    <h3 style={{ marginBottom: '10px', marginTop: '24px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {children}
        <span style={{
            fontSize: '11px',
            fontWeight: 'bold',
            background: 'var(--bg-secondary)',
            color: 'var(--text-muted)',
            padding: '2px 8px',
            borderRadius: '10px'
        }}>
            {count}
        </span>
    </h3>
);

/**
 * CustomContentSection - Lists every custom species, move, and item the
 * user has created, with quick links/actions to manage each.
 * Uses GameDataContext for customSpecies, TrainerContext for all trainers'
 * Pokémon (to find custom moves), DataContext for inventory, UIContext to
 * jump to a Pokémon's card.
 */
const CustomContentSection = () => {
    const { customSpecies, setCustomSpecies } = useGameData();
    const { showConfirm, setShowCustomSpeciesModal, setEditingCustomSpeciesId } = useModal();
    const { trainers, setActiveTrainerId } = useTrainerContext();
    const { inventory, setInventory } = useData();
    const { setActiveTab, setEditingPokemon } = useUI();

    // Custom moves live directly on whichever Pokémon they were created for (no
    // shared pool), so finding them means scanning every trainer's party + reserve.
    const customMoves = useMemo(() => {
        const results = [];
        (trainers || []).forEach(trainer => {
            const allPokemon = [...(trainer.party || []), ...(trainer.reserve || [])];
            allPokemon.forEach(poke => {
                (poke.moves || []).forEach(move => {
                    if (move.source === 'custom') {
                        results.push({ move, pokemon: poke, trainer });
                    }
                });
            });
        });
        return results;
    }, [trainers]);

    // Custom items aren't flagged with an explicit field — anything in the shared
    // inventory whose name isn't in the official GAME_DATA.items catalog is custom.
    const customItems = useMemo(() => {
        const officialNames = new Set(Object.keys(GAME_DATA.items || {}).map(n => n.toLowerCase()));
        return (inventory || []).filter(item => !officialNames.has((item.name || '').toLowerCase()));
    }, [inventory]);

    const totalCount = customSpecies.length + customMoves.length + customItems.length;

    const handleDeleteSpecies = (sp) => {
        showConfirm({
            title: 'Delete Species',
            message: `Delete custom species "${sp.species}"? Any Pokémon already using it will keep their data, but the species entry won't be selectable anymore.`,
            danger: true,
            onConfirm: () => setCustomSpecies(prev => prev.filter(s => s.id !== sp.id))
        });
    };

    const handleEditSpecies = (sp) => {
        setEditingCustomSpeciesId(sp.id);
        setShowCustomSpeciesModal(true);
    };

    const handleDeleteItem = (itemName) => {
        showConfirm({
            title: 'Delete Item',
            message: `Delete all "${itemName}" from inventory?`,
            danger: true,
            onConfirm: () => setInventory(prev => prev.filter(i => i.name.toLowerCase() !== itemName.toLowerCase()))
        });
    };

    const jumpToPokemon = (trainerId, pokemonId) => {
        setActiveTrainerId(trainerId);
        setActiveTab('pokemon');
        setEditingPokemon(pokemonId);
    };

    if (totalCount === 0) {
        return (
            <div>
                <h3 style={{ marginBottom: '15px' }}>Custom Content</h3>
                <div className="empty-state" style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <span className="empty-state-icon" style={{ fontSize: '32px' }}>🧩</span>
                    <p className="empty-state-title" style={{ fontWeight: 'bold', marginTop: '10px' }}>No custom content yet</p>
                    <p className="empty-state-description" style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '440px', margin: '8px auto 0' }}>
                        Homebrew species, moves, and items you create show up here so you can find and manage
                        them in one place. Look for <strong>+ Custom Species</strong> in a Pokémon's species picker,
                        <strong> + Create Custom Move</strong> in its move browser, or <strong>Add Custom</strong> in
                        the Inventory tab.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div data-testid="custom-content-section">
            <h3 style={{ marginBottom: '4px' }}>Custom Content</h3>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                {customSpecies.length} species · {customMoves.length} moves · {customItems.length} items
            </div>

            {/* ── Custom Species ── */}
            {customSpecies.length > 0 && (
                <>
                    <SectionHeading count={customSpecies.length}>Species</SectionHeading>
                    <div style={{ display: 'grid', gap: '8px' }}>
                        {customSpecies.map(sp => {
                            const bst = Object.values(sp.baseStats || {}).reduce((a, b) => a + (b || 0), 0);
                            return (
                                <div
                                    key={sp.id}
                                    style={{
                                        padding: '10px 12px',
                                        background: 'var(--moves-card-bg, var(--bg-secondary))',
                                        borderRadius: '8px',
                                        borderLeft: `4px solid ${getTypeColor(sp.types?.[0])}`,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: '10px',
                                        flexWrap: 'wrap'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <strong style={{ fontSize: '14px' }}>{sp.species}</strong>
                                        {(sp.types || []).map(t => (
                                            <span key={t} style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', background: getTypeColor(t), color: 'white' }}>{t}</span>
                                        ))}
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>HP {sp.baseStats?.hp ?? '?'} · BST {bst}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                        <button style={{ ...ACTION_BTN, background: '#667eea' }} onClick={() => handleEditSpecies(sp)}>Edit</button>
                                        <button style={{ ...ACTION_BTN, background: '#f44336' }} onClick={() => handleDeleteSpecies(sp)}>Delete</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* ── Custom Items ── */}
            {customItems.length > 0 && (
                <>
                    <SectionHeading count={customItems.length}>Items</SectionHeading>
                    <div style={{ display: 'grid', gap: '8px' }}>
                        {customItems.map(item => (
                            <div
                                key={item.name}
                                style={{
                                    padding: '10px 12px',
                                    background: 'var(--moves-card-bg, var(--bg-secondary))',
                                    borderRadius: '8px',
                                    borderLeft: '4px solid #667eea',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '10px',
                                    flexWrap: 'wrap'
                                }}
                            >
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <strong style={{ fontSize: '14px' }}>{item.name}</strong>
                                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', background: '#667eea', color: 'white', textTransform: 'capitalize' }}>
                                            {item.type || 'misc'}
                                        </span>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>×{item.quantity || 1}{item.price ? ` · ₽${item.price}` : ''}</span>
                                    </div>
                                    {item.effect && (
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.effect}</div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                    <button style={{ ...ACTION_BTN, background: '#667eea' }} onClick={() => setActiveTab('inventory')}>Inventory →</button>
                                    <button style={{ ...ACTION_BTN, background: '#f44336' }} onClick={() => handleDeleteItem(item.name)}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* ── Custom Moves ── */}
            {customMoves.length > 0 && (
                <>
                    <SectionHeading count={customMoves.length}>Moves</SectionHeading>
                    <div style={{ display: 'grid', gap: '8px' }}>
                        {customMoves.map(({ move, pokemon, trainer }, idx) => (
                            <div
                                key={`${trainer.id}-${pokemon.id}-${idx}`}
                                style={{
                                    padding: '10px 12px',
                                    background: 'var(--moves-card-bg, var(--bg-secondary))',
                                    borderRadius: '8px',
                                    borderLeft: `4px solid ${getTypeColor(move.type)}`,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '10px',
                                    flexWrap: 'wrap'
                                }}
                            >
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <strong style={{ fontSize: '14px' }}>{move.name}</strong>
                                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', background: getTypeColor(move.type), color: 'white' }}>{move.type}</span>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{move.category} · {move.damage || 'Status'} · {move.frequency}</span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                        On <strong>{pokemon.name || pokemon.species}</strong> ({trainer.name || 'Unnamed'})
                                    </div>
                                </div>
                                <button style={{ ...ACTION_BTN, background: '#667eea', flexShrink: 0 }} onClick={() => jumpToPokemon(trainer.id, pokemon.id)}>
                                    View →
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default CustomContentSection;
