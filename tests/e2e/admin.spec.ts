import { expect, test } from '@playwright/test';
import type { MonitoringProfile, ResultSummary, Source } from '../../src/api/types';
import {
  analysisItemFixture,
  collectionRunFixture,
  createdMonitoringProfileFixture,
  createdSourceFixture,
  monitoringProfileFixture,
  itemProcessingFlowFixture,
  processingFlowFixture,
  observedAnalysisEventFixture,
  observedEventLiveFixture,
  observedRawEventFixture,
  resultDetailFixture,
  resultLiveEventFixture,
  resultSummaryFixture,
  sourceFixture,
  sourceTestFixture,
  startedCollectionRunFixture,
} from './fixtures/api';
import { fulfillJson, rejectUnexpectedApi } from './support/http';
import { emitSse, installMockEventSource, waitForSseSource } from './support/sse';

test('application shell navigates across the current admin screens', async ({ page }) => {
  await installMockEventSource(page, true);
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() !== 'GET') {
      return rejectUnexpectedApi(route);
    }

    if (url.pathname === '/api/v1/sources') {
      return fulfillJson(route, [sourceFixture]);
    }
    if (url.pathname === '/api/v1/monitoring-profiles') {
      return fulfillJson(route, [monitoringProfileFixture]);
    }
    if (url.pathname === '/api/v1/admin/collection-runs') {
      return fulfillJson(route, [collectionRunFixture]);
    }
    if (url.pathname === '/api/v1/admin/analysis/items') {
      return fulfillJson(route, [analysisItemFixture]);
    }
    if (url.pathname === '/api/v1/results') {
      return fulfillJson(route, [resultSummaryFixture]);
    }
    if (url.pathname === '/api/v1/events') {
      return fulfillJson(route, [observedRawEventFixture]);
    }
    if (url.pathname === '/api/v1/admin/users') {
      return fulfillJson(route, []);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();

  const destinations = [
    ['Sources', 'Sources'],
    ['Monitoring Profiles', 'Monitoring Profiles'],
    ['Collection Runs', 'Collection Runs'],
    ['Analysis Items', 'Analysis Items'],
    ['Results', 'Analyzed Results'],
    ['Event Explorer', 'Event Explorer'],
    ['Processing Flow', 'Processing Flow'],
    ['Identity Administration', 'Identity Administration'],
  ] as const;

  for (const [linkName, heading] of destinations) {
    await page.getByRole('link', { name: linkName }).click();
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  }
});

test('Sources creates a source and shows bounded source-test diagnostics', async ({ page }) => {
  const sources: Source[] = [sourceFixture];

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname === '/api/v1/sources' && request.method() === 'GET') {
      return fulfillJson(route, sources);
    }
    if (url.pathname === '/api/v1/sources' && request.method() === 'POST') {
      const payload = request.postDataJSON();
      expect(payload).toEqual({
        name: createdSourceFixture.name,
        type: createdSourceFixture.type,
        location: createdSourceFixture.location,
        enabled: true,
        settings: createdSourceFixture.settings,
      });
      sources.push(createdSourceFixture);
      return fulfillJson(route, createdSourceFixture, 201);
    }
    if (
      url.pathname === `/api/v1/sources/${sourceFixture.id}/test` &&
      request.method() === 'POST'
    ) {
      return fulfillJson(route, sourceTestFixture);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/sources');

  const fixtureRow = page.getByRole('row', { name: new RegExp(sourceFixture.name) });
  await expect(fixtureRow).toBeVisible();
  await fixtureRow.getByRole('button', { name: `Test source ${sourceFixture.name}` }).click();
  await expect(page.getByRole('heading', { level: 2, name: sourceFixture.name })).toBeVisible();
  await expect(page.getByText('Fixture preview item', { exact: true })).toBeVisible();
  await expect(page.getByText('1', { exact: true })).toBeVisible();
  await expect(page.getByText('SUCCEEDED', { exact: true })).toBeVisible();

  await page.getByLabel('Name').fill(createdSourceFixture.name);
  await page.getByLabel('Type').selectOption('RSS');
  await page.getByLabel('Location').fill(createdSourceFixture.location);
  await page
    .getByLabel('Settings (JSON string map)')
    .fill(JSON.stringify(createdSourceFixture.settings));

  await page.getByRole('button', { name: 'Create source' }).click();

  const createdRow = page.getByRole('row', { name: new RegExp(createdSourceFixture.name) });
  await expect(createdRow).toBeVisible();
  await expect(createdRow.getByText('RSS', { exact: true })).toBeVisible();
  await expect(createdRow.getByText('ENABLED', { exact: true })).toBeVisible();
});

