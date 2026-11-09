import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SETTINGS_STORAGE_KEY, createSettingsRepository, loadSettings } from './settings';

const repo = createSettingsRepository();

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('mock settings repository', () => {
  it('starts from the DeepSeek default state', async () => {
    const settings = await repo.get();

    expect(settings.integrations['google-calendar']).toEqual({ enabled: true, connected: false });
    expect(Object.keys(settings.integrations)).toHaveLength(2);
    expect(settings.ai).toMatchObject({
      enabled: false,
      provider: 'deepseek',
      model: 'deepseek-flash',
      status: 'untested',
      keyConfigured: false,
    });
    expect('localBaseUrl' in settings.ai).toBe(false);
    expect(settings.aiModels).toEqual([
      {
        id: 'deepseek-flash',
        name: 'DeepSeek Flash',
        contextWindow: 1048576,
        effortLevels: ['none', 'low', 'high', 'max'],
      },
      {
        id: 'deepseek-v4-pro',
        name: 'DeepSeek V4 Pro',
        contextWindow: 1048576,
        effortLevels: ['none', 'low', 'high', 'max'],
      },
    ]);
    expect(settings.aiEffort).toBeNull();
  });

  it('follows the integration state machine', async () => {
    await repo.setIntegrationEnabled('google-calendar', false);
    await expect(repo.connect('google-calendar')).rejects.toThrow('Integration is disabled');

    await repo.setIntegrationEnabled('google-calendar', true);
    await expect(repo.sync('google-calendar')).rejects.toThrow('Integration is not connected');

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-08T03:00:00.000Z'));
    const connected = await repo.connect('google-calendar');
    expect(connected.connected).toBe(true);
    expect(connected.lastSyncAt).toBe('2026-11-08T03:00:00.000Z');

    const firstSync = connected.lastSyncAt;
    vi.setSystemTime(new Date('2026-11-08T03:05:00.000Z'));
    const synced = await repo.sync('google-calendar');
    expect(synced.lastSyncAt).not.toBe(firstSync);
    expect(synced.lastSyncAt).toBe('2026-11-08T03:05:00.000Z');

    const disconnected = await repo.disconnect('google-calendar');
    expect(disconnected.connected).toBe(false);
    expect(disconnected.lastSyncAt).toBe(synced.lastSyncAt);
  });

  it('keeps lastSyncAt when disabling', async () => {
    const connected = await repo.connect('softwareseni-pepy');
    const disabled = await repo.setIntegrationEnabled('softwareseni-pepy', false);

    expect(disabled.enabled).toBe(false);
    expect(disabled.connected).toBe(false);
    expect(disabled.lastSyncAt).toBe(connected.lastSyncAt);
  });

  it('updates the DeepSeek model and rejects unknown models', async () => {
    const updated = await repo.updateAi({ model: 'deepseek-v4-pro', enabled: true });
    expect(updated.model).toBe('deepseek-v4-pro');
    expect(updated.enabled).toBe(true);
    expect(updated.provider).toBe('deepseek');

    await expect(repo.updateAi({ model: 'gpt-4o-mini' })).rejects.toThrow('Unknown model');

    await repo.updateAi({ reasoningEffort: 'high' });
    expect((await repo.get()).aiEffort).toBe('high');

    await repo.updateAi({ reasoningEffort: null });
    expect((await repo.get()).aiEffort).toBeNull();
  });

  it('reports a failed test without a server key', async () => {
    const result = await repo.testAi();

    expect(result.ok).toBe(false);
    expect(result.status).toBe('error');
    expect(result.message).toBe('DeepSeek API key is not configured');

    const settings = await repo.get();
    expect(settings.ai.status).toBe('error');
    expect(settings.ai.lastTestedAt).toBe(result.testedAt);
  });

  it('migrates the legacy Zustand payload to DeepSeek', async () => {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        state: {
          integrations: {
            'google-calendar': { enabled: false, connected: true, lastSyncAt: '2026-11-01T00:00:00.000Z' },
          },
          aiEnabled: true,
          aiProvider: 'anthropic',
          aiModel: 'claude-opus-4-1',
          localBaseUrl: 'http://localhost:11434/v1',
        },
        version: 0,
      }),
    );

    const settings = loadSettings();

    expect(settings.integrations['google-calendar']).toEqual({
      enabled: false,
      connected: true,
      lastSyncAt: '2026-11-01T00:00:00.000Z',
    });
    // Missing integrations fall back to the defaults.
    expect(settings.integrations['softwareseni-pepy']).toEqual({ enabled: true, connected: false });
    expect(settings.ai).toMatchObject({
      enabled: true,
      provider: 'deepseek',
      model: 'deepseek-flash',
      status: 'untested',
      keyConfigured: false,
    });
    expect('localBaseUrl' in settings.ai).toBe(false);
  });

  it('ignores malformed storage', () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, 'not json');

    const ai = loadSettings().ai;
    expect(ai.provider).toBe('deepseek');
    expect(ai.model).toBe('deepseek-flash');
  });
});
