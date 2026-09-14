import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import type {
  Source,
  SourceTestResult,
  SourceType,
  SourceUpsertRequest,
} from '../../api/types';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { validateSourceForm, type SourceFormValues } from '../../lib/source-form';
import { formatDateTime } from '../../lib/format';

const emptyForm: SourceFormValues = {
  name: '',
  type: 'REST',
  location: '',
  enabled: true,
  settingsText: '{}',
};

interface TestedSource {
  source: Source;
  result: SourceTestResult;
}

export function SourcesPage() {
  const queryClient = useQueryClient();
  const sourcesQuery = useQuery({ queryKey: ['sources'], queryFn: api.listSources });
  const [editing, setEditing] = useState<Source | null>(null);
  const [form, setForm] = useState<SourceFormValues>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [testedSource, setTestedSource] = useState<TestedSource | null>(null);
  const [testingSourceId, setTestingSourceId] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async (payload: SourceUpsertRequest) =>
      editing ? api.updateSource(editing.id, payload) : api.createSource(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sources'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteSource,
    onSuccess: async (_, sourceId) => {
      await queryClient.invalidateQueries({ queryKey: ['sources'] });
      if (testedSource?.source.id === sourceId) {
        setTestedSource(null);
      }
      resetForm();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ source, enabled }: { source: Source; enabled: boolean }) =>
      api.updateSource(source.id, toPayload(source, enabled)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sources'] });
    },
  });

  const testMutation = useMutation({
    mutationFn: api.testSource,
    onMutate: (sourceId) => {
      setTestingSourceId(sourceId);
    },
    onSuccess: (result, sourceId) => {
      const source = sourcesQuery.data?.find((candidate) => candidate.id === sourceId);
      if (source) {
        setTestedSource({ source, result });
      }
    },
    onSettled: () => {
      setTestingSourceId(null);
    },
  });

  const sources = sourcesQuery.data ?? [];
  const sortedSources = useMemo(
    () => [...sources].sort((a, b) => a.name.localeCompare(b.name)),
    [sources],
  );

  function resetForm() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
  }

  function beginEdit(source: Source) {
    setEditing(source);
    setForm({
      name: source.name,
      type: source.type,
      location: source.location,
      enabled: source.enabled,
      settingsText: JSON.stringify(source.settings, null, 2),
    });
    setFormError(null);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const validation = validateSourceForm(form);
    if (!validation.payload) {
      setFormError(validation.error ?? 'Source configuration is invalid.');
      return;
    }
    saveMutation.mutate(validation.payload);
  }

  function remove(source: Source) {
    if (window.confirm(`Delete source "${source.name}"?`)) {
      deleteMutation.mutate(source.id);
    }
  }

  if (sourcesQuery.isPending) {
    return <LoadingState label="Loading source configuration…" />;
  }
  if (sourcesQuery.error) {
    return <ErrorState error={sourcesQuery.error} />;
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Configuration"
        title="Sources"
        description="Manage external sources and run bounded fetch/extraction diagnostics without publishing normal pipeline events."
        actions={
          <button className="button button--primary" onClick={resetForm} type="button">
            New source
          </button>
        }
      />

      <section className="workspace-grid workspace-grid--form">
        <article className="panel table-panel">
          <div className="panel__header">
            <div>
              <h2>Configured sources</h2>
              <span>{sortedSources.length} total</span>
            </div>
          </div>
          {sortedSources.length === 0 ? (
            <EmptyState>Create the first source using the form.</EmptyState>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {sortedSources.map((source) => (
                    <tr key={source.id} className={editing?.id === source.id ? 'table-row--selected' : ''}>
                      <td>
                        <strong>{source.name}</strong>
                        <small className="mono">{source.id}</small>
                      </td>
                      <td>{source.type}</td>
                      <td>
                        <a href={source.location} target="_blank" rel="noreferrer" className="table-link">
                          {source.location}
                        </a>
                      </td>
                      <td>
                        <StatusBadge value={source.enabled ? 'ENABLED' : 'DISABLED'} />
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="button button--ghost"
                            disabled={testMutation.isPending}
                            onClick={() => testMutation.mutate(source.id)}
                            type="button"
                          >
                            {testingSourceId === source.id ? 'Testing…' : 'Test'}
                          </button>
                          <button className="button button--ghost" onClick={() => beginEdit(source)} type="button">
                            Edit
                          </button>
                          <button
                            className="button button--ghost"
                            disabled={toggleMutation.isPending}
                            onClick={() => toggleMutation.mutate({ source, enabled: !source.enabled })}
                            type="button"
                          >
                            {source.enabled ? 'Disable' : 'Enable'}
                          </button>
                          <button className="button button--danger-ghost" onClick={() => remove(source)} type="button">
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
              <span className="eyebrow">{editing ? 'Edit source' : 'Create source'}</span>
              <h2>{editing?.name ?? 'New source'}</h2>
            </div>
          </div>
          <form className="form-stack" onSubmit={submit}>
            <label>
              <span>Name</span>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Java Jobs"
              />
            </label>
            <label>
              <span>Type</span>
              <select
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({ ...current, type: event.target.value as SourceType }))
                }
              >
                <option value="REST">REST</option>
                <option value="RSS">RSS</option>
                <option value="HTML">HTML</option>
              </select>
            </label>
            <label>
              <span>Location</span>
              <input
                value={form.location}
                onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                placeholder="https://example.com/jobs"
              />
            </label>
            <label className="checkbox-row">
              <input
                checked={form.enabled}
                onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
                type="checkbox"
              />
              <span>Enabled for collection</span>
            </label>
            <label>
              <span>Settings (JSON string map)</span>
              <textarea
                rows={7}
                value={form.settingsText}
                onChange={(event) =>
                  setForm((current) => ({ ...current, settingsText: event.target.value }))
                }
                spellCheck={false}
              />
            </label>

            {formError ? <div className="inline-error">{formError}</div> : null}
            {saveMutation.error ? <div className="inline-error">{saveMutation.error.message}</div> : null}
            {deleteMutation.error ? <div className="inline-error">{deleteMutation.error.message}</div> : null}
            {toggleMutation.error ? <div className="inline-error">{toggleMutation.error.message}</div> : null}

            <div className="form-actions">
              <button className="button button--primary" disabled={saveMutation.isPending} type="submit">
                {saveMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create source'}
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

      {testMutation.error ? <div className="inline-error">Source test failed: {testMutation.error.message}</div> : null}
      {testedSource ? <SourceTestPanel tested={testedSource} /> : null}
    </div>
  );
}

function SourceTestPanel({ tested }: { tested: TestedSource }) {
  const { source, result } = tested;
  return (
    <section className="panel source-test-panel" aria-label="Source test result">
      <div className="panel__header">
        <div>
          <span className="eyebrow">Diagnostic preview</span>
          <h2>{source.name}</h2>
        </div>
        <StatusBadge value={result.status} />
      </div>

      <div className="diagnostic-grid">
        <div><span>HTTP status</span><strong>{result.httpStatus ?? '—'}</strong></div>
        <div><span>Response bytes</span><strong>{result.responseBytes}</strong></div>
        <div><span>Fetch</span><strong>{result.fetchDurationMs} ms</strong></div>
        <div><span>Extraction</span><strong>{result.extractionDurationMs} ms</strong></div>
        <div><span>Candidates</span><strong>{result.candidateItemCount}</strong></div>
        <div><span>Content type</span><strong>{result.responseContentType ?? '—'}</strong></div>
      </div>

      {result.failureMessage ? <div className="inline-error source-test-panel__error">{result.failureMessage}</div> : null}

      {result.preview.length === 0 ? (
        <EmptyState>No extracted items were available for preview.</EmptyState>
      ) : (
        <div className="source-preview-list">
          {result.preview.map((item, index) => (
            <article className="source-preview-card" key={`${item.externalId ?? item.url}:${index}`}>
              <div className="source-preview-card__header">
                <div>
                  <strong>{item.title?.trim() || item.externalId?.trim() || `Item ${index + 1}`}</strong>
                  <a href={item.url} target="_blank" rel="noreferrer">{item.url}</a>
                </div>
                <span>{item.contentType}</span>
              </div>
              <p className="content-preview">{item.contentPreview}</p>
              <div className="source-preview-card__meta">
                <span>{item.publishedAt ? formatDateTime(item.publishedAt) : 'No publication time'}</span>
                {item.contentTruncated ? <span>Preview truncated</span> : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function toPayload(source: Source, enabled: boolean): SourceUpsertRequest {
  return {
    name: source.name,
    type: source.type,
    location: source.location,
    enabled,
    settings: source.settings,
  };
}
