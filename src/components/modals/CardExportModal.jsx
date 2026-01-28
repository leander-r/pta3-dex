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
            background: 'linear-gradient(145deg, #f5a623 0%, #e8941c 50%, #d4820f 100%)',
            borderRadius: '20px',
            padding: '24px',
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxShadow: '0 12px 40px rgba(245, 166, 35, 0.4), 0 4px 12px rgba(0,0,0,0.2)',
            position: 'relative',
            overflow: 'hidden',
            border: '3px solid rgba(255,255,255,0.3)'
        }}
    >
        {/* Decorative pokeball pattern */}
        <div style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            border: '20px solid rgba(255,255,255,0.1)',
            background: 'transparent'
        }} />
        <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            border: '3px solid rgba(255,255,255,0.2)'
        }} />
        <div style={{
            position: 'absolute',
            bottom: '-40px',
            left: '-40px',
            width: '120px',
            height: '120px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '50%'
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '18px', position: 'relative', zIndex: 1 }}>
            <div style={{
                width: '88px',
                height: '88px',
                borderRadius: '50%',
                background: trainer.avatar ? `url(${trainer.avatar}) center/cover` : 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
                border: '4px solid rgba(255,255,255,0.6)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                flexShrink: 0,
                color: '#f5a623'
            }}>
                {!trainer.avatar && '👤'}
            </div>
            <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: '26px', fontWeight: 800, textShadow: '0 2px 8px rgba(0,0,0,0.3)', color: 'white' }}>
                    {trainer.name || 'Unnamed Trainer'}
                    <span style={{ marginLeft: '8px', fontSize: '22px', opacity: 0.9 }}>
                        {trainer.gender === 'male' ? '♂' : trainer.gender === 'female' ? '♀' : ''}
                    </span>
                </h2>
                <div style={{
                    display: 'inline-block',
                    background: 'rgba(0,0,0,0.25)',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    marginTop: '6px',
                    fontSize: '13px',
                    fontWeight: 600
                }}>
                    Level {trainer.level} • {(trainer.classes && trainer.classes.length > 0) ? trainer.classes.slice(0, 2).join(' / ') : 'Trainer'}
                </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div style={{
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '16px',
            padding: '14px',
            marginBottom: '14px',
            border: '1px solid rgba(255,255,255,0.1)'
        }}>
            <div style={{
                fontSize: '11px',
                opacity: 0.9,
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                fontWeight: 700,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span>Stats</span>
                <span style={{
                    background: 'rgba(255,255,255,0.2)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '10px'
                }}>
                    Max HP: {(trainer.stats.hp * 4) + (trainer.level * 4)}
                </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                    { label: 'HP', value: trainer.stats.hp, color: '#ef5350' },
                    { label: 'ATK', value: trainer.stats.atk, color: '#ff7043' },
                    { label: 'DEF', value: trainer.stats.def, color: '#66bb6a' },
                    { label: 'SATK', value: trainer.stats.satk, color: '#42a5f5' },
                    { label: 'SDEF', value: trainer.stats.sdef, color: '#ab47bc' },
                    { label: 'SPD', value: trainer.stats.spd, color: '#26c6da' }
                ].map(stat => (
                    <div key={stat.label} style={{
                        background: `linear-gradient(135deg, ${stat.color}dd, ${stat.color}99)`,
                        borderRadius: '10px',
                        padding: '8px 10px',
                        textAlign: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}>
                        <div style={{ fontSize: '10px', fontWeight: 600, opacity: 0.9 }}>{stat.label}</div>
                        <div style={{ fontSize: '20px', fontWeight: 800 }}>{stat.value}</div>
                    </div>
                ))}
            </div>
        </div>

        {/* Features */}
        {trainer.features.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', opacity: 0.9, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700 }}>
                    Features
                </div>
                <div style={{
                    fontSize: '12px',
                    lineHeight: 1.5,
                    background: 'rgba(0,0,0,0.15)',
                    padding: '8px 12px',
                    borderRadius: '8px'
                }}>
                    {trainer.features.map(f => typeof f === 'object' ? f.name : f).join(' • ')}
                </div>
            </div>
        )}

        {/* Skills */}
        {(Array.isArray(trainer.skills) ? trainer.skills.length > 0 : Object.keys(trainer.skills || {}).length > 0) && (
            <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', opacity: 0.9, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700 }}>
                    Skills
                </div>
                <div style={{
                    fontSize: '12px',
                    background: 'rgba(0,0,0,0.15)',
                    padding: '8px 12px',
                    borderRadius: '8px'
                }}>
                    {Array.isArray(trainer.skills)
                        ? trainer.skills.join(' • ')
                        : Object.entries(trainer.skills || {})
                            .filter(([_, rank]) => rank > 0)
                            .map(([name, rank]) => rank === 2 ? `${name} ★★` : name)
                            .join(' • ')
                    }
                </div>
            </div>
        )}

        {/* Footer */}
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginTop: '14px'
        }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '2px' }}>Money</div>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>₽{(trainer.money || 0).toLocaleString()}</div>
            </div>
            <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.2)' }} />
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '2px' }}>Badges</div>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>{trainer.badges?.length || 0}</div>
            </div>
            <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.2)' }} />
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '2px' }}>Pokémon</div>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>{pokemon.length}</div>
            </div>
        </div>

        {/* Branding */}
        <div style={{
            textAlign: 'center',
            marginTop: '12px',
            fontSize: '9px',
            opacity: 0.6,
            letterSpacing: '2px',
            textTransform: 'uppercase'
        }}>
            PTA Dex • Trainer Card
        </div>
    </div>
);

