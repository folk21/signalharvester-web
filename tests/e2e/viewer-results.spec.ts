import { expect, test } from '@playwright/test';
import type { CurrentPrincipal } from '../../src/api/types';
import { resultDetailFixture, resultSummaryFixture } from './fixtures/api';
import { fulfillJson, rejectUnexpectedApi } from './support/http';
import { installMockEventSource, waitForSseSource } from './support/sse';

const viewerDetailWithoutAttributes = { ...resultDetailFixture, attributes: {} };

const viewerPrincipal: CurrentPrincipal = {
  id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  username: 'results-viewer',
  identityType: 'HUMAN',
  roles: ['USER', 'VIEWER'],
};

test('viewer Results uses the existing relevant Results boundary without operational detail', async ({ page }) => {
  await installMockEventSource(page, true);

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname === '/api/v1/auth/me' && request.method() === 'GET') {
      return fulfillJson(route, viewerPrincipal);
    }
    if (url.pathname === '/api/v1/results' && request.method() === 'GET') {
      expect(url.searchParams.get('limit')).toBe('50');
      expect(url.searchParams.get('relevant')).toBe('true');
      expect(url.searchParams.has('monitoringProfileId')).toBe(false);
      expect(url.searchParams.has('sourceId')).toBe(false);
      return fulfillJson(route, [resultSummaryFixture]);
    }
    if (
      url.pathname === `/api/v1/results/${resultSummaryFixture.normalizedItemId}`
      && request.method() === 'GET'
    ) {
      expect(url.searchParams.get('monitoringProfileId')).toBe(resultSummaryFixture.monitoringProfileId);
      return fulfillJson(route, viewerDetailWithoutAttributes);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/results');
  await waitForSseSource(page, '/api/v1/results/stream');
  await waitForSseSource(page, 'relevant=true');

  await expect(page.getByRole('heading', { level: 1, name: 'Results feed' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Relevant', exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Monitoring profile ID')).toHaveCount(0);
  await expect(page.getByLabel('Source ID')).toHaveCount(0);
  await expect(page.getByText(resultSummaryFixture.title!, { exact: true })).toBeVisible();

  await page.getByRole('button', { name: `Open result ${resultSummaryFixture.title}` }).click();

  await expect(page.getByText(viewerDetailWithoutAttributes.normalizedContent, { exact: true })).toBeVisible();
  await expect(page.getByText(viewerDetailWithoutAttributes.explanation, { exact: true })).toBeVisible();
  const originalSourceLink = page.getByRole('link', { name: 'Open original source' });
  await expect(originalSourceLink).toHaveAttribute('href', viewerDetailWithoutAttributes.url);
  await originalSourceLink.hover();
  await expect(originalSourceLink).toHaveCSS('color', 'rgb(7, 19, 15)');
  await expect(page.getByRole('heading', { level: 3, name: 'Details' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Open processing flow' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Explore related events' })).toHaveCount(0);
  await expect(page.getByText(resultDetailFixture.monitoringProfileId, { exact: true })).toHaveCount(0);
  await expect(page.getByText(resultDetailFixture.normalizedItemId, { exact: true })).toHaveCount(0);
  await expect(page.getByText(resultDetailFixture.sourceId, { exact: true })).toHaveCount(0);
  await expect(page.getByText(resultDetailFixture.analysisEventId, { exact: true })).toHaveCount(0);
  await expect(page.getByText(resultDetailFixture.correlationId, { exact: true })).toHaveCount(0);
  await expect(page.getByText(resultDetailFixture.traceparent!, { exact: true })).toHaveCount(0);
  await expect(page.getByText(resultDetailFixture.analyzer, { exact: true })).toHaveCount(0);
});

test('viewer Results filters by consumer-safe fields while keeping relevant=true', async ({ page }) => {
  await installMockEventSource(page, true);
  let filteredRequestSeen = false;

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname === '/api/v1/auth/me' && request.method() === 'GET') {
      return fulfillJson(route, viewerPrincipal);
    }
    if (url.pathname === '/api/v1/results' && request.method() === 'GET') {
      if (url.searchParams.get('informationCategory') === 'GENERAL') {
        filteredRequestSeen = true;
        expect(url.searchParams.get('relevant')).toBe('true');
        expect(url.searchParams.has('classification')).toBe(false);
      }
      return fulfillJson(route, []);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/results');
  await page.getByLabel('Information category').fill('GENERAL');
  await page.getByRole('button', { name: 'Apply filters' }).click();

  await expect.poll(() => filteredRequestSeen).toBe(true);
  await expect(page).toHaveURL(/informationCategory=GENERAL/);
});
