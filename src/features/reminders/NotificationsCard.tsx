import { useEffect, useState } from 'react';
import { Button, Checkbox, Label, ListBox, Select } from '@heroui/react';
import { TimePickerField } from '@/components/shared/TimePickerField';
import { currentSubscription, isPushSupported, permissionState } from './push-client';
import {
  useDisablePush,
  useEnablePush,
  usePushConfig,
  useReminderSettings,
  useUpdateReminderSettings,
} from './queries';

const LEAD_OPTIONS = [
  { id: '0', label: 'At start' },
  { id: '5', label: '5 minutes before' },
  { id: '10', label: '10 minutes before' },
  { id: '15', label: '15 minutes before' },
  { id: '30', label: '30 minutes before' },
  { id: '60', label: '60 minutes before' },
] as const;

export function NotificationsCard() {
  const { data: settings } = useReminderSettings();
  const { data: pushConfig } = usePushConfig();
  const updateSettings = useUpdateReminderSettings();
  const enablePush = useEnablePush();
  const disablePush = useDisablePush();

  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const supported = isPushSupported();

  useEffect(() => {
    let cancelled = false;

    void currentSubscription()
      .then((current) => {
        if (!cancelled) setSubscription(current);
      })
      .catch(() => {
        if (!cancelled) setSubscription(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshSubscription = async () => {
    try {
      setSubscription(await currentSubscription());
    } catch {
      setSubscription(null);
    }
  };

  let status = 'Not enabled on this device.';
  if (!supported) {
    status = 'Notifications are not supported in this browser.';
  } else if (pushConfig?.enabled === false) {
    status = 'Server push is not configured (missing VAPID keys). In-app reminders still work.';
  } else if (permissionState() === 'denied') {
    status = 'Notifications are blocked in your browser settings.';
  } else if (subscription) {
    status = 'Enabled on this device.';
  }

  const lead = String(settings?.eventLeadMinutes ?? 15);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">{status}</p>
        {subscription ? (
          <Button
            variant="secondary"
            size="sm"
            isPending={disablePush.isPending}
            onPress={() =>
              disablePush.mutate(undefined, { onSuccess: () => void refreshSubscription() })
            }
          >
            Disable
          </Button>
        ) : (
          <Button
            size="sm"
            isDisabled={!supported || !pushConfig?.enabled}
            isPending={enablePush.isPending}
            onPress={() =>
              enablePush.mutate(undefined, { onSuccess: () => void refreshSubscription() })
            }
          >
            Enable notifications
          </Button>
        )}
      </div>

      <div className="flex items-start justify-between gap-3 border-t border-border pt-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Enable reminders</p>
          <p className="text-xs text-muted">
            Due tasks, upcoming events, and scheduled habits show up on Today and the bell.
          </p>
        </div>
        <Checkbox
          isSelected={settings?.enabled ?? true}
          onChange={(enabled) => updateSettings.mutate({ enabled })}
        >
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <span className="sr-only">Enable reminders</span>
          </Checkbox.Content>
        </Checkbox>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <TimePickerField
          label="Task reminder time"
          value={settings?.taskTime ?? '09:00'}
          clearable={false}
          onChange={(taskTime) => {
            if (/^\d{2}:\d{2}$/.test(taskTime)) updateSettings.mutate({ taskTime });
          }}
        />

        <Select
          value={lead}
          onChange={(value) =>
            updateSettings.mutate({ eventLeadMinutes: Number(value ?? lead) })
          }
          aria-label="Event reminder lead"
        >
          <Label>Event reminder lead</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {LEAD_OPTIONS.map((option) => (
                <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
                  {option.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>
    </div>
  );
}
