import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiBaseUrl, isServerMode } from '@/services';
import {
  fetchSnapshot,
  hydrateSnapshot,
  readSnapshotCache,
  writeSnapshotCache,
} from '@/services/http/snapshot';
import { useUiStore } from '@/stores/ui-store';

/**
 * Server mode bootstrap: hydrate the read caches from the last snapshot, then
 * refresh from the API. Offline, the cached snapshot is all we show.
 */
export function SnapshotSync() {
  const queryClient = useQueryClient();
  const setOffline = useUiStore((state) => state.setOffline);

  useEffect(() => {
    if (!isServerMode) return;

    let cancelled = false;

    const hydrateFromCache = () => {
      const cached = readSnapshotCache();
      if (cached) hydrateSnapshot(queryClient, cached);
      return Boolean(cached);
    };

    const refresh = async (): Promise<void> => {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        hydrateFromCache();
        setOffline(true);
        return;
      }

      try {
        const snapshot = await fetchSnapshot(apiBaseUrl);
        if (cancelled) return;
        writeSnapshotCache(snapshot);
        hydrateSnapshot(queryClient, snapshot);
        setOffline(false);
      } catch {
        if (cancelled) return;
        hydrateFromCache();
        setOffline(true);
      }
    };

    void refresh();

    const handleOnline = () => {
      void refresh().then(() => {
        void queryClient.invalidateQueries();
      });
    };
    const handleOffline = () => setOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      cancelled = true;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queryClient, setOffline]);

  return null;
}
