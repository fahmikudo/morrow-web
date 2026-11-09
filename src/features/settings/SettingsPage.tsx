import { useEffect, useState } from 'react';
import { CircleCheck, Copy, Download, KeyRound, LogOut, Plus, RefreshCw, Server, TriangleAlert } from 'lucide-react';
import {
  Avatar,
  Button,
  Checkbox,
  FieldError,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  TextField,
  toast,
  useTheme,
} from '@heroui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { AppTag } from '@/components/shared/AppTag';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { RelativeTime } from '@/components/shared/RelativeTime';
import { ProfileDialog } from '@/features/profile/ProfileDialog';
import { eventKeys } from '@/features/calendar/queries';
import { useProfile } from '@/features/profile/queries';
import { NotificationsCard } from '@/features/reminders/NotificationsCard';
import { initials } from '@/lib/initials';
import { apiBaseUrl, isServerMode } from '@/services';
import { createAuthClient } from '@/services/http/auth';
import { clearSnapshotCache } from '@/services/http/snapshot';
import { useUiStore } from '@/stores/ui-store';
import type { AiEffortLevel, AiModel } from '@/types/settings';
import { AI_MODELS, AI_PROVIDER } from './ai';
import { INTEGRATIONS } from './integrations';
import {
  useApiTokens,
  useConnectIntegration,
  useCreateApiToken,
  useDisconnectIntegration,
  useRevokeApiToken,
  useDisconnectGoogleCalendar,
  useGoogleCalendars,
  settingsKeys,
  useGoogleOAuthStart,
  usePepyConnect,
  usePepyDisconnect,
  usePepySync,
  useSelectGoogleCalendar,
  useSetIntegrationEnabled,
  useSettings,
  useSyncGoogleCalendar,
  useSyncIntegration,
  useTestAiConnection,
  useUpdateAiSettings,
} from './queries';
import { useImportLocalData } from './use-reset-demo';
import type { ApiToken, CreatedApiToken } from '@/types/tokens';

const THEME_OPTIONS = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
] as const;

const EFFORT_LABELS: Record<AiEffortLevel, string> = {
  none: 'None',
  low: 'Low',
  high: 'High',
  max: 'Max',
};

/** Used until the server exposes its catalogue. */
const FALLBACK_MODEL_OPTIONS: AiModel[] = AI_MODELS.map((id) => ({
  id,
  name: id,
  contextWindow: 0,
  effortLevels: [],
}));

const tokenSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(80, 'Keep the name under 80 characters'),
});

type TokenValues = z.infer<typeof tokenSchema>;