test('Monitoring Profiles creates persisted source membership and schedule configuration', async ({ page }) => {
  const profiles: MonitoringProfile[] = [monitoringProfileFixture];

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname === '/api/v1/sources' && request.method() === 'GET') {
      return fulfillJson(route, [sourceFixture, createdSourceFixture]);
    }
    if (url.pathname === '/api/v1/monitoring-profiles' && request.method() === 'GET') {
      return fulfillJson(route, profiles);
    }
    if (url.pathname === '/api/v1/monitoring-profiles' && request.method() === 'POST') {
      expect(request.postDataJSON()).toEqual({
        name: createdMonitoringProfileFixture.name,
        informationCategory: createdMonitoringProfileFixture.informationCategory,
        enabled: createdMonitoringProfileFixture.enabled,
        collectionIntervalMinutes: createdMonitoringProfileFixture.collectionIntervalMinutes,
        sourceIds: createdMonitoringProfileFixture.sourceIds,
        criteria: createdMonitoringProfileFixture.criteria,
        analysisSettings: createdMonitoringProfileFixture.analysisSettings,
      });
      profiles.push(createdMonitoringProfileFixture);
      return fulfillJson(route, createdMonitoringProfileFixture, 201);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/profiles');

  await expect(page.getByRole('row', { name: new RegExp(monitoringProfileFixture.name) })).toBeVisible();

  await page.getByLabel('Name').fill(createdMonitoringProfileFixture.name);
  await page.getByLabel('Information category').fill(createdMonitoringProfileFixture.informationCategory);
  await page
    .getByLabel('Collection interval (minutes)')
    .fill(String(createdMonitoringProfileFixture.collectionIntervalMinutes));
  await page.getByLabel(`Use source ${createdSourceFixture.name}`).check();
  await page.getByLabel(`Use source ${sourceFixture.name}`).check();
  await page.getByLabel('Set profile-specific Analysis settings').check();
  await page
    .getByLabel('Analysis keywords (one per line)')
    .fill(createdMonitoringProfileFixture.analysisSettings.keywords.join('\n'));
  await page
    .getByLabel('Minimum keyword matches')
    .fill(String(createdMonitoringProfileFixture.analysisSettings.minimumMatches));
  await page
    .getByLabel('Criteria (JSON string map)')
    .fill(JSON.stringify(createdMonitoringProfileFixture.criteria));
  await page.getByRole('button', { name: 'Create profile' }).click();

  const createdRow = page.getByRole('row', { name: new RegExp(createdMonitoringProfileFixture.name) });
  await expect(createdRow).toBeVisible();
  await expect(createdRow.getByText('GENERAL', { exact: true })).toBeVisible();
  await expect(createdRow.getByText('DISABLED', { exact: true })).toBeVisible();
});


test('Monitoring Profiles omits Analysis settings when backend defaults are selected on create', async ({ page }) => {
  const defaultedProfile: MonitoringProfile = {
    ...createdMonitoringProfileFixture,
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Backend default analysis profile',
    sourceIds: [sourceFixture.id],
    criteria: {},
    analysisSettings: monitoringProfileFixture.analysisSettings,
  };
  const profiles: MonitoringProfile[] = [];

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname === '/api/v1/sources' && request.method() === 'GET') {
      return fulfillJson(route, [sourceFixture]);
    }
    if (url.pathname === '/api/v1/monitoring-profiles' && request.method() === 'GET') {
      return fulfillJson(route, profiles);
    }
    if (url.pathname === '/api/v1/monitoring-profiles' && request.method() === 'POST') {
      expect(request.postDataJSON()).toEqual({
        name: defaultedProfile.name,
        informationCategory: defaultedProfile.informationCategory,
        enabled: defaultedProfile.enabled,
        collectionIntervalMinutes: defaultedProfile.collectionIntervalMinutes,
        sourceIds: defaultedProfile.sourceIds,
        criteria: {},
      });
      profiles.push(defaultedProfile);
      return fulfillJson(route, defaultedProfile, 201);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/profiles');

  await expect(page.getByLabel('Set profile-specific Analysis settings')).not.toBeChecked();
  await expect(page.getByText(/backend apply its configured Analysis defaults/)).toBeVisible();
  await page.getByLabel('Name').fill(defaultedProfile.name);
  await page.getByLabel('Information category').fill(defaultedProfile.informationCategory);
  await page
    .getByLabel('Collection interval (minutes)')
    .fill(String(defaultedProfile.collectionIntervalMinutes));
  await page.getByLabel(`Use source ${sourceFixture.name}`).check();
  await page.getByRole('button', { name: 'Create profile' }).click();

  await expect(page.getByRole('row', { name: new RegExp(defaultedProfile.name) })).toBeVisible();
});

