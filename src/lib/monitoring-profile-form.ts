import type {
  MonitoringProfile,
  MonitoringProfileAnalysisSettings,
  MonitoringProfileUpsertRequest,
} from '../api/types';

export interface MonitoringProfileFormValues {
  name: string;
  informationCategory: string;
  enabled: boolean;
  collectionIntervalMinutes: string;
  sourceIds: string[];
  criteriaText: string;
  analysisSettingsEnabled: boolean;
  analysisKeywordsText: string;
  analysisMinimumMatches: string;
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

  const analysisValidation = validateAnalysisSettings(values);
  if (analysisValidation.error) {
    return { error: analysisValidation.error };
  }

  return {
    payload: {
      name,
      informationCategory,
      enabled: values.enabled,
      collectionIntervalMinutes,
      sourceIds: [...values.sourceIds],
      criteria,
      ...(analysisValidation.settings ? { analysisSettings: analysisValidation.settings } : {}),
    },
  };
}

export function monitoringProfileToFormValues(
  profile: MonitoringProfile,
): MonitoringProfileFormValues {
  return {
    name: profile.name,
    informationCategory: profile.informationCategory,
    enabled: profile.enabled,
    collectionIntervalMinutes: String(profile.collectionIntervalMinutes),
    sourceIds: [...profile.sourceIds],
    criteriaText: JSON.stringify(profile.criteria, null, 2),
    analysisSettingsEnabled: true,
    analysisKeywordsText: profile.analysisSettings.keywords.join('\n'),
    analysisMinimumMatches: String(profile.analysisSettings.minimumMatches),
  };
}

export function monitoringProfileToReplacementPayload(
  profile: MonitoringProfile,
  enabled: boolean,
): MonitoringProfileUpsertRequest {
  return {
    name: profile.name,
    informationCategory: profile.informationCategory,
    enabled,
    collectionIntervalMinutes: profile.collectionIntervalMinutes,
    sourceIds: [...profile.sourceIds],
    criteria: { ...profile.criteria },
    analysisSettings: {
      keywords: [...profile.analysisSettings.keywords],
      minimumMatches: profile.analysisSettings.minimumMatches,
    },
  };
}

function validateAnalysisSettings(values: MonitoringProfileFormValues): {
  settings?: MonitoringProfileAnalysisSettings;
  error?: string;
} {
  if (!values.analysisSettingsEnabled) {
    return {};
  }

  const keywords = values.analysisKeywordsText
    .split(/\r?\n/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);
  if (keywords.length === 0) {
    return { error: 'Add at least one Analysis keyword.' };
  }
  if (new Set(keywords).size !== keywords.length) {
    return { error: 'Analysis keywords must be unique.' };
  }

  const minimumMatches = Number(values.analysisMinimumMatches);
  if (!Number.isInteger(minimumMatches) || minimumMatches < 1) {
    return { error: 'Minimum Analysis matches must be a positive whole number.' };
  }
  if (minimumMatches > keywords.length) {
    return { error: 'Minimum Analysis matches must not exceed the number of keywords.' };
  }

  return {
    settings: {
      keywords,
      minimumMatches,
    },
  };
}
