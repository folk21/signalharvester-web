import type { MonitoringProfileUpsertRequest } from '../api/types';

export interface MonitoringProfileFormValues {
  name: string;
  informationCategory: string;
  enabled: boolean;
  collectionIntervalMinutes: string;
  sourceIds: string[];
  criteriaText: string;
}

export interface MonitoringProfileFormValidation {
  payload?: MonitoringProfileUpsertRequest;
  error?: string;
}

export function validateMonitoringProfileForm(
  values: MonitoringProfileFormValues,
): MonitoringProfileFormValidation {
  const name = values.name.trim();
  if (!name) {
    return { error: 'Name is required.' };
  }

  const informationCategory = values.informationCategory.trim();
  if (!informationCategory) {
    return { error: 'Information category is required.' };
  }

  const collectionIntervalMinutes = Number(values.collectionIntervalMinutes);
  if (!Number.isInteger(collectionIntervalMinutes) || collectionIntervalMinutes < 1) {
    return { error: 'Collection interval must be a positive whole number of minutes.' };
  }

  if (values.sourceIds.length === 0) {
    return { error: 'Select at least one source.' };
  }

  let criteria: Record<string, string>;
  try {
    const parsed = values.criteriaText.trim() ? JSON.parse(values.criteriaText) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { error: 'Criteria must be a JSON object.' };
    }
    criteria = Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => {
        if (typeof value !== 'string') {
          throw new Error(`Criterion "${key}" must be a string.`);
        }
        return [key, value];
      }),
    );
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Criteria must be valid JSON.',
    };
  }

  return {
    payload: {
      name,
      informationCategory,
      enabled: values.enabled,
      collectionIntervalMinutes,
      sourceIds: [...values.sourceIds],
      criteria,
    },
  };
}
