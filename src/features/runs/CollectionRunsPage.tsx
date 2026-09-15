import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { CollectionRun, MonitoringProfile } from '../../api/types';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDateTime, formatDuration, shortId } from '../../lib/format';

export function CollectionRunsPage() {
  const queryClient = useQueryClient();
  const [monitoringProfileId, setMonitoringProfileId] = useState('');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const runsQuery = useQuery({
    queryKey: ['collection-runs', 50],
    queryFn: () => api.listCollectionRuns(50),
  });
  const profilesQuery = useQuery({
    queryKey: ['monitoring-profiles'],
    queryFn: api.listMonitoringProfiles,
  });

  const startMutation = useMutation({
    mutationFn: api.startCollectionRun,
    onSuccess: async (run) => {
      setSelectedRunId(run.collectionRunId);
      await queryClient.invalidateQueries({ queryKey: ['collection-runs'] });
      await queryClient.invalidateQueries({ queryKey: ['analysis-items'] });
    },
  });

  const profiles = useMemo(
    () => [...(profilesQuery.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [profilesQuery.data],
  );

  useEffect(() => {
    if (!monitoringProfileId && profiles.length > 0) {
      const preferred = profiles.find((profile) => profile.enabled) ?? profiles[0];
      if (preferred) {
        setMonitoringProfileId(preferred.id);
      }
    }
  }, [monitoringProfileId, profiles]);

  const loading = runsQuery.isPending || profilesQuery.isPending;
  const error = runsQuery.error ?? profilesQuery.error;
  if (loading) {
    return <LoadingState label="Loading collection history…" />;
  }
  if (error) {
    return <ErrorState error={error} />;
  }

  const runs = runsQuery.data ?? [];
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const selectedRun =
    runs.find((run) => run.collectionRunId === selectedRunId) ?? runs[0] ?? null;

  function startRun(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!monitoringProfileId) {
      return;
    }
    startMutation.mutate({ monitoringProfileId });
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Operations"
        title="Collection Runs"
        description="Start a persisted monitoring profile manually and inspect the durable outcome recorded for each configured source."
      />

      <section className="panel run-launcher">
        <div>
          <span className="eyebrow">Manual execution</span>
          <h2>Run a monitoring profile</h2>
          <p>
            Manual execution uses the selected persisted profile. Category and ordered source membership come from backend configuration.
          </p>
        </div>
        {profiles.length === 0 ? (
          <EmptyState>Create a monitoring profile before starting a collection run.</EmptyState>
        ) : (
          <form aria-label="Start collection run" className="run-launcher__form run-launcher__form--profile" onSubmit={startRun}>
            <label>
              <span>Monitoring profile</span>
              <select
                aria-label="Monitoring profile"
                value={monitoringProfileId}
                onChange={(event) => setMonitoringProfileId(event.target.value)}
              >
                {profiles.map((profile) => (
                  <option value={profile.id} key={profile.id}>
                    {profile.name} · {profile.informationCategory}{profile.enabled ? '' : ' · disabled schedule'}
                  </option>
                ))}
              </select>
            </label>
            <button className="button button--primary" disabled={startMutation.isPending} type="submit">
              {startMutation.isPending ? 'Running…' : 'Start collection run'}
            </button>
          </form>
        )}
        {startMutation.error ? <div className="inline-error" role="alert">{startMutation.error.message}</div> : null}
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
              <table aria-label="Collection run history">
                <thead>
                  <tr>
                    <th>Run</th>
                    <th>Profile</th>
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
                        <button className="table-row-select" type="button" onClick={() => setSelectedRunId(run.collectionRunId)} aria-label={`Inspect collection run ${run.collectionRunId}`}>
                          <strong className="mono">{shortId(run.collectionRunId, 12)}</strong>
                          <small>{formatDuration(run.startedAt, run.finishedAt)}</small>
                        </button>
                      </td>
                      <td>
                        <strong>{profileById.get(run.monitoringProfileId)?.name ?? run.monitoringProfileId}</strong>
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
          {selectedRun ? (
            <RunDetail run={selectedRun} profile={profileById.get(selectedRun.monitoringProfileId)} />
          ) : (
            <EmptyState>Select a run to inspect it.</EmptyState>
          )}
        </article>
      </section>
    </div>
  );
}

function RunDetail({ run, profile }: { run: CollectionRun; profile: MonitoringProfile | undefined }) {
  return (
    <div className="detail-stack">
      <div className="detail-actions">
        <Link className="button button--ghost" to={`/flows?collectionRunId=${encodeURIComponent(run.collectionRunId)}`}>Open processing flow</Link>
        <Link className="button button--ghost" to={`/events?collectionRunId=${encodeURIComponent(run.collectionRunId)}`}>Explore run events</Link>
      </div>
      <dl className="detail-list">
        <div><dt>Status</dt><dd><StatusBadge value={run.status} /></dd></div>
        <div><dt>Profile</dt><dd>{profile?.name ?? run.monitoringProfileId}</dd></div>
        <div><dt>Profile ID</dt><dd className="mono break-all">{run.monitoringProfileId}</dd></div>
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
              {source.rawItemId ? (
                <div className="outcome-card__actions">
                  <Link className="button button--ghost" to={`/flows?collectionRunId=${encodeURIComponent(run.collectionRunId)}&itemId=${encodeURIComponent(source.rawItemId)}`}>Open item flow</Link>
                </div>
              ) : null}
              {source.failureMessage ? <p className="inline-error">{source.failureMessage}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
