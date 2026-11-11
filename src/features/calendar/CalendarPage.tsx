import { useState } from 'react';
import { CalendarDays, Check, CheckSquare, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button, Modal, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { AppTag } from '@/components/shared/AppTag';
import { EntityIcon } from '@/components/shared/EntityIcon';
import { ErrorState } from '@/components/shared/ErrorState';
import { InsightStrip } from '@/components/shared/InsightStrip';
import { PageHeader } from '@/components/shared/PageHeader';
import { SkeletonList } from '@/components/shared/SkeletonList';
import { useHabitCheckIns, useHabits, useToggleHabitCheckIn } from '@/features/habits/queries';
import { useProjects } from '@/features/projects/queries';
import { TaskRow } from '@/features/tasks/TaskRow';
import { TaskFormDialog } from '@/features/tasks/TaskFormDialog';
import { useTasks } from '@/features/tasks/queries';
import {
  formatLongDate,
  formatMonthYear,
  formatWeekRange,
  parseDateOnly,
  toDateOnly,
  todayIso,
} from '@/lib/date';
import {
  checkInOn,
  habitCadenceLabel,
  habitTimeLabel,
  isHabitActiveOn,
  isHabitScheduledOn,
} from '@/lib/habits';
import { cn } from '@/lib/cn';
import { eventInsights, eventRangeInsights } from '@/lib/insights';
import type { Event } from '@/types';
import {
  addDays,
  addMonths,
  addWeeks,
  buildMonthGrid,
  buildWeekDays,
  monthKey,
  startOfMonth,
  startOfWeek,
  tasksByDueDate,
} from './calendar';
import { EventFormDialog } from './EventFormDialog';
import { eventTimeLabel, eventsByDate } from './events';
import { useEvents } from './queries';
import { WeekView } from './WeekView';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarPage() {
  const now = new Date();
  const today = todayIso(now);

  const [view, setView] = useState<'month' | 'week'>('month');
  const [month, setMonth] = useState(() => startOfMonth(now));
  const [weekStart, setWeekStart] = useState(() => startOfWeek(now));
  const [selectedDate, setSelectedDate] = useState(today);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [dayActionsDate, setDayActionsDate] = useState<string | null>(null);

  const tasksQuery = useTasks();
  const eventsQuery = useEvents();
  const habitsQuery = useHabits();
  const checkInsQuery = useHabitCheckIns();
  const toggleCheckIn = useToggleHabitCheckIn();
  const { data: projects } = useProjects();

  const tasks = tasksQuery.data ?? [];
  const events = eventsQuery.data ?? [];
  const habits = habitsQuery.data ?? [];
  const checkIns = checkInsQuery.data ?? [];

  const habitsForDay = (date: string) =>
    habits
      .filter(
        (habit) =>
          isHabitActiveOn(habit, date) &&
          (isHabitScheduledOn(habit, date) || checkInOn(checkIns, habit.id, date)),
      )
      .sort(
        (a, b) =>
          (a.startTime ?? '').localeCompare(b.startTime ?? '') ||
          a.title.localeCompare(b.title),
      );
  const projectNames = new Map((projects ?? []).map((project) => [project.id, project.name]));
  const taskGroups = tasksByDueDate(tasks);
  const eventGroups = eventsByDate(events);
  const grid = buildMonthGrid(month);
  const weekDays = buildWeekDays(weekStart);
  const weekRangeStart = weekDays[0]?.date ?? today;
  const weekRangeEnd = weekDays[6]?.date ?? today;
  const insights =
    view === 'month'
      ? eventInsights(events, month)
      : eventRangeInsights(events, weekRangeStart, weekRangeEnd);

  const selectedTasks = taskGroups.get(selectedDate) ?? [];
  const selectedEvents = eventGroups.get(selectedDate) ?? [];

  const isPending =
    tasksQuery.isPending || eventsQuery.isPending || habitsQuery.isPending || checkInsQuery.isPending;
  const isError =
    tasksQuery.isError || eventsQuery.isError || habitsQuery.isError || checkInsQuery.isError;

  const changePeriod = (delta: number) => {
    if (view === 'week') {
      const next = addWeeks(weekStart, delta);
      setWeekStart(next);
      const start = toDateOnly(next);
      const end = toDateOnly(addDays(next, 6));
      if (selectedDate < start || selectedDate > end) setSelectedDate(start);
      return;
    }

    const next = addMonths(month, delta);
    setMonth(next);
    if (selectedDate.slice(0, 7) !== monthKey(next)) setSelectedDate(toDateOnly(next));
  };

  const changeView = (next: 'month' | 'week') => {
    if (next === view) return;
    const selected = parseDateOnly(selectedDate);
    if (next === 'week') setWeekStart(startOfWeek(selected));
    else setMonth(startOfMonth(selected));
    setView(next);
  };

  const goToToday = () => {
    setMonth(startOfMonth(now));
    setWeekStart(startOfWeek(now));
    setSelectedDate(today);
  };

  const openNewEvent = () => {
    setEditingEvent(null);
    setIsEventFormOpen(true);
  };

  const openDayActions = (date: string) => {
    setSelectedDate(date);
    setDayActionsDate(date);
  };

  const openEvent = (event: Event) => {
    setEditingEvent(event);
    setIsEventFormOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Due dates and agenda events in one place."
        actions={
          <>
            <Button variant="secondary" onPress={openNewEvent}>
              <CalendarDays className="size-4" aria-hidden />
              New event
            </Button>
            <Button onPress={() => setIsTaskFormOpen(true)}>
              <Plus className="size-4" aria-hidden />
              New task
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-foreground">
          {view === 'month'
            ? formatMonthYear(month)
            : formatWeekRange(weekStart, addDays(weekStart, 6))}
        </h2>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <ToggleButtonGroup
            aria-label="Calendar view"
            size="sm"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={new Set([view])}
            onSelectionChange={(keys) => {
              const next = [...keys][0];
              if (next === 'month' || next === 'week') changeView(next);
            }}
          >
            <ToggleButton id="month">Month</ToggleButton>
            <ToggleButton id="week">
              <ToggleButtonGroup.Separator />
              Week
            </ToggleButton>
          </ToggleButtonGroup>

          <div className="flex items-center gap-1">
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label={`Previous ${view}`}
              onPress={() => changePeriod(-1)}
            >
              <ChevronLeft className="size-4" aria-hidden />
            </Button>
            <Button size="sm" variant="ghost" onPress={goToToday}>
              Today
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label={`Next ${view}`}
              onPress={() => changePeriod(1)}
            >
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      </div>

      {isPending ? <SkeletonList rows={3} /> : null}
      {isError ? (
        <ErrorState
          onRetry={() => {
            void tasksQuery.refetch();
            void eventsQuery.refetch();
            void habitsQuery.refetch();
            void checkInsQuery.refetch();
          }}
        />
      ) : null}

      {eventsQuery.isSuccess ? (
        <InsightStrip
          className="mb-4"
          items={[
            { label: 'Events', value: insights.events, hint: view === 'month' ? 'this month' : 'this week' },
            {
              label: 'Overlaps',
              value: insights.overlaps,
              tone: insights.overlaps > 0 ? 'warning' : 'neutral',
              hint: 'sharing time',
            },
            { label: 'Busy days', value: insights.busyDays, hint: 'with events' },
            { label: 'Timed events', value: insights.timedEvents, hint: 'with start/end' },
          ]}
        />
      ) : null}

      {tasksQuery.isSuccess && eventsQuery.isSuccess ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            {view === 'month' ? (
              <>
                <div className="mb-1 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((label) => (
                <div key={label} className="text-center text-xs font-medium text-muted">
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {grid.map((day) => {
                const dayTasks = taskGroups.get(day.date) ?? [];
                const dayEvents = eventGroups.get(day.date) ?? [];
                const dayHabits = habitsForDay(day.date);
                const timedEntries = [
                  ...dayEvents.map((event) => ({
                    key: `e-${event.id}`,
                    time: event.startTime ?? '',
                    label: `${eventTimeLabel(event)} ${event.title}`,
                    kind: 'event' as const,
                    checked: false,
                  })),
                  ...dayHabits.map((habit) => ({
                    key: `h-${habit.id}`,
                    time: habit.startTime ?? '',
                    label: `${habitTimeLabel(habit)} ${habit.title}`,
                    kind: 'habit' as const,
                    checked: checkInOn(checkIns, habit.id, day.date),
                  })),
                ].sort(
                  (a, b) => a.time.localeCompare(b.time) || a.label.localeCompare(b.label),
                );
                const timedShown = timedEntries.slice(0, 2);
                const taskShown = dayTasks.slice(0, 2 - timedShown.length);
                const moreCount =
                  dayTasks.length +
                  timedEntries.length -
                  timedShown.length -
                  taskShown.length;
                const isSelected = day.date === selectedDate;
                const isToday = day.date === today;

                return (
                  <button
                    key={day.date}
                    type="button"
                    aria-pressed={isSelected}
                    aria-label={`${formatLongDate(parseDateOnly(day.date))}${
                      dayTasks.length > 0
                        ? `, ${dayTasks.length} task${dayTasks.length === 1 ? '' : 's'}`
                        : ''
                    }${
                      dayEvents.length > 0
                        ? `, ${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'}`
                        : ''
                    }${
                      habitsForDay(day.date).length > 0
                        ? `, ${habitsForDay(day.date).length} habit${
                            habitsForDay(day.date).length === 1 ? '' : 's'
                          }`
                        : ''
                    }`}
                    aria-haspopup="dialog"
                    onClick={() => openDayActions(day.date)}
                    className={cn(
                      'flex min-h-16 flex-col gap-1 rounded-lg border p-1 text-left transition-colors sm:min-h-24 sm:p-1.5',
                      isSelected
                        ? 'border-accent bg-accent-soft'
                        : isToday
                          ? 'border-accent/60'
                          : 'border-border/70 hover:bg-surface-secondary/60',
                      !day.inMonth && 'opacity-45',
                    )}
                  >
                    <span className="flex items-center justify-between gap-1">
                      <span
                        className={cn(
                          'text-xs font-medium',
                          isToday ? 'text-accent' : 'text-foreground',
                        )}
                      >
                        {day.day}
                      </span>
                      {dayTasks.length > 0 ? (
                        <span className="rounded-md bg-surface px-1 text-[10px] text-muted">
                          {dayTasks.length}
                        </span>
                      ) : null}
                    </span>

                    <span className="hidden flex-col gap-0.5 sm:flex">
                      {timedShown.map((entry) => (
                        <span
                          key={entry.key}
                          className={cn(
                            'truncate rounded-md px-1 py-0.5 text-[10px]',
                            entry.kind === 'event'
                              ? 'bg-accent-soft text-foreground'
                              : entry.checked
                                ? 'bg-success-soft text-muted line-through'
                                : 'bg-success-soft text-foreground',
                          )}
                        >
                          {entry.label}
                        </span>
                      ))}
                      {taskShown.map((task) => (
                        <span
                          key={task.id}
                          className="truncate rounded-md bg-surface px-1 py-0.5 text-[10px] text-foreground"
                        >
                          {task.title}
                        </span>
                      ))}
                      {moreCount > 0 ? (
                        <span className="text-[10px] text-muted">+{moreCount} more</span>
                      ) : null}
                    </span>

                    {dayEvents.length > 0 || dayHabits.length > 0 ? (
                      <span className="mt-auto flex flex-wrap items-center gap-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <span
                            key={event.id}
                            className="size-1 rounded-full bg-accent sm:size-1.5"
                            aria-hidden
                          />
                        ))}
                        {dayHabits.slice(0, 3).map((habit) => (
                          <span
                            key={habit.id}
                            className={cn(
                              'size-1.5 rounded-sm sm:size-2',
                              checkInOn(checkIns, habit.id, day.date)
                                ? 'bg-success'
                                : 'border border-success',
                            )}
                            aria-hidden
                          />
                        ))}
                      </span>
                    ) : null}
                  </button>
                );
              })}
                </div>
              </>
            ) : (
              <WeekView
                days={weekDays}
                selectedDate={selectedDate}
                today={today}
                taskGroups={taskGroups}
                eventGroups={eventGroups}
                habitsForDay={habitsForDay}
                checkIns={checkIns}
                onSelectDate={openDayActions}
                onOpenEvent={openEvent}
              />
            )}
          </div>

          <aside className="flex min-w-0 flex-col gap-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="section-label">Selected day</p>
                <h2 className="text-lg font-semibold text-foreground">
                  {formatLongDate(parseDateOnly(selectedDate))}
                </h2>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button size="sm" variant="ghost" aria-label="Add event" onPress={openNewEvent}>
                  <CalendarDays className="size-4" aria-hidden />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Add task on the selected day"
                  onPress={() => setIsTaskFormOpen(true)}
                >
                  <CheckSquare className="size-4" aria-hidden />
                </Button>
              </div>
            </div>

            {habitsForDay(selectedDate).length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="section-label">Habits</p>
                {habitsForDay(selectedDate).map((habit) => {
                  const checked = checkInOn(checkIns, habit.id, selectedDate);
                  const scheduled = isHabitScheduledOn(habit, selectedDate);
                  const inFuture = selectedDate > today;

                  return (
                    <div
                      key={habit.id}
                      className="surface-card flex items-center gap-2 p-2.5"
                    >
                      <Button
                        isIconOnly
                        size="sm"
                        variant={checked ? 'primary' : 'secondary'}
                        aria-label={
                          checked
                            ? `Undo check-in for ${habit.title}`
                            : `Check in ${habit.title}`
                        }
                        aria-pressed={checked}
                        isDisabled={inFuture || toggleCheckIn.isPending}
                        onPress={() =>
                          toggleCheckIn.mutate({
                            habitId: habit.id,
                            date: selectedDate,
                            remove: checked,
                          })
                        }
                        className="size-7 shrink-0 rounded-full"
                      >
                        <Check className="size-3.5" aria-hidden />
                      </Button>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {habit.title}
                        </p>
                        <p className="text-xs text-muted">
                          {habitTimeLabel(habit)} · {habitCadenceLabel(habit)}
                          {scheduled ? ' · scheduled' : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {selectedEvents.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="section-label">Agenda</p>
                {selectedEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => openEvent(event)}
                    className="surface-card w-full text-left transition-colors hover:border-accent/50 hover:bg-surface-secondary/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-foreground">
                        <EntityIcon kind="event" className="size-3.5" />
                        <span className="truncate">{event.title}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted">{eventTimeLabel(event)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {event.source === 'google' ? (
                        <AppTag variant="accent">Google</AppTag>
                      ) : null}
                      {event.projectId && projectNames.get(event.projectId) ? (
                        <AppTag variant="accent">{projectNames.get(event.projectId)}</AppTag>
                      ) : (
                        <AppTag>Event</AppTag>
                      )}
                      {event.notes ? (
                        <span className="line-clamp-1 text-xs text-muted">{event.notes}</span>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            {selectedTasks.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="section-label">Tasks due</p>
                {selectedTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    projectName={task.projectId ? projectNames.get(task.projectId) : undefined}
                  />
                ))}
              </div>
            ) : null}

            {selectedTasks.length === 0 &&
            selectedEvents.length === 0 &&
            habitsForDay(selectedDate).length === 0 ? (
              <div className="surface-card text-sm text-muted">
                Nothing scheduled for this day. Add an event or a task with this due date.
              </div>
            ) : null}

            <Button variant="secondary" onPress={openNewEvent}>
              <CalendarDays className="size-4" aria-hidden />
              Add event on this day
            </Button>
          </aside>
        </div>
      ) : null}

      <Modal.Backdrop
        isOpen={Boolean(dayActionsDate)}
        onOpenChange={(open) => {
          if (!open) setDayActionsDate(null);
        }}
      >
        <Modal.Container placement="center" size="sm">
          <Modal.Dialog className="sm:max-w-sm">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Add to this day</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="text-sm text-muted">
                {dayActionsDate ? formatLongDate(parseDateOnly(dayActionsDate)) : ''}
              </p>
            </Modal.Body>
            <Modal.Footer className="flex-wrap gap-2">
              <Button
                variant="secondary"
                onPress={() => {
                  setDayActionsDate(null);
                  setIsTaskFormOpen(true);
                }}
              >
                <CheckSquare className="size-4" aria-hidden />
                New task
              </Button>
              <Button
                onPress={() => {
                  setDayActionsDate(null);
                  openNewEvent();
                }}
              >
                <CalendarDays className="size-4" aria-hidden />
                New event
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <TaskFormDialog
        isOpen={isTaskFormOpen}
        onOpenChange={setIsTaskFormOpen}
        defaultDueDate={dayActionsDate ?? selectedDate}
      />

      <EventFormDialog
        isOpen={isEventFormOpen}
        onOpenChange={(open) => {
          setIsEventFormOpen(open);
          if (!open) setEditingEvent(null);
        }}
        event={editingEvent}
        defaultDate={dayActionsDate ?? selectedDate}
      />
    </>
  );
}
