import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type ResultFilters } from '../../api/client';
import type { ResultDetail, ResultSummary } from '../../api/types';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDateTime, shortId } from '../../lib/format';

const emptyFilters: ResultFilterForm = {
  monitoringProfileId: '',
  sourceId: '',
  informationCategory: '',
  relevance: '',
  classification: '',
  analyzedFrom: '',
  analyzedTo: '',
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
  const [form, setForm] = useState<ResultFilterForm>(emptyFilters);
  const [filters, setFilters] = useState<ResultFilters>({ limit: 50 });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const resultsQuery = useQuery({
    queryKey: ['results', filters],
    queryFn: () => api.listResults(filters),
  });
  const results = resultsQuery.data ?? [];
  const selectedSummary = useMemo(
    () => results.find((result) => resultKey(result) === selectedKey) ?? null,
    [results, selectedKey],
  );
  const detailQuery = useQuery({
    queryKey: [
      'result',
      selectedSummary?.monitoringProfileId,
      selectedSummary?.normalizedItemId,
    ],
    queryFn: () =>
      api.getResult(
        selectedSummary!.monitoringProfileId,
        selectedSummary!.normalizedItemId,
      ),
    enabled: selectedSummary !== null,
  });

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSelectedKey(null);
    setFilters(toResultFilters(form));
  }

  if (resultsQuery.isPending) {
    return <LoadingState label="Loading analyzed results…" />;
  }
  if (resultsQuery.error) {
    return <ErrorState error={resultsQuery.error} />;
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Results"
        title="Analyzed Results"
        description="Browse durable analyzed results, filter by profile and analysis metadata, and inspect normalized content and provenance."
      />

      <section className="panel filter-panel">
        <form className="filter-form filter-form--results" onSubmit={applyFilters}>
          <label>
            <span>Monitoring profile ID</span>
            <input
              value={form.monitoringProfileId}
              onChange={(event) => setForm({ ...form, monitoringProfileId: event.target.value })}
              placeholder="optional"
            />
          </label>
          <label>
            <span>Source ID</span>
            <input
              value={form.sourceId}
              onChange={(event) => setForm({ ...form, sourceId: event.target.value })}
              placeholder="optional"
            />
          </label>
          <label>
            <span>Information category</span>
            <input
              value={form.informationCategory}
              onChange={(event) => setForm({ ...form, informationCategory: event.target.value })}
              placeholder="optional"
            />
          </label>
          <label>
            <span>Relevant</span>
            <select
              value={form.relevance}
              onChange={(event) =>
                setForm({ ...form, relevance: event.target.value as ResultFilterForm['relevance'] })
              }
            >
              <option value="">Any</option>
              <option value="true">Relevant</option>
              <option value="false">Not relevant</option>
            </select>
          </label>
          <label>
            <span>Classification</span>
            <input
              value={form.classification}
              onChange={(event) => setForm({ ...form, classification: event.target.value })}
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
                setFilters({ limit: 50 });
                setSelectedKey(null);
              }}
            >
              Clear
            </button>
          </div>
        </form>
      </section>

      <section className="workspace-grid workspace-grid--results">
        <article className="panel table-panel">
          <div className="panel__header">
            <div>
              <h2>Results</h2>
              <span>{results.length} loaded</span>
            </div>
            <button className="button button--ghost" onClick={() => void resultsQuery.refetch()} type="button">
              Refresh
            </button>
          </div>
          {results.length === 0 ? (
            <EmptyState>No analyzed results match the current filters.</EmptyState>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Result</th>
                    <th>Category</th>
                    <th>Classification</th>
                    <th>Score</th>
                    <th>Relevant</th>
                    <th>Analyzed</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr
                      key={resultKey(result)}
                      className={selectedKey === resultKey(result) ? 'table-row--selected' : ''}
                      onClick={() => setSelectedKey(resultKey(result))}
                    >
                      <td>
                        <strong>{result.title?.trim() || shortId(result.normalizedItemId, 18)}</strong>
                        <small>{shortId(result.normalizedItemId, 18)}</small>
                      </td>
                      <td>{result.informationCategory}</td>
                      <td><StatusBadge value={result.classification} /></td>
                      <td>{result.score}</td>
                      <td>{result.relevant ? 'Yes' : 'No'}</td>
                      <td>{formatDateTime(result.analyzedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="panel detail-panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Result detail</span>
              <h2>{selectedSummary ? selectedSummary.title?.trim() || shortId(selectedSummary.normalizedItemId, 16) : 'No selection'}</h2>
            </div>
          </div>
          {!selectedSummary ? (
            <EmptyState>Select a result to inspect its content and provenance.</EmptyState>
          ) : detailQuery.isPending ? (
            <LoadingState label="Loading result detail…" />
          ) : detailQuery.error ? (
            <ErrorState error={detailQuery.error} />
          ) : detailQuery.data ? (
            <ResultDetailView result={detailQuery.data} />
          ) : null}
        </article>
      </section>
    </div>
  );
}

function ResultDetailView({ result }: { result: ResultDetail }) {
  return (
    <div className="detail-stack">
      <dl className="detail-list">
        <div><dt>Profile</dt><dd>{result.monitoringProfileId}</dd></div>
        <div><dt>Normalized item</dt><dd className="mono break-all">{result.normalizedItemId}</dd></div>
        <div><dt>Source</dt><dd className="mono break-all">{result.sourceId}</dd></div>
        <div><dt>Category</dt><dd>{result.informationCategory}</dd></div>
        <div><dt>Classification</dt><dd><StatusBadge value={result.classification} /></dd></div>
        <div><dt>Relevant</dt><dd>{result.relevant ? 'Yes' : 'No'}</dd></div>
        <div><dt>Score</dt><dd>{result.score}</dd></div>
        <div><dt>Analyzer</dt><dd>{result.analyzer}</dd></div>
        <div><dt>External ID</dt><dd>{result.externalId ?? '—'}</dd></div>
        <div><dt>URL</dt><dd><a href={result.url} target="_blank" rel="noreferrer">{result.url}</a></dd></div>
        <div><dt>Published</dt><dd>{result.publishedAt ? formatDateTime(result.publishedAt) : '—'}</dd></div>
        <div><dt>Analyzed</dt><dd>{formatDateTime(result.analyzedAt)}</dd></div>
        <div><dt>Content type</dt><dd>{result.contentType}</dd></div>
        <div><dt>Tags</dt><dd>{result.tags.length > 0 ? result.tags.join(', ') : '—'}</dd></div>
        <div><dt>Analysis event</dt><dd className="mono break-all">{result.analysisEventId}</dd></div>
        <div><dt>Source event</dt><dd className="mono break-all">{result.sourceEventId}</dd></div>
        <div><dt>Raw item</dt><dd className="mono break-all">{result.rawItemId}</dd></div>
        <div><dt>Correlation ID</dt><dd className="mono break-all">{result.correlationId}</dd></div>
        <div><dt>Traceparent</dt><dd className="mono break-all">{result.traceparent ?? '—'}</dd></div>
      </dl>

      <section className="result-section">
        <h3>Explanation</h3>
        <p>{result.explanation || '—'}</p>
      </section>

      <section className="result-section">
        <h3>Attributes</h3>
        {Object.keys(result.attributes).length === 0 ? (
          <p>—</p>
        ) : (
          <dl className="attribute-list">
            {Object.entries(result.attributes).map(([key, value]) => (
              <div key={key}><dt>{key}</dt><dd>{value}</dd></div>
            ))}
          </dl>
        )}
      </section>

      <section className="result-section">
        <h3>Normalized content</h3>
        <pre className="content-preview">{result.normalizedContent}</pre>
      </section>
    </div>
  );
}

function resultKey(result: ResultSummary): string {
  return `${result.monitoringProfileId}:${result.normalizedItemId}`;
}

function toResultFilters(form: ResultFilterForm): ResultFilters {
  const filters: ResultFilters = { limit: 50 };
  assignTrimmed(filters, 'monitoringProfileId', form.monitoringProfileId);
  assignTrimmed(filters, 'sourceId', form.sourceId);
  assignTrimmed(filters, 'informationCategory', form.informationCategory);
  assignTrimmed(filters, 'classification', form.classification);
  if (form.relevance) {
    filters.relevant = form.relevance === 'true';
  }
  if (form.analyzedFrom) {
    filters.analyzedFrom = new Date(form.analyzedFrom).toISOString();
  }
  if (form.analyzedTo) {
    filters.analyzedTo = new Date(form.analyzedTo).toISOString();
  }
  return filters;
}

function assignTrimmed<K extends keyof ResultFilters>(
  target: ResultFilters,
  key: K,
  value: string,
) {
  const trimmed = value.trim();
  if (trimmed) {
    target[key] = trimmed as ResultFilters[K];
  }
}
