import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, type EventFilters } from '../../api/client';
import type { ObservedEvent, ObservedEventLiveEvent } from '../../api/types';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import { LiveConnectionStatus } from '../../components/LiveConnectionStatus';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDateTime, shortId } from '../../lib/format';
import { useLiveList } from '../../lib/use-live-list';

interface EventFilterForm {
  eventType: string;
  producer: string;
  topic: string;
  correlationId: string;
  collectionRunId: string;
  itemId: string;
  traceId: string;
}

const emptyForm: EventFilterForm = {
  eventType: '', producer: '', topic: '', correlationId: '', collectionRunId: '', itemId: '', traceId: '',
};

export function EventExplorerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialForm = useMemo(() => formFromSearch(searchParams), []);
  const [form, setForm] = useState<EventFilterForm>(initialForm);
  const [filters, setFilters] = useState<EventFilters>(() => toFilters(initialForm));
  const eventIdParam = searchParams.get('eventId');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(eventIdParam);

  useEffect(() => {
    if (eventIdParam) {
      setSelectedEventId(eventIdParam);
    }
  }, [eventIdParam]);

  const liveOptions = useMemo(() => ({
    queryKey: ['observed-events', filters] as const,
    fetchSnapshot: () => api.listObservedEvents(filters),
    streamUrl: api.eventStreamUrl(filters),
    eventName: 'event',
    decode: (data: string) => JSON.parse(data) as ObservedEventLiveEvent,
    itemFromEnvelope: (envelope: ObservedEventLiveEvent) => envelope.event,
    keyOf: (event: ObservedEvent) => event.eventId,
    limit: filters.limit ?? 100,
  }), [filters]);
  const liveEvents = useLiveList(liveOptions);
  const events = liveEvents.data;
  const selected = events.find((event) => event.eventId === selectedEventId) ?? null;

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSelectedEventId(null);
    setFilters(toFilters(form));
    setSearchParams(toSearchParams(form));
  }

  return <div className="page-stack">
    <PageHeader eyebrow="Diagnostics" title="Event Explorer" description="Inspect bounded technical pipeline history and follow new backend-observed events live without connecting the browser to Kafka." />

    <section className="panel filter-panel">
      <form className="filter-form filter-form--events" onSubmit={applyFilters}>
        <TextFilter label="Event type" value={form.eventType} onChange={(value) => setForm({ ...form, eventType: value })} />
        <TextFilter label="Producer" value={form.producer} onChange={(value) => setForm({ ...form, producer: value })} />
        <TextFilter label="Kafka topic" value={form.topic} onChange={(value) => setForm({ ...form, topic: value })} />
        <TextFilter label="Collection run ID" value={form.collectionRunId} onChange={(value) => setForm({ ...form, collectionRunId: value })} />
        <TextFilter label="Correlation ID" value={form.correlationId} onChange={(value) => setForm({ ...form, correlationId: value })} />
        <TextFilter label="Item ID" value={form.itemId} onChange={(value) => setForm({ ...form, itemId: value })} />
        <TextFilter label="Trace ID" value={form.traceId} onChange={(value) => setForm({ ...form, traceId: value })} />
        <div className="filter-actions"><button className="button button--primary" type="submit">Apply filters</button><button className="button button--ghost" type="button" onClick={() => { setForm(emptyForm); setFilters({ limit: 100 }); setSelectedEventId(null); setSearchParams({}); }}>Clear</button></div>
      </form>
    </section>

    {liveEvents.error ? <ErrorState error={liveEvents.error} action={<button className="button button--ghost" onClick={() => void liveEvents.refresh()}>Retry snapshot</button>} /> : null}

    <section className="workspace-grid workspace-grid--events">
      <article className="panel table-panel">
        <div className="panel__header"><div><h2>Observed events</h2><span>{events.length} retained rows loaded</span></div><div className="panel-actions"><LiveConnectionStatus status={liveEvents.connectionStatus} /><button className="button button--ghost" onClick={() => void liveEvents.refresh()} type="button">Refresh</button></div></div>
        {!liveEvents.hasSnapshot && liveEvents.syncing ? <LoadingState label="Loading technical event history…" /> : events.length === 0 ? <EmptyState>No retained events match the current filters.</EmptyState> : <div className="table-wrap"><table><thead><tr><th>Event</th><th>Producer</th><th>Topic</th><th>Correlation</th><th>Occurred</th></tr></thead><tbody>{events.map((event) => <tr key={event.eventId} className={selectedEventId === event.eventId ? 'table-row--selected' : ''} onClick={() => setSelectedEventId(event.eventId)}><td><button className="table-row-select" type="button" onClick={() => setSelectedEventId(event.eventId)} aria-label={`Inspect event ${event.eventType} ${event.eventId}`}><strong>{event.eventType}</strong><small>{shortId(event.eventId, 18)}</small></button></td><td>{event.producer}</td><td>{event.kafka.topic}</td><td className="mono">{shortId(event.correlationId, 18)}</td><td>{formatDateTime(event.occurredAt)}</td></tr>)}</tbody></table></div>}
      </article>

      <article className="panel detail-panel">
        <div className="panel__header"><div><span className="eyebrow">Event detail</span><h2>{selected ? selected.eventType : 'No selection'}</h2></div></div>
        {!selected ? <EmptyState>Select an observed event to inspect its technical metadata.</EmptyState> : <EventDetail event={selected} />}
      </article>
    </section>
  </div>;
}

