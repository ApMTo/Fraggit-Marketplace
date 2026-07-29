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

  test('verifies email and opens home', async ({ page }) => {
    const user = createTestUserPayload();
    const token = await registerAndGetVerificationToken(user);

    await page.goto(`/auth/verify/${token}`);

    await expect(page.getByText("You're all set")).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL('/');
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

    await expect(page).toHaveURL('/', { timeout: 15_000 });
  });
});
