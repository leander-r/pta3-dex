// ============================================================
// Pokemon Sprite Picker
// ============================================================
// Shared "which Pokémon" control for the Dice Roller (Pokémon mode)
// and the Heal panel. Renders every party member as a tappable
// sprite chip instead of a native <select> — lets the whole
// party's HP be seen at a glance and takes one tap to select,
// rather than open-dropdown-then-tap-row.

import React, { useState } from 'react';
import { getPokemonDisplayImage } from '../../utils/pokemonSprite.js';

const hpColor = (current, max) => {
    if (max <= 0) return '#4caf50';
    const percent = (current / max) * 100;
    return percent > 50 ? '#4caf50' : percent > 25 ? '#ff9800' : '#f44336';
};

const SpriteThumb = ({ pokemon, size, faded }) => {
    const [broken, setBroken] = useState(false);
    const img = !broken && getPokemonDisplayImage(pokemon);
    return img ? (
        <img
            src={img}
            alt=""
            onError={() => setBroken(true)}
            style={{
                width: `${size}px`, height: `${size}px`, borderRadius: '50%',
                objectFit: 'cover', flexShrink: 0,
                filter: faded ? 'grayscale(1)' : 'none',
                opacity: faded ? 0.6 : 1
            }}
        />
    ) : (
        <div style={{
            width: `${size}px`, height: `${size}px`, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: `${Math.round(size * 0.5)}px`,
            filter: faded ? 'grayscale(1)' : 'none',
            opacity: faded ? 0.6 : 1
        }}>🔴</div>
    );
};

/**
 * PokemonSpritePicker — horizontal strip of sprite chips for picking one party Pokémon.
 * @param {Array} party - active party Pokémon
 * @param {number|null} selectedId - currently selected Pokémon id
 * @param {(id:number)=>void} onSelect
 * @param {(pokemon)=>{current:number,max:number}} getHP - caller-supplied HP calc
 */
const PokemonSpritePicker = ({ party, selectedId, onSelect, getHP }) => {
    if (!party || party.length === 0) {
        return (
            <div style={{
                padding: '16px', textAlign: 'center', fontSize: '13px',
                color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '6px'
            }}>
                No Pokémon in party — add one from the Pokémon tab.
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', flexWrap: 'nowrap', paddingBottom: '4px' }}>
            {party.map(poke => {
                const { current, max } = getHP(poke);
                const fainted = current <= 0;
                const isSelected = poke.id === selectedId;
                const color = hpColor(current, max);
                return (
                    <button
                        key={poke.id}
                        onClick={() => onSelect(poke.id)}
                        aria-pressed={isSelected}
                        title={`${poke.name || poke.species} — ${current}/${max} HP${fainted ? ' (fainted)' : ''}`}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                            flexShrink: 0, width: '76px', padding: '8px 6px',
                            borderRadius: '10px', cursor: 'pointer',
                            background: isSelected ? 'rgba(102,126,234,0.12)' : 'var(--bg-secondary)',
                            border: isSelected ? '2px solid #667eea' : '2px solid transparent'
                        }}
                    >
                        <SpriteThumb pokemon={poke} size={40} faded={fainted} />
                        <span style={{
                            fontSize: '11px', fontWeight: 'bold', color: 'var(--text-primary)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%'
                        }}>
                            {poke.name || poke.species}
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', color }}>
                            {fainted ? 'Fainted' : `${current}/${max} HP`}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default PokemonSpritePicker;
