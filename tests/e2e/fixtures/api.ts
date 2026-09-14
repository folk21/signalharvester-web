import type {
  AnalysisItemInspection,
  CollectionRun,
  ResultDetail,
  ResultSummary,
  Source,
} from '../../../src/api/types';

export const sourceFixture: Source = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Fixture REST source',
  type: 'REST',
  location: 'https://example.test/api/items',
  enabled: true,
  settings: {},
};

export const createdSourceFixture: Source = {
  id: '11111111-1111-4111-8111-222222222222',
  name: 'Browser RSS source',
  type: 'RSS',
  location: 'https://example.test/feed.xml',
  enabled: true,
  settings: { maxItems: '25' },
};

export const collectionRunFixture: CollectionRun = {
  collectionRunId: '22222222-2222-4222-8222-111111111111',
  monitoringProfileId: 'fixture-profile',
  informationCategory: 'GENERAL',
  startedAt: '2026-09-14T08:00:00Z',
  finishedAt: '2026-09-14T08:00:01Z',
  status: 'SUCCEEDED',
  publishedCount: 2,
  failedCount: 0,
  sources: [
    {
      sourceId: sourceFixture.id,
      status: 'PUBLISHED',
      rawItemId: 'raw-fixture-1',
      eventId: 'source-event-fixture-1',
      failureMessage: null,
    },
    {
      sourceId: sourceFixture.id,
      status: 'PUBLISHED',
      rawItemId: 'raw-fixture-2',
      eventId: 'source-event-fixture-2',
      failureMessage: null,
    },
  ],
};

export const startedCollectionRunFixture: CollectionRun = {
  collectionRunId: '22222222-2222-4222-8222-222222222222',
  monitoringProfileId: 'browser-profile',
  informationCategory: 'GENERAL',
  startedAt: '2026-09-14T08:05:00Z',
  finishedAt: '2026-09-14T08:05:02Z',
  status: 'SUCCEEDED',
  publishedCount: 1,
  failedCount: 0,
  sources: [
    {
      sourceId: sourceFixture.id,
      status: 'PUBLISHED',
      rawItemId: 'raw-browser-1',
      eventId: 'source-event-browser-1',
      failureMessage: null,
    },
  ],
};

export const analysisItemFixture: AnalysisItemInspection = {
  monitoringProfileId: 'browser-profile',
  normalizedItemId: 'normalized-browser-1',
  sourceId: sourceFixture.id,
  externalId: 'external-browser-1',
  sourceUrl: 'https://example.test/items/1',
  firstRawItemId: 'raw-browser-1',
  firstSourceEventId: 'source-event-browser-1',
  firstSeenAt: '2026-09-14T08:05:01Z',
  lastRawItemId: 'raw-browser-1',
  lastSourceEventId: 'source-event-browser-1',
  lastSeenAt: '2026-09-14T08:05:01Z',
  discoveryCount: 1,
};

export const resultSummaryFixture: ResultSummary = {
  monitoringProfileId: 'browser-profile',
  normalizedItemId: 'normalized-browser-1',
  sourceId: sourceFixture.id,
  informationCategory: 'GENERAL',
  externalId: 'external-browser-1',
  title: 'Browser fixture result',
  url: 'https://example.test/items/1',
  relevant: true,
  classification: 'RELEVANT',
  score: 0.91,
  attributes: { language: 'en' },
  tags: ['java', 'backend'],
  explanation: 'Fixture matched the deterministic browser test.',
  analyzer: 'fixture-analyzer',
  publishedAt: '2026-09-14T08:05:00Z',
  analyzedAt: '2026-09-14T08:05:03Z',
};

export const resultDetailFixture: ResultDetail = {
  monitoringProfileId: resultSummaryFixture.monitoringProfileId,
  normalizedItemId: resultSummaryFixture.normalizedItemId,
  analysisEventId: 'analysis-event-browser-1',
  sourceEventId: 'source-event-browser-1',
  rawItemId: 'raw-browser-1',
  sourceId: resultSummaryFixture.sourceId,
  informationCategory: resultSummaryFixture.informationCategory,
  externalId: resultSummaryFixture.externalId,
  title: resultSummaryFixture.title,
  url: resultSummaryFixture.url,
  normalizedContent: 'Deterministic normalized content for the browser test.',
  contentType: 'text/plain',
  attributes: resultSummaryFixture.attributes,
  relevant: resultSummaryFixture.relevant,
  classification: resultSummaryFixture.classification,
  score: resultSummaryFixture.score,
  tags: resultSummaryFixture.tags,
  explanation: resultSummaryFixture.explanation,
  analyzer: resultSummaryFixture.analyzer,
  publishedAt: resultSummaryFixture.publishedAt,
  analyzedAt: resultSummaryFixture.analyzedAt,
  correlationId: startedCollectionRunFixture.collectionRunId,
  traceparent: '00-11111111111111111111111111111111-2222222222222222-01',
};
