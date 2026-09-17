import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { ErrorState, LoadingState } from '../../components/AsyncState';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { hasRole, useAuthSession } from '../auth/AuthSession';
import { formatDateTime, formatDuration, shortId } from '../../lib/format';

export function DashboardPage() {
  const { principal } = useAuthSession();
  const canViewResults = hasRole(principal, 'VIEWER');
  const sourcesQuery = useQuery({ queryKey: ['sources'], queryFn: api.listSources });
  const profilesQuery = useQuery({ queryKey: ['monitoring-profiles'], queryFn: api.listMonitoringProfiles });
  const runsQuery = useQuery({
    queryKey: ['collection-runs', 8],
    queryFn: () => api.listCollectionRuns(8),
  });
  const analysisQuery = useQuery({
    queryKey: ['analysis-items', { limit: 8 }],
    queryFn: () => api.listAnalysisItems({ limit: 8 }),
  });
  const resultsQuery = useQuery({
    queryKey: ['results', { limit: 8 }],
    queryFn: () => api.listResults({ limit: 8 }),
    enabled: canViewResults,
  });

  const loading =
    sourcesQuery.isPending ||
    profilesQuery.isPending ||
    runsQuery.isPending ||
    analysisQuery.isPending ||
    (canViewResults && resultsQuery.isPending);
  const error =
    sourcesQuery.error ?? profilesQuery.error ?? runsQuery.error ?? analysisQuery.error ?? (canViewResults ? resultsQuery.error : null);

  if (loading) {
    return <LoadingState label="Loading operational overview…" />;
  }
  if (error) {
    return <ErrorState error={error} />;
  }

  const sources = sourcesQuery.data ?? [];
  const profiles = profilesQuery.data ?? [];
  const runs = runsQuery.data ?? [];
  const analysisItems = analysisQuery.data ?? [];
  const results = resultsQuery.data ?? [];
  const latestRun = runs[0];

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Operational overview"
        title="Dashboard"
        description="A compact view of configured sources, recent collection activity, durable analysis state, and Results when VIEWER access is also assigned."
      />

      <section className="stat-grid" aria-label="System statistics">
        <article className="stat-card">
          <span>Configured sources</span>
          <strong>{sources.length}</strong>
          <small>{sources.filter((source) => source.enabled).length} enabled</small>
        </article>
        <article className="stat-card">
          <span>Monitoring profiles</span>
          <strong>{profiles.length}</strong>
          <small>{profiles.filter((profile) => profile.enabled).length} scheduled</small>
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
        {canViewResults ? (
          <article className="stat-card">
            <span>Analyzed results</span>
            <strong>{results.length}</strong>
            <small>latest durable result projections</small>
          </article>
        ) : null}
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

        {canViewResults ? (
          <article className="panel">
            <div className="panel__header">
              <div>
                <span className="eyebrow">Results</span>
                <h2>Recently analyzed</h2>
              </div>
            </div>
            {results.length === 0 ? (
              <div className="panel__empty">No analyzed results have been persisted yet.</div>
            ) : (
              <div className="compact-list">
                {results.slice(0, 5).map((result) => (
                  <div
                    className="compact-list__row"
                    key={`${result.monitoringProfileId}:${result.normalizedItemId}`}
                  >
                    <div>
                      <strong>{result.title?.trim() || shortId(result.normalizedItemId)}</strong>
                      <span>{result.informationCategory} · {result.classification}</span>
                    </div>
                    <div className="compact-list__meta">
                      <span>{result.relevant ? 'relevant' : 'not relevant'} · score {result.score}</span>
                      <span>{formatDateTime(result.analyzedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        ) : null}
      </section>
    </div>
  );
}
