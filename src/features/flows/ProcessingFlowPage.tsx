import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { ProcessingFlow, ProcessingFlowEdge, ProcessingFlowNode } from '../../api/types';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDateTime, shortId } from '../../lib/format';
import {
  edgeBetween,
  flowNodeItemId,
  flowStageLabel,
  formatFlowDuration,
  groupProcessingFlowBranches,
} from '../../lib/processing-flow';
import { hasRole, useAuthSession } from '../auth/AuthSession';

interface FlowQueryForm {
  collectionRunId: string;
  itemId: string;
}

export function ProcessingFlowPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const collectionRunId = searchParams.get('collectionRunId')?.trim() ?? '';
  const itemId = searchParams.get('itemId')?.trim() ?? '';
  const [form, setForm] = useState<FlowQueryForm>({ collectionRunId, itemId });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    setForm({ collectionRunId, itemId });
  }, [collectionRunId, itemId]);

  const flowQuery = useQuery({
    queryKey: ['processing-flow', collectionRunId, itemId],
    queryFn: () => itemId
      ? api.getItemProcessingFlow(collectionRunId, itemId)
      : api.getCollectionRunProcessingFlow(collectionRunId),
    enabled: collectionRunId.length > 0,
  });

  const flow = flowQuery.data ?? null;
  const branches = useMemo(() => flow ? groupProcessingFlowBranches(flow) : [], [flow]);
  const selectedNode = flow?.nodes.find((node) => node.id === selectedNodeId) ?? null;

  useEffect(() => {
    if (!flow) {
      setSelectedNodeId(null);
      return;
    }
    setSelectedNodeId((current) => {
      if (current && flow.nodes.some((node) => node.id === current)) {
        return current;
      }
      return flow.nodes.find((node) => node.stage === 'ANALYSIS')?.id ?? flow.nodes[0]?.id ?? null;
    });
  }, [flow]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const run = form.collectionRunId.trim();
    const item = form.itemId.trim();
    if (!run) {
      return;
    }
    const next = new URLSearchParams({ collectionRunId: run });
    if (item) {
      next.set('itemId', item);
    }
    setSelectedNodeId(null);
    setSearchParams(next);
  }

  function clear() {
    setForm({ collectionRunId: '', itemId: '' });
    setSelectedNodeId(null);
    setSearchParams({});
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Diagnostics"
        title="Processing Flow"
        description="Visualize the backend-reconstructed processing path for one collection run or one run-scoped item branch. Evidence gaps remain explicit; this view does not replace distributed tracing."
      />

      <section className="panel filter-panel">
        <form aria-label="Processing flow query" className="flow-query-form" onSubmit={submit}>
          <label>
            <span>Collection run ID</span>
            <input
              aria-label="Collection run ID"
              value={form.collectionRunId}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, collectionRunId: event.target.value })}
              placeholder="required"
              required
            />
          </label>
          <label>
            <span>Item ID</span>
            <input
              aria-label="Item ID"
              value={form.itemId}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, itemId: event.target.value })}
              placeholder="optional raw or normalized item ID"
            />
          </label>
          <div className="filter-actions">
            <button className="button button--primary" type="submit">Load flow</button>
            <button className="button button--ghost" type="button" onClick={clear}>Clear</button>
          </div>
        </form>
      </section>

      {!collectionRunId ? (
        <EmptyState>Enter a Collection Run ID to reconstruct its retained processing flow. Add an Item ID to inspect one run-scoped branch.</EmptyState>
      ) : flowQuery.isPending ? (
        <LoadingState label="Reconstructing processing flow…" />
      ) : flowQuery.error ? (
        <ErrorState error={flowQuery.error} action={<button className="button button--ghost" onClick={() => void flowQuery.refetch()}>Retry</button>} />
      ) : flow ? (
        <FlowWorkspace
          flow={flow}
          branches={branches}
          selectedNode={selectedNode}
          onSelectNode={setSelectedNodeId}
        />
      ) : null}
    </div>
  );
}

