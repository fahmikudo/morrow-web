import type { SettingsRepository } from '@/services/repositories/contracts';
import type {
  AiSettings,
  AiTestResult,
  GoogleCalendar,
  IntegrationConnection,
  IntegrationId,
  SettingsState,
  UpdateAiSettings,
} from '@/types/settings';
import { request } from './client';

export function createSettingsRepository(baseUrl: string): SettingsRepository {
  return {
    get: async () => {
      const settings = await request<SettingsState>(baseUrl, '/settings');

      return {
        ...settings,
        aiModels: settings.aiModels ?? [],
        aiEffort: settings.aiEffort ?? null,
      };
    },
    setIntegrationEnabled: (id: IntegrationId, enabled: boolean) =>
      request<IntegrationConnection>(baseUrl, `/integrations/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: { enabled },
      }),
    connect: (id: IntegrationId) =>
      request<IntegrationConnection>(baseUrl, `/integrations/${encodeURIComponent(id)}/connect`, {
        method: 'POST',
      }),
    disconnect: (id: IntegrationId) =>
      request<IntegrationConnection>(
        baseUrl,
        `/integrations/${encodeURIComponent(id)}/disconnect`,
        { method: 'POST' },
      ),
    sync: (id: IntegrationId) =>
      request<IntegrationConnection>(baseUrl, `/integrations/${encodeURIComponent(id)}/sync`, {
        method: 'POST',
      }),
    updateAi: (patch: UpdateAiSettings) =>
      request<AiSettings>(baseUrl, '/ai', { method: 'PATCH', body: patch }),
    testAi: () => request<AiTestResult>(baseUrl, '/ai/test', { method: 'POST' }),
    pepyConnect: () =>
      request<IntegrationConnection>(baseUrl, '/pepy/connect', { method: 'POST' }),
    pepySync: () =>
      request<IntegrationConnection>(baseUrl, '/pepy/sync', { method: 'POST' }),
    pepyDisconnect: () =>
      request<void>(baseUrl, '/pepy/disconnect', { method: 'POST' }),
    googleAuthorizationUrl: async () => {
      const response = await request<{ authorizationUrl: string }>(
        baseUrl,
        '/google-calendar/oauth/start',
        { method: 'POST' },
      );
      return response.authorizationUrl;
    },
    googleCalendars: () => request<GoogleCalendar[]>(baseUrl, '/google-calendar/calendars'),
    selectGoogleCalendar: (calendarId: string) =>
      request<IntegrationConnection>(baseUrl, '/google-calendar/calendar', {
        method: 'PUT',
        body: { calendarId },
      }),
    syncGoogleCalendar: () =>
      request<IntegrationConnection>(baseUrl, '/google-calendar/sync', { method: 'POST' }),
    disconnectGoogleCalendar: () =>
      request<void>(baseUrl, '/google-calendar/disconnect', { method: 'POST' }),
  };
}
