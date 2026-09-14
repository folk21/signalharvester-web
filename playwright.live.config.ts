import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4174';
const backendUrl = process.env.SIGNALHARVESTER_BACKEND_URL || 'http://127.0.0.1:8080';
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
  outputDir: 'test-results/playwright-live',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-live',
      use: chromiumUse,
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4174 --strictPort',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      VITE_DEV_PROXY_TARGET: backendUrl,
    },
  },
});
