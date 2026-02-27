import { describe, it, expect } from 'vitest';
import { buildEmbed, buildPokemonEmbed, buildTrainerSkillEmbed, buildHealEmbed, buildCustomEmbed } from '../discordEmbeds.js';

// ── Shared roll fixtures ──────────────────────────────────────

const BASE_POKEMON_HIT = {
    type: 'pokemon',
    pokemon: 'Rowdy', move: 'High Horsepower', moveType: 'Ground', category: 'Physical',
    accRoll: 6, accModifier: 0, modifiedAccRoll: 6, moveAC: 2, acWasOverridden: false,
    isHit: true, isCrit: false, isStatus: false,
    dice: '4d12+16', rolls: [9, 12, 8, 8], diceTotal: 37, statBonus: 14, stabBonus: 4, total: 71,
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
    dice: '8d12+16', rolls: [9, 12, 8, 8, 10, 11, 7, 9], diceTotal: 74, total: 106,
};

const BASE_TRAINER_SKILL = {
    type: 'trainer_skill',
    skill: 'Perception', skillStat: 'WIS',
    rolls: [4, 6], modifier: 3, hasSkill: true, bonus: 5, total: 18,
    trainerCurrentHP: 45, trainerMaxHP: 50,
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
    const fieldNames = embed.fields.map(f => f.name);
    const fieldValues = embed.fields.map(f => f.value);

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

    it('shows hit accuracy field', () => {
        expect(fieldNames).toContain('✅ Hit');
    });

    it('accuracy field shows roll vs AC', () => {
        const val = embed.fields.find(f => f.name === '✅ Hit').value;
        expect(val).toContain('6');
        expect(val).toContain('AC 2');
    });

    it('shows move type field', () => {
        const val = embed.fields.find(f => f.name === 'Move').value;
        expect(val).toContain('Ground');
        expect(val).toContain('Physical');
    });

    it('shows damage field with total', () => {
        const dmgField = embed.fields.find(f => f.name.includes('Damage'));
        expect(dmgField).toBeTruthy();
        expect(dmgField.value).toContain('71 damage total');
        expect(dmgField.value).toContain('+14 stat');
        expect(dmgField.value).toContain('+4 STAB');
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
        expect(fieldNames).not.toContain('Status');
    });

    it('no mega field when not mega evolved', () => {
        expect(fieldNames).not.toContain('Mega');
    });

    it('footer contains trainer name', () => {
        expect(embed.footer.text).toContain('Ash');
    });
});

