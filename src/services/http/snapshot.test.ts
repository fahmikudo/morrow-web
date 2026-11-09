import { describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { ServerSnapshot } from '@/types/server';
import { hydrateSnapshot } from './snapshot';

const snapshot: ServerSnapshot = {
  version: 6,
  inbox: [
    {
      id: 'i_1',
      title: 'Active',
      type: 'note',
      createdAt: '2026-11-08T03:15:27.412Z',
    },
    {
      id: 'i_2',
      title: 'Archived',
      type: 'note',
      createdAt: '2026-11-07T03:15:27.412Z',
      archivedAt: '2026-11-08T03:15:27.412Z',
    },
  ],
  tasks: [
    {
      id: 't_1',
      key: 'SB-1',
      title: 'Task',
      type: 'task',
      status: 'todo',
      priority: 'medium',
      labels: [],
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-01T00:00:00.000Z',
    },
  ],
  projects: [],
  notes: [],
  events: [],
  areas: [],
  habits: [
    {
      id: 'h_1',
      title: 'Active habit',
      cadence: 'weekly',
      target: 3,
      schedule: { kind: 'flexible' },
      startDate: '2026-10-01',
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    },
    {
      id: 'h_2',
      title: 'Archived habit',
      cadence: 'daily',
      target: 1,
      schedule: { kind: 'fixed', weekdays: [1] },
      startDate: '2026-10-01',
      archivedAt: '2026-11-01T00:00:00.000Z',
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-11-01T00:00:00.000Z',
    },
  ],
  habitCheckIns: [
    {
      id: 'hc_1',
      habitId: 'h_1',
      date: '2026-11-08',
      createdAt: '2026-11-08T00:00:00.000Z',
    },
  ],
  profile: {
    id: 'me',
    name: 'Raka Pratama',
    email: 'raka@example.com',
    joinedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-11-08T03:15:27.412Z',
  },
  counters: { none: 1 },
  integrations: {
    'google-calendar': { enabled: true, connected: false },
    'softwareseni-pepy': { enabled: true, connected: false },
  },
  ai: {
    enabled: false,
    provider: 'deepseek',
    model: 'deepseek-chat',
    status: 'untested',
    keyConfigured: false,
  },
  serverTime: '2026-11-08T03:15:27.412Z',
};

describe('snapshot hydration', () => {
  it('seeds every query cache from the snapshot', () => {
    const queryClient = new QueryClient();
    hydrateSnapshot(queryClient, snapshot);

    expect(queryClient.getQueryData(['profile'])).toEqual(snapshot.profile);
    expect(queryClient.getQueryData<Array<{ id: string }>>(['inbox'])).toEqual([
      expect.objectContaining({ id: 'i_1' }),
    ]);
    expect(queryClient.getQueryData<Array<{ id: string }>>(['inbox', 'archived'])).toEqual([
      expect.objectContaining({ id: 'i_2' }),
    ]);
    expect(queryClient.getQueryData<Array<{ id: string }>>(['habits'])).toEqual([
      expect.objectContaining({ id: 'h_1' }),
    ]);
    expect(queryClient.getQueryData<Array<{ id: string }>>(['habits', 'archived'])).toEqual([
      expect.objectContaining({ id: 'h_2' }),
    ]);
    expect(queryClient.getQueryData(['habits', 'check-ins'])).toEqual(snapshot.habitCheckIns);
    expect(queryClient.getQueryData(['tasks'])).toEqual(snapshot.tasks);
    expect(queryClient.getQueryData(['settings'])).toEqual({
      integrations: snapshot.integrations,
      ai: snapshot.ai,
      aiModels: [],
      aiEffort: null,
      googleCalendarConfigured: false,
      features: {},
    });
  });
});
