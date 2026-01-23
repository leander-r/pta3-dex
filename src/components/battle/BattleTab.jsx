// ============================================================
// Battle Tab Component (Dice Roller)
// ============================================================

import React, { useState } from 'react';
import { GAME_DATA } from '../../data/configs.js';
import { getTypeColor } from '../../utils/typeUtils.js';
import { calculateSTAB, getActualStats } from '../../utils/dataUtils.js';

const BattleTab = ({
    trainer,
    party,
    discordWebhook,
    setDiscordWebhook,
    sendToDiscord
}) => {
    const [mode, setMode] = useState('pokemon');
    const [selectedPokemon, setSelectedPokemon] = useState(null);
    const [selectedMove, setSelectedMove] = useState(null);
    const [selectedSkill, setSelectedSkill] = useState('');
    const [customDice, setCustomDice] = useState('');
    const [rollHistory, setRollHistory] = useState([]);
    const [combatStages, setCombatStages] = useState({
        atk: 0, satk: 0, def: 0, sdef: 0, spd: 0, acc: 0, eva: 0
    });

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
        if (selectedPokemon.types?.includes(selectedMove.type)) {
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
                    Pokemon Roll
                </button>
                <button className={`tab ${mode === 'trainer' ? 'active' : ''}`} onClick={() => setMode('trainer')}>
                    Trainer Roll
                </button>
                <button className={`tab ${mode === 'custom' ? 'active' : ''}`} onClick={() => setMode('custom')}>
                    Custom Dice
                </button>
            </div>

            <div className="grid-responsive-2">
                {/* Left: Roll Controls */}
                <div className="section-card-purple">
                    <h3 className="section-title-purple">
                        <span>🎲</span> {mode === 'pokemon' ? 'Pokemon Attack' : mode === 'trainer' ? 'Trainer Skill' : 'Custom Roll'}
                    </h3>

                    {mode === 'pokemon' && (
                        <div>
                            {/* Pokemon Selector */}
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                                    Select Pokemon
                                </label>
                                <select
                                    value={selectedPokemon?.id || ''}
                                    onChange={(e) => {
                                        const poke = party.find(p => p.id === parseInt(e.target.value));
                                        setSelectedPokemon(poke);
                                        setSelectedMove(null);
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

                            {/* Move Selector */}
                            {selectedPokemon && (
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                                        Select Move
                                    </label>
                                    <div style={{ display: 'grid', gap: '6px' }}>
                                        {(selectedPokemon.moves || []).map((move, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedMove(move)}
                                                style={{
                                                    padding: '10px',
                                                    background: selectedMove?.name === move.name
                                                        ? getTypeColor(move.type)
                                                        : 'white',
                                                    color: selectedMove?.name === move.name ? 'white' : '#333',
                                                    border: `2px solid ${getTypeColor(move.type)}`,
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    textAlign: 'left'
                                                }}
                                            >
                                                <div style={{ fontWeight: 'bold' }}>{move.name}</div>
                                                <div style={{ fontSize: '11px', opacity: 0.8 }}>
                                                    {move.type} | {move.category} | {move.damage || 'Status'}
                                                </div>
                                            </button>
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

                    {mode === 'trainer' && (
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                                Select Skill
                            </label>
                            <select
                                value={selectedSkill}
                                onChange={(e) => setSelectedSkill(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', marginBottom: '12px' }}
                            >
                                <option value="">Choose a skill...</option>
                                {Object.entries(GAME_DATA.skills || {}).map(([name, data]) => (
                                    <option key={name} value={name}>
                                        {name} ({data.stat}) {trainer.skills?.includes(name) ? '✓' : ''}
                                    </option>
                                ))}
                            </select>

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
                    <div style={{ marginTop: '20px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '12px' }}>Discord Webhook</span>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={discordWebhook?.enabled || false}
                                    onChange={(e) => setDiscordWebhook(prev => ({ ...prev, enabled: e.target.checked }))}
                                />
                                <span style={{ fontSize: '12px' }}>Enabled</span>
                            </label>
                        </div>
                        {discordWebhook?.enabled && (
                            <input
                                type="text"
                                placeholder="Paste Discord webhook URL..."
                                value={discordWebhook?.url || ''}
                                onChange={(e) => setDiscordWebhook(prev => ({ ...prev, url: e.target.value }))}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '11px' }}
                            />
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
