// ============================================================
// Data Migration — Old PTA format → PTA3 format
// ============================================================

/**
 * Detect if a save contains old-format trainer data (pre-PTA3).
 * Old format has stats.hp on trainers.
 */
export const isOldSaveFormat = (data) => {
    if (!data || !Array.isArray(data.trainers) || data.trainers.length === 0) return false;
    return data.trainers[0]?.stats?.hp !== undefined;
};

/**
 * Scale an old stat value (range ~6–30) to new PTA3 range (1–10).
 * Mapping: 6→2, 10→4, 14→6, 20→8, 30→10
 */
const scaleStatToNew = (oldStat) =>
    Math.min(10, Math.max(1, Math.round((oldStat || 6) / 2.5)));

/**
 * Normalize a move frequency string to PTA3 format.
 * "Battle - 2" / "EOT" → "3/day"
 * "Battle - 1"         → "1/day"
 * "At-Will"            → "At-Will" (unchanged)
 */
const normalizeMoveFrequency = (freq) => {
    if (!freq) return 'At-Will';
    const f = freq.trim();
    if (f === 'At-Will') return 'At-Will';
    if (f.startsWith('Battle - 1') || f === 'EOT') return '1/day';
    if (f.startsWith('Battle - 2') || f.startsWith('Battle -')) return '3/day';
    if (f === '1/day' || f === '3/day') return f;
    // Keep unknown frequencies unchanged
    return f;
};

/**
 * Migrate a single trainer from old format to PTA3 format.
 */
const migrateTrainer = (trainer) => {
    const oldStats = trainer.stats || {};

    // Scale the 5 remaining stats (drop hp)
    const newStats = {
        atk:  scaleStatToNew(oldStats.atk),
        def:  scaleStatToNew(oldStats.def),
        satk: scaleStatToNew(oldStats.satk),
        sdef: scaleStatToNew(oldStats.sdef),
        spd:  scaleStatToNew(oldStats.spd)
    };

    // Approximate honors = trainer level (1 honor per old level)
    const honors = trainer.level || 0;

    return {
        ...trainer,
        stats: newStats,
        maxHp: 20,
        hpRolls: [],
        honors,
        statPoints: Math.min(25, trainer.statPoints ?? 25),
        // Keep levelStatPoints and featPoints as-is
    };
};

/**
 * Migrate a single Pokémon from old format to PTA3 format.
 */
const migratePokemon = (pokemon) => {
    const base = pokemon.baseStats || {};
    const added = pokemon.addedStats || {};

    // Merge base + addedStats into unified baseStats
    const mergedStats = {
        hp:   (base.hp   || 0) + (added.hp   || 0),
        atk:  (base.atk  || 0) + (added.atk  || 0),
        def:  (base.def  || 0) + (added.def  || 0),
        satk: (base.satk || 0) + (added.satk || 0),
        sdef: (base.sdef || 0) + (added.sdef || 0),
        spd:  (base.spd  || 0) + (added.spd  || 0)
    };

    // Normalize move frequencies
    const normalizedMoves = (pokemon.moves || []).map(m => ({
        ...m,
        frequency: normalizeMoveFrequency(m.frequency)
    }));

    // Remove old stat allocation fields
    const {
        addedStats,
        statAllocationHistory,
        statPointsAvailable,
        ...rest
    } = pokemon;

    return {
        ...rest,
        baseStats: mergedStats,
        moves: normalizedMoves
    };
};

/**
 * Strip string entries from trainer.features that are not in the known PTA3 features dict.
 * Object entries (custom/stat-boost features) are always kept.
 * Safe to call on any save format.
 *
 * @param {Object} data         - Full save payload
 * @param {Object} knownFeatures - GAME_DATA.features dict (keys = feature names)
 * @returns {{ data: Object, cleaned: boolean }}
 */
export const cleanupLegacyFeatures = (data, knownFeatures = {}) => {
    if (!data?.trainers) return { data, cleaned: false };
    let anyChanged = false;
    const trainers = data.trainers.map(trainer => {
        if (!Array.isArray(trainer.features) || trainer.features.length === 0) return trainer;
        const filtered = trainer.features.filter(f => {
            if (typeof f !== 'string') return true;      // always keep object features
            return knownFeatures[f] !== undefined;        // keep known PTA3 features only
        });
        if (filtered.length === trainer.features.length) return trainer;
        anyChanged = true;
        return { ...trainer, features: filtered };
    });
    if (!anyChanged) return { data, cleaned: false };
    return { data: { ...data, trainers }, cleaned: true };
};

/**
 * Migrate a full save payload from old PTA format to PTA3 format.
 * Safe to call even on new-format saves (no-op).
 *
 * @param {Object} data - Full save payload (trainers, activeTrainerId, inventory, …)
 * @returns {{ data: Object, migrated: boolean }}
 */
export const migrateSaveData = (data) => {
    if (!isOldSaveFormat(data)) {
        return { data, migrated: false };
    }

    const migratedTrainers = (data.trainers || []).map(trainer => {
        const migratedTrainer = migrateTrainer(trainer);
        migratedTrainer.party   = (trainer.party   || []).map(migratePokemon);
        migratedTrainer.reserve = (trainer.reserve || []).map(migratePokemon);
        return migratedTrainer;
    });

    return {
        data: { ...data, trainers: migratedTrainers, _migrated: true },
        migrated: true
    };
};
