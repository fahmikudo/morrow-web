import { parseDateOnly, toDateOnly, todayIso } from '@/lib/date';
import {
  habitProgress,
  habitScheduleDates,
  habitStreak,
  isHabitScheduledOn,
  periodRange,
  shiftDate,
} from '@/lib/habits';
import type { Event, Habit, HabitCheckIn, Note, Project, Task } from '@/types';

export type ProjectInsights = {
  active: number;
  onTrack: number;
  needsAttention: number;
  quiet: number;
  averageProgress: number;
};

export type ProjectDetailInsights = {
  open: number;
  overdue: number;
  done: number;
  progress: number;
  lastActivity: string | null;
};

export type TaskInsights = {
  open: number;
  overdue: number;
  dueThisWeek: number;
  doneThisWeek: number;
  dueSoFar: number;
  completedDueSoFar: number;
};

export type HabitInsights = {
  active: number;
  onTrack: number;
  weeklyConsistency: number | null;
  bestStreak: number;
};

export type EventInsights = {
  events: number;
  overlaps: number;
  busyDays: number;
  timedEvents: number;
};

export type KnowledgeInsights = {
  notes: number;
  newThisWeek: number;
  linkedToProjects: number;
  tags: number;
};

export type PersonalInsights = {
  execution: number | null;
  consistency: number | null;
  carryover: number | null;
};

const DAY_MS = 86_400_000;

function leafTasks(tasks: Task[]): Task[] {
  const parents = new Set(
    tasks.map((task) => task.parentId).filter((parentId): parentId is string => Boolean(parentId)),
  );
  return tasks.filter((task) => !parents.has(task.id));
}

function dayDiff(dateOnly: string, now: Date): number {
  const target = parseDateOnly(dateOnly);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - start.getTime()) / DAY_MS);
}

function timestampDay(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return toDateOnly(date);
}

function percent(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 100);
}

function projectLastActivity(project: Project, tasks: Task[]): string {
  return tasks
    .filter((task) => task.projectId === project.id)
    .reduce((latest, task) => (task.updatedAt > latest ? task.updatedAt : latest), project.updatedAt);
}

export function projectInsights(
  projects: Project[],
  tasks: Task[],
  now: Date = new Date(),
): ProjectInsights {
  const activeProjects = projects.filter((project) => project.status === 'active');
  const leaves = leafTasks(tasks);
  let progressTotal = 0;
  let progressCount = 0;
  let onTrack = 0;
  let needsAttention = 0;
  let quiet = 0;

  for (const project of activeProjects) {
    const projectTasks = leaves.filter((task) => task.projectId === project.id);
    const done = projectTasks.filter((task) => task.status === 'done').length;
    const overdue = projectTasks.filter(
      (task) => task.status !== 'done' && task.dueDate && task.dueDate < todayIso(now),
    ).length;
    const lastDay = timestampDay(projectLastActivity(project, tasks));
    const quietDays = lastDay ? -dayDiff(lastDay, now) : 0;

    if (projectTasks.length > 0) {
      progressTotal += Math.round((done / projectTasks.length) * 100);
      progressCount += 1;
    }
    if (overdue > 0) needsAttention += 1;
    else onTrack += 1;
    if (quietDays >= 14) quiet += 1;
  }

  return {
    active: activeProjects.length,
    onTrack,
    needsAttention,
    quiet,
    averageProgress: progressCount > 0 ? Math.round(progressTotal / progressCount) : 0,
  };
}

export function projectDetailInsights(
  project: Project,
  tasks: Task[],
  now: Date = new Date(),
): ProjectDetailInsights {
  const projectLeaves = leafTasks(tasks).filter((task) => task.projectId === project.id);
  const done = projectLeaves.filter((task) => task.status === 'done').length;
  const openTasks = projectLeaves.filter((task) => task.status !== 'done');
  const overdue = openTasks.filter((task) => task.dueDate && task.dueDate < todayIso(now)).length;

  return {
    open: openTasks.length,
    overdue,
    done,
    progress: projectLeaves.length > 0 ? Math.round((done / projectLeaves.length) * 100) : 0,
    lastActivity: projectLastActivity(project, tasks),
  };
}

export function taskInsights(tasks: Task[], now: Date = new Date()): TaskInsights {
  const today = todayIso(now);
  const week = periodRange('weekly', today);
  const openTasks = tasks.filter((task) => task.status !== 'done');
  const overdue = openTasks.filter((task) => task.dueDate && task.dueDate < today).length;
  const dueThisWeek = openTasks.filter(
    (task) => task.dueDate && task.dueDate >= week.start && task.dueDate <= week.end,
  ).length;
  const doneThisWeek = tasks.filter(
    (task) => task.status === 'done' && timestampDay(task.updatedAt) !== null &&
      (timestampDay(task.updatedAt) ?? '') >= week.start &&
      (timestampDay(task.updatedAt) ?? '') <= week.end,
  ).length;
  const dueSoFar = tasks.filter(
    (task) => task.dueDate && task.dueDate >= week.start && task.dueDate <= today,
  );
  const completedDueSoFar = dueSoFar.filter((task) => task.status === 'done').length;

  return {
    open: openTasks.length,
    overdue,
    dueThisWeek,
    doneThisWeek,
    dueSoFar: dueSoFar.length,
    completedDueSoFar,
  };
}

