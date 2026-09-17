import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import type { CollectionRun, MonitoringProfile, Source, SourceTestResult } from '../../../src/api/types';
import { startRssFixtureServer } from '../support/rss-fixture';

const backendUrl = (process.env.SIGNALHARVESTER_BACKEND_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');
const resultWaitMs = Number(process.env.SIGNALHARVESTER_LIVE_RESULT_WAIT_MS || '30000');
const collectionWaitMs = Number(process.env.SIGNALHARVESTER_LIVE_COLLECTION_WAIT_MS || '60000');
const liveUsername = process.env.SIGNALHARVESTER_LIVE_USERNAME ?? '';
const livePassword = process.env.SIGNALHARVESTER_LIVE_PASSWORD ?? '';

test('live browser flow verifies Results SSE, Event Observation SSE, and Processing Flow reconstruction', async ({
  page,
  context,
}) => {
  test.setTimeout(collectionWaitMs * 2 + resultWaitMs * 4 + 60_000);

  if (!liveUsername || !livePassword) {
    throw new Error(
      'Live security acceptance requires SIGNALHARVESTER_LIVE_USERNAME and SIGNALHARVESTER_LIVE_PASSWORD.',
    );
  }

  const fixtureServer = await startRssFixtureServer();
  const unique = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const sourceName = `Browser live RSS ${unique}`;
  const profileName = `Browser live profile ${unique}`;
  let sourceId: string | null = null;
  let profileId: string | null = null;

  try {
    await page.goto('/sources');
    await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
    await page.getByLabel('Username').fill(liveUsername);
    await page.getByLabel('Password').fill(livePassword);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/sources$/);
    await expect(page.getByRole('link', { name: 'Sources' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Results' })).toBeVisible();
    await page.getByLabel('Name').fill(sourceName);
    await page.getByLabel('Type').selectOption('RSS');
    await page.getByLabel('Location').fill(fixtureServer.location);

    const createSourceResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/api/v1/sources',
    );
    await page.getByRole('button', { name: 'Create source' }).click();
    const source = (await (await createSourceResponse).json()) as Source;
    sourceId = source.id;
    const createdSourceId = source.id;

    const sourceRow = page.getByRole('row', { name: new RegExp(sourceName) });
    await expect(sourceRow).toBeVisible();
    await expect(sourceRow.getByText('ENABLED', { exact: true })).toBeVisible();

    const sourceTestResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === `/api/v1/sources/${createdSourceId}/test`,
      { timeout: collectionWaitMs },
    );
    await sourceRow.getByRole('button', { name: `Test source ${source.name}` }).click();
    const sourceTest = (await (await sourceTestResponse).json()) as SourceTestResult;
    expect(sourceTest.status).toBe('SUCCEEDED');
    expect(sourceTest.candidateItemCount).toBe(2);
    await expect(page.getByText('Java browser fixture', { exact: true })).toBeVisible();
    await expect(page.getByText('PostgreSQL browser fixture', { exact: true })).toBeVisible();

    await page.getByRole('link', { name: 'Monitoring Profiles' }).click();
    await page.getByLabel('Name').fill(profileName);
    await page.getByLabel('Information category').fill('GENERAL');
    await page.getByLabel(`Use source ${sourceName}`).check();

    const createProfileResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/api/v1/monitoring-profiles',
    );
    await page.getByRole('button', { name: 'Create profile' }).click();
    const profile = (await (await createProfileResponse).json()) as MonitoringProfile;
    profileId = profile.id;
    const createdProfileId = profile.id;

    await expect(page.getByRole('row', { name: new RegExp(profileName) })).toBeVisible();

    const resultsPage = await context.newPage();
    await resultsPage.goto('/results');
    await resultsPage.getByLabel('Monitoring profile ID').fill(createdProfileId);
    await resultsPage.getByLabel('Source ID').fill(createdSourceId);
    await resultsPage.getByRole('button', { name: 'Apply filters' }).click();
    await expect(resultsPage.getByText('Live', { exact: true })).toBeVisible({ timeout: resultWaitMs });
    await expect(resultsPage.getByText('0 loaded', { exact: true })).toBeVisible({ timeout: resultWaitMs });

    const firstRun = await startCollectionRun(page, createdProfileId);
    assertFixturePublished(firstRun, createdSourceId);

    await expect(resultsPage.getByText('Java browser fixture', { exact: true })).toBeVisible({ timeout: resultWaitMs });
    await expect(resultsPage.getByText('PostgreSQL browser fixture', { exact: true })).toBeVisible({ timeout: resultWaitMs });
    await expect(resultsPage.getByText('2 loaded', { exact: true })).toBeVisible({ timeout: resultWaitMs });

    await resultsPage.getByRole('button', { name: 'Inspect result Java browser fixture' }).click();
    await expect(resultsPage.getByText(createdProfileId, { exact: true })).toBeVisible();
    await expect(resultsPage.getByText(createdSourceId, { exact: true })).toBeVisible();
    await expect(resultsPage.getByText(firstRun.collectionRunId, { exact: true })).toBeVisible();

    await page.goto('/analysis');
    await page.getByLabel('Monitoring profile ID').fill(createdProfileId);
    await page.getByLabel('Source ID').fill(createdSourceId);
    await page.getByRole('button', { name: 'Apply filters' }).click();
    await waitForLoadedCount(page, '/api/v1/admin/analysis/items', 2, resultWaitMs);

    const eventPage = await context.newPage();
    await eventPage.goto('/events');
    await eventPage.getByLabel('Producer').fill('collection');
    await eventPage.getByRole('button', { name: 'Apply filters' }).click();
    await expect(eventPage.getByText('Live', { exact: true })).toBeVisible({ timeout: resultWaitMs });

    const secondRun = await startCollectionRun(page, createdProfileId);
    assertFixturePublished(secondRun, createdSourceId);

    const secondRunShortId = `${secondRun.collectionRunId.slice(0, 18)}…`;
    await expect(eventPage.getByText(secondRunShortId, { exact: true }).first()).toBeVisible({
      timeout: resultWaitMs,
    });

    await eventPage.getByLabel('Collection run ID').fill(secondRun.collectionRunId);
    await eventPage.getByRole('button', { name: 'Apply filters' }).click();
    await expect(eventPage.getByText('Live', { exact: true })).toBeVisible({ timeout: resultWaitMs });
    await expect
      .poll(() => eventPage.locator('tbody tr').count(), {
        timeout: resultWaitMs,
        intervals: [250, 500, 1000],
      })
      .toBeGreaterThanOrEqual(2);

    await eventPage.getByLabel('Producer').fill('analysis');
    await eventPage.getByRole('button', { name: 'Apply filters' }).click();
    await expect(eventPage.getByText('Live', { exact: true })).toBeVisible({ timeout: resultWaitMs });
    await expect
      .poll(() => eventPage.locator('tbody tr').count(), {
        timeout: resultWaitMs,
        intervals: [250, 500, 1000],
      })
      .toBeGreaterThan(0);

    const analysisEventRow = eventPage.locator('tbody tr').first();
    await analysisEventRow.getByRole('button', { name: /Inspect event/ }).click();
    await expect(eventPage.getByText(secondRun.collectionRunId, { exact: true })).toBeVisible();
    await expect(eventPage.getByText(createdSourceId, { exact: true })).toBeVisible();

    await eventPage.getByRole('link', { name: 'Open processing flow' }).click();
    await expect(eventPage.getByLabel('Collection run ID')).toHaveValue(secondRun.collectionRunId);
    await expect(eventPage.getByLabel('Item ID')).not.toHaveValue('');
    await expect(eventPage.getByLabel('Flow summary')).toBeVisible({ timeout: resultWaitMs });
    await expect(eventPage.getByLabel('Flow summary').getByText('Item branch', { exact: true })).toBeVisible();
    await expect(eventPage.getByText('TERMINAL EVENT REACHED', { exact: true })).toBeVisible();
    await expect(eventPage.getByRole('button', { name: /Raw Kafka stage/ }).first()).toBeVisible();
    await expect(eventPage.getByRole('button', { name: /Analysis stage/ }).first()).toBeVisible();

    await eventPage.getByRole('link', { name: 'View full run' }).click();
    await expect(eventPage.getByLabel('Item ID')).toHaveValue('');
    await expect(eventPage.getByLabel('Flow summary').getByText('Collection run', { exact: true })).toBeVisible({
      timeout: resultWaitMs,
    });
    await expect(eventPage.getByRole('heading', { name: 'Collection-run branches' })).toBeVisible();
    await expect(eventPage.getByRole('link', { name: 'Open item flow' })).toHaveCount(2);
  } finally {
    await cleanupProfile(context, profileId);
    await cleanupSource(context, sourceId);
    await fixtureServer.close();
  }
});

