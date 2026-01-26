// ============================================================
// EXPORT UTILITIES
// ============================================================

import { getActualStats, calculatePokemonHP } from './dataUtils.js';

/**
 * Export trainer data as formatted text for Discord/sharing
 */
export const exportTrainerText = (trainer) => {
    const actualStats = {
        hp: trainer.stats.hp,
        atk: trainer.stats.atk,
        def: trainer.stats.def,
        satk: trainer.stats.satk,
        sdef: trainer.stats.sdef,
        spd: trainer.stats.spd
    };
    const maxHP = (trainer.stats.hp * 4) + (trainer.level * 4);
    const genderSymbol = trainer.gender === 'male' ? '♂' : trainer.gender === 'female' ? '♀' : '';
    const classesDisplay = (trainer.classes && trainer.classes.length > 0) ? trainer.classes.join(' / ') : 'Trainer';
    
    let text = `**━━━━━━ TRAINER CARD ━━━━━━**\n`;
    text += `**${trainer.name || 'Unnamed'}** ${genderSymbol}\n`;
    text += `Level ${trainer.level} ${classesDisplay}\n\n`;
    text += `**Stats** (Max HP: ${maxHP})\n`;
    text += `HP: ${actualStats.hp} | ATK: ${actualStats.atk} | DEF: ${actualStats.def}\n`;
    text += `SATK: ${actualStats.satk} | SDEF: ${actualStats.sdef} | SPD: ${actualStats.spd}\n\n`;
    
    if (trainer.features.length > 0) {
        const featureNames = trainer.features.map(f => typeof f === 'object' ? f.name : f);
        text += `**Features:** ${featureNames.join(', ')}\n`;
    }
    if (trainer.skills.length > 0) {
        text += `**Skills:** ${trainer.skills.join(', ')}\n`;
    }
    if (trainer.badges.length > 0) {
        text += `**Badges:** ${trainer.badges.length}\n`;
    }
    text += `**Money:** ₽${trainer.money.toLocaleString()}\n`;
    text += `**━━━━━━━━━━━━━━━━━━━━━**`;
    
    return text;
};

/**
 * Export Pokemon data as formatted text for Discord/sharing
 */
export const exportPokemonText = (poke) => {
    const actualStats = getActualStats(poke);
    const maxHP = calculatePokemonHP(poke);
    const genderSymbol = poke.gender === 'male' ? '♂' : poke.gender === 'female' ? '♀' : poke.gender === 'genderless' ? '⚪' : '';
    
    let text = `**━━━━━━ POKÉMON ━━━━━━**\n`;
    text += `**${poke.name}** ${genderSymbol}`;
    if (poke.species && poke.species !== poke.name) {
        text += ` (${poke.species})`;
    }
    text += `\n`;
    text += `Level ${poke.level} | ${poke.types.join('/')} | ${poke.nature} Nature\n`;
    
    // Build abilities list
    const abilities = [poke.ability, poke.ability2, poke.ability3].filter(a => a);
    text += `**Abilities:** ${abilities.length > 0 ? abilities.join(', ') : 'None'}\n`;
    
    // Build skills list
    const skills = (poke.pokemonSkills || []);
    if (skills.length > 0) {
        const skillsStr = skills.map(s => s.value ? `${s.name} ${s.value}` : s.name).join(', ');
        text += `**Skills:** ${skillsStr}\n`;
    }
    text += `\n`;
    
    text += `**Stats** (Max HP: ${maxHP})\n`;
    text += `HP: ${actualStats.hp} | ATK: ${actualStats.atk} | DEF: ${actualStats.def}\n`;
    text += `SATK: ${actualStats.satk} | SDEF: ${actualStats.sdef} | SPD: ${actualStats.spd}\n\n`;
    
    if (poke.moves.length > 0) {
        text += `**Moves:**\n`;
        poke.moves.forEach(move => {
            text += `• ${move.name} (${move.type}) - ${move.damage || 'Status'} [${move.frequency}]\n`;
        });
    }
    
    text += `**━━━━━━━━━━━━━━━━━━━━━**`;
    
    return text;
};

/**
 * Export Team data as formatted text for Discord/sharing
 */
