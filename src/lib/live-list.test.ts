import { describe, expect, it } from 'vitest';
import { appendUniqueItems, mergeLiveItems } from './live-list';

describe('mergeLiveItems', () => {
  it('puts live rows first and replaces snapshot rows with the same logical key', () => {
    const snapshot = [
      { id: 'a', value: 'old-a' },
      { id: 'b', value: 'snapshot-b' },
    ];
    const live = [
      { id: 'c', value: 'live-c' },
      { id: 'a', value: 'live-a' },
    ];

    expect(mergeLiveItems(snapshot, live, (item) => item.id, 10)).toEqual([
      { id: 'c', value: 'live-c' },
      { id: 'a', value: 'live-a' },
      { id: 'b', value: 'snapshot-b' },
    ]);
  });

  it('keeps the merged list bounded when a limit is provided', () => {
    expect(
      mergeLiveItems(
        [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
        [{ id: 'd' }],
        (item) => item.id,
        2,
      ),
    ).toEqual([{ id: 'd' }, { id: 'a' }]);
  });

  it('preserves all loaded rows when no merge limit is provided', () => {
    expect(
      mergeLiveItems(
        [{ id: 'a' }, { id: 'b' }],
        [{ id: 'c' }],
        (item) => item.id,
      ),
    ).toEqual([{ id: 'c' }, { id: 'a' }, { id: 'b' }]);
  });
});

describe('appendUniqueItems', () => {
  it('keeps continuation order while dropping rows already present in earlier pages', () => {
    expect(
      appendUniqueItems(
        [{ id: 'a' }, { id: 'b' }],
        [{ id: 'b' }, { id: 'c' }, { id: 'c' }, { id: 'd' }],
        (item) => item.id,
      ),
    ).toEqual([{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]);
  });
});