export function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme('system');
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: profile } = useProfile();
  const { data: settings } = useSettings();
  const importLocalData = useImportLocalData();
  const clearAssistantMessages = useUiStore((state) => state.clearAssistantMessages);

  const setIntegrationEnabled = useSetIntegrationEnabled();
  const connectIntegration = useConnectIntegration();
  const disconnectIntegration = useDisconnectIntegration();
  const syncIntegration = useSyncIntegration();
  const startGoogleOAuth = useGoogleOAuthStart();
  const connectPepy = usePepyConnect();
  const syncPepy = usePepySync();
  const disconnectPepy = usePepyDisconnect();
  const syncGoogleCalendar = useSyncGoogleCalendar();
  const disconnectGoogleCalendar = useDisconnectGoogleCalendar();
  const selectGoogleCalendar = useSelectGoogleCalendar();
  const updateAi = useUpdateAiSettings();
  const testAi = useTestAiConnection();

  const { data: tokens } = useApiTokens();
  const createApiToken = useCreateApiToken();
  const revokeApiToken = useRevokeApiToken();

  const ai = settings?.ai;
  const integrations = settings?.integrations;
  const googleConnection = integrations?.['google-calendar'];
  const googleConnected = Boolean(googleConnection?.connected);
  const googleConfigured = settings?.googleCalendarConfigured ?? false;
  const visibleIntegrations = INTEGRATIONS.filter(
    (integration) => settings?.features?.[integration.id] !== false,
  );
  const { data: googleCalendars } = useGoogleCalendars(isServerMode && googleConnected);

  const [apiKey, setApiKey] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCreateTokenOpen, setIsCreateTokenOpen] = useState(false);
  const [createdToken, setCreatedToken] = useState<CreatedApiToken | null>(null);
  const [tokenToRevoke, setTokenToRevoke] = useState<ApiToken | null>(null);

  const tokenForm = useForm<TokenValues>({
    resolver: zodResolver(tokenSchema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    const status = searchParams.get('google');
    if (!status) return;

    if (status === 'connected') toast.success('Google Calendar connected');
    else if (status === 'sync-error') {
      toast.danger('Google Calendar connected, but the first sync failed');
    } else {
      const reason = searchParams.get('reason');
      toast.danger(reason ? `Google Calendar: ${reason}` : 'Google Calendar connection failed');
    }

    void queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    void queryClient.invalidateQueries({ queryKey: eventKeys.all });
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams, queryClient]);

  const signOut = async () => {
    await createAuthClient(apiBaseUrl).logout();
    clearSnapshotCache();
    queryClient.clear();
    clearAssistantMessages();
    toast.success('Signed out');
    navigate('/login', { replace: true });
  };

  const keyConfigured = ai?.keyConfigured ?? false;

  const modelOptions =
    settings?.aiModels && settings.aiModels.length > 0
      ? settings.aiModels
      : FALLBACK_MODEL_OPTIONS;
  const selectedModel =
    modelOptions.find((model) => model.id === ai?.model) ?? modelOptions[0];
  const selectedModelId = selectedModel?.id ?? AI_MODELS[0];
  const effortLevels = selectedModel?.effortLevels ?? [];
  const aiEffort = settings?.aiEffort ?? null;
  const effortValue = aiEffort && effortLevels.includes(aiEffort) ? aiEffort : 'default';

  const onCreateToken = tokenForm.handleSubmit(async (values) => {
    try {
      const created = await createApiToken.mutateAsync(values.name);
      setIsCreateTokenOpen(false);
      tokenForm.reset();
      setCreatedToken(created);
    } catch {
      // The mutation hook already surfaced the error as a toast.
    }
  });

  const copyToken = async () => {
    if (!createdToken) return;
    try {
      await navigator.clipboard.writeText(createdToken.token);
      toast.success('Token copied');
    } catch {
      toast.danger('Clipboard is unavailable');
    }
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Workspace preferences, server connections, and the assistant."
      />

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Section
          title="Account"
          description="The profile stored on the server."
          action={
            <Button variant="secondary" size="sm" onPress={() => setIsProfileOpen(true)}>
              Edit profile
            </Button>
          }
        >
          <div className="flex items-center gap-3">
            <Avatar className="size-11">
              <Avatar.Fallback>{initials(profile?.name ?? 'Morrow')}</Avatar.Fallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {profile?.name ?? 'Loading…'}
              </p>
              <p className="truncate text-xs text-muted">{profile?.email ?? ''}</p>
              {profile?.role || profile?.timezone ? (
                <p className="truncate text-xs text-muted">
                  {[profile.role, profile.timezone].filter(Boolean).join(' · ')}
                </p>
              ) : null}
            </div>
          </div>
        </Section>

        <Section title="Appearance" description="The theme follows the workspace, not each page.">
          <div className="flex flex-wrap gap-2">
            {THEME_OPTIONS.map((option) => (
              <Button
                key={option.id}
                size="sm"
                variant={theme === option.id ? 'secondary' : 'ghost'}
                aria-pressed={theme === option.id}
                onPress={() => setTheme(option.id)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </Section>

        <Section
          title="Integrations"
          description="Server-owned connections. Google Calendar uses OAuth; Pepy sync is feature-gated per account."
          action={<AppTag>Server state</AppTag>}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleIntegrations.map((integration) => {
              const Icon = integration.icon;
              const connection = integrations?.[integration.id] ?? {
                enabled: true,
                connected: false,
              };
              const isGoogle = integration.id === 'google-calendar' && isServerMode;
              const isPepy = integration.id === 'softwareseni-pepy' && isServerMode;

              return (
                <div
                  key={integration.id}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{integration.name}</p>
                      <p className="text-xs leading-relaxed text-muted">
                        {integration.description}
                      </p>
                    </div>
                    <Checkbox
                      aria-label={`Enable ${integration.name}`}
                      isSelected={connection.enabled}
                      onChange={(enabled) => {
                        if ((isGoogle || isPepy) && !enabled && connection.connected) {
                          setIntegrationEnabled.mutate(
                            { id: integration.id, enabled },
                            {
                              onSuccess: () => {
                                if (isGoogle) disconnectGoogleCalendar.mutate();
                                else disconnectPepy.mutate();
                              },
                            },
                          );
                          return;
                        }
                        setIntegrationEnabled.mutate({ id: integration.id, enabled });
                      }}
                      className="shrink-0"
                    >
                      <Checkbox.Content>
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <span className="text-xs text-muted">Enabled</span>
                      </Checkbox.Content>
                    </Checkbox>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <AppTag
                        variant={
                          !connection.enabled
                            ? 'neutral'
                            : connection.connected
                              ? 'success'
                              : 'neutral'
                        }
                      >
                        {!connection.enabled
                          ? 'Disabled'
                          : connection.connected
                            ? 'Connected'
                            : 'Not connected'}
                      </AppTag>
                      <span className="text-xs text-muted">
                        {!connection.enabled ? (
                          'enable to connect'
                        ) : connection.connected && connection.lastSyncAt ? (
                          <>
                            synced <RelativeTime iso={connection.lastSyncAt} />
                          </>
                        ) : (
                          'no sync yet'
                        )}
                      </span>
                    </span>

                    <span className="flex items-center gap-1.5">
                      {connection.connected ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted"
                            aria-label={`Sync ${integration.name} now`}
                            onPress={() => {
                              if (isGoogle) syncGoogleCalendar.mutate();
                              else if (isPepy) syncPepy.mutate();
                              else syncIntegration.mutate(integration.id);
                            }}
                          >
                            <RefreshCw className="size-4" aria-hidden />
                            Sync
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onPress={() => {
                              if (isGoogle) disconnectGoogleCalendar.mutate();
                              else if (isPepy) disconnectPepy.mutate();
                              else disconnectIntegration.mutate(integration.id);
                            }}
                          >
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          isDisabled={!connection.enabled || (isGoogle && !googleConfigured)}
                          isPending={
                            (isGoogle && startGoogleOAuth.isPending) ||
                            (isPepy && connectPepy.isPending)
                          }
                          onPress={() => {
                            if (isPepy) {
                              connectPepy.mutate();
                              return;
                            }
                            if (!isGoogle) {
                              connectIntegration.mutate(integration.id);
                              return;
                            }
                            startGoogleOAuth.mutate(undefined, {
                              onSuccess: (url) => {
                                if (url) window.location.assign(url);
                              },
                            });
                          }}
                        >
                          Connect
                        </Button>
                      )}
                    </span>
                  </div>

                  {(isGoogle || isPepy) && connection.connected && connection.accountEmail ? (
                    <p className="text-xs text-muted">
                      Signed in as <span className="text-foreground">{connection.accountEmail}</span>
                    </p>
                  ) : null}

                  {(isGoogle || isPepy) && connection.lastError ? (
                    <p className="text-xs text-danger">Sync failed: {connection.lastError}</p>
                  ) : null}

                  {isGoogle && !googleConfigured && !connection.connected ? (
                    <p className="text-xs text-warning">
                      Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and APP_ENCRYPTION_KEY on the
                      server to enable Google sign-in.
                    </p>
                  ) : null}

                  {isGoogle && connection.connected && (googleCalendars ?? []).length > 0 ? (
                    <div className="flex flex-col gap-1 border-t border-border pt-2">
                      <Select
                        value={connection.calendarId ?? 'primary'}
                        onChange={(value) => {
                          if (value) selectGoogleCalendar.mutate(String(value));
                        }}
                        aria-label="Google calendar"
                      >
                        <Label>Calendar</Label>
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {(googleCalendars ?? []).map((calendar) => (
                              <ListBox.Item
                                key={calendar.id}
                                id={calendar.id}
                                textValue={calendar.summary || calendar.id}
                              >
                                {calendar.summary || calendar.id}
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                      <p className="text-[11px] text-muted">
                        Events import from and write to this calendar.
                      </p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Section>

        <Section
          title="AI assistant"
          description="The server calls DeepSeek with the key stored on your account."
          action={<AppTag>Server state</AppTag>}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">Provider</span>
              <span className="text-sm text-foreground">{AI_PROVIDER.label}</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <Select
                value={selectedModelId}
                onChange={(value) => updateAi.mutate({ model: String(value) })}
                aria-label="AI model"
              >
                <Label>Model</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {modelOptions.map((model) => (
                      <ListBox.Item key={model.id} id={model.id} textValue={model.name}>
                        {model.name}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
              {selectedModel && selectedModel.contextWindow > 0 ? (
                <p className="text-xs text-muted">
                  {selectedModel.contextWindow.toLocaleString()} token context window
                </p>
              ) : null}
            </div>

            {effortLevels.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <Select
                  value={effortValue}
                  onChange={(value) => {
                    const next = String(value);
                    updateAi.mutate({
                      reasoningEffort: next === 'default' ? null : (next as AiEffortLevel),
                    });
                  }}
                  aria-label="Reasoning effort"
                >
                  <Label>Reasoning effort</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="default" textValue="Default">
                        Default
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      {effortLevels.map((level) => (
                        <ListBox.Item key={level} id={level} textValue={EFFORT_LABELS[level]}>
                          {EFFORT_LABELS[level]}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
                <p className="text-xs text-muted">Default lets the provider choose.</p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Personal DeepSeek API key</span>
              <p className="text-xs text-muted">
                Stored on the server for this account. Leave the field blank to keep the current
                key — the API never sends it back.
              </p>
              <TextField value={apiKey} onChange={setApiKey}>
                <Label>DeepSeek API key</Label>
                <Input
                  type="password"
                  autoComplete="off"
                  placeholder={keyConfigured ? 'Replace stored key…' : 'sk-...'}
                />
              </TextField>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                isDisabled={!apiKey.trim() || updateAi.isPending}
                isPending={updateAi.isPending}
                onPress={() =>
                  updateAi.mutate(
                    { apiKey: apiKey.trim() },
                    { onSuccess: () => setApiKey('') },
                  )
                }
              >
                Save key
              </Button>
              {keyConfigured ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger"
                  onPress={() => updateAi.mutate({ apiKey: null })}
                >
                  Remove key
                </Button>
              ) : null}
              <span
                className={
                  keyConfigured
                    ? 'inline-flex items-center gap-1.5 text-xs text-success'
                    : 'inline-flex items-center gap-1.5 text-xs text-muted'
                }
              >
                {keyConfigured ? (
                  <CircleCheck className="size-3.5" aria-hidden />
                ) : (
                  <TriangleAlert className="size-3.5" aria-hidden />
                )}
                {keyConfigured ? 'Personal key configured' : 'No API key'}
              </span>
            </div>
            <p className="text-xs text-muted">{AI_PROVIDER.hint}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              isPending={testAi.isPending}
              isDisabled={testAi.isPending || !keyConfigured}
              onPress={() => testAi.mutate()}
            >
              Test connection
            </Button>
            {testAi.data ? (
              <span
                className={
                  testAi.data.ok
                    ? 'inline-flex items-center gap-1.5 text-xs text-success'
                    : 'inline-flex items-center gap-1.5 text-xs text-danger'
                }
              >
                {testAi.data.ok ? (
                  <CircleCheck className="size-3.5" aria-hidden />
                ) : (
                  <TriangleAlert className="size-3.5" aria-hidden />
                )}
                {testAi.data.message}
                {' · '}
                <RelativeTime iso={testAi.data.testedAt} />
              </span>
            ) : ai?.status === 'ok' ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-success">
                <CircleCheck className="size-3.5" aria-hidden />
                Verified
                {ai.lastTestedAt ? (
                  <>
                    {' · '}
                    <RelativeTime iso={ai.lastTestedAt} />
                  </>
                ) : null}
              </span>
            ) : ai?.status === 'error' ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-danger">
                <TriangleAlert className="size-3.5" aria-hidden />
                Last test failed
                {ai.lastTestedAt ? (
                  <>
                    {' · '}
                    <RelativeTime iso={ai.lastTestedAt} />
                  </>
                ) : null}
              </span>
            ) : (
              <span className="text-xs text-muted">Not tested yet</span>
            )}
          </div>

          <div className="flex items-start justify-between gap-3 border-t border-border pt-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Enable assistant</p>
              <p className="text-xs text-muted">
                Off: replies are derived from your data. On: the server asks the selected
                provider, and falls back to derived replies when it cannot answer.
              </p>
            </div>
            <Checkbox
              isSelected={ai?.enabled ?? false}
              onChange={(enabled) => updateAi.mutate({ enabled })}
            >
              <Checkbox.Content>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <span className="sr-only">Enable assistant</span>
              </Checkbox.Content>
            </Checkbox>
          </div>
        </Section>

        {isServerMode ? (
          <Section
            title="Notifications"
            description="Reminders for due tasks, upcoming events, and habits."
          >
            <NotificationsCard />
          </Section>
        ) : null}

        {isServerMode ? (
          <Section
            title="Agent access"
            description="Personal tokens let MCP clients read and write your workspace."
            action={
              <Button
                variant="secondary"
                size="sm"
                onPress={() => setIsCreateTokenOpen(true)}
              >
                <Plus className="size-4" aria-hidden />
                Create token
              </Button>
            }
          >
            {tokens && tokens.length > 0 ? (
              <ul className="flex flex-col divide-y divide-border">
                {tokens.map((token) => (
                  <li
                    key={token.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <KeyRound className="size-4 shrink-0 text-muted" aria-hidden />
                        <span className="truncate">{token.name}</span>
                      </p>
                      <p className="text-xs text-muted">
                        Created <RelativeTime iso={token.createdAt} />
                        {' · '}
                        {token.lastUsedAt ? (
                          <>
                            Last used <RelativeTime iso={token.lastUsedAt} />
                          </>
                        ) : (
                          'Never used'
                        )}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger"
                      onPress={() => setTokenToRevoke(token)}
                    >
                      Revoke
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted">No agent tokens yet.</p>
            )}
          </Section>
        ) : null}

        <Section
          title="Data"
          description={
            isServerMode
              ? 'Server-owned data. Import pushes this browser’s local copy once.'
              : 'This mode stores everything in localStorage on this device.'
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted">
              {isServerMode
                ? 'Move this browser’s prototype data into the server once.'
                : 'Nothing to import while running locally.'}
            </p>
            {isServerMode ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted"
                onPress={() => void importLocalData()}
              >
                <Download className="size-4" aria-hidden />
                Import browser data
              </Button>
            ) : null}
          </div>

          {isServerMode ? (
            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <Server className="size-3.5" aria-hidden />
                {apiBaseUrl}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted">
                  Signed in as {profile?.email ?? '…'}
                </p>
                <Button variant="secondary" size="sm" onPress={() => void signOut()}>
                  <LogOut className="size-4" aria-hidden />
                  Sign out
                </Button>
              </div>
            </div>
          ) : null}
        </Section>
      </div>

      <ProfileDialog isOpen={isProfileOpen} onOpenChange={setIsProfileOpen} />

      <Modal.Backdrop isOpen={isCreateTokenOpen} onOpenChange={setIsCreateTokenOpen}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-md">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Create agent token</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <form id="agent-token-form" onSubmit={onCreateToken} className="flex flex-col gap-4">
                <Controller
                  control={tokenForm.control}
                  name="name"
                  render={({ field }) => (
                    <TextField
                      isInvalid={Boolean(tokenForm.formState.errors.name)}
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <Label>Name</Label>
                      <Input autoFocus placeholder="Claude Code / Cursor" />
                      <FieldError>{tokenForm.formState.errors.name?.message}</FieldError>
                    </TextField>
                  )}
                />
              </form>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button
                type="submit"
                form="agent-token-form"
                isPending={createApiToken.isPending}
              >
                Create token
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <Modal.Backdrop
        isOpen={Boolean(createdToken)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setCreatedToken(null);
        }}
      >
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-lg">
            <Modal.Header>
              <Modal.Heading>Token created</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className="flex flex-col gap-3">
                <Input
                  readOnly
                  value={createdToken?.token ?? ''}
                  aria-label="Agent token"
                  className="font-mono text-xs"
                />
                <p className="flex items-start gap-2 rounded-lg bg-warning-soft p-2.5 text-xs text-warning">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  Copy this token now. It will not be shown again.
                </p>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onPress={() => void copyToken()}>
                <Copy className="size-4" aria-hidden />
                Copy
              </Button>
              <Button onPress={() => setCreatedToken(null)}>Done</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <ConfirmDialog
        isOpen={Boolean(tokenToRevoke)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setTokenToRevoke(null);
        }}
        title="Revoke token?"
        description={`Clients using ${tokenToRevoke?.name ?? 'this token'} will stop working immediately.`}
        confirmLabel="Revoke"
        isDanger
        isPending={revokeApiToken.isPending}
        onConfirm={() => {
          if (tokenToRevoke) revokeApiToken.mutate(tokenToRevoke.id);
          setTokenToRevoke(null);
        }}
      />
    </>
  );
}

function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description ? <p className="text-xs text-muted">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
