import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import type {
  MonitoringProfile,
  MonitoringProfileUpsertRequest,
  Source,
} from '../../api/types';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import {
  validateMonitoringProfileForm,
  type MonitoringProfileFormValues,
} from '../../lib/monitoring-profile-form';

const emptyForm: MonitoringProfileFormValues = {
  name: '',
  informationCategory: '',
  enabled: false,
  collectionIntervalMinutes: '15',
  sourceIds: [],
  criteriaText: '{}',
};

export function MonitoringProfilesPage() {
  const queryClient = useQueryClient();
  const profilesQuery = useQuery({
    queryKey: ['monitoring-profiles'],
    queryFn: api.listMonitoringProfiles,
  });
  const sourcesQuery = useQuery({ queryKey: ['sources'], queryFn: api.listSources });
  const [editing, setEditing] = useState<MonitoringProfile | null>(null);
  const [form, setForm] = useState<MonitoringProfileFormValues>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async (payload: MonitoringProfileUpsertRequest) =>
      editing
        ? api.updateMonitoringProfile(editing.id, payload)
        : api.createMonitoringProfile(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['monitoring-profiles'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteMonitoringProfile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['monitoring-profiles'] });
      resetForm();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ profile, enabled }: { profile: MonitoringProfile; enabled: boolean }) =>
      api.updateMonitoringProfile(profile.id, toPayload(profile, enabled)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['monitoring-profiles'] });
    },
  });

  const loading = profilesQuery.isPending || sourcesQuery.isPending;
  const error = profilesQuery.error ?? sourcesQuery.error;

  if (loading) {
    return <LoadingState label="Loading monitoring profiles…" />;
  }
  if (error) {
    return <ErrorState error={error} />;
  }

  const profiles = profilesQuery.data ?? [];
  const sources = sourcesQuery.data ?? [];
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const sortedProfiles = [...profiles].sort((a, b) => a.name.localeCompare(b.name));
  const formSources = orderSourcesForForm(sources, form.sourceIds);

  function resetForm() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
  }

  function beginEdit(profile: MonitoringProfile) {
    setEditing(profile);
    setForm({
      name: profile.name,
      informationCategory: profile.informationCategory,
      enabled: profile.enabled,
      collectionIntervalMinutes: String(profile.collectionIntervalMinutes),
      sourceIds: [...profile.sourceIds],
      criteriaText: JSON.stringify(profile.criteria, null, 2),
    });
    setFormError(null);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const validation = validateMonitoringProfileForm(form);
    if (!validation.payload) {
      setFormError(validation.error ?? 'Monitoring profile is invalid.');
      return;
    }
    saveMutation.mutate(validation.payload);
  }

  function toggleSource(sourceId: string, checked: boolean) {
    setForm((current) => ({
      ...current,
      sourceIds: checked
        ? current.sourceIds.includes(sourceId)
          ? current.sourceIds
          : [...current.sourceIds, sourceId]
        : current.sourceIds.filter((id) => id !== sourceId),
    }));
  }

  function remove(profile: MonitoringProfile) {
    if (window.confirm(`Delete monitoring profile "${profile.name}"?`)) {
      deleteMutation.mutate(profile.id);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Configuration"
        title="Monitoring Profiles"
        description="Group sources into persisted collection profiles with category, interval, criteria, and enabled state."
        actions={
          <button className="button button--primary" onClick={resetForm} type="button">
            New profile
          </button>
        }
      />

      <section className="workspace-grid workspace-grid--form">
        <article className="panel table-panel">
          <div className="panel__header">
            <div>
              <h2>Configured profiles</h2>
              <span>{sortedProfiles.length} total</span>
            </div>
          </div>
          {sortedProfiles.length === 0 ? (
            <EmptyState>Create the first monitoring profile using the form.</EmptyState>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Schedule</th>
                    <th>Sources</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {sortedProfiles.map((profile) => (
                    <tr
                      key={profile.id}
                      className={editing?.id === profile.id ? 'table-row--selected' : ''}
                    >
                      <td>
                        <strong>{profile.name}</strong>
                        <small className="mono">{profile.id}</small>
                      </td>
                      <td>{profile.informationCategory}</td>
                      <td>Every {profile.collectionIntervalMinutes} min</td>
                      <td>
                        <strong>{profile.sourceIds.length}</strong>
                        <small>{sourceNames(profile.sourceIds, sourceById)}</small>
                      </td>
                      <td>
                        <StatusBadge value={profile.enabled ? 'ENABLED' : 'DISABLED'} />
                      </td>
                      <td>
                        <div className="table-actions">
                          <button className="button button--ghost" onClick={() => beginEdit(profile)} type="button">
                            Edit
                          </button>
                          <button
                            className="button button--ghost"
                            disabled={toggleMutation.isPending}
                            onClick={() =>
                              toggleMutation.mutate({ profile, enabled: !profile.enabled })
                            }
                            type="button"
                          >
                            {profile.enabled ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            className="button button--danger-ghost"
                            onClick={() => remove(profile)}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="panel form-panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">{editing ? 'Edit profile' : 'Create profile'}</span>
              <h2>{editing?.name ?? 'New monitoring profile'}</h2>
            </div>
          </div>
          <form className="form-stack" onSubmit={submit}>
            <label>
              <span>Name</span>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Java jobs"
              />
            </label>
            <label>
              <span>Information category</span>
              <input
                value={form.informationCategory}
                onChange={(event) =>
                  setForm((current) => ({ ...current, informationCategory: event.target.value }))
                }
                placeholder="JOB"
              />
            </label>
            <label>
              <span>Collection interval (minutes)</span>
              <input
                min="1"
                step="1"
                type="number"
                value={form.collectionIntervalMinutes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    collectionIntervalMinutes: event.target.value,
                  }))
                }
              />
            </label>
            <label className="checkbox-row">
              <input
                checked={form.enabled}
                onChange={(event) =>
                  setForm((current) => ({ ...current, enabled: event.target.checked }))
                }
                type="checkbox"
              />
              <span>Enable scheduled collection</span>
            </label>

            <fieldset className="source-membership">
              <legend>Sources</legend>
              {formSources.length === 0 ? (
                <p className="field-note">Create at least one source before creating a profile.</p>
              ) : (
                formSources.map((source) => {
                  const order = form.sourceIds.indexOf(source.id);
                  return (
                    <label className="source-membership__row" key={source.id}>
                      <input
                        checked={order >= 0}
                        onChange={(event) => toggleSource(source.id, event.target.checked)}
                        type="checkbox"
                        aria-label={`Use source ${source.name}`}
                      />
                      <span>
                        <strong>{source.name}</strong>
                        <small>
                          {order >= 0 ? `#${order + 1} · ` : ''}
                          {source.type} · {source.enabled ? 'enabled' : 'disabled'}
                        </small>
                      </span>
                    </label>
                  );
                })
              )}
            </fieldset>

            <label>
              <span>Criteria (JSON string map)</span>
              <textarea
                rows={6}
                value={form.criteriaText}
                onChange={(event) =>
                  setForm((current) => ({ ...current, criteriaText: event.target.value }))
                }
                spellCheck={false}
              />
            </label>

            {formError ? <div className="inline-error">{formError}</div> : null}
            {saveMutation.error ? <div className="inline-error">{saveMutation.error.message}</div> : null}
            {deleteMutation.error ? <div className="inline-error">{deleteMutation.error.message}</div> : null}
            {toggleMutation.error ? <div className="inline-error">{toggleMutation.error.message}</div> : null}

            <div className="form-actions">
              <button
                className="button button--primary"
                disabled={saveMutation.isPending || sources.length === 0}
                type="submit"
              >
                {saveMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create profile'}
              </button>
              {editing ? (
                <button className="button button--ghost" onClick={resetForm} type="button">
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </article>
      </section>
    </div>
  );
}

function toPayload(profile: MonitoringProfile, enabled: boolean): MonitoringProfileUpsertRequest {
  return {
    name: profile.name,
    informationCategory: profile.informationCategory,
    enabled,
    collectionIntervalMinutes: profile.collectionIntervalMinutes,
    sourceIds: profile.sourceIds,
    criteria: profile.criteria,
  };
}

function orderSourcesForForm(sources: Source[], selectedIds: string[]): Source[] {
  const byId = new Map(sources.map((source) => [source.id, source]));
  const selected = selectedIds.flatMap((id) => {
    const source = byId.get(id);
    return source ? [source] : [];
  });
  const selectedSet = new Set(selectedIds);
  const remaining = sources
    .filter((source) => !selectedSet.has(source.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...selected, ...remaining];
}

function sourceNames(sourceIds: string[], sourceById: Map<string, Source>): string {
  const names = sourceIds.map((id) => sourceById.get(id)?.name ?? id);
  return names.length <= 2 ? names.join(', ') : `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
}
