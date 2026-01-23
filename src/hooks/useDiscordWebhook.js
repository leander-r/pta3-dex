// ============================================================
// useDiscordWebhook Hook
// ============================================================
// Discord webhook integration for dice roll sharing

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for Discord webhook integration
 * @returns {Object} - { webhook, setWebhook, sendToDiscord, isConfigured }
 */
export const useDiscordWebhook = () => {
    const [webhook, setWebhook] = useState(() => {
        try {
            const saved = localStorage.getItem('pta-discord-webhook');
            return saved ? JSON.parse(saved) : { url: '', enabled: false, showSettings: false };
        } catch {
            return { url: '', enabled: false, showSettings: false };
        }
    });

    // Save webhook settings to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('pta-discord-webhook', JSON.stringify({
                url: webhook.url,
                enabled: webhook.enabled,
                showSettings: false // Don't persist the open state
            }));
        } catch (e) {
            console.warn('Could not save Discord webhook settings');
        }
    }, [webhook.url, webhook.enabled]);

    /**
     * Send roll result to Discord webhook
     * @param {Object} roll - Roll data
     * @param {string} trainerName - Name of the trainer
     */
    const sendToDiscord = useCallback(async (roll, trainerName = 'Trainer') => {
        if (!webhook.enabled || !webhook.url) return;

        try {
            // Build the embed based on roll type
            let embed = {
                timestamp: new Date().toISOString(),
                footer: { text: `${trainerName} - PTA Manager` }
            };

            // Color based on roll type
            const colors = {
                pokemon: 0xF5A623,      // Orange
                accuracy: 0x3498DB,     // Blue
                trainer: 0x667EEA,      // Purple
                trainer_skill: 0x667EEA,
                trainer_d20: 0x667EEA,
                custom: 0x95A5A6,       // Gray
                pokemonSkill: 0x9B59B6  // Purple
            };
            embed.color = colors[roll.type] || 0x667EEA;

            // Build title and description based on roll type
            if (roll.type === 'pokemon') {
                embed.title = `${roll.pokemon} used ${roll.move}!`;
                embed.fields = [
                    { name: 'Damage Roll', value: `**${roll.total}** damage`, inline: true },
                    { name: 'Accuracy', value: roll.isCrit ? `**${roll.accRoll}** - CRITICAL HIT!` : `**${roll.accRoll}**`, inline: true },
                    { name: 'Dice', value: `${roll.dice} -> [${roll.rolls.join(', ')}] = ${roll.diceTotal}`, inline: false }
                ];

                let breakdown = [];
                if (roll.statBonus) breakdown.push(`+${roll.statBonus} stat`);
                if (roll.stabBonus) breakdown.push(`+${roll.stabBonus} STAB`);
                if (breakdown.length > 0) {
                    embed.fields.push({ name: 'Bonuses', value: breakdown.join(', '), inline: true });
                }

                embed.fields.push({ name: 'Type', value: `${roll.moveType} (${roll.category})`, inline: true });

            } else if (roll.type === 'accuracy') {
                embed.title = `${roll.pokemon} - Accuracy Check`;
                embed.description = roll.isCrit
                    ? `**${roll.total}** - CRITICAL HIT!`
                    : `**${roll.total}**`;

            } else if (roll.type === 'trainer_skill' || roll.type === 'trainer') {
                embed.title = `Trainer Skill: ${roll.skill}`;
                embed.fields = [
                    { name: 'Result', value: `**${roll.total}**`, inline: true },
                    { name: 'Rolls', value: `[${roll.rolls.join(', ')}]`, inline: true }
                ];
                if (roll.hasSkill) {
                    embed.fields.push({ name: 'Trained', value: `+${roll.bonus} bonus`, inline: true });
                }
                if (roll.skillStat) {
                    embed.fields.push({ name: 'Stat', value: roll.skillStat, inline: true });
                }

            } else if (roll.type === 'trainer_d20') {
                embed.title = `Trainer: ${roll.skill}`;
                embed.description = `Rolled **${roll.total}** on d20`;

            } else if (roll.type === 'pokemonSkill') {
                embed.title = `${roll.pokemon} - ${roll.skill}`;
                embed.fields = [
                    { name: 'Result', value: `**${roll.total}**`, inline: true },
                    { name: 'Dice', value: `${roll.dice} -> [${roll.rolls.join(', ')}]`, inline: true }
                ];
                if (roll.modifier) {
                    embed.fields.push({ name: 'Modifier', value: `+${roll.modifier}`, inline: true });
                }

            } else if (roll.type === 'custom') {
                embed.title = `Custom Roll: ${roll.dice}`;
                embed.fields = [
                    { name: 'Result', value: `**${roll.total}**`, inline: true },
                    { name: 'Rolls', value: `[${roll.rolls.join(', ')}]`, inline: true }
                ];
            }

            // Send to Discord
            await fetch(webhook.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: 'PTA Dice Roller',
                    avatar_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
                    embeds: [embed]
                })
            });

        } catch (error) {
            console.error('Failed to send to Discord:', error);
        }
    }, [webhook.enabled, webhook.url]);

    // Update webhook settings
    const updateWebhook = useCallback((updates) => {
        setWebhook(prev => ({ ...prev, ...updates }));
    }, []);

    // Toggle settings visibility
    const toggleSettings = useCallback(() => {
        setWebhook(prev => ({ ...prev, showSettings: !prev.showSettings }));
    }, []);

    return {
        webhook,
        setWebhook,
        updateWebhook,
        toggleSettings,
        sendToDiscord,
        isConfigured: webhook.enabled && webhook.url
    };
};

export default useDiscordWebhook;
