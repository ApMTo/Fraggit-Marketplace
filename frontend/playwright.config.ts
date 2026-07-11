import { defineConfig, devices } from '@playwright/test';

const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3001';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: frontendUrl,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : [
        {
          command: 'pnpm --filter @fraggit/backend dev',
          url: `${backendUrl}/api/categories`,
          cwd: '..',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
        {
          command: 'pnpm --filter @fraggit/frontend dev',
          url: frontendUrl,
          cwd: '..',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      ],
});
