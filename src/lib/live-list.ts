/** Merges live list items ahead of a durable snapshot while preserving one row per logical key. */
export function mergeLiveItems<T>(
  snapshot: readonly T[],
  liveItems: readonly T[],
  keyOf: (item: T) => string,
  limit?: number,
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

  const items = [...merged.values()];
  return limit === undefined ? items : items.slice(0, limit);
}

/** Appends a continuation page without duplicating logical rows already loaded earlier. */
export function appendUniqueItems<T>(
  current: readonly T[],
  page: readonly T[],
  keyOf: (item: T) => string,
): T[] {
  const seen = new Set(current.map(keyOf));
  const appended: T[] = [];
  for (const item of page) {
    const key = keyOf(item);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    appended.push(item);
  }
  return [...current, ...appended];
}
