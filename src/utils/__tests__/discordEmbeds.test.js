import { describe, it, expect } from 'vitest';
import { buildEmbed, buildPokemonEmbed, buildTrainerSkillEmbed, buildHealEmbed, buildCustomEmbed, buildPokemonSkillEmbed } from '../discordEmbeds.js';

// ── Shared roll fixtures ──────────────────────────────────────

const BASE_POKEMON_HIT = {
    type: 'pokemon',
    pokemon: 'Rowdy', move: 'High Horsepower', moveType: 'Ground', category: 'Physical',
    accRoll: 6, accModifier: 0, modifiedAccRoll: 6, moveAC: 2, acWasOverridden: false,
    isHit: true, isCrit: false, isStatus: false,
    // PTA3: statBonus = ⌊ATK/2⌋ (ATK=8 → 4); total = diceTotal + statBonus + stabBonus
    dice: '4d12', rolls: [9, 12, 8, 8], diceTotal: 37, statBonus: 4, stabBonus: 4, total: 45,
    typeColor: 0xE2BF65,
    attackerCurrentHP: 35, attackerMaxHP: 50,
    activeStatuses: [],
    megaEvolved: false, megaFormName: null,
};

const BASE_POKEMON_MISS = {
    ...BASE_POKEMON_HIT,
    accRoll: 1, modifiedAccRoll: 1,
    isHit: false, isCrit: false,
    rolls: [], diceTotal: 0, statBonus: 0, stabBonus: 0, total: 0,
};

const BASE_POKEMON_CRIT = {
    ...BASE_POKEMON_HIT,
    accRoll: 20, modifiedAccRoll: 20, isCrit: true,
    // PTA3: crit = all dice at max value (not double dice count)
    dice: '4d12', rolls: [12, 12, 12, 12], diceTotal: 48, total: 56,
};

const BASE_TRAINER_SKILL = {
    type: 'trainer_skill',
    skill: 'Perception', skillStat: 'SPD',  // PTA3: stat names are ATK/DEF/SATK/SDEF/SPD
    rolls: [10], modifier: 3, hasSkill: true, bonus: 5, total: 18, // PTA3: 1d20; 10+3+5=18
    trainerCurrentHP: 20, trainerMaxHP: 24, // PTA3: 20 base + 1d4 roll
};

const BASE_HEAL = {
    type: 'heal',
    pokemon: 'Rowdy', item: 'Potion',
    formula: '2d6+5', rolls: [4, 6], bonus: 5, amount: 20,
    hpBefore: 25, hpAfter: 45, hpMax: 50,
};

const BASE_CUSTOM = {
    type: 'custom',
    dice: '2d6', rolls: [3, 5], rollTotal: 8, bonus: 2, total: 10,
};

const BASE_POKEMON_SKILL = {
    type: 'pokemon_skill',
    pokemon: 'Rowdy', skill: 'Stealth', skillStat: 'SPD',
    rolls: [14], modifier: 4, total: 18,
    pokemonCurrentHP: 35, pokemonMaxHP: 50,
};

// ── buildEmbed router ─────────────────────────────────────────

describe('buildEmbed', () => {
    it('routes pokemon type', () => {
        const e = buildEmbed(BASE_POKEMON_HIT, 'Ash');
        expect(e).not.toBeNull();
        expect(e.title).toContain('High Horsepower');
    });

    it('routes trainer_skill type', () => {
        const e = buildEmbed(BASE_TRAINER_SKILL, 'Ash');
        expect(e.title).toContain('Perception');
    });

    it('routes pokemon_skill type', () => {
        const e = buildEmbed(BASE_POKEMON_SKILL, 'Ash');
        expect(e.title).toContain('Stealth');
    });

    it('routes heal type', () => {
        const e = buildEmbed(BASE_HEAL, 'Ash');
        expect(e.title).toContain('Potion');
    });

    it('routes custom type', () => {
        const e = buildEmbed(BASE_CUSTOM, 'Ash');
        expect(e.title).toContain('2d6');
    });

    it('returns null for unknown type', () => {
        expect(buildEmbed({ type: 'unknown' }, 'Ash')).toBeNull();
    });
});

// ── Pokemon embeds ────────────────────────────────────────────

