import { expect, test, type Page } from '@playwright/test';
import type {
  MonitoringProfile,
  ProcessingFlow,
  ProcessingFlowNode,
  ResultDetail,
  ResultSummary,
  Source,
} from '../../src/api/types';
import {
  monitoringProfileFixture,
  processingFlowFixture,
  resultDetailFixture,
  resultSummaryFixture,
  sourceFixture,
} from './fixtures/api';
import { fulfillJson, rejectUnexpectedApi } from './support/http';
import { installMockEventSource } from './support/sse';

const LONG_SEGMENT = 'long-unbroken-diagnostic-segment-'.repeat(8);

async function expectNoDocumentHorizontalOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  )).toBe(true);
}

test('large configuration collections stay bounded and usable at a 320px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });

  const sources = buildSources(48);
  const firstSource = sources[0];
  if (!firstSource) {
    throw new Error('Expected the large-data fixture to contain at least one source');
  }
  const profiles = buildProfiles(36, sources);

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/v1/sources' && request.method() === 'GET') {
      return fulfillJson(route, sources);
    }
    if (url.pathname === '/api/v1/monitoring-profiles' && request.method() === 'GET') {
      return fulfillJson(route, profiles);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/sources');
  await expect(page.getByRole('table', { name: 'Configured sources' }).locator('tbody tr')).toHaveCount(48);
  const sourcesTableWrap = page.locator('.table-wrap--bounded').first();
  await expect.poll(() => sourcesTableWrap.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  await expect.poll(() => sourcesTableWrap.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  await expectNoDocumentHorizontalOverflow(page);

  await page.goto('/profiles');
  await expect(page.getByRole('table', { name: 'Configured monitoring profiles' }).locator('tbody tr')).toHaveCount(36);
  const membership = page.locator('.source-membership__list');
  await expect(membership).toBeVisible();
  await expect.poll(() => membership.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  await expect(page.getByRole('checkbox', { name: `Use source ${firstSource.name}` })).toBeVisible();
  await expectNoDocumentHorizontalOverflow(page);
});

test('long Result detail values wrap without escaping a tablet layout', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await installMockEventSource(page, true);

  const longTag = `tag-${LONG_SEGMENT}`;
  const summary: ResultSummary = {
    ...resultSummaryFixture,
    title: `Result-${LONG_SEGMENT}`,
    tags: [longTag, 'backend'],
  };
  const detail: ResultDetail = {
    ...resultDetailFixture,
    title: summary.title,
    tags: summary.tags,
    normalizedContent: `${LONG_SEGMENT.repeat(6)}\n${LONG_SEGMENT.repeat(6)}`,
    explanation: LONG_SEGMENT.repeat(4),
    attributes: {
      ...resultDetailFixture.attributes,
      diagnostic: LONG_SEGMENT.repeat(3),
    },
  };

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/v1/results' && request.method() === 'GET') {
      return fulfillJson(route, [summary]);
    }
    if (url.pathname === `/api/v1/results/${summary.normalizedItemId}` && request.method() === 'GET') {
      return fulfillJson(route, detail);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/results');
  const resultButton = page.getByRole('button', { name: `Inspect result ${summary.title}` });
  await expect(resultButton).toBeVisible();
  await resultButton.focus();
  await page.keyboard.press('Enter');

  const tags = page.locator('.result-tags');
  await expect(tags).toContainText(longTag);
  await expect.poll(() => tags.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await expect.poll(() => page.locator('.content-preview').evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await expectNoDocumentHorizontalOverflow(page);
});

test('many Processing Flow branches use local scrolling at tablet width', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  const flow = buildLargeFlow(14);

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (
      url.pathname === `/api/v1/flows/collection-runs/${encodeURIComponent(flow.collectionRunId)}`
      && request.method() === 'GET'
    ) {
      return fulfillJson(route, flow);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto(`/flows?collectionRunId=${encodeURIComponent(flow.collectionRunId)}`);
  await expect(page.getByText('112 stages across 14 branches', { exact: true })).toBeVisible();

  const branches = page.locator('.flow-branches');
  await expect.poll(() => branches.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  await expect.poll(() => page.locator('.flow-track-wrap').first().evaluate((element) =>
    element.scrollWidth > element.clientWidth,
  )).toBe(true);
  await expectNoDocumentHorizontalOverflow(page);
});

function buildSources(count: number): Source[] {
  return Array.from({ length: count }, (_, index) => ({
    ...sourceFixture,
    id: `11111111-1111-4111-8111-${String(index + 1).padStart(12, '0')}`,
    name: `Source-${String(index + 1).padStart(2, '0')}-${LONG_SEGMENT}`,
    location: `https://example.test/sources/${index + 1}/${LONG_SEGMENT}`,
    enabled: index % 3 !== 0,
  }));
}

function buildProfiles(count: number, sources: Source[]): MonitoringProfile[] {
  return Array.from({ length: count }, (_, index) => ({
    ...monitoringProfileFixture,
    id: `33333333-3333-4333-8333-${String(index + 1).padStart(12, '0')}`,
    name: `Profile-${String(index + 1).padStart(2, '0')}-${LONG_SEGMENT}`,
    enabled: index % 2 === 0,
    sourceIds: sources.slice(index % 6, (index % 6) + 6).map((source) => source.id),
  }));
}

function buildLargeFlow(branchCount: number): ProcessingFlow {
  const nodes: ProcessingFlowNode[] = [];
  const edges: ProcessingFlow['edges'] = [];

  for (let branchIndex = 0; branchIndex < branchCount; branchIndex += 1) {
    const branchId = `branch-${String(branchIndex + 1).padStart(2, '0')}-${LONG_SEGMENT}`;
    const idByOriginal = new Map<string, string>();

    for (const node of processingFlowFixture.nodes) {
      const id = `${branchId}:${node.stage.toLowerCase()}`;
      idByOriginal.set(node.id, id);
      nodes.push({
        ...node,
        id,
        branchId,
        sourceEventId: `source-event-${branchIndex + 1}-${LONG_SEGMENT}`,
        rawItemId: `raw-${branchIndex + 1}-${LONG_SEGMENT}`,
        normalizedItemId: `normalized-${branchIndex + 1}-${LONG_SEGMENT}`,
      });
    }

    for (const edge of processingFlowFixture.edges) {
      const from = idByOriginal.get(edge.from);
      const to = idByOriginal.get(edge.to);
      if (!from || !to) {
        throw new Error('Processing Flow fixture edge references an unknown node');
      }
      edges.push({ ...edge, from, to });
    }
  }

  return {
    ...processingFlowFixture,
    observedEventCount: branchCount * 2,
    nodes,
    edges,
  };
}
