import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, type ResultFilters } from '../../api/client';
import type { ResultDetail, ResultLiveEvent, ResultSummary } from '../../api/types';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import { LiveConnectionStatus } from '../../components/LiveConnectionStatus';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDateTime, shortId } from '../../lib/format';
import { useLiveList } from '../../lib/use-live-list';

const emptyFilters: ResultFilterForm = {
  monitoringProfileId: '', sourceId: '', informationCategory: '', relevance: '', classification: '', analyzedFrom: '', analyzedTo: '',
};

interface ResultFilterForm {
  monitoringProfileId: string;
  sourceId: string;
  informationCategory: string;
  relevance: '' | 'true' | 'false';
  classification: string;
  analyzedFrom: string;
  analyzedTo: string;
}

export function ResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialForm = useMemo(() => resultFormFromSearch(searchParams), []);
  const [form, setForm] = useState<ResultFilterForm>(initialForm);
  const [filters, setFilters] = useState<ResultFilters>(() => toResultFilters(initialForm));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const liveOptions = useMemo(() => ({
    queryKey: ['results', filters] as const,
    fetchSnapshot: () => api.listResults(filters),
    streamUrl: api.resultStreamUrl(filters),
    eventName: 'result',
    decode: (data: string) => JSON.parse(data) as ResultLiveEvent,
    itemFromEnvelope: (envelope: ResultLiveEvent) =>
      envelope.result && matchesResultFilters(envelope.result, filters) ? envelope.result : null,
    keyOf: resultKey,
    limit: filters.limit ?? 50,
  }), [filters]);
  const liveResults = useLiveList(liveOptions);
  const results = liveResults.data;
  const deepLinkedNormalizedItemId = searchParams.get('normalizedItemId');
  const deepLinkedProfileId = searchParams.get('monitoringProfileId');

  useEffect(() => {
    if (!deepLinkedNormalizedItemId) {
      return;
    }
    const target = results.find((result) =>
      result.normalizedItemId === deepLinkedNormalizedItemId
      && (!deepLinkedProfileId || result.monitoringProfileId === deepLinkedProfileId));
    if (target) {
      setSelectedKey(resultKey(target));
    }
  }, [deepLinkedNormalizedItemId, deepLinkedProfileId, results]);

  const selectedSummary = useMemo(
    () => results.find((result) => resultKey(result) === selectedKey) ?? null,
    [results, selectedKey],
  );
  const detailQuery = useQuery({
    queryKey: ['result', selectedSummary?.monitoringProfileId, selectedSummary?.normalizedItemId],
    queryFn: () => api.getResult(selectedSummary!.monitoringProfileId, selectedSummary!.normalizedItemId),
    enabled: selectedSummary !== null,
  });

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = toResultFilters(form);
    setSelectedKey(null);
    setFilters(next);
    setSearchParams(resultSearchParams(form));
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Results"
        title="Analyzed Results"
        description="Browse durable analyzed results and receive matching result updates live from the backend SSE stream."
      />

      <section className="panel filter-panel">
        <form aria-label="Result filters" className="filter-form filter-form--results" onSubmit={applyFilters}>
          <TextFilter label="Monitoring profile ID" value={form.monitoringProfileId} onChange={(value) => setForm({ ...form, monitoringProfileId: value })} />
          <TextFilter label="Source ID" value={form.sourceId} onChange={(value) => setForm({ ...form, sourceId: value })} />
          <TextFilter label="Information category" value={form.informationCategory} onChange={(value) => setForm({ ...form, informationCategory: value })} />
          <label><span>Relevant</span><select value={form.relevance} onChange={(event) => setForm({ ...form, relevance: event.target.value as ResultFilterForm['relevance'] })}><option value="">Any</option><option value="true">Relevant</option><option value="false">Not relevant</option></select></label>
          <TextFilter label="Classification" value={form.classification} onChange={(value) => setForm({ ...form, classification: value })} />
          <label><span>Analyzed from</span><input type="datetime-local" value={form.analyzedFrom} onChange={(event) => setForm({ ...form, analyzedFrom: event.target.value })} /></label>
          <label><span>Analyzed to</span><input type="datetime-local" value={form.analyzedTo} onChange={(event) => setForm({ ...form, analyzedTo: event.target.value })} /></label>
          <div className="filter-actions">
            <button className="button button--primary" type="submit">Apply filters</button>
            <button className="button button--ghost" type="button" onClick={() => { setForm(emptyFilters); setFilters({ limit: 50 }); setSelectedKey(null); setSearchParams({}); }}>Clear</button>
          </div>
        </form>
      </section>

      {liveResults.error ? <ErrorState error={liveResults.error} action={<button className="button button--ghost" onClick={() => void liveResults.refresh()}>Retry snapshot</button>} /> : null}

      <section className="workspace-grid workspace-grid--results">
        <article className="panel table-panel">
          <div className="panel__header">
            <div><h2>Results</h2><span>{results.length} loaded</span></div>
            <div className="panel-actions"><LiveConnectionStatus status={liveResults.connectionStatus} /><button className="button button--ghost" onClick={() => void liveResults.refresh()} type="button">Refresh</button></div>
          </div>
          {!liveResults.hasSnapshot && liveResults.syncing ? <LoadingState label="Loading analyzed results…" /> : results.length === 0 ? (
            <EmptyState>No analyzed results match the current filters.</EmptyState>
          ) : (
            <div className="table-wrap"><table aria-label="Analyzed results"><thead><tr><th>Result</th><th>Category</th><th>Classification</th><th>Score</th><th>Relevant</th><th>Analyzed</th></tr></thead><tbody>{results.map((result) => (
              <tr key={resultKey(result)} className={selectedKey === resultKey(result) ? 'table-row--selected' : ''} onClick={() => setSelectedKey(resultKey(result))}>
                <td><button className="table-row-select" type="button" onClick={() => setSelectedKey(resultKey(result))} aria-label={`Inspect result ${result.title?.trim() || result.normalizedItemId}`}><strong>{result.title?.trim() || shortId(result.normalizedItemId, 18)}</strong><small>{shortId(result.normalizedItemId, 18)}</small></button></td><td>{result.informationCategory}</td><td><StatusBadge value={result.classification} /></td><td>{result.score}</td><td>{result.relevant ? 'Yes' : 'No'}</td><td>{formatDateTime(result.analyzedAt)}</td>
              </tr>
            ))}</tbody></table></div>
          )}
        </article>

        <article className="panel detail-panel">
          <div className="panel__header"><div><span className="eyebrow">Result detail</span><h2>{selectedSummary ? selectedSummary.title?.trim() || shortId(selectedSummary.normalizedItemId, 16) : 'No selection'}</h2></div></div>
          {!selectedSummary ? <EmptyState>Select a result to inspect its content and provenance.</EmptyState> : detailQuery.isPending ? <LoadingState label="Loading result detail…" /> : detailQuery.error ? <ErrorState error={detailQuery.error} /> : detailQuery.data ? <ResultDetailView result={detailQuery.data} /> : null}
        </article>
      </section>
    </div>
  );
}

function TextFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder="optional" /></label>;
}

function ResultDetailView({ result }: { result: ResultDetail }) {
  const eventLink = `/events?collectionRunId=${encodeURIComponent(result.correlationId)}&itemId=${encodeURIComponent(result.normalizedItemId)}`;
  const flowLink = `/flows?collectionRunId=${encodeURIComponent(result.correlationId)}&itemId=${encodeURIComponent(result.normalizedItemId)}`;
  return <div className="detail-stack">
    <div className="detail-actions">
      <Link className="button button--ghost" to={flowLink}>Open processing flow</Link>
      <Link className="button button--ghost" to={eventLink}>Explore related events</Link>
    </div>
    <dl className="detail-list">
      <div><dt>Profile</dt><dd>{result.monitoringProfileId}</dd></div><div><dt>Normalized item</dt><dd className="mono break-all">{result.normalizedItemId}</dd></div><div><dt>Source</dt><dd className="mono break-all">{result.sourceId}</dd></div><div><dt>Category</dt><dd>{result.informationCategory}</dd></div><div><dt>Classification</dt><dd><StatusBadge value={result.classification} /></dd></div><div><dt>Relevant</dt><dd>{result.relevant ? 'Yes' : 'No'}</dd></div><div><dt>Score</dt><dd>{result.score}</dd></div><div><dt>Analyzer</dt><dd>{result.analyzer}</dd></div><div><dt>External ID</dt><dd>{result.externalId ?? '—'}</dd></div><div><dt>URL</dt><dd><a href={result.url} target="_blank" rel="noreferrer">{result.url}</a></dd></div><div><dt>Published</dt><dd>{result.publishedAt ? formatDateTime(result.publishedAt) : '—'}</dd></div><div><dt>Analyzed</dt><dd>{formatDateTime(result.analyzedAt)}</dd></div><div><dt>Content type</dt><dd>{result.contentType}</dd></div><div><dt>Tags</dt><dd className="result-tags">{result.tags.length > 0 ? result.tags.join(', ') : '—'}</dd></div><div><dt>Analysis event</dt><dd className="mono break-all">{result.analysisEventId}</dd></div><div><dt>Source event</dt><dd className="mono break-all">{result.sourceEventId}</dd></div><div><dt>Raw item</dt><dd className="mono break-all">{result.rawItemId}</dd></div><div><dt>Correlation ID</dt><dd className="mono break-all">{result.correlationId}</dd></div><div><dt>Traceparent</dt><dd className="mono break-all">{result.traceparent ?? '—'}</dd></div>
    </dl>
    <section className="result-section"><h3>Explanation</h3><p>{result.explanation || '—'}</p></section>
    <section className="result-section"><h3>Attributes</h3>{Object.keys(result.attributes).length === 0 ? <p>—</p> : <dl className="attribute-list">{Object.entries(result.attributes).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>}</section>
    <section className="result-section"><h3>Normalized content</h3><pre className="content-preview">{result.normalizedContent}</pre></section>
  </div>;
}

function resultKey(result: ResultSummary): string { return `${result.monitoringProfileId}:${result.normalizedItemId}`; }

function toResultFilters(form: ResultFilterForm): ResultFilters {
  const filters: ResultFilters = { limit: 50 };
  assignTrimmed(filters, 'monitoringProfileId', form.monitoringProfileId); assignTrimmed(filters, 'sourceId', form.sourceId); assignTrimmed(filters, 'informationCategory', form.informationCategory); assignTrimmed(filters, 'classification', form.classification);
  if (form.relevance) filters.relevant = form.relevance === 'true';
  if (form.analyzedFrom) filters.analyzedFrom = new Date(form.analyzedFrom).toISOString();
  if (form.analyzedTo) filters.analyzedTo = new Date(form.analyzedTo).toISOString();
  return filters;
}

function matchesResultFilters(result: ResultSummary, filters: ResultFilters): boolean {
  if (filters.analyzedFrom && result.analyzedAt < filters.analyzedFrom) return false;
  if (filters.analyzedTo && result.analyzedAt > filters.analyzedTo) return false;
  return true;
}

function assignTrimmed<K extends keyof ResultFilters>(target: ResultFilters, key: K, value: string) { const trimmed = value.trim(); if (trimmed) target[key] = trimmed as ResultFilters[K]; }

function resultFormFromSearch(search: URLSearchParams): ResultFilterForm {
  return { ...emptyFilters, monitoringProfileId: search.get('monitoringProfileId') ?? '', sourceId: search.get('sourceId') ?? '', informationCategory: search.get('informationCategory') ?? '', relevance: search.get('relevant') === 'true' || search.get('relevant') === 'false' ? search.get('relevant') as 'true' | 'false' : '', classification: search.get('classification') ?? '' };
}

function resultSearchParams(form: ResultFilterForm): URLSearchParams {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(form)) if (value) search.set(key, value);
  return search;
}
