import { expect, test } from '@playwright/test';
import { fulfillJson, rejectUnexpectedApi } from './support/http';
import { installMockEventSource } from './support/sse';

test('lazy route loading keeps the application shell usable while a screen chunk is pending', async ({ page }) => {
  let releaseRoute: (() => void) | undefined;
  const routeGate = new Promise<void>((resolve) => {
    releaseRoute = resolve;
  });

  await installMockEventSource(page, true);
  await page.route('**/src/features/results/ResultsPage.tsx*', async (route) => {
    await routeGate;
    await route.continue();
  });
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/v1/results' && request.method() === 'GET') {
      return fulfillJson(route, []);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/results', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Loading screen…');

  releaseRoute?.();
  await expect(page.getByRole('heading', { level: 1, name: 'Analyzed Results' })).toBeVisible();
});

test('a failed lazy route chunk shows recoverable UI and navigation can leave the failed screen', async ({ page }) => {
  await page.route('**/src/features/results/ResultsPage.tsx*', async (route) => {
    await route.abort('failed');
  });
  await page.route('**/api/v1/**', rejectUnexpectedApi);

  await page.goto('/results', { waitUntil: 'domcontentloaded' });

  const alert = page.getByRole('alert');
  await expect(alert.getByText('Unable to load this screen', { exact: true })).toBeVisible();
  await expect(alert.getByRole('button', { name: 'Reload application' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();

  await page.getByRole('link', { name: 'Processing Flow' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Processing Flow' })).toBeVisible();
});
