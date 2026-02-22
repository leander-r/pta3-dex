// ============================================================
// Battle Tab Component (Dice Roller)
// ============================================================

import React, { useState, useMemo, useEffect } from 'react';
import { getTypeColor } from '../../utils/typeUtils.js';
import { getCombinedTypeEffectiveness } from '../../data/typeChart.js';
import { calculateSTAB, getActualStats, calculatePokemonHP, parseDice, applyCombatStage } from '../../utils/dataUtils.js';
import toast from '../../utils/toast.js';
import { useGameData, useUI, useTrainerContext, usePokemonContext, useData } from '../../contexts/index.js';
import { MAX_ROLL_HISTORY } from '../../data/constants.js';

// Parse the AC number from a move frequency string, e.g. "EOT – 2" → 2
const parseACFromFrequency = (freq) => {
    if (!freq) return 2;
    const match = freq.match(/[-–]\s*(\d+)/);
    return match ? parseInt(match[1]) : 2;
};

// Build a normalized roll-history entry for a Pokemon attack
const buildPokemonRollEntry = ({
    pokemon, move, moveType, category,
    accRoll, accModifier, modifiedAccRoll, moveAC, acWasOverridden,
    isHit, isCrit, isStatus,
    dice, rolls, diceTotal, statBonus, stabBonus, total
}) => ({
    type: 'pokemon',
    pokemon,
    move,
    moveType,
    category,
    accRoll,
    accModifier,
    modifiedAccRoll,
    moveAC,
    acWasOverridden,
    isHit,
    isCrit,
    isStatus: isStatus || false,
    dice: dice || null,
    rolls: rolls || [],
    diceTotal: diceTotal || 0,
    statBonus: statBonus || 0,
    stabBonus: stabBonus || 0,
    total: total || 0,
    timestamp: Date.now()
});

