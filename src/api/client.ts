import type {
  AnalysisItemInspection,
  CurrentPrincipal,
  LoginRequest,
  UserAccount,
  UserCreateRequest,
  UserUpdateRequest,
  CollectionRun,
  CollectionRunRequest,
  MonitoringProfile,
  MonitoringProfileUpsertRequest,
  ObservedEvent,
  ProcessingFlow,
  ResultDetail,
  ResultSummary,
  Source,
  SourceTestResult,
  SourceUpsertRequest,
} from './types';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const csrfCookieName = 'XSRF-TOKEN';
const csrfHeaderName = 'X-CSRF-TOKEN';
const unauthorizedListeners = new Set<() => void>();

export function subscribeToUnauthorized(listener: () => void): () => void {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}


export interface EventFilters {
  limit?: number;
  eventType?: string;
  producer?: string;
  topic?: string;
  correlationId?: string;
  collectionRunId?: string;
  itemId?: string;
  traceId?: string;
}

export interface ResultFilters {
  limit?: number;
  monitoringProfileId?: string;
  sourceId?: string;
  informationCategory?: string;
  relevant?: boolean;
  classification?: string;
  analyzedFrom?: string;
  analyzedTo?: string;
}

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
  const method = (init?.method ?? 'GET').toUpperCase();
  headers.set('Accept', 'application/json');
  if (init?.body || requiresCsrf(method)) {
    headers.set('Content-Type', 'application/json');
  }
  if (requiresCsrf(method) && path !== '/api/v1/auth/login' && !headers.has(csrfHeaderName)) {
    const csrfToken = readCookie(csrfCookieName);
    if (csrfToken) {
      headers.set(csrfHeaderName, csrfToken);
    }
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    const body = await parseResponseBody(response);
    if (response.status === 401 && path !== '/api/v1/auth/login') {
      for (const listener of unauthorizedListeners) {
        listener();
      }
    }
    throw new ApiError(response.status, errorMessage(response.status, body), body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.text();
  if (!body.trim()) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return JSON.parse(body) as T;
  }
  return body as T;
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
  if (status === 401) {
    return 'Authentication is required.';
  }
  if (status === 403) {
    return 'You do not have permission to perform this action.';
  }
  return `Request failed with HTTP ${status}`;
}

function requiresCsrf(method: string): boolean {
  return method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const prefix = `${name}=`;
  for (const part of document.cookie.split(';')) {
    const cookie = part.trim();
    if (cookie.startsWith(prefix)) {
      return cookie.slice(prefix.length);
    }
  }
  return null;
}

export const api = {
  login: (payload: LoginRequest) =>
    request<void>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: () =>
    request<void>('/api/v1/auth/logout', {
      method: 'POST',
    }),

  getCurrentPrincipal: () => request<CurrentPrincipal>('/api/v1/auth/me'),

  listUsers: () => request<UserAccount[]>('/api/v1/admin/users'),

  getUser: (userId: string) =>
    request<UserAccount>(`/api/v1/admin/users/${encodeURIComponent(userId)}`),

  createUser: (payload: UserCreateRequest) =>
    request<UserAccount>('/api/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateUser: (userId: string, payload: UserUpdateRequest) =>
    request<UserAccount>(`/api/v1/admin/users/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

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

  testSource: (sourceId: string) =>
    request<SourceTestResult>(`/api/v1/sources/${encodeURIComponent(sourceId)}/test`, {
      method: 'POST',
    }),

  listMonitoringProfiles: () => request<MonitoringProfile[]>('/api/v1/monitoring-profiles'),

  getMonitoringProfile: (profileId: string) =>
    request<MonitoringProfile>(`/api/v1/monitoring-profiles/${encodeURIComponent(profileId)}`),

  createMonitoringProfile: (payload: MonitoringProfileUpsertRequest) =>
    request<MonitoringProfile>('/api/v1/monitoring-profiles', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateMonitoringProfile: (profileId: string, payload: MonitoringProfileUpsertRequest) =>
    request<MonitoringProfile>(`/api/v1/monitoring-profiles/${encodeURIComponent(profileId)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteMonitoringProfile: (profileId: string) =>
    request<void>(`/api/v1/monitoring-profiles/${encodeURIComponent(profileId)}`, {
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

  listResults: (query: ResultFilters) => {
    const search = new URLSearchParams();
    search.set('limit', String(query.limit ?? 50));
    appendIfPresent(search, 'monitoringProfileId', query.monitoringProfileId);
    appendIfPresent(search, 'sourceId', query.sourceId);
    appendIfPresent(search, 'informationCategory', query.informationCategory);
    appendIfPresent(search, 'classification', query.classification);
    appendIfPresent(search, 'analyzedFrom', query.analyzedFrom);
    appendIfPresent(search, 'analyzedTo', query.analyzedTo);
    if (query.relevant !== undefined) {
      search.set('relevant', String(query.relevant));
    }
    return request<ResultSummary[]>(`/api/v1/results?${search}`);
  },

  resultStreamUrl: (query: ResultFilters) => buildUrl('/api/v1/results/stream', resultStreamSearch(query)),

  listObservedEvents: (query: EventFilters) => {
    const search = eventSearch(query, true);
    return request<ObservedEvent[]>(`/api/v1/events?${search}`);
  },

  eventStreamUrl: (query: EventFilters) =>
    buildUrl('/api/v1/events/stream', eventSearch(query, false)),

  getCollectionRunProcessingFlow: (collectionRunId: string) =>
    request<ProcessingFlow>(
      `/api/v1/flows/collection-runs/${encodeURIComponent(collectionRunId)}`,
    ),

  getItemProcessingFlow: (collectionRunId: string, itemId: string) =>
    request<ProcessingFlow>(
      `/api/v1/flows/collection-runs/${encodeURIComponent(collectionRunId)}/items/${encodeURIComponent(itemId)}`,
    ),

  getResult: (monitoringProfileId: string, normalizedItemId: string) => {
    const search = new URLSearchParams({ monitoringProfileId });
    return request<ResultDetail>(
      `/api/v1/results/${encodeURIComponent(normalizedItemId)}?${search}`,
    );
  },
};

function appendIfPresent(search: URLSearchParams, name: string, value?: string) {
  const trimmed = value?.trim();
  if (trimmed) {
    search.set(name, trimmed);
  }
}


function resultStreamSearch(query: ResultFilters): URLSearchParams {
  const search = new URLSearchParams();
  appendIfPresent(search, 'monitoringProfileId', query.monitoringProfileId);
  appendIfPresent(search, 'sourceId', query.sourceId);
  appendIfPresent(search, 'informationCategory', query.informationCategory);
  appendIfPresent(search, 'classification', query.classification);
  if (query.relevant !== undefined) {
    search.set('relevant', String(query.relevant));
  }
  return search;
}

function eventSearch(query: EventFilters, includeLimit: boolean): URLSearchParams {
  const search = new URLSearchParams();
  if (includeLimit) {
    search.set('limit', String(query.limit ?? 100));
  }
  appendIfPresent(search, 'eventType', query.eventType);
  appendIfPresent(search, 'producer', query.producer);
  appendIfPresent(search, 'topic', query.topic);
  appendIfPresent(search, 'correlationId', query.correlationId);
  appendIfPresent(search, 'collectionRunId', query.collectionRunId);
  appendIfPresent(search, 'itemId', query.itemId);
  appendIfPresent(search, 'traceId', query.traceId);
  return search;
}

function buildUrl(path: string, search: URLSearchParams): string {
  const query = search.toString();
  return `${apiBaseUrl}${path}${query ? `?${query}` : ''}`;
}
