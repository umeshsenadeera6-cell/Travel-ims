import { useCallback, useEffect, useRef, useState } from 'react';
import { dataEvents } from '@/services';

/**
 * Minimal data-fetching hook over the service layer.
 * Re-runs automatically whenever a service reports a mutation, so views stay in sync.
 * (Phase 2: swap for TanStack Query without touching services.)
 */
export function useServiceQuery<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      setData(result);
      setError(null);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsub = dataEvents.subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(run, 20); // batch bursts of writes
    });
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, [run]);

  return { data, loading, error, refetch: run };
}
