// ============================================================
// Custom Content Section Component
// ============================================================
// One place to see (and create) every homebrew species / move / item —
// species and moves are shared catalogs usable by any Pokémon, items
// live in the shared inventory.

import React, { useMemo, useState } from 'react';
import { GAME_DATA } from '../../data/configs.js';
import { getTypeColor } from '../../utils/typeUtils.js';
import { addItemToInventory } from '../../utils/inventoryUtils.js';
import { useGameData, useModal, useTrainerContext, useData, useUI } from '../../contexts/index.js';
import CustomItemModal from '../modals/CustomItemModal.jsx';

const ACTION_BTN = {
    padding: '3px 10px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    cursor: 'pointer',
    color: 'white'
};

const NEW_BTN = {
    marginLeft: 'auto',
    padding: '4px 10px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    cursor: 'pointer',
    color: 'white',
    background: '#4caf50'
};

const EmptyRow = ({ children }) => (
    <div style={{ padding: '14px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', border: '1px dashed var(--border-medium)', borderRadius: '8px' }}>
        {children}
    </div>
);

const SectionHeading = ({ children, count, onCreate, createLabel, createDisabled, createTitle }) => (
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
        {onCreate && (
            <button
                style={{ ...NEW_BTN, opacity: createDisabled ? 0.5 : 1, cursor: createDisabled ? 'not-allowed' : 'pointer' }}
                onClick={onCreate}
                disabled={createDisabled}
                title={createTitle}
            >
                {createLabel}
            </button>
        )}
    </h3>
);

/**
 * CustomContentSection - Lists every custom species, move, and item the user
 * has created, with quick create/edit/delete actions for each.
 * Uses GameDataContext for customSpecies/customMoves (shared catalogs),
 * TrainerContext for all trainers' Pokémon (to find which ones know a given
 * custom move), DataContext for inventory, UIContext to jump to a Pokémon.
 */
