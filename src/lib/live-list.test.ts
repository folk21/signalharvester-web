import { describe, expect, it } from 'vitest';
import { mergeLiveItems } from './live-list';

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

  it('keeps the merged list bounded', () => {
    expect(
      mergeLiveItems(
        [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
        [{ id: 'd' }],
        (item) => item.id,
        2,
      ),
    ).toEqual([{ id: 'd' }, { id: 'a' }]);
  });
});