export const exportTeamText = (trainer, party) => {
    const genderSymbol = trainer.gender === 'male' ? '♂' : trainer.gender === 'female' ? '♀' : '';
    const classesDisplay = (trainer.classes && trainer.classes.length > 0) ? trainer.classes.join(' / ') : 'Trainer';
    
    let text = `**╔══════════════════════════════════════╗**\n`;
    text += `**║     ${trainer.name || 'Unnamed'} ${genderSymbol} - TEAM CARD     ║**\n`;
    text += `**╚══════════════════════════════════════╝**\n\n`;
    
    text += `📋 **TRAINER INFO**\n`;
    text += `Level ${trainer.level} ${classesDisplay}\n`;
    text += `💰 ₽${(trainer.money || 0).toLocaleString()} | 🎖️ ${trainer.badges?.length || 0} Badges\n\n`;
    
    text += `⚔️ **ACTIVE PARTY** (${party.length}/6)\n`;
    text += `─────────────────────────────────\n`;
    
    if (party.length === 0) {
        text += `(No Pokémon in party)\n`;
    } else {
        party.forEach((poke, idx) => {
            const actualStats = getActualStats(poke);
            const maxHP = calculatePokemonHP(poke);
            const currentHP = maxHP - (poke.currentDamage || 0);
            const genderIcon = poke.gender === 'male' ? '♂' : poke.gender === 'female' ? '♀' : '';
            const typeStr = poke.types?.join('/') || 'Normal';
            
            text += `\n**${idx + 1}. ${poke.name || poke.species || 'Unknown'}** ${genderIcon}\n`;
            text += `   Lv.${poke.level} | ${typeStr} | HP: ${currentHP}/${maxHP}\n`;
            text += `   ATK:${actualStats.atk} DEF:${actualStats.def} SATK:${actualStats.satk} SDEF:${actualStats.sdef} SPD:${actualStats.spd}\n`;
            
            // Show moves (max 4)
            if (poke.moves && poke.moves.length > 0) {
                const moveNames = poke.moves.slice(0, 4).map(m => m.name).join(', ');
                text += `   Moves: ${moveNames}\n`;
            }
        });
    }
    
    text += `\n─────────────────────────────────\n`;
    text += `📅 ${new Date().toLocaleDateString()} | P:TA Character Manager`;
    
    return text;
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard! Paste in Discord or anywhere.');
    }).catch(err => {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Copied to clipboard!');
    });
};

/**
 * Download card as image using html2canvas
 */
export const downloadCardAsImage = async (cardId, filename) => {
    const card = document.getElementById(cardId);
    if (!card) {
        alert('Card element not found. Please try again.');
        return;
    }
    
    try {
        // Use html2canvas library loaded from CDN
        if (typeof html2canvas === 'undefined') {
            // Load html2canvas dynamically
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                script.onload = resolve;
                script.onerror = () => reject(new Error('Failed to load html2canvas'));
                document.head.appendChild(script);
            });
        }
        await captureCard(card, filename);
    } catch (err) {
        console.error('Error loading html2canvas:', err);
        // Offer alternative: copy to clipboard
        if (confirm('Image export failed. Would you like to copy the card data as text instead?')) {
            try {
                const text = card.innerText;
                await navigator.clipboard.writeText(text);
                alert('Card data copied to clipboard!');
            } catch (clipErr) {
                alert('Export failed. Try taking a screenshot manually (Print Screen key).');
            }
        }
    }
};

/**
 * Helper function to capture card as image
 */
const captureCard = async (card, filename) => {
    try {
        // Clone the card and apply inline styles for better capture
        const canvas = await html2canvas(card, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            // Fix for some CSS issues
            onclone: (clonedDoc) => {
                const clonedCard = clonedDoc.getElementById(card.id);
                if (clonedCard) {
                    // Ensure fonts are loaded
                    clonedCard.style.fontFamily = 'Segoe UI, Arial, sans-serif';
                }
            }
        });
        
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (err) {
        console.error('Error capturing card:', err);
        alert('Error creating image. Try right-clicking the card and using "Save image as..." or take a screenshot.');
    }
};

/**
 * Export all data as JSON file
 */
