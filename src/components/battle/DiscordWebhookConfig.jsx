import React, { useState } from 'react';
import { useData } from '../../contexts/index.js';
import toast from '../../utils/toast.js';

const DiscordWebhookConfig = () => {
    const { discordWebhook, setDiscordWebhook } = useData();
    const [expanded, setExpanded] = useState(false);

    return (
        <div style={{
            marginTop: '20px',
            background: expanded ? '#36393f' : '#5865F2',
            borderRadius: '8px',
            overflow: 'hidden',
            transition: 'all 0.2s ease'
        }}>
            {/* Header — always visible */}
            <div
                onClick={() => setExpanded(!expanded)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', cursor: 'pointer', background: '#5865F2' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="20" height="15" viewBox="0 0 24 18" fill="white">
                        <path d="M20.317 1.492a19.7 19.7 0 0 0-4.885-1.48.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.7 19.7 0 0 0 3.677 1.492a.07.07 0 0 0-.032.027C.533 6.093-.32 10.555.099 14.961a.08.08 0 0 0 .031.055 19.9 19.9 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.3 13.3 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 12.278c-1.183 0-2.157-1.068-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.068-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
                    </svg>
                    <span style={{ fontWeight: 'bold', fontSize: '13px', color: 'white' }}>Discord</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {!expanded && (
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Tap to configure</span>
                    )}
                    <div
                        onClick={(e) => { e.stopPropagation(); setDiscordWebhook(prev => ({ ...prev, enabled: !prev?.enabled })); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '4px 10px',
                            background: discordWebhook?.enabled ? '#57F287' : 'rgba(255,255,255,0.2)',
                            borderRadius: '12px', cursor: 'pointer', transition: 'background 0.2s ease'
                        }}
                    >
                        <span style={{ fontSize: '12px', color: discordWebhook?.enabled ? '#000' : '#fff', fontWeight: 'bold' }}>
                            {discordWebhook?.enabled ? 'ON' : 'OFF'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Expanded content */}
            {expanded && (
                <div style={{ padding: '12px', background: '#36393f' }}>
                    <div style={{ fontSize: '12px', color: '#b9bbbe', marginBottom: '10px', lineHeight: '1.4' }}>
                        Send dice rolls to a Discord channel via webhook.
                        <br />
                        <span style={{ fontSize: '12px', color: '#72767d' }}>
                            Server Settings → Integrations → Webhooks → New Webhook
                        </span>
                        <div style={{ marginTop: '8px', padding: '8px 10px', background: 'rgba(250,166,26,0.15)', border: '1px solid rgba(250,166,26,0.4)', borderRadius: '4px', fontSize: '12px', color: '#FAA61A', lineHeight: '1.4' }}>
                            ⚠️ Your webhook URL is stored in plain text in your browser's localStorage and is visible to anyone with access to your browser's Developer Tools. Do not use this on a shared or public computer.
                        </div>
                    </div>
                    <input
                        type="text"
                        placeholder="Paste webhook URL..."
                        value={discordWebhook?.url || ''}
                        onChange={(e) => setDiscordWebhook(prev => ({ ...prev, url: e.target.value }))}
                        onBlur={(e) => {
                            const url = e.target.value.trim();
                            if (url && !/^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+/.test(url)) {
                                toast.warning('That doesn\'t look like a valid Discord webhook URL.');
                            }
                        }}
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: 'none', fontSize: '13px', background: '#40444b', color: '#dcddde', marginBottom: '10px' }}
                    />
                    <button
                        onClick={() => {
                            if (!discordWebhook?.url) { toast.warning('Please enter a webhook URL first'); return; }
                            fetch(discordWebhook.url, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ embeds: [{ title: '🎲 Test Message', description: 'Discord webhook is working! Dice rolls will appear here.', color: 0x5865F2 }] })
                            })
                            .then(res => res.ok
                                ? toast.success('Test message sent! Check your Discord channel.')
                                : toast.error('Failed to send. Check if the webhook URL is correct.'))
                            .catch(() => toast.error('Failed to send. Check the webhook URL.'));
                        }}
                        style={{ width: '100%', padding: '10px', background: '#5865F2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                    >
                        Send Test Message
                    </button>
                    {discordWebhook?.enabled && discordWebhook?.url && (
                        <div style={{ fontSize: '12px', color: '#57F287', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>●</span> Connected - rolls will be sent to Discord
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DiscordWebhookConfig;
