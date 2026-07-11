import { test, expect } from '@playwright/test';
import {
  areE2eServicesAvailable,
  createTestUserPayload,
  registerAndGetVerificationToken,
} from './helpers/test-user';

test.describe('Auth flow', () => {
  test.beforeAll(async () => {
    const available = await areE2eServicesAvailable();
    test.skip(!available, 'Backend and Redis must be running for auth flow e2e');
  });

  test('verifies email and opens dashboard', async ({ page }) => {
    const user = createTestUserPayload();
    const token = await registerAndGetVerificationToken(user);

    await page.goto(`/auth/verify/${token}`);

    await expect(page.getByText("You're all set")).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Go to dashboard' }).click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard Page' })).toBeVisible();
  });

  test('logs in with verified account', async ({ page }) => {
    const user = createTestUserPayload();
    const token = await registerAndGetVerificationToken(user);

    await page.goto(`/auth/verify/${token}`);
    await expect(page.getByText("You're all set")).toBeVisible({ timeout: 15_000 });

    await page.context().clearCookies();
    await page.goto('/login');

    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL('/dashboard', { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Dashboard Page' })).toBeVisible();
  });
});
