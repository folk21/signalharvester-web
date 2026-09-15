import { expect, test } from '@playwright/test';
import type { ObservedEvent, ProcessingFlow, ProcessingFlowNode, ResultSummary } from '../../src/api/types';
import {
  analysisItemFixture,
  collectionRunFixture,
  createdMonitoringProfileFixture,
  monitoringProfileFixture,
  observedRawEventFixture,
  processingFlowFixture,
  resultDetailFixture,
  resultSummaryFixture,
} from './fixtures/api';
import { fulfillJson, rejectUnexpectedApi } from './support/http';
import { emitSse, installMockEventSource } from './support/sse';

async function expectNoDocumentHorizontalOverflow(page: import('@playwright/test').Page) {
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  )).toBe(true);
}

test('tabular inspection remains keyboard-operable across core diagnostic screens', async ({ page }) => {
  await installMockEventSource(page, true);

  const secondRun = {
    ...collectionRunFixture,
    collectionRunId: `${collectionRunFixture.collectionRunId}-second`,
    sources: collectionRunFixture.sources.map((source, index) => ({
      ...source,
      rawItemId: index === 0 ? 'raw-keyboard-second' : source.rawItemId,
    })),
  };
  const secondAnalysisItem = {
    ...analysisItemFixture,
    normalizedItemId: `${analysisItemFixture.normalizedItemId}-second`,
    firstRawItemId: 'raw-keyboard-second',
    lastRawItemId: 'raw-keyboard-second',
  };

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname === '/api/v1/monitoring-profiles' && request.method() === 'GET') {
      return fulfillJson(route, [monitoringProfileFixture, createdMonitoringProfileFixture]);
    }
    if (url.pathname === '/api/v1/admin/collection-runs' && request.method() === 'GET') {
      return fulfillJson(route, [collectionRunFixture, secondRun]);
    }
    if (url.pathname === '/api/v1/admin/analysis/items' && request.method() === 'GET') {
      return fulfillJson(route, [analysisItemFixture, secondAnalysisItem]);
    }
    if (url.pathname === '/api/v1/results' && request.method() === 'GET') {
      return fulfillJson(route, [resultSummaryFixture]);
    }
    if (
      url.pathname === `/api/v1/results/${resultSummaryFixture.normalizedItemId}`
      && request.method() === 'GET'
    ) {
      return fulfillJson(route, resultDetailFixture);
    }
    if (url.pathname === '/api/v1/events' && request.method() === 'GET') {
      return fulfillJson(route, [observedRawEventFixture]);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/runs');
  const runButton = page.getByRole('button', { name: `Inspect collection run ${secondRun.collectionRunId}` });
  await runButton.focus();
  await expect(runButton).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByText('raw-keyboard-second', { exact: true })).toBeVisible();

  await page.goto('/analysis');
  const analysisButton = page.getByRole('button', { name: `Inspect analysis item ${secondAnalysisItem.normalizedItemId}` });
  await analysisButton.focus();
  await expect(analysisButton).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByText('raw-keyboard-second', { exact: true }).first()).toBeVisible();

  await page.goto('/results');
  const resultButton = page.getByRole('button', { name: `Inspect result ${resultSummaryFixture.title}` });
  await resultButton.focus();
  await expect(resultButton).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByText(resultDetailFixture.normalizedContent, { exact: true })).toBeVisible();

  await page.goto('/events');
  const eventButton = page.getByRole('button', { name: `Inspect event ${observedRawEventFixture.eventType} ${observedRawEventFixture.eventId}` });
  await eventButton.focus();
  await expect(eventButton).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByText(observedRawEventFixture.eventId, { exact: true })).toBeVisible();
});

test('Results resynchronizes after SSE errors without duplicating one logical result', async ({ page }) => {
  await installMockEventSource(page);
  let snapshotCount = 0;

  const recoveredResult: ResultSummary = {
    ...resultSummaryFixture,
    title: 'Recovered durable result',
    score: 0.97,
  };

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/v1/results' && request.method() === 'GET') {
      snapshotCount += 1;
      return fulfillJson(route, snapshotCount === 1 ? [resultSummaryFixture] : [recoveredResult]);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/results');
  await emitSse(page, 'ready', { cursor: 10 });
  await expect(page.getByText(resultSummaryFixture.title!, { exact: true })).toBeVisible();
  await expect(page.getByText('1 loaded', { exact: true })).toBeVisible();

  await emitSse(page, 'result', {
    cursor: 11,
    result: { ...resultSummaryFixture, title: 'Live replacement result', score: 0.95 },
  });
  await expect(page.getByText('Live replacement result', { exact: true })).toBeVisible();
  await expect(page.getByText('1 loaded', { exact: true })).toBeVisible();

  await emitSse(page, 'error', {});
  await expect(page.getByText('Reconnecting', { exact: true })).toBeVisible();
  await emitSse(page, 'ready', { cursor: 12 });

  await expect.poll(() => snapshotCount).toBe(2);
  await expect(page.getByText('Recovered durable result', { exact: true })).toBeVisible();
  await expect(page.getByText('1 loaded', { exact: true })).toBeVisible();
});

