import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { CollectionRun } from '../../api/types';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDateTime, formatDuration, shortId } from '../../lib/format';

export function CollectionRunsPage() {
  const queryClient = useQueryClient();
  const [monitoringProfileId, setMonitoringProfileId] = useState('manual-admin');
  const [informationCategory, setInformationCategory] = useState('JOB');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const runsQuery = useQuery({
    queryKey: ['collection-runs', 50],
    queryFn: () => api.listCollectionRuns(50),
  });

  const startMutation = useMutation({
    mutationFn: api.startCollectionRun,
    onSuccess: async (run) => {
      setSelectedRunId(run.collectionRunId);
      await queryClient.invalidateQueries({ queryKey: ['collection-runs'] });
      await queryClient.invalidateQueries({ queryKey: ['analysis-items'] });
    },
  });

  const runs = runsQuery.data ?? [];
  const selectedRun = useMemo(
    () => runs.find((run) => run.collectionRunId === selectedRunId) ?? runs[0] ?? null,
    [runs, selectedRunId],
  );

  function startRun(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const profile = monitoringProfileId.trim();
    const category = informationCategory.trim();
    if (!profile || !category) {
      return;
    }
    startMutation.mutate({ monitoringProfileId: profile, informationCategory: category });
  }

  if (runsQuery.isPending) {
    return <LoadingState label="Loading collection history…" />;
  }
  if (runsQuery.error) {
    return <ErrorState error={runsQuery.error} />;
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Operations"
        title="Collection Runs"
        description="Start a manual collection run and inspect the durable outcome recorded for each source."
      />

      <section className="panel run-launcher">
        <div>
          <span className="eyebrow">Manual execution</span>
          <h2>Run enabled sources</h2>
          <p>
            The current backend accepts profile and category context explicitly. Monitoring profiles are not yet a persisted configuration model.
          </p>
        </div>
        <form className="run-launcher__form" onSubmit={startRun}>
          <label>
            <span>Monitoring profile ID</span>
            <input value={monitoringProfileId} onChange={(event) => setMonitoringProfileId(event.target.value)} />
          </label>
          <label>
            <span>Information category</span>
            <input value={informationCategory} onChange={(event) => setInformationCategory(event.target.value)} />
          </label>
          <button className="button button--primary" disabled={startMutation.isPending} type="submit">
            {startMutation.isPending ? 'Running…' : 'Start collection run'}
          </button>
        </form>
        {startMutation.error ? <div className="inline-error">{startMutation.error.message}</div> : null}
      </section>

      <section className="workspace-grid">
        <article className="panel table-panel">
          <div className="panel__header">
            <div>
              <h2>Run history</h2>
              <span>{runs.length} loaded</span>
            </div>
            <button className="button button--ghost" onClick={() => void runsQuery.refetch()} type="button">
              Refresh
            </button>
          </div>
          {runs.length === 0 ? (
            <EmptyState>No completed collection runs have been persisted yet.</EmptyState>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Run</th>
                    <th>Context</th>
                    <th>Finished</th>
                    <th>Published / failed</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr
                      key={run.collectionRunId}
                      className={selectedRun?.collectionRunId === run.collectionRunId ? 'table-row--selected' : ''}
                      onClick={() => setSelectedRunId(run.collectionRunId)}
                    >
                      <td>
                        <strong className="mono">{shortId(run.collectionRunId, 12)}</strong>
                        <small>{formatDuration(run.startedAt, run.finishedAt)}</small>
                      </td>
                      <td>
                        <strong>{run.monitoringProfileId}</strong>
                        <small>{run.informationCategory}</small>
                      </td>
                      <td>{formatDateTime(run.finishedAt)}</td>
                      <td>
                        {run.publishedCount} / {run.failedCount}
                      </td>
                      <td>
                        <StatusBadge value={run.status} />
                      </td>
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
              <span className="eyebrow">Run detail</span>
              <h2>{selectedRun ? shortId(selectedRun.collectionRunId, 16) : 'No selection'}</h2>
            </div>
          </div>
          {selectedRun ? <RunDetail run={selectedRun} /> : <EmptyState>Select a run to inspect it.</EmptyState>}
        </article>
      </section>
    </div>
  );
}

function RunDetail({ run }: { run: CollectionRun }) {
  return (
    <div className="detail-stack">
      <dl className="detail-list">
        <div><dt>Status</dt><dd><StatusBadge value={run.status} /></dd></div>
        <div><dt>Profile</dt><dd>{run.monitoringProfileId}</dd></div>
        <div><dt>Category</dt><dd>{run.informationCategory}</dd></div>
        <div><dt>Started</dt><dd>{formatDateTime(run.startedAt)}</dd></div>
        <div><dt>Finished</dt><dd>{formatDateTime(run.finishedAt)}</dd></div>
        <div><dt>Duration</dt><dd>{formatDuration(run.startedAt, run.finishedAt)}</dd></div>
        <div><dt>Run ID</dt><dd className="mono break-all">{run.collectionRunId}</dd></div>
      </dl>

      <div>
        <h3>Source outcomes</h3>
        <div className="outcome-list">
          {run.sources.map((source, index) => (
            <div
              className="outcome-card"
              key={`${source.sourceId}:${source.rawItemId ?? source.eventId ?? index}`}
            >
              <div className="outcome-card__header">
                <span className="mono">{shortId(source.sourceId, 14)}</span>
                <StatusBadge value={source.status} />
              </div>
              {source.rawItemId ? <div><span>Raw item</span><code>{source.rawItemId}</code></div> : null}
              {source.eventId ? <div><span>Event</span><code>{source.eventId}</code></div> : null}
              {source.failureMessage ? <p className="inline-error">{source.failureMessage}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
