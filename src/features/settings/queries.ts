import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@heroui/react';
import { notifyError } from '@/lib/toast';
import { eventKeys } from '@/features/calendar/queries';
import { repositories } from '@/services';
import type { IntegrationId, UpdateAiSettings } from '@/types/settings';

export const settingsKeys = {
  all: ['settings'] as const,
  googleCalendars: ['google', 'calendars'] as const,
};

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: () => repositories.settings.get(),
  });
}

function useSettingsMutation<Args>(
  mutationFn: (args: Args) => Promise<unknown>,
  successMessage: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.all });
      toast.success(successMessage);
    },
    onError: notifyError,
  });
}

export function useSetIntegrationEnabled() {
  return useSettingsMutation(
    ({ id, enabled }: { id: IntegrationId; enabled: boolean }) =>
      repositories.settings.setIntegrationEnabled(id, enabled),
    'Integration updated',
  );
}

export function useConnectIntegration() {
  return useSettingsMutation(
    (id: IntegrationId) => repositories.settings.connect(id),
    'Integration connected',
  );
}

export function useDisconnectIntegration() {
  return useSettingsMutation(
    (id: IntegrationId) => repositories.settings.disconnect(id),
    'Integration disconnected',
  );
}

export function useSyncIntegration() {
  return useSettingsMutation(
    (id: IntegrationId) => repositories.settings.sync(id),
    'Integration synced',
  );
}

export function useUpdateAiSettings() {
  return useSettingsMutation(
    (patch: UpdateAiSettings) => repositories.settings.updateAi(patch),
    'AI settings updated',
  );
}

export function useTestAiConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => repositories.settings.testAi(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
    onError: notifyError,
  });
}

export function usePepyConnect() {
  return useSettingsMutation(
    () => repositories.settings.pepyConnect(),
    'Pepy connected',
  );
}

export function usePepySync() {
  return useSettingsMutation(
    () => repositories.settings.pepySync(),
    'Pepy synced',
  );
}

export function usePepyDisconnect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => repositories.settings.pepyDisconnect(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.all });
      toast.success('Pepy disconnected');
    },
    onError: notifyError,
  });
}

export function useGoogleOAuthStart() {
  return useMutation({
    mutationFn: () => repositories.settings.googleAuthorizationUrl(),
    onError: notifyError,
  });
}

export function useGoogleCalendars(enabled: boolean) {
  return useQuery({
    queryKey: settingsKeys.googleCalendars,
    queryFn: () => repositories.settings.googleCalendars(),
    enabled,
  });
}

export function useSelectGoogleCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (calendarId: string) => repositories.settings.selectGoogleCalendar(calendarId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.all });
      void queryClient.invalidateQueries({ queryKey: eventKeys.all });
      toast.success('Calendar selected');
    },
    onError: notifyError,
  });
}

export function useSyncGoogleCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => repositories.settings.syncGoogleCalendar(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.all });
      void queryClient.invalidateQueries({ queryKey: eventKeys.all });
      toast.success('Google Calendar synced');
    },
    onError: notifyError,
  });
}

export function useDisconnectGoogleCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => repositories.settings.disconnectGoogleCalendar(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.all });
      void queryClient.invalidateQueries({ queryKey: eventKeys.all });
      toast.success('Google Calendar disconnected');
    },
    onError: notifyError,
  });
}

export const apiTokenKeys = {
  all: ['api-tokens'] as const,
};

export function useApiTokens() {
  return useQuery({
    queryKey: apiTokenKeys.all,
    queryFn: () => repositories.tokens.list(),
  });
}

export function useCreateApiToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => repositories.tokens.create(name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: apiTokenKeys.all });
      toast.success('Token created');
    },
    onError: notifyError,
  });
}

export function useRevokeApiToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => repositories.tokens.revoke(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: apiTokenKeys.all });
      toast.success('Token revoked');
    },
    onError: notifyError,
  });
}