test('Monitoring Profiles edits Analysis settings and preserves them in enabled-state replacement PUTs', async ({ page }) => {
  let profile: MonitoringProfile = structuredClone(monitoringProfileFixture);
  const putPayloads: unknown[] = [];

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname === '/api/v1/sources' && request.method() === 'GET') {
      return fulfillJson(route, [sourceFixture]);
    }
    if (url.pathname === '/api/v1/monitoring-profiles' && request.method() === 'GET') {
      return fulfillJson(route, [profile]);
    }
    if (
      url.pathname === `/api/v1/monitoring-profiles/${profile.id}` &&
      request.method() === 'PUT'
    ) {
      const payload = request.postDataJSON();
      putPayloads.push(payload);
      profile = { ...profile, ...payload, id: profile.id };
      return fulfillJson(route, profile);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/profiles');

  const editButton = page.getByRole('button', {
    name: `Edit monitoring profile ${profile.name}`,
  });
  await editButton.click();
  await expect(page.getByLabel('Analysis keywords (one per line)')).toHaveValue('backend\nkafka');
  await expect(page.getByLabel('Minimum keyword matches')).toHaveValue('1');
  await expect(page.getByLabel('Criteria (JSON string map)')).toHaveValue(
    JSON.stringify(monitoringProfileFixture.criteria, null, 2),
  );

  await page.getByRole('button', { name: 'Save changes' }).click();

  await expect.poll(() => putPayloads.length).toBe(1);
  await expect(page.getByRole('button', { name: 'Create profile' })).toBeVisible();
  expect(putPayloads[0]).toEqual({
    name: monitoringProfileFixture.name,
    informationCategory: monitoringProfileFixture.informationCategory,
    enabled: monitoringProfileFixture.enabled,
    collectionIntervalMinutes: monitoringProfileFixture.collectionIntervalMinutes,
    sourceIds: monitoringProfileFixture.sourceIds,
    criteria: monitoringProfileFixture.criteria,
    analysisSettings: monitoringProfileFixture.analysisSettings,
  });

  await page
    .getByRole('button', { name: `Edit monitoring profile ${profile.name}` })
    .click();
  await page.getByLabel('Analysis keywords (one per line)').fill('backend\nkafka\npostgresql');
  await page.getByLabel('Minimum keyword matches').fill('2');
  await page.getByRole('button', { name: 'Save changes' }).click();

  await expect.poll(() => putPayloads.length).toBe(2);
  await expect(page.getByRole('button', { name: 'Create profile' })).toBeVisible();
  expect(putPayloads[1]).toEqual({
    name: monitoringProfileFixture.name,
    informationCategory: monitoringProfileFixture.informationCategory,
    enabled: monitoringProfileFixture.enabled,
    collectionIntervalMinutes: monitoringProfileFixture.collectionIntervalMinutes,
    sourceIds: monitoringProfileFixture.sourceIds,
    criteria: monitoringProfileFixture.criteria,
    analysisSettings: {
      keywords: ['backend', 'kafka', 'postgresql'],
      minimumMatches: 2,
    },
  });

  await page
    .getByRole('button', { name: `Disable monitoring profile ${profile.name}` })
    .click();
  await expect.poll(() => putPayloads.length).toBe(3);
  expect(putPayloads[2]).toEqual({
    name: profile.name,
    informationCategory: profile.informationCategory,
    enabled: false,
    collectionIntervalMinutes: profile.collectionIntervalMinutes,
    sourceIds: profile.sourceIds,
    criteria: profile.criteria,
    analysisSettings: profile.analysisSettings,
  });
});

