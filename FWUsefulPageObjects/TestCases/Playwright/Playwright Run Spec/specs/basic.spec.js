import { test, expect } from '@playwright/test';

test('basic test', {
  tag: '@smoke',
}, async ({ page }) => {
  await page.goto('https://playwright.dev/');
  // ...
});

test('another test @smoke', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  // ...
});

test.afterAll(async () => {
  console.log('Done with tests');
  // ...
});

