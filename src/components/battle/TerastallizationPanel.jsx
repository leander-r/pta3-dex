import React from 'react';
import { TERA_CROWN_TABLE } from '../../data/constants.js';
import { getTypeColor } from '../../utils/typeUtils.js';

const TerastallizationPanel = ({ selectedPokemon, isTerastallized, teraBlastUsesLeft, onActivate, onRevert, onTeraBlastRoll, disabled }) => {
    if (!selectedPokemon) return null;

    const teraType = selectedPokemon.teraType || '';
    const crownData = teraType ? TERA_CROWN_TABLE[teraType] || null : null;

    const panelStyle = {
        marginBottom: '12px', padding: '10px', borderRadius: '8px',
        background: isTerastallized
            ? 'linear-gradient(135deg, #e8a000 0%, #b36b00 100%)'
            : 'linear-gradient(135deg, #c78600 0%, #e8a000 100%)',
        opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto'
    };

    if (!teraType) {
        return (
            <div style={panelStyle}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>Terastallization</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                    No Tera Type set — configure in the Pokémon tab.
                </div>
            </div>
        );
    }

    const typeColor = getTypeColor(teraType);

    return (
        <div style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'white' }}>Terastallization</span>
                    <span style={{ padding: '2px 8px', borderRadius: '10px', background: typeColor, color: 'white', fontSize: '11px', fontWeight: 'bold' }}>
                        {teraType}
                    </span>
                    {isTerastallized && (
                        <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', color: 'white' }}>
                            Active
                        </span>
                    )}
                </div>
                {!isTerastallized ? (
                    <button
                        onClick={onActivate}
                        style={{ padding: '6px 12px', background: 'white', color: '#c78600', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                    >
                        Terastallize
                    </button>
                ) : (
                    <button
                        onClick={onRevert}
                        style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                    >
                        Revert
                    </button>
                )}
            </div>

            {isTerastallized && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.9)' }}>
                    {/* Stat bonuses */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '8px' }}>DEF +3</span>
                        <span style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '8px' }}>SDEF +3</span>
                        <span style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '8px' }}>
                            Tera Aura: all {teraType}-type moves get STAB
                        </span>
                    </div>

                    {/* Tera Crown */}
                    {crownData && (
                        <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '6px', padding: '8px', marginBottom: '8px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Tera Crown — {teraType}</div>
                            <div style={{ opacity: 0.85 }}>
                                Skill: <strong>{crownData.skill}</strong>
                            </div>
                            <div style={{ opacity: 0.85, marginTop: '2px' }}>
                                At-Will: <strong>{crownData.move}</strong> — {crownData.range} — {crownData.damage} {crownData.category}
                            </div>
                        </div>
                    )}

                    {/* Tera Blast */}
                    <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '6px', padding: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 'bold' }}>Tera Blast</span>
                            <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '8px' }}>
                                {teraBlastUsesLeft}/3 remaining
                            </span>
                        </div>
                        <div style={{ opacity: 0.85, marginBottom: '6px' }}>
                            Ranged (40ft) — 3d12 — {teraType}-type — uses higher of ATK/SATK
                        </div>
                        <button
                            onClick={() => teraBlastUsesLeft > 0 && onTeraBlastRoll()}
                            disabled={teraBlastUsesLeft === 0}
                            style={{
                                width: '100%', padding: '7px', borderRadius: '6px', border: 'none',
                                background: teraBlastUsesLeft > 0 ? 'white' : 'rgba(255,255,255,0.15)',
                                color: teraBlastUsesLeft > 0 ? '#c78600' : 'rgba(255,255,255,0.5)',
                                fontWeight: 'bold', fontSize: '13px', cursor: teraBlastUsesLeft > 0 ? 'pointer' : 'not-allowed'
                            }}
                        >
                            {teraBlastUsesLeft > 0 ? 'Roll Tera Blast (3d12)' : 'Tera Blast Exhausted'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TerastallizationPanel;