describe('buildPokemonEmbed — hit', () => {
    const embed = buildPokemonEmbed(BASE_POKEMON_HIT, 'Ash');

    it('title contains pokemon and move', () => {
        expect(embed.title).toContain('Rowdy');
        expect(embed.title).toContain('High Horsepower');
    });

    it('title has hit icon', () => {
        expect(embed.title).toMatch(/^⚔️/);
    });

    it('uses type color', () => {
        expect(embed.color).toBe(0xE2BF65);
    });

    it('description shows hit accuracy and type', () => {
        expect(embed.description).toContain('✅ Hit');
        expect(embed.description).toContain('6');
        expect(embed.description).toContain('AC 2');
        expect(embed.description).toContain('Ground');
        expect(embed.description).toContain('Physical');
    });

    it('description shows damage total', () => {
        expect(embed.description).toContain('45 damage');
    });

    it('shows damage breakdown field', () => {
        const dmgField = embed.fields.find(f => f.name.includes('Damage'));
        expect(dmgField).toBeTruthy();
        expect(dmgField.value).toContain('4 (stat)');
        expect(dmgField.value).toContain('4 (STAB)');
        expect(dmgField.value).toContain('= **45**');
    });

    it('shows HP bar field', () => {
        const hpField = embed.fields.find(f => f.name === 'Rowdy HP');
        expect(hpField).toBeTruthy();
        expect(hpField.value).toContain('35/50');
    });

    it('HP bar uses block characters', () => {
        const hpField = embed.fields.find(f => f.name === 'Rowdy HP');
        expect(hpField.value).toMatch(/█/);
        expect(hpField.value).toMatch(/░/);
    });

    it('no status field when no active statuses', () => {
        const fieldNames = embed.fields.map(f => f.name);
        expect(fieldNames).not.toContain('Status');
    });

    it('no mega field when not mega evolved', () => {
        const fieldNames = embed.fields.map(f => f.name);
        expect(fieldNames).not.toContain('Mega');
    });

    it('author name is trainer name', () => {
        expect(embed.author.name).toBe('Ash');
    });

    it('no thumbnail when pokemonSpriteUrl is absent', () => {
        expect(embed.thumbnail).toBeUndefined();
    });
});

describe('buildPokemonEmbed — with sprite URL', () => {
    const roll  = { ...BASE_POKEMON_HIT, pokemonSpriteUrl: 'https://example.com/1.png' };
    const embed = buildPokemonEmbed(roll, 'Ash');

    it('thumbnail uses pokemonSpriteUrl', () => {
        expect(embed.thumbnail).toBeDefined();
        expect(embed.thumbnail.url).toBe('https://example.com/1.png');
    });
});

describe('buildPokemonEmbed — miss', () => {
    const embed = buildPokemonEmbed(BASE_POKEMON_MISS, 'Ash');

    it('title has miss icon', () => {
        expect(embed.title).toMatch(/^❌/);
    });

    it('description shows miss', () => {
        expect(embed.description).toContain('✗ Miss');
    });

    it('uses gray color', () => {
        expect(embed.color).toBe(0x95A5A6);
    });

    it('has no damage field', () => {
        expect(embed.fields.find(f => f.name.includes('Damage'))).toBeUndefined();
    });

    it('still shows HP bar', () => {
        expect(embed.fields.find(f => f.name === 'Rowdy HP')).toBeTruthy();
    });
});

describe('buildPokemonEmbed — crit', () => {
    const embed = buildPokemonEmbed(BASE_POKEMON_CRIT, 'Ash');

    it('title has crit icon and suffix', () => {
        expect(embed.title).toMatch(/^💥/);
        expect(embed.title).toContain('CRITICAL HIT');
    });

    it('uses amber color', () => {
        expect(embed.color).toBe(0xFF6F00);
    });

    it('description shows Natural 20', () => {
        expect(embed.description).toContain('Natural 20');
    });

    it('damage field label mentions Crit', () => {
        const dmgField = embed.fields.find(f => f.name.includes('Damage'));
        expect(dmgField.name).toContain('Crit');
    });
});

describe('buildPokemonEmbed — status move hit', () => {
    const roll  = { ...BASE_POKEMON_HIT, isStatus: true, dice: null, rolls: [], diceTotal: 0, statBonus: 0, stabBonus: 0, total: 0 };
    const embed = buildPokemonEmbed(roll, 'Ash');

    it('title has status icon', () => {
        expect(embed.title).toMatch(/^✨/);
    });

    it('description shows effect applies', () => {
        expect(embed.description).toContain('applies');
    });

    it('no damage field', () => {
        expect(embed.fields.find(f => f.name.includes('Damage'))).toBeUndefined();
    });
});

describe('buildPokemonEmbed — with active statuses', () => {
    const roll  = { ...BASE_POKEMON_HIT, activeStatuses: ['burned', 'paralyzed'] };
    const embed = buildPokemonEmbed(roll, 'Ash');

    it('shows status field', () => {
        const sf = embed.fields.find(f => f.name === 'Status');
        expect(sf).toBeTruthy();
        expect(sf.value).toContain('burned');
        expect(sf.value).toContain('paralyzed');
    });
});

describe('buildPokemonEmbed — mega evolved', () => {
    const roll  = { ...BASE_POKEMON_HIT, megaEvolved: true, megaFormName: 'Mega Rayquaza' };
    const embed = buildPokemonEmbed(roll, 'Ash');

    it('shows mega field', () => {
        const mf = embed.fields.find(f => f.name === 'Mega');
        expect(mf).toBeTruthy();
        expect(mf.value).toBe('Mega Rayquaza');
    });
});

describe('buildPokemonEmbed — DM AC override', () => {
    const roll  = { ...BASE_POKEMON_HIT, acWasOverridden: true };
    const embed = buildPokemonEmbed(roll, 'Ash');

    it('description mentions DM', () => {
        expect(embed.description).toContain('DM');
    });
});

