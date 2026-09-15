import { expect, test } from '@playwright/test';
import type { ResultDetail, ResultSummary } from '../../src/api/types';
import { resultDetailFixture, resultSummaryFixture } from './fixtures/api';
import { fulfillJson, rejectUnexpectedApi } from './support/http';
import { emitSse, installMockEventSource } from './support/sse';

const PROFILE_ID = 'ca80b9ce-a532-42a3-b554-40623852726f';
const SOURCE_ID = '699d6eb9-1918-4128-8d2b-67b1805fa496';
const PRIMARY_NORMALIZED_ID = '8edd69b7f3e9e07aaacc9c009ed4a554fc542296813a65aa7f1a8cc93c8b7da4';

const primaryResult: ResultSummary = {
  ...resultSummaryFixture,
  monitoringProfileId: PROFILE_ID,
  normalizedItemId: PRIMARY_NORMALIZED_ID,
  sourceId: SOURCE_ID,
  title: 'PostgreSQL browser fixture',
  informationCategory: 'GENERAL',
  classification: 'MATCHED_KEYWORDS',
  score: 17,
  analyzedAt: '2026-09-15T08:09:43Z',
};

const secondaryResult: ResultSummary = {
  ...primaryResult,
  normalizedItemId: 'e54878f739cf16f60076b31a38b72fbbdbec5f2faf8277e0bec052812fd21a5f',
  title: 'Java browser fixture',
  score: 50,
};

const previousResult: ResultSummary = {
  ...primaryResult,
  normalizedItemId: '7dc6f62ac0526551915b234b123ae2c9ef8bd15a86f54a87638ea80993f66e88',
  analyzedAt: '2026-09-14T23:23:27Z',
};

const canonicalResults: ResultSummary[] = [
  primaryResult,
  secondaryResult,
  previousResult,
  ...Array.from({ length: 36 }, (_, index): ResultSummary => ({
    ...primaryResult,
    normalizedItemId: `${(index + 4).toString(16).padStart(64, '0')}`,
    title: index % 2 === 0 ? 'PostgreSQL browser fixture' : 'Java browser fixture',
    score: index % 2 === 0 ? 17 : 50,
    analyzedAt: `2026-09-14T${String(22 - (index % 10)).padStart(2, '0')}:23:27Z`,
  })),
];

const primaryDetail: ResultDetail = {
  ...resultDetailFixture,
  ...primaryResult,
  monitoringProfileId: PROFILE_ID,
  normalizedItemId: PRIMARY_NORMALIZED_ID,
  sourceId: SOURCE_ID,
  title: primaryResult.title,
};

test.use({
  viewport: { width: 1410, height: 690 },
  deviceScaleFactor: 2,
  locale: 'en-US',
  timezoneId: 'UTC',
});

test('canonical populated Results workspace keeps its reviewed visual layout', async ({ page }) => {
  await installMockEventSource(page);

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname === '/api/v1/results' && request.method() === 'GET') {
      return fulfillJson(route, canonicalResults);
    }
    if (url.pathname === `/api/v1/results/${PRIMARY_NORMALIZED_ID}` && request.method() === 'GET') {
      return fulfillJson(route, primaryDetail);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/results');
  await emitSse(page, 'ready', { cursor: 100, result: null });

  await expect(page.getByText('39 loaded', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Inspect result PostgreSQL browser fixture' }).first().click();
  await expect(page.getByRole('heading', { level: 2, name: 'PostgreSQL browser fixture' })).toBeVisible();
  await page.addStyleTag({ content: '* { scrollbar-width: none !important; } *::-webkit-scrollbar { display: none !important; }' });
  await page.evaluate(() => document.fonts.ready);

  await expect(page).toHaveScreenshot('results-populated-detail.png');
});
