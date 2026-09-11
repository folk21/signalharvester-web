import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { AnalysisItemInspection } from '../../api/types';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import { PageHeader } from '../../components/PageHeader';
import { formatDateTime, shortId } from '../../lib/format';

export function AnalysisItemsPage() {
  const [profileInput, setProfileInput] = useState('');
  const [sourceInput, setSourceInput] = useState('');
  const [filters, setFilters] = useState({ monitoringProfileId: '', sourceId: '' });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const itemsQuery = useQuery({
    queryKey: ['analysis-items', { limit: 100, ...filters }],
    queryFn: () =>
      api.listAnalysisItems({
        limit: 100,
        ...(filters.monitoringProfileId ? { monitoringProfileId: filters.monitoringProfileId } : {}),
        ...(filters.sourceId ? { sourceId: filters.sourceId } : {}),
      }),
  });

  const items = itemsQuery.data ?? [];
  const selectedItem = useMemo(() => {
    const defaultItem = items[0] ?? null;
    if (!selectedKey) {
      return defaultItem;
    }
    return items.find((item) => keyOf(item) === selectedKey) ?? defaultItem;
  }, [items, selectedKey]);

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSelectedKey(null);
    setFilters({
      monitoringProfileId: profileInput.trim(),
      sourceId: sourceInput.trim(),
    });
  }

  if (itemsQuery.isPending) {
    return <LoadingState label="Loading analysis inspection state…" />;
  }
  if (itemsQuery.error) {
    return <ErrorState error={itemsQuery.error} />;
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Analysis"
        title="Analysis Items"
        description="Inspect durable normalized identity and deduplication state. Classification, score, and tags are not persisted by the current backend yet."
      />

      <section className="panel filter-panel">
        <form className="filter-form" onSubmit={applyFilters}>
          <label>
            <span>Monitoring profile ID</span>
            <input
              value={profileInput}
              onChange={(event) => setProfileInput(event.target.value)}
              placeholder="optional"
            />
          </label>
          <label>
            <span>Source ID</span>
            <input value={sourceInput} onChange={(event) => setSourceInput(event.target.value)} placeholder="optional" />
          </label>
          <button className="button button--primary" type="submit">Apply filters</button>
          <button
            className="button button--ghost"
            type="button"
            onClick={() => {
              setProfileInput('');
              setSourceInput('');
              setFilters({ monitoringProfileId: '', sourceId: '' });
              setSelectedKey(null);
            }}
          >
            Clear
          </button>
        </form>
      </section>

      <section className="workspace-grid">
        <article className="panel table-panel">
          <div className="panel__header">
            <div>
              <h2>Normalized items</h2>
              <span>{items.length} loaded</span>
            </div>
            <button className="button button--ghost" onClick={() => void itemsQuery.refetch()} type="button">
              Refresh
            </button>
          </div>
          {items.length === 0 ? (
            <EmptyState>No analysis items match the current filters.</EmptyState>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Normalized item</th>
                    <th>Profile</th>
                    <th>Source</th>
                    <th>Discoveries</th>
                    <th>Last seen</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={keyOf(item)}
                      className={selectedItem && keyOf(selectedItem) === keyOf(item) ? 'table-row--selected' : ''}
                      onClick={() => setSelectedKey(keyOf(item))}
                    >
                      <td className="mono">{shortId(item.normalizedItemId, 14)}</td>
                      <td>{item.monitoringProfileId}</td>
                      <td className="mono">{shortId(item.sourceId, 12)}</td>
                      <td>{item.discoveryCount}</td>
                      <td>{formatDateTime(item.lastSeenAt)}</td>
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
              <span className="eyebrow">Inspection</span>
              <h2>{selectedItem ? shortId(selectedItem.normalizedItemId, 16) : 'No selection'}</h2>
            </div>
          </div>
          {selectedItem ? <AnalysisDetail item={selectedItem} /> : <EmptyState>Select an item to inspect it.</EmptyState>}
        </article>
      </section>
    </div>
  );
}

function AnalysisDetail({ item }: { item: AnalysisItemInspection }) {
  return (
    <dl className="detail-list detail-list--full">
      <div><dt>Profile</dt><dd>{item.monitoringProfileId}</dd></div>
      <div><dt>Normalized item ID</dt><dd className="mono break-all">{item.normalizedItemId}</dd></div>
      <div><dt>Source ID</dt><dd className="mono break-all">{item.sourceId}</dd></div>
      <div><dt>External ID</dt><dd>{item.externalId ?? '—'}</dd></div>
      <div><dt>Source URL</dt><dd><a href={item.sourceUrl} target="_blank" rel="noreferrer">{item.sourceUrl}</a></dd></div>
      <div><dt>Discoveries</dt><dd>{item.discoveryCount}</dd></div>
      <div><dt>First seen</dt><dd>{formatDateTime(item.firstSeenAt)}</dd></div>
      <div><dt>Last seen</dt><dd>{formatDateTime(item.lastSeenAt)}</dd></div>
      <div><dt>First raw item</dt><dd className="mono break-all">{item.firstRawItemId}</dd></div>
      <div><dt>Last raw item</dt><dd className="mono break-all">{item.lastRawItemId}</dd></div>
      <div><dt>First source event</dt><dd className="mono break-all">{item.firstSourceEventId}</dd></div>
      <div><dt>Last source event</dt><dd className="mono break-all">{item.lastSourceEventId}</dd></div>
    </dl>
  );
}

function keyOf(item: AnalysisItemInspection): string {
  return `${item.monitoringProfileId}:${item.normalizedItemId}`;
}
