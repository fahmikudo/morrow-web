import { Link } from 'react-router';
import {
  CalendarDays,
  CircleCheck,
  Flame,
  Gauge,
  Inbox,
  ListTodo,
  Percent,
  Repeat,
} from 'lucide-react';
import { ProgressBar } from '@heroui/react';
import { AreaBadge } from '@/components/shared/AreaBadge';
import { AppTag } from '@/components/shared/AppTag';
import { EntityIcon } from '@/components/shared/EntityIcon';
import { ErrorState } from '@/components/shared/ErrorState';
import { InsightStrip } from '@/components/shared/InsightStrip';
import { PageHeader } from '@/components/shared/PageHeader';
import { RelativeTime } from '@/components/shared/RelativeTime';
import { SkeletonList } from '@/components/shared/SkeletonList';
import { StatTile } from '@/components/shared/StatTile';
import { AREA_TONE_PROGRESS } from '@/features/areas/tones';
import { useAreas } from '@/features/areas/queries';
import { useEvents } from '@/features/calendar/queries';
import { useHabitCheckIns, useHabitSkips, useHabits } from '@/features/habits/queries';
import { useNotes } from '@/features/knowledge/queries';
import { useInboxItems } from '@/features/inbox/queries';
import { useProjects } from '@/features/projects/queries';
import { useTasks } from '@/features/tasks/queries';
import { formatDate, formatRelative, formatWeekday, parseDateOnly, todayIso } from '@/lib/date';
import { periodRange } from '@/lib/habits';
import { personalInsights } from '@/lib/insights';
import { effectiveAreaId } from '@/lib/area';
import { buildDashboard, habitDueTodayCount } from './derive';

