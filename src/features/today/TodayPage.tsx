import { useState } from 'react';
import { Link } from 'react-router';
import {
  Calendar,
  CalendarDays,
  Clock,
  FolderKanban,
  NotebookPen,
  Plus,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { Button, Input, ListBox, ProgressBar, Select, TextField } from '@heroui/react';
import { EmptyState } from '@/components/shared/EmptyState';
import { RelativeTime } from '@/components/shared/RelativeTime';
import { AppTag } from '@/components/shared/AppTag';
import { PageHeader } from '@/components/shared/PageHeader';
import { SkeletonList } from '@/components/shared/SkeletonList';
import { StatTile } from '@/components/shared/StatTile';
import { ErrorState } from '@/components/shared/ErrorState';
import { useAreas } from '@/features/areas/queries';
import { useEvents } from '@/features/calendar/queries';
import { eventTimeLabel, eventsInRange } from '@/features/calendar/events';
import { useHabitCheckIns, useHabits } from '@/features/habits/queries';
import { HabitRow } from '@/features/habits/HabitRow';
import { useCreateInboxItem } from '@/features/inbox/queries';
import { useNotes } from '@/features/knowledge/queries';
import { useProfile } from '@/features/profile/queries';
import { useProjects } from '@/features/projects/queries';
import { ReminderRow } from '@/features/reminders/ReminderRow';
import { useReminders } from '@/features/reminders/queries';
import { useTasks } from '@/features/tasks/queries';
import { TaskRow } from '@/features/tasks/TaskRow';
import { daysFromNow, formatLongDate, formatWeekday, greeting, parseDateOnly, todayIso } from '@/lib/date';
import { effectiveAreaId } from '@/lib/area';
import { isHabitDueOn } from '@/lib/habits';
import { isServerMode } from '@/services';
import { useUiStore } from '@/stores/ui-store';
import type { InboxItemType } from '@/types';
import { deriveToday } from './derive';

const TYPE_OPTIONS: Array<{ id: InboxItemType; label: string }> = [
  { id: 'note', label: 'Note' },
  { id: 'task', label: 'Task' },
  { id: 'idea', label: 'Idea' },
];

export function TodayPage() {
  const now = new Date();
  const tasksQuery = useTasks();
  const notesQuery = useNotes();
  const projectsQuery = useProjects();
  const eventsQuery = useEvents();
  const habitsQuery = useHabits();
  const checkInsQuery = useHabitCheckIns();
  const remindersQuery = useReminders();
  const { data: areas } = useAreas();
  const { data: profile } = useProfile();
  const firstName = profile?.name.trim().split(/\s+/)[0] ?? null;
  const openQuickCapture = useUiStore((state) => state.openQuickCapture);

  const isPending =
    tasksQuery.isPending ||
    notesQuery.isPending ||
    projectsQuery.isPending ||
    eventsQuery.isPending ||
    habitsQuery.isPending ||
    checkInsQuery.isPending;
  const isError =
    tasksQuery.isError ||
    notesQuery.isError ||
    projectsQuery.isError ||
    eventsQuery.isError ||
    habitsQuery.isError ||
    checkInsQuery.isError;

  if (isPending) {
    return (
      <>
        <PageHeader title="Today" description={formatLongDate(now)} />
        <SkeletonList rows={4} />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <PageHeader title="Today" description={formatLongDate(now)} />
        <ErrorState
          onRetry={() => {
            void tasksQuery.refetch();
            void notesQuery.refetch();
            void projectsQuery.refetch();
            void eventsQuery.refetch();
            void habitsQuery.refetch();
            void checkInsQuery.refetch();
          }}
        />
      </>
    );
  }

  const tasks = tasksQuery.data ?? [];
  const notes = notesQuery.data ?? [];
  const projects = projectsQuery.data ?? [];
  const events = eventsQuery.data ?? [];
  const habits = habitsQuery.data ?? [];
  const checkIns = checkInsQuery.data ?? [];
  const reminders = isServerMode ? (remindersQuery.data ?? []) : [];
  const areaById = new Map((areas ?? []).map((area) => [area.id, area]));
  const dueHabits = habits
    .filter((habit) => isHabitDueOn(habit, checkIns, todayIso(now)))
    .slice(0, 4);
  const weekEvents = eventsInRange(events, todayIso(now), daysFromNow(6, now));
  const projectNames = new Map(projects.map((project) => [project.id, project.name]));
  const view = deriveToday(tasks, notes, projects, now);

  return (
    <>
      <PageHeader
        title="Today"
        description={formatLongDate(now)}
        actions={
          <Button onPress={() => openQuickCapture()}>
            <Plus className="size-4" aria-hidden />
            Quick capture
          </Button>
        }
      />

      <p className="-mt-2 mb-6 text-sm text-muted">
        {greeting(now)}
        {firstName ? `, ${firstName}` : ''}. Focus on what is due, then make room for what is next.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Due today" value={view.stats.dueToday} icon={CalendarDays} tone="accent" />
        <StatTile
          label="Overdue"
          value={view.stats.overdue}
          tone="danger"
          icon={TriangleAlert}
          valueClassName={view.stats.overdue > 0 ? 'text-danger' : undefined}
        />
        <StatTile label="In progress" value={view.stats.inProgress} icon={Clock} tone="warning" />
        <StatTile
          label="Active projects"
          value={view.stats.activeProjects}
          icon={FolderKanban}
        />
      </div>

      {reminders.length > 0 ? (
        <section className="mb-6 flex flex-col gap-3">
          <SectionHeading title="Reminders" hint={`${reminders.length} today`} />
          <div className="flex flex-col gap-2">
            {reminders.map((reminder) => (
              <ReminderRow key={reminder.id} reminder={reminder} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <QuickCaptureCard />

          {habits.length > 0 ? (
            <section className="flex flex-col gap-3">
              <SectionHeading
                title="Habits"
                hint={
                  dueHabits.length > 0
                    ? `${dueHabits.length} to check in today`
                    : 'All caught up for today'
                }
                action={<LinkRow to="/habits" label="All habits" />}
              />
              {dueHabits.length === 0 ? (
                <div className="surface-card text-sm text-muted">
                  Nothing left to check in today. Keep the streak going tomorrow.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {dueHabits.map((habit) => {
                    const areaId = effectiveAreaId(habit, projects);
                    return (
                      <HabitRow
                        key={habit.id}
                        habit={habit}
                        checkIns={checkIns}
                        area={areaId ? areaById.get(areaId) : undefined}
                        projectName={
                          habit.projectId ? projectNames.get(habit.projectId) : undefined
                        }
                      />
                    );
                  })}
                </div>
              )}
            </section>
          ) : null}

          <section className="flex flex-col gap-3">
            <SectionHeading title="Needs attention" hint="Due today or already overdue" />
            {view.attention.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="Nothing due today"
                description="The runway is clear. Capture something new or pull work forward."
                action={<Button onPress={() => openQuickCapture()}>Capture something</Button>}
              />
            ) : (
              <div className="flex flex-col gap-2">
                {view.attention.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    projectName={task.projectId ? projectNames.get(task.projectId) : undefined}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <SectionHeading title="Upcoming" hint="Next scheduled work" />
            {view.upcoming.length === 0 ? (
              <div className="surface-card text-sm text-muted">No upcoming due dates.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {view.upcoming.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    projectName={task.projectId ? projectNames.get(task.projectId) : undefined}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <SectionHeading
              title="This week"
              hint="Agenda for the next seven days"
              action={<LinkRow to="/calendar" label="Open calendar" />}
            />

            {weekEvents.length === 0 ? (
              <div className="surface-card flex items-center justify-between gap-3 text-sm text-muted">
                <span>No events scheduled this week.</span>
                <LinkRow to="/calendar" label="Add one" />
              </div>
            ) : (
              <div className="surface-card flex flex-col divide-y divide-border p-0">
                {weekEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-4">
                    <div className="flex w-24 shrink-0 flex-col items-center rounded-lg bg-surface-secondary px-1 py-1.5">
                      <span className="text-xs font-medium text-muted">
                        {formatWeekday(parseDateOnly(event.date))}
                      </span>
                      <span className="text-xs whitespace-nowrap text-foreground tabular-nums">
                        {eventTimeLabel(event)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{event.title}</p>
                      <p className="text-xs text-muted">
                        {event.projectId
                          ? (projectNames.get(event.projectId) ?? 'No project')
                          : 'No project'}
                      </p>
                    </div>
                    <Calendar className="ml-auto size-4 shrink-0 text-muted" aria-hidden />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <section className="flex flex-col gap-3">
            <SectionHeading title="Recent notes" action={<LinkRow to="/knowledge" label="All notes" />} />
            {view.recentNotes.length === 0 ? (
              <EmptyState
                icon={NotebookPen}
                title="No notes yet"
                description="Write the first note and it will show up here."
                action={
                  <Button onPress={() => openQuickCapture('note')}>Capture a note</Button>
                }
              />
            ) : (
              <div className="flex flex-col gap-2">
                {view.recentNotes.map((note) => (
                  <Link
                    key={note.id}
                    to={`/knowledge/${note.id}`}
                    className="surface-card transition-colors hover:border-accent/50 hover:bg-surface-secondary/40"
                  >
                    <p className="text-sm font-medium text-foreground">{note.title}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {note.tags.slice(0, 3).map((tag) => (
                        <AppTag key={tag}>{tag}</AppTag>
                      ))}
                      <RelativeTime iso={note.updatedAt} className="text-xs text-muted" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <SectionHeading title="Active projects" action={<LinkRow to="/projects" label="All projects" />} />
            {view.activeProjects.length === 0 ? (
              <div className="surface-card text-sm text-muted">No active projects.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {view.activeProjects.map(({ project, progress }) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="surface-card transition-colors hover:border-accent/50 hover:bg-surface-secondary/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{project.name}</p>
                      <span className="text-xs text-muted">{progress.percent}%</span>
                    </div>
                    <ProgressBar
                      aria-label={`Progress for ${project.name}`}
                      value={progress.percent}
                      className="mt-2"
                    >
                      <ProgressBar.Track>
                        <ProgressBar.Fill />
                      </ProgressBar.Track>
                    </ProgressBar>
                    <p className="mt-1.5 text-xs text-muted">
                      {progress.done} of {progress.total} tasks done
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function SectionHeading({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

function LinkRow({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="text-xs text-accent hover:underline">
      {label}
    </Link>
  );
}

function QuickCaptureCard() {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<InboxItemType>('note');
  const createItem = useCreateInboxItem();
  const canSubmit = title.trim().length > 0 && !createItem.isPending;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      await createItem.mutateAsync({ title: title.trim(), type });
      setTitle('');
    } catch {
      // The mutation hook already surfaced the error as a toast.
    }
  };

  return (
    <form onSubmit={handleSubmit} className="surface-card flex flex-col gap-2 sm:flex-row sm:items-center">
      <TextField value={title} onChange={setTitle} className="flex-1">
        <Input placeholder="Capture something before it disappears…" aria-label="Quick capture title" />
      </TextField>
      <div className="flex items-center gap-2">
        <Select
          value={type}
          onChange={(value) => setType((value as InboxItemType | null) ?? 'note')}
          aria-label="Capture type"
          className="w-28"
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {TYPE_OPTIONS.map((option) => (
                <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
                  {option.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
        <Button type="submit" isDisabled={!canSubmit} isPending={createItem.isPending}>
          <Plus className="size-4" aria-hidden />
          Add
        </Button>
      </div>
    </form>
  );
}