test('Monitoring Profiles surfaces backend Analysis validation failures', async ({ page }) => {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname === '/api/v1/sources' && request.method() === 'GET') {
      return fulfillJson(route, [sourceFixture]);
    }
    if (url.pathname === '/api/v1/monitoring-profiles' && request.method() === 'GET') {
      return fulfillJson(route, [monitoringProfileFixture]);
    }
    if (
      url.pathname === `/api/v1/monitoring-profiles/${monitoringProfileFixture.id}` &&
      request.method() === 'PUT'
    ) {
      expect(request.postDataJSON()).toMatchObject({
        analysisSettings: {
          keywords: ['Backend', 'backend'],
          minimumMatches: 1,
        },
      });
      return fulfillJson(route, { message: 'keywords must be unique after normalization' }, 400);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/profiles');
  await page
    .getByRole('button', { name: `Edit monitoring profile ${monitoringProfileFixture.name}` })
    .click();
  await page.getByLabel('Analysis keywords (one per line)').fill('Backend\nbackend');
  await page.getByRole('button', { name: 'Save changes' }).click();

  await expect(page.getByRole('alert')).toContainText('keywords must be unique after normalization');
});

test('Collection Runs uses persisted monitoring profile identity for manual execution', async ({ page }) => {
  let runs = [collectionRunFixture];

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname === '/api/v1/monitoring-profiles' && request.method() === 'GET') {
      return fulfillJson(route, [monitoringProfileFixture, createdMonitoringProfileFixture]);
    }
    if (url.pathname === '/api/v1/admin/collection-runs' && request.method() === 'GET') {
      return fulfillJson(route, runs);
    }
    if (url.pathname === '/api/v1/admin/collection-runs' && request.method() === 'POST') {
      expect(request.postDataJSON()).toEqual({
        monitoringProfileId: startedCollectionRunFixture.monitoringProfileId,
      });
      runs = [startedCollectionRunFixture, ...runs];
      return fulfillJson(route, startedCollectionRunFixture, 201);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/runs');

  await expect(page.getByRole('heading', { level: 3, name: 'Source outcomes' })).toBeVisible();
  await expect(page.getByText('raw-fixture-1', { exact: true })).toBeVisible();
  await expect(page.getByText('raw-fixture-2', { exact: true })).toBeVisible();

  await page.getByLabel('Monitoring profile').selectOption(startedCollectionRunFixture.monitoringProfileId);
  await page.getByRole('button', { name: 'Start collection run' }).click();

  await expect(page.getByText(createdMonitoringProfileFixture.name, { exact: true }).first()).toBeVisible();
  await expect(page.getByText('raw-browser-1', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open processing flow' })).toHaveAttribute(
    'href',
    `/flows?collectionRunId=${startedCollectionRunFixture.collectionRunId}`,
  );
});

test('Analysis applies profile and source filters through the REST query', async ({ page }) => {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname !== '/api/v1/admin/analysis/items' || request.method() !== 'GET') {
      return rejectUnexpectedApi(route);
    }

    const matches =
      url.searchParams.get('monitoringProfileId') === analysisItemFixture.monitoringProfileId &&
      url.searchParams.get('sourceId') === analysisItemFixture.sourceId;
    return fulfillJson(route, matches ? [analysisItemFixture] : []);
  });

  await page.goto('/analysis');
  await expect(page.getByText('No analysis items match the current filters.')).toBeVisible();

  await page.getByLabel('Monitoring profile ID').fill(analysisItemFixture.monitoringProfileId);
  await page.getByLabel('Source ID').fill(analysisItemFixture.sourceId);

  const filteredRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return (
      request.method() === 'GET' &&
      url.pathname === '/api/v1/admin/analysis/items' &&
      url.searchParams.get('monitoringProfileId') === analysisItemFixture.monitoringProfileId &&
      url.searchParams.get('sourceId') === analysisItemFixture.sourceId
    );
  });
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await filteredRequest;

  await expect(page.getByText(analysisItemFixture.normalizedItemId, { exact: true })).toBeVisible();
  await expect(page.getByText(analysisItemFixture.sourceUrl, { exact: true })).toBeVisible();
});

