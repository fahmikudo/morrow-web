import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@heroui/react';
import { notifyError } from '@/lib/toast';
import { apiBaseUrl, isServerMode } from '@/services';
import { importLocalData } from '@/services/demo';
import { fetchSnapshot, writeSnapshotCache } from '@/services/http/snapshot';
import { useUiStore } from '@/stores/ui-store';
import { settingsKeys } from './queries';

async function refreshAfterImport(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: settingsKeys.all });
  if (isServerMode) {
    try {
      writeSnapshotCache(await fetchSnapshot(apiBaseUrl));
    } catch {
      // The snapshot cache is best effort; queries still refetch from the API.
    }
  }
  await queryClient.resetQueries();
}

export function useImportLocalData() {
  const queryClient = useQueryClient();
  const clearAssistantMessages = useUiStore((state) => state.clearAssistantMessages);

  return async () => {
    try {
      await importLocalData();
      clearAssistantMessages();
      await refreshAfterImport(queryClient);
      toast.success('Browser data imported');
    } catch (error) {
      notifyError(error);
    }
  };
}