const BattleTab = () => {
    // Get state from contexts
    const { GAME_DATA, pokedex } = useGameData();
    const { showDetail, showConfirm } = useUI();
    const { trainer, setTrainer, party, calculateMaxHP } = useTrainerContext();
    const { updatePokemon } = usePokemonContext();
    const { discordWebhook, setDiscordWebhook, sendToDiscord } = useData();
    const [mode, setMode] = useState('pokemon');
    const [selectedMove, setSelectedMove] = useState(null);
    const [selectedSkill, setSelectedSkill] = useState('');
    const [customDice, setCustomDice] = useState('');
    const [rollHistory, setRollHistory] = useState(() => {
        try { return JSON.parse(sessionStorage.getItem('pta-roll-history') || '[]'); } catch (e) { console.warn('Roll history corrupted, resetting:', e); return []; }
    });
    const [combatStages, setCombatStages] = useState({
        atk: 0, satk: 0, def: 0, sdef: 0, spd: 0, acc: 0, eva: 0
    });
    const [discordExpanded, setDiscordExpanded] = useState(false);
    const [applyStab, setApplyStab] = useState(true);
    const [showCombatStages, setShowCombatStages] = useState(false);
    const [selectedPokemonId, setSelectedPokemonId] = useState(null);
    const [acOverride, setAcOverride] = useState('');

    // Mega Evolution state
    const [megaEvolved, setMegaEvolved] = useState(false);
    const [currentMegaForm, setCurrentMegaForm] = useState(null);
    const [showMegaModal, setShowMegaModal] = useState(false);

    // Export log dropdown state
    const [showExportOptions, setShowExportOptions] = useState(false);
    const exportDropdownRef = React.useRef(null);

    // Format roll history as readable text
    const formatRollLog = () => {
        const date = new Date().toLocaleDateString();
        const lines = [`=== PTA Battle Log - ${date} ===`, ''];
        for (const roll of rollHistory) {
            const t = roll.timestamp ? new Date(roll.timestamp) : new Date();
            const hhmm = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
            if (roll.type === 'pokemon') {
                lines.push(`[${hhmm}] ${roll.pokemon || 'Pokémon'} used ${roll.move || 'Move'} (${roll.moveType || 'Normal'})`);
                if (!roll.isStatus) {
                    const hit = roll.isHit ? 'HIT' : 'MISS';
                    const crit = roll.isCrit ? ' (CRIT!)' : '';
                    lines.push(`  Accuracy: ${roll.modifiedAccRoll ?? roll.accRoll ?? '?'} vs AC ${roll.moveAC ?? '?'} → ${hit}${crit}`);
                    if (roll.isHit && roll.dice) {
                        lines.push(`  Damage: ${roll.dice} [${(roll.rolls || []).join(', ')}] = ${roll.diceTotal ?? 0} + stat ${roll.statBonus ?? 0} + STAB ${roll.stabBonus ?? 0} = ${roll.total ?? 0}`);
                    }
                } else {
                    lines.push(`  Status move — ${roll.isHit ? 'HIT' : 'MISS'}`);
                }
            } else if (roll.type === 'trainer') {
                lines.push(`[${hhmm}] Trainer rolled ${roll.skill || 'Skill'} → ${roll.total ?? '?'} ([${(roll.rolls || []).join(', ')}])`);
            } else if (roll.type === 'custom') {
                lines.push(`[${hhmm}] Custom ${roll.dice || '?'} → [${(roll.rolls || []).join(', ')}] = ${roll.total ?? '?'}`);
            }
            lines.push('');
        }
        return lines.join('\n');
    };

    const handleCopyLog = async () => {
        const text = formatRollLog();
        try {
            await navigator.clipboard.writeText(text);
            toast.success('Battle log copied to clipboard!');
        } catch {
            toast.error('Could not copy to clipboard.');
        }
        setShowExportOptions(false);
    };

    const handleDownloadLog = () => {
        const text = formatRollLog();
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pta-battle-log-${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        setShowExportOptions(false);
    };

    // Close export dropdown on outside click
    React.useEffect(() => {
        const handler = (e) => {
            if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
                setShowExportOptions(false);
            }
        };
        if (showExportOptions) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showExportOptions]);

    // Get selected pokemon from party (synced with actual data)
    const selectedPokemon = useMemo(() => {
        return party.find(p => p.id === selectedPokemonId) || null;
    }, [party, selectedPokemonId]);

    // Get mega forms for selected Pokemon from pokedex
    const megaForms = useMemo(() => {
        if (!selectedPokemon || !pokedex) return [];
        const speciesData = pokedex.find(p => p.species === selectedPokemon.species);
        return speciesData?.megaForms || [];
    }, [selectedPokemon, pokedex]);

    // Persist roll history to sessionStorage
    useEffect(() => {
        try { sessionStorage.setItem('pta-roll-history', JSON.stringify(rollHistory)); } catch {}
    }, [rollHistory]);

    // Reset battle state when switching Pokemon
    useEffect(() => {
        setMegaEvolved(false);
        setCurrentMegaForm(null);
        setAcOverride('');
    }, [selectedPokemonId]);

    // Handle Escape key for mega modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && showMegaModal) {
                setShowMegaModal(false);
            }
        };
        if (showMegaModal) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [showMegaModal]);

    // Apply mega stat boosts to actual stats
    const getStatsWithMega = (pokemon) => {
        const baseStats = getActualStats(pokemon);
        if (!megaEvolved || !currentMegaForm || !currentMegaForm.statBoosts) {
            return baseStats;
        }
        return {
            hp: baseStats.hp + (currentMegaForm.statBoosts.hp || 0),
            atk: baseStats.atk + (currentMegaForm.statBoosts.atk || 0),
            def: baseStats.def + (currentMegaForm.statBoosts.def || 0),
            satk: baseStats.satk + (currentMegaForm.statBoosts.satk || 0),
            sdef: baseStats.sdef + (currentMegaForm.statBoosts.sdef || 0),
            spd: baseStats.spd + (currentMegaForm.statBoosts.spd || 0)
        };
    };

    // Handle mega evolution
    const handleMegaEvolve = (megaForm) => {
        setCurrentMegaForm(megaForm);
        setMegaEvolved(true);
        setShowMegaModal(false);
    };

    // Revert mega evolution
    const handleMegaRevert = () => {
        setMegaEvolved(false);
        setCurrentMegaForm(null);
    };

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
        setRollHistory(prev => [roll, ...prev].slice(0, MAX_ROLL_HISTORY));
        if (sendToDiscord) sendToDiscord(roll, trainer.name);
    };

    // Roll Pokemon Move
    const rollPokemonMove = () => {
        if (!selectedPokemon || !selectedMove) return;

        // 1. Gather stats (with mega boost) and apply attack-stat combat stages
        const actualStats = getStatsWithMega(selectedPokemon);
        const isPhysical = selectedMove.category === 'Physical';
        const statKey = isPhysical ? 'atk' : 'satk';
        const statMod = applyCombatStage(actualStats[statKey] || 0, combatStages[statKey] || 0);

        // 2. Determine AC and roll accuracy
        const defaultAC = parseACFromFrequency(selectedMove.frequency || selectedMove.freq);
        const moveAC = acOverride !== '' ? parseInt(acOverride) || defaultAC : defaultAC;
        const accModifier = combatStages.acc || 0;
        const accRoll = Math.floor(Math.random() * 20) + 1;
        const modifiedAccRoll = accRoll + accModifier;
        const isCrit = accRoll === 20;
        const isHit = accRoll === 20 || modifiedAccRoll >= moveAC;
        const acWasOverridden = acOverride !== '';

        const commonFields = {
            pokemon: selectedPokemon.name || selectedPokemon.species,
            move: selectedMove.name,
            moveType: selectedMove.type,
            category: selectedMove.category,
            accRoll, accModifier, modifiedAccRoll, moveAC, acWasOverridden, isHit, isCrit
        };

        // 3. Status moves have no damage dice
        const diceData = parseDice(selectedMove.damage);
        if (diceData.count === 0) {
            addToHistory(buildPokemonRollEntry({ ...commonFields, isStatus: true }));
            return;
        }

        // 4. Roll damage (only when hit)
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

    // Roll Trainer Skill
    const rollTrainerSkill = () => {
        if (!selectedSkill) return;

        const skillData = GAME_DATA.skills[selectedSkill];
        if (!skillData) return;

        const statKey = skillData.stat?.toLowerCase();
        const baseStat = trainer.stats?.[statKey] || 6;
        const modifier = baseStat - 10;

        // Check skill rank (handles both object and legacy array format)
        const skills = trainer.skills || {};
        const skillRank = Array.isArray(skills)
            ? (skills.includes(selectedSkill) ? 1 : 0)
            : (skills[selectedSkill] || 0);
        const hasSkill = skillRank > 0;
        // Rank 1: +2 + modifier, Rank 2: +4 + (2×modifier)
        const skillBonus = skillRank > 0 ? (skillRank * 2) + (skillRank * modifier) : 0;

        const rolls = rollDice(2, 6);
        const rollTotal = rolls.reduce((sum, r) => sum + r, 0);
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
            toast.warning('Invalid dice format. Use format like "2d6+5" or "1d20"');
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
            <p className="section-description">
                Roll attacks, skills, and custom dice. Results can be sent to Discord via webhook.
            </p>

            {/* Mode Selector */}
            <div className="tabs" style={{ marginBottom: '15px' }}>
                <button className={`tab ${mode === 'pokemon' ? 'active' : ''}`} onClick={() => setMode('pokemon')}>
                    Pokemon Attack
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

                            {/* Pokemon HP Display & Tracking */}
                            {selectedPokemon && (() => {
                                const hp = getPokemonHP(selectedPokemon);
                                const hpPercent = (hp.current / hp.max) * 100;
                                return (
                                    <div className="hp-tracker-box" style={{ marginBottom: '12px', padding: '10px', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>HP</span>
                                            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{hp.current} / {hp.max}</span>
                                        </div>
                                        <div style={{ background: 'var(--collapsed-hp-track)', borderRadius: '4px', height: '12px', overflow: 'hidden', marginBottom: '8px' }}>
                                            <div style={{
                                                width: `${hpPercent}%`,
                                                height: '100%',
                                                background: hpPercent > 50 ? '#4caf50' : hpPercent > 25 ? '#ff9800' : '#f44336',
                                                transition: 'width 0.3s ease'
                                            }} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                            <span className="text-muted" style={{ fontSize: '10px', width: '100%', textAlign: 'center', marginBottom: '4px' }}>
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
                                        {/* Custom HP adjust */}
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '6px', justifyContent: 'center' }}>
                                            <input
                                                type="number"
                                                min="1"
                                                placeholder="Custom"
                                                id="customHpInput"
                                                style={{
                                                    width: '70px',
                                                    padding: '4px 6px',
                                                    borderRadius: '4px',
                                                    border: '1px solid var(--border-medium)',
                                                    fontSize: '11px',
                                                    textAlign: 'center'
                                                }}
                                            />
                                            <button
                                                onClick={() => {
                                                    const input = document.getElementById('customHpInput');
                                                    const val = parseInt(input?.value);
                                                    if (val > 0) {
                                                        updatePokemon && updatePokemon(selectedPokemon.id, {
                                                            currentDamage: Math.min(hp.max, (selectedPokemon.currentDamage || 0) + val)
                                                        });
                                                        input.value = '';
                                                    }
                                                }}
                                                style={{ padding: '4px 8px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                                            >
                                                Damage
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const input = document.getElementById('customHpInput');
                                                    const val = parseInt(input?.value);
                                                    if (val > 0) {
                                                        updatePokemon && updatePokemon(selectedPokemon.id, {
                                                            currentDamage: Math.max(0, (selectedPokemon.currentDamage || 0) - val)
                                                        });
                                                        input.value = '';
                                                    }
                                                }}
                                                style={{ padding: '4px 8px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                                            >
                                                Heal
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Type Matchup */}
                            {selectedPokemon && (selectedPokemon.types || []).length > 0 && (() => {
                                // Use mega-form types when evolved, otherwise the base Pokémon types
                                const activeTypes = megaEvolved && currentMegaForm?.types?.length > 0
                                    ? currentMegaForm.types
                                    : (selectedPokemon.types || []);
                                const eff = getCombinedTypeEffectiveness(activeTypes);

                                const TypeChip = ({ type, label }) => (
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        padding: '2px 7px',
                                        borderRadius: '10px',
                                        background: getTypeColor(type),
                                        color: 'white',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {type}{label && <span style={{ opacity: 0.85 }}>{label}</span>}
                                    </span>
                                );

                                const Row = ({ heading, headingColor, items, label }) => items.length === 0 ? null : (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '5px' }}>
                                        <span style={{
                                            fontSize: '10px',
                                            fontWeight: 'bold',
                                            color: headingColor,
                                            whiteSpace: 'nowrap',
                                            minWidth: '60px',
                                            paddingTop: '3px'
                                        }}>{heading}</span>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {items.map(t => <TypeChip key={t} type={t} label={label} />)}
                                        </div>
                                    </div>
                                );

                                return (
                                    <div style={{ marginBottom: '12px', padding: '10px', borderRadius: '8px', background: 'var(--bg-secondary, #f5f5f5)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                                                Type Matchup{megaEvolved && currentMegaForm?.types?.length > 0 && (
                                                    <span style={{ fontWeight: 'normal', marginLeft: '4px', color: 'var(--text-muted)' }}>(Mega)</span>
                                                )}
                                            </span>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                {activeTypes.map(t => (
                                                    <TypeChip key={t} type={t} />
                                                ))}
                                            </div>
                                        </div>
                                        <Row heading="Weak ×4"  headingColor="#c62828" items={eff.superWeak} label=" ×4" />
                                        <Row heading="Weak ×2"  headingColor="#f44336" items={eff.weak} />
                                        <Row heading="Resists"  headingColor="#388e3c" items={eff.resist} />
                                        <Row heading="Resists ×¼" headingColor="#1b5e20" items={eff.superResist} label=" ×¼" />
                                        <Row heading="Immune"   headingColor="#555"    items={eff.immune} label=" ×0" />
                                    </div>
                                );
                            })()}

                            {/* Status Conditions */}
                            {selectedPokemon && (
                                <div style={{ marginBottom: '12px', padding: '8px 10px', borderRadius: '8px', background: 'var(--bg-secondary, #f5f5f5)' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                                        Status Conditions
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {[
                                            { key: 'burned', label: 'Burned', icon: '🔥', color: '#f44336' },
                                            { key: 'frozen', label: 'Frozen', icon: '🧊', color: '#42a5f5' },
                                            { key: 'paralyzed', label: 'Paralyzed', icon: '⚡', color: '#ffc107' },
                                            { key: 'poisoned', label: 'Poisoned', icon: '☠️', color: '#9c27b0' },
                                            { key: 'asleep', label: 'Asleep', icon: '💤', color: '#607d8b' },
                                            { key: 'confused', label: 'Confused', icon: '💫', color: '#ff9800' },
                                            { key: 'flinched', label: 'Flinched', icon: '😵', color: '#795548' },
                                            { key: 'fainted', label: 'Fainted', icon: '✖', color: '#333' }
                                        ].map(cond => {
                                            const conditions = selectedPokemon.statusConditions || {};
                                            const isActive = conditions[cond.key];
                                            return (
                                                <button
                                                    key={cond.key}
                                                    onClick={() => updatePokemon && updatePokemon(selectedPokemon.id, {
                                                        statusConditions: {
                                                            ...conditions,
                                                            [cond.key]: !isActive
                                                        }
                                                    })}
                                                    style={{
                                                        padding: '3px 8px',
                                                        borderRadius: '12px',
                                                        border: isActive ? `2px solid ${cond.color}` : '1px solid var(--border-medium, #ccc)',
                                                        background: isActive ? cond.color : 'transparent',
                                                        color: isActive ? 'white' : 'var(--text-secondary)',
                                                        cursor: 'pointer',
                                                        fontSize: '10px',
                                                        fontWeight: isActive ? 'bold' : 'normal',
                                                        transition: 'all 0.15s ease'
                                                    }}
                                                    title={`Toggle ${cond.label}`}
                                                >
                                                    {cond.icon} {cond.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Mega Evolution */}
                            {selectedPokemon && megaForms.length > 0 && (
                                <div style={{ marginBottom: '12px', padding: '10px', borderRadius: '8px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'white' }}>
                                                Mega Evolution
                                            </span>
                                            {megaEvolved && currentMegaForm && (
                                                <span style={{
                                                    marginLeft: '8px',
                                                    fontSize: '11px',
                                                    background: 'rgba(255,255,255,0.2)',
                                                    padding: '2px 8px',
                                                    borderRadius: '10px',
                                                    color: 'white'
                                                }}>
                                                    {currentMegaForm.name} Active
                                                </span>
                                            )}
                                        </div>
                                        {!megaEvolved ? (
                                            <button
                                                onClick={() => megaForms.length === 1 ? handleMegaEvolve(megaForms[0]) : setShowMegaModal(true)}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: 'white',
                                                    color: '#667eea',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                    fontSize: '11px'
                                                }}
                                            >
                                                Mega Evolve
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleMegaRevert}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: 'rgba(255,255,255,0.2)',
                                                    color: 'white',
                                                    border: '1px solid rgba(255,255,255,0.3)',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                    fontSize: '11px'
                                                }}
                                            >
                                                Revert
                                            </button>
                                        )}
                                    </div>
                                    {megaEvolved && currentMegaForm && (
                                        <div style={{ marginTop: '8px', fontSize: '10px', color: 'rgba(255,255,255,0.9)' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {currentMegaForm.types && (
                                                    <span>Type: {currentMegaForm.types.join('/')}</span>
                                                )}
                                                {currentMegaForm.ability && (
                                                    <span>• Ability: {currentMegaForm.ability}</span>
                                                )}
                                            </div>
                                            <div style={{ marginTop: '4px' }}>
                                                Stat Boosts: {Object.entries(currentMegaForm.statBoosts || {})
                                                    .filter(([, v]) => v > 0)
                                                    .map(([k, v]) => `+${v} ${k.toUpperCase()}`)
                                                    .join(', ') || 'None'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Mega Form Selection Modal */}
                            {showMegaModal && megaForms.length > 1 && (
                                <div
                                    style={{
                                        position: 'fixed',
                                        top: 0, left: 0, right: 0, bottom: 0,
                                        background: 'rgba(0,0,0,0.5)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 1000
                                    }}
                                    onClick={() => setShowMegaModal(false)}
                                    role="presentation"
                                >
                                    <div
                                        style={{
                                            background: 'var(--card-bg)',
                                            borderRadius: '12px',
                                            padding: '20px',
                                            maxWidth: '400px',
                                            width: '90%'
                                        }}
                                        onClick={e => e.stopPropagation()}
                                        role="dialog"
                                        aria-modal="true"
                                        aria-labelledby="mega-form-modal-title"
                                    >
                                        <h3 id="mega-form-modal-title" style={{ margin: '0 0 16px 0', fontSize: '16px' }}>
                                            Choose Mega Form
                                        </h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {megaForms.map((form, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleMegaEvolve(form)}
                                                    style={{
                                                        padding: '12px',
                                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        textAlign: 'left'
                                                    }}
                                                >
                                                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                                        {form.name}
                                                    </div>
                                                    <div style={{ fontSize: '11px', opacity: 0.9 }}>
                                                        {form.types?.join('/') || 'Unknown Type'}
                                                        {form.ability && ` • ${form.ability}`}
                                                    </div>
                                                    <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '4px' }}>
                                                        {Object.entries(form.statBoosts || {})
                                                            .filter(([, v]) => v > 0)
                                                            .map(([k, v]) => `+${v} ${k.toUpperCase()}`)
                                                            .join(', ')}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setShowMegaModal(false)}
                                            style={{
                                                marginTop: '12px',
                                                width: '100%',
                                                padding: '10px',
                                                background: 'var(--bg-secondary)',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                color: 'var(--text-primary)'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Held Item */}
                            {selectedPokemon && selectedPokemon.heldItem && (() => {
                                const itemData = GAME_DATA?.items?.[selectedPokemon.heldItem];
                                return (
                                    <div
                                        onClick={() => { if (showDetail && itemData) showDetail('item', selectedPokemon.heldItem, itemData); }}
                                        style={{
                                            marginBottom: '12px',
                                            padding: '8px 10px',
                                            borderRadius: '8px',
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border-light)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            cursor: showDetail && itemData ? 'pointer' : 'default'
                                        }}
                                        title={itemData ? 'Click to view item details' : selectedPokemon.heldItem}
                                    >
                                        <span style={{ fontSize: '16px' }}>🎒</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Held Item</div>
                                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                                {selectedPokemon.heldItem}
                                            </div>
                                            {itemData?.effect && (
                                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                    {itemData.effect}
                                                </div>
                                            )}
                                        </div>
                                        {showDetail && itemData && (
                                            <span style={{ fontSize: '11px', color: '#667eea', flexShrink: 0 }}>Details →</span>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Combat Stages */}
                            {selectedPokemon && (
                                <div style={{ marginBottom: '12px' }}>
                                    <div
                                        onClick={() => setShowCombatStages(!showCombatStages)}
                                        className="combat-stages-header"
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '8px 10px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            marginBottom: showCombatStages ? '8px' : 0
                                        }}
                                    >
                                        <div>
                                            <span
                                            style={{ fontSize: '12px', fontWeight: 'bold' }}
                                            title="Combat Stages track stat buffs and debuffs from moves. Each positive stage increases the stat by 25%, each negative stage decreases it by 10%. Range: -6 to +6."
                                        >Combat Stages</span>
                                            <span className="text-muted" style={{ fontSize: '10px', marginLeft: '8px' }}>
                                                Buffs & debuffs from moves
                                            </span>
                                        </div>
                                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                            {showCombatStages ? '▲ Hide' : '▼ Show'}
                                        </span>
                                    </div>
                                    {showCombatStages && (() => {
                                        const actualStats = getStatsWithMega(selectedPokemon);
                                        const getModifiedStat = (baseStat, stages) => {
                                            if (stages > 0) return Math.floor(baseStat * (1 + stages * COMBAT_STAGE_POSITIVE_MULTIPLIER));
                                            if (stages < 0) return Math.ceil(baseStat * (1 - Math.abs(stages) * COMBAT_STAGE_NEGATIVE_MULTIPLIER));
                                            return baseStat;
                                        };
                                        return (
                                            <div className="combat-stages-content" style={{ padding: '10px', borderRadius: '6px' }}>
                                                <div className="text-muted" style={{ fontSize: '10px', marginBottom: '8px', textAlign: 'center' }}>
                                                    +1 stage = +25% stat | −1 stage = −10% stat | Range: −6 to +6
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                                    {[
                                                        { key: 'atk', label: 'ATK', color: '#f44336', desc: 'Attack - affects Physical move damage' },
                                                        { key: 'def', label: 'DEF', color: '#2196f3', desc: 'Defense - reduces Physical damage taken' },
                                                        { key: 'satk', label: 'SATK', color: '#9c27b0', desc: 'Special Attack - affects Special move damage' },
                                                        { key: 'sdef', label: 'SDEF', color: '#ff9800', desc: 'Special Defense - reduces Special damage taken' },
                                                        { key: 'spd', label: 'SPD', color: '#00bcd4', desc: 'Speed - determines turn order in battle' },
                                                        { key: 'acc', label: 'ACC', color: '#4caf50', desc: 'Accuracy - adds/subtracts from hit roll (1d20)' },
                                                        { key: 'eva', label: 'EVA', color: '#607d8b', desc: 'Evasion - subtracts from opponent hit rolls' }
                                                    ].map(stat => {
                                                        const baseStat = actualStats[stat.key] || 0;
                                                        const stages = combatStages[stat.key] || 0;
                                                        const isModOnly = stat.key === 'acc' || stat.key === 'eva';
                                                        const modifiedStat = isModOnly ? stages : getModifiedStat(baseStat, stages);
                                                        return (
                                                            <div key={stat.key} className="combat-stat-box" style={{ textAlign: 'center', padding: '6px', borderRadius: '4px' }} title={stat.desc}>
                                                                <div style={{ fontSize: '10px', fontWeight: 'bold', color: stat.color }}>{stat.label}</div>
                                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                                    {isModOnly ? '±' : baseStat} → <strong style={{ color: stages !== 0 ? (stages > 0 ? '#4caf50' : '#f44336') : 'var(--text-primary)' }}>
                                                                        {isModOnly ? (stages >= 0 ? '+' : '') + stages : modifiedStat}
                                                                    </strong>
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px' }}>
                                                                    <button
                                                                        onClick={() => updateCombatStage(stat.key, -1)}
                                                                        style={{ width: '24px', height: '24px', border: 'none', borderRadius: '4px', background: '#ffcdd2', cursor: 'pointer', fontSize: '14px' }}
                                                                        aria-label={`Decrease ${stat.label}`}
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
                                                                        aria-label={`Increase ${stat.label}`}
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

                            {/* STAB Toggle & AC Override */}
                            {selectedPokemon && (
                                <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    <label
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                        title="Same Type Attack Bonus - extra damage when using moves that match the Pokémon's type. Scales with level."
                                    >
                                        <input
                                            type="checkbox"
                                            checked={applyStab}
                                            onChange={(e) => setApplyStab(e.target.checked)}
                                        />
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
                                            placeholder={selectedMove ? (() => {
                                                const freq = selectedMove.frequency || selectedMove.freq;
                                                if (!freq) return '2';
                                                const match = freq.match(/[-–]\s*(\d+)/);
                                                return match ? match[1] : '2';
                                            })() : '-'}
                                            style={{
                                                width: '50px',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                border: acOverride !== '' ? '2px solid #667eea' : '1px solid var(--border-medium)',
                                                fontSize: '12px',
                                                textAlign: 'center',
                                                background: acOverride !== '' ? 'var(--input-bg-hover)' : 'var(--input-bg)'
                                            }}
                                        />
                                        {acOverride !== '' && (
                                            <button
                                                onClick={() => setAcOverride('')}
                                                style={{
                                                    padding: '4px 8px',
                                                    background: '#f44336',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '10px'
                                                }}
                                                title="Clear AC override"
                                                aria-label="Clear AC override"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
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
                                                    className={selectedMove?.name !== move.name ? 'move-select-btn' : ''}
                                                    style={{
                                                        flex: 1,
                                                        padding: '10px',
                                                        background: selectedMove?.name === move.name
                                                            ? getTypeColor(move.type)
                                                            : undefined,
                                                        color: selectedMove?.name === move.name ? 'white' : undefined,
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        textAlign: 'left'
                                                    }}
                                                >
                                                    <div style={{ fontWeight: 'bold' }}>{move.name}</div>
                                                    <div style={{ fontSize: '11px', opacity: 0.8 }}>
                                                        {move.type} | {move.category} | {move.damage || 'Status'} | <span title="Accuracy Class - Roll 1d20, need to meet or beat this number to hit. Natural 20 always hits and crits.">AC {(() => {
                                                            const freq = move.frequency || move.freq;
                                                            if (!freq) return 2;
                                                            const match = freq.match(/[-–]\s*(\d+)/);
                                                            return match ? match[1] : 2;
                                                        })()}</span>
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
                                                    aria-label={`View details for ${move.name}`}
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

                    {mode === 'trainer' && (
                        <div>
                            {/* Trainer Stats Display */}
                            <div className="trainer-stats-display" style={{ marginBottom: '12px' }}>
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
                                            <div key={stat.key} className="trainer-stat-mini-box" style={{ textAlign: 'center', padding: '4px', borderRadius: '4px' }}>
                                                <div style={{ fontSize: '10px', fontWeight: 'bold', color: stat.color }}>{stat.label}</div>
                                                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{value}</div>
                                                <div style={{ fontSize: '10px', color: mod >= 0 ? '#4caf50' : '#f44336' }}>
                                                    {mod >= 0 ? '+' : ''}{mod}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {trainer.skills && (Array.isArray(trainer.skills) ? trainer.skills.length > 0 : Object.keys(trainer.skills).length > 0) && (
                                    <div style={{ marginTop: '8px', fontSize: '11px' }}>
                                        <strong>Trained Skills:</strong> {
                                            Array.isArray(trainer.skills)
                                                ? trainer.skills.join(', ')
                                                : Object.entries(trainer.skills)
                                                    .filter(([_, rank]) => rank > 0)
                                                    .map(([name, rank]) => rank === 2 ? `${name} ★★` : name)
                                                    .join(', ')
                                        }
                                    </div>
                                )}
                            </div>

                            {/* Trainer HP Tracker */}
                            {(() => {
                                const maxHP = calculateMaxHP();
                                const currentHP = Math.max(0, maxHP - (trainer.currentDamage || 0));
                                const hpPercent = maxHP > 0 ? (currentHP / maxHP) * 100 : 0;
                                return (
                                    <div className="hp-tracker-box" style={{ marginBottom: '12px', padding: '10px', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Trainer HP</span>
                                            <span style={{ fontSize: '14px', fontWeight: 'bold', color: hpPercent > 50 ? '#4caf50' : hpPercent > 25 ? '#ff9800' : '#f44336' }}>
                                                {currentHP} / {maxHP}
                                            </span>
                                        </div>
                                        <div style={{ background: 'var(--collapsed-hp-track)', borderRadius: '4px', height: '12px', overflow: 'hidden', marginBottom: '8px' }}>
                                            <div style={{
                                                width: `${hpPercent}%`,
                                                height: '100%',
                                                background: hpPercent > 50 ? '#4caf50' : hpPercent > 25 ? '#ff9800' : '#f44336',
                                                transition: 'width 0.3s ease'
                                            }} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                            <span className="text-muted" style={{ fontSize: '10px', width: '100%', textAlign: 'center', marginBottom: '4px' }}>
                                                Damage ← → Heal
                                            </span>
                                            {[10, 5, 1].map(val => (
                                                <button
                                                    key={`tdmg-${val}`}
                                                    onClick={() => setTrainer(prev => ({
                                                        ...prev,
                                                        currentDamage: Math.min(maxHP, (prev.currentDamage || 0) + val)
                                                    }))}
                                                    style={{ padding: '4px 8px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                                                >
                                                    +{val}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => setTrainer(prev => ({ ...prev, currentDamage: 0 }))}
                                                style={{ padding: '4px 8px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                                            >
                                                Full
                                            </button>
                                            {[1, 5, 10].map(val => (
                                                <button
                                                    key={`theal-${val}`}
                                                    onClick={() => setTrainer(prev => ({
                                                        ...prev,
                                                        currentDamage: Math.max(0, (prev.currentDamage || 0) - val)
                                                    }))}
                                                    style={{ padding: '4px 8px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                                                >
                                                    -{val}
                                                </button>
                                            ))}
                                        </div>
                                        {/* Custom HP adjust */}
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '6px', justifyContent: 'center' }}>
                                            <input
                                                type="number"
                                                min="1"
                                                placeholder="Custom"
                                                id="trainerCustomHpInput"
                                                style={{
                                                    width: '70px',
                                                    padding: '4px 6px',
                                                    borderRadius: '4px',
                                                    border: '1px solid var(--border-medium)',
                                                    fontSize: '11px',
                                                    textAlign: 'center'
                                                }}
                                            />
                                            <button
                                                onClick={() => {
                                                    const input = document.getElementById('trainerCustomHpInput');
                                                    const val = parseInt(input?.value);
                                                    if (val > 0) {
                                                        setTrainer(prev => ({
                                                            ...prev,
                                                            currentDamage: Math.min(maxHP, (prev.currentDamage || 0) + val)
                                                        }));
                                                        input.value = '';
                                                    }
                                                }}
                                                style={{ padding: '4px 8px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                                            >
                                                Damage
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const input = document.getElementById('trainerCustomHpInput');
                                                    const val = parseInt(input?.value);
                                                    if (val > 0) {
                                                        setTrainer(prev => ({
                                                            ...prev,
                                                            currentDamage: Math.max(0, (prev.currentDamage || 0) - val)
                                                        }));
                                                        input.value = '';
                                                    }
                                                }}
                                                style={{ padding: '4px 8px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                                            >
                                                Heal
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}

                            <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                                Select Skill
                            </label>
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
                                // Check skill rank (handles both object and legacy array format)
                                const skills = trainer.skills || {};
                                const skillRank = Array.isArray(skills)
                                    ? (skills.includes(selectedSkill) ? 1 : 0)
                                    : (skills[selectedSkill] || 0);
                                const hasTrained = skillRank > 0;
                                // Rank 1: +2 + modifier, Rank 2: +4 + (2×modifier)
                                const trainedBonus = skillRank > 0 ? (skillRank * 2) + (skillRank * modifier) : 0;
                                return (
                                    <div className="skill-info-box" style={{ marginBottom: '12px', padding: '10px', borderRadius: '6px', fontSize: '12px' }}>
                                        <div><strong>{selectedSkill}</strong> ({skillData.stat})</div>
                                        <div style={{ marginTop: '4px' }} title="Roll 2d6 + stat modifier. Trained skills add a bonus: Rank 1 = +2 + modifier, Rank 2 = +4 + (2× modifier)">
                                            Roll: 2d6 {modifier >= 0 ? '+' : ''}{modifier} (stat)
                                            {hasTrained && <span style={{ color: '#4caf50' }} title={`Rank ${skillRank} trained skill bonus`}> +{trainedBonus} (rank {skillRank})</span>}
                                        </div>
                                        <div className="text-muted" style={{ marginTop: '2px' }}>
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
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-medium)', marginBottom: '12px' }}
                            />

                            {/* Quick Dice Buttons */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                                {['1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '2d6', '3d6'].map(dice => (
                                    <button
                                        key={dice}
                                        onClick={() => setCustomDice(dice)}
                                        className={`dice-quick-btn ${customDice === dice ? 'selected' : ''}`}
                                        style={{
                                            padding: '6px 12px',
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
                                    <div style={{
                                        marginTop: '8px',
                                        padding: '8px 10px',
                                        background: 'rgba(250, 166, 26, 0.15)',
                                        border: '1px solid rgba(250, 166, 26, 0.4)',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        color: '#FAA61A',
                                        lineHeight: '1.4'
                                    }}>
                                        ⚠️ Your webhook URL is stored in plain text in your browser's localStorage and is visible to anyone with access to your browser's Developer Tools. Do not use this on a shared or public computer.
                                    </div>
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
                                            toast.warning('Please enter a webhook URL first');
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
                                                toast.success('Test message sent! Check your Discord channel.');
                                            } else {
                                                toast.error('Failed to send. Check if the webhook URL is correct.');
                                            }
                                        })
                                        .catch(() => toast.error('Failed to send. Check the webhook URL.'));
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
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                {/* Export Log dropdown */}
                                <div ref={exportDropdownRef} style={{ position: 'relative' }}>
                                    <button
                                        onClick={() => setShowExportOptions(v => !v)}
                                        style={{ padding: '4px 8px', background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                                    >
                                        Export Log
                                    </button>
                                    {showExportOptions && (
                                        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-medium)', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', minWidth: '160px', zIndex: 100, overflow: 'hidden' }}>
                                            <button
                                                onClick={handleCopyLog}
                                                style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                className="pokemon-import-option"
                                            >
                                                📋 Copy as text
                                            </button>
                                            <button
                                                onClick={handleDownloadLog}
                                                style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                className="pokemon-import-option"
                                            >
                                                💾 Download .txt
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        if (rollHistory.length > 3) {
                                            showConfirm({
                                                title: 'Clear History',
                                                message: `Clear ${rollHistory.length} rolls from history?`,
                                                danger: true,
                                                confirmLabel: 'Clear',
                                                onConfirm: () => setRollHistory([])
                                            });
                                        } else {
                                            setRollHistory([]);
                                        }
                                    }}
                                    style={{ padding: '4px 8px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                                >
                                    Clear
                                </button>
                            </div>
                        )}
                    </h3>

                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {rollHistory.length === 0 ? (
                            <div className="empty-state" style={{ margin: '0' }}>
                                <span className="empty-state-icon">🎲</span>
                                <p className="empty-state-title">No rolls yet</p>
                                <p className="empty-state-description">
                                    Select a Pokémon and move, then click "Roll Attack!" to make your first roll.
                                </p>
                            </div>
                        ) : (
                            rollHistory.map((roll, idx) => (
                                <div
                                    key={idx}
                                    className={`roll-history-item ${roll.isCrit ? 'crit' : ''}`}
                                    style={{
                                        padding: '10px',
                                        marginBottom: '8px',
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
                                                {!roll.isHit && <span style={{ marginLeft: '8px', color: '#f44336', fontWeight: 'bold' }}>MISS!</span>}
                                            </div>
                                            {/* Accuracy Roll */}
                                            <div style={{
                                                fontSize: '12px',
                                                padding: '4px 8px',
                                                background: roll.isHit ? (roll.isCrit ? 'var(--roll-crit-bg)' : 'var(--roll-hit-bg)') : 'var(--roll-miss-bg)',
                                                borderRadius: '4px',
                                                marginBottom: '4px',
                                                display: 'inline-block'
                                            }}>
                                                <span style={{ fontWeight: 'bold' }}>AC Roll: </span>
                                                <span style={{
                                                    fontWeight: 'bold',
                                                    color: roll.isCrit ? '#ff6f00' : (roll.isHit ? '#2e7d32' : '#c62828')
                                                }}>
                                                    {roll.accRoll}
                                                    {roll.accModifier !== 0 && (
                                                        <span className="text-muted">
                                                            {roll.accModifier > 0 ? '+' : ''}{roll.accModifier}={roll.modifiedAccRoll}
                                                        </span>
                                                    )}
                                                </span>
                                                <span style={{ color: 'var(--text-secondary)' }}> vs AC {roll.moveAC}</span>
                                                {roll.acWasOverridden && <span style={{ color: '#667eea', marginLeft: '4px' }}>(DM)</span>}
                                                {roll.isCrit && <span style={{ color: '#ff6f00', marginLeft: '4px' }}>(Natural 20!)</span>}
                                            </div>
                                            {/* Damage or Status */}
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                {roll.isStatus ? (
                                                    <span style={{ color: roll.isHit ? '#2e7d32' : '#c62828' }}>
                                                        Status Move - {roll.isHit ? 'Effect applies!' : 'No effect'}
                                                    </span>
                                                ) : roll.isHit ? (
                                                    <>
                                                        <span style={{ fontWeight: 'bold', fontSize: '18px', color: 'var(--text-primary)' }}>{roll.total}</span>
                                                        <span> damage | [{roll.rolls?.join(', ')}] +{roll.statBonus} stat +{roll.stabBonus} STAB</span>
                                                    </>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Attack missed - no damage</span>
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