describe('buildPokemonEmbed — accuracy modifier', () => {
    const roll  = { ...BASE_POKEMON_HIT, accModifier: 2, modifiedAccRoll: 8 };
    const embed = buildPokemonEmbed(roll, 'Ash');

    it('description shows modifier and modified roll', () => {
        expect(embed.description).toContain('+2');
        expect(embed.description).toContain('8');
    });
});

// ── Trainer skill embed ───────────────────────────────────────

describe('buildTrainerSkillEmbed', () => {
    const embed = buildTrainerSkillEmbed(BASE_TRAINER_SKILL, 'Ash');

    it('title contains skill name', () => {
        expect(embed.title).toContain('Perception');
    });

    it('description shows total', () => {
        expect(embed.description).toContain('18');
    });

    it('description shows roll', () => {
        expect(embed.description).toContain('[10]'); // PTA3: 1d20 roll
    });

    it('description shows trained bonus when trained', () => {
        expect(embed.description).toContain('+5 trained');
    });

    it('author name is trainer name', () => {
        expect(embed.author.name).toBe('Ash');
    });

    it('shows trainer HP bar', () => {
        const hpField = embed.fields.find(f => f.name === 'Trainer HP');
        expect(hpField).toBeTruthy();
        expect(hpField.value).toContain('20/24'); // PTA3: 20 base + 1d4 roll
        expect(hpField.value).toMatch(/█/);
    });
});

// ── Heal embed ────────────────────────────────────────────────

describe('buildHealEmbed', () => {
    const embed = buildHealEmbed(BASE_HEAL, 'Ash');

    it('title contains pokemon and item', () => {
        expect(embed.title).toContain('Rowdy');
        expect(embed.title).toContain('Potion');
    });

    it('uses green color', () => {
        expect(embed.color).toBe(0x4CAF50);
    });

    it('description shows healed amount', () => {
        expect(embed.description).toContain('+20 HP');
    });

    it('description shows dice roll breakdown', () => {
        expect(embed.description).toContain('20');
        expect(embed.description).toContain('[4, 6]');
    });

    it('author name is trainer name', () => {
        expect(embed.author.name).toBe('Ash');
    });

    it('shows before and after HP bars', () => {
        const hpField = embed.fields.find(f => f.name === 'Rowdy HP');
        expect(hpField).toBeTruthy();
        expect(hpField.value).toContain('25/50');
        expect(hpField.value).toContain('45/50');
    });

    it('marks Full when healed to max', () => {
        const fullHeal = { ...BASE_HEAL, hpAfter: 50 };
        const e = buildHealEmbed(fullHeal, 'Ash');
        expect(e.fields.find(f => f.name === 'Rowdy HP').value).toContain('Full');
    });

    it('does not mark Full when not at max', () => {
        const hpField = embed.fields.find(f => f.name === 'Rowdy HP');
        expect(hpField.value).not.toContain('Full');
    });
});

// ── Custom embed ──────────────────────────────────────────────

describe('buildCustomEmbed', () => {
    const embed = buildCustomEmbed(BASE_CUSTOM, 'Ash');

    it('title contains dice notation', () => {
        expect(embed.title).toContain('2d6');
    });

    it('description shows total', () => {
        expect(embed.description).toContain('10');
    });

    it('description shows rolls', () => {
        expect(embed.description).toContain('3');
    });

    it('description shows bonus when present', () => {
        expect(embed.description).toContain('+ 2');
    });

    it('no bonus in description when bonus is 0', () => {
        const e = buildCustomEmbed({ ...BASE_CUSTOM, bonus: 0 }, 'Ash');
        expect(e.description).not.toContain('+');
    });
});

// ── Pokémon skill embed ───────────────────────────────────────

describe('buildPokemonSkillEmbed', () => {
    const embed = buildPokemonSkillEmbed(BASE_POKEMON_SKILL, 'Ash');

    it('title contains pokemon name and skill', () => {
        expect(embed.title).toContain('Rowdy');
        expect(embed.title).toContain('Stealth');
    });

    it('description shows total and roll', () => {
        expect(embed.description).toContain('18');
        expect(embed.description).toContain('[14]');
        expect(embed.description).toContain('+4 SPD');
    });

    it('shows HP bar', () => {
        const hpField = embed.fields.find(f => f.name === 'Rowdy HP');
        expect(hpField).toBeTruthy();
        expect(hpField.value).toContain('35/50');
    });

    it('uses teal color', () => {
        expect(embed.color).toBe(0x26A69A);
    });

    it('author name is trainer name', () => {
        expect(embed.author.name).toBe('Ash');
    });

    it('no HP field when pokemonMaxHP is 0', () => {
        const e = buildPokemonSkillEmbed({ ...BASE_POKEMON_SKILL, pokemonMaxHP: 0 }, 'Ash');
        expect(e.fields.find(f => f.name === 'Rowdy HP')).toBeUndefined();
    });
});
