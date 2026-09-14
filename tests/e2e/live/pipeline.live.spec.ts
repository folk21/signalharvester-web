import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import type { CollectionRun, Source } from '../../../src/api/types';
import { startRssFixtureServer } from '../support/rss-fixture';

const backendUrl = (process.env.SIGNALHARVESTER_BACKEND_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');
const resultWaitMs = Number(process.env.SIGNALHARVESTER_LIVE_RESULT_WAIT_MS || '30000');
const collectionWaitMs = Number(process.env.SIGNALHARVESTER_LIVE_COLLECTION_WAIT_MS || '60000');

test('live browser flow reaches Analysis and Results through a deterministic RSS source', async ({
  page,
  request,
}) => {
  test.setTimeout(collectionWaitMs + resultWaitMs * 2 + 30_000);

  const fixtureServer = await startRssFixtureServer();
  const unique = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const sourceName = `Browser live RSS ${unique}`;
  const profileId = `browser-live-${unique}`;
  let sourceId: string | null = null;

  try {
    await page.goto('/sources');
    await page.getByLabel('Name').fill(sourceName);
    await page.getByLabel('Type').selectOption('RSS');
    await page.getByLabel('Location').fill(fixtureServer.location);

    const createResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/api/v1/sources',
    );
    await page.getByRole('button', { name: 'Create source' }).click();
    const source = (await (await createResponse).json()) as Source;
    sourceId = source.id;

    const sourceRow = page.getByRole('row', { name: new RegExp(sourceName) });
    await expect(sourceRow).toBeVisible();
    await expect(sourceRow.getByText('ENABLED', { exact: true })).toBeVisible();

    await page.getByRole('link', { name: 'Collection Runs' }).click();
    await page.getByLabel('Monitoring profile ID').fill(profileId);
    await page.getByLabel('Information category').fill('GENERAL');

    const runResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/api/v1/admin/collection-runs',
      { timeout: collectionWaitMs },
    );
    await page.getByRole('button', { name: 'Start collection run' }).click();
    const run = (await (await runResponse).json()) as CollectionRun;

    const fixtureOutcomes = run.sources.filter((outcome) => outcome.sourceId === sourceId);
    expect(fixtureOutcomes).toHaveLength(2);
    expect(fixtureOutcomes.every((outcome) => outcome.status === 'PUBLISHED')).toBe(true);

    await expect(page.getByText(profileId, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(`${sourceId.slice(0, 14)}…`, { exact: true })).toHaveCount(2);

    await page.getByRole('link', { name: 'Analysis Items' }).click();
    await page.getByLabel('Monitoring profile ID').fill(profileId);
    await page.getByLabel('Source ID').fill(sourceId);
    await page.getByRole('button', { name: 'Apply filters' }).click();
    await waitForLoadedCount(page, '/api/v1/admin/analysis/items', 2, resultWaitMs);

    await page.getByRole('link', { name: 'Results' }).click();
    await page.getByLabel('Monitoring profile ID').fill(profileId);
    await page.getByLabel('Source ID').fill(sourceId);
    await page.getByRole('button', { name: 'Apply filters' }).click();
    await waitForLoadedCount(page, '/api/v1/results', 2, resultWaitMs);

    await expect(page.getByText('Java browser fixture', { exact: true })).toBeVisible();
    await expect(page.getByText('PostgreSQL browser fixture', { exact: true })).toBeVisible();

    await page.getByRole('row', { name: /Java browser fixture/ }).click();
    await expect(page.getByText(profileId, { exact: true })).toBeVisible();
    await expect(page.getByText(sourceId, { exact: true })).toBeVisible();
    await expect(page.getByText(run.collectionRunId, { exact: true })).toBeVisible();
  } finally {
    await cleanupSource(request, sourceId);
    await fixtureServer.close();
  }
});

async function waitForLoadedCount(
  page: Page,
  pathname: string,
  expected: number,
  timeout: number,
): Promise<void> {
  await expect(page.getByText(/\d+ loaded/).first()).toBeVisible();

  await expect
    .poll(
      async () => {
        const response = page.waitForResponse(
          (candidate) =>
            candidate.request().method() === 'GET' &&
            new URL(candidate.url()).pathname === pathname,
        );
        await page.getByRole('button', { name: 'Refresh' }).click();
        await response;

        const loadedText = await page.getByText(/\d+ loaded/).first().textContent();
        const match = loadedText?.match(/^(\d+) loaded$/);
        return match ? Number(match[1]) : 0;
      },
      { timeout, intervals: [250, 500, 1000] },
    )
    .toBe(expected);
}

async function cleanupSource(request: APIRequestContext, sourceId: string | null): Promise<void> {
  if (!sourceId) {
    return;
  }

  const response = await request.delete(`${backendUrl}/api/v1/sources/${encodeURIComponent(sourceId)}`);
  if (!response.ok() && response.status() !== 404) {
    throw new Error(`Failed to delete live-test source ${sourceId}: HTTP ${response.status()}`);
  }
}
