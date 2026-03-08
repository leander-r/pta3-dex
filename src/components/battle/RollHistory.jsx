import React, { useState, useRef, useEffect } from 'react';
import { getTypeColor } from '../../utils/typeUtils.js';
import { useModal } from '../../contexts/index.js';
import toast from '../../utils/toast.js';

const RollHistory = ({ rollHistory, setRollHistory }) => {
    const { showConfirm } = useModal();
    const [showExportOptions, setShowExportOptions] = useState(false);
    const exportDropdownRef = useRef(null);

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
                    const acTarget = roll.moveAC != null ? `vs ${roll.moveAC}` : '(no target set)';
                    lines.push(`  Accuracy: ${roll.modifiedAccRoll ?? roll.accRoll ?? '?'} ${acTarget} → ${hit}${crit}`);
                    if (roll.isHit && roll.dice) {
                        const db = roll.diceBonus ?? 0;
                        const notation = db ? `${roll.dice}+${db}` : roll.dice;
                        const parts = [`[${(roll.rolls || []).join(', ')}] = ${roll.diceTotal ?? 0}`];
                        if (db)               parts.push(`${db} (base)`);
                        if (roll.statBonus)   parts.push(`${roll.statBonus} (stat)`);
                        if (roll.stabBonus)   parts.push(`${roll.stabBonus} (STAB)`);
                        lines.push(`  Damage: ${notation}: ${parts.join(' + ')} = ${roll.total ?? 0}`);
                    }
                } else {
                    lines.push(`  Status move — ${roll.isHit ? 'HIT' : 'MISS'}`);
                }
            } else if (roll.type === 'trainer_skill') {
                lines.push(`[${hhmm}] Trainer rolled ${roll.skill || 'Skill'} → ${roll.total ?? '?'} ([${(roll.rolls || []).join(', ')}])`);
            } else if (roll.type === 'pokemon_skill') {
                lines.push(`[${hhmm}] ${roll.pokemon} rolled ${roll.skill} → ${roll.total ?? '?'} ([${(roll.rolls || []).join(', ')}])`);
            } else if (roll.type === 'trainer_attack') {
                const hit = roll.isHit ? 'HIT' : 'MISS';
                const crit = roll.isCrit ? ' (CRIT!)' : '';
                const acTarget = roll.moveAC != null ? `vs DEF ${roll.moveAC}` : '(no target set)';
                lines.push(`[${hhmm}] Trainer used ${roll.moveName || 'Attack'} — Acc: ${roll.modifiedAccRoll} ${acTarget} → ${hit}${crit}`);
                if (roll.isHit) lines.push(`  Damage: [${(roll.rolls || []).join(', ')}] + ${roll.atkMod} (ATK) = ${roll.total}`);
            } else if (roll.type === 'custom') {
                lines.push(`[${hhmm}] Custom ${roll.dice || '?'} → [${(roll.rolls || []).join(', ')}] = ${roll.total ?? '?'}`);
            }
            lines.push('');
        }
        return lines.join('\n');
    };

    const handleCopyLog = async () => {
        try {
            await navigator.clipboard.writeText(formatRollLog());
            toast.success('Battle log copied to clipboard!');
        } catch {
            toast.error('Could not copy to clipboard.');
        }
        setShowExportOptions(false);
    };

    const handleDownloadLog = () => {
        const blob = new Blob([formatRollLog()], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pta-battle-log-${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        setShowExportOptions(false);
    };

    useEffect(() => {
        const handler = (e) => {
            if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
                setShowExportOptions(false);
            }
        };
        if (showExportOptions) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showExportOptions]);

    return (
        <div className="section-card-purple">
            <h3 className="section-title-purple">
                <span>📜</span> Roll History
                {rollHistory.length > 0 && (
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <div ref={exportDropdownRef} style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowExportOptions(v => !v)}
                                style={{ padding: '4px 8px', background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                            >
                                Export Log
                            </button>
                            {showExportOptions && (
                                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: 'var(--card-bg, #fff)', border: '1px solid var(--border-medium)', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', minWidth: '160px', zIndex: 100, overflow: 'hidden' }}>
                                    <button onClick={handleCopyLog} style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }} className="pokemon-import-option">
                                        📋 Copy as text
                                    </button>
                                    <button onClick={handleDownloadLog} style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }} className="pokemon-import-option">
                                        💾 Download .txt
                                    </button>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                if (rollHistory.length > 3) {
                                    showConfirm({ title: 'Clear History', message: `Clear ${rollHistory.length} rolls from history?`, danger: true, confirmLabel: 'Clear', onConfirm: () => setRollHistory([]) });
                                } else {
                                    setRollHistory([]);
                                }
                            }}
                            style={{ padding: '4px 8px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
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
                                padding: '10px', marginBottom: '8px', borderRadius: '6px',
                                borderLeft: `4px solid ${
                                    roll.type === 'pokemon'         ? getTypeColor(roll.moveType || 'Normal') :
                                    roll.type === 'trainer_skill'   ? '#667eea' :
                                    roll.type === 'pokemon_skill'   ? '#26a69a' :
                                    roll.type === 'trainer_attack'  ? getTypeColor(roll.moveType || 'Normal') :
                                    roll.type === 'heal'            ? '#4caf50' : '#95a5a6'
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
                                    <div style={{ fontSize: '12px', padding: '4px 8px', background: roll.isHit ? (roll.isCrit ? 'var(--roll-crit-bg)' : 'var(--roll-hit-bg)') : 'var(--roll-miss-bg)', borderRadius: '4px', marginBottom: '4px', display: 'inline-block' }}>
                                        <span style={{ fontWeight: 'bold' }}>AC Roll: </span>
                                        <span style={{ fontWeight: 'bold', color: roll.isCrit ? '#ff6f00' : (roll.isHit ? '#2e7d32' : '#c62828') }}>
                                            {roll.accRoll}
                                            {roll.accModifier !== 0 && (
                                                <span className="text-muted">{roll.accModifier > 0 ? '+' : ''}{roll.accModifier}={roll.modifiedAccRoll}</span>
                                            )}
                                        </span>
                                        <span style={{ color: 'var(--text-secondary)' }}>
                                            {roll.moveAC != null ? ` vs ${roll.moveAC}` : ' (no target set)'}
                                        </span>
                                        {roll.acWasOverridden && <span style={{ color: '#667eea', marginLeft: '4px' }}>(DM)</span>}
                                        {roll.isCrit && <span style={{ color: '#ff6f00', marginLeft: '4px' }}>(Natural 20!)</span>}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                        {roll.isStatus ? (
                                            <span style={{ color: roll.isHit ? '#2e7d32' : '#c62828' }}>
                                                Status Move - {roll.isHit ? 'Effect applies!' : 'No effect'}
                                            </span>
                                        ) : roll.isHit ? (
                                            <>
                                                <span style={{ fontWeight: 'bold', fontSize: '18px', color: 'var(--text-primary)' }}>{roll.total}</span>
                                                <span> damage | [{roll.rolls?.join(', ')}] = {roll.diceTotal}{(roll.diceBonus ?? 0) > 0 ? ` + ${roll.diceBonus} (base)` : ''}{roll.statBonus > 0 ? ` + ${roll.statBonus} (stat)` : ''}{roll.stabBonus > 0 ? ` + ${roll.stabBonus} (STAB)` : ''}</span>
                                            </>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Attack missed - no damage</span>
                                        )}
                                    </div>
                                </>
                            )}
                            {roll.type === 'trainer_attack' && (
                                <>
                                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                        {roll.moveName || 'Attack'}
                                        {roll.weaponName && <span style={{ fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '6px' }}>({roll.weaponName})</span>}
                                        {roll.isCrit && <span style={{ marginLeft: '8px', color: '#c62828' }}>CRITICAL!</span>}
                                        {!roll.isHit && <span style={{ marginLeft: '8px', color: '#f44336', fontWeight: 'bold' }}>MISS!</span>}
                                    </div>
                                    <div style={{ fontSize: '12px', padding: '4px 8px', background: roll.isHit ? (roll.isCrit ? 'var(--roll-crit-bg)' : 'var(--roll-hit-bg)') : 'var(--roll-miss-bg)', borderRadius: '4px', marginBottom: '4px', display: 'inline-block' }}>
                                        <span style={{ fontWeight: 'bold' }}>Acc Roll: </span>
                                        <span style={{ fontWeight: 'bold', color: roll.isCrit ? '#ff6f00' : (roll.isHit ? '#2e7d32' : '#c62828') }}>
                                            {roll.accRoll}
                                            {roll.accModifier !== 0 && <span className="text-muted">{roll.accModifier > 0 ? '+' : ''}{roll.accModifier}={roll.modifiedAccRoll}</span>}
                                        </span>
                                        <span style={{ color: 'var(--text-secondary)' }}>
                                            {roll.moveAC != null ? ` vs DEF ${roll.moveAC}` : ' (no target set)'}
                                        </span>
                                        {roll.isCrit && <span style={{ color: '#ff6f00', marginLeft: '4px' }}>(Natural 20!)</span>}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                        {roll.isHit ? (
                                            <>
                                                <span style={{ fontWeight: 'bold', fontSize: '18px', color: 'var(--text-primary)' }}>{roll.total}</span>
                                                <span> damage | [{roll.rolls?.join(', ')}] = {roll.diceTotal}{roll.atkMod > 0 ? ` + ${roll.atkMod} (ATK)` : ''}</span>
                                            </>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Attack missed — no damage</span>
                                        )}
                                    </div>
                                </>
                            )}
                            {roll.type === 'trainer_skill' && (
                                <>
                                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{roll.skill} ({roll.skillStat})</div>
                                    <div style={{ fontSize: '12px' }}>
                                        <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{roll.total}</span>
                                        <span> | 1d20 [{roll.rolls?.join(', ')}] +{roll.modifier} stat</span>
                                        {roll.hasSkill && roll.bonus > 0 && <span> +{roll.bonus} talent</span>}
                                    </div>
                                </>
                            )}
                            {roll.type === 'pokemon_skill' && (
                                <>
                                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                        {roll.pokemon} — {roll.skill} ({roll.skillStat})
                                    </div>
                                    <div style={{ fontSize: '12px' }}>
                                        <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{roll.total}</span>
                                        <span> | 1d20 [{roll.rolls?.join(', ')}] +{roll.modifier} {roll.skillStat}</span>
                                    </div>
                                </>
                            )}
                            {roll.type === 'custom' && (
                                <>
                                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Custom: {roll.dice}</div>
                                    <div style={{ fontSize: '12px' }}>
                                        <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{roll.total}</span>
                                        <span> | [{roll.rolls?.join(', ')}]</span>
                                        {roll.bonus > 0 && <span> +{roll.bonus}</span>}
                                    </div>
                                </>
                            )}
                            {roll.type === 'heal' && (
                                <>
                                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>🩹 {roll.pokemon} — {roll.item}</div>
                                    <div style={{ fontSize: '12px' }}>
                                        <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#4caf50' }}>+{roll.amount} HP</span>
                                        {roll.rolls?.length > 0 && (
                                            <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                                                {roll.formula}: [{roll.rolls.join(', ')}]{roll.bonus > 0 ? `+${roll.bonus}` : ''} = {roll.amount}
                                            </span>
                                        )}
                                        {roll.rolls?.length === 0 && roll.formula && (
                                            <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>({roll.formula})</span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RollHistory;