function EventDetail({ event }: { event: ObservedEvent }) {
  const payload = event.payload;
  const resultLink = payload.monitoringProfileId && payload.normalizedItemId
    ? `/results?monitoringProfileId=${encodeURIComponent(payload.monitoringProfileId)}&sourceId=${encodeURIComponent(payload.sourceId ?? '')}&normalizedItemId=${encodeURIComponent(payload.normalizedItemId)}`
    : null;
  const flowItemId = payload.normalizedItemId ?? payload.rawItemId;
  const flowLink = flowItemId
    ? `/flows?collectionRunId=${encodeURIComponent(event.correlationId)}&itemId=${encodeURIComponent(flowItemId)}`
    : `/flows?collectionRunId=${encodeURIComponent(event.correlationId)}`;
  return <div className="detail-stack">
    <div className="detail-actions">
      <Link className="button button--ghost" to={flowLink}>Open processing flow</Link>
      {resultLink ? <Link className="button button--ghost" to={resultLink}>Open related Results</Link> : null}
    </div>
    <dl className="detail-list">
      <div><dt>Event ID</dt><dd className="mono break-all">{event.eventId}</dd></div><div><dt>Type</dt><dd><StatusBadge value={event.eventType} /></dd></div><div><dt>Producer</dt><dd>{event.producer}</dd></div><div><dt>Schema</dt><dd>{event.schemaVersion}</dd></div><div><dt>Occurred</dt><dd>{formatDateTime(event.occurredAt)}</dd></div><div><dt>Observed</dt><dd>{formatDateTime(event.observedAt)}</dd></div><div><dt>Correlation</dt><dd className="mono break-all">{event.correlationId}</dd></div><div><dt>Traceparent</dt><dd className="mono break-all">{event.traceparent ?? '—'}</dd></div><div><dt>Kafka</dt><dd className="mono break-all">{event.kafka.topic} / {event.kafka.partition} / {event.kafka.offset}</dd></div><div><dt>Kafka key</dt><dd className="mono break-all">{event.kafka.key}</dd></div><div><dt>Source event</dt><dd className="mono break-all">{payload.sourceEventId ?? '—'}</dd></div><div><dt>Raw item</dt><dd className="mono break-all">{payload.rawItemId ?? '—'}</dd></div><div><dt>Normalized item</dt><dd className="mono break-all">{payload.normalizedItemId ?? '—'}</dd></div><div><dt>Profile</dt><dd className="mono break-all">{payload.monitoringProfileId ?? '—'}</dd></div><div><dt>Source</dt><dd className="mono break-all">{payload.sourceId ?? '—'}</dd></div><div><dt>Classification</dt><dd>{payload.classification ?? '—'}</dd></div><div><dt>Reason</dt><dd>{payload.reasonCode ?? '—'}</dd></div>
    </dl>
    <section className="result-section"><h3>Payload summary</h3><pre className="content-preview">{JSON.stringify(payload, null, 2)}</pre></section>
  </div>;
}

function TextFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder="optional" /></label>; }

function formFromSearch(search: URLSearchParams): EventFilterForm { return { eventType: search.get('eventType') ?? '', producer: search.get('producer') ?? '', topic: search.get('topic') ?? '', correlationId: search.get('correlationId') ?? '', collectionRunId: search.get('collectionRunId') ?? '', itemId: search.get('itemId') ?? '', traceId: search.get('traceId') ?? '' }; }
function toFilters(form: EventFilterForm): EventFilters { const filters: EventFilters = { limit: 100 }; for (const [key, value] of Object.entries(form)) if (value.trim()) (filters as Record<string, unknown>)[key] = value.trim(); return filters; }
function toSearchParams(form: EventFilterForm): URLSearchParams { const search = new URLSearchParams(); for (const [key, value] of Object.entries(form)) if (value.trim()) search.set(key, value.trim()); return search; }
