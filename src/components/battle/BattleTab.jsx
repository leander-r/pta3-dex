// ============================================================
// Battle Tab Component (Dice Roller)
// ============================================================

import React, { useState, useMemo, useEffect } from 'react';
import { getTypeColor } from '../../utils/typeUtils.js';
import { calculateSTAB, getActualStats, calculatePokemonHP, parseDice, applyCombatStage, parseHealFormula } from '../../utils/dataUtils.js';
import toast from '../../utils/toast.js';
import { useGameData, useModal, useTrainerContext, usePokemonContext, useData } from '../../contexts/index.js';
import { MAX_ROLL_HISTORY } from '../../data/constants.js';
import { getPokemonSprite, getPokemonDisplayImage, getMegaSprite } from '../../utils/pokemonSprite.js';
import TypeMatchupDisplay from './TypeMatchupDisplay.jsx';
import StatusConditionUI from './StatusConditionUI.jsx';
import MegaEvolutionPanel from './MegaEvolutionPanel.jsx';
import HPTracker from './HPTracker.jsx';
import CombatStagesPanel from './CombatStagesPanel.jsx';
import MoveSelector from './MoveSelector.jsx';
import CustomDicePanel from './CustomDicePanel.jsx';
import HealModePanel from './HealModePanel.jsx';
import RollHistory from './RollHistory.jsx';
import DiscordWebhookConfig from './DiscordWebhookConfig.jsx';

// Parse the AC number from a move frequency string, e.g. "EOT – 2" → 2
const parseACFromFrequency = (freq) => {
    if (!freq) return 2;
    const match = freq.match(/[-–]\s*(\d+)/);
    return match ? parseInt(match[1]) : 2;
};

// Convert a CSS hex color string to a Discord integer color
const hexToDiscordColor = (hex) => parseInt((hex || '#667eea').replace('#', ''), 16);


// Collect live battle context to attach to roll entries
const battleContext = (pokemon, hp, megaEvolved, currentMegaForm) => ({
    attackerCurrentHP: hp.current,
    attackerMaxHP: hp.max,
    pokemonSpriteUrl: getPokemonSprite(pokemon),
    activeStatuses: Object.entries(pokemon.statusConditions || {}).filter(([, v]) => v).map(([k]) => k),
    megaEvolved,
    megaFormName: megaEvolved && currentMegaForm ? currentMegaForm.name : null,
});

// Build a normalized roll-history entry for a Pokemon attack.
// Extra fields (typeColor, attackerCurrentHP, etc.) are spread through unchanged.
const buildPokemonRollEntry = ({
    pokemon, move, moveType, category,
    accRoll, accModifier, modifiedAccRoll, moveAC, acWasOverridden,
    isHit, isCrit, isStatus,
    dice, rolls, diceTotal, statBonus, stabBonus, total,
    ...extra
}) => ({
    type: 'pokemon',
    pokemon, move, moveType, category,
    accRoll, accModifier, modifiedAccRoll, moveAC, acWasOverridden,
    isHit, isCrit,
    isStatus: isStatus || false,
    dice: dice || null,
    rolls: rolls || [],
    diceTotal: diceTotal || 0,
    statBonus: statBonus || 0,
    stabBonus: stabBonus || 0,
    total: total || 0,
    timestamp: Date.now(),
    ...extra
});


