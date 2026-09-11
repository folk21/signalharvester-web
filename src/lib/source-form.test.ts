import { describe, expect, it } from 'vitest';
import { validateSourceForm } from './source-form';

describe('validateSourceForm', () => {
  it('accepts an HTTP source with string settings', () => {
    const result = validateSourceForm({
      name: 'Jobs',
      type: 'REST',
      location: 'https://example.test/jobs?q=java',
      enabled: true,
      settingsText: '{"header":"value"}',
    });

    expect(result.error).toBeUndefined();
    expect(result.payload?.location).toBe('https://example.test/jobs?q=java');
    expect(result.payload?.settings).toEqual({ header: 'value' });
  });

  it('rejects embedded credentials and fragments', () => {
    expect(
      validateSourceForm({
        name: 'Bad',
        type: 'HTML',
        location: 'https://user:secret@example.test/page',
        enabled: true,
        settingsText: '{}',
      }).error,
    ).toContain('credentials');

    expect(
      validateSourceForm({
        name: 'Bad',
        type: 'HTML',
        location: 'https://example.test/page#fragment',
        enabled: true,
        settingsText: '{}',
      }).error,
    ).toContain('fragments');
  });
});
