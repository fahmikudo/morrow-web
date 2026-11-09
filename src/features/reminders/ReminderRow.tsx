import { Link } from 'react-router';
import { Button } from '@heroui/react';
import { CalendarDays, Repeat, SquareCheck, X } from 'lucide-react';
import type { Reminder, ReminderKind } from '@/types/reminders';
import { useDismissReminder } from './queries';

const KIND_ICONS: Record<ReminderKind, typeof SquareCheck> = {
  task: SquareCheck,
  event: CalendarDays,
  habit: Repeat,
};

export function ReminderRow({ reminder }: { reminder: Reminder }) {
  const dismiss = useDismissReminder();
  const Icon = KIND_ICONS[reminder.kind];

  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-border bg-surface p-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
        <Icon className="size-4" aria-hidden />
      </span>
      <Link to={reminder.href} className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{reminder.title}</p>
        <p className="truncate text-xs text-muted">{reminder.body}</p>
      </Link>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        className="shrink-0 text-muted"
        aria-label={`Dismiss ${reminder.title}`}
        onPress={() => dismiss.mutate(reminder.id)}
      >
        <X className="size-3.5" aria-hidden />
      </Button>
    </div>
  );
}