// Team Card Sub-component
const TeamCard = ({ trainer, party }) => (
    <div
        id="teamCardExport"
        style={{
            background: 'linear-gradient(160deg, #2d2d2d 0%, #1a1a1a 100%)',
            borderRadius: '20px',
            padding: '24px',
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
            position: 'relative',
            overflow: 'hidden',
            minWidth: '500px',
            border: '2px solid rgba(255,255,255,0.1)'
        }}
    >
        {/* Background gradient overlay */}
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '120px',
            background: 'linear-gradient(180deg, rgba(245, 166, 35, 0.15) 0%, transparent 100%)',
            pointerEvents: 'none'
        }} />

        {/* Decorative circles */}
        <div style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            border: '2px solid rgba(245, 166, 35, 0.2)',
            background: 'transparent'
        }} />
        <div style={{
            position: 'absolute',
            bottom: '-30px',
            left: '-30px',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'rgba(245, 166, 35, 0.05)'
        }} />

        {/* Header - Trainer Info */}
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '18px',
            position: 'relative',
            zIndex: 1,
            background: 'linear-gradient(135deg, rgba(245, 166, 35, 0.2), rgba(232, 148, 28, 0.1))',
            borderRadius: '14px',
            padding: '14px',
            border: '1px solid rgba(245, 166, 35, 0.3)'
        }}>
            <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: trainer.avatar ? `url(${trainer.avatar}) center/cover` : 'linear-gradient(135deg, #f5a623 0%, #e8941c 100%)',
                border: '3px solid rgba(245, 166, 35, 0.6)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '26px',
                flexShrink: 0
            }}>
                {!trainer.avatar && '👤'}
            </div>
            <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.4)', color: 'white' }}>
                    {trainer.name || 'Unnamed Trainer'}
                    <span style={{ marginLeft: '8px', fontSize: '18px', opacity: 0.8 }}>
                        {trainer.gender === 'male' ? '♂' : trainer.gender === 'female' ? '♀' : ''}
                    </span>
                </h2>
                <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: '12px', fontWeight: 500 }}>
                    Level {trainer.level} • {(trainer.classes && trainer.classes.length > 0) ? trainer.classes.slice(0, 2).join(' / ') : 'Trainer'}
                </p>
            </div>
            <div style={{
                textAlign: 'right',
                fontSize: '11px',
                background: 'rgba(0,0,0,0.3)',
                padding: '8px 12px',
                borderRadius: '8px'
            }}>
                <div style={{ color: '#ffd700', fontWeight: 600 }}>₽{(trainer.money || 0).toLocaleString()}</div>
                <div style={{ opacity: 0.7, marginTop: '2px' }}>{trainer.badges?.length || 0} Badges</div>
            </div>
        </div>

        {/* Party Section Title */}
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '14px',
            position: 'relative',
            zIndex: 1
        }}>
            <span style={{
                fontSize: '13px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                color: '#f5a623'
            }}>
                Active Party
            </span>
            <div style={{ flex: 1, height: '2px', background: 'linear-gradient(90deg, #f5a623, transparent)', borderRadius: '1px' }} />
            <span style={{
                fontSize: '12px',
                background: 'rgba(245, 166, 35, 0.2)',
                padding: '4px 10px',
                borderRadius: '10px',
                fontWeight: 600
            }}>{party.length}/6</span>
        </div>

        {/* Party Pokemon Grid */}
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
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
            marginTop: '18px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '10px',
            position: 'relative',
            zIndex: 1
        }}>
            <span style={{ color: '#f5a623', fontWeight: 600, letterSpacing: '1px' }}>PTA DEX</span>
            <span style={{ opacity: 0.5 }}>{new Date().toLocaleDateString()}</span>
        </div>
    </div>
);

