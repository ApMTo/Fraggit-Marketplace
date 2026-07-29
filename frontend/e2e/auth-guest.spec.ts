import { test, expect } from '@playwright/test';

test.describe('Guest auth pages', () => {
  test('login page renders form fields', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('register page renders form fields', async ({ page }) => {
    await page.goto('/register');

    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Display name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
  });

  test('redirects unauthenticated users from orders to login', async ({ page }) => {
    await page.goto('/orders');

    await expect(page).toHaveURL(/\/login\?next=%2Forders/);
  });

  test('shows validation errors for empty login submit', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });
});
