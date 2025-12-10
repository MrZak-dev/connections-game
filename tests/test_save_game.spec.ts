import { test, expect } from '@playwright/test';

test('test game saving and loading', async ({ page }) => {
  await page.goto('http://localhost:8000');
  await page.waitForSelector('.word-button');

  // 1. Solve the "yellow" group
  await page.click('button[data-word="JOYFUL"]');
  await page.click('button[data-word="GLAD"]');
  await page.click('button[data-word="CHEERFUL"]');
  await page.click('button[data-word="MERRY"]');
  await page.click('button:has-text("Submit")');

  // Wait for the solved group to appear
  await page.waitForSelector('#solved-groups .bg-connections-yellow');

  // 2. Reload the page
  await page.reload();
  await page.waitForSelector('.word-button');

  // 3. Assert that the game has loaded the saved state
  await expect(page.locator('.word-button')).toHaveCount(12);
  await expect(page.locator('#solved-groups .bg-connections-yellow')).toHaveCount(1);
});
