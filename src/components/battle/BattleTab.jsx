// ============================================================
// Battle Tab Component (Dice Roller)
// ============================================================

import React, { useState, useMemo, useEffect } from 'react';
import { GAME_DATA } from '../../data/configs.js';
import { getTypeColor } from '../../utils/typeUtils.js';
import { calculateSTAB, getActualStats, calculatePokemonHP } from '../../utils/dataUtils.js';

const BattleTab = ({
    trainer,
    party,
    discordWebhook,
    setDiscordWebhook,
    sendToDiscord,
    updatePokemon,
    showDetail
}) => {
    const [mode, setMode] = useState('pokemon');
    const [selectedMove, setSelectedMove] = useState(null);
    const [selectedSkill, setSelectedSkill] = useState('');
    const [selectedPokemonSkill, setSelectedPokemonSkill] = useState(null);
    const [customDice, setCustomDice] = useState('');
    const [rollHistory, setRollHistory] = useState([]);
    const [combatStages, setCombatStages] = useState({
        atk: 0, satk: 0, def: 0, sdef: 0, spd: 0, acc: 0, eva: 0
    });
    const [discordExpanded, setDiscordExpanded] = useState(false);
    const [applyStab, setApplyStab] = useState(true);
    const [showCombatStages, setShowCombatStages] = useState(false);
    const [selectedPokemonId, setSelectedPokemonId] = useState(null);

    // Get selected pokemon from party (synced with actual data)
    const selectedPokemon = useMemo(() => {
        return party.find(p => p.id === selectedPokemonId) || null;
    }, [party, selectedPokemonId]);

    // Calculate Pokemon HP using the utility function
    const getPokemonHP = (poke) => {
        if (!poke) return { current: 0, max: 0 };
        const max = calculatePokemonHP(poke);
        const current = max - (poke.currentDamage || 0);
        return { current: Math.max(0, current), max };
    };

    // Update combat stage
    const updateCombatStage = (stat, delta) => {
        setCombatStages(prev => ({
            ...prev,
            [stat]: Math.max(-6, Math.min(6, (prev[stat] || 0) + delta))
        }));
    };

    // Reset combat stages
    const resetCombatStages = () => {
        setCombatStages({ atk: 0, satk: 0, def: 0, sdef: 0, spd: 0, acc: 0, eva: 0 });
    };

    // Parse dice notation
    const parseDice = (diceStr) => {
        if (!diceStr) return { count: 0, sides: 0, bonus: 0 };
        const match = diceStr.match(/(\d+)d(\d+)(?:\+(\d+))?/i);
        if (!match) return { count: 0, sides: 0, bonus: 0 };
        return {
            count: parseInt(match[1]) || 0,
            sides: parseInt(match[2]) || 0,
            bonus: parseInt(match[3]) || 0
        };
    };

    // Roll dice
    const rollDice = (count, sides) => {
        const rolls = [];
        for (let i = 0; i < count; i++) {
            rolls.push(Math.floor(Math.random() * sides) + 1);
        }
        return rolls;
    };

    // Add to history
    const addToHistory = (roll) => {
        setRollHistory(prev => [roll, ...prev].slice(0, 50));
        if (sendToDiscord) sendToDiscord(roll, trainer.name);
    };

    // Roll Pokemon Move
    const rollPokemonMove = () => {
        if (!selectedPokemon || !selectedMove) return;

        const actualStats = getActualStats(selectedPokemon);
        const isPhysical = selectedMove.category === 'Physical';
        const statKey = isPhysical ? 'atk' : 'satk';
        const baseStat = actualStats[statKey] || 0;

        // Apply combat stages
        const stages = combatStages[statKey] || 0;
        let statMod = baseStat;
        if (stages > 0) {
            statMod = Math.floor(baseStat * (1 + stages * 0.25));
        } else if (stages < 0) {
            statMod = Math.ceil(baseStat * (1 - Math.abs(stages) * 0.10));
        }

        // Roll accuracy
        const accRoll = Math.floor(Math.random() * 20) + 1;
        const isCrit = accRoll === 20;

        // Parse damage dice
        const diceData = parseDice(selectedMove.damage);

        if (diceData.count === 0) {
            // Status move
            addToHistory({
                type: 'pokemon',
                pokemon: selectedPokemon.name || selectedPokemon.species,
                move: selectedMove.name,
                moveType: selectedMove.type,
                category: selectedMove.category,
                accRoll,
                isCrit,
                isStatus: true,
                total: 0,
                timestamp: Date.now()
            });
            return;
        }

        // Roll damage
        const diceCount = isCrit ? diceData.count * 2 : diceData.count;
        const rolls = rollDice(diceCount, diceData.sides);
        const diceTotal = rolls.reduce((sum, r) => sum + r, 0);

        // STAB
        let stabBonus = 0;
        if (applyStab && selectedPokemon.types?.includes(selectedMove.type)) {
            stabBonus = calculateSTAB(selectedPokemon.level || 1);
        }

        const total = diceTotal + diceData.bonus + statMod + stabBonus;

        addToHistory({
            type: 'pokemon',
            pokemon: selectedPokemon.name || selectedPokemon.species,
            move: selectedMove.name,
            moveType: selectedMove.type,
            category: selectedMove.category,
            dice: `${diceCount}d${diceData.sides}+${diceData.bonus}`,
            rolls,
            diceTotal,
            statBonus: statMod,
            stabBonus,
            accRoll,
            isCrit,
            total,
            timestamp: Date.now()
        });
    };

    // Roll Trainer Skill
    const rollTrainerSkill = () => {
        if (!selectedSkill) return;

        const skillData = GAME_DATA.skills[selectedSkill];
        if (!skillData) return;

        const statKey = skillData.stat?.toLowerCase();
        const baseStat = trainer.stats?.[statKey] || 6;
        const hasSkill = trainer.skills?.includes(selectedSkill);
        const skillBonus = hasSkill ? 2 : 0;

        const rolls = rollDice(2, 6);
        const rollTotal = rolls.reduce((sum, r) => sum + r, 0);
        const modifier = baseStat - 10;
        const total = rollTotal + modifier + skillBonus;

        addToHistory({
            type: 'trainer_skill',
            skill: selectedSkill,
            skillStat: skillData.stat,
            dice: '2d6',
            rolls,
            baseStat,
            modifier,
            hasSkill,
            bonus: skillBonus,
            total,
            timestamp: Date.now()
        });
    };

    // Roll Pokemon Skill
    const rollPokemonSkill = () => {
        if (!selectedPokemon || !selectedPokemonSkill) return;

        const diceCount = selectedPokemonSkill.value || 2;
        const rolls = rollDice(diceCount, 6);
        const total = rolls.reduce((sum, r) => sum + r, 0);

        addToHistory({
            type: 'pokemonSkill',
            pokemon: selectedPokemon.name || selectedPokemon.species,
            skill: selectedPokemonSkill.name,
            dice: `${diceCount}d6`,
            rolls,
            total,
            timestamp: Date.now()
        });
    };

    // Roll Custom
    const rollCustomDice = () => {
        const diceData = parseDice(customDice);
        if (diceData.count === 0 || diceData.sides === 0) {
            alert('Invalid dice format. Use format like "2d6+5" or "1d20"');
            return;
        }

        const rolls = rollDice(diceData.count, diceData.sides);
        const rollTotal = rolls.reduce((sum, r) => sum + r, 0);
        const total = rollTotal + diceData.bonus;

        addToHistory({
            type: 'custom',
            dice: customDice,
            rolls,
            rollTotal,
            bonus: diceData.bonus,
            total,
            timestamp: Date.now()
        });
    };

    return (
        <div>
            <h2 className="section-title">Dice Roller</h2>

            {/* Mode Selector */}
            <div className="tabs" style={{ marginBottom: '15px' }}>
                <button className={`tab ${mode === 'pokemon' ? 'active' : ''}`} onClick={() => setMode('pokemon')}>
                    Pokemon Attack
                </button>
                <button className={`tab ${mode === 'pokemonSkill' ? 'active' : ''}`} onClick={() => setMode('pokemonSkill')}>
                    Pokemon Skill
                </button>
                <button className={`tab ${mode === 'trainer' ? 'active' : ''}`} onClick={() => setMode('trainer')}>
                    Trainer Skill
                </button>
                <button className={`tab ${mode === 'custom' ? 'active' : ''}`} onClick={() => setMode('custom')}>
                    Custom Dice
                </button>
            </div>

            <div className="grid-responsive-2">
                {/* Left: Roll Controls */}
                <div className="section-card-purple">
                    <h3 className="section-title-purple">
                        <span>🎲</span> {mode === 'pokemon' ? 'Pokemon Attack' : mode === 'pokemonSkill' ? 'Pokemon Skill' : mode === 'trainer' ? 'Trainer Skill' : 'Custom Roll'}
                    </h3>

                    {mode === 'pokemon' && (
                        <div>
                            {/* Pokemon Selector */}
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                                    Select Pokemon
                                </label>
                                <select
                                    value={selectedPokemonId || ''}
                                    onChange={(e) => {
                                        setSelectedPokemonId(parseInt(e.target.value) || null);
                                        setSelectedMove(null);
                                        resetCombatStages();
                                    }}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                >
                                    <option value="">Choose a Pokemon...</option>
                                    {party.map(poke => {
                                        const hp = getPokemonHP(poke);
                                        return (
                                            <option key={poke.id} value={poke.id}>
                                                {poke.name || poke.species} (Lv.{poke.level}) - HP: {hp.current}/{hp.max}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* Pokemon HP Display & Tracking */}
                            {selectedPokemon && (() => {
                                const hp = getPokemonHP(selectedPokemon);
                                const hpPercent = (hp.current / hp.max) * 100;
                                return (
                                    <div style={{ marginBottom: '12px', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>HP</span>
                                            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{hp.current} / {hp.max}</span>
                                        </div>
                                        <div style={{ background: '#ddd', borderRadius: '4px', height: '12px', overflow: 'hidden', marginBottom: '8px' }}>
                                            <div style={{
                                                width: `${hpPercent}%`,
                                                height: '100%',
                                                background: hpPercent > 50 ? '#4caf50' : hpPercent > 25 ? '#ff9800' : '#f44336',
                                                transition: 'width 0.3s ease'
                                            }} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '10px', color: '#666', width: '100%', textAlign: 'center', marginBottom: '4px' }}>
                                                Damage ← → Heal
                                            </span>
                                            {[10, 5, 1].map(val => (
                                                <button
                                                    key={`dmg-${val}`}
                                                    onClick={() => updatePokemon && updatePokemon(selectedPokemon.id, {
                                                        currentDamage: Math.min(hp.max, (selectedPokemon.currentDamage || 0) + val)
                                                    })}
                                                    style={{ padding: '4px 8px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                                                >
                                                    +{val}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => updatePokemon && updatePokemon(selectedPokemon.id, { currentDamage: 0 })}
                                                style={{ padding: '4px 8px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                                            >
                                                Full
                                            </button>
                                            {[1, 5, 10].map(val => (
                                                <button
                                                    key={`heal-${val}`}
                                                    onClick={() => updatePokemon && updatePokemon(selectedPokemon.id, {
                                                        currentDamage: Math.max(0, (selectedPokemon.currentDamage || 0) - val)
                                                    })}
                                                    style={{ padding: '4px 8px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                                                >
                                                    -{val}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Combat Stages */}
                            {selectedPokemon && (
                                <div style={{ marginBottom: '12px' }}>
                                    <div
                                        onClick={() => setShowCombatStages(!showCombatStages)}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '8px 10px',
                                            background: '#e8eaf6',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            marginBottom: showCombatStages ? '8px' : 0
                                        }}
                                    >
                                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Combat Stages</span>
                                        <span style={{ fontSize: '11px', color: '#666' }}>
                                            {showCombatStages ? '▲ Hide' : '▼ Show'}
                                        </span>
                                    </div>
                                    {showCombatStages && (() => {
                                        const actualStats = getActualStats(selectedPokemon);
                                        const getModifiedStat = (baseStat, stages) => {
                                            if (stages > 0) return Math.floor(baseStat * (1 + stages * 0.25));
                                            if (stages < 0) return Math.ceil(baseStat * (1 - Math.abs(stages) * 0.10));
                                            return baseStat;
                                        };
                                        return (
                                            <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '6px' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                                    {[
                                                        { key: 'atk', label: 'ATK', color: '#f44336' },
                                                        { key: 'def', label: 'DEF', color: '#2196f3' },
                                                        { key: 'satk', label: 'SATK', color: '#9c27b0' },
                                                        { key: 'sdef', label: 'SDEF', color: '#ff9800' },
                                                        { key: 'spd', label: 'SPD', color: '#00bcd4' },
                                                        { key: 'acc', label: 'ACC', color: '#4caf50' }
                                                    ].map(stat => {
                                                        const baseStat = actualStats[stat.key] || 0;
                                                        const stages = combatStages[stat.key] || 0;
                                                        const modifiedStat = stat.key === 'acc' ? stages : getModifiedStat(baseStat, stages);
                                                        return (
                                                            <div key={stat.key} style={{ textAlign: 'center', background: 'white', padding: '6px', borderRadius: '4px' }}>
                                                                <div style={{ fontSize: '10px', fontWeight: 'bold', color: stat.color }}>{stat.label}</div>
                                                                <div style={{ fontSize: '11px', color: '#666' }}>
                                                                    {stat.key === 'acc' ? '±' : baseStat} → <strong style={{ color: stages !== 0 ? (stages > 0 ? '#4caf50' : '#f44336') : '#333' }}>
                                                                        {stat.key === 'acc' ? (stages >= 0 ? '+' : '') + stages : modifiedStat}
                                                                    </strong>
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px' }}>
                                                                    <button
                                                                        onClick={() => updateCombatStage(stat.key, -1)}
                                                                        style={{ width: '24px', height: '24px', border: 'none', borderRadius: '4px', background: '#ffcdd2', cursor: 'pointer', fontSize: '14px' }}
                                                                    >−</button>
                                                                    <span style={{
                                                                        fontSize: '12px',
                                                                        fontWeight: 'bold',
                                                                        color: stages > 0 ? '#4caf50' : stages < 0 ? '#f44336' : '#999',
                                                                        minWidth: '20px'
                                                                    }}>
                                                                        {stages > 0 ? '+' : ''}{stages}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => updateCombatStage(stat.key, 1)}
                                                                        style={{ width: '24px', height: '24px', border: 'none', borderRadius: '4px', background: '#c8e6c9', cursor: 'pointer', fontSize: '14px' }}
                                                                    >+</button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <button
                                                    onClick={resetCombatStages}
                                                    style={{ marginTop: '8px', width: '100%', padding: '6px', background: '#9e9e9e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                                                >
                                                    Reset All Stages
                                                </button>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* STAB Toggle */}
                            {selectedPokemon && (
                                <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={applyStab}
                                            onChange={(e) => setApplyStab(e.target.checked)}
                                        />
                                        <span style={{ fontSize: '12px' }}>Apply STAB</span>
                                    </label>
                                    <span style={{ fontSize: '11px', color: '#666' }}>
                                        (+{calculateSTAB(selectedPokemon.level || 1)} for matching type)
                                    </span>
                                </div>
                            )}

                            {/* Move Selector */}
                            {selectedPokemon && (
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                                        Select Move
                                    </label>
                                    <div style={{ display: 'grid', gap: '6px' }}>
                                        {(selectedPokemon.moves || []).map((move, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'stretch',
                                                    border: `2px solid ${getTypeColor(move.type)}`,
                                                    borderRadius: '6px',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                <button
                                                    onClick={() => setSelectedMove(move)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '10px',
                                                        background: selectedMove?.name === move.name
                                                            ? getTypeColor(move.type)
                                                            : 'white',
                                                        color: selectedMove?.name === move.name ? 'white' : '#333',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        textAlign: 'left'
                                                    }}
                                                >
                                                    <div style={{ fontWeight: 'bold' }}>{move.name}</div>
                                                    <div style={{ fontSize: '11px', opacity: 0.8 }}>
                                                        {move.type} | {move.category} | {move.damage || 'Status'}
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={() => showDetail && showDetail('move', move.name, { ...GAME_DATA.moves?.[move.name], ...move })}
                                                    style={{
                                                        padding: '0 12px',
                                                        background: getTypeColor(move.type),
                                                        color: 'white',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: '14px'
                                                    }}
                                                    title="View move details"
                                                >
                                                    ℹ
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Roll Button */}
                            <button
                                onClick={rollPokemonMove}
                                disabled={!selectedPokemon || !selectedMove}
                                style={{
                                    width: '100%',
                                    padding: '15px',
                                    background: selectedPokemon && selectedMove
                                        ? 'linear-gradient(135deg, #667eea, #764ba2)'
                                        : '#ccc',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: selectedPokemon && selectedMove ? 'pointer' : 'not-allowed',
                                    fontSize: '16px',
                                    fontWeight: 'bold'
                                }}
                            >
                                Roll Attack!
                            </button>
                        </div>
                    )}

                    {mode === 'pokemonSkill' && (
                        <div>
                            {/* Pokemon Selector */}
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                                    Select Pokemon
                                </label>
                                <select
                                    value={selectedPokemonId || ''}
                                    onChange={(e) => {
                                        setSelectedPokemonId(parseInt(e.target.value) || null);
                                        setSelectedPokemonSkill(null);
                                    }}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                >
                                    <option value="">Choose a Pokemon...</option>
                                    {party.map(poke => (
                                        <option key={poke.id} value={poke.id}>
                                            {poke.name || poke.species} (Lv.{poke.level})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Skill Selector */}
                            {selectedPokemon && (
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                                        Select Skill
                                    </label>
                                    {(selectedPokemon.pokemonSkills || []).length === 0 ? (
                                        <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '6px', color: '#666', textAlign: 'center' }}>
                                            No skills available for this Pokemon
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gap: '6px' }}>
                                            {(selectedPokemon.pokemonSkills || []).filter(s => s.value !== undefined).map((skill, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setSelectedPokemonSkill(skill)}
                                                    style={{
                                                        padding: '10px',
                                                        background: selectedPokemonSkill?.name === skill.name
                                                            ? '#9c27b0'
                                                            : 'white',
                                                        color: selectedPokemonSkill?.name === skill.name ? 'white' : '#333',
                                                        border: '2px solid #9c27b0',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        textAlign: 'left'
                                                    }}
                                                >
                                                    <div style={{ fontWeight: 'bold' }}>{skill.name}</div>
                                                    <div style={{ fontSize: '11px', opacity: 0.8 }}>
                                                        {skill.value}d6
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Roll Button */}
                            <button
                                onClick={rollPokemonSkill}
                                disabled={!selectedPokemon || !selectedPokemonSkill}
                                style={{
                                    width: '100%',
                                    padding: '15px',
                                    background: selectedPokemon && selectedPokemonSkill
                                        ? 'linear-gradient(135deg, #9c27b0, #7b1fa2)'
                                        : '#ccc',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: selectedPokemon && selectedPokemonSkill ? 'pointer' : 'not-allowed',
                                    fontSize: '16px',
                                    fontWeight: 'bold'
                                }}
                            >
                                Roll Skill!
                            </button>
                        </div>
                    )}

                    {mode === 'trainer' && (
                        <div>
                            {/* Trainer Stats Display */}
                            <div style={{ marginBottom: '12px', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>
                                    {trainer.name || 'Trainer'} - Level {trainer.level || 1}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                                    {[
                                        { key: 'hp', label: 'HP', color: '#e53935' },
                                        { key: 'atk', label: 'ATK', color: '#ff5722' },
                                        { key: 'def', label: 'DEF', color: '#2196f3' },
                                        { key: 'satk', label: 'SATK', color: '#9c27b0' },
                                        { key: 'sdef', label: 'SDEF', color: '#ff9800' },
                                        { key: 'spd', label: 'SPD', color: '#00bcd4' }
                                    ].map(stat => {
                                        const value = trainer.stats?.[stat.key] || 10;
                                        const mod = value >= 10 ? Math.floor((value - 10) / 2) : -(10 - value);
                                        return (
                                            <div key={stat.key} style={{ textAlign: 'center', padding: '4px', background: 'white', borderRadius: '4px' }}>
                                                <div style={{ fontSize: '10px', fontWeight: 'bold', color: stat.color }}>{stat.label}</div>
                                                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{value}</div>
                                                <div style={{ fontSize: '10px', color: mod >= 0 ? '#4caf50' : '#f44336' }}>
                                                    {mod >= 0 ? '+' : ''}{mod}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {trainer.skills && trainer.skills.length > 0 && (
                                    <div style={{ marginTop: '8px', fontSize: '11px' }}>
                                        <strong>Trained Skills:</strong> {trainer.skills.join(', ')}
                                    </div>
                                )}
                            </div>

                            <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                                Select Skill
                            </label>
                            <select
                                value={selectedSkill}
                                onChange={(e) => setSelectedSkill(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', marginBottom: '8px' }}
                            >
                                <option value="">Choose a skill...</option>
                                {Object.entries(GAME_DATA.skills || {}).map(([name, data]) => (
                                    <option key={name} value={name}>
                                        {name} ({data.stat}) {trainer.skills?.includes(name) ? '✓ Trained' : ''}
                                    </option>
                                ))}
                            </select>

                            {/* Selected Skill Info */}
                            {selectedSkill && GAME_DATA.skills?.[selectedSkill] && (() => {
                                const skillData = GAME_DATA.skills[selectedSkill];
                                const statKey = skillData.stat?.toLowerCase();
                                const baseStat = trainer.stats?.[statKey] || 10;
                                const modifier = baseStat >= 10 ? Math.floor((baseStat - 10) / 2) : -(10 - baseStat);
                                const hasTrained = trainer.skills?.includes(selectedSkill);
                                const trainedBonus = hasTrained ? 2 : 0;
                                return (
                                    <div style={{ marginBottom: '12px', padding: '10px', background: '#e8f5e9', borderRadius: '6px', fontSize: '12px' }}>
                                        <div><strong>{selectedSkill}</strong> ({skillData.stat})</div>
                                        <div style={{ marginTop: '4px' }}>
                                            Roll: 2d6 {modifier >= 0 ? '+' : ''}{modifier} (stat)
                                            {hasTrained && <span style={{ color: '#4caf50' }}> +2 (trained)</span>}
                                        </div>
                                        <div style={{ marginTop: '2px', color: '#666' }}>
                                            {skillData.description}
                                        </div>
                                    </div>
                                );
                            })()}

                            <button
                                onClick={rollTrainerSkill}
                                disabled={!selectedSkill}
                                style={{
                                    width: '100%',
                                    padding: '15px',
                                    background: selectedSkill ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#ccc',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: selectedSkill ? 'pointer' : 'not-allowed',
                                    fontSize: '16px',
                                    fontWeight: 'bold'
                                }}
                            >
                                Roll Skill Check!
                            </button>
                        </div>
                    )}

                    {mode === 'custom' && (
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                                Dice Notation (e.g., 2d6+5, 1d20)
                            </label>
                            <input
                                type="text"
                                value={customDice}
                                onChange={(e) => setCustomDice(e.target.value)}
                                placeholder="2d6+5"
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', marginBottom: '12px' }}
                            />

                            {/* Quick Dice Buttons */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                                {['1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '2d6', '3d6'].map(dice => (
                                    <button
                                        key={dice}
                                        onClick={() => setCustomDice(dice)}
                                        style={{
                                            padding: '6px 12px',
                                            background: customDice === dice ? '#667eea' : 'white',
                                            color: customDice === dice ? 'white' : '#333',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        {dice}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={rollCustomDice}
                                disabled={!customDice}
                                style={{
                                    width: '100%',
                                    padding: '15px',
                                    background: customDice ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#ccc',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: customDice ? 'pointer' : 'not-allowed',
                                    fontSize: '16px',
                                    fontWeight: 'bold'
                                }}
                            >
                                Roll!
                            </button>
                        </div>
                    )}

                    {/* Discord Settings */}
                    <div style={{
                        marginTop: '20px',
                        background: discordExpanded ? '#36393f' : '#5865F2',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease'
                    }}>
                        {/* Discord Header - Always visible */}
                        <div
                            onClick={() => setDiscordExpanded(!discordExpanded)}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 12px',
                                cursor: 'pointer',
                                background: '#5865F2'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {/* Discord Logo SVG */}
                                <svg width="20" height="15" viewBox="0 0 24 18" fill="white">
                                    <path d="M20.317 1.492a19.7 19.7 0 0 0-4.885-1.48.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.7 19.7 0 0 0 3.677 1.492a.07.07 0 0 0-.032.027C.533 6.093-.32 10.555.099 14.961a.08.08 0 0 0 .031.055 19.9 19.9 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.3 13.3 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 12.278c-1.183 0-2.157-1.068-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.068-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
                                </svg>
                                <span style={{ fontWeight: 'bold', fontSize: '13px', color: 'white' }}>Discord</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {!discordExpanded && (
                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                                        Tap to configure
                                    </span>
                                )}
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDiscordWebhook(prev => ({ ...prev, enabled: !prev?.enabled }));
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '4px 10px',
                                        background: discordWebhook?.enabled ? '#57F287' : 'rgba(255,255,255,0.2)',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s ease'
                                    }}
                                >
                                    <span style={{ fontSize: '11px', color: discordWebhook?.enabled ? '#000' : '#fff', fontWeight: 'bold' }}>
                                        {discordWebhook?.enabled ? 'ON' : 'OFF'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Discord Expanded Content */}
                        {discordExpanded && (
                            <div style={{ padding: '12px', background: '#36393f' }}>
                                <div style={{ fontSize: '12px', color: '#b9bbbe', marginBottom: '10px', lineHeight: '1.4' }}>
                                    Send dice rolls to a Discord channel via webhook.
                                    <br />
                                    <span style={{ fontSize: '11px', color: '#72767d' }}>
                                        Server Settings → Integrations → Webhooks → New Webhook
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Paste webhook URL..."
                                    value={discordWebhook?.url || ''}
                                    onChange={(e) => setDiscordWebhook(prev => ({ ...prev, url: e.target.value }))}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '4px',
                                        border: 'none',
                                        fontSize: '12px',
                                        background: '#40444b',
                                        color: '#dcddde',
                                        marginBottom: '10px'
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        if (!discordWebhook?.url) {
                                            alert('Please enter a webhook URL first');
                                            return;
                                        }
                                        // Send test message
                                        fetch(discordWebhook.url, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                embeds: [{
                                                    title: '🎲 Test Message',
                                                    description: 'Discord webhook is working! Dice rolls will appear here.',
                                                    color: 0x5865F2
                                                }]
                                            })
                                        })
                                        .then(res => {
                                            if (res.ok) {
                                                alert('Test message sent! Check your Discord channel.');
                                            } else {
                                                alert('Failed to send. Check if the webhook URL is correct.');
                                            }
                                        })
                                        .catch(() => alert('Failed to send. Check the webhook URL.'));
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: '#5865F2',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '12px'
                                    }}
                                >
                                    Send Test Message
                                </button>
                                {discordWebhook?.enabled && discordWebhook?.url && (
                                    <div style={{ fontSize: '11px', color: '#57F287', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span>●</span> Connected - rolls will be sent to Discord
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Roll History */}
                <div className="section-card-purple">
                    <h3 className="section-title-purple">
                        <span>📜</span> Roll History
                        {rollHistory.length > 0 && (
                            <button
                                onClick={() => setRollHistory([])}
                                style={{
                                    marginLeft: 'auto',
                                    padding: '4px 8px',
                                    background: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '10px'
                                }}
                            >
                                Clear
                            </button>
                        )}
                    </h3>

                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {rollHistory.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                No rolls yet
                            </div>
                        ) : (
                            rollHistory.map((roll, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        padding: '10px',
                                        marginBottom: '8px',
                                        background: roll.isCrit ? 'linear-gradient(135deg, #ffd700, #ff9800)' : 'white',
                                        borderRadius: '6px',
                                        borderLeft: `4px solid ${
                                            roll.type === 'pokemon' ? getTypeColor(roll.moveType || 'Normal') :
                                            roll.type === 'pokemonSkill' ? '#9c27b0' :
                                            roll.type === 'trainer_skill' ? '#667eea' : '#95a5a6'
                                        }`
                                    }}
                                >
                                    {roll.type === 'pokemon' && (
                                        <>
                                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                                {roll.pokemon} - {roll.move}
                                                {roll.isCrit && <span style={{ marginLeft: '8px', color: '#c62828' }}>CRITICAL!</span>}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>
                                                {roll.isStatus ? (
                                                    <span>Status Move | Accuracy: {roll.accRoll}</span>
                                                ) : (
                                                    <>
                                                        <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#333' }}>{roll.total}</span>
                                                        <span> damage | [{roll.rolls?.join(', ')}] +{roll.statBonus} stat +{roll.stabBonus} STAB</span>
                                                    </>
                                                )}
                                            </div>
                                        </>
                                    )}
                                    {roll.type === 'pokemonSkill' && (
                                        <>
                                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                                🐾 {roll.pokemon} - {roll.skill}
                                            </div>
                                            <div style={{ fontSize: '12px' }}>
                                                <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{roll.total}</span>
                                                <span> | [{roll.rolls?.join(', ')}] ({roll.dice})</span>
                                            </div>
                                        </>
                                    )}
                                    {roll.type === 'trainer_skill' && (
                                        <>
                                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                                {roll.skill} ({roll.skillStat})
                                            </div>
                                            <div style={{ fontSize: '12px' }}>
                                                <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{roll.total}</span>
                                                <span> | [{roll.rolls?.join(', ')}] {roll.modifier >= 0 ? '+' : ''}{roll.modifier} stat</span>
                                                {roll.hasSkill && <span> +2 trained</span>}
                                            </div>
                                        </>
                                    )}
                                    {roll.type === 'custom' && (
                                        <>
                                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                                Custom: {roll.dice}
                                            </div>
                                            <div style={{ fontSize: '12px' }}>
                                                <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{roll.total}</span>
                                                <span> | [{roll.rolls?.join(', ')}]</span>
                                                {roll.bonus > 0 && <span> +{roll.bonus}</span>}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BattleTab;
