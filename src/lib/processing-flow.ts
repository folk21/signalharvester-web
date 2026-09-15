import type { ProcessingFlow, ProcessingFlowEdge, ProcessingFlowNode } from '../api/types';

export const PROCESSING_FLOW_STAGE_ORDER: readonly ProcessingFlowNode['stage'][] = [
  'EXTERNAL_SOURCE',
  'COLLECTION',
  'RAW_KAFKA',
  'NORMALIZATION',
  'DEDUPLICATION',
  'ANALYSIS',
  'TERMINAL_KAFKA',
  'RESULTS_PERSISTENCE',
];

export interface ProcessingFlowBranch {
  branchId: string;
  nodes: ProcessingFlowNode[];
}

const stageRank = new Map(PROCESSING_FLOW_STAGE_ORDER.map((stage, index) => [stage, index]));

export function groupProcessingFlowBranches(flow: ProcessingFlow): ProcessingFlowBranch[] {
  const byBranch = new Map<string, ProcessingFlowNode[]>();
  for (const node of flow.nodes) {
    const branch = byBranch.get(node.branchId) ?? [];
    branch.push(node);
    byBranch.set(node.branchId, branch);
  }

  return [...byBranch.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([branchId, nodes]) => ({
      branchId,
      nodes: [...nodes].sort((left, right) => {
        const stageDifference = (stageRank.get(left.stage) ?? Number.MAX_SAFE_INTEGER)
          - (stageRank.get(right.stage) ?? Number.MAX_SAFE_INTEGER);
        if (stageDifference !== 0) {
          return stageDifference;
        }
        return left.id.localeCompare(right.id);
      }),
    }));
}

export function edgeBetween(
  edges: ProcessingFlowEdge[],
  from: ProcessingFlowNode,
  to: ProcessingFlowNode,
): ProcessingFlowEdge | null {
  return edges.find((edge) => edge.from === from.id && edge.to === to.id) ?? null;
}

export function flowStageLabel(stage: ProcessingFlowNode['stage']): string {
  switch (stage) {
    case 'EXTERNAL_SOURCE': return 'External source';
    case 'COLLECTION': return 'Collection';
    case 'RAW_KAFKA': return 'Raw Kafka';
    case 'NORMALIZATION': return 'Normalization';
    case 'DEDUPLICATION': return 'Deduplication';
    case 'ANALYSIS': return 'Analysis';
    case 'TERMINAL_KAFKA': return 'Terminal Kafka';
    case 'RESULTS_PERSISTENCE': return 'Results persistence';
  }
}

export function formatFlowDuration(durationMs: number | null): string {
  if (durationMs === null) {
    return 'duration unavailable';
  }
  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }
  const seconds = durationMs / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(seconds < 10 ? 1 : 0)} s`;
  }
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}

export function flowNodeItemId(node: ProcessingFlowNode): string | null {
  return node.normalizedItemId ?? node.rawItemId ?? null;
}
