// ============================================================
// Battle Tab Component (Dice Roller)
// ============================================================

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { getTypeColor } from '../../utils/typeUtils.js';
import { calculateSTAB, getActualStats, calculatePokemonHP, parseDice, applyCombatStage, parseHealFormula, parseCritThreshold } from '../../utils/dataUtils.js';
import toast from '../../utils/toast.js';
import { useGameData, useModal, useTrainerContext, usePokemonContext, useData, useUI } from '../../contexts/index.js';
import { MAX_ROLL_HISTORY, MAX_MOVE_TABLE, Z_MOVE_TABLE, TERA_CROWN_TABLE } from '../../data/constants.js';
import { getPokemonSprite, getPokemonDisplayImage, getMegaSprite, getGigantamaxSprite } from '../../utils/pokemonSprite.js';
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

// Hardcoded battle form changes for Pokémon not covered by the external Pokédex's megaForms field.
// Zygarde only has one pokedex entry (50% Forme, id L48: HP11 ATK10 DEF12 SATK8 SDEF10 SPD10).
// Zygarde-10% is not a separate pokedex entry — both alternate forms are battle-only transformations.
// Stat boosts are additive deltas calculated from the 50% Forme's PTA base stats.
//   10% Forme  (main game: HP54 ATK100 DEF71 SpA61 SpD85 Spe115 → PTA scale): faster but frailer
//   Complete   (main game: HP216 ATK100 DEF121 SpA91 SpD95 Spe85 → PTA scale): bulkier, slower
const BATTLE_FORM_CHANGES = {
    'Zygarde': [
        {
            name: '10%',
            types: ['Dragon', 'Ground'],
            ability: 'Power Construct',
            statBoosts: { hp: -6, def: -5, satk: -2, sdef: -1, spd: 2 },
        },
        {
            name: 'Complete',
            types: ['Dragon', 'Ground'],
            ability: 'Power Construct',
            statBoosts: { hp: 11, satk: 1, spd: -1 },
        },
    ],
};

// Convert a CSS hex color string to a Discord integer color
const hexToDiscordColor = (hex) => parseInt((hex || '#667eea').replace('#', ''), 16);


