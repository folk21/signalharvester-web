import { describe, expect, it } from 'vitest';
import type { MonitoringProfile } from '../api/types';
import {
  monitoringProfileToFormValues,
  monitoringProfileToReplacementPayload,
  validateMonitoringProfileForm,
} from './monitoring-profile-form';

const profile: MonitoringProfile = {
  id: '33333333-3333-4333-8333-111111111111',
  name: 'Research monitoring',
  informationCategory: 'RESEARCH',
  enabled: true,
  collectionIntervalMinutes: 15,
  sourceIds: ['source-b', 'source-a'],
  criteria: { query: 'distributed systems' },
  analysisSettings: {
    keywords: ['java', 'kafka'],
    minimumMatches: 2,
  },
};

describe('validateMonitoringProfileForm', () => {
  it('creates a trimmed profile payload while preserving source order and typed Analysis settings', () => {
    const result = validateMonitoringProfileForm({
      name: '  Research monitoring  ',
      informationCategory: '  RESEARCH  ',
      enabled: true,
      collectionIntervalMinutes: '15',
      sourceIds: ['source-b', 'source-a'],
      criteriaText: '{"query":"distributed systems"}',
      analysisSettingsEnabled: true,
      analysisKeywordsText: '  java  \nkafka\n',
      analysisMinimumMatches: '2',
    });

    expect(result.error).toBeUndefined();
    expect(result.payload).toEqual({
      name: 'Research monitoring',
      informationCategory: 'RESEARCH',
      enabled: true,
      collectionIntervalMinutes: 15,
      sourceIds: ['source-b', 'source-a'],
      criteria: { query: 'distributed systems' },
      analysisSettings: {
        keywords: ['java', 'kafka'],
        minimumMatches: 2,
      },
    });
  });

  it('sends explicit all-relevant Analysis settings when keyword filtering is disabled', () => {
    const result = validateMonitoringProfileForm({
      name: 'Default analysis',
      informationCategory: 'GENERAL',
      enabled: false,
      collectionIntervalMinutes: '30',
      sourceIds: ['source-a'],
      criteriaText: '{}',
      analysisSettingsEnabled: false,
      analysisKeywordsText: '',
      analysisMinimumMatches: '',
    });

    expect(result.payload).toEqual({
      name: 'Default analysis',
      informationCategory: 'GENERAL',
      enabled: false,
      collectionIntervalMinutes: 30,
      sourceIds: ['source-a'],
      criteria: {},
      analysisSettings: {
        keywords: [],
        minimumMatches: 0,
      },
    });
  });

  it('rejects invalid intervals, empty source membership, and non-string criteria', () => {
    const validBase = {
      name: 'Profile',
      informationCategory: 'GENERAL',
      enabled: false,
      collectionIntervalMinutes: '5',
      sourceIds: ['source-a'],
      criteriaText: '{}',
      analysisSettingsEnabled: false,
      analysisKeywordsText: '',
      analysisMinimumMatches: '',
    };

    expect(
      validateMonitoringProfileForm({
        ...validBase,
        collectionIntervalMinutes: '0',
      }).error,
    ).toContain('positive whole number');

    expect(
      validateMonitoringProfileForm({
        ...validBase,
        sourceIds: [],
      }).error,
    ).toContain('at least one source');

    expect(
      validateMonitoringProfileForm({
        ...validBase,
        criteriaText: '{"minimumScore":0.8}',
      }).error,
    ).toContain('must be a string');

    expect(
      validateMonitoringProfileForm({
        ...validBase,
        criteriaText: '{"keywords":["earthquake","magnitude"],"minimumMatches":1}',
      }).error,
    ).toContain('Criterion "keywords" must be a string');
  });

  it('validates explicit Analysis settings using published contract constraints', () => {
    const validBase = {
      name: 'Profile',
      informationCategory: 'GENERAL',
      enabled: false,
      collectionIntervalMinutes: '5',
      sourceIds: ['source-a'],
      criteriaText: '{}',
      analysisSettingsEnabled: true,
      analysisKeywordsText: 'java\nkafka',
      analysisMinimumMatches: '1',
    };

    expect(
      validateMonitoringProfileForm({
        ...validBase,
        analysisKeywordsText: '',
      }).error,
    ).toContain('at least one Analysis keyword');

    expect(
      validateMonitoringProfileForm({
        ...validBase,
        analysisKeywordsText: 'java\njava',
      }).error,
    ).toContain('must be unique');

    expect(
      validateMonitoringProfileForm({
        ...validBase,
        analysisMinimumMatches: '0',
      }).error,
    ).toContain('positive whole number');

    expect(
      validateMonitoringProfileForm({
        ...validBase,
        analysisMinimumMatches: '3',
      }).error,
    ).toContain('must not exceed');
  });
});

describe('Monitoring Profile contract mapping', () => {
  it('initializes edit values from persisted Analysis settings', () => {
    expect(monitoringProfileToFormValues(profile)).toEqual({
      name: profile.name,
      informationCategory: profile.informationCategory,
      enabled: profile.enabled,
      collectionIntervalMinutes: '15',
      sourceIds: profile.sourceIds,
      criteriaText: JSON.stringify(profile.criteria, null, 2),
      analysisSettingsEnabled: true,
      analysisKeywordsText: 'java\nkafka',
      analysisMinimumMatches: '2',
    });
  });

  it('initializes all-relevant profiles with keyword filtering disabled', () => {
    expect(monitoringProfileToFormValues({
      ...profile,
      analysisSettings: { keywords: [], minimumMatches: 0 },
    })).toMatchObject({
      analysisSettingsEnabled: false,
      analysisKeywordsText: '',
      analysisMinimumMatches: '',
    });
  });

  it('preserves Analysis settings in replacement-style enabled-state updates', () => {
    expect(monitoringProfileToReplacementPayload(profile, false)).toEqual({
      name: profile.name,
      informationCategory: profile.informationCategory,
      enabled: false,
      collectionIntervalMinutes: profile.collectionIntervalMinutes,
      sourceIds: profile.sourceIds,
      criteria: profile.criteria,
      analysisSettings: profile.analysisSettings,
    });
  });
});
