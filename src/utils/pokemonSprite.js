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
        .replace(/[.'\u2019]/g, '')      // remove periods and apostrophes
        .replace(/[:\s]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

// Returns the auto-generated sprite URL for a Pokémon, or null if no species is set.
export const getPokemonSprite = (pokemon) => {
    const slug = speciesSlug(pokemon?.species);
    return slug ? `https://play.pokemonshowdown.com/sprites/gen5/${slug}.png` : null;
};

// Returns the sprite URL for a mega/alternate form.
// megaForm is the form object from the Pokédex entry (e.g. { name: "Mega X" }).
// Showdown slugs the form as: {species}-{formname-lowercased-nospaces}
//   "Mega"    → charizard-mega
//   "Mega X"  → charizard-megax
//   "Primal"  → groudon-primal
//   "Attack"  → deoxys-attack
export const getMegaSprite = (pokemon, megaForm) => {
    const base = speciesSlug(pokemon?.species);
    if (!base || !megaForm?.name) return getPokemonSprite(pokemon);
    const formSlug = megaForm.name.toLowerCase().replace(/\s+/g, '');
    return `https://play.pokemonshowdown.com/sprites/gen5/${base}-${formSlug}.png`;
};

// Returns the effective display image: custom upload first, then auto sprite.
export const getPokemonDisplayImage = (pokemon) =>
    pokemon?.avatar || getPokemonSprite(pokemon) || null;
