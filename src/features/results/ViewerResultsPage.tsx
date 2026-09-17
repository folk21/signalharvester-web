import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api, type ResultFilters } from '../../api/client';
import type { ResultDetail, ResultLiveEvent, ResultSummary } from '../../api/types';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import { LiveConnectionStatus } from '../../components/LiveConnectionStatus';
import { PageHeader } from '../../components/PageHeader';
import { formatDateTime } from '../../lib/format';
import { useLiveList } from '../../lib/use-live-list';

const emptyFilters: ViewerResultFilterForm = {
  informationCategory: '',
  analyzedFrom: '',
  analyzedTo: '',
};

interface ViewerResultFilterForm {
  informationCategory: string;
  analyzedFrom: string;
  analyzedTo: string;
}

export function ViewerResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialForm = useMemo(() => viewerResultFormFromSearch(searchParams), []);
  const [form, setForm] = useState<ViewerResultFilterForm>(initialForm);
  const [filters, setFilters] = useState<ResultFilters>(() => toViewerResultFilters(initialForm));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const liveOptions = useMemo(() => ({
    queryKey: ['viewer-results', filters] as const,
    fetchSnapshot: () => api.listResults(filters),
    streamUrl: api.resultStreamUrl(filters),
    eventName: 'result',
    decode: (data: string) => JSON.parse(data) as ResultLiveEvent,
    itemFromEnvelope: (envelope: ResultLiveEvent) =>
      envelope.result && matchesViewerResultFilters(envelope.result, filters) ? envelope.result : null,
    keyOf: resultKey,
    limit: filters.limit ?? 50,
  }), [filters]);
  const liveResults = useLiveList(liveOptions);
  const results = liveResults.data;

  const selectedSummary = useMemo(
    () => results.find((result) => resultKey(result) === selectedKey) ?? null,
    [results, selectedKey],
  );
  const detailQuery = useQuery({
    queryKey: ['viewer-result', selectedSummary?.monitoringProfileId, selectedSummary?.normalizedItemId],
    queryFn: () => api.getResult(selectedSummary!.monitoringProfileId, selectedSummary!.normalizedItemId),
    enabled: selectedSummary !== null,
  });

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = toViewerResultFilters(form);
    setSelectedKey(null);
    setFilters(next);
    setSearchParams(viewerResultSearchParams(form));
  }

  return (
    <div className="page-stack viewer-results-page">
      <PageHeader
        eyebrow="Viewer"
        title="Results feed"
        description="Browse relevant analyzed results without operational pipeline or infrastructure diagnostics. New matching results appear live."
      />

      <section className="panel filter-panel">
        <form aria-label="Viewer result filters" className="filter-form viewer-results-filter" onSubmit={applyFilters}>
          <label>
            <span>Information category</span>
            <input
              value={form.informationCategory}
              onChange={(event) => setForm({ ...form, informationCategory: event.target.value })}
              placeholder="optional"
            />
          </label>
          <label>
            <span>Analyzed from</span>
            <input
              type="datetime-local"
              value={form.analyzedFrom}
              onChange={(event) => setForm({ ...form, analyzedFrom: event.target.value })}
            />
          </label>
          <label>
            <span>Analyzed to</span>
            <input
              type="datetime-local"
              value={form.analyzedTo}
              onChange={(event) => setForm({ ...form, analyzedTo: event.target.value })}
            />
          </label>
          <div className="filter-actions">
            <button className="button button--primary" type="submit">Apply filters</button>
            <button
              className="button button--ghost"
              type="button"
              onClick={() => {
                setForm(emptyFilters);
                setFilters({ limit: 50, relevant: true });
                setSelectedKey(null);
                setSearchParams({});
              }}
            >
              Clear
            </button>
          </div>
        </form>
      </section>

      {liveResults.error ? (
        <ErrorState
          error={liveResults.error}
          action={<button className="button button--ghost" onClick={() => void liveResults.refresh()}>Retry results</button>}
        />
      ) : null}

      <section className="viewer-results-workspace">
        <article className="panel viewer-results-list-panel">
          <div className="panel__header">
            <div>
              <h2>Relevant results</h2>
              <span>{results.length} loaded</span>
            </div>
            <div className="panel-actions">
              <LiveConnectionStatus status={liveResults.connectionStatus} />
              <button className="button button--ghost" type="button" onClick={() => void liveResults.refresh()}>Refresh</button>
            </div>
          </div>
          {!liveResults.hasSnapshot && liveResults.syncing ? (
            <LoadingState label="Loading relevant results…" />
          ) : results.length === 0 ? (
            <EmptyState>No relevant results match the current filters.</EmptyState>
          ) : (
            <ul className="viewer-result-list" aria-label="Relevant results">
              {results.map((result) => {
                const key = resultKey(result);
                const title = displayTitle(result);
                return (
                  <li key={key}>
                    <button
                      className={selectedKey === key ? 'viewer-result-card viewer-result-card--selected' : 'viewer-result-card'}
                      type="button"
                      onClick={() => setSelectedKey(key)}
                      aria-label={`Open result ${title}`}
                    >
                      <span className="viewer-result-card__header">
                        <strong>{title}</strong>
                        <span>{result.informationCategory}</span>
                      </span>
                      <span className="viewer-result-card__meta">
                        {result.tags.length > 0 ? result.tags.join(' · ') : 'No tags'}
                      </span>
                      <span className="viewer-result-card__date">Analyzed {formatDateTime(result.analyzedAt)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </article>

        <article className="panel viewer-result-detail-panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Result</span>
              <h2>{selectedSummary ? displayTitle(selectedSummary) : 'No selection'}</h2>
            </div>
          </div>
          {!selectedSummary ? (
            <EmptyState>Select a result to read its content.</EmptyState>
          ) : detailQuery.isPending ? (
            <LoadingState label="Loading result…" />
          ) : detailQuery.error ? (
            <ErrorState error={detailQuery.error} />
          ) : detailQuery.data ? (
            <ViewerResultDetail result={detailQuery.data} />
          ) : null}
        </article>
      </section>
    </div>
  );
}

function ViewerResultDetail({ result }: { result: ResultDetail }) {
  return (
    <div className="detail-stack viewer-result-detail">
      <div className="viewer-result-detail__meta">
        <span>{result.informationCategory}</span>
        <span>{result.publishedAt ? `Published ${formatDateTime(result.publishedAt)}` : 'Publication time unavailable'}</span>
        <span>Analyzed {formatDateTime(result.analyzedAt)}</span>
      </div>

      <div className="viewer-result-detail__actions">
        <a className="button button--primary" href={result.url} target="_blank" rel="noreferrer">Open original source</a>
      </div>

      <section className="result-section">
        <h3>Summary</h3>
        <p>{result.explanation || 'No summary is available.'}</p>
      </section>

      <section className="result-section">
        <h3>Tags</h3>
        <p className="result-tags">{result.tags.length > 0 ? result.tags.join(', ') : '—'}</p>
      </section>

      <section className="result-section">
        <h3>Details</h3>
        {Object.keys(result.attributes).length === 0 ? (
          <p>—</p>
        ) : (
          <dl className="attribute-list">
            {Object.entries(result.attributes).map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section className="result-section">
        <h3>Content</h3>
        <div className="viewer-result-content">{result.normalizedContent}</div>
      </section>
    </div>
  );
}

function displayTitle(result: ResultSummary | ResultDetail): string {
  return result.title?.trim() || 'Untitled result';
}

function resultKey(result: ResultSummary): string {
  return `${result.monitoringProfileId}:${result.normalizedItemId}`;
}

function toViewerResultFilters(form: ViewerResultFilterForm): ResultFilters {
  const filters: ResultFilters = { limit: 50, relevant: true };
  const informationCategory = form.informationCategory.trim();
  if (informationCategory) {
    filters.informationCategory = informationCategory;
  }
  if (form.analyzedFrom) {
    filters.analyzedFrom = new Date(form.analyzedFrom).toISOString();
  }
  if (form.analyzedTo) {
    filters.analyzedTo = new Date(form.analyzedTo).toISOString();
  }
  return filters;
}

function matchesViewerResultFilters(result: ResultSummary, filters: ResultFilters): boolean {
  if (!result.relevant) {
    return false;
  }
  if (filters.informationCategory && result.informationCategory !== filters.informationCategory) {
    return false;
  }
  if (filters.analyzedFrom && result.analyzedAt < filters.analyzedFrom) {
    return false;
  }
  if (filters.analyzedTo && result.analyzedAt > filters.analyzedTo) {
    return false;
  }
  return true;
}

function viewerResultFormFromSearch(search: URLSearchParams): ViewerResultFilterForm {
  return {
    ...emptyFilters,
    informationCategory: search.get('informationCategory') ?? '',
    analyzedFrom: search.get('analyzedFrom') ?? '',
    analyzedTo: search.get('analyzedTo') ?? '',
  };
}

function viewerResultSearchParams(form: ViewerResultFilterForm): URLSearchParams {
  const search = new URLSearchParams();
  if (form.informationCategory.trim()) {
    search.set('informationCategory', form.informationCategory.trim());
  }
  if (form.analyzedFrom) {
    search.set('analyzedFrom', form.analyzedFrom);
  }
  if (form.analyzedTo) {
    search.set('analyzedTo', form.analyzedTo);
  }
  return search;
}
