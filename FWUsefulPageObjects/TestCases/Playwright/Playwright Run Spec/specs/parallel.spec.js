import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'parallel' });

test.describe('A, runs in parallel with B', () => {
  test.describe.configure({ mode: 'default' });
  test('in order A1', async ({ page }) => {});
  test('in order A2', async ({ page }) => {});
});

test.describe('B, runs in parallel with A', () => {
  test.describe.configure({ mode: 'default' });
  test('in order B1', async ({ page }) => {});
  test('in order B2', async ({ page }) => {});
});