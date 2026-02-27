// ============================================================
// useDiscordWebhook Hook
// ============================================================
// Discord webhook integration for dice roll sharing

import { useState, useEffect, useCallback } from 'react';
import toast from '../utils/toast.js';

// ── Helpers ─────────────────────────────────────────────────

const hpBar = (current, max, blocks = 10) => {
    const pct = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
    const filled = Math.round(pct * blocks);
    return '█'.repeat(filled) + '░'.repeat(blocks - filled);
};

const STATUS_EMOJI = {
    burned: '🔥', frozen: '🧊', paralyzed: '⚡', poisoned: '☠️',
    asleep: '💤', confused: '💫', flinched: '😵', fainted: '✖️',
};

// ── Embed builders ────────────────────────────────────────────

const buildPokemonEmbed = (roll, trainerName) => {
    const hit  = roll.isHit;
    const crit = roll.isCrit;
    const miss = !hit;

    // Pick title icon and suffix
    const icon   = miss ? '❌' : crit ? '💥' : roll.isStatus ? '✨' : '⚔️';
    const suffix = miss ? '— MISS' : crit ? '— CRITICAL HIT!' : '';
    const title  = `${icon} ${roll.pokemon} used ${roll.move}! ${suffix}`.trim();

    // Color: gray on miss, amber on crit, type color otherwise
    const color = miss ? 0x95A5A6 : crit ? 0xFF6F00 : (roll.typeColor || 0xF5A623);

    const fields = [];

    // Accuracy / Hit row
    if (crit) {
        fields.push({ name: '🎯 Accuracy', value: `Natural 20! (vs AC ${roll.moveAC}${roll.acWasOverridden ? ' — DM' : ''})`, inline: true });
    } else {
        const mod = roll.accModifier !== 0
            ? ` ${roll.accModifier > 0 ? '+' : ''}${roll.accModifier} = **${roll.modifiedAccRoll}**`
            : '';
        const acText = `**${roll.accRoll}**${mod} vs AC ${roll.moveAC}${roll.acWasOverridden ? ' *(DM)*' : ''}`;
        fields.push({ name: hit ? '✅ Hit' : '✗ Miss', value: acText, inline: true });
    }

    // Move type
    fields.push({ name: 'Move', value: `${roll.moveType} · ${roll.category}`, inline: true });

    // Status move result
    if (roll.isStatus) {
        fields.push({ name: 'Effect', value: hit ? 'Effect applies!' : 'No effect', inline: true });
    }

    // Damage (hit, non-status only)
    if (hit && !roll.isStatus && roll.dice) {
        const bonuses = [];
        if (roll.statBonus) bonuses.push(`+${roll.statBonus} stat`);
        if (roll.stabBonus) bonuses.push(`+${roll.stabBonus} STAB`);
        const diceStr = `${roll.dice}: [${roll.rolls.join(', ')}] = ${roll.diceTotal}`;
        const bonusStr = bonuses.length ? ` ${bonuses.join(' ')}` : '';
        fields.push({
            name: crit ? '🎲 Damage (Crit — double dice)' : '🎲 Damage',
            value: `${diceStr}${bonusStr}\n**${roll.total} damage total**`,
            inline: false,
        });
    }

    // Attacker HP bar
    if (roll.attackerMaxHP > 0) {
        const bar = hpBar(roll.attackerCurrentHP, roll.attackerMaxHP);
        fields.push({
            name: `${roll.pokemon} HP`,
            value: `\`${bar}\` ${roll.attackerCurrentHP}/${roll.attackerMaxHP}`,
            inline: true,
        });
    }

    // Status conditions
    if (roll.activeStatuses?.length > 0) {
        fields.push({
            name: 'Status',
            value: roll.activeStatuses.map(s => `${STATUS_EMOJI[s] || '•'} ${s}`).join('  '),
            inline: true,
        });
    }

    // Mega form
    if (roll.megaEvolved && roll.megaFormName) {
        fields.push({ name: 'Mega', value: roll.megaFormName, inline: true });
    }

    return { title, color, fields, timestamp: new Date().toISOString(), footer: { text: `${trainerName} · PTA Manager` } };
};

const buildTrainerSkillEmbed = (roll, trainerName) => {
    const fields = [
        { name: 'Result', value: `**${roll.total}**`, inline: true },
        { name: 'Rolls', value: `[${roll.rolls.join(', ')}]`, inline: true },
        { name: 'Stat mod', value: `${roll.modifier >= 0 ? '+' : ''}${roll.modifier} (${roll.skillStat})`, inline: true },
    ];
    if (roll.hasSkill) {
        fields.push({ name: 'Trained bonus', value: `+${roll.bonus}`, inline: true });
    }
    if (roll.trainerMaxHP > 0) {
        const bar = hpBar(roll.trainerCurrentHP, roll.trainerMaxHP);
        fields.push({
            name: 'Trainer HP',
            value: `\`${bar}\` ${roll.trainerCurrentHP}/${roll.trainerMaxHP}`,
            inline: false,
        });
    }
    return {
        title: `📚 ${roll.skill}`,
        color: 0x667EEA,
        fields,
        timestamp: new Date().toISOString(),
        footer: { text: `${trainerName} · PTA Manager` },
    };
};