test('Results searches, follows opaque continuation, de-duplicates pages, and loads detail', async ({ page }) => {
  await installMockEventSource(page, true);
  const olderResult: ResultSummary = {
    ...resultSummaryFixture,
    normalizedItemId: 'b'.repeat(64),
    title: 'Older distributed systems result',
    analyzedAt: '2026-09-14T08:04:03Z',
  };

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname === '/api/v1/results' && request.method() === 'GET') {
      const matches =
        url.searchParams.get('search') === 'distributed systems' &&
        url.searchParams.get('monitoringProfileId') === resultSummaryFixture.monitoringProfileId &&
        url.searchParams.get('sourceId') === resultSummaryFixture.sourceId &&
        url.searchParams.get('informationCategory') === resultSummaryFixture.informationCategory &&
        url.searchParams.get('relevant') === 'true' &&
        url.searchParams.get('classification') === resultSummaryFixture.classification;
      if (!matches) {
        return fulfillJson(route, []);
      }

      const cursor = url.searchParams.get('cursor');
      if (cursor === null) {
        return fulfillJson(route, [resultSummaryFixture], 200, { 'X-Next-Cursor': 'cursor-page-2' });
      }
      expect(cursor).toBe('cursor-page-2');
      return fulfillJson(route, [resultSummaryFixture, olderResult]);
    }

    if (
      url.pathname === `/api/v1/results/${resultSummaryFixture.normalizedItemId}` &&
      request.method() === 'GET'
    ) {
      expect(url.searchParams.get('monitoringProfileId')).toBe(resultSummaryFixture.monitoringProfileId);
      return fulfillJson(route, resultDetailFixture);
    }

    return rejectUnexpectedApi(route);
  });

  await page.goto('/results');
  await expect(page.getByText('No analyzed results match the current filters.')).toBeVisible();

  await page.getByLabel('Search').fill('distributed systems');
  await page.getByLabel('Monitoring profile ID').fill(resultSummaryFixture.monitoringProfileId);
  await page.getByLabel('Source ID').fill(resultSummaryFixture.sourceId);
  await page.getByLabel('Information category').fill(resultSummaryFixture.informationCategory);
  await page.getByLabel('Relevant').selectOption('true');
  await page.getByLabel('Classification').fill(resultSummaryFixture.classification);
  await page.getByRole('button', { name: 'Apply filters' }).click();

  await expect(page.getByText(resultSummaryFixture.title!, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Load more' })).toBeVisible();
  await expect.poll(() => new URL(page.url()).searchParams.get('search')).toBe('distributed systems');
  expect(await page.evaluate(() => (window as typeof window & { __signalHarvesterHasSseSource?: (value: string) => boolean }).__signalHarvesterHasSseSource?.('search=') ?? false)).toBe(false);
  expect(await page.evaluate(() => (window as typeof window & { __signalHarvesterHasSseSource?: (value: string) => boolean }).__signalHarvesterHasSseSource?.('cursor=') ?? false)).toBe(false);

  await page.getByRole('button', { name: 'Load more' }).click();
  await expect(page.getByText(olderResult.title!, { exact: true })).toBeVisible();
  await expect(page.getByText('2 loaded', { exact: true })).toBeVisible();
  await expect(page.getByText(resultSummaryFixture.title!, { exact: true })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Load more' })).toHaveCount(0);

  await page.getByRole('row', { name: new RegExp(resultSummaryFixture.title!) }).click();
  await expect(page.getByText(resultDetailFixture.normalizedContent, { exact: true })).toBeVisible();
  await expect(page.getByText('language', { exact: true })).toBeVisible();
  await expect(page.getByText('en', { exact: true })).toBeVisible();
  await expect(page.getByText(resultDetailFixture.correlationId, { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open processing flow' })).toHaveAttribute(
    'href',
    `/flows?collectionRunId=${resultDetailFixture.correlationId}&itemId=${resultDetailFixture.normalizedItemId}`,
  );
});

test('Results resets continuation when search changes', async ({ page }) => {
  await installMockEventSource(page, true);
  let kafkaSearchWithoutCursorSeen = false;

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname !== '/api/v1/results' || request.method() !== 'GET') {
      return rejectUnexpectedApi(route);
    }

    const search = url.searchParams.get('search');
    if (search === 'java') {
      expect(url.searchParams.has('cursor')).toBe(false);
      return fulfillJson(route, [resultSummaryFixture], 200, { 'X-Next-Cursor': 'java-cursor' });
    }
    if (search === 'kafka') {
      expect(url.searchParams.has('cursor')).toBe(false);
      kafkaSearchWithoutCursorSeen = true;
      return fulfillJson(route, []);
    }
    return fulfillJson(route, []);
  });

  await page.goto('/results');
  await page.getByLabel('Search').fill('java');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page.getByRole('button', { name: 'Load more' })).toBeVisible();

  await page.getByLabel('Search').fill('kafka');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect.poll(() => kafkaSearchWithoutCursorSeen).toBe(true);
  await expect(page.getByRole('button', { name: 'Load more' })).toHaveCount(0);
});

