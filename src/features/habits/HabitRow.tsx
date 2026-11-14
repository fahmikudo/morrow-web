import { Check, CircleSlash, Ellipsis, Flame } from 'lucide-react';
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
  isHabitDueOn,
  isHabitEnded,
  skipOn,
} from '@/lib/habits';
import { cn } from '@/lib/cn';
import type { Area, Habit, HabitCheckIn, HabitSkip } from '@/types';
import { useToggleHabitCheckIn, useToggleHabitSkip } from './queries';

const PERIOD_WORD = { daily: 'today', weekly: 'this week', monthly: 'this month' } as const;
const FINAL_PERIOD_WORD = {
  daily: 'on its final day',
  weekly: 'in its final week',
  monthly: 'in its final month',
} as const;

type HabitRowProps = {
  habit: Habit;
  checkIns: HabitCheckIn[];
  skips: HabitSkip[];
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
  skips,
  area,
  projectName,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  isArchived = false,
}: HabitRowProps) {
  const toggle = useToggleHabitCheckIn();
  const skip = useToggleHabitSkip();
  const today = todayIso();
  const ended = isHabitEnded(habit, today);
  const reference = ended ? (habit.endDate ?? today) : today;
  const checkedToday = checkInOn(checkIns, habit.id, today);
  const skippedToday = skipOn(skips, habit.id, today);
  const progress = habitProgress(habit, checkIns, reference);
  const streak = habitStreak(habit, checkIns, reference);
  const dots = habitDots(habit, checkIns, reference, skips);
  const dueToday = isHabitDueOn(habit, checkIns, today);
  const canSkip = !isArchived && !ended && (skippedToday || (dueToday && !checkedToday));
  const hasMenu = Boolean(onEdit || onArchive || onRestore || onDelete);

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3">
      <Button
        isIconOnly
        size="sm"
        variant={checkedToday ? 'primary' : 'secondary'}
        aria-label={checkedToday ? `Undo check-in for ${habit.title}` : `Check in ${habit.title}`}
        aria-pressed={checkedToday}
        isDisabled={isArchived || ended || toggle.isPending}
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
          {ended ? <AppTag>Ended</AppTag> : null}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          {projectName ? (
            <AppTag variant="accent">{projectName}</AppTag>
          ) : area ? (
            <AppTag variant={area.tone}>{area.name}</AppTag>
          ) : null}
          {habit.startTime ? <span>{habitTimeLabel(habit)}</span> : null}
          <span>
            {progress.count}/{progress.target}{' '}
            {(ended ? FINAL_PERIOD_WORD : PERIOD_WORD)[habit.cadence]}
          </span>
          {skippedToday ? <span className="text-warning">Skipped today</span> : null}
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
                  title={dot.skipped ? `${dot.date} · skipped` : dot.date}
                  className={cn(
                    'size-1.5 rounded-full',
                    dot.checked
                      ? 'bg-accent'
                      : dot.skipped
                        ? 'bg-transparent ring-1 ring-warning'
                        : 'bg-border',
                    dot.today &&
                      !dot.skipped &&
                      'ring-1 ring-accent ring-offset-1 ring-offset-surface',
                  )}
                />
              ))}
            </span>
          ) : null}
        </div>
      </div>

      {canSkip || hasMenu ? (
        <div className="flex items-center gap-0.5">
          {canSkip ? (
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label={
                skippedToday
                  ? `Undo skip for ${habit.title}`
                  : `Skip ${habit.title} today`
              }
              aria-pressed={skippedToday}
              isDisabled={checkedToday || skip.isPending}
              onPress={() =>
                skip.mutate({ habitId: habit.id, date: today, remove: skippedToday })
              }
              className={cn('text-muted', skippedToday && 'text-warning')}
            >
              <CircleSlash className="size-4" aria-hidden />
            </Button>
          ) : null}

          {hasMenu ? (
            <Dropdown>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label={`Actions for ${habit.title}`}
              >
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
      ) : null}
    </div>
  );
}
