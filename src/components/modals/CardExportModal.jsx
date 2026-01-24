// ============================================================
// Card Export Modal Component
// ============================================================
// Modal for exporting trainer/team/pokemon cards as images or text

import React from 'react';
import { getTypeColor } from '../../utils/typeUtils.js';
import { copyToClipboard, downloadCardAsImage } from '../../utils/exportUtils.js';
import { getActualStats, calculatePokemonHP, calculateSTAB } from '../../utils/dataUtils.js';

const CardExportModal = ({
    showCardModal,
    setShowCardModal,
    cardType,
    setCardType,
    selectedCardPokemon,
    setSelectedCardPokemon,
    trainer,
    party,
    pokemon,
    exportTrainerText,
    exportTeamText,
    exportPokemonText
}) => {
    if (!showCardModal) return null;

    const handleClose = () => setShowCardModal(false);

    const handleCopyText = () => {
        let text = '';
        if (cardType === 'trainer') {
            text = exportTrainerText();
        } else if (cardType === 'team') {
            text = exportTeamText();
        } else if (selectedCardPokemon) {
            text = exportPokemonText(selectedCardPokemon);
        }
        if (text) copyToClipboard(text);
    };

    const handleDownloadImage = () => {
        let cardId, filename;
        if (cardType === 'trainer') {
            cardId = 'trainerCardExport';
            filename = `${trainer.name || 'trainer'}-card`;
        } else if (cardType === 'team') {
            cardId = 'teamCardExport';
            filename = `${trainer.name || 'trainer'}-team-card`;
        } else {
            cardId = 'pokemonCardExport';
            filename = `${selectedCardPokemon?.name || 'pokemon'}-card`;
        }
        downloadCardAsImage(cardId, filename);
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div
                className="modal"
                style={{ maxWidth: cardType === 'team' ? '650px' : '550px', maxHeight: '90vh', overflow: 'auto' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h3>📇 Export Character Card</h3>
                    <button
                        onClick={handleClose}
                        style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
                    >
                        ×
                    </button>
                </div>

                <div className="mb-15">
                    <div className="tabs">
                        <button
                            className={`tab ${cardType === 'trainer' ? 'active' : ''}`}
                            onClick={() => setCardType('trainer')}
                        >
                            Trainer
                        </button>
                        <button
                            className={`tab ${cardType === 'team' ? 'active' : ''}`}
                            onClick={() => setCardType('team')}
                        >
                            Team Card
                        </button>
                        <button
                            className={`tab ${cardType === 'pokemon' ? 'active' : ''}`}
                            onClick={() => setCardType('pokemon')}
                        >
                            Pokémon
                        </button>
                    </div>

                    {cardType === 'pokemon' && (
                        <div className="mt-10">
                            <select
                                value={selectedCardPokemon?.id || ''}
                                onChange={(e) => setSelectedCardPokemon(pokemon.find(p => p.id === parseInt(e.target.value)))}
                                className="w-full"
                            >
                                <option value="">Select a Pokémon...</option>
                                {pokemon.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} (Lv.{p.level})</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Trainer Card Preview */}
                {cardType === 'trainer' && (
                    <TrainerCard trainer={trainer} pokemon={pokemon} />
                )}

                {/* Team Card Preview */}
                {cardType === 'team' && (
                    <TeamCard trainer={trainer} party={party} />
                )}

                {/* Pokemon Card Preview */}
                {cardType === 'pokemon' && selectedCardPokemon && (
                    <PokemonCard poke={selectedCardPokemon} />
                )}

                {cardType === 'pokemon' && !selectedCardPokemon && (
                    <div className="empty-state">
                        <p>Select a Pokémon above to preview their card</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px', flexWrap: 'wrap' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={handleCopyText}
                        disabled={cardType === 'pokemon' && !selectedCardPokemon}
                    >
                        📋 Copy Text
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleDownloadImage}
                        disabled={cardType === 'pokemon' && !selectedCardPokemon}
                    >
                        📷 Download Image
                    </button>
                </div>
            </div>
        </div>
    );
};

// Trainer Card Sub-component
const TrainerCard = ({ trainer, pokemon }) => (
    <div
        id="trainerCardExport"
        style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '20px',
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            position: 'relative',
            overflow: 'hidden'
        }}
    >
        {/* Decorative elements */}
        <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '150px',
            height: '150px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%'
        }} />
        <div style={{
            position: 'absolute',
            bottom: '-30px',
            left: '-30px',
            width: '100px',
            height: '100px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '50%'
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px', position: 'relative', zIndex: 1 }}>
            <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: trainer.avatar ? `url(${trainer.avatar}) center/cover` : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                border: '3px solid rgba(255,255,255,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                flexShrink: 0
            }}>
                {!trainer.avatar && '👤'}
            </div>
            <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: '24px', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                    {trainer.name || 'Unnamed Trainer'}
                    <span style={{ marginLeft: '8px', fontSize: '20px' }}>
                        {trainer.gender === 'male' ? '♂' : trainer.gender === 'female' ? '♀' : ''}
                    </span>
                </h2>
                <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '14px' }}>
                    Level {trainer.level} {(trainer.classes && trainer.classes.length > 0) ? trainer.classes.join(' / ') : 'Trainer'}
                </p>
            </div>
        </div>

        {/* Stats Grid */}
        <div style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '12px',
            backdropFilter: 'blur(10px)'
        }}>
            <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Stats • Max HP: {(trainer.stats.hp * 4) + (trainer.level * 4)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                    { label: 'HP', value: trainer.stats.hp, color: '#ff6b6b' },
                    { label: 'ATK', value: trainer.stats.atk, color: '#ffa502' },
                    { label: 'DEF', value: trainer.stats.def, color: '#2ed573' },
                    { label: 'SATK', value: trainer.stats.satk, color: '#70a1ff' },
                    { label: 'SDEF', value: trainer.stats.sdef, color: '#7bed9f' },
                    { label: 'SPD', value: trainer.stats.spd, color: '#ff6348' }
                ].map(stat => (
                    <div key={stat.label} style={{
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '10px', opacity: 0.8 }}>{stat.label}</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{stat.value}</div>
                    </div>
                ))}
            </div>
        </div>

        {/* Features */}
        {trainer.features.length > 0 && (
            <div className="mb-10">
                <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Features</div>
                <div style={{ fontSize: '12px', lineHeight: 1.4 }}>
                    {trainer.features.map(f => typeof f === 'object' ? f.name : f).join(' • ')}
                </div>
            </div>
        )}

        {/* Skills */}
        {trainer.skills.length > 0 && (
            <div className="mb-10">
                <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Skills</div>
                <div className="text-12">{trainer.skills.join(' • ')}</div>
            </div>
        )}

        {/* Footer */}
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.2)',
            paddingTop: '10px',
            marginTop: '10px'
        }}>
            <span className="text-14">💰 ₽{(trainer.money || 0).toLocaleString()}</span>
            <span className="text-14">🎖️ {trainer.badges?.length || 0} Badges</span>
            <span className="text-14">📦 {pokemon.length} Pokémon</span>
        </div>
    </div>
);

