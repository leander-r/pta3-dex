import { test, expect } from '@playwright/test';

const MOCK_POKEDEX = [
    { id: 1,  species: 'Bulbasaur', types: ['Grass','Poison'],
      baseStats: { hp:5,atk:5,def:5,satk:7,sdef:7,spd:5 },
      abilities: { basic:['Overgrow'],adv:[],high:[] },
      skills: { overland:4,swim:2,jump:2,power:2 } },
    { id: 25, species: 'Pikachu',   types: ['Electric'],
      baseStats: { hp:4,atk:6,def:4,satk:5,sdef:5,spd:10 },
      abilities: { basic:['Static'],adv:[],high:[] },
      skills: { overland:5,swim:2,jump:3,power:2 } },
];
const MOCK_GAME_DATA = { moves:{}, abilities:{}, items:{}, features:{}, natures:{} };

// All visited tabs stay mounted and are hidden via display:none on their wrapper div.
// This selector finds the h2 in whichever tab panel is currently visible.
const ACTIVE_H2 = '.content-area > div:not([style*="none"]) h2.section-title';

// Mock external fetches + navigate + wait for data to load
test.beforeEach(async ({ page }) => {
    await page.route('**/pokedex.min.json',       r => r.fulfill({ json: MOCK_POKEDEX }));
    await page.route('**/pta-game-data.min.json', r => r.fulfill({ json: MOCK_GAME_DATA }));
    await page.goto('/');
    await page.waitForSelector('[aria-label="Loading application data"]',
        { state: 'detached', timeout: 15_000 });
});

test('app shell renders header and navigation', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[role="navigation"]')).toBeVisible();
    await expect(page.locator('.nav-button')).toHaveCount(7);
});

test('trainer tab is active by default', async ({ page }) => {
    await expect(page.locator('.nav-button[aria-current="page"]')).toContainText('Trainer');
    // Trainer tab uses a two-column layout (no h2.section-title); check for the profile card
    await expect(page.locator('.content-area > div:not([style*="none"]) .trainer-layout')).toBeVisible();
});

test('navigate to Pokémon Team tab', async ({ page }) => {
    await page.locator('.nav-button', { hasText: 'Pokémon Team' }).click();
    await expect(page.locator('.nav-button[aria-current="page"]')).toContainText('Pokémon Team');
    await expect(page.locator(ACTIVE_H2)).toBeVisible({ timeout: 10_000 });
});

test('navigate to Inventory tab', async ({ page }) => {
    await page.locator('.nav-button', { hasText: 'Inventory' }).click();
    await expect(page.locator('.nav-button[aria-current="page"]')).toContainText('Inventory');
    await expect(page.locator(ACTIVE_H2)).toBeVisible({ timeout: 10_000 });
});

test('navigate to Dice Roller tab', async ({ page }) => {
    await page.locator('.nav-button', { hasText: 'Dice Roller' }).click();
    await expect(page.locator('.nav-button[aria-current="page"]')).toContainText('Dice Roller');
    await expect(page.locator(ACTIVE_H2)).toBeVisible({ timeout: 10_000 });
});

test('navigate to Campaign Notes tab', async ({ page }) => {
    await page.locator('.nav-button', { hasText: 'Campaign Notes' }).click();
    await expect(page.locator('.nav-button[aria-current="page"]')).toContainText('Campaign Notes');
    await expect(page.locator(ACTIVE_H2)).toBeVisible({ timeout: 10_000 });
});

test('theme toggle switches between light and dark', async ({ page }) => {
    const html         = page.locator('html');
    const initialTheme = await html.getAttribute('data-theme');

    // Theme toggle is now inside the hamburger menu
    await page.locator('[aria-label="Open menu"]').click();
    await page.locator('.header-menu-item', { hasText: /mode/i }).click();

    const newTheme = await html.getAttribute('data-theme');
    expect(newTheme).not.toBe(initialTheme);

    // Toggle back
    await page.locator('[aria-label="Open menu"]').click();
    await page.locator('.header-menu-item', { hasText: /mode/i }).click();
    await expect(html).toHaveAttribute('data-theme', initialTheme);
});
