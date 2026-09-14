import { expect, test } from '@playwright/test';
import { installMockEventSource } from './support/sse';
import { fulfillJson, rejectUnexpectedApi } from './support/http';

test('Sources exposes loading and successful empty states', async ({ page }) => {
  let releaseRequest: (() => void) | undefined;
  const requestGate = new Promise<void>((resolve) => {
    releaseRequest = resolve;
  });

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/v1/sources' && request.method() === 'GET') {
      await requestGate;
      return fulfillJson(route, []);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/sources');
  await expect(page.getByText('Loading source configuration…', { exact: true })).toBeVisible();

  releaseRequest?.();
  await expect(page.getByText('Create the first source using the form.', { exact: true })).toBeVisible();
});

test('Results presents backend request failures with useful error text', async ({ page }) => {
  await installMockEventSource(page, true);
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/v1/results' && request.method() === 'GET') {
      return fulfillJson(route, { detail: 'Results are temporarily unavailable.' }, 503);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/results');

  await expect(page.getByText('Request failed', { exact: true })).toBeVisible();
  await expect(page.getByText('Results are temporarily unavailable.', { exact: true })).toBeVisible();
});