const BattleTab = () => {
    const { GAME_DATA, pokedex } = useGameData();
    const { showDetail } = useModal();
    const { trainer, setTrainer, party, calculateMaxHP } = useTrainerContext();
    const { updatePokemon } = usePokemonContext();
    const { sendToDiscord, inventory, setInventory } = useData();

    const [mode, setMode] = useState('pokemon');
    const [selectedMove, setSelectedMove] = useState(null);
    const [selectedSkill, setSelectedSkill] = useState('');
    const [customDice, setCustomDice] = useState('');
    const [rollHistory, setRollHistory] = useState(() => {
        try { return JSON.parse(localStorage.getItem('pta-roll-history') || '[]'); } catch (e) { console.warn('Roll history corrupted, resetting:', e); return []; }
    });
    const [combatStages, setCombatStages] = useState({ atk: 0, satk: 0, def: 0, sdef: 0, spd: 0, acc: 0, eva: 0 });
    const [applyStab, setApplyStab] = useState(true);
    const [selectedPokemonId, setSelectedPokemonId] = useState(null);
    const [acOverride, setAcOverride] = useState('');
    const [megaEvolved, setMegaEvolved] = useState(false);
    const [currentMegaForm, setCurrentMegaForm] = useState(null);

    const selectedPokemon = useMemo(() => party.find(p => p.id === selectedPokemonId) || null, [party, selectedPokemonId]);

    const megaForms = useMemo(() => {
        if (!selectedPokemon || !pokedex) return [];
        return pokedex.find(p => p.species === selectedPokemon.species)?.megaForms || [];
    }, [selectedPokemon, pokedex]);

    const healingInventory = useMemo(() => inventory.filter(item => {
        const t = (item.type || '').toLowerCase();
        if (t !== 'healing' && t !== 'berry') return false;
        return parseHealFormula(item.effect || '').type !== 'none';
    }), [inventory]);

    useEffect(() => {
        try { localStorage.setItem('pta-roll-history', JSON.stringify(rollHistory)); } catch {}
    }, [rollHistory]);

    useEffect(() => {
        setMegaEvolved(false);
        setCurrentMegaForm(null);
        setAcOverride('');
    }, [selectedPokemonId]);

    // Apply mega stat boosts to actual stats
    const getStatsWithMega = (pokemon) => {
        const baseStats = getActualStats(pokemon);
        if (!megaEvolved || !currentMegaForm?.statBoosts) return baseStats;
        return {
            hp:   baseStats.hp   + (currentMegaForm.statBoosts.hp   || 0),
            atk:  baseStats.atk  + (currentMegaForm.statBoosts.atk  || 0),
            def:  baseStats.def  + (currentMegaForm.statBoosts.def  || 0),
            satk: baseStats.satk + (currentMegaForm.statBoosts.satk || 0),
            sdef: baseStats.sdef + (currentMegaForm.statBoosts.sdef || 0),
            spd:  baseStats.spd  + (currentMegaForm.statBoosts.spd  || 0),
        };
    };

    const handleMegaEvolve = (megaForm) => { setCurrentMegaForm(megaForm); setMegaEvolved(true); };
    const handleMegaRevert = () => { setMegaEvolved(false); setCurrentMegaForm(null); };

    const getPokemonHP = (poke) => {
        if (!poke) return { current: 0, max: 0 };
        const max = calculatePokemonHP(poke);
        return { current: Math.max(0, max - (poke.currentDamage || 0)), max };
    };

    const updateCombatStage = (stat, delta) => {
        setCombatStages(prev => ({ ...prev, [stat]: Math.max(-6, Math.min(6, (prev[stat] || 0) + delta)) }));
    };
    const resetCombatStages = () => setCombatStages({ atk: 0, satk: 0, def: 0, sdef: 0, spd: 0, acc: 0, eva: 0 });

    const rollDice = (count, sides) => {
        const rolls = [];
        for (let i = 0; i < count; i++) rolls.push(Math.floor(Math.random() * sides) + 1);
        return rolls;
    };

    const addToHistory = (roll) => {
        setRollHistory(prev => [roll, ...prev].slice(0, MAX_ROLL_HISTORY));
        if (sendToDiscord) sendToDiscord(roll, trainer.name);
    };

    const rollPokemonMove = () => {
        if (!selectedPokemon || !selectedMove) return;

        const actualStats = getStatsWithMega(selectedPokemon);
        const isPhysical = selectedMove.category === 'Physical';
        const statKey = isPhysical ? 'atk' : 'satk';
        const statMod = applyCombatStage(actualStats[statKey] || 0, combatStages[statKey] || 0);

        const defaultAC = parseACFromFrequency(selectedMove.frequency || selectedMove.freq);
        const moveAC = acOverride !== '' ? parseInt(acOverride) || defaultAC : defaultAC;
        const accModifier = combatStages.acc || 0;
        const accRoll = Math.floor(Math.random() * 20) + 1;
        const modifiedAccRoll = accRoll + accModifier;
        const isCrit = accRoll === 20;
        const isHit = accRoll === 20 || modifiedAccRoll >= moveAC;
        const acWasOverridden = acOverride !== '';

        const hp = getPokemonHP(selectedPokemon);
        const ctx = battleContext(selectedPokemon, hp, megaEvolved, currentMegaForm);
        const typeColor = hexToDiscordColor(getTypeColor(selectedMove.type));

        const commonFields = {
            pokemon: selectedPokemon.name || selectedPokemon.species,
            move: selectedMove.name, moveType: selectedMove.type, category: selectedMove.category,
            accRoll, accModifier, modifiedAccRoll, moveAC, acWasOverridden, isHit, isCrit,
            typeColor, ...ctx,
        };

        const diceData = parseDice(selectedMove.damage);
        if (diceData.count === 0) {
            addToHistory(buildPokemonRollEntry({ ...commonFields, isStatus: true }));
            return;
        }

        let rolls = [], diceTotal = 0, stabBonus = 0, total = 0, diceCount = 0;
        if (isHit) {
            diceCount = isCrit ? diceData.count * 2 : diceData.count;
            rolls = rollDice(diceCount, diceData.sides);
            diceTotal = rolls.reduce((sum, r) => sum + r, 0);
            if (applyStab && selectedPokemon.types?.includes(selectedMove.type)) {
                stabBonus = calculateSTAB(selectedPokemon.level || 1);
            }
            total = diceTotal + diceData.bonus + statMod + stabBonus;
        }

        addToHistory(buildPokemonRollEntry({
            ...commonFields,
            dice: isHit ? `${diceCount}d${diceData.sides}+${diceData.bonus}` : null,
            rolls, diceTotal, statBonus: statMod, stabBonus, total
        }));
    };

    const rollTrainerSkill = () => {
        if (!selectedSkill) return;
        const skillData = GAME_DATA.skills[selectedSkill];
        if (!skillData) return;

        const statKey = skillData.stat?.toLowerCase();
        const baseStat = trainer.stats?.[statKey] || 6;
        const modifier = baseStat - 10;

        const skills = trainer.skills || {};
        const skillRank = Array.isArray(skills)
            ? (skills.includes(selectedSkill) ? 1 : 0)
            : (skills[selectedSkill] || 0);
        const hasSkill = skillRank > 0;
        const skillBonus = skillRank > 0 ? (skillRank * 2) + (skillRank * modifier) : 0;

        const rolls = rollDice(2, 6);
        const rollTotal = rolls.reduce((sum, r) => sum + r, 0);
        const total = rollTotal + modifier + skillBonus;

        const trainerMaxHP = calculateMaxHP();
        const trainerCurrentHP = Math.max(0, trainerMaxHP - (trainer.currentDamage || 0));
        addToHistory({ type: 'trainer_skill', skill: selectedSkill, skillStat: skillData.stat, dice: '2d6', rolls, baseStat, modifier, hasSkill, bonus: skillBonus, total, trainerCurrentHP, trainerMaxHP, timestamp: Date.now() });
    };

    const rollCustomDice = () => {
        const diceData = parseDice(customDice);
        if (diceData.count === 0 || diceData.sides === 0) {
            toast.warning('Invalid dice format. Use format like "2d6+5" or "1d20"');
            return;
        }
        const rolls = rollDice(diceData.count, diceData.sides);
        const rollTotal = rolls.reduce((sum, r) => sum + r, 0);
        addToHistory({ type: 'custom', dice: customDice, rolls, rollTotal, bonus: diceData.bonus, total: rollTotal + diceData.bonus, timestamp: Date.now() });
    };

    const rollHealItem = (itemName) => {
        const target = party.find(p => p.id === selectedPokemonId);
        if (!target) { toast.warning('Select a Pokémon first.'); return; }
        const invItem = inventory.find(i => i.name.toLowerCase() === itemName.toLowerCase());
        if (!invItem) return;
        const formula = parseHealFormula(invItem.effect || '');
        const maxHP = calculatePokemonHP(target);
        let amount = 0, rolls = [], bonus = 0, desc = '';
        if (formula.type === 'dice') {
            const d = parseDice(formula.formula);
            rolls = rollDice(d.count, d.sides);
            bonus = d.bonus;
            amount = rolls.reduce((a, b) => a + b, 0) + bonus;
            desc = formula.formula;
        } else if (formula.type === 'fraction') {
            amount = Math.floor(maxHP * formula.num / formula.denom);
            desc = `${formula.num}/${formula.denom} Max HP`;
        } else {
            toast.info(`Used ${itemName} (status effect only).`);
        }
        const hpBefore = maxHP - (target.currentDamage || 0);
        const hpAfter = Math.min(maxHP, hpBefore + amount);
        if (amount > 0) {
            updatePokemon(target.id, { currentDamage: Math.max(0, (target.currentDamage || 0) - amount) });
        }
        setInventory(prev => {
            const idx = prev.findIndex(i => i.name.toLowerCase() === itemName.toLowerCase());
            if (idx === -1) return prev;
            const qty = prev[idx].quantity || 1;
            if (qty <= 1) return prev.filter((_, i) => i !== idx);
            const next = [...prev];
            next[idx] = { ...next[idx], quantity: qty - 1 };
            return next;
        });
        addToHistory({ type: 'heal', pokemon: target.name || target.species, item: itemName, formula: desc, rolls, bonus, amount, hpBefore, hpAfter, hpMax: maxHP, pokemonSpriteUrl: getPokemonSprite(target), timestamp: Date.now() });
    };

    return (
        <div>
            <h2 className="section-title">Dice Roller</h2>
            <p className="section-description">
                Roll attacks, skills, and custom dice. Results can be sent to Discord via webhook.
            </p>

            {/* Mode Selector */}
            <div className="tabs" style={{ marginBottom: '15px' }}>
                <button className={`tab ${mode === 'pokemon'  ? 'active' : ''}`} onClick={() => setMode('pokemon')}>Pokemon Attack</button>
                <button className={`tab ${mode === 'trainer'  ? 'active' : ''}`} onClick={() => setMode('trainer')}>Trainer Skill</button>
                <button className={`tab ${mode === 'custom'   ? 'active' : ''}`} onClick={() => setMode('custom')}>Custom Dice</button>
                <button className={`tab ${mode === 'heal'     ? 'active' : ''}`} onClick={() => setMode('heal')}>🩹 Heal</button>
            </div>

            <div className="grid-responsive-2">
                {/* Left: Roll Controls */}
                <div className="section-card-purple">
                    <h3 className="section-title-purple">
                        <span>{mode === 'heal' ? '🩹' : '🎲'}</span>{' '}
                        {mode === 'pokemon' ? 'Pokemon Attack' : mode === 'trainer' ? 'Trainer Skill' : mode === 'heal' ? 'Use Healing Item' : 'Custom Roll'}
                    </h3>

                    {mode === 'pokemon' && (
                        <div>
                            {/* Pokemon Selector */}
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>Select Pokemon</label>
                                <select
                                    value={selectedPokemonId || ''}
                                    onChange={(e) => {
                                        setSelectedPokemonId(parseInt(e.target.value) || null);
                                        setSelectedMove(null);
                                        resetCombatStages();
                                    }}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-medium)' }}
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

                            {/* Pokemon Sprite */}
                            {selectedPokemon && (() => {
                                const img = megaEvolved && currentMegaForm
                                    ? getMegaSprite(selectedPokemon, currentMegaForm)
                                    : getPokemonDisplayImage(selectedPokemon);
                                if (!img) return null;
                                return (
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                                        <img
                                            src={img}
                                            alt={selectedPokemon.name || selectedPokemon.species}
                                            style={{ width: '96px', height: '96px', objectFit: 'contain', imageRendering: !selectedPokemon.avatar ? 'pixelated' : 'auto' }}
                                        />
                                    </div>
                                );
                            })()}

                            {/* Held Item */}
                            {selectedPokemon?.heldItem && (() => {
                                const itemData = GAME_DATA?.items?.[selectedPokemon.heldItem];
                                return (
                                    <div
                                        onClick={() => { if (showDetail && itemData) showDetail('item', selectedPokemon.heldItem, itemData); }}
                                        style={{ marginBottom: '12px', padding: '8px 10px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '8px', cursor: showDetail && itemData ? 'pointer' : 'default' }}
                                        title={itemData ? 'Click to view item details' : selectedPokemon.heldItem}
                                    >
                                        <span style={{ fontSize: '16px' }}>🎒</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Held Item</div>
                                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{selectedPokemon.heldItem}</div>
                                            {itemData?.effect && (
                                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{itemData.effect}</div>
                                            )}
                                        </div>
                                        {showDetail && itemData && (
                                            <span style={{ fontSize: '11px', color: '#667eea', flexShrink: 0 }}>Details →</span>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Pokemon HP Tracker */}
                            {selectedPokemon && (() => {
                                const hp = getPokemonHP(selectedPokemon);
                                return (
                                    <HPTracker
                                        label="HP"
                                        currentHP={hp.current}
                                        maxHP={hp.max}
                                        onDamage={(val) => updatePokemon(selectedPokemon.id, { currentDamage: Math.min(hp.max, (selectedPokemon.currentDamage || 0) + val) })}
                                        onHeal={(val) => updatePokemon(selectedPokemon.id, { currentDamage: Math.max(0, (selectedPokemon.currentDamage || 0) - val) })}
                                        onFull={() => updatePokemon(selectedPokemon.id, { currentDamage: 0 })}
                                    />
                                );
                            })()}

                            <TypeMatchupDisplay selectedPokemon={selectedPokemon} megaEvolved={megaEvolved} currentMegaForm={currentMegaForm} />

                            <StatusConditionUI selectedPokemon={selectedPokemon} updatePokemon={updatePokemon} />

                            <MegaEvolutionPanel
                                selectedPokemon={selectedPokemon}
                                megaForms={megaForms}
                                megaEvolved={megaEvolved}
                                currentMegaForm={currentMegaForm}
                                onMegaEvolve={handleMegaEvolve}
                                onMegaRevert={handleMegaRevert}
                            />

                            <CombatStagesPanel
                                selectedPokemon={selectedPokemon}
                                combatStages={combatStages}
                                getStatsWithMega={getStatsWithMega}
                                updateCombatStage={updateCombatStage}
                                resetCombatStages={resetCombatStages}
                            />

                            {/* STAB Toggle & AC Override */}
                            {selectedPokemon && (
                                <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    <label
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                        title="Same Type Attack Bonus - extra damage when using moves that match the Pokémon's type. Scales with level."
                                    >
                                        <input type="checkbox" checked={applyStab} onChange={(e) => setApplyStab(e.target.checked)} />
                                        <span style={{ fontSize: '12px' }}>Apply STAB</span>
                                    </label>
                                    <span
                                        style={{ fontSize: '11px', color: 'var(--text-secondary)' }}
                                        title="Same Type Attack Bonus (STAB): +2 at Lv.1-10, +4 at Lv.11-20, +6 at Lv.21-40, +8 at Lv.41-60, +10 at Lv.61+"
                                    >
                                        (+{calculateSTAB(selectedPokemon.level || 1)} for matching type)
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }} title="Override the move's default Accuracy Class. Higher AC = harder to hit.">
                                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#667eea' }}>AC Override:</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={acOverride}
                                            onChange={(e) => setAcOverride(e.target.value)}
                                            placeholder={selectedMove ? String(parseACFromFrequency(selectedMove.frequency || selectedMove.freq)) : '-'}
                                            style={{ width: '50px', padding: '4px 8px', borderRadius: '4px', border: acOverride !== '' ? '2px solid #667eea' : '1px solid var(--border-medium)', fontSize: '12px', textAlign: 'center', background: acOverride !== '' ? 'var(--input-bg-hover)' : 'var(--input-bg)' }}
                                        />
                                        {acOverride !== '' && (
                                            <button onClick={() => setAcOverride('')} style={{ padding: '4px 8px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }} title="Clear AC override" aria-label="Clear AC override">✕</button>
                                        )}
                                    </div>
                                </div>
                            )}

                            <MoveSelector
                                selectedPokemon={selectedPokemon}
                                selectedMove={selectedMove}
                                onSelectMove={setSelectedMove}
                                showDetail={showDetail}
                                gameData={GAME_DATA}
                            />

                            {/* Roll Button */}
                            <button
                                onClick={rollPokemonMove}
                                disabled={!selectedPokemon || !selectedMove}
                                style={{ width: '100%', padding: '15px', background: selectedPokemon && selectedMove ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#ccc', color: 'white', border: 'none', borderRadius: '8px', cursor: selectedPokemon && selectedMove ? 'pointer' : 'not-allowed', fontSize: '16px', fontWeight: 'bold' }}
                            >
                                Roll Attack!
                            </button>
                        </div>
                    )}

                    {mode === 'trainer' && (
                        <div>
                            {/* Trainer Stats Display */}
                            <div className="trainer-stats-display" style={{ marginBottom: '12px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>
                                    {trainer.name || 'Trainer'} - Level {trainer.level || 1}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                                    {[
                                        { key: 'hp',   label: 'HP',   color: '#e53935' },
                                        { key: 'atk',  label: 'ATK',  color: '#ff5722' },
                                        { key: 'def',  label: 'DEF',  color: '#2196f3' },
                                        { key: 'satk', label: 'SATK', color: '#9c27b0' },
                                        { key: 'sdef', label: 'SDEF', color: '#ff9800' },
                                        { key: 'spd',  label: 'SPD',  color: '#00bcd4' },
                                    ].map(stat => {
                                        const value = trainer.stats?.[stat.key] || 10;
                                        const mod = value >= 10 ? Math.floor((value - 10) / 2) : -(10 - value);
                                        return (
                                            <div key={stat.key} className="trainer-stat-mini-box" style={{ textAlign: 'center', padding: '4px', borderRadius: '4px' }}>
                                                <div style={{ fontSize: '10px', fontWeight: 'bold', color: stat.color }}>{stat.label}</div>
                                                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{value}</div>
                                                <div style={{ fontSize: '10px', color: mod >= 0 ? '#4caf50' : '#f44336' }}>{mod >= 0 ? '+' : ''}{mod}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {trainer.skills && (Array.isArray(trainer.skills) ? trainer.skills.length > 0 : Object.keys(trainer.skills).length > 0) && (
                                    <div style={{ marginTop: '8px', fontSize: '11px' }}>
                                        <strong>Trained Skills:</strong>{' '}
                                        {Array.isArray(trainer.skills)
                                            ? trainer.skills.join(', ')
                                            : Object.entries(trainer.skills).filter(([, rank]) => rank > 0).map(([name, rank]) => rank === 2 ? `${name} ★★` : name).join(', ')}
                                    </div>
                                )}
                            </div>

                            {/* Trainer HP Tracker */}
                            {(() => {
                                const maxHP = calculateMaxHP();
                                const currentHP = Math.max(0, maxHP - (trainer.currentDamage || 0));
                                return (
                                    <HPTracker
                                        label="Trainer HP"
                                        currentHP={currentHP}
                                        maxHP={maxHP}
                                        onDamage={(val) => setTrainer(prev => ({ ...prev, currentDamage: Math.min(maxHP, (prev.currentDamage || 0) + val) }))}
                                        onHeal={(val) => setTrainer(prev => ({ ...prev, currentDamage: Math.max(0, (prev.currentDamage || 0) - val) }))}
                                        onFull={() => setTrainer(prev => ({ ...prev, currentDamage: 0 }))}
                                    />
                                );
                            })()}

                            {/* Skill Selector */}
                            <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>Select Skill</label>
                            <select
                                value={selectedSkill}
                                onChange={(e) => setSelectedSkill(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-medium)', marginBottom: '8px' }}
                            >
                                <option value="">Choose a skill...</option>
                                {Object.entries(GAME_DATA.skills || {}).map(([name, data]) => {
                                    const skills = trainer.skills || {};
                                    const rank = Array.isArray(skills) ? (skills.includes(name) ? 1 : 0) : (skills[name] || 0);
                                    return (
                                        <option key={name} value={name}>
                                            {name} ({data.stat}) {rank > 0 ? (rank === 2 ? '✓✓ Rank 2' : '✓ Trained') : ''}
                                        </option>
                                    );
                                })}
                            </select>

                            {/* Selected Skill Info */}
                            {selectedSkill && GAME_DATA.skills?.[selectedSkill] && (() => {
                                const skillData = GAME_DATA.skills[selectedSkill];
                                const statKey = skillData.stat?.toLowerCase();
                                const baseStat = trainer.stats?.[statKey] || 10;
                                const modifier = baseStat >= 10 ? Math.floor((baseStat - 10) / 2) : -(10 - baseStat);
                                const skills = trainer.skills || {};
                                const skillRank = Array.isArray(skills) ? (skills.includes(selectedSkill) ? 1 : 0) : (skills[selectedSkill] || 0);
                                const hasTrained = skillRank > 0;
                                const trainedBonus = skillRank > 0 ? (skillRank * 2) + (skillRank * modifier) : 0;
                                return (
                                    <div className="skill-info-box" style={{ marginBottom: '12px', padding: '10px', borderRadius: '6px', fontSize: '12px' }}>
                                        <div><strong>{selectedSkill}</strong> ({skillData.stat})</div>
                                        <div style={{ marginTop: '4px' }} title="Roll 2d6 + stat modifier. Trained skills add a bonus: Rank 1 = +2 + modifier, Rank 2 = +4 + (2× modifier)">
                                            Roll: 2d6 {modifier >= 0 ? '+' : ''}{modifier} (stat)
                                            {hasTrained && <span style={{ color: '#4caf50' }} title={`Rank ${skillRank} trained skill bonus`}> +{trainedBonus} (rank {skillRank})</span>}
                                        </div>
                                        <div className="text-muted" style={{ marginTop: '2px' }}>{skillData.description}</div>
                                    </div>
                                );
                            })()}

                            <button
                                onClick={rollTrainerSkill}
                                disabled={!selectedSkill}
                                style={{ width: '100%', padding: '15px', background: selectedSkill ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#ccc', color: 'white', border: 'none', borderRadius: '8px', cursor: selectedSkill ? 'pointer' : 'not-allowed', fontSize: '16px', fontWeight: 'bold' }}
                            >
                                Roll Skill Check!
                            </button>
                        </div>
                    )}

                    {mode === 'custom' && (
                        <CustomDicePanel customDice={customDice} setCustomDice={setCustomDice} onRoll={rollCustomDice} />
                    )}

                    {mode === 'heal' && (
                        <HealModePanel
                            selectedPokemonId={selectedPokemonId}
                            setSelectedPokemonId={setSelectedPokemonId}
                            party={party}
                            healingInventory={healingInventory}
                            onUseItem={rollHealItem}
                        />
                    )}

                    <DiscordWebhookConfig />
                </div>

                {/* Right: Roll History */}
                <RollHistory rollHistory={rollHistory} setRollHistory={setRollHistory} />
            </div>
        </div>
    );
};

export default BattleTab;
