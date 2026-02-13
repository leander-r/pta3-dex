// ============================================================
// EVOLUTION CHAIN DATA
// ============================================================
// Format: { species: { evolvesTo: [{species, method, requirement, regionalForm?}], evolvesFrom: {species, method, requirement, regionalForm?} } }
// Methods: 'level' (minimum level), 'stone' (evolution stone), 'trade', 'happiness', 'other'

export const EVOLUTION_CHAINS = {
    // Gen 1 Starters
    'Bulbasaur': { evolvesTo: [{ species: 'Ivysaur', method: 'level', requirement: 16 }] },
    'Ivysaur': { evolvesFrom: { species: 'Bulbasaur', method: 'level', requirement: 16 }, evolvesTo: [{ species: 'Venusaur', method: 'level', requirement: 32 }] },
    'Venusaur': { evolvesFrom: { species: 'Ivysaur', method: 'level', requirement: 32 } },

    'Charmander': { evolvesTo: [{ species: 'Charmeleon', method: 'level', requirement: 16 }] },
    'Charmeleon': { evolvesFrom: { species: 'Charmander', method: 'level', requirement: 16 }, evolvesTo: [{ species: 'Charizard', method: 'level', requirement: 36 }] },
    'Charizard': { evolvesFrom: { species: 'Charmeleon', method: 'level', requirement: 36 } },

    'Squirtle': { evolvesTo: [{ species: 'Wartortle', method: 'level', requirement: 16 }] },
    'Wartortle': { evolvesFrom: { species: 'Squirtle', method: 'level', requirement: 16 }, evolvesTo: [{ species: 'Blastoise', method: 'level', requirement: 36 }] },
    'Blastoise': { evolvesFrom: { species: 'Wartortle', method: 'level', requirement: 36 } },

    // Pikachu line (with Alolan)
    'Pichu': { evolvesTo: [{ species: 'Pikachu', method: 'happiness', requirement: 'High Happiness' }] },
    'Pikachu': { evolvesFrom: { species: 'Pichu', method: 'happiness', requirement: 'High Happiness' }, evolvesTo: [
        { species: 'Raichu', method: 'stone', requirement: 'Thunder Stone' },
        { species: 'Raichu', method: 'stone', requirement: 'Thunder Stone', regionalForm: 'Alolan', note: 'In Alola' }
    ]},
    'Raichu': { evolvesFrom: { species: 'Pikachu', method: 'stone', requirement: 'Thunder Stone' } },

    // Sandshrew line (with Alolan)
    'Sandshrew': { evolvesTo: [{ species: 'Sandslash', method: 'level', requirement: 22 }] },
    'Sandslash': { evolvesFrom: { species: 'Sandshrew', method: 'level', requirement: 22 } },

    // Vulpix line (with Alolan)
    'Vulpix': { evolvesTo: [
        { species: 'Ninetales', method: 'stone', requirement: 'Fire Stone' },
        { species: 'Ninetales', method: 'stone', requirement: 'Ice Stone', regionalForm: 'Alolan', note: 'Alolan Vulpix' }
    ]},
    'Ninetales': { evolvesFrom: { species: 'Vulpix', method: 'stone', requirement: 'Fire Stone' } },

    // Clefairy line
    'Cleffa': { evolvesTo: [{ species: 'Clefairy', method: 'happiness', requirement: 'High Happiness' }] },
    'Clefairy': { evolvesFrom: { species: 'Cleffa', method: 'happiness', requirement: 'High Happiness' }, evolvesTo: [{ species: 'Clefable', method: 'stone', requirement: 'Moon Stone' }] },
    'Clefable': { evolvesFrom: { species: 'Clefairy', method: 'stone', requirement: 'Moon Stone' } },

    // Jigglypuff line
    'Igglybuff': { evolvesTo: [{ species: 'Jigglypuff', method: 'happiness', requirement: 'High Happiness' }] },
    'Jigglypuff': { evolvesFrom: { species: 'Igglybuff', method: 'happiness', requirement: 'High Happiness' }, evolvesTo: [{ species: 'Wigglytuff', method: 'stone', requirement: 'Moon Stone' }] },
    'Wigglytuff': { evolvesFrom: { species: 'Jigglypuff', method: 'stone', requirement: 'Moon Stone' } },

    // Oddish line
    'Oddish': { evolvesTo: [{ species: 'Gloom', method: 'level', requirement: 21 }] },
    'Gloom': { evolvesFrom: { species: 'Oddish', method: 'level', requirement: 21 }, evolvesTo: [
        { species: 'Vileplume', method: 'stone', requirement: 'Leaf Stone' },
        { species: 'Bellossom', method: 'stone', requirement: 'Sun Stone' }
    ]},
    'Vileplume': { evolvesFrom: { species: 'Gloom', method: 'stone', requirement: 'Leaf Stone' } },
    'Bellossom': { evolvesFrom: { species: 'Gloom', method: 'stone', requirement: 'Sun Stone' } },

    // Growlithe line
    'Growlithe': { evolvesTo: [{ species: 'Arcanine', method: 'stone', requirement: 'Fire Stone' }] },
    'Arcanine': { evolvesFrom: { species: 'Growlithe', method: 'stone', requirement: 'Fire Stone' } },

    // Poliwag line
    'Poliwag': { evolvesTo: [{ species: 'Poliwhirl', method: 'level', requirement: 25 }] },
    'Poliwhirl': { evolvesFrom: { species: 'Poliwag', method: 'level', requirement: 25 }, evolvesTo: [
        { species: 'Poliwrath', method: 'stone', requirement: 'Water Stone' },
        { species: 'Politoed', method: 'trade', requirement: "King's Rock" }
    ]},
    'Poliwrath': { evolvesFrom: { species: 'Poliwhirl', method: 'stone', requirement: 'Water Stone' } },
    'Politoed': { evolvesFrom: { species: 'Poliwhirl', method: 'trade', requirement: "King's Rock" } },

    // Abra line
    'Abra': { evolvesTo: [{ species: 'Kadabra', method: 'level', requirement: 16 }] },
    'Kadabra': { evolvesFrom: { species: 'Abra', method: 'level', requirement: 16 }, evolvesTo: [{ species: 'Alakazam', method: 'trade', requirement: 'Trade' }] },
    'Alakazam': { evolvesFrom: { species: 'Kadabra', method: 'trade', requirement: 'Trade' } },

    // Machop line
    'Machop': { evolvesTo: [{ species: 'Machoke', method: 'level', requirement: 28 }] },
    'Machoke': { evolvesFrom: { species: 'Machop', method: 'level', requirement: 28 }, evolvesTo: [{ species: 'Machamp', method: 'trade', requirement: 'Trade' }] },
    'Machamp': { evolvesFrom: { species: 'Machoke', method: 'trade', requirement: 'Trade' } },

    // Geodude line (with Alolan)
    'Geodude': { evolvesTo: [{ species: 'Graveler', method: 'level', requirement: 25 }] },
    'Graveler': { evolvesFrom: { species: 'Geodude', method: 'level', requirement: 25 }, evolvesTo: [{ species: 'Golem', method: 'trade', requirement: 'Trade' }] },
    'Golem': { evolvesFrom: { species: 'Graveler', method: 'trade', requirement: 'Trade' } },

    // Ponyta line
    'Ponyta': { evolvesTo: [{ species: 'Rapidash', method: 'level', requirement: 40 }] },
    'Rapidash': { evolvesFrom: { species: 'Ponyta', method: 'level', requirement: 40 } },

    // Slowpoke line
    'Slowpoke': { evolvesTo: [
        { species: 'Slowbro', method: 'level', requirement: 37 },
        { species: 'Slowking', method: 'trade', requirement: "King's Rock" }
    ]},
    'Slowbro': { evolvesFrom: { species: 'Slowpoke', method: 'level', requirement: 37 } },
    'Slowking': { evolvesFrom: { species: 'Slowpoke', method: 'trade', requirement: "King's Rock" } },

    // Magnemite line
    'Magnemite': { evolvesTo: [{ species: 'Magneton', method: 'level', requirement: 30 }] },
    'Magneton': { evolvesFrom: { species: 'Magnemite', method: 'level', requirement: 30 }, evolvesTo: [{ species: 'Magnezone', method: 'other', requirement: 'Magnetic Field' }] },
    'Magnezone': { evolvesFrom: { species: 'Magneton', method: 'other', requirement: 'Magnetic Field' } },

    // Grimer line (with Alolan)
    'Grimer': { evolvesTo: [{ species: 'Muk', method: 'level', requirement: 38 }] },
    'Muk': { evolvesFrom: { species: 'Grimer', method: 'level', requirement: 38 } },

    // Shellder line
    'Shellder': { evolvesTo: [{ species: 'Cloyster', method: 'stone', requirement: 'Water Stone' }] },
    'Cloyster': { evolvesFrom: { species: 'Shellder', method: 'stone', requirement: 'Water Stone' } },

    // Gastly line
    'Gastly': { evolvesTo: [{ species: 'Haunter', method: 'level', requirement: 25 }] },
    'Haunter': { evolvesFrom: { species: 'Gastly', method: 'level', requirement: 25 }, evolvesTo: [{ species: 'Gengar', method: 'trade', requirement: 'Trade' }] },
    'Gengar': { evolvesFrom: { species: 'Haunter', method: 'trade', requirement: 'Trade' } },

    // Drowzee line
    'Drowzee': { evolvesTo: [{ species: 'Hypno', method: 'level', requirement: 26 }] },
    'Hypno': { evolvesFrom: { species: 'Drowzee', method: 'level', requirement: 26 } },

    // Exeggcute line (with Alolan)
    'Exeggcute': { evolvesTo: [
        { species: 'Exeggutor', method: 'stone', requirement: 'Leaf Stone' },
        { species: 'Exeggutor', method: 'stone', requirement: 'Leaf Stone', regionalForm: 'Alolan', note: 'In Alola' }
    ]},
    'Exeggutor': { evolvesFrom: { species: 'Exeggcute', method: 'stone', requirement: 'Leaf Stone' } },

    // Cubone line (with Alolan Marowak)
    'Cubone': { evolvesTo: [
        { species: 'Marowak', method: 'level', requirement: 28 },
        { species: 'Marowak', method: 'level', requirement: 28, regionalForm: 'Alolan', note: 'In Alola at night' }
    ]},
    'Marowak': { evolvesFrom: { species: 'Cubone', method: 'level', requirement: 28 } },

    // Koffing line
    'Koffing': { evolvesTo: [{ species: 'Weezing', method: 'level', requirement: 35 }] },
    'Weezing': { evolvesFrom: { species: 'Koffing', method: 'level', requirement: 35 } },

    // Rhyhorn line
    'Rhyhorn': { evolvesTo: [{ species: 'Rhydon', method: 'level', requirement: 42 }] },
    'Rhydon': { evolvesFrom: { species: 'Rhyhorn', method: 'level', requirement: 42 }, evolvesTo: [{ species: 'Rhyperior', method: 'trade', requirement: 'Protector' }] },
    'Rhyperior': { evolvesFrom: { species: 'Rhydon', method: 'trade', requirement: 'Protector' } },

    // Chansey line
    'Happiny': { evolvesTo: [{ species: 'Chansey', method: 'other', requirement: 'Oval Stone (Day)' }] },
    'Chansey': { evolvesFrom: { species: 'Happiny', method: 'other', requirement: 'Oval Stone (Day)' }, evolvesTo: [{ species: 'Blissey', method: 'happiness', requirement: 'High Happiness' }] },
    'Blissey': { evolvesFrom: { species: 'Chansey', method: 'happiness', requirement: 'High Happiness' } },

    // Horsea line
    'Horsea': { evolvesTo: [{ species: 'Seadra', method: 'level', requirement: 32 }] },
    'Seadra': { evolvesFrom: { species: 'Horsea', method: 'level', requirement: 32 }, evolvesTo: [{ species: 'Kingdra', method: 'trade', requirement: 'Dragon Scale' }] },
    'Kingdra': { evolvesFrom: { species: 'Seadra', method: 'trade', requirement: 'Dragon Scale' } },

    // Staryu line
    'Staryu': { evolvesTo: [{ species: 'Starmie', method: 'stone', requirement: 'Water Stone' }] },
    'Starmie': { evolvesFrom: { species: 'Staryu', method: 'stone', requirement: 'Water Stone' } },

    // Scyther line
    'Scyther': { evolvesTo: [{ species: 'Scizor', method: 'trade', requirement: 'Metal Coat' }] },
    'Scizor': { evolvesFrom: { species: 'Scyther', method: 'trade', requirement: 'Metal Coat' } },

    // Magikarp line
    'Magikarp': { evolvesTo: [{ species: 'Gyarados', method: 'level', requirement: 20 }] },
    'Gyarados': { evolvesFrom: { species: 'Magikarp', method: 'level', requirement: 20 } },

    // Eevee line
    'Eevee': { evolvesTo: [
        { species: 'Vaporeon', method: 'stone', requirement: 'Water Stone' },
        { species: 'Jolteon', method: 'stone', requirement: 'Thunder Stone' },
        { species: 'Flareon', method: 'stone', requirement: 'Fire Stone' },
        { species: 'Espeon', method: 'happiness', requirement: 'High Happiness (Day)' },
        { species: 'Umbreon', method: 'happiness', requirement: 'High Happiness (Night)' },
        { species: 'Leafeon', method: 'stone', requirement: 'Leaf Stone' },
        { species: 'Glaceon', method: 'stone', requirement: 'Ice Stone' },
        { species: 'Sylveon', method: 'other', requirement: 'Affection + Fairy Move' }
    ]},
    'Vaporeon': { evolvesFrom: { species: 'Eevee', method: 'stone', requirement: 'Water Stone' } },
    'Jolteon': { evolvesFrom: { species: 'Eevee', method: 'stone', requirement: 'Thunder Stone' } },
    'Flareon': { evolvesFrom: { species: 'Eevee', method: 'stone', requirement: 'Fire Stone' } },
    'Espeon': { evolvesFrom: { species: 'Eevee', method: 'happiness', requirement: 'High Happiness (Day)' } },
    'Umbreon': { evolvesFrom: { species: 'Eevee', method: 'happiness', requirement: 'High Happiness (Night)' } },
    'Leafeon': { evolvesFrom: { species: 'Eevee', method: 'stone', requirement: 'Leaf Stone' } },
    'Glaceon': { evolvesFrom: { species: 'Eevee', method: 'stone', requirement: 'Ice Stone' } },
    'Sylveon': { evolvesFrom: { species: 'Eevee', method: 'other', requirement: 'Affection + Fairy Move' } },

    // Porygon line
    'Porygon': { evolvesTo: [{ species: 'Porygon2', method: 'trade', requirement: 'Up-Grade' }] },
    'Porygon2': { evolvesFrom: { species: 'Porygon', method: 'trade', requirement: 'Up-Grade' }, evolvesTo: [{ species: 'Porygon-Z', method: 'trade', requirement: 'Dubious Disc' }] },
    'Porygon-Z': { evolvesFrom: { species: 'Porygon2', method: 'trade', requirement: 'Dubious Disc' } },

    // Dratini line
    'Dratini': { evolvesTo: [{ species: 'Dragonair', method: 'level', requirement: 30 }] },
    'Dragonair': { evolvesFrom: { species: 'Dratini', method: 'level', requirement: 30 }, evolvesTo: [{ species: 'Dragonite', method: 'level', requirement: 55 }] },
    'Dragonite': { evolvesFrom: { species: 'Dragonair', method: 'level', requirement: 55 } },

    // Gen 2 Starters
    'Chikorita': { evolvesTo: [{ species: 'Bayleef', method: 'level', requirement: 16 }] },
    'Bayleef': { evolvesFrom: { species: 'Chikorita', method: 'level', requirement: 16 }, evolvesTo: [{ species: 'Meganium', method: 'level', requirement: 32 }] },
    'Meganium': { evolvesFrom: { species: 'Bayleef', method: 'level', requirement: 32 } },

    'Cyndaquil': { evolvesTo: [{ species: 'Quilava', method: 'level', requirement: 14 }] },
    'Quilava': { evolvesFrom: { species: 'Cyndaquil', method: 'level', requirement: 14 }, evolvesTo: [{ species: 'Typhlosion', method: 'level', requirement: 36 }] },
    'Typhlosion': { evolvesFrom: { species: 'Quilava', method: 'level', requirement: 36 } },

    'Totodile': { evolvesTo: [{ species: 'Croconaw', method: 'level', requirement: 18 }] },
    'Croconaw': { evolvesFrom: { species: 'Totodile', method: 'level', requirement: 18 }, evolvesTo: [{ species: 'Feraligatr', method: 'level', requirement: 30 }] },
    'Feraligatr': { evolvesFrom: { species: 'Croconaw', method: 'level', requirement: 30 } },

    // Togepi line
    'Togepi': { evolvesTo: [{ species: 'Togetic', method: 'happiness', requirement: 'High Happiness' }] },
    'Togetic': { evolvesFrom: { species: 'Togepi', method: 'happiness', requirement: 'High Happiness' }, evolvesTo: [{ species: 'Togekiss', method: 'stone', requirement: 'Shiny Stone' }] },
    'Togekiss': { evolvesFrom: { species: 'Togetic', method: 'stone', requirement: 'Shiny Stone' } },

    // Mareep line
    'Mareep': { evolvesTo: [{ species: 'Flaaffy', method: 'level', requirement: 15 }] },
    'Flaaffy': { evolvesFrom: { species: 'Mareep', method: 'level', requirement: 15 }, evolvesTo: [{ species: 'Ampharos', method: 'level', requirement: 30 }] },
    'Ampharos': { evolvesFrom: { species: 'Flaaffy', method: 'level', requirement: 30 } },

    // Marill line
    'Azurill': { evolvesTo: [{ species: 'Marill', method: 'happiness', requirement: 'High Happiness' }] },
    'Marill': { evolvesFrom: { species: 'Azurill', method: 'happiness', requirement: 'High Happiness' }, evolvesTo: [{ species: 'Azumarill', method: 'level', requirement: 18 }] },
    'Azumarill': { evolvesFrom: { species: 'Marill', method: 'level', requirement: 18 } },

    // Hoppip line
    'Hoppip': { evolvesTo: [{ species: 'Skiploom', method: 'level', requirement: 18 }] },
    'Skiploom': { evolvesFrom: { species: 'Hoppip', method: 'level', requirement: 18 }, evolvesTo: [{ species: 'Jumpluff', method: 'level', requirement: 27 }] },
    'Jumpluff': { evolvesFrom: { species: 'Skiploom', method: 'level', requirement: 27 } },

    // Sunkern line
    'Sunkern': { evolvesTo: [{ species: 'Sunflora', method: 'stone', requirement: 'Sun Stone' }] },
    'Sunflora': { evolvesFrom: { species: 'Sunkern', method: 'stone', requirement: 'Sun Stone' } },

    // Murkrow line
    'Murkrow': { evolvesTo: [{ species: 'Honchkrow', method: 'stone', requirement: 'Dusk Stone' }] },
    'Honchkrow': { evolvesFrom: { species: 'Murkrow', method: 'stone', requirement: 'Dusk Stone' } },

    // Misdreavus line
    'Misdreavus': { evolvesTo: [{ species: 'Mismagius', method: 'stone', requirement: 'Dusk Stone' }] },
    'Mismagius': { evolvesFrom: { species: 'Misdreavus', method: 'stone', requirement: 'Dusk Stone' } },

    // Sneasel line
    'Sneasel': { evolvesTo: [{ species: 'Weavile', method: 'other', requirement: 'Razor Claw (Night)' }] },
    'Weavile': { evolvesFrom: { species: 'Sneasel', method: 'other', requirement: 'Razor Claw (Night)' } },

    // Teddiursa line
    'Teddiursa': { evolvesTo: [{ species: 'Ursaring', method: 'level', requirement: 30 }] },
    'Ursaring': { evolvesFrom: { species: 'Teddiursa', method: 'level', requirement: 30 } },

    // Swinub line
    'Swinub': { evolvesTo: [{ species: 'Piloswine', method: 'level', requirement: 33 }] },
    'Piloswine': { evolvesFrom: { species: 'Swinub', method: 'level', requirement: 33 }, evolvesTo: [{ species: 'Mamoswine', method: 'other', requirement: 'Ancient Power' }] },
    'Mamoswine': { evolvesFrom: { species: 'Piloswine', method: 'other', requirement: 'Ancient Power' } },

    // Larvitar line
    'Larvitar': { evolvesTo: [{ species: 'Pupitar', method: 'level', requirement: 30 }] },
    'Pupitar': { evolvesFrom: { species: 'Larvitar', method: 'level', requirement: 30 }, evolvesTo: [{ species: 'Tyranitar', method: 'level', requirement: 55 }] },
    'Tyranitar': { evolvesFrom: { species: 'Pupitar', method: 'level', requirement: 55 } },

    // Gen 3 Starters
    'Treecko': { evolvesTo: [{ species: 'Grovyle', method: 'level', requirement: 16 }] },
    'Grovyle': { evolvesFrom: { species: 'Treecko', method: 'level', requirement: 16 }, evolvesTo: [{ species: 'Sceptile', method: 'level', requirement: 36 }] },
    'Sceptile': { evolvesFrom: { species: 'Grovyle', method: 'level', requirement: 36 } },

    'Torchic': { evolvesTo: [{ species: 'Combusken', method: 'level', requirement: 16 }] },
    'Combusken': { evolvesFrom: { species: 'Torchic', method: 'level', requirement: 16 }, evolvesTo: [{ species: 'Blaziken', method: 'level', requirement: 36 }] },
    'Blaziken': { evolvesFrom: { species: 'Combusken', method: 'level', requirement: 36 } },

    'Mudkip': { evolvesTo: [{ species: 'Marshtomp', method: 'level', requirement: 16 }] },
    'Marshtomp': { evolvesFrom: { species: 'Mudkip', method: 'level', requirement: 16 }, evolvesTo: [{ species: 'Swampert', method: 'level', requirement: 36 }] },
    'Swampert': { evolvesFrom: { species: 'Marshtomp', method: 'level', requirement: 36 } },

    // Lotad line
    'Lotad': { evolvesTo: [{ species: 'Lombre', method: 'level', requirement: 14 }] },
    'Lombre': { evolvesFrom: { species: 'Lotad', method: 'level', requirement: 14 }, evolvesTo: [{ species: 'Ludicolo', method: 'stone', requirement: 'Water Stone' }] },
    'Ludicolo': { evolvesFrom: { species: 'Lombre', method: 'stone', requirement: 'Water Stone' } },

    // Ralts line
    'Ralts': { evolvesTo: [{ species: 'Kirlia', method: 'level', requirement: 20 }] },
    'Kirlia': { evolvesFrom: { species: 'Ralts', method: 'level', requirement: 20 }, evolvesTo: [
        { species: 'Gardevoir', method: 'level', requirement: 30 },
        { species: 'Gallade', method: 'stone', requirement: 'Dawn Stone', note: 'Male only' }
    ]},
    'Gardevoir': { evolvesFrom: { species: 'Kirlia', method: 'level', requirement: 30 } },
    'Gallade': { evolvesFrom: { species: 'Kirlia', method: 'stone', requirement: 'Dawn Stone' } },

    // Slakoth line
    'Slakoth': { evolvesTo: [{ species: 'Vigoroth', method: 'level', requirement: 18 }] },
    'Vigoroth': { evolvesFrom: { species: 'Slakoth', method: 'level', requirement: 18 }, evolvesTo: [{ species: 'Slaking', method: 'level', requirement: 36 }] },
    'Slaking': { evolvesFrom: { species: 'Vigoroth', method: 'level', requirement: 36 } },

    // Aron line
    'Aron': { evolvesTo: [{ species: 'Lairon', method: 'level', requirement: 32 }] },
    'Lairon': { evolvesFrom: { species: 'Aron', method: 'level', requirement: 32 }, evolvesTo: [{ species: 'Aggron', method: 'level', requirement: 42 }] },
    'Aggron': { evolvesFrom: { species: 'Lairon', method: 'level', requirement: 42 } },

    // Roselia line
    'Budew': { evolvesTo: [{ species: 'Roselia', method: 'happiness', requirement: 'High Happiness (Day)' }] },
    'Roselia': { evolvesFrom: { species: 'Budew', method: 'happiness', requirement: 'High Happiness (Day)' }, evolvesTo: [{ species: 'Roserade', method: 'stone', requirement: 'Shiny Stone' }] },
    'Roserade': { evolvesFrom: { species: 'Roselia', method: 'stone', requirement: 'Shiny Stone' } },

    // Feebas line
    'Feebas': { evolvesTo: [{ species: 'Milotic', method: 'other', requirement: 'High Beauty / Prism Scale' }] },
    'Milotic': { evolvesFrom: { species: 'Feebas', method: 'other', requirement: 'High Beauty / Prism Scale' } },

    // Snorunt line
    'Snorunt': { evolvesTo: [
        { species: 'Glalie', method: 'level', requirement: 42 },
        { species: 'Froslass', method: 'stone', requirement: 'Dawn Stone', note: 'Female only' }
    ]},
    'Glalie': { evolvesFrom: { species: 'Snorunt', method: 'level', requirement: 42 } },
    'Froslass': { evolvesFrom: { species: 'Snorunt', method: 'stone', requirement: 'Dawn Stone' } },

    // Bagon line
    'Bagon': { evolvesTo: [{ species: 'Shelgon', method: 'level', requirement: 30 }] },
    'Shelgon': { evolvesFrom: { species: 'Bagon', method: 'level', requirement: 30 }, evolvesTo: [{ species: 'Salamence', method: 'level', requirement: 50 }] },
    'Salamence': { evolvesFrom: { species: 'Shelgon', method: 'level', requirement: 50 } },

    // Beldum line
    'Beldum': { evolvesTo: [{ species: 'Metang', method: 'level', requirement: 20 }] },
    'Metang': { evolvesFrom: { species: 'Beldum', method: 'level', requirement: 20 }, evolvesTo: [{ species: 'Metagross', method: 'level', requirement: 45 }] },
    'Metagross': { evolvesFrom: { species: 'Metang', method: 'level', requirement: 45 } },

    // Gen 4 Starters
    'Turtwig': { evolvesTo: [{ species: 'Grotle', method: 'level', requirement: 18 }] },
    'Grotle': { evolvesFrom: { species: 'Turtwig', method: 'level', requirement: 18 }, evolvesTo: [{ species: 'Torterra', method: 'level', requirement: 32 }] },
    'Torterra': { evolvesFrom: { species: 'Grotle', method: 'level', requirement: 32 } },

    'Chimchar': { evolvesTo: [{ species: 'Monferno', method: 'level', requirement: 14 }] },
    'Monferno': { evolvesFrom: { species: 'Chimchar', method: 'level', requirement: 14 }, evolvesTo: [{ species: 'Infernape', method: 'level', requirement: 36 }] },
    'Infernape': { evolvesFrom: { species: 'Monferno', method: 'level', requirement: 36 } },

    'Piplup': { evolvesTo: [{ species: 'Prinplup', method: 'level', requirement: 16 }] },
    'Prinplup': { evolvesFrom: { species: 'Piplup', method: 'level', requirement: 16 }, evolvesTo: [{ species: 'Empoleon', method: 'level', requirement: 36 }] },
    'Empoleon': { evolvesFrom: { species: 'Prinplup', method: 'level', requirement: 36 } },

    // Shinx line
    'Shinx': { evolvesTo: [{ species: 'Luxio', method: 'level', requirement: 15 }] },
    'Luxio': { evolvesFrom: { species: 'Shinx', method: 'level', requirement: 15 }, evolvesTo: [{ species: 'Luxray', method: 'level', requirement: 30 }] },
    'Luxray': { evolvesFrom: { species: 'Luxio', method: 'level', requirement: 30 } },

    // Gible line
    'Gible': { evolvesTo: [{ species: 'Gabite', method: 'level', requirement: 24 }] },
    'Gabite': { evolvesFrom: { species: 'Gible', method: 'level', requirement: 24 }, evolvesTo: [{ species: 'Garchomp', method: 'level', requirement: 48 }] },
    'Garchomp': { evolvesFrom: { species: 'Gabite', method: 'level', requirement: 48 } },

    // Riolu line
    'Riolu': { evolvesTo: [{ species: 'Lucario', method: 'happiness', requirement: 'High Happiness (Day)' }] },
    'Lucario': { evolvesFrom: { species: 'Riolu', method: 'happiness', requirement: 'High Happiness (Day)' } },

    // Snover line
    'Snover': { evolvesTo: [{ species: 'Abomasnow', method: 'level', requirement: 40 }] },
    'Abomasnow': { evolvesFrom: { species: 'Snover', method: 'level', requirement: 40 } },

    // Pansage/Simisage line
    'Pansage': { evolvesTo: [{ species: 'Simisage', method: 'stone', requirement: 'Leaf Stone' }] },
    'Simisage': { evolvesFrom: { species: 'Pansage', method: 'stone', requirement: 'Leaf Stone' } },

    // Pansear/Simisear line
    'Pansear': { evolvesTo: [{ species: 'Simisear', method: 'stone', requirement: 'Fire Stone' }] },
    'Simisear': { evolvesFrom: { species: 'Pansear', method: 'stone', requirement: 'Fire Stone' } },

    // Panpour/Simipour line
    'Panpour': { evolvesTo: [{ species: 'Simipour', method: 'stone', requirement: 'Water Stone' }] },
    'Simipour': { evolvesFrom: { species: 'Panpour', method: 'stone', requirement: 'Water Stone' } },

    // Munna line
    'Munna': { evolvesTo: [{ species: 'Musharna', method: 'stone', requirement: 'Moon Stone' }] },
    'Musharna': { evolvesFrom: { species: 'Munna', method: 'stone', requirement: 'Moon Stone' } },

    // Minccino line
    'Minccino': { evolvesTo: [{ species: 'Cinccino', method: 'stone', requirement: 'Shiny Stone' }] },
    'Cinccino': { evolvesFrom: { species: 'Minccino', method: 'stone', requirement: 'Shiny Stone' } },

    // Litwick line
    'Litwick': { evolvesTo: [{ species: 'Lampent', method: 'level', requirement: 41 }] },
    'Lampent': { evolvesFrom: { species: 'Litwick', method: 'level', requirement: 41 }, evolvesTo: [{ species: 'Chandelure', method: 'stone', requirement: 'Dusk Stone' }] },
    'Chandelure': { evolvesFrom: { species: 'Lampent', method: 'stone', requirement: 'Dusk Stone' } },

    // Axew line
    'Axew': { evolvesTo: [{ species: 'Fraxure', method: 'level', requirement: 38 }] },
    'Fraxure': { evolvesFrom: { species: 'Axew', method: 'level', requirement: 38 }, evolvesTo: [{ species: 'Haxorus', method: 'level', requirement: 48 }] },
    'Haxorus': { evolvesFrom: { species: 'Fraxure', method: 'level', requirement: 48 } },

    // Deino line
    'Deino': { evolvesTo: [{ species: 'Zweilous', method: 'level', requirement: 50 }] },
    'Zweilous': { evolvesFrom: { species: 'Deino', method: 'level', requirement: 50 }, evolvesTo: [{ species: 'Hydreigon', method: 'level', requirement: 64 }] },
    'Hydreigon': { evolvesFrom: { species: 'Zweilous', method: 'level', requirement: 64 } },

    // Skitty line
    'Skitty': { evolvesTo: [{ species: 'Delcatty', method: 'stone', requirement: 'Moon Stone' }] },
    'Delcatty': { evolvesFrom: { species: 'Skitty', method: 'stone', requirement: 'Moon Stone' } },

    // Helioptile line
    'Helioptile': { evolvesTo: [{ species: 'Heliolisk', method: 'stone', requirement: 'Sun Stone' }] },
    'Heliolisk': { evolvesFrom: { species: 'Helioptile', method: 'stone', requirement: 'Sun Stone' } },

    // Flabebe line
    'Flabébé': { evolvesTo: [{ species: 'Floette', method: 'level', requirement: 19 }] },
    'Floette': { evolvesFrom: { species: 'Flabébé', method: 'level', requirement: 19 }, evolvesTo: [{ species: 'Florges', method: 'stone', requirement: 'Shiny Stone' }] },
    'Florges': { evolvesFrom: { species: 'Floette', method: 'stone', requirement: 'Shiny Stone' } },

    // Goomy line
    'Goomy': { evolvesTo: [{ species: 'Sliggoo', method: 'level', requirement: 40 }] },
    'Sliggoo': { evolvesFrom: { species: 'Goomy', method: 'level', requirement: 40 }, evolvesTo: [{ species: 'Goodra', method: 'level', requirement: 50, note: 'In rain' }] },
    'Goodra': { evolvesFrom: { species: 'Sliggoo', method: 'level', requirement: 50 } },

    // Rattata line (with Alolan)
    'Rattata': { evolvesTo: [{ species: 'Raticate', method: 'level', requirement: 20 }] },
    'Raticate': { evolvesFrom: { species: 'Rattata', method: 'level', requirement: 20 } },

    // Meowth line (with Alolan)
    'Meowth': { evolvesTo: [{ species: 'Persian', method: 'level', requirement: 28 }] },
    'Persian': { evolvesFrom: { species: 'Meowth', method: 'level', requirement: 28 } },

    // Diglett line (with Alolan)
    'Diglett': { evolvesTo: [{ species: 'Dugtrio', method: 'level', requirement: 26 }] },
    'Dugtrio': { evolvesFrom: { species: 'Diglett', method: 'level', requirement: 26 } },

    // Rockruff line (with form choices)
    'Rockruff': { evolvesTo: [
        { species: 'Lycanroc', method: 'level', requirement: 25, note: 'Day Form' },
        { species: 'Lycanroc', method: 'level', requirement: 25, regionalForm: 'Night', note: 'Night Form' },
        { species: 'Lycanroc', method: 'level', requirement: 25, regionalForm: 'Dusk', note: 'Dusk Form' }
    ]},
    'Lycanroc': { evolvesFrom: { species: 'Rockruff', method: 'level', requirement: 25 } },

    // Pumpkaboo line (size form preserved on evolution)
    'Pumpkaboo': { evolvesTo: [{ species: 'Gourgeist', method: 'level', requirement: 25 }] },
    'Gourgeist': { evolvesFrom: { species: 'Pumpkaboo', method: 'level', requirement: 25 } },

    // Gen 7 Starters
    'Rowlet': { evolvesTo: [{ species: 'Dartrix', method: 'level', requirement: 17 }] },
    'Dartrix': { evolvesFrom: { species: 'Rowlet', method: 'level', requirement: 17 }, evolvesTo: [{ species: 'Decidueye', method: 'level', requirement: 34 }] },
    'Decidueye': { evolvesFrom: { species: 'Dartrix', method: 'level', requirement: 34 } },

    'Litten': { evolvesTo: [{ species: 'Torracat', method: 'level', requirement: 17 }] },
    'Torracat': { evolvesFrom: { species: 'Litten', method: 'level', requirement: 17 }, evolvesTo: [{ species: 'Incineroar', method: 'level', requirement: 34 }] },
    'Incineroar': { evolvesFrom: { species: 'Torracat', method: 'level', requirement: 34 } },

    'Popplio': { evolvesTo: [{ species: 'Brionne', method: 'level', requirement: 17 }] },
    'Brionne': { evolvesFrom: { species: 'Popplio', method: 'level', requirement: 17 }, evolvesTo: [{ species: 'Primarina', method: 'level', requirement: 34 }] },
    'Primarina': { evolvesFrom: { species: 'Brionne', method: 'level', requirement: 34 } },

    // Pikipek line
    'Pikipek': { evolvesTo: [{ species: 'Trumbeak', method: 'level', requirement: 14 }] },
    'Trumbeak': { evolvesFrom: { species: 'Pikipek', method: 'level', requirement: 14 }, evolvesTo: [{ species: 'Toucannon', method: 'level', requirement: 28 }] },
    'Toucannon': { evolvesFrom: { species: 'Trumbeak', method: 'level', requirement: 28 } },

    // Yungoos line
    'Yungoos': { evolvesTo: [{ species: 'Gumshoos', method: 'level', requirement: 20 }] },
    'Gumshoos': { evolvesFrom: { species: 'Yungoos', method: 'level', requirement: 20 } },

    // Grubbin line
    'Grubbin': { evolvesTo: [{ species: 'Charjabug', method: 'level', requirement: 20 }] },
    'Charjabug': { evolvesFrom: { species: 'Grubbin', method: 'level', requirement: 20 }, evolvesTo: [{ species: 'Vikavolt', method: 'stone', requirement: 'Thunder Stone' }] },
    'Vikavolt': { evolvesFrom: { species: 'Charjabug', method: 'stone', requirement: 'Thunder Stone' } },

    // Cutiefly line
    'Cutiefly': { evolvesTo: [{ species: 'Ribombee', method: 'level', requirement: 25 }] },
    'Ribombee': { evolvesFrom: { species: 'Cutiefly', method: 'level', requirement: 25 } },

    // Crabrawler line
    'Crabrawler': { evolvesTo: [{ species: 'Crabominable', method: 'stone', requirement: 'Ice Stone' }] },
    'Crabominable': { evolvesFrom: { species: 'Crabrawler', method: 'stone', requirement: 'Ice Stone' } },

    // Mareanie line
    'Mareanie': { evolvesTo: [{ species: 'Toxapex', method: 'level', requirement: 38 }] },
    'Toxapex': { evolvesFrom: { species: 'Mareanie', method: 'level', requirement: 38 } },

    // Mudbray line
    'Mudbray': { evolvesTo: [{ species: 'Mudsdale', method: 'level', requirement: 30 }] },
    'Mudsdale': { evolvesFrom: { species: 'Mudbray', method: 'level', requirement: 30 } },

    // Dewpider line
    'Dewpider': { evolvesTo: [{ species: 'Araquanid', method: 'level', requirement: 22 }] },
    'Araquanid': { evolvesFrom: { species: 'Dewpider', method: 'level', requirement: 22 } },

    // Fomantis line
    'Fomantis': { evolvesTo: [{ species: 'Lurantis', method: 'level', requirement: 34 }] },
    'Lurantis': { evolvesFrom: { species: 'Fomantis', method: 'level', requirement: 34 } },

    // Morelull line
    'Morelull': { evolvesTo: [{ species: 'Shiinotic', method: 'level', requirement: 24 }] },
    'Shiinotic': { evolvesFrom: { species: 'Morelull', method: 'level', requirement: 24 } },

    // Salandit line
    'Salandit': { evolvesTo: [{ species: 'Salazzle', method: 'level', requirement: 33, note: 'Female only' }] },
    'Salazzle': { evolvesFrom: { species: 'Salandit', method: 'level', requirement: 33 } },

    // Stufful line
    'Stufful': { evolvesTo: [{ species: 'Bewear', method: 'level', requirement: 27 }] },
    'Bewear': { evolvesFrom: { species: 'Stufful', method: 'level', requirement: 27 } },

    // Bounsweet line
    'Bounsweet': { evolvesTo: [{ species: 'Steenee', method: 'level', requirement: 18 }] },
    'Steenee': { evolvesFrom: { species: 'Bounsweet', method: 'level', requirement: 18 }, evolvesTo: [{ species: 'Tsareena', method: 'other', requirement: 'Knows Stomp' }] },
    'Tsareena': { evolvesFrom: { species: 'Steenee', method: 'other', requirement: 'Knows Stomp' } },

    // Wimpod line
    'Wimpod': { evolvesTo: [{ species: 'Golisopod', method: 'level', requirement: 30 }] },
    'Golisopod': { evolvesFrom: { species: 'Wimpod', method: 'level', requirement: 30 } },

    // Sandygast line
    'Sandygast': { evolvesTo: [{ species: 'Palossand', method: 'level', requirement: 42 }] },
    'Palossand': { evolvesFrom: { species: 'Sandygast', method: 'level', requirement: 42 } },

    // Type: Null line
    'Type: Null': { evolvesTo: [{ species: 'Silvally', method: 'happiness', requirement: 'High Friendship' }] },
    'Silvally': { evolvesFrom: { species: 'Type: Null', method: 'happiness', requirement: 'High Friendship' } },

    // Jangmo-o line
    'Jangmo-O': { evolvesTo: [{ species: 'Hakamo-O', method: 'level', requirement: 35 }] },
    'Hakamo-O': { evolvesFrom: { species: 'Jangmo-O', method: 'level', requirement: 35 }, evolvesTo: [{ species: 'Kommo-O', method: 'level', requirement: 45 }] },
    'Kommo-O': { evolvesFrom: { species: 'Hakamo-O', method: 'level', requirement: 45 } },

    // Cosmog line
    'Cosmog': { evolvesTo: [{ species: 'Cosmoem', method: 'level', requirement: 43 }] },
    'Cosmoem': { evolvesFrom: { species: 'Cosmog', method: 'level', requirement: 43 }, evolvesTo: [
        { species: 'Solgaleo', method: 'level', requirement: 53, note: 'Sun' },
        { species: 'Lunala', method: 'level', requirement: 53, note: 'Moon' }
    ]},
    'Solgaleo': { evolvesFrom: { species: 'Cosmoem', method: 'level', requirement: 53 } },
    'Lunala': { evolvesFrom: { species: 'Cosmoem', method: 'level', requirement: 53 } },

    // Poipole line
    'Poipole': { evolvesTo: [{ species: 'Naganadel', method: 'other', requirement: 'Knows Dragon Pulse' }] },
    'Naganadel': { evolvesFrom: { species: 'Poipole', method: 'other', requirement: 'Knows Dragon Pulse' } },

    // Meltan line
    'Meltan': { evolvesTo: [{ species: 'Melmetal', method: 'level', requirement: 40 }] },
    'Melmetal': { evolvesFrom: { species: 'Meltan', method: 'level', requirement: 40 } },
};
