import { describe, expect, it } from 'vitest';
import type { ProcessingFlow, ProcessingFlowNode } from '../api/types';
import {
  edgeBetween,
  flowStageLabel,
  formatFlowDuration,
  groupProcessingFlowBranches,
} from './processing-flow';

function node(id: string, branchId: string, stage: ProcessingFlowNode['stage']): ProcessingFlowNode {
  return {
    id,
    branchId,
    stage,
    status: 'COMPLETED',
    evidence: 'DERIVED_FROM_EVENT',
    occurredAt: null,
    eventId: null,
    eventType: null,
    producer: null,
    traceparent: null,
    sourceEventId: null,
    rawItemId: null,
    normalizedItemId: null,
    sourceId: null,
    monitoringProfileId: null,
    outcome: null,
    score: null,
    kafka: null,
  };
}

describe('processing flow helpers', () => {
  it('groups branches deterministically and orders nodes by processing stage', () => {
    const collection = node('b:collection', 'branch-b', 'COLLECTION');
    const source = node('b:source', 'branch-b', 'EXTERNAL_SOURCE');
    const analysis = node('a:analysis', 'branch-a', 'ANALYSIS');
    const rawKafka = node('a:raw', 'branch-a', 'RAW_KAFKA');
    const flow: ProcessingFlow = {
      scope: 'COLLECTION_RUN',
      collectionRunId: 'run-1',
      itemId: null,
      state: 'TERMINAL_EVENT_REACHED',
      observedEventCount: 4,
      traceIds: [],
      nodes: [collection, analysis, source, rawKafka],
      edges: [{ from: rawKafka.id, to: analysis.id, kind: 'ASYNC_PROCESSING', durationMs: 1500 }],
      limitations: [],
    };

    const branches = groupProcessingFlowBranches(flow);

    expect(branches).toHaveLength(2);
    expect(branches.map((branch) => branch.branchId)).toEqual(['branch-a', 'branch-b']);
    expect(branches[0]!.nodes.map((item) => item.stage)).toEqual(['RAW_KAFKA', 'ANALYSIS']);
    expect(branches[1]!.nodes.map((item) => item.stage)).toEqual(['EXTERNAL_SOURCE', 'COLLECTION']);
    expect(edgeBetween(flow.edges, rawKafka, analysis)?.kind).toBe('ASYNC_PROCESSING');
  });

  it('formats stage labels and durations for diagnostic presentation', () => {
    expect(flowStageLabel('RESULTS_PERSISTENCE')).toBe('Results persistence');
    expect(formatFlowDuration(null)).toBe('duration unavailable');
    expect(formatFlowDuration(420)).toBe('420 ms');
    expect(formatFlowDuration(1500)).toBe('1.5 s');
    expect(formatFlowDuration(65_000)).toBe('1m 5s');
  });
});
