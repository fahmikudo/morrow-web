export type ReminderKind = 'task' | 'event' | 'habit';

export type Reminder = {
  id: string;
  kind: ReminderKind;
  refId: string;
  title: string;
  body: string;
  href: string;
  occurrenceDate: string;
  sentAt: string;
  dismissedAt?: string;
};

export type ReminderSettings = {
  enabled: boolean;
  taskTime: string;
  eventLeadMinutes: number;
};

export type ReminderSettingsPatch = Partial<ReminderSettings>;

export type PushConfig = {
  enabled: boolean;
  publicKey: string;
};

export type PushSubscribePayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};
