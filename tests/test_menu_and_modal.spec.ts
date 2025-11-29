import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Read the puzzles from the JSON file
const puzzles = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../puzzles.json'), 'utf-8'));

test.describe('Menu and Modal Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000');
    // Wait for the game board to be populated to ensure the page is interactive
    await page.waitForSelector('.word-button');
  });

  test('should open and close the menu', async ({ page }) => {
    // Open the menu
    await page.click('#menu-button');
    await expect(page.locator('#left-side-menu')).toBeVisible();

    // Close the menu
    await page.click('#close-menu-button');
    await expect(page.locator('#left-side-menu')).toBeHidden();
  });

  test('should open and close the how-to-play modal', async ({ page }) => {
    // Open the modal
    await page.click('#help-button');
    await expect(page.locator('#how-to-play-modal')).toBeVisible();

    // Close the modal
    await page.click('#close-how-to-play-modal');
    await expect(page.locator('#how-to-play-modal')).toBeHidden();
  });
});