export const exportAllData = (trainers, activeTrainerId, inventory) => {
    const exportData = {
        trainers,
        activeTrainerId,
        inventory,
        exportedAt: new Date().toISOString(),
        version: '2.1',
        _m: { c: 'leander_rsr', h: '6c65616e6465725f727372' },
        // Include summary for user reference
        _summary: {
            trainerCount: trainers.length,
            trainerNames: trainers.map(t => t.name || 'Unnamed').join(', '),
            totalMoney: trainers.reduce((sum, t) => sum + (t.money || 0), 0),
            inventoryItemCount: inventory.length,
            totalPokemon: trainers.reduce((sum, t) => sum + (t.party?.length || 0) + (t.reserve?.length || 0), 0)
        }
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pta-all-trainers-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

/**
 * Export single trainer
 */
export const exportSingleTrainer = (trainerToExport, inventory) => {
    const exportData = {
        trainer: {
            ...trainerToExport,
            // Ensure money is explicitly included
            money: trainerToExport.money || 0,
            // Ensure party and reserve are included
            party: trainerToExport.party || [],
            reserve: trainerToExport.reserve || []
        },
        pokemon: [...(trainerToExport.party || []), ...(trainerToExport.reserve || [])], // Legacy compatibility
        inventory: inventory, // Include shared inventory
        exportedAt: new Date().toISOString(),
        version: '1.1',
        _m: { c: 'leander_rsr', h: '6c65616e6465725f727372' },
        // Include summary for user reference
        _summary: {
            trainerName: trainerToExport.name || 'Unnamed',
            trainerLevel: trainerToExport.level || 0,
            money: trainerToExport.money || 0,
            partyCount: (trainerToExport.party || []).length,
            reserveCount: (trainerToExport.reserve || []).length,
            inventoryItemCount: inventory.length
        }
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trainerToExport.name || 'trainer'}-pta-data.json`;
    a.click();
    URL.revokeObjectURL(url);
};

/**
 * Export single Pokemon as JSON for trading/sharing
 */
export const exportSinglePokemon = (pokemon) => {
    // Create a clean export without the id (will be regenerated on import)
    const { id, ...pokemonData } = pokemon;

    const exportData = {
        type: 'pta-pokemon',
        pokemon: {
            ...pokemonData,
            // Ensure all important fields are included
            name: pokemon.name || pokemon.species || 'Unknown',
            species: pokemon.species || 'Unknown',
            level: pokemon.level || 1,
            types: pokemon.types || ['Normal'],
            nature: pokemon.nature || 'Hardy',
            abilities: pokemon.abilities || [],
            moves: pokemon.moves || [],
            baseStats: pokemon.baseStats || { hp: 10, atk: 10, def: 10, satk: 10, sdef: 10, spd: 10 },
            addedStats: pokemon.addedStats || { hp: 0, atk: 0, def: 0, satk: 0, sdef: 0, spd: 0 },
            statPointsAvailable: pokemon.statPointsAvailable || 0,
            currentDamage: pokemon.currentDamage || 0,
            gender: pokemon.gender || '',
            avatar: pokemon.avatar || ''
        },
        exportedAt: new Date().toISOString(),
        version: '1.0',
        _m: { c: 'leander_rsr', h: '6c65616e6465725f727372' }
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const pokeName = (pokemon.name || pokemon.species || 'pokemon').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    a.download = `pokemon-${pokeName}-lv${pokemon.level || 1}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

// ============================================================
// SECURITY UTILITIES FOR IMPORT
// ============================================================

/**
 * Maximum allowed sizes for import security
 */
const IMPORT_LIMITS = {
    MAX_FILE_SIZE: 100 * 1024, // 100KB max file size
    MAX_STRING_LENGTH: 200, // Max length for name, species, etc.
    MAX_NOTES_LENGTH: 2000, // Max length for notes field
    MAX_AVATAR_LENGTH: 50 * 1024, // 50KB max for avatar data URL
    MAX_MOVES: 8, // Max moves a Pokemon can have
    MAX_ABILITIES: 5, // Max abilities
    MAX_SKILLS: 20, // Max Pokemon skills
    MAX_LEVEL: 100, // Max Pokemon level
    MAX_STAT: 50, // Max base stat value
    MAX_ADDED_STAT: 100, // Max added stat points per stat
};

/**
 * Standard Pokemon types (used as reference, but homebrew types allowed)
 */
const STANDARD_TYPES = [
    'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
    'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
    'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
];

/**
 * Standard natures (used as reference, but homebrew natures allowed)
 */
const STANDARD_NATURES = [
    'Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty',
    'Bold', 'Docile', 'Relaxed', 'Impish', 'Lax',
    'Timid', 'Hasty', 'Serious', 'Jolly', 'Naive',
    'Modest', 'Mild', 'Quiet', 'Bashful', 'Rash',
    'Calm', 'Gentle', 'Sassy', 'Careful', 'Quirky'
];

/**
 * Valid genders (strict - no homebrew needed for genders)
 */
const VALID_GENDERS = ['', 'male', 'female', 'genderless'];

/**
 * Sanitize a string by removing HTML tags and limiting length
 */
const sanitizeString = (str, maxLength = IMPORT_LIMITS.MAX_STRING_LENGTH) => {
    if (typeof str !== 'string') return '';
    // Remove HTML tags
    let clean = str.replace(/<[^>]*>/g, '');
    // Remove potential script injection patterns
    clean = clean.replace(/javascript:/gi, '');
    clean = clean.replace(/on\w+=/gi, '');
    // Trim and limit length
    return clean.trim().substring(0, maxLength);
};

/**
 * Sanitize a type string - allows homebrew types but sanitizes them
 */
const sanitizeType = (type) => {
    if (typeof type !== 'string') return 'Normal';
    const sanitized = sanitizeString(type, 30);
    return sanitized || 'Normal';
};

/**
 * Sanitize a nature string - allows homebrew natures but sanitizes them
 */
const sanitizeNature = (nature) => {
    if (typeof nature !== 'string') return 'Hardy';
    const sanitized = sanitizeString(nature, 30);
    return sanitized || 'Hardy';
};

/**
 * Validate and clamp a number within a range
 */
const clampNumber = (value, min, max, defaultValue = min) => {
    if (typeof value !== 'number' || isNaN(value)) return defaultValue;
    return Math.max(min, Math.min(max, Math.floor(value)));
};

/**
 * Validate a stats object
 */
const validateStats = (stats, maxValue) => {
    const defaultStats = { hp: 10, atk: 10, def: 10, satk: 10, sdef: 10, spd: 10 };
    if (!stats || typeof stats !== 'object') return defaultStats;

    return {
        hp: clampNumber(stats.hp, 1, maxValue, 10),
        atk: clampNumber(stats.atk, 1, maxValue, 10),
        def: clampNumber(stats.def, 1, maxValue, 10),
        satk: clampNumber(stats.satk, 1, maxValue, 10),
        sdef: clampNumber(stats.sdef, 1, maxValue, 10),
        spd: clampNumber(stats.spd, 1, maxValue, 10)
    };
};

/**
 * Validate and sanitize a move object
 * Allows homebrew moves with custom types/categories while sanitizing all text
 */
const validateMove = (move) => {
    if (!move || typeof move !== 'object') return null;

    // For category, prefer standard values but allow homebrew
    let category = sanitizeString(move.category || '', 30);
    if (!category || !['Physical', 'Special', 'Status'].includes(category)) {
        // If it's a non-standard category, keep it (homebrew) but sanitize
        category = category || 'Physical';
    }

    // For source, prefer standard values but allow homebrew
    let source = sanitizeString(move.source || '', 20);
    if (!['natural', 'taught', 'tm', 'egg'].includes(source)) {
        source = source || 'taught';
    }

    return {
        name: sanitizeString(move.name || 'Unknown Move', 50),
        type: sanitizeType(move.type), // Allows homebrew types
        category,
        damage: sanitizeString(move.damage || '', 30),
        frequency: sanitizeString(move.frequency || '', 30),
        range: sanitizeString(move.range || '', 50),
        effect: sanitizeString(move.effect || '', 500),
        description: sanitizeString(move.description || '', 1000), // Allow move descriptions
        source
    };
};

/**
 * Validate and sanitize a Pokemon skill object
 */
const validatePokemonSkill = (skill) => {
    if (!skill || typeof skill !== 'object') return null;

    return {
        name: sanitizeString(skill.name || 'Unknown', 50),
        value: clampNumber(skill.value, 1, 10, 2)
    };
};

/**
 * Validate avatar - only allow valid image data URLs or empty
 */
const validateAvatar = (avatar) => {
    if (!avatar || typeof avatar !== 'string') return '';

    // Check length limit
    if (avatar.length > IMPORT_LIMITS.MAX_AVATAR_LENGTH) return '';

    // Only allow data URLs that are images
    if (avatar.startsWith('data:image/')) {
        // Validate it's a proper data URL format
        const validImageTypes = ['data:image/png;', 'data:image/jpeg;', 'data:image/gif;', 'data:image/webp;'];
        if (validImageTypes.some(type => avatar.startsWith(type))) {
            return avatar;
        }
    }

    // Also allow HTTPS URLs to images (external sprites)
    if (avatar.startsWith('https://') && avatar.length < 500) {
        return sanitizeString(avatar, 500);
    }

    return '';
};

/**
 * Import single Pokemon from JSON data with full validation
 * Returns the Pokemon object if valid, null otherwise
 */
export const importSinglePokemon = (jsonData) => {
    try {
        // Check raw data size before parsing
        if (typeof jsonData === 'string') {
            if (jsonData.length > IMPORT_LIMITS.MAX_FILE_SIZE) {
                throw new Error('File too large. Maximum size is 100KB.');
            }
        }

        let data;
        if (typeof jsonData === 'string') {
            data = JSON.parse(jsonData);
        } else {
            data = jsonData;
        }

        // Validate that this is a Pokemon export
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format');
        }

        if (data.type !== 'pta-pokemon') {
            throw new Error('Invalid Pokemon file format. Expected type "pta-pokemon".');
        }

        if (!data.pokemon || typeof data.pokemon !== 'object') {
            throw new Error('Missing or invalid Pokemon data');
        }

        const pokemon = data.pokemon;

        // Validate and sanitize types array (allows homebrew types)
        let types = ['Normal'];
        if (Array.isArray(pokemon.types)) {
            types = pokemon.types
                .map(t => sanitizeType(t))
                .filter(t => t && t.length > 0)
                .slice(0, 3); // Allow up to 3 types for homebrew
            if (types.length === 0) types = ['Normal'];
        }

        // Validate and sanitize abilities array
        let abilities = [];
        if (Array.isArray(pokemon.abilities)) {
            abilities = pokemon.abilities
                .filter(a => typeof a === 'string')
                .map(a => sanitizeString(a, 50))
                .filter(a => a.length > 0)
                .slice(0, IMPORT_LIMITS.MAX_ABILITIES);
        }

        // Validate and sanitize moves array
        let moves = [];
        if (Array.isArray(pokemon.moves)) {
            moves = pokemon.moves
                .map(validateMove)
                .filter(m => m !== null)
                .slice(0, IMPORT_LIMITS.MAX_MOVES);
        }

        // Validate and sanitize Pokemon skills
        let pokemonSkills = [];
        if (Array.isArray(pokemon.pokemonSkills)) {
            pokemonSkills = pokemon.pokemonSkills
                .map(validatePokemonSkill)
                .filter(s => s !== null)
                .slice(0, IMPORT_LIMITS.MAX_SKILLS);
        }

        // Validate gender
        const gender = VALID_GENDERS.includes(pokemon.gender) ? pokemon.gender : '';

        // Validate nature (allows homebrew natures)
        const nature = sanitizeNature(pokemon.nature);

        // Create a new Pokemon with sanitized data and a fresh ID
        const importedPokemon = {
            id: Date.now() + Math.random(),
            name: sanitizeString(pokemon.name || pokemon.species || 'Unknown'),
            species: sanitizeString(pokemon.species || 'Unknown'),
            level: clampNumber(pokemon.level, 1, IMPORT_LIMITS.MAX_LEVEL, 1),
            experience: clampNumber(pokemon.experience, 0, 1000000, 0),
            types,
            nature,
            abilities,
            ability: sanitizeString(pokemon.ability || '', 50),
            ability2: sanitizeString(pokemon.ability2 || '', 50),
            ability3: sanitizeString(pokemon.ability3 || '', 50),
            moves,
            baseStats: validateStats(pokemon.baseStats, IMPORT_LIMITS.MAX_STAT),
            addedStats: validateStats(pokemon.addedStats, IMPORT_LIMITS.MAX_ADDED_STAT),
            statPointsAvailable: clampNumber(pokemon.statPointsAvailable, 0, 500, 0),
            currentDamage: clampNumber(pokemon.currentDamage, 0, 9999, 0),
            gender,
            avatar: validateAvatar(pokemon.avatar),
            pokemonSkills,
            regionalForm: pokemon.regionalForm ? sanitizeString(String(pokemon.regionalForm), 30) : null,
            heldItem: sanitizeString(pokemon.heldItem || '', 50),
            notes: sanitizeString(pokemon.notes || '', IMPORT_LIMITS.MAX_NOTES_LENGTH),
            // These will be regenerated based on species data
            availableAbilities: [],
            availableLevelUpMoves: [],
            statAllocationHistory: []
        };

        return importedPokemon;
    } catch (error) {
        console.error('Error importing Pokemon:', error);
        alert(`Import failed: ${error.message}`);
        return null;
    }
};

/**
 * Copy Pokemon data to clipboard for easy sharing
 */
export const copyPokemonToClipboard = (pokemon) => {
    // Create a clean export without the id
    const { id, ...pokemonData } = pokemon;

    const exportData = {
        type: 'pta-pokemon',
        pokemon: pokemonData,
        exportedAt: new Date().toISOString(),
        version: '1.0'
    };

    const dataStr = JSON.stringify(exportData);

    navigator.clipboard.writeText(dataStr).then(() => {
        alert(`${pokemon.name || pokemon.species || 'Pokemon'} copied to clipboard! Share this with another player to trade.`);
    }).catch(err => {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = dataStr;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert(`${pokemon.name || pokemon.species || 'Pokemon'} copied to clipboard!`);
    });
};
