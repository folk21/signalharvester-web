import { expect, test } from '@playwright/test';
import type { MonitoringProfile, Source } from '../../src/api/types';
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
  await page
    .getByLabel('Criteria (JSON string map)')
    .fill(JSON.stringify(createdMonitoringProfileFixture.criteria));
  await page.getByRole('button', { name: 'Create profile' }).click();

  const createdRow = page.getByRole('row', { name: new RegExp(createdMonitoringProfileFixture.name) });
  await expect(createdRow).toBeVisible();
  await expect(createdRow.getByText('GENERAL', { exact: true })).toBeVisible();
  await expect(createdRow.getByText('DISABLED', { exact: true })).toBeVisible();
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

test('Results applies filters and loads bounded detail on selection', async ({ page }) => {
  await installMockEventSource(page, true);
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname === '/api/v1/results' && request.method() === 'GET') {
      const matches =
        url.searchParams.get('monitoringProfileId') === resultSummaryFixture.monitoringProfileId &&
        url.searchParams.get('sourceId') === resultSummaryFixture.sourceId &&
        url.searchParams.get('informationCategory') === resultSummaryFixture.informationCategory &&
        url.searchParams.get('relevant') === 'true' &&
        url.searchParams.get('classification') === resultSummaryFixture.classification;
      return fulfillJson(route, matches ? [resultSummaryFixture] : []);
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

  await page.getByLabel('Monitoring profile ID').fill(resultSummaryFixture.monitoringProfileId);
  await page.getByLabel('Source ID').fill(resultSummaryFixture.sourceId);
  await page.getByLabel('Information category').fill(resultSummaryFixture.informationCategory);
  await page.getByLabel('Relevant').selectOption('true');
  await page.getByLabel('Classification').fill(resultSummaryFixture.classification);
  await page.getByRole('button', { name: 'Apply filters' }).click();

  await expect(page.getByText(resultSummaryFixture.title!, { exact: true })).toBeVisible();
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

