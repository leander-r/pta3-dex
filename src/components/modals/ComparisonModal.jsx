// ============================================================
// Pokemon Comparison Modal
// ============================================================

import React from 'react';
import { useModal, useTrainerContext, useGameData } from '../../contexts/index.js';
import useModalKeyboard from '../../hooks/useModalKeyboard.js';
import { getActualStats, calculatePokemonHP } from '../../utils/dataUtils.js';
import { getTypeColor } from '../../utils/typeUtils.js';
import { getPokemonDisplayImage } from '../../utils/pokemonSprite.js';

const STAT_LABELS = {
    hp: 'HP', atk: 'ATK', def: 'DEF', satk: 'SATK', sdef: 'SDEF', spd: 'SPD'
};
const STAT_KEYS = ['hp', 'atk', 'def', 'satk', 'sdef', 'spd'];

const ComparisonModal = () => {
    const { showComparisonModal, comparisonIds, closeComparison, showDetail } = useModal();
    const { pokemon: allPokemon } = useTrainerContext();
    const { GAME_DATA: gameData } = useGameData();

    const { modalRef } = useModalKeyboard(showComparisonModal, closeComparison);

    if (!showComparisonModal) return null;

    const [pokA, pokB] = comparisonIds.map(id => allPokemon.find(p => p.id === id)).filter(Boolean);
    if (!pokA || !pokB) return null;

    const statsA = getActualStats(pokA);
    const statsB = getActualStats(pokB);
    const hpA = calculatePokemonHP(pokA);
    const hpB = calculatePokemonHP(pokB);

    const renderColumn = (pok, stats, maxHP, side) => {
        const primaryType = pok.types?.[0] || 'Normal';
        const primaryColor = getTypeColor(primaryType);
        const abilities = pok.abilities?.length > 0 ? pok.abilities : (pok.ability ? [pok.ability] : []);
        const otherHP = side === 'left' ? hpB : hpA;
        const otherStats = side === 'left' ? statsB : statsA;

        return (
            <div style={{
                flex: 1,
                minWidth: '260px',
                padding: '16px',
                borderRadius: '10px',
                background: 'var(--bg-section)',
                border: `2px solid ${primaryColor}`
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                    {(() => {
                        const img = getPokemonDisplayImage(pok);
                        return img
                            ? <img src={img} alt="" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${primaryColor}`, marginBottom: '8px' }} />
                            : <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: `linear-gradient(135deg, ${primaryColor}, #764ba2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: '28px' }}>🔴</div>;
                    })()}
                    <div style={{ fontWeight: 'bold', fontSize: '18px', color: 'var(--text-primary)' }}>
                        {pok.name || pok.species || 'Unknown'}
                    </div>
                    {pok.species && pok.species !== pok.name && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{pok.species}</div>
                    )}
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {pok.gender || ''}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '6px', flexWrap: 'wrap' }}>
                        {(pok.types || []).map(type => (
                            <span key={type} style={{ padding: '2px 8px', borderRadius: '10px', background: getTypeColor(type), color: 'white', fontSize: '11px', fontWeight: 'bold' }}>
                                {type}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Max HP */}
                <div style={{ textAlign: 'center', marginBottom: '12px', fontSize: '13px', fontWeight: 'bold', color: '#4caf50' }}>
                    Max HP: {maxHP}
                </div>

                {/* Stats */}
                <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Stats</div>
                    {STAT_KEYS.map(key => {
                        const val = key === 'hp' ? maxHP : (stats[key] || 0);
                        const otherVal = key === 'hp' ? otherHP : (otherStats[key] || 0);
                        const maxVal = Math.max(val, otherVal) || 1;
                        const isHigher = val > otherVal;
                        const isEqual = val === otherVal;
                        return (
                            <div key={key} style={{ marginBottom: '5px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{STAT_LABELS[key]}</span>
                                    <span style={{ fontWeight: 'bold', color: isHigher ? '#4caf50' : isEqual ? 'var(--text-primary)' : '#f44336' }}>{val}</span>
                                </div>
                                <div style={{ height: '6px', background: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${(val / maxVal) * 100}%`,
                                        height: '100%',
                                        background: isHigher ? '#4caf50' : isEqual ? '#667eea' : 'var(--border-medium)',
                                        borderRadius: '3px',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Held Item */}
                {pok.heldItem && (
                    <div
                        onClick={() => {
                            const itemData = gameData?.items?.[pok.heldItem];
                            if (showDetail && itemData) showDetail('item', pok.heldItem, itemData);
                        }}
                        style={{
                            marginBottom: '12px',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-light)',
                            fontSize: '12px',
                            color: 'var(--text-primary)',
                            cursor: gameData?.items?.[pok.heldItem] && showDetail ? 'pointer' : 'default'
                        }}
                        title={gameData?.items?.[pok.heldItem] ? 'Click to view item details' : ''}
                    >
                        🎒 <strong>Held Item:</strong> {pok.heldItem}
                    </div>
                )}

                {/* Abilities */}
                {abilities.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Abilities</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {abilities.map((ab, i) => (
                                <span key={i} style={{ padding: '3px 8px', borderRadius: '10px', background: 'linear-gradient(135deg, #f093fb, #f5576c)', color: 'white', fontSize: '11px', fontWeight: 'bold' }}>
                                    {ab}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Moves */}
                {(pok.moves || []).length > 0 && (
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Moves</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {(pok.moves || []).map((move, i) => (
                                <span key={i} style={{ padding: '3px 8px', borderRadius: '10px', background: getTypeColor(move.type || 'Normal'), color: 'white', fontSize: '11px', fontWeight: 'bold' }}>
                                    {move.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="modal-overlay" onClick={closeComparison} role="presentation">
            <div
                ref={modalRef}
                className="modal"
                style={{ maxWidth: '860px', padding: '20px' }}
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="comparison-modal-title"
            >
                {/* Modal Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 id="comparison-modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        ⚔️ Pokémon Comparison
                    </h2>
                    <button
                        onClick={closeComparison}
                        aria-label="Close modal"
                        title="Close"
                        style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-primary)', lineHeight: 1 }}
                    >
                        ×
                    </button>
                </div>

                {/* Two-column layout */}
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {renderColumn(pokA, statsA, hpA, 'left')}
                    {renderColumn(pokB, statsB, hpB, 'right')}
                </div>
            </div>
        </div>
    );
};

export default ComparisonModal;