async function startCollectionRun(page: Page, monitoringProfileId: string): Promise<CollectionRun> {
  await page.goto('/runs');
  await page.getByLabel('Monitoring profile').selectOption(monitoringProfileId);

  const runResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname === '/api/v1/admin/collection-runs',
    { timeout: collectionWaitMs },
  );
  await page.getByRole('button', { name: 'Start collection run' }).click();
  return (await (await runResponse).json()) as CollectionRun;
}

function assertFixturePublished(run: CollectionRun, sourceId: string): void {
  const fixtureOutcomes = run.sources.filter((outcome) => outcome.sourceId === sourceId);
  expect(fixtureOutcomes).toHaveLength(2);
  expect(fixtureOutcomes.every((outcome) => outcome.status === 'PUBLISHED')).toBe(true);
}

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

async function cleanupProfile(context: BrowserContext, profileId: string | null): Promise<void> {
  if (!profileId) {
    return;
  }

  const response = await context.request.delete(
    `${backendUrl}/api/v1/monitoring-profiles/${encodeURIComponent(profileId)}`,
    { headers: await csrfHeaders(context) },
  );
  if (!response.ok() && response.status() !== 404) {
    throw new Error(`Failed to delete live-test monitoring profile ${profileId}: HTTP ${response.status()}`);
  }
}

async function cleanupSource(context: BrowserContext, sourceId: string | null): Promise<void> {
  if (!sourceId) {
    return;
  }

  const response = await context.request.delete(
    `${backendUrl}/api/v1/sources/${encodeURIComponent(sourceId)}`,
    { headers: await csrfHeaders(context) },
  );
  if (!response.ok() && response.status() !== 404) {
    throw new Error(`Failed to delete live-test source ${sourceId}: HTTP ${response.status()}`);
  }
}

async function csrfHeaders(context: BrowserContext): Promise<Record<string, string>> {
  const csrfCookie = (await context.cookies()).find((cookie) => cookie.name === 'XSRF-TOKEN');
  if (!csrfCookie) {
    throw new Error('Live security acceptance did not receive the XSRF-TOKEN cookie.');
  }
  return { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfCookie.value };
}
