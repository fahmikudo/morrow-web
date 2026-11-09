import type { ReminderRepository } from '@/services/repositories/contracts';
import type { ReminderSettings } from '@/types/reminders';

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: false,
  taskTime: '09:00',
  eventLeadMinutes: 15,
};

/** Reminders are a server feature; the local demo keeps the card inert. */
export function createReminderRepository(): ReminderRepository {
  let settings = { ...DEFAULT_SETTINGS };

  return {
    today: async () => [],
    dismiss: async () => {},
    getSettings: async () => settings,
    updateSettings: async (patch) => {
      settings = { ...settings, ...patch };
      return settings;
    },
    pushConfig: async () => ({ enabled: false, publicKey: '' }),
    subscribe: async () => {},
    unsubscribe: async () => {},
  };
}