function FlowWorkspace({
  flow,
  branches,
  selectedNode,
  onSelectNode,
}: {
  flow: ProcessingFlow;
  branches: ReturnType<typeof groupProcessingFlowBranches>;
  selectedNode: ProcessingFlowNode | null;
  onSelectNode: (nodeId: string) => void;
}) {
  return <>
    <section className="flow-summary-grid" aria-label="Flow summary">
      <SummaryCard label="Scope" value={flow.scope === 'ITEM' ? 'Item branch' : 'Collection run'} />
      <SummaryCard label="State" value={<StatusBadge value={flow.state} />} />
      <SummaryCard label="Observed events" value={String(flow.observedEventCount)} />
      <SummaryCard label="Branches" value={String(branches.length)} />
      <SummaryCard label="Trace IDs" value={String(flow.traceIds.length)} />
    </section>

    {flow.limitations.length > 0 ? (
      <section className="flow-limitations" aria-label="Flow limitations">
        <strong>Bounded reconstruction limitations</strong>
        <ul>{flow.limitations.map((limitation) => <li key={limitation}>{humanize(limitation)}</li>)}</ul>
      </section>
    ) : null}

    <section className="flow-workspace">
      <article className="panel flow-graph-panel">
        <div className="panel__header">
          <div>
            <h2>{flow.scope === 'ITEM' ? 'Item processing path' : 'Collection-run branches'}</h2>
            <span>{flow.nodes.length} stages across {branches.length} branch{branches.length === 1 ? '' : 'es'}</span>
          </div>
          {flow.scope === 'ITEM' ? (
            <Link className="button button--ghost" to={`/flows?collectionRunId=${encodeURIComponent(flow.collectionRunId)}`}>View full run</Link>
          ) : null}
        </div>
        <div className="flow-branches">
          {branches.length === 0 ? (
            <EmptyState>The backend returned no reconstructable branches for this retained flow.</EmptyState>
          ) : branches.map((branch) => (
            <FlowBranchLane
              key={branch.branchId}
              flow={flow}
              branchId={branch.branchId}
              nodes={branch.nodes}
              selectedNodeId={selectedNode?.id ?? null}
              onSelectNode={onSelectNode}
            />
          ))}
        </div>
      </article>

      <article className="panel detail-panel flow-detail-panel">
        <div className="panel__header">
          <div><span className="eyebrow">Stage detail</span><h2>{selectedNode ? flowStageLabel(selectedNode.stage) : 'No selection'}</h2></div>
        </div>
        {selectedNode ? <FlowNodeDetail flow={flow} node={selectedNode} /> : <EmptyState>Select a stage to inspect its evidence and identifiers.</EmptyState>}
      </article>
    </section>
  </>;
}

