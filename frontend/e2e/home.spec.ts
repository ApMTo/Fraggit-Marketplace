import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('shows Fraggit branding and guest actions', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Fraggit' })).toBeVisible();
    await expect(
      page.getByRole('main').getByRole('link', { name: 'Create account' }),
    ).toBeVisible();
    await expect(page.getByRole('main').getByRole('link', { name: 'Sign in' })).toBeVisible();
  });

  test('navigates to login page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('main').getByRole('link', { name: 'Sign in' }).click();

    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });
});
