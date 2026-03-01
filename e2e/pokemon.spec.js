import { test, expect } from '@playwright/test';

const MOCK_POKEDEX = [
    { id: 1,  species: 'Bulbasaur', types: ['Grass', 'Poison'],
      baseStats: { hp:5, atk:5, def:5, satk:7, sdef:7, spd:5 },
      abilities: { basic:['Overgrow'], adv:[], high:[] },
      skills: { overland:4, swim:2, jump:2, power:2 } },
    { id: 25, species: 'Pikachu', types: ['Electric'],
      baseStats: { hp:4, atk:6, def:4, satk:5, sdef:5, spd:10 },
      abilities: { basic:['Static'], adv:[], high:[] },
      skills: { overland:5, swim:2, jump:3, power:2 } },
];
const MOCK_GAME_DATA = { moves:{}, abilities:{}, items:{}, features:{}, natures:{} };

async function setupPage(page) {
    await page.route('**/pokedex.min.json',       r => r.fulfill({ json: MOCK_POKEDEX }));
    await page.route('**/pta-game-data.min.json', r => r.fulfill({ json: MOCK_GAME_DATA }));
    await page.goto('/');
    await page.waitForSelector('[aria-label="Loading application data"]',
        { state: 'detached', timeout: 15_000 });
}

/** Navigate to the Pokémon Team tab. */
async function goToPokemonTab(page) {
    await page.locator('.nav-button', { hasText: 'Pokémon Team' }).click();
    // Wait for the tab to become active
    await expect(
        page.locator('.nav-button[aria-current="page"]')
    ).toContainText('Pokémon Team', { timeout: 10_000 });
}

test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await goToPokemonTab(page);
});

// ── Tests ────────────────────────────────────────────────────────────────────

test('empty party shows "Add Your First Pokémon" CTA', async ({ page }) => {
    await expect(
        page.getByRole('button', { name: /Add Your First Pokémon/i })
    ).toBeVisible();
});

test('clicking add button shows a new Pokémon card in edit mode', async ({ page }) => {
    await page.getByRole('button', { name: /Add Your First Pokémon/i }).click();

    // addPokemon() calls setEditingPokemon → card opens in expanded/edit mode
    await expect(page.locator('.pokemon-card-expanded')).toBeVisible({ timeout: 5_000 });
});

test('clicking a collapsed card opens the edit view', async ({ page }) => {
    // Add a card and immediately close it
    await page.getByRole('button', { name: /Add Your First Pokémon/i }).click();
    await expect(page.locator('.pokemon-card-expanded')).toBeVisible();

    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.locator('.pokemon-card-collapsed')).toBeVisible();

    // Click the collapsed card to reopen
    await page.locator('.pokemon-card-collapsed').click();
    await expect(page.locator('.pokemon-card-expanded')).toBeVisible();
    await expect(page.locator('.pokemon-card-tabs')).toBeVisible();
});

test('edit tab navigation: Stats tab shows stat grid, Moves tab shows move summary', async ({ page }) => {
    await page.getByRole('button', { name: /Add Your First Pokémon/i }).click();
    await expect(page.locator('.pokemon-card-expanded')).toBeVisible();

    const card = page.locator('.pokemon-card-expanded');

    // Click the "stats" tab
    await card.locator('.pokemon-card-tabs .tab', { hasText: 'stats' }).click();
    // "Stat Points Available:" is unique to the Pokémon card stats tab
    await expect(card.getByText(/Stat Points Available/)).toBeVisible({ timeout: 5_000 });

    // Click the "moves" tab
    await card.locator('.pokemon-card-tabs .tab', { hasText: 'moves' }).click();
    // "Moves: N/M" summary line is always rendered (even with 0 moves)
    await expect(card.getByText(/Moves:\s+\d+\/\d+/)).toBeVisible({ timeout: 5_000 });
});

test('clicking Done collapses the card', async ({ page }) => {
    await page.getByRole('button', { name: /Add Your First Pokémon/i }).click();
    await expect(page.locator('.pokemon-card-expanded')).toBeVisible();

    await page.getByRole('button', { name: 'Done' }).click();

    // Edit tabs should be gone; collapsed card should appear
    await expect(page.locator('.pokemon-card-tabs')).not.toBeVisible();
    await expect(page.locator('.pokemon-card-collapsed')).toBeVisible({ timeout: 5_000 });
});
