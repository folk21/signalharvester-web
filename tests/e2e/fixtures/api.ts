import type {
  AnalysisItemInspection,
  CollectionRun,
  MonitoringProfile,
  ResultDetail,
  ResultSummary,
  ObservedEvent,
  ResultLiveEvent,
  ObservedEventLiveEvent,
  Source,
  SourceTestResult,
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

export const sourceTestFixture: SourceTestResult = {
  sourceId: sourceFixture.id,
  status: 'SUCCEEDED',
  httpStatus: 200,
  responseContentType: 'application/json',
  responseBytes: 486,
  fetchDurationMs: 12,
  extractionDurationMs: 3,
  candidateItemCount: 1,
  preview: [
    {
      externalId: 'fixture-item-1',
      title: 'Fixture preview item',
      url: 'https://example.test/api/items/1',
      contentPreview: 'Bounded extracted content used by the deterministic source-test fixture.',
      contentType: 'text/plain',
      publishedAt: '2026-09-14T07:59:00Z',
      contentTruncated: false,
    },
  ],
  failureMessage: null,
};

export const monitoringProfileFixture: MonitoringProfile = {
  id: '33333333-3333-4333-8333-111111111111',
  name: 'Fixture monitoring profile',
  informationCategory: 'GENERAL',
  enabled: true,
  collectionIntervalMinutes: 15,
  sourceIds: [sourceFixture.id],
  criteria: { query: 'backend' },
};

export const createdMonitoringProfileFixture: MonitoringProfile = {
  id: '33333333-3333-4333-8333-222222222222',
  name: 'Browser monitoring profile',
  informationCategory: 'GENERAL',
  enabled: false,
  collectionIntervalMinutes: 30,
  sourceIds: [createdSourceFixture.id, sourceFixture.id],
  criteria: { query: 'java' },
};

export const collectionRunFixture: CollectionRun = {
  collectionRunId: '22222222-2222-4222-8222-111111111111',
  monitoringProfileId: monitoringProfileFixture.id,
  informationCategory: monitoringProfileFixture.informationCategory,
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
  monitoringProfileId: createdMonitoringProfileFixture.id,
  informationCategory: createdMonitoringProfileFixture.informationCategory,
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
  monitoringProfileId: createdMonitoringProfileFixture.id,
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
  monitoringProfileId: createdMonitoringProfileFixture.id,
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


export const observedRawEventFixture: ObservedEvent = {
  cursor: 41,
  eventId: 'observed-event-raw-1',
  eventType: 'RawItemDiscovered',
  occurredAt: '2026-09-14T08:05:01Z',
  observedAt: '2026-09-14T08:05:01.050Z',
  correlationId: startedCollectionRunFixture.collectionRunId,
  traceparent: resultDetailFixture.traceparent,
  producer: 'collection',
  schemaVersion: '1',
  kafka: { topic: 'raw-items', partition: 0, offset: 11, key: 'raw-browser-1' },
  payload: {
    type: 'RawItemDiscovered',
    sourceEventId: resultDetailFixture.sourceEventId,
    rawItemId: resultDetailFixture.rawItemId,
    normalizedItemId: null,
    sourceId: resultDetailFixture.sourceId,
    monitoringProfileId: resultDetailFixture.monitoringProfileId,
    informationCategory: resultDetailFixture.informationCategory,
    externalId: resultDetailFixture.externalId,
    title: resultDetailFixture.title,
    url: resultDetailFixture.url,
    contentType: resultDetailFixture.contentType,
    relevant: null,
    classification: null,
    score: null,
    analyzer: null,
    reasonCode: null,
    explanation: null,
  },
};

export const observedAnalysisEventFixture: ObservedEvent = {
  ...observedRawEventFixture,
  cursor: 42,
  eventId: 'observed-event-analysis-1',
  eventType: 'ItemAnalyzed',
  occurredAt: resultDetailFixture.analyzedAt,
  observedAt: '2026-09-14T08:05:03.050Z',
  producer: 'analysis',
  kafka: { topic: 'analyzed-items', partition: 1, offset: 22, key: resultDetailFixture.normalizedItemId },
  payload: {
    ...observedRawEventFixture.payload,
    type: 'ItemAnalyzed',
    normalizedItemId: resultDetailFixture.normalizedItemId,
    relevant: resultDetailFixture.relevant,
    classification: resultDetailFixture.classification,
    score: 91,
    analyzer: resultDetailFixture.analyzer,
    explanation: resultDetailFixture.explanation,
  },
};

export const resultLiveEventFixture: ResultLiveEvent = { cursor: 77, result: resultSummaryFixture };
export const observedEventLiveFixture: ObservedEventLiveEvent = { cursor: 42, event: observedAnalysisEventFixture };