// Collect live battle context to attach to roll entries
const battleContext = (pokemon, hp, megaEvolved, currentMegaForm, isDynamaxed, canGigantamax) => ({
    attackerCurrentHP: hp.current,
    attackerMaxHP: hp.max,
    pokemonSpriteUrl: megaEvolved && currentMegaForm
        ? getMegaSprite(pokemon, currentMegaForm)
        : isDynamaxed && canGigantamax
            ? getGigantamaxSprite(pokemon)
            : getPokemonSprite(pokemon),
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
    const { showHelp, setActiveTab } = useUI();

    const [mode, setMode] = useState('pokemon');
    const [selectedMove, setSelectedMove] = useState(null);
    const [selectedSkill, setSelectedSkill] = useState('');
    const [customDice, setCustomDice] = useState('');
    const [rollHistory, setRollHistory] = useState(() => {
        try { return JSON.parse(localStorage.getItem('pta3-roll-history') || '[]'); } catch (e) { console.warn('Roll history corrupted, resetting:', e); return []; }
    });
    const [combatStages, setCombatStages] = useState({ atk: 0, satk: 0, def: 0, sdef: 0, spd: 0, acc: 0, eva: 0 });
    const [applyStab, setApplyStab] = useState(true);
    const [selectedPokemonId, setSelectedPokemonId] = useState(null);
    const [acOverride, setAcOverride] = useState('');
    const [megaEvolved, setMegaEvolved] = useState(false);
    const [currentMegaForm, setCurrentMegaForm] = useState(null);
    const [zMoveUsed, setZMoveUsed] = useState(false);
    const [zMoveActive, setZMoveActive] = useState(false);
    const [isDynamaxed, setIsDynamaxed] = useState(false);
    const [gMaxMoveUsed, setGMaxMoveUsed] = useState(false);
    const [isTerastallized, setIsTerastallized] = useState(false);
    const [teraBlastUsesLeft, setTeraBlastUsesLeft] = useState(3);
    const [preDynamaxMaxHp, setPreDynamaxMaxHp] = useState(null);
    const [pokemonHP, setPokemonHP] = useState(null); // override for Dynamax HP scaling
    const [trainerSubmode, setTrainerSubmode] = useState('skill'); // 'skill' | 'attack' | 'weapon'
    const [selectedWeapon, setSelectedWeapon] = useState('');
    const [trainerAcOverride, setTrainerAcOverride] = useState('');

    const anyMechanicActive = megaEvolved || isDynamaxed || isTerastallized;

    const selectedPokemon = useMemo(() => party.find(p => p.id === selectedPokemonId) || null, [party, selectedPokemonId]);

    // Clear stale selection if the selected Pokemon is no longer in the party
    useEffect(() => {
        if (selectedPokemonId && !party.some(p => p.id === selectedPokemonId)) {
            setSelectedPokemonId(null);
        }
    }, [party, selectedPokemonId]);

    const megaForms = useMemo(() => {
        if (!selectedPokemon || !pokedex) return [];
        const fromPokedex = pokedex.find(p => p.species === selectedPokemon.species)?.megaForms || [];
        const fromOverride = BATTLE_FORM_CHANGES[selectedPokemon.species] || [];
        return [...fromPokedex, ...fromOverride];
    }, [selectedPokemon, pokedex]);

    const healingInventory = useMemo(() => inventory.filter(item => {
        const t = (item.type || '').toLowerCase();
        if (t !== 'healing' && t !== 'berry') return false;
        return parseHealFormula(item.effect || '').type !== 'none';
    }), [inventory]);

    useEffect(() => {
        try {
            localStorage.setItem('pta3-roll-history', JSON.stringify(rollHistory));
        } catch (e) {
            if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
                toast.warning('Storage full — roll history could not be saved.');
            }
        }
    }, [rollHistory]);

    useEffect(() => {
        setMegaEvolved(false);
        setCurrentMegaForm(null);
        setAcOverride('');
        setZMoveUsed(false);
        setZMoveActive(false);
        setIsDynamaxed(false);
        setGMaxMoveUsed(false);
        setIsTerastallized(false);
        setTeraBlastUsesLeft(3);
        setPreDynamaxMaxHp(null);
        setPokemonHP(null);
    }, [selectedPokemonId]);

    const HELD_ITEM_BONUSES = {
        'Choice Band': { atk: 2 }, 'Choice Scarf': { spd: 2 }, 'Choice Specs': { satk: 2 },
    };

    // Apply mega stat boosts and Tera def/sdef bonus to actual stats
    const getStatsWithMega = useCallback((pokemon) => {
        const baseStats = getActualStats(pokemon);
        const afterMega = (!megaEvolved || !currentMegaForm?.statBoosts) ? baseStats : {
            hp:   baseStats.hp   + (currentMegaForm.statBoosts.hp   || 0),
            atk:  baseStats.atk  + (currentMegaForm.statBoosts.atk  || 0),
            def:  baseStats.def  + (currentMegaForm.statBoosts.def  || 0),
            satk: baseStats.satk + (currentMegaForm.statBoosts.satk || 0),
            sdef: baseStats.sdef + (currentMegaForm.statBoosts.sdef || 0),
            spd:  baseStats.spd  + (currentMegaForm.statBoosts.spd  || 0),
        };
        const afterTera = (!isTerastallized) ? afterMega : { ...afterMega, def: afterMega.def + 3, sdef: afterMega.sdef + 3 };
        // Apply temporary stat boosts and held item bonuses
        const boosts = pokemon.tempStatBoosts || {};
        const heldBonus = HELD_ITEM_BONUSES[pokemon.heldItem] || {};
        const stats = { ...afterTera };
        Object.keys(stats).forEach(k => {
            if (boosts[k]) stats[k] = (stats[k] || 0) + boosts[k];
            if (heldBonus[k]) stats[k] = (stats[k] || 0) + heldBonus[k];
        });
        return stats;
    }, [megaEvolved, currentMegaForm, isTerastallized]);

    const gMaxData = useMemo(() => {
        if (!selectedPokemon?.species) return null;
        return GAME_DATA.gigantamaxForms?.[selectedPokemon.species] || null;
    }, [selectedPokemon]);

    const canGigantamax = !!gMaxData;

    const hasZMoves = useMemo(() => {
        if (!selectedPokemon) return false;
        return selectedPokemon.moves?.some(m => Z_MOVE_TABLE[m.type]) || !!(GAME_DATA.uniqueZMoves?.[selectedPokemon.species]);
    }, [selectedPokemon]);

    // Transform the move list based on the active battle mode.
    const displayedMoves = useMemo(() => {
        if (!selectedPokemon?.moves?.length) return selectedPokemon?.moves || [];

        // ── Dynamax / Gigantamax ────────────────────────────────────────────
        if (isDynamaxed) {
            const seen = new Set();
            const maxMoves = selectedPokemon.moves.reduce((acc, m) => {
                let maxMove;
                if (m.category === 'Status') {
                    maxMove = { name: 'Max Guard', type: 'Normal', category: 'Status', damage: null, frequency: 'At-Will', range: 'Self', isMaxMove: true, isMaxGuard: true, effect: 'Blocks all damage and effects targeting the user until the start of its next turn.' };
                } else {
                    const entry = MAX_MOVE_TABLE[m.type];
                    maxMove = entry
                        ? { name: entry.name, type: m.type, category: m.category, damage: '4d12', frequency: 'At-Will', range: 'Ranged (80ft, 30ft blast)', isMaxMove: true, isMaxGuard: false, effect: entry.effect }
                        : m;
                }
                if (!seen.has(maxMove.name)) { seen.add(maxMove.name); acc.push(maxMove); }
                return acc;
            }, []);
            if (gMaxData?.gMaxMove) {
                const gm = gMaxData.gMaxMove;
                maxMoves.unshift({ name: gm.name, type: gm.type, category: 'Special', damage: gm.damage, frequency: '1/battle', range: 'Ranged (80ft, 30ft blast)', isMaxMove: true, isGMaxMove: true, isMaxGuard: false, effect: gm.effect });
            }
            return maxMoves;
        }

        // ── Z-Move mode ─────────────────────────────────────────────────────
        if (zMoveActive) {
            const seen = new Set();
            const result = [];
            const uniqueZ = GAME_DATA.uniqueZMoves?.[selectedPokemon.species];
            if (uniqueZ) {
                result.push({ name: uniqueZ.name, type: uniqueZ.type, category: uniqueZ.category, damage: uniqueZ.damage, range: uniqueZ.range, frequency: '1/day', isZMove: true, isUniqueZ: true, effect: uniqueZ.effect || '' });
                seen.add(uniqueZ.name);
            }
            selectedPokemon.moves.forEach(m => {
                if (m.category === 'Status') return;
                const zMove = Z_MOVE_TABLE[m.type];
                if (zMove && !seen.has(zMove.name)) {
                    seen.add(zMove.name);
                    result.push({ name: zMove.name, type: m.type, category: m.category, damage: zMove.damage, range: zMove.range, frequency: '1/day', isZMove: true, isUniqueZ: false, effect: '' });
                }
            });
            return result;
        }

        // ── Terastallized ───────────────────────────────────────────────────
        if (isTerastallized && selectedPokemon.teraType) {
            const crown = TERA_CROWN_TABLE[selectedPokemon.teraType];
            const prepended = [
                { name: 'Tera Blast', type: selectedPokemon.teraType, category: 'Special', damage: '3d12', range: 'Ranged (40ft beam, 10ft blast)', frequency: '3/day', isTeraMove: true, isTeraBlast: true, effect: 'Uses higher of ATK or SATK.' },
            ];
            if (crown) {
                prepended.push({ name: crown.move, type: selectedPokemon.teraType, category: crown.category, damage: crown.damage, range: crown.range, frequency: 'At-Will', isTeraMove: true, isTeraCrown: true, effect: '' });
            }
            return [...prepended, ...selectedPokemon.moves];
        }

        return selectedPokemon.moves;
    }, [selectedPokemon, isDynamaxed, gMaxData, zMoveActive, isTerastallized, teraBlastUsesLeft]);

    const handleMegaEvolve = (megaForm) => { setCurrentMegaForm(megaForm); setMegaEvolved(true); setZMoveActive(false); setSelectedMove(null); };
    const handleMegaRevert = () => { setMegaEvolved(false); setCurrentMegaForm(null); setSelectedMove(null); };

    const handleZMoveActivate = () => { setZMoveActive(true); setSelectedMove(null); };
    const handleZMoveDeactivate = () => { setZMoveActive(false); setSelectedMove(null); };
    const handleZMoveReset = () => { setZMoveUsed(false); };

    const handleDynamax = () => {
        if (!selectedPokemon) return;
        setSelectedMove(null);
        setZMoveActive(false);
        const base = getPokemonBaseHP(selectedPokemon);
        const newMax = base.max * 5;
        setPreDynamaxMaxHp(base.max);
        setPokemonHP({ current: newMax, max: newMax });
        setIsDynamaxed(true);
    };

    const handleDynamaxRevert = () => {
        const base = preDynamaxMaxHp;
        setPokemonHP(prev => {
            // Preserve proportional HP: 60% during Dynamax → 60% on revert
            const ratio = prev ? prev.current / prev.max : 1;
            const current = Math.max(0, Math.floor(base * ratio));
            return { current, max: base };
        });
        setIsDynamaxed(false);
        setGMaxMoveUsed(false);
        setPreDynamaxMaxHp(null);
        setSelectedMove(null);
    };

    const handleTerastallize = () => { setZMoveActive(false); setSelectedMove(null); setIsTerastallized(true); };
    const handleTeraRevert = () => setIsTerastallized(false);

    // Roll a special mechanic move (Z-Move, G-Max, Tera Blast) into roll history
    const rollSpecialMove = ({ moveName, moveType, category, damage, effect }) => {
        if (!selectedPokemon) return;
        const diceData = parseDice(damage);
        if (diceData.count === 0) return;
        const rolls = rollDice(diceData.count, diceData.sides);
        const total = rolls.reduce((s, r) => s + r, 0) + diceData.bonus;
        const hp = getActivePokemonHP(selectedPokemon);
        addToHistory(buildPokemonRollEntry({
            pokemon: selectedPokemon.name || selectedPokemon.species,
            move: moveName, moveType, category,
            accRoll: 20, accModifier: 0, modifiedAccRoll: 20, moveAC: null, acWasOverridden: false,
            isHit: true, isCrit: false, isStatus: false,
            dice: `${diceData.count}d${diceData.sides}`,
            rolls, diceTotal: total, statBonus: 0, stabBonus: 0, total,
            typeColor: 0,
            attackerCurrentHP: hp.current, attackerMaxHP: hp.max,
            pokemonSpriteUrl: getPokemonSprite(selectedPokemon),
            activeStatuses: [],
            megaEvolved: false, megaFormName: null,
            ...(effect ? { specialEffect: effect } : {}),
        }));
    };

    const handleZMoveRoll = (zMove) => {
        rollSpecialMove({ moveName: zMove.name, moveType: zMove.type, category: zMove.category, damage: zMove.damage, effect: zMove.effect });
        setZMoveUsed(true);
    };

    const handleGMaxRoll = (gMaxMove) => {
        rollSpecialMove({ moveName: gMaxMove.name, moveType: gMaxMove.type, category: 'Special', damage: gMaxMove.damage, effect: gMaxMove.effect });
        setGMaxMoveUsed(true);
    };


    const handleTeraBlastRoll = () => {
        if (teraBlastUsesLeft <= 0 || !selectedPokemon) return;
        rollSpecialMove({ moveName: 'Tera Blast', moveType: selectedPokemon.teraType || 'Normal', category: 'Special', damage: '3d12', effect: '' });
        setTeraBlastUsesLeft(prev => prev - 1);
    };

    // Base HP from Pokémon data, including mega stat boosts (ignores Dynamax override)
    const getPokemonBaseHP = (poke) => {
        if (!poke) return { current: 0, max: 0 };
        // Use getStatsWithMega so mega HP boosts (e.g. Zygarde Complete +11) are reflected
        const max = getStatsWithMega(poke).hp;
        return { current: Math.max(0, max - (poke.currentDamage || 0)), max };
    };

    // Active HP: use Dynamax override if present, else base
    const getActivePokemonHP = (poke) => {
        if (!poke) return { current: 0, max: 0 };
        if (pokemonHP && poke.id === selectedPokemonId) return pokemonHP;
        return getPokemonBaseHP(poke);
    };

    const getPokemonHP = (poke) => getActivePokemonHP(poke);

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

        // Z-Moves — always hit, 8d12 (or species-specific damage), one-time use
        if (selectedMove.isZMove) {
            if (zMoveUsed) return;
            handleZMoveRoll(selectedMove);
            return;
        }

        // Tera Blast — always hit, 3d12, 3/day
        if (selectedMove.isTeraBlast) {
            if (teraBlastUsesLeft <= 0) return;
            handleTeraBlastRoll();
            return;
        }

        // Tera Crown At-Will move — treated like a normal At-Will (no accuracy roll needed)
        if (selectedMove.isTeraCrown) {
            rollSpecialMove({ moveName: selectedMove.name, moveType: selectedMove.type, category: selectedMove.category, damage: selectedMove.damage, effect: selectedMove.effect });
            return;
        }

        // Max Moves bypass the normal accuracy/stat roll — always hit, flat 4d12
        if (selectedMove.isMaxMove) {
            if (selectedMove.isGMaxMove) {
                handleGMaxRoll({ name: selectedMove.name, type: selectedMove.type, damage: selectedMove.damage, effect: selectedMove.effect });
                return;
            }
            if (selectedMove.isMaxGuard) {
                // Max Guard — log as a status action (no damage)
                const hp = getActivePokemonHP(selectedPokemon);
                const canGigantamax = !!(GAME_DATA.gigantamaxForms?.[selectedPokemon.species]);
                const ctx = battleContext(selectedPokemon, hp, megaEvolved, currentMegaForm, isDynamaxed, canGigantamax);
                addToHistory(buildPokemonRollEntry({
                    pokemon: selectedPokemon.name || selectedPokemon.species,
                    move: 'Max Guard', moveType: 'Normal', category: 'Status',
                    accRoll: 20, accModifier: 0, modifiedAccRoll: 20, moveAC: null, acWasOverridden: false,
                    isHit: true, isCrit: false, isStatus: true,
                    dice: null, rolls: [], diceTotal: 0, statBonus: 0, stabBonus: 0, total: 0,
                    ...ctx
                }));
            } else {
                rollSpecialMove({ moveName: selectedMove.name, moveType: selectedMove.type, category: selectedMove.category || 'Special', damage: '4d12', effect: selectedMove.effect });
            }
            return;
        }

        const actualStats = getStatsWithMega(selectedPokemon);
        const category = selectedMove.category; // 'Physical', 'Special', 'Status'
        const isPhysical = category === 'Physical';
        const statKey = isPhysical ? 'atk' : 'satk'; // stat used for damage
        // PTA3: Physical → ATK accuracy mod vs DEF; Special → SATK mod vs SDEF; Status → EFF mod vs SPD
        const accModKey = isPhysical ? 'atk' : category === 'Status' ? 'eff' : 'satk';
        const statMod = applyCombatStage(actualStats[statKey] || 0, combatStages[statKey] || 0);

        // PTA3: accuracy = 1d20 + acc combat stages + Pokémon's accuracy bonus (from Pokédex)
        const accStageMod = combatStages.acc || 0;
        const pokemonAccBonus = selectedPokemon.accuracyMods?.[accModKey] || 0;
        const accModifier = accStageMod + pokemonAccBonus; // total acc bonus shown in roll

        // Target stat value (DEF/SDEF/SPD) entered via override field; null = GM call (always hit)
        const moveAC = acOverride !== '' ? (parseInt(acOverride) || null) : null;
        const critThreshold = parseCritThreshold(selectedMove.effect || selectedMove.description);
        const accRoll = Math.floor(Math.random() * 20) + 1;
        const modifiedAccRoll = accRoll + accModifier;
        const isCrit = accRoll >= critThreshold;
        const isHit = isCrit || moveAC === null || modifiedAccRoll >= moveAC;
        const acWasOverridden = acOverride !== '';

        const hp = getPokemonHP(selectedPokemon);
        const canGigantamax = !!(GAME_DATA.gigantamaxForms?.[selectedPokemon.species]);
        const ctx = battleContext(selectedPokemon, hp, megaEvolved, currentMegaForm, isDynamaxed, canGigantamax);
        const typeColor = hexToDiscordColor(getTypeColor(selectedMove.type));

        const commonFields = {
            pokemon: selectedPokemon.name || selectedPokemon.species,
            move: selectedMove.name, moveType: selectedMove.type, category: selectedMove.category,
            accRoll, accModifier, modifiedAccRoll, moveAC, acWasOverridden, isHit, isCrit, critThreshold,
            typeColor, ...ctx,
        };

        const diceData = parseDice(selectedMove.damage);

        // Collect non-zero combat stages relevant to this roll
        const statLabel = isPhysical ? 'ATK' : 'SATK';
        const baseStatVal = actualStats[statKey] || 0;
        const statBonus = statMod - baseStatVal; // actual stat change from combat stage
        const relevantStages = [
            combatStages.acc ? { label: 'ACC', stage: combatStages.acc, bonus: combatStages.acc, isFlat: true } : null,
            diceData.count > 0 && combatStages[statKey] ? { label: statLabel, stage: combatStages[statKey], bonus: statBonus, base: baseStatVal, boosted: statMod } : null,
        ].filter(Boolean);

        if (diceData.count === 0 && diceData.flat === 0) {
            addToHistory(buildPokemonRollEntry({ ...commonFields, isStatus: true, relevantStages }));
            return;
        }

        let rolls = [], diceTotal = 0, stabBonus = 0, total = 0, diceCount = 0;
        if (isHit) {
            if (diceData.flat > 0) {
                // Flat damage move (e.g. Dragon Rage): fixed value, no dice, no added bonuses
                rolls = [diceData.flat];
                diceTotal = diceData.flat;
                total = diceData.flat;
            } else {
                diceCount = diceData.count;
                // PTA3: critical hit = all dice at max value (not double dice)
                rolls = isCrit
                    ? Array(diceCount).fill(diceData.sides)
                    : rollDice(diceCount, diceData.sides);
                diceTotal = rolls.reduce((sum, r) => sum + r, 0);
                if (applyStab && selectedPokemon.types?.includes(selectedMove.type)) {
                    stabBonus = calculateSTAB();
                }
                total = diceTotal + diceData.bonus + statMod + stabBonus;
            }
        }

        addToHistory(buildPokemonRollEntry({
            ...commonFields,
            dice: isHit ? (diceData.flat > 0 ? `${diceData.flat} (fixed)` : `${diceCount}d${diceData.sides}`) : null,
            diceBonus: diceData.bonus,
            rolls, diceTotal, statBonus: diceData.flat > 0 ? 0 : statMod, stabBonus, total, relevantStages
        }));
    };

    const rollTrainerSkill = () => {
        if (!selectedSkill) return;
        const skillData = GAME_DATA.skills[selectedSkill];
        if (!skillData) return;

        const statKey = skillData.stat?.toLowerCase();
        const baseStat = trainer.stats?.[statKey] || 3;
        const modifier = Math.floor(baseStat / 2);

        const skills = trainer.skills || {};
        const skillRank = Array.isArray(skills)
            ? (skills.includes(selectedSkill) ? 1 : 0)
            : (skills[selectedSkill] || 0);
        const hasSkill = skillRank > 0;
        // PTA3: 0 talents = +0, 1 talent = +2, 2 talents = +5
        const talentBonus = skillRank === 2 ? 5 : skillRank === 1 ? 2 : 0;

        const rolls = rollDice(1, 20);
        const rollTotal = rolls[0];
        const total = rollTotal + modifier + talentBonus;

        const trainerMaxHP = calculateMaxHP();
        const trainerCurrentHP = Math.max(0, trainerMaxHP - (trainer.currentDamage || 0));
        addToHistory({ type: 'trainer_skill', skill: selectedSkill, skillStat: skillData.stat, dice: '1d20', rolls, baseStat, modifier, hasSkill, bonus: talentBonus, total, trainerCurrentHP, trainerMaxHP, timestamp: Date.now() });
    };

    // Parse move name and type from a weapon item's effect string
    // e.g. "Branch Poke — Melee Grass At-Will 2d6. Requires Weapons Master."
    const getWeaponInfo = (weaponName) => {
        const item = GAME_DATA?.items?.[weaponName];
        if (!item?.effect) return { moveName: 'Weapon Attack', moveType: 'Normal' };
        const nameMatch = item.effect.match(/^([^—\-]+)/);
        const typeMatch = item.effect.match(/Melee (\w+)/);
        return {
            moveName: nameMatch ? nameMatch[1].trim() : weaponName,
            moveType: typeMatch ? typeMatch[1] : 'Normal',
        };
    };

    const rollTrainerAttack = () => {
        const isWeapon = trainerSubmode === 'weapon';
        const atkStat = trainer.stats?.atk || 3;
        const atkMod = Math.floor(atkStat / 2);
        const moveAC = trainerAcOverride !== '' ? (parseInt(trainerAcOverride) || null) : null;
        const accRoll = Math.floor(Math.random() * 20) + 1;
        const isCrit = accRoll === 20;
        const isHit = isCrit || moveAC === null || (accRoll + atkMod) >= moveAC;

        const [count, sides] = isWeapon ? [2, 6] : [1, 4];
        const damageRolls = isHit ? (isCrit ? Array(count).fill(sides) : rollDice(count, sides)) : [];
        const diceTotal = damageRolls.reduce((s, r) => s + r, 0);
        const total = isHit ? diceTotal + atkMod : 0;

        let moveName = 'Unarmed Strike', moveType = 'Normal', weaponName = null;
        if (isWeapon && selectedWeapon) {
            weaponName = selectedWeapon;
            const wInfo = getWeaponInfo(selectedWeapon);
            moveName = wInfo.moveName;
            moveType = wInfo.moveType;
        }

        addToHistory({
            type: 'trainer_attack',
            attackType: isWeapon ? 'weapon' : 'unarmed',
            moveName,
            weaponName,
            moveType,
            accRoll,
            accModifier: atkMod,
            modifiedAccRoll: accRoll + atkMod,
            moveAC,
            isHit,
            isCrit,
            dice: `${count}d${sides}`,
            rolls: damageRolls,
            diceTotal,
            atkMod,
            total,
            timestamp: Date.now(),
        });
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
        } else if (formula.type === 'full') {
            amount = maxHP;
            desc = 'Full Restore';
        } else if (formula.type === 'flat') {
            amount = formula.amount;
            desc = `${formula.amount} HP`;
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
                <button className={`tab ${mode === 'pokemon'  ? 'active' : ''}`} onClick={() => setMode('pokemon')}>Pokemon</button>
                <button className={`tab ${mode === 'trainer'  ? 'active' : ''}`} onClick={() => setMode('trainer')}>Trainer</button>
                <button className={`tab ${mode === 'custom'   ? 'active' : ''}`} onClick={() => setMode('custom')}>Custom Dice</button>
                <button className={`tab ${mode === 'heal'     ? 'active' : ''}`} onClick={() => setMode('heal')}>🩹 Heal</button>
            </div>

            <div className="grid-responsive-2">
                {/* Left: Roll Controls */}
                <div className="section-card-purple">
                    <h3 className="section-title-purple">
                        <span>{mode === 'heal' ? '🩹' : '🎲'}</span>{' '}
                        {mode === 'pokemon' ? 'Pokemon' : mode === 'trainer' ? 'Trainer' : mode === 'heal' ? 'Use Healing Item' : 'Custom Roll'}
                    </h3>

                    {mode === 'pokemon' && (
                        <div>
                            {/* Pokemon Selector */}
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>Select Pokemon</label>
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
                                                {poke.name || poke.species} — HP: {hp.current}/{hp.max}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* Empty state */}
                            {!selectedPokemon && (
                                <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎲</div>
                                    Select a Pokémon above to roll moves, track HP, and manage battle mechanics.
                                </div>
                            )}

                            {/* Pokemon Sprite */}
                            {selectedPokemon && (() => {
                                const isGmax = isDynamaxed && !!(GAME_DATA.gigantamaxForms?.[selectedPokemon.species]);
                                const img = megaEvolved && currentMegaForm
                                    ? getMegaSprite(selectedPokemon, currentMegaForm)
                                    : isGmax
                                        ? getGigantamaxSprite(selectedPokemon)
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
                                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Held Item</div>
                                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{selectedPokemon.heldItem}</div>
                                            {itemData?.effect && (
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{itemData.effect}</div>
                                            )}
                                        </div>
                                        {showDetail && itemData && (
                                            <span style={{ fontSize: '13px', color: '#667eea', flexShrink: 0 }}>Details →</span>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Pokemon HP Tracker */}
                            {selectedPokemon && (() => {
                                const hp = getPokemonHP(selectedPokemon);
                                // During Dynamax, track HP locally (scaled ×5); otherwise persist to Pokémon data
                                const handleDamage = (val) => {
                                    if (isDynamaxed) {
                                        setPokemonHP(prev => ({ ...prev, current: Math.max(0, (prev?.current ?? hp.current) - val) }));
                                    } else {
                                        updatePokemon(selectedPokemon.id, { currentDamage: Math.min(hp.max, (selectedPokemon.currentDamage || 0) + val) });
                                    }
                                };
                                const handleHeal = (val) => {
                                    if (isDynamaxed) {
                                        setPokemonHP(prev => ({ ...prev, current: Math.min(prev?.max ?? hp.max, (prev?.current ?? hp.current) + val) }));
                                    } else {
                                        updatePokemon(selectedPokemon.id, { currentDamage: Math.max(0, (selectedPokemon.currentDamage || 0) - val) });
                                    }
                                };
                                const handleFull = () => {
                                    if (isDynamaxed) {
                                        setPokemonHP(prev => ({ ...prev, current: prev?.max ?? hp.max }));
                                    } else {
                                        updatePokemon(selectedPokemon.id, { currentDamage: 0 });
                                    }
                                };
                                return (
                                    <HPTracker
                                        label={isDynamaxed ? 'HP (Dynamax)' : 'HP'}
                                        currentHP={hp.current}
                                        maxHP={hp.max}
                                        onDamage={handleDamage}
                                        onHeal={handleHeal}
                                        onFull={handleFull}
                                    />
                                );
                            })()}

                            {(() => {
                                const activeTypes = isTerastallized && selectedPokemon?.teraType
                                    ? [selectedPokemon.teraType]
                                    : (megaEvolved && currentMegaForm?.types?.length ? currentMegaForm.types : selectedPokemon?.types);
                                return (
                                    <TypeMatchupDisplay
                                        selectedPokemon={selectedPokemon}
                                        megaEvolved={megaEvolved}
                                        currentMegaForm={currentMegaForm}
                                        activeTypes={isTerastallized && selectedPokemon?.teraType ? activeTypes : undefined}
                                    />
                                );
                            })()}

                            <StatusConditionUI selectedPokemon={selectedPokemon} updatePokemon={updatePokemon} />

                            {(() => {
                                return (
                                    <>
                                        <MegaEvolutionPanel
                                            selectedPokemon={selectedPokemon}
                                            megaForms={megaForms}
                                            megaEvolved={megaEvolved}
                                            currentMegaForm={currentMegaForm}
                                            onMegaEvolve={handleMegaEvolve}
                                            onMegaRevert={handleMegaRevert}
                                            label={BATTLE_FORM_CHANGES[selectedPokemon?.species] ? 'Form Change' : 'Mega Evolution'}
                                            isFormChange={!!BATTLE_FORM_CHANGES[selectedPokemon?.species]}
                                            disabled={anyMechanicActive && !megaEvolved}
                                        />
                                    </>
                                );
                            })()}

                            <CombatStagesPanel
                                selectedPokemon={selectedPokemon}
                                combatStages={combatStages}
                                getStatsWithMega={getStatsWithMega}
                                updateCombatStage={updateCombatStage}
                                resetCombatStages={resetCombatStages}
                                onHelp={() => showHelp('combat-stages')}
                            />

                            {/* STAB Toggle & AC Override */}
                            {selectedPokemon && (
                                <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    <label
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                        title="Same Type Attack Bonus (STAB): Fixed +4 damage when using a move matching the Pokémon's type."
                                    >
                                        <input type="checkbox" checked={applyStab} onChange={(e) => setApplyStab(e.target.checked)} />
                                        <span style={{ fontSize: '13px' }}>Apply STAB</span>
                                    </label>
                                    <span
                                        style={{ fontSize: '12px', color: 'var(--text-secondary)' }}
                                        title="Same Type Attack Bonus (STAB): Fixed +4 damage when using a move matching the Pokémon's type."
                                    >
                                        (+{calculateSTAB()} for matching type)
                                    </span>
                                    {selectedMove && selectedPokemon?.accuracyMods && (() => {
                                        const k = selectedMove.category === 'Physical' ? 'atk' : selectedMove.category === 'Status' ? 'eff' : 'satk';
                                        const bonus = selectedPokemon.accuracyMods[k];
                                        return bonus != null ? (
                                            <span
                                                style={{ fontSize: '12px', color: 'var(--text-secondary)' }}
                                                title={`This Pokémon's accuracy bonus for ${selectedMove.category} moves (from its Pokédex entry). Added to the 1d20 accuracy roll.`}
                                            >
                                                Acc: +{bonus}
                                            </span>
                                        ) : null;
                                    })()}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }} title="Enter the target's relevant stat value (DEF/SDEF/SPD). Leave blank and GM decides hit/miss.">
                                        <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#667eea' }}>
                                            {selectedMove?.category === 'Physical' ? 'vs DEF:' : selectedMove?.category === 'Status' ? 'vs SPD:' : 'vs SDEF:'}
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={acOverride}
                                            onChange={(e) => setAcOverride(e.target.value)}
                                            placeholder="—"
                                            style={{ width: '50px', padding: '4px 8px', borderRadius: '4px', border: acOverride !== '' ? '2px solid #667eea' : '1px solid var(--border-medium)', fontSize: '13px', textAlign: 'center', background: acOverride !== '' ? 'var(--input-bg-hover)' : 'var(--input-bg)' }}
                                        />
                                        {acOverride !== '' && (
                                            <button onClick={() => setAcOverride('')} style={{ padding: '4px 8px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }} title="Clear target stat" aria-label="Clear target stat">✕</button>
                                        )}
                                    </div>
                                </div>
                            )}

                            <MoveSelector
                                selectedPokemon={selectedPokemon}
                                moves={displayedMoves}
                                selectedMove={selectedMove}
                                onSelectMove={setSelectedMove}
                                showDetail={showDetail}
                                showHelp={showHelp}
                                gameData={GAME_DATA}
                                isDynamaxed={isDynamaxed}
                                canGigantamax={canGigantamax}
                                gMaxMoveUsed={gMaxMoveUsed}
                                onDynamaxActivate={handleDynamax}
                                onDynamaxRevert={handleDynamaxRevert}
                                dynamaxDisabled={(anyMechanicActive || zMoveActive) && !isDynamaxed}
                                zMoveActive={zMoveActive}
                                zMoveUsed={zMoveUsed}
                                hasZMoves={hasZMoves}
                                onZMoveActivate={handleZMoveActivate}
                                onZMoveDeactivate={handleZMoveDeactivate}
                                onZMoveReset={handleZMoveReset}
                                zMoveDisabled={anyMechanicActive}
                                isTerastallized={isTerastallized}
                                teraType={selectedPokemon?.teraType || ''}
                                teraBlastUsesLeft={teraBlastUsesLeft}
                                onTeraActivate={handleTerastallize}
                                onTeraRevert={handleTeraRevert}
                                teraDisabled={(anyMechanicActive || zMoveActive) && !isTerastallized}
                            />

                            {/* Roll Button */}
                            {(() => {
                                const m = selectedMove;
                                const isDisabled = !selectedPokemon || !m
                                    || (m?.isGMaxMove && gMaxMoveUsed)
                                    || (m?.isZMove && zMoveUsed)
                                    || (m?.isTeraBlast && teraBlastUsesLeft <= 0);
                                const bg = !selectedPokemon || !m ? '#ccc'
                                    : m.isGMaxMove ? (gMaxMoveUsed ? '#ccc' : 'linear-gradient(135deg, #b8860b, #ffd700)')
                                    : m.isZMove ? (zMoveUsed ? '#ccc' : 'linear-gradient(135deg, #c62828, #e53935)')
                                    : m.isTeraMove ? (m.isTeraBlast && teraBlastUsesLeft <= 0 ? '#ccc' : `linear-gradient(135deg, ${getTypeColor(selectedPokemon?.teraType || 'Normal')}, ${getTypeColor(selectedPokemon?.teraType || 'Normal')}cc)`)
                                    : isDynamaxed ? 'linear-gradient(135deg, #4a0080, #9b27af)'
                                    : 'linear-gradient(135deg, #667eea, #764ba2)';
                                const fg = !selectedPokemon || !m ? '#555'
                                    : m.isGMaxMove ? (gMaxMoveUsed ? '#555' : '#1a1a00')
                                    : 'white';
                                const label = !m ? 'Roll Attack!'
                                    : m.isMaxGuard ? 'Log Max Guard'
                                    : m.isGMaxMove ? `Roll G-Max! (${m.damage})`
                                    : m.isMaxMove ? 'Roll Max Move! (4d12)'
                                    : m.isZMove ? `Roll Z-Move! (${m.damage})`
                                    : m.isTeraBlast ? `Roll Tera Blast! (3d12) — ${teraBlastUsesLeft}/3`
                                    : m.isTeraCrown ? `Roll ${m.name}! (${m.damage})`
                                    : 'Roll Attack!';
                                return (
                                    <button
                                        onClick={rollPokemonMove}
                                        disabled={isDisabled}
                                        style={{ width: '100%', padding: '15px', background: isDisabled ? '#ccc' : bg, color: isDisabled ? '#555' : fg, border: 'none', borderRadius: '8px', cursor: isDisabled ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 'bold' }}
                                    >
                                        {label}
                                    </button>
                                );
                            })()}
                        </div>
                    )}

                    {mode === 'trainer' && (
                        <div>
                            {/* Trainer Stats Display */}
                            <div className="trainer-stats-display" style={{ marginBottom: '12px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
                                    {trainer.name || 'Trainer'} — Level {trainer.level || 1}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                                    {[
                                        { key: 'atk',  label: 'ATK',  color: '#ff5722' },
                                        { key: 'def',  label: 'DEF',  color: '#2196f3' },
                                        { key: 'satk', label: 'SATK', color: '#9c27b0' },
                                        { key: 'sdef', label: 'SDEF', color: '#ff9800' },
                                        { key: 'spd',  label: 'SPD',  color: '#00bcd4' },
                                    ].map(stat => {
                                        const value = trainer.stats?.[stat.key] || 3;
                                        const mod = Math.floor(value / 2);
                                        return (
                                            <div key={stat.key} className="trainer-stat-mini-box" style={{ textAlign: 'center', padding: '4px', borderRadius: '4px' }}>
                                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: stat.color }}>{stat.label}</div>
                                                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{value}</div>
                                                <div style={{ fontSize: '12px', color: mod >= 0 ? '#4caf50' : '#f44336' }}>{mod >= 0 ? '+' : ''}{mod}</div>
                                            </div>
                                        );
                                    })}
                                </div>
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

                            {/* Submode tabs */}
                            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                {[
                                    { id: 'skill',  label: 'Skill Check' },
                                    { id: 'attack', label: 'Unarmed Attack' },
                                    { id: 'weapon', label: 'Weapon Attack' },
                                ].map(({ id, label }) => (
                                    <button
                                        key={id}
                                        onClick={() => setTrainerSubmode(id)}
                                        style={{
                                            padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
                                            background: trainerSubmode === id ? '#667eea' : 'var(--bg-secondary)',
                                            color: trainerSubmode === id ? 'white' : 'var(--text-secondary)',
                                        }}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* ── Skill Check ── */}
                            {trainerSubmode === 'skill' && (
                                <>
                                    <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>Select Skill</label>
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
                                                    {name} ({data.stat}) {rank > 0 ? (rank === 2 ? '✓✓ +5' : '✓ +2') : ''}
                                                </option>
                                            );
                                        })}
                                    </select>

                                    {selectedSkill && GAME_DATA.skills?.[selectedSkill] && (() => {
                                        const skillData = GAME_DATA.skills[selectedSkill];
                                        const statKey = skillData.stat?.toLowerCase();
                                        const baseStat = trainer.stats?.[statKey] || 3;
                                        const modifier = Math.floor(baseStat / 2);
                                        const skills = trainer.skills || {};
                                        const skillRank = Array.isArray(skills) ? (skills.includes(selectedSkill) ? 1 : 0) : (skills[selectedSkill] || 0);
                                        const talentBonus = skillRank === 2 ? 5 : skillRank === 1 ? 2 : 0;
                                        return (
                                            <div className="skill-info-box" style={{ marginBottom: '12px', padding: '10px', borderRadius: '6px', fontSize: '13px' }}>
                                                <div><strong>{selectedSkill}</strong> ({skillData.stat})</div>
                                                <div style={{ marginTop: '4px' }}>
                                                    1d20 +{modifier} (stat){skillRank > 0 && <span style={{ color: '#4caf50' }}> +{talentBonus} (talent)</span>}
                                                </div>
                                                <div className="text-muted" style={{ marginTop: '2px' }}>{skillData.description}</div>
                                            </div>
                                        );
                                    })()}

                                    <button
                                        onClick={rollTrainerSkill}
                                        disabled={!selectedSkill}
                                        style={{ width: '100%', padding: '15px', background: selectedSkill ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#ccc', color: selectedSkill ? 'white' : '#555', border: 'none', borderRadius: '8px', cursor: selectedSkill ? 'pointer' : 'not-allowed', fontSize: '16px', fontWeight: 'bold' }}
                                    >
                                        Roll Skill Check!
                                    </button>
                                </>
                            )}

                            {/* ── Unarmed Attack ── */}
                            {trainerSubmode === 'attack' && (() => {
                                const atkVal = trainer.stats?.atk || 3;
                                const atkMod = Math.floor(atkVal / 2);
                                return (
                                    <>
                                        <div className="skill-info-box" style={{ marginBottom: '12px', padding: '10px', borderRadius: '6px', fontSize: '13px' }}>
                                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Unarmed Strike</div>
                                            <div>Accuracy: 1d20 +{atkMod} (ATK) vs target DEF</div>
                                            <div style={{ marginTop: '2px' }}>Damage on hit: 1d4 +{atkMod} (ATK)</div>
                                            <div style={{ marginTop: '4px', color: 'var(--text-muted)', fontSize: '12px' }}>Natural 20 = crit (max dice).</div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#667eea', whiteSpace: 'nowrap' }}>vs DEF:</label>
                                            <input
                                                type="number" min="1" max="20"
                                                value={trainerAcOverride}
                                                onChange={(e) => setTrainerAcOverride(e.target.value)}
                                                placeholder="—"
                                                style={{ width: '60px', padding: '4px 8px', borderRadius: '4px', border: trainerAcOverride !== '' ? '2px solid #667eea' : '1px solid var(--border-medium)', fontSize: '13px', textAlign: 'center' }}
                                            />
                                            {trainerAcOverride !== '' && (
                                                <button onClick={() => setTrainerAcOverride('')} style={{ padding: '4px 8px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                                            )}
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Leave blank = always hit</span>
                                        </div>

                                        <button
                                            onClick={rollTrainerAttack}
                                            style={{ width: '100%', padding: '15px', background: 'linear-gradient(135deg, #ff5722, #e64a19)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
                                        >
                                            Roll Unarmed Attack!
                                        </button>
                                    </>
                                );
                            })()}

                            {/* ── Weapon Attack ── */}
                            {trainerSubmode === 'weapon' && (() => {
                                const atkVal = trainer.stats?.atk || 3;
                                const atkMod = Math.floor(atkVal / 2);
                                // Rules: "If you are holding a weapon" — only equipped weapons are usable
                                const equippedWeapons = (trainer.equippedItems || []).filter(name => {
                                    const itemData = GAME_DATA?.items?.[name];
                                    return (itemData?.type || '').toLowerCase() === 'weapon';
                                });
                                const wInfo = selectedWeapon ? getWeaponInfo(selectedWeapon) : null;
                                return (
                                    <>
                                        {equippedWeapons.length === 0 ? (
                                            <div style={{ padding: '12px', borderRadius: '6px', background: 'var(--bg-secondary)', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                                                No weapons equipped. Requires the <strong>Weapons Master</strong> feature (Martial Artist Lv 6).{' '}
                                                <button onClick={() => setActiveTab('inventory')} style={{ background: 'none', border: 'none', color: 'var(--color-purple, #667eea)', cursor: 'pointer', padding: 0, fontSize: '13px', textDecoration: 'underline' }}>Go to Inventory →</button>
                                            </div>
                                        ) : (
                                            <>
                                                <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>Select Weapon <span style={{ fontWeight: 'normal', color: 'var(--text-muted)', fontSize: '12px' }}>(free action to switch)</span></label>
                                                <select
                                                    value={selectedWeapon}
                                                    onChange={(e) => setSelectedWeapon(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-medium)', marginBottom: '8px' }}
                                                >
                                                    <option value="">Choose a weapon...</option>
                                                    {equippedWeapons.map(name => (
                                                        <option key={name} value={name}>{name}</option>
                                                    ))}
                                                </select>
                                            </>
                                        )}

                                        {wInfo && (
                                            <div className="skill-info-box" style={{ marginBottom: '12px', padding: '10px', borderRadius: '6px', fontSize: '13px' }}>
                                                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{wInfo.moveName} <span style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>({wInfo.moveType})</span></div>
                                                <div>Accuracy: 1d20 +{atkMod} (ATK) vs target DEF</div>
                                                <div style={{ marginTop: '2px' }}>Damage on hit: 2d6 +{atkMod} (ATK)</div>
                                                <div style={{ marginTop: '4px', color: 'var(--text-muted)', fontSize: '12px' }}>Natural 20 = crit (max dice). At-Will.</div>
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#667eea', whiteSpace: 'nowrap' }}>vs DEF:</label>
                                            <input
                                                type="number" min="1" max="20"
                                                value={trainerAcOverride}
                                                onChange={(e) => setTrainerAcOverride(e.target.value)}
                                                placeholder="—"
                                                style={{ width: '60px', padding: '4px 8px', borderRadius: '4px', border: trainerAcOverride !== '' ? '2px solid #667eea' : '1px solid var(--border-medium)', fontSize: '13px', textAlign: 'center' }}
                                            />
                                            {trainerAcOverride !== '' && (
                                                <button onClick={() => setTrainerAcOverride('')} style={{ padding: '4px 8px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                                            )}
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Leave blank = always hit</span>
                                        </div>

                                        <button
                                            onClick={rollTrainerAttack}
                                            disabled={!selectedWeapon}
                                            style={{ width: '100%', padding: '15px', background: selectedWeapon ? 'linear-gradient(135deg, #b71c1c, #e53935)' : '#ccc', color: selectedWeapon ? 'white' : '#555', border: 'none', borderRadius: '8px', cursor: selectedWeapon ? 'pointer' : 'not-allowed', fontSize: '16px', fontWeight: 'bold' }}
                                        >
                                            Roll Weapon Attack!
                                        </button>
                                    </>
                                );
                            })()}
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
