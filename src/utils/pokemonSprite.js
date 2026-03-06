// ============================================================
// Pokémon Sprite Utility
// ============================================================
// Derives a Pokémon Showdown sprite URL from a species name so that
// Pokémon images are available automatically without manual uploads.
// Uses the name rather than a numeric ID so the result is correct
// regardless of whether PTA's internal Pokédex IDs match the national
// Pokédex numbers.

export const speciesSlug = (species) =>
    (species || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // strip diacritics (e.g. Flabébé → Flabebe)
        .toLowerCase()
        .replace(/♀/g, '-f')
        .replace(/♂/g, '-m')
        .replace(/[.'\u2019%]/g, '')      // remove periods, apostrophes, and % (e.g. Zygarde-10%)
        .replace(/\s*\([^)]*\)/g, '')     // strip parenthetical suffixes (e.g. "Raichu (Island)" → "raichu")
        .replace(/[:\s]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

// Maps PTA3 parenthetical species names (lowercase) to exact Pokémon Showdown sprite slugs.
// Required because the same suffix can map to different regional forms depending on species
// (e.g. "(Iron-rich)" = Alolan for Geodude, Hisuian for Sliggoo, Galarian for Stunfisk).
const PTA3_SPECIES_SLUG_OVERRIDES = {
    // ── Alolan forms ──────────────────────────────────────────────────────────
    'raichu (island)':              'raichu-alola',
    'rattata (island)':             'rattata-alola',
    'raticate (island)':            'raticate-alola',
    'exeggutor (island)':           'exeggutor-alola',
    'marowak (volcanic)':           'marowak-alola',
    'diglett (volcanic)':           'diglett-alola',
    'dugtrio (volcanic)':           'dugtrio-alola',
    'meowth (tropical climate)':    'meowth-alola',
    'persian (tropical climate)':   'persian-alola',
    'geodude (iron-rich)':          'geodude-alola',
    'graveler (iron-rich)':         'graveler-alola',
    'golem (iron-rich)':            'golem-alola',
    'grimer (oil polluted)':        'grimer-alola',
    'muk (oil polluted)':           'muk-alola',
    'sandshrew (icy mountain)':     'sandshrew-alola',
    'sandslash (icy mountain)':     'sandslash-alola',
    'vulpix (icy mountain)':        'vulpix-alola',
    'ninetales (icy mountain)':     'ninetales-alola',
    // ── Galarian forms ────────────────────────────────────────────────────────
    'zigzagoon (urban)':            'zigzagoon-galar',
    'linoone (urban)':              'linoone-galar',
    'meowth (cold climate)':        'meowth-galar',
    "farfetch'd (massive leeks)":   'farfetchd-galar',
    'weezing (heavy pollution)':    'weezing-galar',
    'corsola (dead seas)':          'corsola-galar',
    'darumaka (icy mountain)':      'darumaka-galar',
    'darmanitan zen mode':          'darmanitan-zen',
    'darmanitan (icy mountain)':    'darmanitan-galar',
    'darmanitan (icy mountain) zen mode': 'darmanitan-galarzen',
    'mr. mime (icy mountain)':      'mrmime-galar',
    'yamask (stone ruins)':         'yamask-galar',
    'stunfisk (iron-rich)':         'stunfisk-galar',
    'ponyta (forest glade)':        'ponyta-galar',
    'slowpoke (spice diet)':        'slowpoke-galar',
    'slowbro (spice diet)':         'slowbro-galar',
    'slowking (spice diet)':        'slowking-galar',
    // ── Hisuian forms ─────────────────────────────────────────────────────────
    'qwilfish (dark waters)':       'qwilfish-hisui',
    'sneasel (badlands)':           'sneasel-hisui',
    'growlithe (ancient)':          'growlithe-hisui',
    'arcanine (ancient)':           'arcanine-hisui',
    'voltorb (antique)':            'voltorb-hisui',
    'electrode (antique)':          'electrode-hisui',
    'lilligant (high mountain)':    'lilligant-hisui',
    'braviary (tundra)':            'braviary-hisui',
    'sliggoo (iron-rich)':          'sliggoo-hisui',
    'goodra (iron-rich)':           'goodra-hisui',
    'avalugg (mountainous)':        'avalugg-hisui',
    'zorua (icy mountain)':         'zorua-hisui',
    'zoroark (icy mountain)':       'zoroark-hisui',
    // ── Paldean forms ─────────────────────────────────────────────────────────
    'wooper (high ground)':         'wooper-paldea',
    'tauros (combative)':           'tauros-paldeacombat',
    'tauros (blaze breed)':         'tauros-paldeablaze',
    'tauros (aqua breed)':          'tauros-paldeaaqua',
    // ── Names that slug incorrectly (hyphen inserted where Showdown has none) ─
    'mr. mime':                     'mrmime',
    'mr. rime':                     'mrrime',
    'mime jr.':                     'mimejr',
    'porygon 2':                    'porygon2',
    'porygon-z':                    'porygonz',
    'nidoran♀':                     'nidoranf',
    'nidoran♂':                     'nidoranm',
    'jangmo-o':                     'jangmoo',
    'hakamo-o':                     'hakamoo',
    'kommo-o':                      'kommoo',
    // ── Alternate forms ───────────────────────────────────────────────────────
    'wormadam (plant cloak)':       'wormadam',
    'wormadam (sandy cloak)':       'wormadam-sandy',
    'wormadam (trash cloak)':       'wormadam-trash',
    'lycanroc (day)':               'lycanroc',
    'lycanroc (night)':             'lycanroc-midnight',
    'lycanroc (dusk)':              'lycanroc-dusk',
    'aegislash (shield)':           'aegislash',
    'aegislash (sword)':            'aegislash-blade',
    'wishiwashi (single form)':     'wishiwashi',
    'wishiwashi (school form)':     'wishiwashi-school',
    'palafin (zero)':               'palafin',
    'palafin (hero)':               'palafin-hero',
    'gimmighoul (chest)':           'gimmighoul',
    'gimmighoul (roaming)':         'gimmighoul-roaming',
    'pumpkaboo (small)':            'pumpkaboo-small',
    'gourgeist (small)':            'gourgeist-small',
    'ursaluna (blood moon)':        'ursaluna-bloodmoon',
};

// Maps PTA regional/alternate form names to Pokémon Showdown sprite suffixes.
const REGIONAL_FORM_SUFFIXES = {
    // Regional variants
    'alolan':   'alola',
    'galarian': 'galar',
    'hisuian':  'hisui',
    'paldean':  'paldea',
    // Lycanroc alternate forms (stored as regionalForm in evolutionChains)
    'night':    'midnight',
    'dusk':     'dusk',
};

// Returns the auto-generated sprite URL for a Pokémon, or null if no species is set.
// Handles regional forms by appending the appropriate Showdown suffix.
export const getPokemonSprite = (pokemon) => {
    const species = pokemon?.species || '';
    if (!species) return null;
    // Check per-species override table first (handles parenthetical PTA3 names)
    const override = PTA3_SPECIES_SLUG_OVERRIDES[species.toLowerCase()];
    if (override) {
        return `https://play.pokemonshowdown.com/sprites/gen5/${override}.png`;
    }
    const slug = speciesSlug(species);
    if (!slug) return null;
    const formSuffix = REGIONAL_FORM_SUFFIXES[(pokemon?.regionalForm || '').toLowerCase()];
    const fullSlug = formSuffix ? `${slug}-${formSuffix}` : slug;
    return `https://play.pokemonshowdown.com/sprites/gen5/${fullSlug}.png`;
};

// Returns the sprite URL for a mega/alternate form.
// megaForm is the form object from the Pokédex entry (e.g. { name: "Mega X" }).
// Showdown slugs the form as: {species}-{formname-lowercased-nospaces}
//   "Mega"    → charizard-mega
//   "Mega X"  → charizard-megax
//   "Primal"  → groudon-primal
//   "Attack"  → deoxys-attack
export const getMegaSprite = (pokemon, megaForm) => {
    // Allow form data to override the base species slug (e.g. Zygarde-10% → Complete uses Zygarde's sprite)
    const base = speciesSlug(megaForm?.baseSpeciesOverride || pokemon?.species);
    if (!base || !megaForm?.name) return getPokemonSprite(pokemon);
    // Strip the base species name from the form name so the qualifier is correct:
    // "Mega Charizard X" → "megax", "Mega Venusaur" → "mega", "10%" → "10"
    const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const formSlug = megaForm.name.toLowerCase()
        .replace(new RegExp(escapedBase, 'g'), '')
        .replace(/[%\s]/g, '');
    return `https://play.pokemonshowdown.com/sprites/gen5/${base}-${formSlug}.png`;
};

export const getGigantamaxSprite = (pokemon) => {
    const base = speciesSlug(pokemon?.species);
    if (!base) return getPokemonSprite(pokemon);
    return `https://play.pokemonshowdown.com/sprites/gen5/${base}-gmax.png`;
};

// Returns the effective display image: custom upload first, then auto sprite.
export const getPokemonDisplayImage = (pokemon) =>
    pokemon?.avatar || getPokemonSprite(pokemon) || null;
