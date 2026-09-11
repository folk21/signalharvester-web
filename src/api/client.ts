import type {
  AnalysisItemInspection,
  CollectionRun,
  CollectionRunRequest,
  Source,
  SourceUpsertRequest,
} from './types';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Accept', 'application/json');
  if (init?.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const body = await parseResponseBody(response);
    throw new ApiError(response.status, errorMessage(response.status, body), body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json().catch(() => null);
  }
  return response.text().catch(() => '');
}

function errorMessage(status: number, body: unknown): string {
  if (typeof body === 'string' && body.trim()) {
    return body.trim();
  }
  if (body && typeof body === 'object') {
    for (const key of ['message', 'error', 'detail']) {
      const value = (body as Record<string, unknown>)[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  }
  return `Request failed with HTTP ${status}`;
}

export const api = {
  listSources: () => request<Source[]>('/api/v1/sources'),

  getSource: (sourceId: string) =>
    request<Source>(`/api/v1/sources/${encodeURIComponent(sourceId)}`),

  createSource: (payload: SourceUpsertRequest) =>
    request<Source>('/api/v1/sources', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateSource: (sourceId: string, payload: SourceUpsertRequest) =>
    request<Source>(`/api/v1/sources/${encodeURIComponent(sourceId)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteSource: (sourceId: string) =>
    request<void>(`/api/v1/sources/${encodeURIComponent(sourceId)}`, {
      method: 'DELETE',
    }),

  listCollectionRuns: (limit = 50) =>
    request<CollectionRun[]>(`/api/v1/admin/collection-runs?limit=${limit}`),

  getCollectionRun: (collectionRunId: string) =>
    request<CollectionRun>(
      `/api/v1/admin/collection-runs/${encodeURIComponent(collectionRunId)}`,
    ),

  startCollectionRun: (payload: CollectionRunRequest) =>
    request<CollectionRun>('/api/v1/admin/collection-runs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  listAnalysisItems: (query: {
    limit?: number;
    monitoringProfileId?: string;
    sourceId?: string;
  }) => {
    const search = new URLSearchParams();
    search.set('limit', String(query.limit ?? 50));
    if (query.monitoringProfileId?.trim()) {
      search.set('monitoringProfileId', query.monitoringProfileId.trim());
    }
    if (query.sourceId?.trim()) {
      search.set('sourceId', query.sourceId.trim());
    }
    return request<AnalysisItemInspection[]>(`/api/v1/admin/analysis/items?${search}`);
  },

  getAnalysisItem: (monitoringProfileId: string, normalizedItemId: string) => {
    const search = new URLSearchParams({ monitoringProfileId });
    return request<AnalysisItemInspection>(
      `/api/v1/admin/analysis/items/${encodeURIComponent(normalizedItemId)}?${search}`,
    );
  },
};
