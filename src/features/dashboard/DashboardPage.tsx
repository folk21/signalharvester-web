import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { ErrorState, LoadingState } from '../../components/AsyncState';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDateTime, formatDuration, shortId } from '../../lib/format';

export function DashboardPage() {
  const sourcesQuery = useQuery({ queryKey: ['sources'], queryFn: api.listSources });
  const runsQuery = useQuery({
    queryKey: ['collection-runs', 8],
    queryFn: () => api.listCollectionRuns(8),
  });
  const analysisQuery = useQuery({
    queryKey: ['analysis-items', { limit: 8 }],
    queryFn: () => api.listAnalysisItems({ limit: 8 }),
  });

  const loading = sourcesQuery.isPending || runsQuery.isPending || analysisQuery.isPending;
  const error = sourcesQuery.error ?? runsQuery.error ?? analysisQuery.error;

  if (loading) {
    return <LoadingState label="Loading operational overview…" />;
  }
  if (error) {
    return <ErrorState error={error} />;
  }

  const sources = sourcesQuery.data ?? [];
  const runs = runsQuery.data ?? [];
  const analysisItems = analysisQuery.data ?? [];
  const latestRun = runs[0];

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Operational overview"
        title="Dashboard"
        description="A compact view of configured sources, recent collection activity, and durable analysis state."
      />

      <section className="stat-grid" aria-label="System statistics">
        <article className="stat-card">
          <span>Configured sources</span>
          <strong>{sources.length}</strong>
          <small>{sources.filter((source) => source.enabled).length} enabled</small>
        </article>
        <article className="stat-card">
          <span>Recent runs</span>
          <strong>{runs.length}</strong>
          <small>{runs.filter((run) => run.status === 'FAILED').length} failed in current view</small>
        </article>
        <article className="stat-card">
          <span>Analysis items</span>
          <strong>{analysisItems.length}</strong>
          <small>latest persisted normalized items</small>
        </article>
        <article className="stat-card stat-card--accent">
          <span>Latest run</span>
          <strong>{latestRun ? latestRun.publishedCount : '—'}</strong>
          <small>{latestRun ? 'published items' : 'no runs yet'}</small>
        </article>
      </section>

      <section className="split-grid">
        <article className="panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Collection</span>
              <h2>Recent runs</h2>
            </div>
          </div>
          {runs.length === 0 ? (
            <div className="panel__empty">No collection runs have been recorded yet.</div>
          ) : (
            <div className="compact-list">
              {runs.slice(0, 5).map((run) => (
                <div className="compact-list__row" key={run.collectionRunId}>
                  <div>
                    <strong>{shortId(run.collectionRunId)}</strong>
                    <span>{formatDateTime(run.finishedAt)}</span>
                  </div>
                  <div className="compact-list__meta">
                    <span>{formatDuration(run.startedAt, run.finishedAt)}</span>
                    <StatusBadge value={run.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Analysis</span>
              <h2>Recently seen items</h2>
            </div>
          </div>
          {analysisItems.length === 0 ? (
            <div className="panel__empty">No normalized analysis items have been persisted yet.</div>
          ) : (
            <div className="compact-list">
              {analysisItems.slice(0, 5).map((item) => (
                <div
                  className="compact-list__row"
                  key={`${item.monitoringProfileId}:${item.normalizedItemId}`}
                >
                  <div>
                    <strong>{shortId(item.normalizedItemId)}</strong>
                    <span>{item.monitoringProfileId}</span>
                  </div>
                  <div className="compact-list__meta">
                    <span>{item.discoveryCount} discoveries</span>
                    <span>{formatDateTime(item.lastSeenAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
