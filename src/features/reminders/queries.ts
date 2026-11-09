import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@heroui/react';
import { notifyError } from '@/lib/toast';
import { isServerMode, repositories } from '@/services';
import type { ReminderSettingsPatch } from '@/types/reminders';
import { disablePush, enablePush } from './push-client';

export const reminderKeys = {
  all: ['reminders'] as const,
  settings: ['reminders', 'settings'] as const,
  pushConfig: ['push', 'config'] as const,
};

export function useReminders() {
  return useQuery({
    queryKey: reminderKeys.all,
    queryFn: () => repositories.reminders.today(),
    enabled: isServerMode,
    refetchInterval: 60_000,
  });
}

export function useReminderSettings() {
  return useQuery({
    queryKey: reminderKeys.settings,
    queryFn: () => repositories.reminders.getSettings(),
    enabled: isServerMode,
  });
}

export function useUpdateReminderSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: ReminderSettingsPatch) => repositories.reminders.updateSettings(patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reminderKeys.all });
      toast.success('Reminder settings updated');
    },
    onError: notifyError,
  });
}

export function useDismissReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => repositories.reminders.dismiss(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reminderKeys.all });
      toast.success('Reminder dismissed');
    },
    onError: notifyError,
  });
}

export function usePushConfig() {
  return useQuery({
    queryKey: reminderKeys.pushConfig,
    queryFn: () => repositories.reminders.pushConfig(),
    enabled: isServerMode,
  });
}

export function useEnablePush() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const config = await repositories.reminders.pushConfig();
      const subscription = await enablePush(config.publicKey);
      const json = subscription.toJSON();
      const p256dh = json.keys?.p256dh;
      const auth = json.keys?.auth;

      if (!json.endpoint || !p256dh || !auth) {
        throw new Error('The browser returned an incomplete subscription.');
      }

      await repositories.reminders.subscribe({
        endpoint: json.endpoint,
        keys: { p256dh, auth },
      });

      return subscription;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reminderKeys.pushConfig });
      toast.success('Notifications enabled');
    },
    onError: notifyError,
  });
}

export function useDisablePush() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const endpoint = await disablePush();
      if (endpoint) await repositories.reminders.unsubscribe(endpoint);
      return endpoint;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reminderKeys.pushConfig });
      toast.success('Notifications disabled');
    },
    onError: notifyError,
  });
}
