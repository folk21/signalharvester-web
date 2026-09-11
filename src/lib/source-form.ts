import type { SourceUpsertRequest } from '../api/types';

export interface SourceFormValues {
  name: string;
  type: SourceUpsertRequest['type'];
  location: string;
  enabled: boolean;
  settingsText: string;
}

export interface SourceFormValidation {
  payload?: SourceUpsertRequest;
  error?: string;
}

export function validateSourceForm(values: SourceFormValues): SourceFormValidation {
  const name = values.name.trim();
  if (!name) {
    return { error: 'Name is required.' };
  }

  let url: URL;
  try {
    url = new URL(values.location.trim());
  } catch {
    return { error: 'Location must be an absolute HTTP(S) URL.' };
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    return { error: 'Location must use HTTP or HTTPS.' };
  }
  if (!url.hostname) {
    return { error: 'Location must contain a host.' };
  }
  if (url.username || url.password) {
    return { error: 'Embedded URL credentials are not allowed.' };
  }
  if (url.hash) {
    return { error: 'URL fragments are not allowed.' };
  }

  let settings: Record<string, string>;
  try {
    const parsed = values.settingsText.trim() ? JSON.parse(values.settingsText) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { error: 'Settings must be a JSON object.' };
    }
    settings = Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => {
        if (typeof value !== 'string') {
          throw new Error(`Setting "${key}" must be a string.`);
        }
        return [key, value];
      }),
    );
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Settings must be valid JSON.',
    };
  }

  return {
    payload: {
      name,
      type: values.type,
      location: url.toString(),
      enabled: values.enabled,
      settings,
    },
  };
}