export function habitInsights(
  habits: Habit[],
  checkIns: HabitCheckIn[],
  now: Date = new Date(),
): HabitInsights {
  const today = todayIso(now);
  const week = periodRange('weekly', today);
  const active = habits.filter((habit) => !habit.archivedAt && habit.startDate <= today);
  const onTrack = active.filter((habit) => habitProgress(habit, checkIns, today).met).length;
  const bestStreak = active.reduce(
    (best, habit) => Math.max(best, habitStreak(habit, checkIns, today)),
    0,
  );

  let scheduled = 0;
  let checked = 0;
  for (const habit of active) {
    if (habit.schedule.kind !== 'fixed') continue;

    const start = habit.startDate > week.start ? habit.startDate : week.start;
    const end = week.end > today ? today : week.end;
    if (start > end) continue;

    const days = habitScheduleDates(habit, start, end);
    scheduled += days.length;
    checked += days.filter((date) =>
      checkIns.some((entry) => entry.habitId === habit.id && entry.date === date),
    ).length;
  }

  return {
    active: active.length,
    onTrack,
    weeklyConsistency: percent(checked, scheduled),
    bestStreak,
  };
}

function minutes(clock: string | undefined): number | null {
  if (!clock) return null;
  const [hour, minute] = clock.split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

function summarizeEvents(inRange: Event[]): EventInsights {
  const timed = inRange.filter(
    (event) => minutes(event.startTime) !== null && minutes(event.endTime) !== null,
  );
  const overlaps = timed.filter((event) =>
    timed.some((other) => {
      if (other.id === event.id || other.date !== event.date) return false;
      return (
        (minutes(event.startTime) ?? 0) < (minutes(other.endTime) ?? 0) &&
        (minutes(other.startTime) ?? 0) < (minutes(event.endTime) ?? 0)
      );
    }),
  ).length;

  return {
    events: inRange.length,
    overlaps,
    busyDays: new Set(inRange.map((event) => event.date)).size,
    timedEvents: timed.length,
  };
}

export function eventInsights(
  events: Event[],
  month: Date = new Date(),
): EventInsights {
  const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
  return summarizeEvents(events.filter((event) => event.date.startsWith(monthKey)));
}

/** Insights for an inclusive `YYYY-MM-DD` range, used by the weekly calendar. */
export function eventRangeInsights(
  events: Event[],
  start: string,
  end: string,
): EventInsights {
  return summarizeEvents(events.filter((event) => event.date >= start && event.date <= end));
}

export function knowledgeInsights(
  notes: Note[],
  now: Date = new Date(),
): KnowledgeInsights {
  const today = todayIso(now);
  const week = periodRange('weekly', today);
  const start = new Date(`${week.start}T00:00:00`);
  const end = new Date(`${week.end}T23:59:59.999`);

  return {
    notes: notes.length,
    newThisWeek: notes.filter((note) => {
      const created = new Date(note.createdAt);
      return created >= start && created <= end;
    }).length,
    linkedToProjects: notes.filter((note) => Boolean(note.projectId)).length,
    tags: new Set(notes.flatMap((note) => note.tags)).size,
  };
}

export function personalInsights(
  tasks: Task[],
  habits: Habit[],
  checkIns: HabitCheckIn[],
  now: Date = new Date(),
): PersonalInsights {
  const today = todayIso(now);
  const week = periodRange('weekly', today);
  const weekEnd = week.end > today ? today : week.end;
  const dueTasks = tasks.filter(
    (task) => task.dueDate && task.dueDate >= week.start && task.dueDate <= today,
  );
  const doneTasks = dueTasks.filter((task) => task.status === 'done').length;
  const activeHabits = habits.filter((habit) => !habit.archivedAt && habit.startDate <= today);

  let scheduled = 0;
  let checked = 0;
  let eligibleDays = 0;
  let successfulDays = 0;

  for (const habit of activeHabits) {
    if (habit.schedule.kind !== 'fixed') continue;

    const start = habit.startDate > week.start ? habit.startDate : week.start;
    if (start > weekEnd) continue;

    const days = habitScheduleDates(habit, start, weekEnd);
    scheduled += days.length;
    checked += days.filter((date) =>
      checkIns.some((entry) => entry.habitId === habit.id && entry.date === date),
    ).length;
  }

  for (const date of datesBetween(week.start, weekEnd)) {
    const due = tasks.filter((task) => task.dueDate === date);
    const scheduledHabits = activeHabits.filter(
      (habit) => habit.schedule.kind === 'fixed' && isHabitScheduledOn(habit, date),
    );
    if (due.length === 0 && scheduledHabits.length === 0) continue;

    eligibleDays += 1;
    const tasksDone = due.every((task) => task.status === 'done');
    const habitsDone = scheduledHabits.every((habit) =>
      checkIns.some((entry) => entry.habitId === habit.id && entry.date === date),
    );
    if (tasksDone && habitsDone) successfulDays += 1;
  }

  const due = dueTasks.length;
  return {
    execution: percent(doneTasks + checked, due + scheduled),
    consistency: percent(successfulDays, eligibleDays),
    carryover: percent(due - doneTasks, due),
  };
}

function datesBetween(from: string, to: string): string[] {
  const dates: string[] = [];
  let cursor = from;
  while (cursor <= to) {
    dates.push(cursor);
    cursor = shiftDate(cursor, 1);
  }
  return dates;
}
