import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { mergeLiveItems } from './live-list';

export type LiveConnectionStatus = 'connecting' | 'live' | 'reconnecting' | 'offline';

interface UseLiveListOptions<TItem, TEnvelope> {
  queryKey: QueryKey;
  fetchSnapshot: () => Promise<TItem[]>;
  streamUrl: string;
  eventName: string;
  decode: (data: string) => TEnvelope;
  itemFromEnvelope: (envelope: TEnvelope) => TItem | null;
  keyOf: (item: TItem) => string;
  limit: number;
}

/** Coordinates an SSE stream with a durable REST snapshot stored in TanStack Query. */
export function useLiveList<TItem, TEnvelope>(
  options: UseLiveListOptions<TItem, TEnvelope>,
) {
  const queryClient = useQueryClient();
  const [connectionStatus, setConnectionStatus] = useState<LiveConnectionStatus>('connecting');
  const [snapshotError, setSnapshotError] = useState<unknown>(null);
  const [syncing, setSyncing] = useState(false);
  const bufferedItems = useRef(new Map<string, TItem>());
  const bootstrapping = useRef(false);
  const hasSnapshot = useRef(false);
  const generation = useRef(0);
  const syncQueue = useRef<Promise<void>>(Promise.resolve());

  const query = useQuery<TItem[]>({
    queryKey: options.queryKey,
    queryFn: options.fetchSnapshot,
    enabled: false,
  });

  const synchronize = useCallback(() => {
    const run = async () => {
      const currentGeneration = generation.current;
      bootstrapping.current = true;
      bufferedItems.current.clear();
      setSyncing(true);
      try {
        const snapshot = await options.fetchSnapshot();
        if (generation.current !== currentGeneration) {
          return;
        }
        const buffered = [...bufferedItems.current.values()];
        queryClient.setQueryData<TItem[]>(
          options.queryKey,
          mergeLiveItems(snapshot, buffered, options.keyOf, options.limit),
        );
        bufferedItems.current.clear();
        hasSnapshot.current = true;
        setSnapshotError(null);
      } catch (error) {
        if (generation.current === currentGeneration) {
          setSnapshotError(error);
        }
      } finally {
        if (generation.current === currentGeneration) {
          bootstrapping.current = false;
          setSyncing(false);
        }
      }
    };

    const queued = syncQueue.current.then(run, run);
    syncQueue.current = queued.then(() => undefined, () => undefined);
    return queued;
  }, [options, queryClient]);

  useEffect(() => {
    generation.current += 1;
    hasSnapshot.current = false;
    bootstrapping.current = false;
    bufferedItems.current.clear();
    setSnapshotError(null);
    setSyncing(false);
    setConnectionStatus('connecting');

    let closed = false;
    let snapshotFallbackStarted = false;
    let source: EventSource;

    const startSnapshotFallback = () => {
      if (!snapshotFallbackStarted && !hasSnapshot.current) {
        snapshotFallbackStarted = true;
        void synchronize();
      }
    };

    try {
      source = new EventSource(options.streamUrl, { withCredentials: true });
    } catch (error) {
      setConnectionStatus('offline');
      setSnapshotError(error);
      startSnapshotFallback();
      return () => {
        closed = true;
        generation.current += 1;
      };
    }

    const onReady = () => {
      if (closed) {
        return;
      }
      setConnectionStatus('live');
      snapshotFallbackStarted = true;
      void synchronize();
    };

    const onLiveEvent = (event: Event) => {
      if (closed || !(event instanceof MessageEvent)) {
        return;
      }
      try {
        const envelope = options.decode(event.data);
        const item = options.itemFromEnvelope(envelope);
        if (!item) {
          return;
        }
        if (bootstrapping.current) {
          bufferedItems.current.set(options.keyOf(item), item);
          return;
        }
        queryClient.setQueryData<TItem[]>(options.queryKey, (current = []) =>
          mergeLiveItems(current, [item], options.keyOf, options.limit),
        );
      } catch (error) {
        setSnapshotError(error);
      }
    };

    const onError = () => {
      if (closed) {
        return;
      }
      setConnectionStatus('reconnecting');
      startSnapshotFallback();
    };

    source.addEventListener('ready', onReady);
    source.addEventListener(options.eventName, onLiveEvent);
    source.addEventListener('error', onError);

    return () => {
      closed = true;
      generation.current += 1;
      source.removeEventListener('ready', onReady);
      source.removeEventListener(options.eventName, onLiveEvent);
      source.removeEventListener('error', onError);
      source.close();
    };
  }, [options, queryClient, synchronize]);

  return {
    data: query.data ?? [],
    error: snapshotError,
    connectionStatus,
    syncing,
    hasSnapshot: hasSnapshot.current,
    refresh: synchronize,
  };
}
