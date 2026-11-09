import { test, expect } from '@playwright/test';

const MOCK_POKEDEX = [];
const MOCK_GAME_DATA = { moves: {}, abilities: {}, items: {}, features: {}, natures: {} };

async function setupPage(page) {
    await page.route('**/pokedex.min.json',       r => r.fulfill({ json: MOCK_POKEDEX }));
    await page.route('**/pta-game-data.min.json', r => r.fulfill({ json: MOCK_GAME_DATA }));
    await page.goto('/');
    await page.waitForSelector('[aria-label="Loading application data"]',
        { state: 'detached', timeout: 15_000 });
}

test.beforeEach(async ({ page }) => {
    await setupPage(page);
    // GM Tools lives under the mobile "More" overflow on narrow viewports, but the
    // default desktop viewport used in CI shows it directly in the nav bar.
    await page.locator('.nav-button', { hasText: 'GM Tools' }).click();
    await expect(page.locator('.nav-button[aria-current="page"]')).toContainText('GM Tools');
});

test('GM Tools tab renders its section tabs and defaults to Capture Rates', async ({ page }) => {
    await expect(page.locator('.section-title-purple[aria-label="Capture Rate Calculator"]')).toBeVisible();
});

const sections = [
    { label: '⚔️ Encounter Guide', heading: 'Encounter Difficulty' },
    { label: '💰 Rewards & Loot', heading: 'Wild Goods Finder (d100)' },
    { label: '🏟️ Gym Guide', heading: 'Gym Leader Difficulty (by Badge Count)' },
    { label: '🧑 NPC Stats', heading: 'NPC Trainer Stat Blocks' },
    { label: '🗂️ NPC Roster', heading: 'NPC Roster' },
    { label: '🎯 Initiative Tracker', heading: 'Initiative Tracker' },
    { label: '🏆 Contest', heading: 'Contest Setup' },
];

for (const { label, heading } of sections) {
    test(`navigating to "${label}" renders its panel`, async ({ page }) => {
        await page.locator('.tabs .tab', { hasText: label }).click();
        await expect(page.locator(`.section-title-purple[aria-label="${heading}"]`)).toBeVisible({ timeout: 10_000 });
    });
}

test('Capture Rate Calculator computes a result from the default inputs', async ({ page }) => {
    // Sanity check one real tool beyond pure navigation: the calculator should
    // render a computed capture percentage without any input changes.
    await expect(page.getByText(/% chance of capture/)).toBeVisible({ timeout: 10_000 });
});