// Team Pokemon Slot Sub-component
const TeamPokemonSlot = ({ poke, idx }) => {
    const pokeStats = getActualStats(poke);
    const maxHP = calculatePokemonHP(poke);
    const currentHP = maxHP - (poke.currentDamage || 0);
    const hpPercent = (currentHP / maxHP) * 100;
    const primaryType = poke.types?.[0] || 'Normal';
    const secondaryType = poke.types?.[1];
    const genderIcon = poke.gender === 'male' ? '♂' : poke.gender === 'female' ? '♀' : '';
    const bgGradient = secondaryType
        ? `linear-gradient(145deg, ${getTypeColor(primaryType)}cc, ${getTypeColor(secondaryType)}cc)`
        : `linear-gradient(145deg, ${getTypeColor(primaryType)}cc, ${getTypeColor(primaryType)}66)`;

    return (
        <div style={{
            background: bgGradient,
            borderRadius: '12px',
            padding: '12px',
            border: '2px solid rgba(255,255,255,0.25)',
            position: 'relative',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
            {/* Slot number */}
            <div style={{
                position: 'absolute',
                top: '-8px',
                left: '-8px',
                width: '24px',
                height: '24px',
                background: 'linear-gradient(135deg, #f5a623, #e8941c)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                border: '2px solid #1a1a1a',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
            }}>
                {idx + 1}
            </div>

            {/* Pokemon avatar/icon */}
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                {poke.avatar ? (
                    <img src={poke.avatar} alt={poke.name} style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        border: '2px solid rgba(255,255,255,0.4)',
                        boxShadow: '0 3px 10px rgba(0,0,0,0.3)'
                    }} />
                ) : (
                    <div style={{
                        width: '56px',
                        height: '56px',
                        margin: '0 auto',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.2)',
                        border: '2px solid rgba(255,255,255,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '28px'
                    }}>
                        🎴
                    </div>
                )}
            </div>

            {/* Name and level */}
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    marginBottom: '2px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {poke.name || poke.species || 'Unknown'} {genderIcon}
                </div>
                <div style={{
                    fontSize: '11px',
                    opacity: 0.9,
                    background: 'rgba(0,0,0,0.2)',
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '10px'
                }}>
                    Lv.{poke.level}
                </div>
            </div>

            {/* Types */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '6px' }}>
                {poke.types?.map(type => (
                    <span key={type} style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        background: 'rgba(0,0,0,0.35)',
                        border: `1px solid ${getTypeColor(type)}`,
                        textShadow: '0 1px 2px rgba(0,0,0,0.4)'
                    }}>
                        {type}
                    </span>
                ))}
            </div>

            {/* HP Bar */}
            <div style={{ marginTop: '8px' }}>
                <div style={{
                    fontSize: '9px',
                    marginBottom: '3px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span style={{ opacity: 0.8 }}>HP</span>
                    <span style={{ fontWeight: 600 }}>{currentHP}/{maxHP}</span>
                </div>
                <div style={{
                    height: '6px',
                    background: 'rgba(0,0,0,0.4)',
                    borderRadius: '3px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        height: '100%',
                        width: `${hpPercent}%`,
                        background: hpPercent > 50 ? 'linear-gradient(90deg, #4caf50, #8bc34a)' :
                            hpPercent > 25 ? 'linear-gradient(90deg, #ff9800, #ffc107)' : 'linear-gradient(90deg, #f44336, #e91e63)',
                        borderRadius: '3px',
                        boxShadow: '0 0 6px rgba(255,255,255,0.3)'
                    }} />
                </div>
            </div>

            {/* All 6 stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '3px',
                marginTop: '8px',
                fontSize: '9px',
                textAlign: 'center'
            }}>
                {[
                    { label: 'HP', value: pokeStats.hp, color: '#ef5350' },
                    { label: 'ATK', value: pokeStats.atk, color: '#ff7043' },
                    { label: 'DEF', value: pokeStats.def, color: '#66bb6a' },
                    { label: 'SATK', value: pokeStats.satk, color: '#42a5f5' },
                    { label: 'SDEF', value: pokeStats.sdef, color: '#ab47bc' },
                    { label: 'SPD', value: pokeStats.spd, color: '#26c6da' }
                ].map(stat => (
                    <div key={stat.label} style={{
                        background: `linear-gradient(135deg, ${stat.color}aa, ${stat.color}66)`,
                        borderRadius: '4px',
                        padding: '2px 3px'
                    }}>
                        <div style={{ opacity: 0.9, fontSize: '7px', fontWeight: 600 }}>{stat.label}</div>
                        <div style={{ fontWeight: 700, fontSize: '10px' }}>{stat.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Empty Slot Sub-component
const EmptySlot = () => (
    <div style={{
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
        padding: '20px',
        border: '2px dashed rgba(255,255,255,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '140px',
        flexDirection: 'column',
        gap: '8px'
    }}>
        <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '2px dashed rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            opacity: 0.3
        }}>
            +
        </div>
        <span style={{ opacity: 0.25, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Empty Slot</span>
    </div>
);

// Pokemon Card Sub-component
const PokemonCard = ({ poke }) => {
    const actualStats = getActualStats(poke);
    const maxHP = calculatePokemonHP(poke);
    const currentHP = maxHP - (poke.currentDamage || 0);
    const genderSymbol = poke.gender === 'male' ? '♂' : poke.gender === 'female' ? '♀' : poke.gender === 'genderless' ? '⚪' : '';
    const primaryType = poke.types[0] || 'Normal';
    const secondaryType = poke.types[1];
    const bgGradient = secondaryType
        ? `linear-gradient(145deg, ${getTypeColor(primaryType)} 0%, ${getTypeColor(secondaryType)} 100%)`
        : `linear-gradient(145deg, ${getTypeColor(primaryType)} 0%, ${getTypeColor(primaryType)}bb 100%)`;

    const statColors = {
        HP: '#ef5350',
        ATK: '#ff7043',
        DEF: '#66bb6a',
        SATK: '#42a5f5',
        SDEF: '#ab47bc',
        SPD: '#26c6da'
    };

    return (
        <div
            id="pokemonCardExport"
            style={{
                background: bgGradient,
                borderRadius: '20px',
                padding: '24px',
                color: 'white',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                boxShadow: `0 12px 40px ${getTypeColor(primaryType)}66, 0 4px 12px rgba(0,0,0,0.2)`,
                position: 'relative',
                overflow: 'hidden',
                border: '3px solid rgba(255,255,255,0.3)'
            }}
        >
            {/* Pokeball watermark */}
            <div style={{
                position: 'absolute',
                top: '50%',
                right: '-70px',
                transform: 'translateY(-50%)',
                width: '220px',
                height: '220px',
                borderRadius: '50%',
                border: '12px solid rgba(255,255,255,0.08)',
                opacity: 0.5
            }}>
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: '12px',
                    background: 'rgba(255,255,255,0.08)',
                    transform: 'translateY(-50%)'
                }} />
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    border: '8px solid rgba(255,255,255,0.08)',
                    background: 'transparent'
                }} />
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
                <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '16px',
                    background: poke.avatar ? `url(${poke.avatar}) center/cover` : 'rgba(255,255,255,0.2)',
                    border: '4px solid rgba(255,255,255,0.5)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '44px',
                    flexShrink: 0
                }}>
                    {!poke.avatar && '?'}
                </div>
                <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, textShadow: '0 3px 6px rgba(0,0,0,0.4)', color: 'white' }}>
                        {poke.name} <span style={{ opacity: 0.9 }}>{genderSymbol}</span>
                    </h2>
                    {poke.species && poke.species !== poke.name && (
                        <p style={{ margin: '2px 0', opacity: 0.85, fontSize: '13px', fontStyle: 'italic' }}>{poke.species}</p>
                    )}
                    <div style={{
                        display: 'inline-block',
                        background: 'rgba(0,0,0,0.3)',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        marginTop: '6px',
                        fontSize: '12px',
                        fontWeight: 600
                    }}>
                        Level {poke.level} • {poke.nature}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                        {poke.types.map(type => (
                            <span key={type} style={{
                                background: 'rgba(0,0,0,0.35)',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                border: `2px solid ${getTypeColor(type)}`,
                                textShadow: '0 1px 3px rgba(0,0,0,0.4)'
                            }}>
                                {type}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* HP Bar */}
            <div style={{
                background: 'rgba(0,0,0,0.25)',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '14px',
                position: 'relative',
                zIndex: 1
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px'
                }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1px' }}>HP</span>
                    <span style={{ fontSize: '14px', fontWeight: 700 }}>{currentHP} / {maxHP}</span>
                </div>
                <div style={{
                    height: '10px',
                    background: 'rgba(0,0,0,0.4)',
                    borderRadius: '5px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        height: '100%',
                        width: `${(currentHP / maxHP) * 100}%`,
                        background: (currentHP / maxHP) > 0.5
                            ? 'linear-gradient(90deg, #4caf50, #8bc34a)'
                            : (currentHP / maxHP) > 0.25
                                ? 'linear-gradient(90deg, #ff9800, #ffc107)'
                                : 'linear-gradient(90deg, #f44336, #e91e63)',
                        borderRadius: '5px',
                        boxShadow: '0 0 10px rgba(255,255,255,0.3)'
                    }} />
                </div>
            </div>

            {/* Abilities */}
            {((poke.abilities && poke.abilities.length > 0) || poke.ability) && (
                <div style={{
                    background: 'rgba(0,0,0,0.25)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    marginBottom: '14px',
                    fontSize: '12px',
                    position: 'relative',
                    zIndex: 1
                }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.8, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Abilities</div>
                    <div style={{ fontWeight: 600 }}>
                        {poke.abilities && poke.abilities.length > 0
                            ? poke.abilities.join(' • ')
                            : poke.ability
                        }
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div style={{
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '14px',
                padding: '14px',
                marginBottom: '14px',
                position: 'relative',
                zIndex: 1,
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{
                    fontSize: '10px',
                    opacity: 0.9,
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    fontWeight: 700,
                    display: 'flex',
                    justifyContent: 'space-between'
                }}>
                    <span>Stats</span>
                    <span style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '8px' }}>
                        STAB: +{calculateSTAB(poke.level)}
                    </span>
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
                            background: `linear-gradient(135deg, ${statColors[stat.label]}dd, ${statColors[stat.label]}99)`,
                            borderRadius: '10px',
                            padding: '8px 10px',
                            textAlign: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }}>
                            <div style={{ fontSize: '10px', fontWeight: 600, opacity: 0.9 }}>{stat.label}</div>
                            <div style={{ fontSize: '20px', fontWeight: 800 }}>{stat.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Moves */}
            {poke.moves && poke.moves.length > 0 && (
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.9, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Moves</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {poke.moves.slice(0, 8).map((move, i) => (
                            <div key={i} style={{
                                background: 'rgba(0,0,0,0.25)',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                fontSize: '11px',
                                borderLeft: `4px solid ${getTypeColor(move.type)}`
                            }}>
                                <div style={{ fontWeight: 700, marginBottom: '2px' }}>{move.name}</div>
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
                    marginTop: '12px',
                    fontSize: '12px',
                    background: 'rgba(255,215,0,0.2)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,215,0,0.4)',
                    position: 'relative',
                    zIndex: 1
                }}>
                    <span style={{ opacity: 0.8 }}>Held Item:</span> <strong>{poke.heldItem}</strong>
                </div>
            )}

            {/* Branding */}
            <div style={{
                textAlign: 'center',
                marginTop: '14px',
                fontSize: '9px',
                opacity: 0.5,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                position: 'relative',
                zIndex: 1
            }}>
                PTA Dex • Pokémon Card
            </div>
        </div>
    );
};

export default CardExportModal;
