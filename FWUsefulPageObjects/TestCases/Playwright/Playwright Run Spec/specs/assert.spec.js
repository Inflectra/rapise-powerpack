import { test, expect } from '@playwright/test';

test('assert1', {
  tag: '@assertions',
}, async ({ page }) => {
});

test('assert2 @assertions', async ({ page }) => {
});

test('assert a value w', async ({ page }) => {
  const value = 1;
  expect(value).toBe(1);
  expect(value).toBe(2);
});

test('assert a value r', async ({ page }) => {
  const value = 2;
  expect(value).toBe(2);
  expect(value).toBe(2);
  expect(value).toBe(2);
  expect(value).toBe(2);
});

test.afterAll(async () => {
});

