import { CalendarDays } from 'lucide-react';
import { formatLongDate, formatWeekday, parseDateOnly } from '@/lib/date';
import { checkInOn, isHabitScheduledOn } from '@/lib/habits';
import { cn } from '@/lib/cn';
import type { Event, Habit, HabitCheckIn, Task } from '@/types';
import type { WeekCalendarDay } from './calendar';
import { eventTimeLabel } from './events';

type WeekViewProps = {
  days: WeekCalendarDay[];
  selectedDate: string;
  today: string;
  taskGroups: Map<string, Task[]>;
  eventGroups: Map<string, Event[]>;
  habitsForDay: (date: string) => Habit[];
  checkIns: HabitCheckIn[];
  onSelectDate: (date: string) => void;
  onOpenEvent: (event: Event) => void;
};

type Entry = {
  key: string;
  kind: 'event' | 'habit' | 'task';
  time: string;
  title: string;
  checked?: boolean;
  event?: Event;
};

function dayEntries(
  date: string,
  taskGroups: Map<string, Task[]>,
  eventGroups: Map<string, Event[]>,
  habits: Habit[],
  checkIns: HabitCheckIn[],
): Entry[] {
  const entries: Entry[] = [
    ...(eventGroups.get(date) ?? []).map((event) => ({
      key: `event-${event.id}`,
      kind: 'event' as const,
      time: event.startTime ?? 'All day',
      title: event.title,
      event,
    })),
    ...habits.map((habit) => ({
      key: `habit-${habit.id}`,
      kind: 'habit' as const,
      time: isHabitScheduledOn(habit, date)
        ? (habit.startTime ?? 'Any time')
        : 'Optional',
      title: habit.title,
      checked: checkInOn(checkIns, habit.id, date),
    })),
    ...(taskGroups.get(date) ?? []).map((task) => ({
      key: `task-${task.id}`,
      kind: 'task' as const,
      time: 'Due',
      title: task.title,
    })),
  ];

  const sortTime = (entry: Entry) => {
    if (entry.kind === 'event' && entry.time === 'All day') return '00:00';
    if (entry.kind === 'task') return '99:99';
    if (entry.time === 'Any time') return '98:98';
    return entry.time;
  };

  return entries.sort(
    (a, b) => sortTime(a).localeCompare(sortTime(b)) || a.title.localeCompare(b.title),
  );
}

/** Seven-day board used by the Calendar week view. */
export function WeekView({
  days,
  selectedDate,
  today,
  taskGroups,
  eventGroups,
  habitsForDay,
  checkIns,
  onSelectDate,
  onOpenEvent,
}: WeekViewProps) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      <div className="grid min-w-[760px] grid-cols-7 gap-1">
        {days.map((day) => {
          const dayEvents = eventGroups.get(day.date) ?? [];
          const habits = habitsForDay(day.date);
          const entries = dayEntries(day.date, taskGroups, eventGroups, habits, checkIns);
          const isSelected = day.date === selectedDate;
          const isToday = day.date === today;

          return (
            <section
              key={day.date}
              className={cn(
                'flex min-h-[320px] min-w-0 flex-col overflow-hidden rounded-lg border bg-surface transition-colors',
                isSelected
                  ? 'border-accent bg-accent-soft/30'
                  : isToday
                    ? 'border-accent/60'
                    : 'border-border/70',
              )}
            >
              <button
                type="button"
                aria-pressed={isSelected}
                aria-haspopup="dialog"
                aria-label={`${formatLongDate(parseDateOnly(day.date))}, ${entries.length} item${
                  entries.length === 1 ? '' : 's'
                }`}
                onClick={() => onSelectDate(day.date)}
                className={cn(
                  'flex items-center justify-between gap-1 border-b px-2 py-2 text-left transition-colors',
                  isSelected
                    ? 'border-accent/30 bg-accent-soft/40'
                    : 'border-border/60 hover:bg-surface-secondary/60',
                )}
              >
                <span className="flex flex-col">
                  <span className="text-[10px] font-medium tracking-wide text-muted uppercase">
                    {formatWeekday(parseDateOnly(day.date))}
                  </span>
                  <span
                    className={cn(
                      'text-lg leading-tight font-semibold',
                      isToday ? 'text-accent' : 'text-foreground',
                    )}
                  >
                    {day.day}
                  </span>
                </span>
                {dayEvents.length > 0 ? (
                  <CalendarDays className="size-3.5 shrink-0 text-module-calendar" aria-hidden />
                ) : null}
              </button>

              <div className="flex min-h-0 flex-1 flex-col gap-1 p-1.5">
                {entries.length === 0 ? (
                  <span className="px-1 py-2 text-[11px] text-muted">No items</span>
                ) : (
                  entries.map((entry) => {
                    const content = (
                      <>
                        <span
                          className={cn(
                            'truncate text-[10px]',
                            entry.kind === 'event'
                              ? 'text-accent'
                              : entry.kind === 'habit'
                                ? 'text-success'
                                : 'text-muted',
                          )}
                        >
                          {entry.time}
                        </span>
                        <span
                          className={cn(
                            'line-clamp-2 text-[11px] leading-snug font-medium',
                            entry.checked ? 'text-muted line-through' : 'text-foreground',
                          )}
                        >
                          {entry.title}
                        </span>
                      </>
                    );

                    const event = entry.event;
                    if (entry.kind === 'event' && event) {
                      return (
                        <button
                          key={entry.key}
                          type="button"
                          onClick={() => onOpenEvent(event)}
                          title={`${eventTimeLabel(event)} — ${entry.title}`}
                          className="flex w-full flex-col rounded-md border border-accent/15 bg-accent-soft px-1.5 py-1 text-left transition-colors hover:border-accent/40"
                        >
                          {content}
                        </button>
                      );
                    }

                    return (
                      <div
                        key={entry.key}
                        title={entry.title}
                        className={cn(
                          'flex flex-col rounded-md border px-1.5 py-1',
                          entry.kind === 'habit'
                            ? 'border-success/15 bg-success-soft'
                            : 'border-border/70 bg-surface-secondary',
                        )}
                      >
                        {content}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