// Team Card Sub-component
const TeamCard = ({ trainer, party }) => (
    <div
        id="teamCardExport"
        style={{
            background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            borderRadius: '16px',
            padding: '20px',
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
            position: 'relative',
            overflow: 'hidden',
            minWidth: '480px'
        }}
    >
        {/* Background decoration */}
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.5
        }} />

        {/* Header - Trainer Info */}
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            marginBottom: '15px',
            position: 'relative',
            zIndex: 1,
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3))',
            borderRadius: '12px',
            padding: '12px'
        }}>
            <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: trainer.avatar ? `url(${trainer.avatar}) center/cover` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: '3px solid rgba(255,255,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0
            }}>
                {!trainer.avatar && '👤'}
            </div>
            <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: '20px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                    {trainer.name || 'Unnamed Trainer'}
                    <span style={{ marginLeft: '6px', fontSize: '16px', opacity: 0.8 }}>
                        {trainer.gender === 'male' ? '♂' : trainer.gender === 'female' ? '♀' : ''}
                    </span>
                </h2>
                <p style={{ margin: '2px 0 0', opacity: 0.8, fontSize: '12px' }}>
                    Level {trainer.level} • {(trainer.classes && trainer.classes.length > 0) ? trainer.classes.slice(0, 3).join(' / ') : 'Trainer'}
                </p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '11px', opacity: 0.7 }}>
                <div>💰 ₽{(trainer.money || 0).toLocaleString()}</div>
                <div>🎖️ {trainer.badges?.length || 0} Badges</div>
            </div>
        </div>

        {/* Party Section Title */}
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '12px',
            position: 'relative',
            zIndex: 1
        }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>
                ⚔️ Active Party
            </span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.3), transparent)' }} />
            <span style={{ fontSize: '12px', opacity: 0.7 }}>{party.length}/6</span>
        </div>

        {/* Party Pokemon Grid */}
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            position: 'relative',
            zIndex: 1
        }}>
            {party.length > 0 ? party.map((poke, idx) => (
                <TeamPokemonSlot key={poke.id} poke={poke} idx={idx} />
            )) : (
                Array(6).fill(null).map((_, idx) => (
                    <EmptySlot key={idx} />
                ))
            )}
            {/* Fill remaining slots if party < 6 */}
            {party.length > 0 && party.length < 6 && Array(6 - party.length).fill(null).map((_, idx) => (
                <EmptySlot key={`empty-${idx}`} />
            ))}
        </div>

        {/* Footer */}
        <div style={{
            marginTop: '15px',
            paddingTop: '10px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '10px',
            opacity: 0.6,
            position: 'relative',
            zIndex: 1
        }}>
            <span>P:TA Character Manager</span>
            <span>{new Date().toLocaleDateString()}</span>
        </div>
    </div>
);

