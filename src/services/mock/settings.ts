import type {
  AiEffortLevel,
  AiModel,
  AiProvider,
  AiSettings,
  AiTestResult,
  IntegrationConnection,
  IntegrationId,
  SettingsState,
  UpdateAiSettings,
} from '@/types/settings';

export const SETTINGS_STORAGE_KEY = 'second-brain:settings:v1';

const PROVIDER: AiProvider = 'deepseek';

const EFFORT_LEVELS: AiEffortLevel[] = ['none', 'low', 'high', 'max'];

/** Mirrors the server catalogue so the local demo renders the same controls. */
export const MOCK_AI_MODELS: AiModel[] = [
  {
    id: 'deepseek-flash',
    name: 'DeepSeek Flash',
    contextWindow: 1048576,
    effortLevels: EFFORT_LEVELS,
  },
  {
    id: 'deepseek-v4-pro',
    name: 'DeepSeek V4 Pro',
    contextWindow: 1048576,
    effortLevels: EFFORT_LEVELS,
  },
];

const INTEGRATION_IDS: IntegrationId[] = ['google-calendar', 'softwareseni-pepy'];

export function defaultIntegrations(): Record<IntegrationId, IntegrationConnection> {
  return INTEGRATION_IDS.reduce(
    (acc, id) => ({ ...acc, [id]: { enabled: true, connected: false } }),
    {} as Record<IntegrationId, IntegrationConnection>,
  );
}

function defaultAi(): AiSettings {
  return {
    enabled: false,
    provider: PROVIDER,
    model: MOCK_AI_MODELS[0].id,
    status: 'untested',
    keyConfigured: false,
  };
}

function defaultSettings(): SettingsState {
  return {
    integrations: defaultIntegrations(),
    ai: defaultAi(),
    aiModels: MOCK_AI_MODELS,
    aiEffort: null,
    googleCalendarConfigured: false,
    features: { 'softwareseni-pepy': false },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isEffortLevel(value: unknown): value is AiEffortLevel {
  return typeof value === 'string' && EFFORT_LEVELS.includes(value as AiEffortLevel);
}

function mergeIntegrations(value: unknown): Record<IntegrationId, IntegrationConnection> {
  const stored = isRecord(value) ? value : {};
  return INTEGRATION_IDS.reduce((acc, id) => {
    const entry = stored[id];
    const connection = isRecord(entry) ? entry : {};
    return {
      ...acc,
      [id]: {
        enabled: typeof connection.enabled === 'boolean' ? connection.enabled : true,
        connected: typeof connection.connected === 'boolean' ? connection.connected : false,
        ...(typeof connection.lastSyncAt === 'string'
          ? { lastSyncAt: connection.lastSyncAt }
          : {}),
      },
    };
  }, {} as Record<IntegrationId, IntegrationConnection>);
}

/** Old provider choices and local endpoints collapse into DeepSeek. */
function mergeAi(stored: Record<string, unknown>): AiSettings {
  const defaults = defaultAi();
  const nested = isRecord(stored.ai) ? stored.ai : undefined;

  const enabled = nested?.enabled ?? stored.aiEnabled;
  const model = nested?.model ?? stored.aiModel;
  const rawStatus = nested?.status;
  const status =
    rawStatus === 'ok' || rawStatus === 'error' || rawStatus === 'untested'
      ? rawStatus
      : defaults.status;
  const lastTestedAt = nested?.lastTestedAt;
  const keyConfigured = nested?.keyConfigured === true;
  const knownModel =
    typeof model === 'string' && MOCK_AI_MODELS.some((entry) => entry.id === model);

  return {
    ...defaults,
    enabled: typeof enabled === 'boolean' ? enabled : defaults.enabled,
    model: knownModel ? (model as string) : defaults.model,
    status,
    keyConfigured,
    ...(typeof lastTestedAt === 'string' ? { lastTestedAt } : {}),
  };
}

/** Migrates the legacy Zustand envelope (`{state: {...}}`) and the current shape. */
export function loadSettings(): SettingsState {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
  } catch {
    return defaultSettings();
  }
  if (!raw) return defaultSettings();

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return defaultSettings();
  }
  if (!isRecord(parsed)) return defaultSettings();

  const stored = isRecord(parsed.state) ? parsed.state : parsed;
  return {
    integrations: mergeIntegrations(stored.integrations),
    ai: mergeAi(stored),
    aiModels: MOCK_AI_MODELS,
    aiEffort: isEffortLevel(stored.aiEffort) ? stored.aiEffort : null,
    googleCalendarConfigured: false,
    features: { 'softwareseni-pepy': false },
  };
}

function saveSettings(settings: SettingsState): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Settings stay in memory for the session when storage is unavailable.
  }
}

function update(mutate: (settings: SettingsState) => SettingsState): SettingsState {
  const next = mutate(loadSettings());
  saveSettings(next);
  return next;
}