export function DashboardPage() {
  const now = new Date();
  const today = todayIso(now);

  const tasksQuery = useTasks();
  const projectsQuery = useProjects();
  const areasQuery = useAreas();
  const notesQuery = useNotes();
  const eventsQuery = useEvents();
  const habitsQuery = useHabits();
  const checkInsQuery = useHabitCheckIns();
  const skipsQuery = useHabitSkips();
  const inboxQuery = useInboxItems();

  const queries = [
    tasksQuery,
    projectsQuery,
    areasQuery,
    notesQuery,
    eventsQuery,
    habitsQuery,
    checkInsQuery,
    skipsQuery,
    inboxQuery,
  ];
  const isPending = queries.some((query) => query.isPending);
  const isError = queries.some((query) => query.isError);

  const week = periodRange('weekly', today);
  const header = (
    <PageHeader
      title="Dashboard"
      description={`Week of ${formatDate(week.start)} – ${formatDate(week.end)} · everything across areas, projects, tasks, habits and notes.`}
    />
  );

  if (isPending) {
    return (
      <>
        {header}
        <SkeletonList rows={5} />
      </>
    );
  }

  if (isError) {
    return (
      <>
        {header}
        <ErrorState
          onRetry={() => {
            queries.forEach((query) => void query.refetch());
          }}
        />
      </>
    );
  }

  const input = {
    areas: areasQuery.data ?? [],
    tasks: tasksQuery.data ?? [],
    projects: projectsQuery.data ?? [],
    notes: notesQuery.data ?? [],
    events: eventsQuery.data ?? [],
    habits: habitsQuery.data ?? [],
    checkIns: checkInsQuery.data ?? [],
    skips: skipsQuery.data ?? [],
    inbox: inboxQuery.data ?? [],
  };
  const view = buildDashboard(input, now);
  const dueHabits = habitDueTodayCount(input, now);
  const rhythm = personalInsights(input.tasks, input.habits, input.checkIns, now);
  const areaById = new Map(input.areas.map((area) => [area.id, area]));
  const maxLoad = Math.max(1, ...view.weekLoad.map((day) => day.tasks + day.events));

  return (
    <>
      {header}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
        <StatTile
          label="Open tasks"
          value={view.stats.openTasks}
          icon={ListTodo}
          tone="accent"
          hint={`${view.stats.overdueTasks} overdue`}
        />
        <StatTile
          label="Due this week"
          value={view.stats.dueThisWeek}
          icon={CalendarDays}
          hint="including today"
        />
        <StatTile
          label="Done · 7 days"
          value={view.stats.doneLast7Days}
          icon={CircleCheck}
          tone="success"
        />
        <StatTile
          label="Completion"
          value={`${view.stats.completionPercent}%`}
          icon={Percent}
          tone="success"
          hint="leaf tasks"
        />
        <StatTile
          label="Habits on track"
          value={`${view.stats.habitsOnTrack}/${view.stats.habitsTotal}`}
          icon={Repeat}
          tone="accent"
          hint={`${dueHabits} due today`}
        />
        <StatTile
          label="Inbox"
          value={view.stats.inboxItems}
          icon={Inbox}
          hint={
            view.oldestInboxItem
              ? `oldest ${formatRelative(view.oldestInboxItem.createdAt, now)}`
              : 'nothing waiting'
          }
        />
      </div>

      <section className="mb-6 flex flex-col gap-3">
        <SectionHeader
          title="Personal rhythm"
          hint="This week across tasks and fixed habits"
        />
        <InsightStrip
          items={[
            {
              label: 'Execution',
              value: rhythm.execution === null ? '—' : `${rhythm.execution}%`,
              tone: 'accent',
              hint: 'commitments completed',
            },
            {
              label: 'Consistency',
              value: rhythm.consistency === null ? '—' : `${rhythm.consistency}%`,
              tone: 'success',
              hint: 'planned days completed',
            },
            {
              label: 'Carryover',
              value: rhythm.carryover === null ? '—' : `${rhythm.carryover}%`,
              tone: rhythm.carryover && rhythm.carryover > 0 ? 'warning' : 'neutral',
              hint: 'due work unfinished',
            },
          ]}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="surface-card flex flex-col gap-4">
            <SectionHeader
              title="Workload"
              hint="Open tasks due and events, next seven days"
            />
            <div
              className="flex items-end gap-2"
              role="img"
              aria-label={view.weekLoad
                .map((day) => `${formatWeekday(parseDateOnly(day.date))}: ${day.tasks} tasks, ${day.events} events`)
                .join('; ')}
            >
              {view.weekLoad.map((day) => {
                const total = day.tasks + day.events;
                const date = parseDateOnly(day.date);

                return (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] text-muted">{total > 0 ? total : ''}</span>
                    <div className="flex h-24 w-full max-w-9 flex-col-reverse overflow-hidden rounded bg-surface-secondary">
                      <div
                        className="w-full bg-success"
                        style={{ height: `${Math.round((day.events / maxLoad) * 100)}%` }}
                        aria-hidden
                      />
                      <div
                        className="w-full bg-accent"
                        style={{ height: `${Math.round((day.tasks / maxLoad) * 100)}%` }}
                        aria-hidden
                      />
                    </div>
                    <span className="text-[10px] text-muted">{formatWeekday(date)}</span>
                    <span className="text-[10px] text-muted">{date.getDate()}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-sm bg-accent" aria-hidden />
                Tasks
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-sm bg-success" aria-hidden />
                Events
              </span>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <SectionHeader
              title="Projects at risk"
              hint="Active projects with overdue work"
              action={<Link to="/projects" className="text-xs text-accent hover:underline">All projects</Link>}
            />
            {view.projectsAtRisk.length === 0 ? (
              <div className="surface-card text-sm text-muted">
                Every active project is on track. Nothing overdue.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {view.projectsAtRisk.map(({ project, progress, overdue, open }) => {
                  const area = project.areaId ? areaById.get(project.areaId) : undefined;

                  return (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      className="motion-card surface-card hover:border-accent/50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2">
                          <EntityIcon kind="project" className="size-4" />
                          <span className="truncate text-sm font-medium text-foreground">
                            {project.key} · {project.name}
                          </span>
                        </span>
                        <AppTag variant="danger">{overdue} overdue</AppTag>
                      </div>
                      {area ? (
                        <div className="mt-1">
                          <AreaBadge area={area} />
                        </div>
                      ) : null}
                      <ProgressBar
                        aria-label={`Progress for ${project.name}`}
                        value={progress.percent}
                        className="mt-2"
                      >
                        <ProgressBar.Track>
                          <ProgressBar.Fill />
                        </ProgressBar.Track>
                      </ProgressBar>
                      <p className="mt-1 text-xs text-muted">
                        {progress.done} of {progress.total} done · {open} open
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <SectionHeader
              title="Areas"
              hint="Projects, tasks and notes per area"
              action={<Link to="/areas" className="text-xs text-accent hover:underline">All areas</Link>}
            />
            {view.areas.length === 0 ? (
              <div className="surface-card text-sm text-muted">No areas yet.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {view.areas.map(({ area, summary, habits, habitsOnTrack }) => (
                  <Link
                    key={area.id}
                    to={`/areas/${area.id}`}
                    className="motion-card surface-card hover:border-accent/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <AreaBadge area={area} />
                      <span className="text-xs text-muted">{summary.percent}%</span>
                    </div>
                    <ProgressBar
                      aria-label={`Progress for ${area.name}`}
                      value={summary.percent}
                      color={AREA_TONE_PROGRESS[area.tone]}
                      className="mt-2"
                    >
                      <ProgressBar.Track>
                        <ProgressBar.Fill />
                      </ProgressBar.Track>
                    </ProgressBar>
                    <p className="mt-1 text-xs text-muted">
                      {summary.projects} project{summary.projects === 1 ? '' : 's'} ·{' '}
                      {summary.openTasks} open · {summary.notes} note
                      {summary.notes === 1 ? '' : 's'}
                      {habits > 0
                        ? ` · ${habits} habit${habits === 1 ? '' : 's'} (${habitsOnTrack} on track)`
                        : ''}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <section className="flex flex-col gap-3">
            <SectionHeader
              title="Habits"
              hint="This week's quota"
              action={<Link to="/habits" className="text-xs text-accent hover:underline">All habits</Link>}
            />
            {view.habits.length === 0 ? (
              <div className="surface-card text-sm text-muted">No habits yet.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {view.habits.map(({ habit, progress, streak }) => {
                  const areaId = effectiveAreaId(habit, input.projects);

                  return (
                    <div
                      key={habit.id}
                      className="flex items-center gap-2 rounded-xl border border-border bg-surface p-2.5"
                    >
                      <EntityIcon kind="habit" className="size-4" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {habit.title}
                        </p>
                        <p className="text-xs text-muted">
                          {progress.count}/{progress.target} ·{' '}
                          {areaId ? (areaById.get(areaId)?.name ?? 'Area') : 'No area'}
                        </p>
                      </div>
                      {streak > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-warning">
                          <Flame className="size-3" aria-hidden />
                          {streak}
                        </span>
                      ) : null}
                      <span
                        className={
                          progress.met
                            ? 'text-xs font-medium text-success'
                            : 'text-xs font-medium text-muted'
                        }
                      >
                        {progress.percent}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <SectionHeader
              title="Knowledge"
              hint={`${view.stats.notes} notes`}
              action={<Link to="/knowledge" className="text-xs text-accent hover:underline">All notes</Link>}
            />
            {view.recentNotes.length === 0 ? (
              <div className="surface-card text-sm text-muted">No notes yet.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {view.recentNotes.map((note) => (
                  <Link
                    key={note.id}
                    to={`/knowledge/${note.id}`}
                    className="motion-card surface-card hover:border-accent/50"
                  >
                    <p className="truncate text-sm font-medium text-foreground">{note.title}</p>
                    <RelativeTime iso={note.updatedAt} className="text-xs text-muted" />
                  </Link>
                ))}
              </div>
            )}
            {view.topTags.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="section-label">Top tags</span>
                {view.topTags.map(({ tag, count }) => (
                  <AppTag key={tag}>
                    {tag} <span className="ml-1 text-muted">{count}</span>
                  </AppTag>
                ))}
              </div>
            ) : null}
          </section>

          <section className="surface-card flex flex-col gap-2">
            <SectionHeader
              title="Inbox"
              action={<Link to="/inbox" className="text-xs text-accent hover:underline">Open</Link>}
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-2xl font-semibold text-foreground">
                {view.stats.inboxItems}
              </span>
              <span className="text-xs text-muted">
                {view.oldestInboxItem ? (
                  <>
                    oldest <RelativeTime iso={view.oldestInboxItem.createdAt} />
                  </>
                ) : (
                  'nothing waiting'
                )}
              </span>
            </div>
            <p className="text-xs text-muted">
              {view.stats.eventsNext7Days} events in the next seven days.
            </p>
          </section>

          <section className="surface-card flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <Gauge className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {view.stats.activeProjects} active projects
              </p>
              <p className="text-xs text-muted">
                {view.status.todo} todo · {view.status.in_progress} in progress ·{' '}
                {view.status.done} done
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function SectionHeader({
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