test('Results surfaces continuation cursor failures without discarding the loaded page', async ({ page }) => {
  await installMockEventSource(page, true);

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/v1/results' && request.method() === 'GET') {
      if (url.searchParams.get('cursor') === 'stale-cursor') {
        return fulfillJson(route, { message: 'Result cursor does not match the current criteria' }, 400);
      }
      if (url.searchParams.get('search') === 'cursor failure') {
        return fulfillJson(route, [resultSummaryFixture], 200, { 'X-Next-Cursor': 'stale-cursor' });
      }
      return fulfillJson(route, []);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/results');
  await page.getByLabel('Search').fill('cursor failure');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page.getByText(resultSummaryFixture.title!, { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Load more' }).click();
  await expect(page.getByRole('alert')).toContainText('Result cursor does not match the current criteria');
  await expect(page.getByText(resultSummaryFixture.title!, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Load more' })).toBeVisible();
});

test('Results reconciles searched live events through REST instead of client-side search', async ({ page }) => {
  await installMockEventSource(page, true);
  let searchedSnapshotCount = 0;
  let continuationRequested = false;
  let releaseContinuation!: () => void;
  const continuationGate = new Promise<void>((resolve) => {
    releaseContinuation = resolve;
  });
  const unrelatedLiveResult: ResultSummary = {
    ...resultSummaryFixture,
    normalizedItemId: 'c'.repeat(64),
    title: 'Unrelated live result',
    analyzedAt: '2026-09-14T08:06:03Z',
  };
  const staleContinuationResult: ResultSummary = {
    ...resultSummaryFixture,
    normalizedItemId: 'd'.repeat(64),
    title: 'Stale continuation result',
    analyzedAt: '2026-09-14T08:04:03Z',
  };

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/v1/results' && request.method() === 'GET') {
      if (url.searchParams.get('search') === 'browser fixture') {
        if (url.searchParams.get('cursor') === 'searched-cursor-2') {
          continuationRequested = true;
          await continuationGate;
          return fulfillJson(route, [staleContinuationResult]);
        }
        searchedSnapshotCount += 1;
        return searchedSnapshotCount === 1
          ? fulfillJson(route, [resultSummaryFixture], 200, { 'X-Next-Cursor': 'searched-cursor-2' })
          : fulfillJson(route, [resultSummaryFixture]);
      }
      return fulfillJson(route, []);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/results');
  await page.getByLabel('Search').fill('browser fixture');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect.poll(() => searchedSnapshotCount).toBe(1);
  await expect(page.getByText(resultSummaryFixture.title!, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Load more' })).toBeVisible();

  await page.getByRole('button', { name: 'Load more' }).click();
  await expect.poll(() => continuationRequested).toBe(true);

  await waitForSseSource(page, '/api/v1/results/stream');
  await emitSse(page, 'result', { cursor: 90, result: unrelatedLiveResult }, '/api/v1/results/stream');

  await expect.poll(() => searchedSnapshotCount).toBe(2);
  await expect(page.getByRole('button', { name: 'Load more' })).toHaveCount(0);
  releaseContinuation();
  await expect(page.getByText(unrelatedLiveResult.title!, { exact: true })).toHaveCount(0);
  await expect(page.getByText(staleContinuationResult.title!, { exact: true })).toHaveCount(0);
  await expect(page.getByText(resultSummaryFixture.title!, { exact: true })).toBeVisible();
  await expect(page.getByText('1 loaded', { exact: true })).toBeVisible();
});




test('Processing Flow visualizes run stages and drills into a run-scoped item branch', async ({ page }) => {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const runPath = `/api/v1/flows/collection-runs/${startedCollectionRunFixture.collectionRunId}`;
    const itemPath = `${runPath}/items/${resultDetailFixture.normalizedItemId}`;

    if (request.method() === 'GET' && url.pathname === runPath) {
      return fulfillJson(route, processingFlowFixture);
    }
    if (request.method() === 'GET' && url.pathname === itemPath) {
      return fulfillJson(route, itemProcessingFlowFixture);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto(`/flows?collectionRunId=${startedCollectionRunFixture.collectionRunId}`);

  await expect(page.getByRole('heading', { level: 1, name: 'Processing Flow' })).toBeVisible();
  await expect(page.getByText('TERMINAL EVENT REACHED', { exact: true })).toBeVisible();
  await expect(page.getByText('Results persistence not observed', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Analysis stage, Completed' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Results persistence stage, Unknown' })).toBeVisible();
  await expect(page.getByText('Async processing', { exact: true })).toBeVisible();
  await expect(page.getByText('2.0 s', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Analysis stage, Completed' }).click();
  await expect(page.getByText(observedAnalysisEventFixture.eventId, { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open observed event' })).toHaveAttribute(
    'href',
    new RegExp(`collectionRunId=${startedCollectionRunFixture.collectionRunId}.*eventId=${observedAnalysisEventFixture.eventId}`),
  );
  await expect(page.getByRole('link', { name: 'Open related Result' })).toBeVisible();

  const itemRequest = page.waitForRequest((request) => request.method() === 'GET' && new URL(request.url()).pathname.endsWith(`/items/${resultDetailFixture.normalizedItemId}`));
  await page.getByRole('link', { name: 'Inspect item branch' }).click();
  await itemRequest;

  await expect(page.getByRole('heading', { level: 2, name: 'Item processing path' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View full run' })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`itemId=${resultDetailFixture.normalizedItemId}`));
});

test('Results and Event Explorer merge REST snapshots with live SSE updates', async ({ page }) => {
  await installMockEventSource(page);

  let resultsSnapshotRequested = false;
  let eventsSnapshotRequested = false;

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname === '/api/v1/results' && request.method() === 'GET') {
      resultsSnapshotRequested = true;
      return fulfillJson(route, []);
    }
    if (url.pathname === '/api/v1/events' && request.method() === 'GET') {
      eventsSnapshotRequested = true;
      return fulfillJson(route, [observedRawEventFixture]);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/results');
  await expect.poll(() => resultsSnapshotRequested).toBe(false);
  await waitForSseSource(page, '/api/v1/results/stream');
  await emitSse(page, 'ready', { cursor: 76, result: null }, '/api/v1/results/stream');
  await expect.poll(() => resultsSnapshotRequested).toBe(true);
  await expect(page.getByText('No analyzed results match the current filters.')).toBeVisible();

  await emitSse(page, 'result', resultLiveEventFixture, '/api/v1/results/stream');
  await expect(page.getByText(resultSummaryFixture.title!, { exact: true })).toBeVisible();
  await expect(page.getByText('Live', { exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Event Explorer' }).click();
  await expect.poll(() => eventsSnapshotRequested).toBe(false);
  await waitForSseSource(page, '/api/v1/events/stream');
  await emitSse(page, 'ready', { cursor: 41, event: null }, '/api/v1/events/stream');
  await expect.poll(() => eventsSnapshotRequested).toBe(true);
  await expect(page.getByText('RawItemDiscovered', { exact: true })).toBeVisible();

  await emitSse(page, 'event', observedEventLiveFixture, '/api/v1/events/stream');
  await expect(page.getByText('ItemAnalyzed', { exact: true })).toBeVisible();
  await page.getByRole('row', { name: /ItemAnalyzed/ }).click();
  await expect(page.getByText(observedAnalysisEventFixture.eventId, { exact: true })).toBeVisible();
  await expect(page.getByText('analyzed-items', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open processing flow' })).toHaveAttribute(
    'href',
    `/flows?collectionRunId=${observedAnalysisEventFixture.correlationId}&itemId=${observedAnalysisEventFixture.payload.normalizedItemId}`,
  );
});

