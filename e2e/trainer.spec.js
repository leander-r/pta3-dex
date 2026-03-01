import { test, expect } from '@playwright/test';

// Minimal mock data — mirrors smoke.spec.js
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

/** Seed localStorage with a trainer at level 1 so level-up is available. */
const SEEDED_SAVE = JSON.stringify({
    version: '2.1',
    activeTrainerId: 1,
    inventory: [],
    customSpecies: [],
    trainers: [{
        id: 1,
        name: 'Ash',
        gender: 'male',
        age: '',
        avatar: '',
        level: 1,
        experience: 0,
        classes: ['Ace Trainer'],
        stats: { hp:10, atk:8, def:8, satk:8, sdef:8, spd:8 },
        statPoints: 0,
        levelStatPoints: 0,
        featPoints: 0,
        skills: {},
        features: [],
        notes: '',
        badges: [],
        money: 0,
        party: [],
        reserve: [],
    }],
});

/** Set up routes and navigate; waits for the loading spinner to go away. */
async function setupPage(page) {
    await page.route('**/pokedex.min.json',       r => r.fulfill({ json: MOCK_POKEDEX }));
    await page.route('**/pta-game-data.min.json', r => r.fulfill({ json: MOCK_GAME_DATA }));
    await page.goto('/');
    await page.waitForSelector('[aria-label="Loading application data"]',
        { state: 'detached', timeout: 15_000 });
}

// ── Tests that work with the default (fresh, level-0) state ──────────────────

test.describe('Trainer tab — fresh state', () => {
    test.beforeEach(async ({ page }) => {
        await setupPage(page);
        // Trainer tab is the default; no navigation needed
    });

    test('edit trainer name persists after blur', async ({ page }) => {
        const nameInput = page.getByPlaceholder('Trainer Name...');
        await nameInput.fill('Red');
        await nameInput.blur();

        // Value should still be "Red" — auto-save keeps it
        await expect(nameInput).toHaveValue('Red');
    });

    test('level-down button is disabled at minimum level', async ({ page }) => {
        // Default trainer starts at level 0 which satisfies disabled condition (level <= 1)
        const decreaseBtn = page.getByRole('button', { name: 'Decrease level' });
        await expect(decreaseBtn).toBeDisabled();
    });

    test('add a badge via the confirm dialog', async ({ page }) => {
        await page.getByRole('button', { name: '+ Add', exact: true }).click();

        // Confirm modal should appear with "Add Badge" heading
        await expect(page.locator('#confirm-modal-title')).toContainText('Add Badge');

        // Type the badge name and confirm
        await page.fill('[placeholder="Badge name..."]', 'Boulder Badge');
        // Scope to the dialog to avoid matching other "Add …" buttons on the page
        await page.locator('[role="dialog"]').getByRole('button', { name: 'Add', exact: true }).click();

        // Badge chip should appear
        await expect(page.locator('text=Boulder Badge').first()).toBeVisible();
    });

    test('theme persists after page reload', async ({ page }) => {
        const html = page.locator('html');
        const before = await html.getAttribute('data-theme');

        // Toggle theme
        await page.locator('[aria-label="Open menu"]').click();
        await page.locator('.header-menu-item', { hasText: /mode/i }).click();

        const toggled = await html.getAttribute('data-theme');
        expect(toggled).not.toBe(before);

        // Reload and re-mock the fetches
        await page.route('**/pokedex.min.json',       r => r.fulfill({ json: MOCK_POKEDEX }));
        await page.route('**/pta-game-data.min.json', r => r.fulfill({ json: MOCK_GAME_DATA }));
        await page.reload();
        await page.waitForSelector('[aria-label="Loading application data"]',
            { state: 'detached', timeout: 15_000 });

        await expect(page.locator('html')).toHaveAttribute('data-theme', toggled);
    });
});

// ── Test that requires a pre-existing level-1 trainer ────────────────────────

test.describe('Trainer tab — seeded level-1 trainer', () => {
    test.beforeEach(async ({ page }) => {
        // Seed localStorage BEFORE the page loads
        await page.addInitScript((saveData) => {
            localStorage.setItem('pta-enhanced-save-data', saveData);
        }, SEEDED_SAVE);

        await setupPage(page);
    });

    test('level-up button increments the level display', async ({ page }) => {
        const levelDisplay = page.locator('.level-value');
        await expect(levelDisplay).toContainText('1');

        await page.getByRole('button', { name: 'Increase level' }).click();

        await expect(levelDisplay).toContainText('2');
    });
});