function FlowBranchLane({
  flow,
  branchId,
  nodes,
  selectedNodeId,
  onSelectNode,
}: {
  flow: ProcessingFlow;
  branchId: string;
  nodes: ProcessingFlowNode[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}) {
  const itemId = nodes.map(flowNodeItemId).find((value): value is string => value !== null) ?? null;
  return <section className="flow-branch">
    <div className="flow-branch__header">
      <div>
        <span className="eyebrow">Branch</span>
        <strong className="mono" title={branchId}>{shortId(branchId, 26)}</strong>
        {itemId ? <small className="mono" title={itemId}>{shortId(itemId, 30)}</small> : null}
      </div>
      {flow.scope === 'COLLECTION_RUN' && itemId ? (
        <Link className="button button--ghost" to={`/flows?collectionRunId=${encodeURIComponent(flow.collectionRunId)}&itemId=${encodeURIComponent(itemId)}`}>Open item flow</Link>
      ) : null}
    </div>
    <div className="flow-track-wrap">
      <div className="flow-track">
        {nodes.map((node, index) => {
          const next = nodes[index + 1] ?? null;
          const edge = next ? edgeBetween(flow.edges, node, next) : null;
          return <div className="flow-track__segment" key={node.id}>
            <FlowNodeCard node={node} selected={node.id === selectedNodeId} onSelect={() => onSelectNode(node.id)} />
            {next ? <FlowEdgeView edge={edge} /> : null}
          </div>;
        })}
      </div>
    </div>
  </section>;
}

function FlowNodeCard({ node, selected, onSelect }: { node: ProcessingFlowNode; selected: boolean; onSelect: () => void }) {
  return <button
    type="button"
    className={`flow-node${selected ? ' flow-node--selected' : ''}${node.evidence === 'NOT_OBSERVED' ? ' flow-node--unobserved' : ''}`}
    aria-label={`${flowStageLabel(node.stage)} stage, ${humanize(node.status)}`}
    aria-pressed={selected}
    onClick={onSelect}
  >
    <span className="flow-node__stage">{flowStageLabel(node.stage)}</span>
    <StatusBadge value={node.status} />
    <span className={`flow-evidence flow-evidence--${node.evidence.toLowerCase().replaceAll('_', '-')}`}>{humanize(node.evidence)}</span>
    <small>{node.occurredAt ? formatDateTime(node.occurredAt) : 'No observed timestamp'}</small>
  </button>;
}

function FlowEdgeView({ edge }: { edge: ProcessingFlowEdge | null }) {
  return <div className={`flow-edge${edge ? '' : ' flow-edge--missing'}`} aria-label={edge ? `${humanize(edge.kind)}, ${formatFlowDuration(edge.durationMs)}` : 'Transition not reconstructed'}>
    <div className="flow-edge__line"><span>→</span></div>
    <div className="flow-edge__meta">
      <strong>{edge ? humanize(edge.kind) : 'Gap'}</strong>
      <span>{edge ? formatFlowDuration(edge.durationMs) : 'edge unavailable'}</span>
    </div>
  </div>;
}

function FlowNodeDetail({ flow, node }: { flow: ProcessingFlow; node: ProcessingFlowNode }) {
  const { principal } = useAuthSession();
  const canViewResults = hasRole(principal, 'VIEWER');
  const itemId = flowNodeItemId(node);
  const eventItemId = node.rawItemId ?? node.normalizedItemId;
  const eventLink = node.eventId
    ? buildEventLink(flow.collectionRunId, eventItemId, node.eventId)
    : null;
  const resultLink = node.monitoringProfileId && node.normalizedItemId
    ? buildResultLink(node.monitoringProfileId, node.sourceId, node.normalizedItemId)
    : null;
  const itemFlowLink = flow.scope === 'COLLECTION_RUN' && itemId
    ? `/flows?collectionRunId=${encodeURIComponent(flow.collectionRunId)}&itemId=${encodeURIComponent(itemId)}`
    : null;

  return <div className="detail-stack">
    <div className="detail-actions flow-detail-actions">
      {eventLink ? <Link className="button button--ghost" to={eventLink}>Open observed event</Link> : null}
      {resultLink && canViewResults ? <Link className="button button--ghost" to={resultLink}>Open related Result</Link> : null}
      {itemFlowLink ? <Link className="button button--ghost" to={itemFlowLink}>Inspect item branch</Link> : null}
    </div>
    <dl className="detail-list">
      <Detail label="Stage" value={flowStageLabel(node.stage)} />
      <Detail label="Status" value={<StatusBadge value={node.status} />} />
      <Detail label="Evidence" value={humanize(node.evidence)} />
      <Detail label="Occurred" value={node.occurredAt ? formatDateTime(node.occurredAt) : '—'} />
      <Detail label="Outcome" value={node.outcome ?? '—'} />
      <Detail label="Score" value={node.score === null ? '—' : String(node.score)} />
      <Detail label="Event type" value={node.eventType ?? '—'} />
      <Detail label="Producer" value={node.producer ?? '—'} />
      <Detail label="Event ID" value={node.eventId ?? '—'} mono />
      <Detail label="Source event" value={node.sourceEventId ?? '—'} mono />
      <Detail label="Raw item" value={node.rawItemId ?? '—'} mono />
      <Detail label="Normalized item" value={node.normalizedItemId ?? '—'} mono />
      <Detail label="Profile" value={node.monitoringProfileId ?? '—'} mono />
      <Detail label="Source" value={node.sourceId ?? '—'} mono />
      <Detail label="Traceparent" value={node.traceparent ?? '—'} mono />
      <Detail label="Kafka" value={node.kafka ? `${node.kafka.topic} / ${node.kafka.partition} / ${node.kafka.offset}` : '—'} mono />
      <Detail label="Kafka key" value={node.kafka?.key ?? '—'} mono />
    </dl>
  </div>;
}

function Detail({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return <div><dt>{label}</dt><dd className={mono ? 'mono break-all' : undefined}>{value}</dd></div>;
}

function SummaryCard({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="stat-card flow-summary-card"><span>{label}</span><div className="flow-summary-card__value">{value}</div></div>;
}

function buildEventLink(collectionRunId: string, itemId: string | null, eventId: string): string {
  const search = new URLSearchParams({ collectionRunId, eventId });
  if (itemId) {
    search.set('itemId', itemId);
  }
  return `/events?${search}`;
}

function buildResultLink(monitoringProfileId: string, sourceId: string | null, normalizedItemId: string): string {
  const search = new URLSearchParams({ monitoringProfileId, normalizedItemId });
  if (sourceId) {
    search.set('sourceId', sourceId);
  }
  return `/results?${search}`;
}

function humanize(value: string): string {
  return value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^./, (character) => character.toUpperCase())
    .replace(/\bkafka\b/g, 'Kafka');
}
