import type { QueryClient } from '@tanstack/react-query';
import type { ServerSnapshot } from '@/types/server';
import type { SettingsState } from '@/types/settings';
import { request } from './client';

export const SNAPSHOT_STORAGE_KEY = 'second-brain:snapshot:v1';

export function fetchSnapshot(baseUrl: string): Promise<ServerSnapshot> {
  return request<ServerSnapshot>(baseUrl, '/snapshot');
}

export function readSnapshotCache(): ServerSnapshot | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ServerSnapshot;
  } catch {
    return null;
  }
}

export function writeSnapshotCache(snapshot: ServerSnapshot): void {
  try {
    localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // The cache is best effort; queries still hold the fresh data.
  }
}

export function clearSnapshotCache(): void {
  try {
    localStorage.removeItem(SNAPSHOT_STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}

/**
 * Seeds every read cache from a snapshot. Active/archived lists are split here
 * so the existing query keys keep working unchanged.
 */
export function hydrateSnapshot(queryClient: QueryClient, snapshot: ServerSnapshot): void {
  queryClient.setQueryData(['profile'], snapshot.profile);
  queryClient.setQueryData(
    ['inbox'],
    snapshot.inbox.filter((item) => !item.archivedAt),
  );
  queryClient.setQueryData(
    ['inbox', 'archived'],
    snapshot.inbox.filter((item) => Boolean(item.archivedAt)),
  );
  queryClient.setQueryData(['tasks'], snapshot.tasks);
  queryClient.setQueryData(['projects'], snapshot.projects);
  queryClient.setQueryData(['notes'], snapshot.notes);
  queryClient.setQueryData(['events'], snapshot.events);
  queryClient.setQueryData(['areas'], snapshot.areas);
  queryClient.setQueryData(
    ['habits'],
    snapshot.habits.filter((habit) => !habit.archivedAt),
  );
  queryClient.setQueryData(
    ['habits', 'archived'],
    snapshot.habits.filter((habit) => Boolean(habit.archivedAt)),
  );
  queryClient.setQueryData(['habits', 'check-ins'], snapshot.habitCheckIns);
  queryClient.setQueryData<SettingsState>(['settings'], (current) => ({
    integrations: snapshot.integrations,
    ai: snapshot.ai,
    aiModels: current?.aiModels ?? [],
    aiEffort: current?.aiEffort ?? null,
    googleCalendarConfigured: current?.googleCalendarConfigured ?? false,
    features: current?.features ?? {},
  }));
}