const CustomContentSection = () => {
    const { customSpecies, setCustomSpecies, customMoves, setCustomMoves } = useGameData();
    const { showConfirm, setShowCustomSpeciesModal, setEditingCustomSpeciesId, openCustomMoveModal } = useModal();
    const { trainers, setActiveTrainerId } = useTrainerContext();
    const { inventory, setInventory } = useData();
    const { setActiveTab, setEditingPokemon } = useUI();

    const [showCreateItem, setShowCreateItem] = useState(false);
    const [showMovePicker, setShowMovePicker] = useState(false);

    // Every Pokémon across every trainer, for the "which Pokémon should learn
    // this new move?" picker and for showing who already knows a custom move.
    const allPokemonEntries = useMemo(() => {
        const results = [];
        (trainers || []).forEach(trainer => {
            [...(trainer.party || []), ...(trainer.reserve || [])].forEach(pokemon => {
                results.push({ trainer, pokemon });
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

    // ── Species actions ──
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
    const handleNewSpecies = () => {
        setEditingCustomSpeciesId(null);
        setShowCustomSpeciesModal(true);
    };

    // ── Item actions ──
    const handleDeleteItem = (itemName) => {
        showConfirm({
            title: 'Delete Item',
            message: `Delete all "${itemName}" from inventory?`,
            danger: true,
            onConfirm: () => setInventory(prev => prev.filter(i => i.name.toLowerCase() !== itemName.toLowerCase()))
        });
    };
    const handleCreateItem = (name, itemData, quantity) => {
        setInventory(prev => addItemToInventory(prev, name, itemData, quantity));
    };

    // ── Move actions ──
    const knownBy = (moveName) => allPokemonEntries.filter(({ pokemon }) =>
        (pokemon.moves || []).some(m => m.name?.toLowerCase() === moveName.toLowerCase())
    );
    const handleDeleteMove = (move) => {
        const knowers = knownBy(move.name);
        showConfirm({
            title: 'Delete Custom Move',
            message: knowers.length > 0
                ? `Delete "${move.name}" from the custom move list? ${knowers.length} Pokémon that already know it will keep it, but it won't be teachable to anyone else afterward.`
                : `Delete "${move.name}" from the custom move list?`,
            danger: true,
            onConfirm: () => setCustomMoves(prev => prev.filter(m => m.id !== move.id))
        });
    };
    const handlePickPokemonForNewMove = (trainerId, pokemonId) => {
        setActiveTrainerId(trainerId);
        openCustomMoveModal(pokemonId);
        setShowMovePicker(false);
    };
    const jumpToPokemon = (trainerId, pokemonId) => {
        setActiveTrainerId(trainerId);
        setActiveTab('pokemon');
        setEditingPokemon(pokemonId);
    };

    if (totalCount === 0) {
        return (
            <div data-testid="custom-content-section">
                <h3 style={{ marginBottom: '15px' }}>Custom Content</h3>
                <div className="empty-state" style={{ padding: '30px 20px', textAlign: 'center' }}>
                    <span className="empty-state-icon" style={{ fontSize: '32px' }}>🧩</span>
                    <p className="empty-state-title" style={{ fontWeight: 'bold', marginTop: '10px' }}>No custom content yet</p>
                    <p className="empty-state-description" style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '440px', margin: '8px auto 20px' }}>
                        Homebrew species, moves, and items you create show up here so you can find and manage them in one place.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button style={{ ...ACTION_BTN, background: '#4caf50', padding: '8px 16px', fontSize: '13px' }} onClick={handleNewSpecies}>+ New Species</button>
                        <button style={{ ...ACTION_BTN, background: '#4caf50', padding: '8px 16px', fontSize: '13px' }} onClick={() => setShowCreateItem(true)}>+ New Item</button>
                        <button
                            style={{ ...ACTION_BTN, background: '#4caf50', padding: '8px 16px', fontSize: '13px', opacity: allPokemonEntries.length === 0 ? 0.5 : 1, cursor: allPokemonEntries.length === 0 ? 'not-allowed' : 'pointer' }}
                            onClick={() => setShowMovePicker(true)}
                            disabled={allPokemonEntries.length === 0}
                            title={allPokemonEntries.length === 0 ? 'Add a Pokémon first' : undefined}
                        >
                            + New Move
                        </button>
                    </div>
                    {showMovePicker && (
                        <MovePokemonPicker entries={allPokemonEntries} onPick={handlePickPokemonForNewMove} onCancel={() => setShowMovePicker(false)} />
                    )}
                </div>
                <CustomItemModal show={showCreateItem} onClose={() => setShowCreateItem(false)} onCreate={handleCreateItem} inventory={inventory} />
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
            <SectionHeading count={customSpecies.length} onCreate={handleNewSpecies} createLabel="+ New Species">Species</SectionHeading>
            {customSpecies.length === 0 ? (
                <EmptyRow>No custom species yet.</EmptyRow>
            ) : (
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
            )}

            {/* ── Custom Items ── */}
            <SectionHeading count={customItems.length} onCreate={() => setShowCreateItem(true)} createLabel="+ New Item">Items</SectionHeading>
            {customItems.length === 0 ? (
                <EmptyRow>No custom items yet.</EmptyRow>
            ) : (
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
            )}

            {/* ── Custom Moves ── */}
            <SectionHeading
                count={customMoves.length}
                onCreate={() => setShowMovePicker(p => !p)}
                createLabel="+ New Move"
                createDisabled={allPokemonEntries.length === 0}
                createTitle={allPokemonEntries.length === 0 ? 'Add a Pokémon first' : undefined}
            >
                Moves
            </SectionHeading>
            {showMovePicker && (
                <MovePokemonPicker entries={allPokemonEntries} onPick={handlePickPokemonForNewMove} onCancel={() => setShowMovePicker(false)} />
            )}
            {customMoves.length === 0 ? (
                <EmptyRow>No custom moves yet — any move you create can be taught to other Pokémon too, not just the one it was made for.</EmptyRow>
            ) : (
                <div style={{ display: 'grid', gap: '8px' }}>
                    {customMoves.map(move => {
                        const knowers = knownBy(move.name);
                        return (
                            <div
                                key={move.id}
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
                                        {knowers.length === 0
                                            ? 'Not learned by any Pokémon yet'
                                            : `Known by: ${knowers.slice(0, 3).map(({ pokemon }) => pokemon.name || pokemon.species).join(', ')}${knowers.length > 3 ? ` +${knowers.length - 3} more` : ''}`}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                    {knowers.length > 0 && (
                                        <button style={{ ...ACTION_BTN, background: '#667eea' }} onClick={() => jumpToPokemon(knowers[0].trainer.id, knowers[0].pokemon.id)}>
                                            View →
                                        </button>
                                    )}
                                    <button style={{ ...ACTION_BTN, background: '#f44336' }} onClick={() => handleDeleteMove(move)}>Delete</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <CustomItemModal show={showCreateItem} onClose={() => setShowCreateItem(false)} onCreate={handleCreateItem} inventory={inventory} />
        </div>
    );
};

/** Inline "which Pokémon should learn this new move?" picker */
const MovePokemonPicker = ({ entries, onPick, onCancel }) => (
    <div style={{
        padding: '12px',
        marginBottom: '10px',
        marginTop: entries.length > 0 ? undefined : '14px',
        background: 'var(--bg-secondary)',
        borderRadius: '8px',
        border: '1px dashed #4caf50'
    }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Which Pokémon should learn this new move?</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
                defaultValue=""
                onChange={(e) => {
                    const [trainerId, pokemonId] = e.target.value.split('::');
                    if (trainerId && pokemonId) onPick(isNaN(trainerId) ? trainerId : Number(trainerId), isNaN(pokemonId) ? pokemonId : Number(pokemonId));
                }}
                style={{ flex: '1 1 220px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '13px' }}
            >
                <option value="" disabled>Choose a Pokémon…</option>
                {entries.map(({ trainer, pokemon }) => (
                    <option key={`${trainer.id}::${pokemon.id}`} value={`${trainer.id}::${pokemon.id}`}>
                        {trainer.name || 'Unnamed'} → {pokemon.name || pokemon.species || 'Unknown'}
                    </option>
                ))}
            </select>
            <button style={{ ...ACTION_BTN, background: 'var(--border-medium)', color: 'var(--text-primary)' }} onClick={onCancel}>Cancel</button>
        </div>
    </div>
);

export default CustomContentSection;
