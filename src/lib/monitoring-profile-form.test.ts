import { describe, expect, it } from 'vitest';
import { validateMonitoringProfileForm } from './monitoring-profile-form';

describe('validateMonitoringProfileForm', () => {
  it('creates a trimmed profile payload while preserving source order', () => {
    const result = validateMonitoringProfileForm({
      name: '  Java monitoring  ',
      informationCategory: '  JOB  ',
      enabled: true,
      collectionIntervalMinutes: '15',
      sourceIds: ['source-b', 'source-a'],
      criteriaText: '{"query":"java backend"}',
    });

    expect(result.error).toBeUndefined();
    expect(result.payload).toEqual({
      name: 'Java monitoring',
      informationCategory: 'JOB',
      enabled: true,
      collectionIntervalMinutes: 15,
      sourceIds: ['source-b', 'source-a'],
      criteria: { query: 'java backend' },
    });
  });

  it('rejects invalid intervals, empty source membership, and non-string criteria', () => {
    expect(
      validateMonitoringProfileForm({
        name: 'Profile',
        informationCategory: 'JOB',
        enabled: false,
        collectionIntervalMinutes: '0',
        sourceIds: ['source-a'],
        criteriaText: '{}',
      }).error,
    ).toContain('positive whole number');

    expect(
      validateMonitoringProfileForm({
        name: 'Profile',
        informationCategory: 'JOB',
        enabled: false,
        collectionIntervalMinutes: '5',
        sourceIds: [],
        criteriaText: '{}',
      }).error,
    ).toContain('at least one source');

    expect(
      validateMonitoringProfileForm({
        name: 'Profile',
        informationCategory: 'JOB',
        enabled: false,
        collectionIntervalMinutes: '5',
        sourceIds: ['source-a'],
        criteriaText: '{"minimumScore":0.8}',
      }).error,
    ).toContain('must be a string');
  });
});
