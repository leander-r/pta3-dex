// ============================================================
// TrainerContext Tests
// ============================================================
// Covers the PTA3 trainer rule engine: honor-based leveling, HP
// milestone rolls, point-buy stat allocation, and class-slot gating.
// Sibling contexts (GameData/UI/Modal) are mocked so these tests
// exercise TrainerContext's own logic in isolation.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { TrainerProvider, useTrainerContext } from '../TrainerContext.jsx';

const showLevelUpNotification = vi.fn();
// By default, confirm dialogs auto-confirm so tests can assert on the resulting state.
let confirmImpl = (opts) => opts.onConfirm && opts.onConfirm();
const showConfirm = vi.fn((opts) => confirmImpl(opts));

vi.mock('../GameDataContext.jsx', () => ({
    useGameData: () => ({ GAME_DATA: { features: {} } }),
}));
vi.mock('../UIContext.jsx', () => ({
    useUI: () => ({ showLevelUpNotification }),
}));
vi.mock('../ModalContext.jsx', () => ({
    useModal: () => ({ showConfirm }),
}));

function renderTrainer() {
    return renderHook(() => useTrainerContext(), { wrapper: TrainerProvider });
}

beforeEach(() => {
    showLevelUpNotification.mockClear();
    showConfirm.mockClear();
    confirmImpl = (opts) => opts.onConfirm && opts.onConfirm();
});

// ── calculateModifier / calculateMaxHP ───────────────────────

describe('calculateModifier', () => {
    // Takes the raw stat VALUE (not a stats key) — this is how every real caller
    // (TrainerStats.jsx) invokes it. A prior version of this function did an internal
    // trainer.stats[key] lookup, which silently broke every modifier badge in the UI
    // since callers always pass the value, not a key — see dataMigration/TrainerStats history.
    it('returns floor(statValue / 2) for the value actually passed in', () => {
        const { result } = renderTrainer();
        expect(result.current.calculateModifier(7)).toBe(3);
        expect(result.current.calculateModifier(10)).toBe(5);
        expect(result.current.calculateModifier(1)).toBe(0);
    });
});

describe('calculateMaxHP', () => {
    it('is 20 with no HP rolls', () => {
        const { result } = renderTrainer();
        expect(result.current.calculateMaxHP()).toBe(20);
    });

    it('adds the sum of hpRolls on top of the 20 base', () => {
        const { result } = renderTrainer();
        act(() => result.current.setTrainer(prev => ({ ...prev, hpRolls: [3, 1, 4] })));
        expect(result.current.calculateMaxHP()).toBe(28);
    });
});

// ── rollMilestoneHP ───────────────────────────────────────────

describe('rollMilestoneHP', () => {
    it('does nothing and warns when no milestone has been reached yet', () => {
        const { result } = renderTrainer();
        act(() => result.current.rollMilestoneHP());
        expect(result.current.trainer.hpRolls).toEqual([]);
    });

    it('appends a 1-4 roll once level 3 has been reached', () => {
        const { result } = renderTrainer();
        act(() => result.current.setTrainer(prev => ({ ...prev, level: 3 })));
        act(() => result.current.rollMilestoneHP());
        expect(result.current.trainer.hpRolls).toHaveLength(1);
        expect(result.current.trainer.hpRolls[0]).toBeGreaterThanOrEqual(1);
        expect(result.current.trainer.hpRolls[0]).toBeLessThanOrEqual(4);
    });

    it('refuses a second roll for the same milestone', () => {
        const { result } = renderTrainer();
        act(() => result.current.setTrainer(prev => ({ ...prev, level: 3 })));
        act(() => result.current.rollMilestoneHP());
        act(() => result.current.rollMilestoneHP());
        expect(result.current.trainer.hpRolls).toHaveLength(1);
    });

    it('allows a second roll once level 7 is also reached', () => {
        const { result } = renderTrainer();
        act(() => result.current.setTrainer(prev => ({ ...prev, level: 7 })));
        act(() => result.current.rollMilestoneHP());
        act(() => result.current.rollMilestoneHP());
        expect(result.current.trainer.hpRolls).toHaveLength(2);
    });
});

// ── updateTrainerStat (point-buy) ─────────────────────────────

