import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const puzzles = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../puzzles.json'), 'utf-8'));
const firstPuzzle = puzzles.puzzles[0];

test('test game saving and loading', async ({ page }) => {
  await page.goto('http://localhost:8000');
  await page.waitForSelector('.word-button');

  // 1. Solve one group
  const yellowWords = firstPuzzle.groups.yellow.words;
  for (const word of yellowWords) {
    await page.click(`button:has-text("${word}")`);
  }
  await page.click('#submit-button');

  // Wait for the solved group to appear before reloading
  await expect(page.locator('#solved-groups .bg-connections-yellow')).toBeVisible();

  // 2. Reload the page
  await page.reload();
  await page.waitForSelector('.word-button');

  // 3. Assert that the game has loaded the saved state
  await expect(page.locator('.word-button')).toHaveCount(12); // 16 - 4
  const solvedGroup = page.locator('#solved-groups .bg-connections-yellow');
  await expect(solvedGroup).toHaveCount(1);
  await expect(solvedGroup.locator('p').first()).toHaveText(firstPuzzle.groups.yellow.description);
});