// Team Pokemon Slot Sub-component
const TeamPokemonSlot = ({ poke, idx }) => {
    const pokeStats = getActualStats(poke);
    const maxHP = calculatePokemonHP(poke);
    const primaryType = poke.types?.[0] || 'Normal';
    const genderIcon = poke.gender === 'male' ? '♂' : poke.gender === 'female' ? '♀' : '';

    return (
        <div style={{
            background: `linear-gradient(135deg, ${getTypeColor(primaryType)}99, ${getTypeColor(primaryType)}44)`,
            borderRadius: '10px',
            padding: '10px',
            border: '1px solid rgba(255,255,255,0.2)',
            position: 'relative'
        }}>
            {/* Slot number */}
            <div style={{
                position: 'absolute',
                top: '-6px',
                left: '-6px',
                width: '20px',
                height: '20px',
                background: '#667eea',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 'bold',
                border: '2px solid #1a1a2e'
            }}>
                {idx + 1}
            </div>

            {/* Pokemon avatar/icon */}
            <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                {poke.avatar ? (
                    <img src={poke.avatar} alt={poke.name} style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        border: '2px solid rgba(255,255,255,0.3)'
                    }} />
                ) : (
                    <div style={{
                        width: '50px',
                        height: '50px',
                        margin: '0 auto',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px'
                    }}>
                        🎴
                    </div>
                )}
            </div>

            {/* Name and level */}
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '2px', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                    {poke.name || poke.species || 'Unknown'} {genderIcon}
                </div>
                <div style={{ fontSize: '10px', opacity: 0.8 }}>
                    Lv.{poke.level}
                </div>
            </div>

            {/* Types */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', marginTop: '4px' }}>
                {poke.types?.map(type => (
                    <span key={type} style={{
                        padding: '1px 6px',
                        borderRadius: '8px',
                        fontSize: '8px',
                        fontWeight: 'bold',
                        background: getTypeColor(type),
                        textShadow: '0 1px 1px rgba(0,0,0,0.3)'
                    }}>
                        {type}
                    </span>
                ))}
            </div>

            {/* HP Bar */}
            <div style={{ marginTop: '6px' }}>
                <div style={{ fontSize: '8px', opacity: 0.7, marginBottom: '2px', textAlign: 'center' }}>
                    HP: {maxHP - (poke.currentDamage || 0)}/{maxHP}
                </div>
                <div style={{
                    height: '4px',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '2px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        height: '100%',
                        width: `${((maxHP - (poke.currentDamage || 0)) / maxHP) * 100}%`,
                        background: ((maxHP - (poke.currentDamage || 0)) / maxHP) > 0.5 ? '#4caf50' :
                            ((maxHP - (poke.currentDamage || 0)) / maxHP) > 0.25 ? '#ff9800' : '#f44336',
                        borderRadius: '2px',
                        transition: 'width 0.3s ease'
                    }} />
                </div>
            </div>

            {/* Key stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '2px',
                marginTop: '6px',
                fontSize: '8px',
                textAlign: 'center'
            }}>
                <div><span style={{ opacity: 0.6 }}>ATK</span> <strong>{pokeStats.atk}</strong></div>
                <div><span style={{ opacity: 0.6 }}>DEF</span> <strong>{pokeStats.def}</strong></div>
                <div><span style={{ opacity: 0.6 }}>SPD</span> <strong>{pokeStats.spd}</strong></div>
            </div>
        </div>
    );
};

// Empty Slot Sub-component
const EmptySlot = () => (
    <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '10px',
        padding: '20px',
        border: '1px dashed rgba(255,255,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '120px'
    }}>
        <span style={{ opacity: 0.3, fontSize: '12px' }}>Empty</span>
    </div>
);

// Pokemon Card Sub-component
const PokemonCard = ({ poke }) => {
    const actualStats = getActualStats(poke);
    const maxHP = calculatePokemonHP(poke);
    const genderSymbol = poke.gender === 'male' ? '♂' : poke.gender === 'female' ? '♀' : poke.gender === 'genderless' ? '⚪' : '';
    const primaryType = poke.types[0] || 'Normal';
    const secondaryType = poke.types[1];
    const bgGradient = secondaryType
        ? `linear-gradient(135deg, ${getTypeColor(primaryType)} 0%, ${getTypeColor(secondaryType)} 100%)`
        : `linear-gradient(135deg, ${getTypeColor(primaryType)} 0%, ${getTypeColor(primaryType)}dd 100%)`;

    return (
        <div
            id="pokemonCardExport"
            style={{
                background: bgGradient,
                borderRadius: '16px',
                padding: '20px',
                color: 'white',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Pokeball watermark */}
            <div style={{
                position: 'absolute',
                top: '50%',
                right: '-60px',
                transform: 'translateY(-50%)',
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                border: '8px solid rgba(255,255,255,0.1)',
                opacity: 0.3
            }}>
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: '8px',
                    background: 'rgba(255,255,255,0.1)',
                    transform: 'translateY(-50%)'
                }} />
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px', position: 'relative', zIndex: 1 }}>
                <div style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '12px',
                    background: poke.avatar ? `url(${poke.avatar}) center/cover` : 'rgba(255,255,255,0.2)',
                    border: '3px solid rgba(255,255,255,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '40px',
                    flexShrink: 0
                }}>
                    {!poke.avatar && '?'}
                </div>
                <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: '22px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                        {poke.name} {genderSymbol}
                    </h2>
                    {poke.species && poke.species !== poke.name && (
                        <p style={{ margin: '2px 0', opacity: 0.9, fontSize: '13px' }}>{poke.species}</p>
                    )}
                    <p style={{ margin: '4px 0 0', fontSize: '14px' }}>
                        Level {poke.level} • {poke.nature} Nature
                    </p>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        {poke.types.map(type => (
                            <span key={type} style={{
                                background: 'rgba(0,0,0,0.3)',
                                padding: '2px 10px',
                                borderRadius: '10px',
                                fontSize: '11px',
                                fontWeight: 'bold'
                            }}>
                                {type}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Abilities */}
            {((poke.abilities && poke.abilities.length > 0) || poke.ability) && (
                <div style={{
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    marginBottom: '12px',
                    fontSize: '12px'
                }}>
                    <strong>Abilities:</strong>{' '}
                    {poke.abilities && poke.abilities.length > 0
                        ? poke.abilities.join(' • ')
                        : poke.ability
                    }
                </div>
            )}

            {/* Stats Grid */}
            <div style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '12px',
                padding: '12px',
                marginBottom: '12px',
                backdropFilter: 'blur(10px)'
            }}>
                <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Stats • HP: {maxHP} • STAB: +{calculateSTAB(poke.level)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {[
                        { label: 'HP', value: actualStats.hp },
                        { label: 'ATK', value: actualStats.atk },
                        { label: 'DEF', value: actualStats.def },
                        { label: 'SATK', value: actualStats.satk },
                        { label: 'SDEF', value: actualStats.sdef },
                        { label: 'SPD', value: actualStats.spd }
                    ].map(stat => (
                        <div key={stat.label} style={{
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '10px', opacity: 0.8 }}>{stat.label}</div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{stat.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Moves */}
            {poke.moves.length > 0 && (
                <div>
                    <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Moves</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        {poke.moves.slice(0, 8).map((move, i) => (
                            <div key={i} style={{
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                fontSize: '11px'
                            }}>
                                <div className="font-bold">{move.name}</div>
                                <div style={{ opacity: 0.8, fontSize: '10px' }}>
                                    {move.type} • {move.damage || 'Status'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Held Item */}
            {poke.heldItem && (
                <div style={{
                    marginTop: '10px',
                    fontSize: '12px',
                    background: 'rgba(255,255,255,0.1)',
                    padding: '6px 10px',
                    borderRadius: '6px'
                }}>
                    📎 Held: {poke.heldItem}
                </div>
            )}
        </div>
    );
};

export default CardExportModal;
