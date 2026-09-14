/** Merges live list items into a bounded snapshot while preserving one row per logical key. */
export function mergeLiveItems<T>(
  snapshot: readonly T[],
  liveItems: readonly T[],
  keyOf: (item: T) => string,
  limit: number,
): T[] {
  const merged = new Map<string, T>();

  for (const item of liveItems) {
    merged.set(keyOf(item), item);
  }
  for (const item of snapshot) {
    const key = keyOf(item);
    if (!merged.has(key)) {
      merged.set(key, item);
    }
  }

  return [...merged.values()].slice(0, limit);
}