const buildHealEmbed = (roll, trainerName) => {
    const fields = [];

    if (roll.rolls?.length > 0) {
        const bonusPart = roll.bonus > 0 ? ` + ${roll.bonus}` : '';
        fields.push({ name: '🎲 Roll', value: `${roll.formula}: [${roll.rolls.join(', ')}]${bonusPart} = **${roll.amount}**`, inline: false });
    } else if (roll.formula) {
        fields.push({ name: 'Formula', value: roll.formula, inline: true });
    }

    fields.push({ name: 'Healed', value: `**+${roll.amount} HP**`, inline: true });

    if (roll.hpMax > 0) {
        const barBefore = hpBar(roll.hpBefore ?? roll.hpAfter, roll.hpMax);
        const barAfter  = hpBar(roll.hpAfter  ?? roll.hpBefore, roll.hpMax);
        fields.push({
            name: `${roll.pokemon} HP`,
            value: `Before: \`${barBefore}\` ${roll.hpBefore}/${roll.hpMax}\nAfter:  \`${barAfter}\` ${roll.hpAfter}/${roll.hpMax}${roll.hpAfter >= roll.hpMax ? ' ✨ Full!' : ''}`,
            inline: false,
        });
    }

    return {
        title: `🩹 ${roll.pokemon} used ${roll.item}`,
        color: 0x4CAF50,
        fields,
        timestamp: new Date().toISOString(),
        footer: { text: `${trainerName} · PTA Manager` },
    };
};

const buildCustomEmbed = (roll, trainerName) => ({
    title: `🎲 Custom Roll: ${roll.dice}`,
    color: 0x95A5A6,
    fields: [
        { name: 'Result', value: `**${roll.total}**`, inline: true },
        { name: 'Rolls', value: `[${roll.rolls.join(', ')}]`, inline: true },
        ...(roll.bonus ? [{ name: 'Bonus', value: `+${roll.bonus}`, inline: true }] : []),
    ],
    timestamp: new Date().toISOString(),
    footer: { text: `${trainerName} · PTA Manager` },
});

// ── Hook ──────────────────────────────────────────────────────

export const useDiscordWebhook = () => {
    const [webhook, setWebhook] = useState(() => {
        try {
            const saved = localStorage.getItem('pta-discord-webhook');
            return saved ? JSON.parse(saved) : { url: '', enabled: false, showSettings: false };
        } catch {
            return { url: '', enabled: false, showSettings: false };
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('pta-discord-webhook', JSON.stringify({
                url: webhook.url,
                enabled: webhook.enabled,
                showSettings: false,
            }));
        } catch {
            console.warn('Could not save Discord webhook settings');
        }
    }, [webhook.url, webhook.enabled]);

    const sendToDiscord = useCallback(async (roll, trainerName = 'Trainer') => {
        if (!webhook.enabled || !webhook.url) return;

        try {
            let embed;
            if (roll.type === 'pokemon')       embed = buildPokemonEmbed(roll, trainerName);
            else if (roll.type === 'trainer_skill') embed = buildTrainerSkillEmbed(roll, trainerName);
            else if (roll.type === 'heal')      embed = buildHealEmbed(roll, trainerName);
            else if (roll.type === 'custom')    embed = buildCustomEmbed(roll, trainerName);
            else return; // Unknown type — skip

            const res = await fetch(webhook.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: 'PTA Dice Roller',
                    avatar_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
                    embeds: [embed],
                }),
            });

            if (!res.ok) {
                const msg = res.status === 401 || res.status === 403
                    ? 'Discord webhook rejected. Check your webhook URL.'
                    : `Discord send failed (${res.status}). Check your webhook URL.`;
                toast.error(msg);
                console.error('Discord webhook error:', res.status, res.statusText);
            }
        } catch (error) {
            console.error('Failed to send to Discord:', error);
            toast.error('Could not reach Discord. Check your internet connection.');
        }
    }, [webhook.enabled, webhook.url]);

    const updateWebhook = useCallback((updates) => {
        setWebhook(prev => ({ ...prev, ...updates }));
    }, []);

    const toggleSettings = useCallback(() => {
        setWebhook(prev => ({ ...prev, showSettings: !prev.showSettings }));
    }, []);

    return {
        webhook,
        setWebhook,
        updateWebhook,
        toggleSettings,
        sendToDiscord,
        isConfigured: webhook.enabled && webhook.url,
    };
};

export default useDiscordWebhook;
