import { test, expect } from '@playwright/test';

test.describe('Menu and Modal Functionality on End Screens', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000');
    // Wait for the game board to be populated to ensure the page is interactive
    await page.waitForSelector('.word-button');
  });

  test('should open and close the menu and modal on the win screen', async ({ page }) => {
    // Manually show the success screen
    await page.evaluate(() => {
      document.getElementById('game-screen').classList.add('hidden');
      document.getElementById('success-screen').classList.remove('hidden');
    });

    await expect(page.locator('#success-screen')).toBeVisible();

    // Test menu on success screen
    await page.click('[data-testid="menu-button-success"]');
    await expect(page.locator('#left-side-menu')).toBeVisible();
    await page.click('#close-menu-button');
    await expect(page.locator('#left-side-menu')).toBeHidden();

    // Test modal on success screen
    await page.click('[data-testid="help-button-success"]');
    await expect(page.locator('#how-to-play-modal')).toBeVisible();
    await page.click('#close-how-to-play-modal');
    await expect(page.locator('#how-to-play-modal')).toBeHidden();
  });

  test('should open and close the menu and modal on the loss screen', async ({ page }) => {
    // Manually show the failure screen
    await page.evaluate(() => {
      document.getElementById('game-screen').classList.add('hidden');
      document.getElementById('failure-screen').classList.remove('hidden');
    });

    await expect(page.locator('#failure-screen')).toBeVisible();

    // Test menu on failure screen
    await page.click('[data-testid="menu-button-failure"]');
    await expect(page.locator('#left-side-menu')).toBeVisible();
    await page.click('#close-menu-button');
    await expect(page.locator('#left-side-menu')).toBeHidden();

    // Test modal on failure screen
    await page.click('[data-testid="help-button-failure"]');
    await expect(page.locator('#how-to-play-modal')).toBeVisible();
    await page.click('#close-how-to-play-modal');
    await expect(page.locator('#how-to-play-modal')).toBeHidden();
  });
});