describe('updateTrainerStat', () => {
    it('spends creation points per the point-buy cost table (3->4 costs 3)', () => {
        const { result } = renderTrainer();
        const before = result.current.trainer.statPoints; // 10 by default
        act(() => result.current.updateTrainerStat('atk', 4));
        expect(result.current.trainer.stats.atk).toBe(4);
        expect(result.current.trainer.statPoints).toBe(before - 3);
    });

    it('refuses to spend more creation points than available', () => {
        const { result } = renderTrainer();
        // Default trainer has 10 creation points; raising atk 3->6 costs 11-3=8... try something
        // that definitely exceeds the budget: raise all the way past the cap with no level points.
        act(() => result.current.updateTrainerStat('atk', 6)); // costs 11-3=8, affordable
        const afterFirst = result.current.trainer.statPoints;
        act(() => result.current.updateTrainerStat('def', 6)); // would cost 8 more, only ~2 left
        expect(result.current.trainer.stats.def).toBe(3); // unchanged — not enough points
        expect(result.current.trainer.statPoints).toBe(afterFirst);
    });

    it('refunds creation points when lowering a creation-funded stat', () => {
        const { result } = renderTrainer();
        act(() => result.current.updateTrainerStat('atk', 4)); // -3
        const afterRaise = result.current.trainer.statPoints;
        act(() => result.current.updateTrainerStat('atk', 3)); // back down
        expect(result.current.trainer.stats.atk).toBe(3);
        expect(result.current.trainer.statPoints).toBe(afterRaise + 3);
    });

    it('ignores a no-op update to the same value', () => {
        const { result } = renderTrainer();
        const before = result.current.trainer.statPoints;
        act(() => result.current.updateTrainerStat('atk', 3));
        expect(result.current.trainer.statPoints).toBe(before);
    });

    it('spends a flat level point per +1 once past the creation cap, using levelStatPoints', () => {
        const { result } = renderTrainer();
        // Pre-seed atk at the creation cap (6) so the next +1 must go through the level-point path.
        act(() => result.current.setTrainer(prev => ({ ...prev, stats: { ...prev.stats, atk: 6 }, levelStatPoints: 1 })));
        act(() => result.current.updateTrainerStat('atk', 7)); // beyond CREATION_STAT_CAP(6) -> flat level cost
        expect(result.current.trainer.stats.atk).toBe(7);
        expect(result.current.trainer.levelStatPoints).toBe(0); // flat cost 1 (6->7)
    });

    it('enforces the "two different stats" rule for level-point milestone spending', () => {
        const { result } = renderTrainer();
        act(() => result.current.setTrainer(prev => ({
            ...prev, stats: { atk: 6, def: 6, satk: 6, sdef: 6, spd: 6 },
            statPoints: 0, levelStatPoints: 2,
        })));
        act(() => result.current.updateTrainerStat('atk', 7)); // uses a level point on atk
        expect(result.current.trainer.levelStatAllocations).toContain('atk');
        act(() => result.current.updateTrainerStat('atk', 8)); // same stat again — should be rejected
        expect(result.current.trainer.stats.atk).toBe(7);
    });
});

describe('undoStatAllocation', () => {
    it('reverts the most recent stat change', () => {
        const { result } = renderTrainer();
        act(() => result.current.updateTrainerStat('atk', 4));
        expect(result.current.canUndoStat).toBe(true);
        act(() => result.current.undoStatAllocation());
        expect(result.current.trainer.stats.atk).toBe(3);
        expect(result.current.canUndoStat).toBe(false);
    });
});

// ── levelUpTrainer ─────────────────────────────────────────────

