export type IntegrationId = 'google-calendar' | 'softwareseni-pepy';

export type IntegrationConnection = {
  /** Master switch: a disabled integration cannot be connected or synced. */
  enabled: boolean;
  connected: boolean;
  lastSyncAt?: string;
  /** Google account that granted access. */
  accountEmail?: string;
  /** Calendar currently imported and written by Google Calendar. */
  calendarId?: string;
  /** Last provider error, cleared by a successful sync. */
  lastError?: string;
};

export type GoogleCalendar = {
  id: string;
  summary: string;
  primary: boolean;
  accessRole: string;
};

/** The API talks to DeepSeek only. */
export type AiProvider = 'deepseek';

export type AiTestStatus = 'untested' | 'ok' | 'error';

export type AiEffortLevel = 'none' | 'low' | 'high' | 'max';

/** `null` means "let the provider pick its default effort". */
export type AiEffort = AiEffortLevel | null;

export type AiModel = {
  id: string;
  name: string;
  contextWindow: number;
  effortLevels: AiEffortLevel[];
};

export type AiSettings = {
  enabled: boolean;
  provider: AiProvider;
  model: string;
  status: AiTestStatus;
  lastTestedAt?: string;
  /** This account stored a DeepSeek API key. The key itself is never returned. */
  keyConfigured: boolean;
};

export type AiTestResult = {
  ok: boolean;
  status: AiTestStatus;
  message: string;
  testedAt: string;
};

export type SettingsState = {
  integrations: Record<IntegrationId, IntegrationConnection>;
  ai: AiSettings;
  /** Server-side catalogue; empty when the server exposes no models. */
  aiModels: AiModel[];
  aiEffort: AiEffort;
  /** Google OAuth client + encryption key are present on the server. */
  googleCalendarConfigured: boolean;
  /** Per-account integration feature gates. */
  features: Record<string, boolean>;
};

export type UpdateAiSettings = {
  enabled?: boolean;
  model?: string;
  /** Write-only: a string stores it, `null` removes it. */
  apiKey?: string | null;
  reasoningEffort?: AiEffort;
};
