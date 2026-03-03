export const createDemoTrainer = () => {
    const base = Date.now() * 1000 + Math.floor(Math.random() * 999);
    return {
        id: base,
        name: 'Red',
        gender: 'male',
        age: 16,
        level: 5,
        honors: 5,
        classes: ['Ace Trainer'],
        // PTA3: 5 stats (no HP), values 1-10
        stats: { atk: 6, def: 4, satk: 4, sdef: 4, spd: 5 },
        maxHp: 20,
        hpRolls: [3],  // milestone roll at Lv 3
        statPoints: 0,
        levelStatPoints: 4,
        skills: { Athletics: 1, Perception: 1, 'Pokemon Handling': 1 },
        features: [],
        notes: 'Example trainer — feel free to edit or delete.',
        badges: [],
        money: 2500,
        archived: false,
        partyPresets: [],
        party: [
            {
                id: base + 1,
                name: 'Pika',
                species: 'Pikachu',
                gender: 'male',
                types: ['Electric'],
                nature: 'Jolly',
                ability: 'Static',
                abilities: ['Static'],
                // PTA3: baseStats are fixed from Pokédex — no addedStats
                baseStats: { hp: 35, atk: 5, def: 4, satk: 5, sdef: 5, spd: 7 },
                moves: [
                    { name: 'Thunder Shock', source: 'natural', type: 'Electric', learnedAtLevel: 1 },
                    { name: 'Quick Attack',  source: 'natural', type: 'Normal',   learnedAtLevel: 5 },
                    { name: 'Thunderbolt',   source: 'taught',  type: 'Electric' },
                ],
                skills: [], notes: '', loyalty: 3, heldItem: '', moveHistory: [],
            },
            {
                id: base + 2,
                name: 'Bulba',
                species: 'Bulbasaur',
                gender: 'male',
                types: ['Grass', 'Poison'],
                nature: 'Bold',
                ability: 'Overgrow',
                abilities: ['Overgrow'],
                // PTA3: baseStats are fixed from Pokédex — no addedStats
                baseStats: { hp: 30, atk: 5, def: 6, satk: 7, sdef: 7, spd: 5 },
                moves: [
                    { name: 'Tackle',       source: 'natural', type: 'Normal', learnedAtLevel: 1 },
                    { name: 'Vine Whip',    source: 'natural', type: 'Grass',  learnedAtLevel: 3 },
                    { name: 'Sleep Powder', source: 'taught',  type: 'Grass'  },
                ],
                skills: [], notes: '', loyalty: 3, heldItem: '', moveHistory: [],
            },
        ],
        reserve: [],
    };
};