describe('levelUpTrainer', () => {
    it('blocks the 0->1 transition until a class has been picked', () => {
        const { result } = renderTrainer();
        act(() => result.current.levelUpTrainer());
        expect(result.current.trainer.level).toBe(0);
    });

    it('allows 0->1 once a class is set, regardless of unspent creation points', () => {
        const { result } = renderTrainer();
        act(() => result.current.setTrainer(prev => ({ ...prev, classes: ['Ace Trainer'] })));
        act(() => result.current.levelUpTrainer());
        expect(result.current.trainer.level).toBe(1);
    });

    it('blocks leveling past 1 without enough honors', () => {
        const { result } = renderTrainer();
        act(() => result.current.setTrainer(prev => ({ ...prev, classes: ['Ace Trainer'], level: 1, honors: 0 })));
        act(() => result.current.levelUpTrainer()); // needs 1 honor for level 2
        expect(result.current.trainer.level).toBe(1);
    });

    it('allows leveling once the honor threshold is met', () => {
        const { result } = renderTrainer();
        act(() => result.current.setTrainer(prev => ({ ...prev, classes: ['Ace Trainer'], level: 1, honors: 1 })));
        act(() => result.current.levelUpTrainer());
        expect(result.current.trainer.level).toBe(2);
    });

    it('blocks leveling past a milestone level until the HP roll is claimed', () => {
        const { result } = renderTrainer();
        act(() => result.current.setTrainer(prev => ({
            ...prev, classes: ['Ace Trainer'], level: 3, honors: 100, hpRolls: [],
        })));
        act(() => result.current.levelUpTrainer()); // level 3's milestone roll hasn't been claimed
        expect(result.current.trainer.level).toBe(3);
    });

    it('proceeds past a milestone once its HP roll has been claimed', () => {
        const { result } = renderTrainer();
        act(() => result.current.setTrainer(prev => ({
            ...prev, classes: ['Ace Trainer'], level: 3, honors: 100, hpRolls: [2],
        })));
        act(() => result.current.levelUpTrainer());
        expect(result.current.trainer.level).toBe(4);
    });

    it('grants +2 levelStatPoints and resets allocations when crossing INTO a milestone level', () => {
        const { result } = renderTrainer();
        act(() => result.current.setTrainer(prev => ({
            ...prev, classes: ['Ace Trainer'], level: 2, honors: 100,
            levelStatAllocations: ['stale'],
        })));
        act(() => result.current.levelUpTrainer()); // -> level 3, a milestone
        expect(result.current.trainer.level).toBe(3);
        expect(result.current.trainer.levelStatPoints).toBe(2);
        expect(result.current.trainer.levelStatAllocations).toEqual([]);
    });

    it('does not grant milestone stat points on a non-milestone level', () => {
        const { result } = renderTrainer();
        act(() => result.current.setTrainer(prev => ({ ...prev, classes: ['Ace Trainer'], level: 1, honors: 100 })));
        act(() => result.current.levelUpTrainer()); // -> level 2, not a milestone
        expect(result.current.trainer.levelStatPoints).toBe(0);
    });

    it('refuses to exceed the maximum trainer level (15)', () => {
        const { result } = renderTrainer();
        act(() => result.current.setTrainer(prev => ({
            ...prev, classes: ['Ace Trainer'], level: 15, honors: 9999, hpRolls: [1, 1, 1],
        })));
        act(() => result.current.levelUpTrainer());
        expect(result.current.trainer.level).toBe(15);
    });

    it('fires the level-up notification on a successful level-up', () => {
        const { result } = renderTrainer();
        act(() => result.current.setTrainer(prev => ({ ...prev, classes: ['Ace Trainer'] })));
        act(() => result.current.levelUpTrainer());
        expect(showLevelUpNotification).toHaveBeenCalledWith(expect.objectContaining({ level: 1 }));
    });
});

// ── levelDownTrainer ───────────────────────────────────────────

describe('levelDownTrainer', () => {
    it('refuses to go below level 1', () => {
        const { result } = renderTrainer();
        act(() => result.current.setTrainer(prev => ({ ...prev, level: 1 })));
        act(() => result.current.levelDownTrainer());
        expect(result.current.trainer.level).toBe(1);
    });

    it('restores the exact pre-level-up stats from the snapshot history', () => {
        const { result } = renderTrainer();
        act(() => result.current.setTrainer(prev => ({ ...prev, classes: ['Ace Trainer'] })));
        act(() => result.current.levelUpTrainer()); // 0 -> 1
        act(() => result.current.setTrainer(prev => ({ ...prev, honors: 100 })));
        act(() => result.current.levelUpTrainer()); // 1 -> 2 (snapshot captures stats as of level 1: atk=3)
        act(() => result.current.updateTrainerStat('atk', 4)); // mutate stats while at level 2
        act(() => result.current.levelDownTrainer()); // back to level 1
        expect(result.current.trainer.level).toBe(1);
        expect(result.current.trainer.stats.atk).toBe(3); // restored from snapshot, not left at 4
    });

    it('pops the most recent HP milestone roll when un-reaching that milestone', () => {
        const { result } = renderTrainer();
        act(() => result.current.setTrainer(prev => ({
            ...prev, classes: ['Ace Trainer'], level: 3, honors: 100, hpRolls: [3],
        })));
        act(() => result.current.levelDownTrainer());
        expect(result.current.trainer.level).toBe(2);
        expect(result.current.trainer.hpRolls).toEqual([]);
    });

    it('blocks level-down when it would strand classes above the new class-slot cap', () => {
        const { result } = renderTrainer();
        act(() => result.current.setTrainer(prev => ({
            ...prev, level: 3, classes: ['A', 'B'], // level 3 allows 2 classes
        })));
        act(() => result.current.levelDownTrainer()); // level 2 only allows 1 class
        expect(result.current.trainer.level).toBe(3); // blocked
    });
});

// ── awardHonors ────────────────────────────────────────────────

describe('awardHonors', () => {
    it('adds honors without auto-leveling', () => {
        const { result } = renderTrainer();
        act(() => result.current.awardHonors(5));
        expect(result.current.trainer.honors).toBe(5);
        expect(result.current.trainer.level).toBe(0);
    });

    it('ignores a zero or negative amount', () => {
        const { result } = renderTrainer();
        act(() => result.current.awardHonors(0));
        act(() => result.current.awardHonors(-3));
        expect(result.current.trainer.honors).toBe(0);
    });
});

