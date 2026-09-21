import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, type ResultFilters } from '../../api/client';
import type { ResultLiveEvent, ResultSummary } from '../../api/types';
import { appendUniqueItems } from '../../lib/live-list';
import { useLiveList } from '../../lib/use-live-list';

interface UseResultBrowserOptions {
  cacheKey: 'results' | 'viewer-results';
  filters: ResultFilters;
  matchesLiveResult: (result: ResultSummary, filters: ResultFilters) => boolean;
}

/** Combines Results REST keyset continuation with the existing race-free SSE bootstrap. */
export function useResultBrowser({ cacheKey, filters, matchesLiveResult }: UseResultBrowserOptions) {
  const queryClient = useQueryClient();
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<unknown>(null);
  const continuationGeneration = useRef(0);
  const loadMoreInFlight = useRef(false);
  const queryKey = useMemo(() => [cacheKey, filters] as const, [cacheKey, filters]);
  const searchActive = Boolean(filters.search?.trim());

  useEffect(() => {
    continuationGeneration.current += 1;
    loadMoreInFlight.current = false;
    setNextCursor(null);
    setLoadingMore(false);
    setLoadMoreError(null);
  }, [filters]);

  const fetchFirstPage = useCallback(async () => {
    const generation = continuationGeneration.current + 1;
    continuationGeneration.current = generation;
    loadMoreInFlight.current = false;
    setLoadingMore(false);
    setLoadMoreError(null);
    setNextCursor(null);
    const firstPageFilters: ResultFilters = { ...filters };
    delete firstPageFilters.cursor;
    const page = await api.browseResults(firstPageFilters);
    if (continuationGeneration.current === generation) {
      setNextCursor(page.nextCursor);
      setLoadMoreError(null);
    }
    return page.results;
  }, [filters]);

  const liveOptions = useMemo(() => ({
    queryKey,
    fetchSnapshot: fetchFirstPage,
    streamUrl: api.resultStreamUrl(filters),
    eventName: 'result',
    decode: (data: string) => JSON.parse(data) as ResultLiveEvent,
    reconcileOnEnvelope: (envelope: ResultLiveEvent) => searchActive && envelope.result !== null,
    itemFromEnvelope: (envelope: ResultLiveEvent) =>
      envelope.result && matchesLiveResult(envelope.result, filters) ? envelope.result : null,
    keyOf: resultIdentity,
  }), [fetchFirstPage, filters, matchesLiveResult, queryKey, searchActive]);
  const liveResults = useLiveList(liveOptions);

  const loadMore = useCallback(async () => {
    const cursor = nextCursor;
    if (!cursor || loadMoreInFlight.current) {
      return;
    }

    const generation = continuationGeneration.current;
    loadMoreInFlight.current = true;
    setLoadingMore(true);
    setLoadMoreError(null);
    try {
      const page = await api.browseResults({ ...filters, cursor });
      if (continuationGeneration.current !== generation) {
        return;
      }
      queryClient.setQueryData<ResultSummary[]>(queryKey, (current = []) =>
        appendUniqueItems(current, page.results, resultIdentity),
      );
      setNextCursor(page.nextCursor);
    } catch (error) {
      if (continuationGeneration.current === generation) {
        setLoadMoreError(error);
      }
    } finally {
      if (continuationGeneration.current === generation) {
        loadMoreInFlight.current = false;
        setLoadingMore(false);
      }
    }
  }, [filters, nextCursor, queryClient, queryKey]);

  return {
    ...liveResults,
    hasNextPage: nextCursor !== null,
    loadingMore,
    loadMoreError,
    loadMore,
  };
}

export function resultIdentity(result: ResultSummary): string {
  return `${result.monitoringProfileId}:${result.normalizedItemId}`;
}