export function createSettingsRepository() {
  return {
    async get(): Promise<SettingsState> {
      return loadSettings();
    },

    async setIntegrationEnabled(
      id: IntegrationId,
      enabled: boolean,
    ): Promise<IntegrationConnection> {
      const next = update((settings) => {
        const current = settings.integrations[id];
        return {
          ...settings,
          integrations: {
            ...settings.integrations,
            [id]: { ...current, enabled, connected: false },
          },
        };
      });
      return next.integrations[id];
    },

    async connect(id: IntegrationId): Promise<IntegrationConnection> {
      const current = loadSettings().integrations[id];
      if (!current.enabled) throw new Error('Integration is disabled');

      const next = update((settings) => ({
        ...settings,
        integrations: {
          ...settings.integrations,
          [id]: {
            ...settings.integrations[id],
            connected: true,
            lastSyncAt: new Date().toISOString(),
          },
        },
      }));
      return next.integrations[id];
    },

    async disconnect(id: IntegrationId): Promise<IntegrationConnection> {
      const next = update((settings) => ({
        ...settings,
        integrations: {
          ...settings.integrations,
          [id]: { ...settings.integrations[id], connected: false },
        },
      }));
      return next.integrations[id];
    },

    async sync(id: IntegrationId): Promise<IntegrationConnection> {
      const current = loadSettings().integrations[id];
      if (!current.enabled || !current.connected) {
        throw new Error('Integration is not connected');
      }

      const next = update((settings) => ({
        ...settings,
        integrations: {
          ...settings.integrations,
          [id]: { ...settings.integrations[id], lastSyncAt: new Date().toISOString() },
        },
      }));
      return next.integrations[id];
    },

    async updateAi(patch: UpdateAiSettings): Promise<AiSettings> {
      const next = update((settings) => {
        const ai = { ...settings.ai };
        let aiEffort = settings.aiEffort;

        if (patch.enabled !== undefined) ai.enabled = patch.enabled;

        if (patch.model !== undefined) {
          if (!MOCK_AI_MODELS.some((model) => model.id === patch.model)) {
            throw new Error('Unknown model');
          }
          ai.model = patch.model;
        }

        if (patch.reasoningEffort !== undefined) {
          aiEffort = patch.reasoningEffort;
        }

        if (patch.apiKey !== undefined) {
          ai.keyConfigured = patch.apiKey !== null;
          ai.status = 'untested';
          delete ai.lastTestedAt;
        }

        return { ...settings, ai, aiEffort };
      });
      return next.ai;
    },

    async testAi(): Promise<AiTestResult> {
      const testedAt = new Date().toISOString();
      const configured = loadSettings().ai.keyConfigured;

      update((settings) => ({
        ...settings,
        ai: { ...settings.ai, status: 'error', lastTestedAt: testedAt },
      }));

      return {
        ok: false,
        status: 'error',
        message: configured
          ? 'Mock mode cannot reach DeepSeek'
          : 'DeepSeek API key is not configured',
        testedAt,
      };
    },

    async pepyConnect(): Promise<IntegrationConnection> {
      const next = update((settings) => ({
        ...settings,
        integrations: {
          ...settings.integrations,
          'softwareseni-pepy': {
            ...settings.integrations['softwareseni-pepy'],
            connected: true,
            accountEmail: 'fahmi@softwareseni.com',
          },
        },
      }));
      return next.integrations['softwareseni-pepy'];
    },

    async pepySync(): Promise<IntegrationConnection> {
      const next = update((settings) => ({
        ...settings,
        integrations: {
          ...settings.integrations,
          'softwareseni-pepy': {
            ...settings.integrations['softwareseni-pepy'],
            connected: true,
            lastSyncAt: new Date().toISOString(),
          },
        },
      }));
      return next.integrations['softwareseni-pepy'];
    },

    async pepyDisconnect(): Promise<void> {
      update((settings) => ({
        ...settings,
        integrations: {
          ...settings.integrations,
          'softwareseni-pepy': {
            ...settings.integrations['softwareseni-pepy'],
            connected: false,
            accountEmail: undefined,
            lastSyncAt: undefined,
            lastError: undefined,
          },
        },
      }));
    },

    async googleAuthorizationUrl(): Promise<string> {
      return '';
    },

    async googleCalendars() {
      return [];
    },

    async selectGoogleCalendar(calendarId: string): Promise<IntegrationConnection> {
      const next = update((settings) => ({
        ...settings,
        integrations: {
          ...settings.integrations,
          'google-calendar': {
            ...settings.integrations['google-calendar'],
            calendarId,
          },
        },
      }));
      return next.integrations['google-calendar'];
    },

    async syncGoogleCalendar(): Promise<IntegrationConnection> {
      const next = update((settings) => ({
        ...settings,
        integrations: {
          ...settings.integrations,
          'google-calendar': {
            ...settings.integrations['google-calendar'],
            connected: true,
            lastSyncAt: new Date().toISOString(),
          },
        },
      }));
      return next.integrations['google-calendar'];
    },

    async disconnectGoogleCalendar(): Promise<void> {
      update((settings) => ({
        ...settings,
        integrations: {
          ...settings.integrations,
          'google-calendar': {
            ...settings.integrations['google-calendar'],
            connected: false,
            accountEmail: undefined,
            calendarId: undefined,
            lastError: undefined,
            lastSyncAt: undefined,
          },
        },
      }));
    },
  };
}