// ── respecTrainer ──────────────────────────────────────────────

describe('respecTrainer', () => {
    it('resets level, stats, classes, and features back to creation defaults', () => {
        const { result } = renderTrainer();
        act(() => result.current.setTrainer(prev => ({
            ...prev, level: 5, classes: ['Ace Trainer'], features: ['Capable'],
            stats: { atk: 6, def: 6, satk: 6, sdef: 6, spd: 6 }, honors: 20,
        })));
        act(() => result.current.respecTrainer());
        expect(result.current.trainer.level).toBe(0);
        expect(result.current.trainer.classes).toEqual([]);
        expect(result.current.trainer.features).toEqual([]);
        expect(result.current.trainer.honors).toBe(0);
        expect(result.current.trainer.stats).toEqual({ atk: 3, def: 3, satk: 3, sdef: 3, spd: 3 });
    });

    it('keeps party and reserve Pokemon intact', () => {
        const { result } = renderTrainer();
        act(() => result.current.setParty([{ id: 1, species: 'Pikachu' }]));
        act(() => result.current.respecTrainer());
        expect(result.current.party).toEqual([{ id: 1, species: 'Pikachu' }]);
    });

    it('does nothing if the confirmation is declined', () => {
        confirmImpl = () => {}; // simulate user cancelling
        const { result } = renderTrainer();
        act(() => result.current.setTrainer(prev => ({ ...prev, level: 5 })));
        act(() => result.current.respecTrainer());
        expect(result.current.trainer.level).toBe(5);
    });
});

// ── Pokemon movement (party <-> reserve) ────────────────────────

describe('moveToParty / moveToReserve', () => {
    it('moves a reserve Pokemon into the party', () => {
        const { result } = renderTrainer();
        act(() => result.current.setReserve([{ id: 1, species: 'Eevee' }]));
        act(() => result.current.moveToParty(1));
        expect(result.current.party).toEqual([{ id: 1, species: 'Eevee' }]);
        expect(result.current.reserve).toEqual([]);
    });

    it('refuses to add to a full (6-member) party', () => {
        const fullParty = Array.from({ length: 6 }, (_, i) => ({ id: i, species: 'Rattata' }));
        const { result } = renderTrainer();
        act(() => result.current.setParty(fullParty));
        act(() => result.current.setReserve([{ id: 99, species: 'Eevee' }]));
        act(() => result.current.moveToParty(99));
        expect(result.current.party).toHaveLength(6);
        expect(result.current.reserve).toHaveLength(1);
    });

    it('moves a party Pokemon into reserve', () => {
        const { result } = renderTrainer();
        act(() => result.current.setParty([{ id: 1, species: 'Eevee' }]));
        act(() => result.current.moveToReserve(1));
        expect(result.current.party).toEqual([]);
        expect(result.current.reserve).toEqual([{ id: 1, species: 'Eevee' }]);
    });
});

// ── Trainer roster management ───────────────────────────────────

describe('trainer roster management', () => {
    it('addNewTrainer appends a trainer and makes it active', () => {
        const { result } = renderTrainer();
        let created;
        act(() => { created = result.current.addNewTrainer(); });
        expect(result.current.trainers).toHaveLength(2);
        expect(result.current.activeTrainerId).toBe(created.id);
    });

    it('duplicateTrainer clones a trainer with fresh Pokemon ids', () => {
        const { result } = renderTrainer();
        act(() => result.current.setTrainer(prev => ({ ...prev, name: 'Ash', party: [{ id: 1, species: 'Pikachu' }] })));
        const originalId = result.current.trainer.id;
        let copy;
        act(() => { copy = result.current.duplicateTrainer(originalId); });
        expect(copy.name).toBe('Ash (Copy)');
        expect(copy.party[0].id).not.toBe(1);
        expect(result.current.trainers).toHaveLength(2);
    });

    it('deleteTrainer refuses to delete the only active trainer', () => {
        const { result } = renderTrainer();
        const id = result.current.trainer.id;
        act(() => result.current.deleteTrainer(id));
        expect(result.current.trainers).toHaveLength(1);
    });

    it('archiveTrainer hides a trainer but keeps it in the roster', () => {
        const { result } = renderTrainer();
        act(() => { result.current.addNewTrainer(); });
        const secondId = result.current.trainers[1].id;
        act(() => result.current.archiveTrainer(secondId));
        expect(result.current.trainers.find(t => t.id === secondId).archived).toBe(true);
    });
});