describe('buildPokemonEmbed — miss', () => {
    const embed = buildPokemonEmbed(BASE_POKEMON_MISS, 'Ash');

    it('title has miss icon and suffix', () => {
        expect(embed.title).toMatch(/^❌/);
        expect(embed.title).toContain('MISS');
    });

    it('uses gray color', () => {
        expect(embed.color).toBe(0x95A5A6);
    });

    it('shows miss accuracy field', () => {
        expect(embed.fields.find(f => f.name === '✗ Miss')).toBeTruthy();
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

    it('accuracy field shows Natural 20', () => {
        expect(embed.fields.find(f => f.name === '🎯 Accuracy')).toBeTruthy();
        expect(embed.fields.find(f => f.name === '🎯 Accuracy').value).toContain('Natural 20');
    });

    it('damage field label mentions Crit', () => {
        const dmgField = embed.fields.find(f => f.name.includes('Damage'));
        expect(dmgField.name).toContain('Crit');
    });
});

describe('buildPokemonEmbed — status move hit', () => {
    const roll = { ...BASE_POKEMON_HIT, isStatus: true, dice: null, rolls: [], diceTotal: 0, statBonus: 0, stabBonus: 0, total: 0 };
    const embed = buildPokemonEmbed(roll, 'Ash');

    it('title has status icon', () => {
        expect(embed.title).toMatch(/^✨/);
    });

    it('shows effect field with applies', () => {
        expect(embed.fields.find(f => f.name === 'Effect').value).toContain('applies');
    });

    it('no damage field', () => {
        expect(embed.fields.find(f => f.name.includes('Damage'))).toBeUndefined();
    });
});

describe('buildPokemonEmbed — with active statuses', () => {
    const roll = { ...BASE_POKEMON_HIT, activeStatuses: ['burned', 'paralyzed'] };
    const embed = buildPokemonEmbed(roll, 'Ash');

    it('shows status field', () => {
        const sf = embed.fields.find(f => f.name === 'Status');
        expect(sf).toBeTruthy();
        expect(sf.value).toContain('burned');
        expect(sf.value).toContain('paralyzed');
    });
});

describe('buildPokemonEmbed — mega evolved', () => {
    const roll = { ...BASE_POKEMON_HIT, megaEvolved: true, megaFormName: 'Mega Rayquaza' };
    const embed = buildPokemonEmbed(roll, 'Ash');

    it('shows mega field', () => {
        const mf = embed.fields.find(f => f.name === 'Mega');
        expect(mf).toBeTruthy();
        expect(mf.value).toBe('Mega Rayquaza');
    });
});

describe('buildPokemonEmbed — DM AC override', () => {
    const roll = { ...BASE_POKEMON_HIT, acWasOverridden: true };
    const embed = buildPokemonEmbed(roll, 'Ash');

    it('accuracy field mentions DM', () => {
        const acc = embed.fields.find(f => f.name === '✅ Hit');
        expect(acc.value).toContain('DM');
    });
});

describe('buildPokemonEmbed — accuracy modifier', () => {
    const roll = { ...BASE_POKEMON_HIT, accModifier: 2, modifiedAccRoll: 8 };
    const embed = buildPokemonEmbed(roll, 'Ash');

    it('accuracy field shows modifier and modified roll', () => {
        const acc = embed.fields.find(f => f.name === '✅ Hit');
        expect(acc.value).toContain('+2');
        expect(acc.value).toContain('8');
    });
});

// ── Trainer skill embed ───────────────────────────────────────

describe('buildTrainerSkillEmbed', () => {
    const embed = buildTrainerSkillEmbed(BASE_TRAINER_SKILL, 'Ash');

    it('title contains skill name', () => {
        expect(embed.title).toContain('Perception');
    });

    it('shows result', () => {
        expect(embed.fields.find(f => f.name === 'Result').value).toContain('18');
    });

    it('shows rolls', () => {
        expect(embed.fields.find(f => f.name === 'Rolls').value).toContain('4');
        expect(embed.fields.find(f => f.name === 'Rolls').value).toContain('6');
    });

    it('shows trained bonus when trained', () => {
        expect(embed.fields.find(f => f.name === 'Trained bonus')).toBeTruthy();
    });

    it('shows trainer HP bar', () => {
        const hpField = embed.fields.find(f => f.name === 'Trainer HP');
        expect(hpField).toBeTruthy();
        expect(hpField.value).toContain('45/50');
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

    it('shows dice roll breakdown', () => {
        const rollField = embed.fields.find(f => f.name === '🎲 Roll');
        expect(rollField).toBeTruthy();
        expect(rollField.value).toContain('20');
    });

    it('shows healed amount', () => {
        expect(embed.fields.find(f => f.name === 'Healed').value).toContain('+20 HP');
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

    it('shows total', () => {
        expect(embed.fields.find(f => f.name === 'Result').value).toContain('10');
    });

    it('shows rolls', () => {
        expect(embed.fields.find(f => f.name === 'Rolls').value).toContain('3');
    });

    it('shows bonus when present', () => {
        expect(embed.fields.find(f => f.name === 'Bonus')).toBeTruthy();
    });

    it('no bonus field when bonus is 0', () => {
        const e = buildCustomEmbed({ ...BASE_CUSTOM, bonus: 0 }, 'Ash');
        expect(e.fields.find(f => f.name === 'Bonus')).toBeUndefined();
    });
});
