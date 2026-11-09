import { Check, Ellipsis, Flame } from 'lucide-react';
import { Button, Dropdown, Label } from '@heroui/react';
import { AppTag } from '@/components/shared/AppTag';
import { EntityIcon } from '@/components/shared/EntityIcon';
import { todayIso } from '@/lib/date';
import {
  checkInOn,
  habitCadenceLabel,
  habitDots,
  habitProgress,
  habitStreak,
  habitTimeLabel,
} from '@/lib/habits';
import { cn } from '@/lib/cn';
import type { Area, Habit, HabitCheckIn } from '@/types';
import { useToggleHabitCheckIn } from './queries';

const PERIOD_WORD = { daily: 'today', weekly: 'this week', monthly: 'this month' } as const;

type HabitRowProps = {
  habit: Habit;
  checkIns: HabitCheckIn[];
  area?: Area;
  projectName?: string;
  onEdit?: (habit: Habit) => void;
  onArchive?: (habit: Habit) => void;
  onRestore?: (habit: Habit) => void;
  onDelete?: (habit: Habit) => void;
  isArchived?: boolean;
};

export function HabitRow({
  habit,
  checkIns,
  area,
  projectName,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  isArchived = false,
}: HabitRowProps) {
  const toggle = useToggleHabitCheckIn();
  const today = todayIso();
  const checkedToday = checkInOn(checkIns, habit.id, today);
  const progress = habitProgress(habit, checkIns, today);
  const streak = habitStreak(habit, checkIns, today);
  const dots = habitDots(habit, checkIns, today);
  const hasMenu = Boolean(onEdit || onArchive || onRestore || onDelete);

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3">
      <Button
        isIconOnly
        size="sm"
        variant={checkedToday ? 'primary' : 'secondary'}
        aria-label={checkedToday ? `Undo check-in for ${habit.title}` : `Check in ${habit.title}`}
        aria-pressed={checkedToday}
        isDisabled={isArchived || toggle.isPending}
        onPress={() =>
          toggle.mutate({ habitId: habit.id, date: today, remove: checkedToday })
        }
        className={cn('mt-0.5 size-8 rounded-full', !checkedToday && 'text-muted')}
      >
        <Check className="size-4" aria-hidden />
      </Button>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <EntityIcon kind="habit" className="size-4" />
          <span
            className={cn(
              'truncate text-sm font-medium',
              isArchived ? 'text-muted' : 'text-foreground',
            )}
          >
            {habit.title}
          </span>
          <AppTag>{habitCadenceLabel(habit)}</AppTag>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          {projectName ? (
            <AppTag variant="accent">{projectName}</AppTag>
          ) : area ? (
            <AppTag variant={area.tone}>{area.name}</AppTag>
          ) : null}
          {habit.startTime ? <span>{habitTimeLabel(habit)}</span> : null}
          <span>
            {progress.count}/{progress.target} {PERIOD_WORD[habit.cadence]}
          </span>
          {streak > 0 ? (
            <span className="inline-flex items-center gap-1 text-warning">
              <Flame className="size-3" aria-hidden />
              {streak}
            </span>
          ) : null}
          {dots.length > 0 ? (
            <span className="flex items-center gap-1" aria-hidden>
              {dots.map((dot) => (
                <span
                  key={dot.date}
                  title={dot.date}
                  className={cn(
                    'size-1.5 rounded-full',
                    dot.checked ? 'bg-accent' : 'bg-border',
                    dot.today && 'ring-1 ring-accent ring-offset-1 ring-offset-surface',
                  )}
                />
              ))}
            </span>
          ) : null}
        </div>
      </div>

      {hasMenu ? (
        <Dropdown>
          <Button isIconOnly size="sm" variant="ghost" aria-label={`Actions for ${habit.title}`}>
            <Ellipsis className="size-4" aria-hidden />
          </Button>
          <Dropdown.Popover placement="bottom end" className="min-w-44">
            <Dropdown.Menu
              onAction={(key) => {
                if (key === 'edit') onEdit?.(habit);
                if (key === 'archive') onArchive?.(habit);
                if (key === 'restore') onRestore?.(habit);
                if (key === 'delete') onDelete?.(habit);
              }}
            >
              {onEdit ? (
                <Dropdown.Item id="edit" textValue="Edit habit">
                  <Label>Edit habit</Label>
                </Dropdown.Item>
              ) : null}
              {onArchive ? (
                <Dropdown.Item id="archive" textValue="Archive habit">
                  <Label>Archive habit</Label>
                </Dropdown.Item>
              ) : null}
              {onRestore ? (
                <Dropdown.Item id="restore" textValue="Restore habit">
                  <Label>Restore habit</Label>
                </Dropdown.Item>
              ) : null}
              {onDelete ? (
                <Dropdown.Item id="delete" textValue="Delete habit" variant="danger">
                  <Label>Delete habit</Label>
                </Dropdown.Item>
              ) : null}
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      ) : null}
    </div>
  );
}
