import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.SIGNALHARVESTER_WEB_URL || 'http://localhost:5173';
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const chromiumUse = chromiumExecutable
  ? {
      ...devices['Desktop Chrome'],
      launchOptions: { executablePath: chromiumExecutable },
    }
  : devices['Desktop Chrome'];

export default defineConfig({
  testDir: './tests/e2e/live',
  testMatch: '**/*.live.spec.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: 'list',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  outputDir: 'test-results/playwright-deployed',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-deployed',
      use: chromiumUse,
    },
  ],
});
