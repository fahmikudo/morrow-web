import type { ReminderRepository } from '@/services/repositories/contracts';
import type {
  PushConfig,
  PushSubscribePayload,
  Reminder,
  ReminderSettings,
  ReminderSettingsPatch,
} from '@/types/reminders';
import { request } from './client';

export function createReminderRepository(baseUrl: string): ReminderRepository {
  return {
    today: () => request<Reminder[]>(baseUrl, '/reminders'),
    dismiss: (id: string) =>
      request<void>(baseUrl, `/reminders/${encodeURIComponent(id)}/dismiss`, {
        method: 'POST',
      }),
    getSettings: () => request<ReminderSettings>(baseUrl, '/reminders/settings'),
    updateSettings: (patch: ReminderSettingsPatch) =>
      request<ReminderSettings>(baseUrl, '/reminders/settings', {
        method: 'PATCH',
        body: patch,
      }),
    pushConfig: () => request<PushConfig>(baseUrl, '/push/config'),
    subscribe: (payload: PushSubscribePayload) =>
      request<void>(baseUrl, '/push/subscriptions', {
        method: 'POST',
        body: payload,
      }),
    unsubscribe: (endpoint: string) =>
      request<void>(baseUrl, '/push/subscriptions', {
        method: 'DELETE',
        body: { endpoint },
      }),
  };
}
