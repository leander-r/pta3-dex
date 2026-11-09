import { test, expect } from '@playwright/test';

// Minimal mock data — mirrors smoke.spec.js
const MOCK_POKEDEX = [
    { id: 1, species: 'Bulbasaur', types: ['Grass', 'Poison'],
      baseStats: { hp: 5, atk: 5, def: 5, satk: 7, sdef: 7, spd: 5 },
      abilities: { basic: ['Overgrow'], adv: [], high: [] },
      skills: { overland: 4, swim: 2, jump: 2, power: 2 } },
];
const MOCK_GAME_DATA = { moves: {}, abilities: {}, items: {}, features: {}, natures: {} };

async function setupPage(page) {
    await page.route('**/pokedex.min.json',       r => r.fulfill({ json: MOCK_POKEDEX }));
    await page.route('**/pta-game-data.min.json', r => r.fulfill({ json: MOCK_GAME_DATA }));
    await page.goto('/');
    await page.waitForSelector('[aria-label="Loading application data"]',
        { state: 'detached', timeout: 15_000 });
}

async function goToInventoryTab(page) {
    await page.locator('.nav-button', { hasText: 'Inventory' }).click();
    await expect(
        page.locator('.nav-button[aria-current="page"]')
    ).toContainText('Inventory', { timeout: 10_000 });
}

test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await goToInventoryTab(page);
});

test('empty inventory shows the empty state', async ({ page }) => {
    await expect(page.getByText('Inventory is empty')).toBeVisible();
});

test('adding a custom item (not in the catalog) makes it appear in the inventory list', async ({ page }) => {
    await page.getByTitle('Add Item').click();
    await page.getByPlaceholder('Search items by name or effect...').fill('Mystery Berry');

    // Catalog is empty (MOCK_GAME_DATA.items = {}), so the custom-item panel always shows
    await expect(page.getByTestId('custom-item-panel')).toBeVisible();
    await page.getByRole('button', { name: /Custom$/ }).click();

    // Close the add-item panel and confirm the new item is now in the inventory grid
    await page.getByTitle('Close Add Item').click();
    await expect(page.getByText('Mystery Berry')).toBeVisible();
    await expect(page.getByText('Inventory is empty')).not.toBeVisible();
});

test('expanding an item reveals quantity controls, and − reduces quantity', async ({ page }) => {
    await page.getByTitle('Add Item').click();
    await page.getByPlaceholder('Search items by name or effect...').fill('Potion');
    await page.getByRole('button', { name: /Custom$/ }).click();
    await page.getByTitle('Close Add Item').click();

    await page.getByTitle(/Potion — tap to manage/).click();
    const qtyInput = page.getByLabel('Quantity of Potion');
    await expect(qtyInput).toHaveValue('1');

    await page.getByRole('button', { name: '−' }).click();
    // Quantity hits 0 -> item is removed entirely (component deletes on qty<=0)
    await expect(page.getByText('Potion')).not.toBeVisible();
});