test('bounded deep links stay safe when the requested Result or Event is no longer retained', async ({ page }) => {
  await installMockEventSource(page, true);

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/v1/results' && request.method() === 'GET') {
      return fulfillJson(route, [resultSummaryFixture]);
    }
    if (url.pathname === '/api/v1/events' && request.method() === 'GET') {
      return fulfillJson(route, [observedRawEventFixture]);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto(`/results?monitoringProfileId=${resultSummaryFixture.monitoringProfileId}&normalizedItemId=missing-normalized-item`);
  await expect(page.getByText('Select a result to inspect its content and provenance.', { exact: true })).toBeVisible();
  await expect(page.getByText(resultSummaryFixture.title!, { exact: true })).toBeVisible();

  await page.goto('/events?eventId=missing-observed-event');
  await expect(page.getByText('Select an observed event to inspect its technical metadata.', { exact: true })).toBeVisible();
  await expect(page.getByText(observedRawEventFixture.eventType, { exact: true })).toBeVisible();
});

test('partial processing history keeps missing evidence explicit instead of inventing completed stages', async ({ page }) => {
  const partialFlow: ProcessingFlow = {
    ...processingFlowFixture,
    state: 'PARTIAL_HISTORY',
    observedEventCount: 1,
    limitations: ['HISTORY_QUERY_LIMIT_REACHED', 'MISSING_RAW_DISCOVERY', 'RESULTS_PERSISTENCE_NOT_OBSERVED'],
    nodes: processingFlowFixture.nodes.map((node): ProcessingFlowNode =>
      node.stage === 'EXTERNAL_SOURCE'
        ? { ...node, status: 'UNKNOWN', evidence: 'NOT_OBSERVED', occurredAt: null }
        : node),
    edges: processingFlowFixture.edges.filter((edge) => !edge.from.endsWith(':external_source')),
  };

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === `/api/v1/flows/collection-runs/${processingFlowFixture.collectionRunId}` && request.method() === 'GET') {
      return fulfillJson(route, partialFlow);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto(`/flows?collectionRunId=${processingFlowFixture.collectionRunId}`);

  await expect(page.getByText('PARTIAL HISTORY', { exact: true })).toBeVisible();
  await expect(page.getByText('History query limit reached', { exact: true })).toBeVisible();
  await expect(page.getByText('Missing raw discovery', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'External source stage, Unknown' })).toBeVisible();
  await expect(page.getByText('Not observed', { exact: true }).first()).toBeVisible();
});

test('long diagnostic values stay contained at a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installMockEventSource(page, true);

  const longToken = 'diagnostic-segment-'.repeat(20);
  const longEvent: ObservedEvent = {
    ...observedRawEventFixture,
    eventId: `event-${longToken}`,
    correlationId: `run-${longToken}`,
    traceparent: `00-${'a'.repeat(32)}-${'b'.repeat(16)}-01`,
    kafka: {
      ...observedRawEventFixture.kafka,
      key: `key-${longToken}`,
    },
    payload: {
      ...observedRawEventFixture.payload,
      rawItemId: `raw-${longToken}`,
      title: `Very long diagnostic title ${longToken}`,
      url: `https://example.test/${longToken}`,
    },
  };

  const longFlow: ProcessingFlow = {
    ...processingFlowFixture,
    collectionRunId: `run-${longToken}`,
    nodes: processingFlowFixture.nodes.map((node) => ({
      ...node,
      branchId: `branch-${longToken}`,
      rawItemId: `raw-${longToken}`,
      normalizedItemId: `normalized-${longToken}`,
    })),
  };

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/v1/events' && request.method() === 'GET') {
      return fulfillJson(route, [longEvent]);
    }
    if (url.pathname === `/api/v1/flows/collection-runs/${encodeURIComponent(longFlow.collectionRunId)}` && request.method() === 'GET') {
      return fulfillJson(route, longFlow);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/events');
  await expectNoDocumentHorizontalOverflow(page);
  const eventButton = page.getByRole('button', {
    name: `Inspect event ${longEvent.eventType} ${longEvent.eventId}`,
  });
  await expect(eventButton).toBeVisible();
  await eventButton.focus();
  await expect(eventButton).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByText(longEvent.eventId, { exact: true })).toBeVisible();
  await expectNoDocumentHorizontalOverflow(page);

  await page.goto(`/flows?collectionRunId=${encodeURIComponent(longFlow.collectionRunId)}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Processing Flow' })).toBeVisible();
  await expect.poll(() => page.locator('.flow-track-wrap').first().evaluate((element) =>
    element.scrollWidth > element.clientWidth,
  )).toBe(true);
  await expectNoDocumentHorizontalOverflow(page);
});
