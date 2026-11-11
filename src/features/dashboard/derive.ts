import { daysFromNow, isOverdue, todayIso } from '@/lib/date';
import { areaSummary, effectiveAreaId, type AreaSummary } from '@/lib/area';
import {
  habitProgress,
  habitStreak,
  isHabitDueOn,
  isHabitEnded,
  type HabitProgress,
} from '@/lib/habits';
import { projectProgress, type ProjectProgress } from '@/features/projects/progress';
import type {
  Area,
  Event,
  Habit,
  HabitCheckIn,
  InboxItem,
  Note,
  Project,
  Task,
} from '@/types';

export type DashboardStats = {
  openTasks: number;
  overdueTasks: number;
  dueThisWeek: number;
  doneLast7Days: number;
  completionPercent: number;
  activeProjects: number;
  habitsOnTrack: number;
  habitsTotal: number;
  notes: number;
  inboxItems: number;
  eventsNext7Days: number;
};

export type WeekLoadDay = {
  date: string;
  tasks: number;
  events: number;
};

export type StatusBreakdown = {
  todo: number;
  in_progress: number;
  done: number;
  total: number;
};

export type ProjectRisk = {
  project: Project;
  progress: ProjectProgress;
  overdue: number;
  open: number;
};

export type AreaOverview = {
  area: Area;
  summary: AreaSummary;
  habits: number;
  habitsOnTrack: number;
};

export type HabitOverview = {
  habit: Habit;
  progress: HabitProgress;
  streak: number;
};

export type DashboardView = {
  stats: DashboardStats;
  weekLoad: WeekLoadDay[];
  status: StatusBreakdown;
  projectsAtRisk: ProjectRisk[];
  areas: AreaOverview[];
  habits: HabitOverview[];
  recentNotes: Note[];
  topTags: Array<{ tag: string; count: number }>;
  oldestInboxItem: InboxItem | null;
};

export type DashboardInput = {
  areas: Area[];
  tasks: Task[];
  projects: Project[];
  notes: Note[];
  events: Event[];
  habits: Habit[];
  checkIns: HabitCheckIn[];
  inbox: InboxItem[];
};

const RISK_LIMIT = 4;
const HABIT_LIMIT = 5;
const TAG_LIMIT = 6;

export function buildDashboard(input: DashboardInput, now: Date = new Date()): DashboardView {
  const { tasks, projects, notes, events, habits, checkIns, inbox } = input;
  const today = todayIso(now);
  const weekEnd = daysFromNow(6, now);
  const doneCutoff = new Date(now.getTime() - 7 * 86_400_000).toISOString();

  const parentIds = new Set(
    tasks.map((task) => task.parentId).filter((parentId): parentId is string => Boolean(parentId)),
  );
  const leaves = tasks.filter((task) => !parentIds.has(task.id));
  const openTasks = tasks.filter((task) => task.status !== 'done');

  const doneLeaves = leaves.filter((task) => task.status === 'done').length;
  const completionPercent =
    leaves.length > 0 ? Math.round((doneLeaves / leaves.length) * 100) : 0;

  const activeHabits = habits.filter(
    (habit) => !habit.archivedAt && !isHabitEnded(habit, today),
  );

  const habitOverviews: HabitOverview[] = activeHabits
    .map((habit) => ({
      habit,
      progress: habitProgress(habit, checkIns, today),
      streak: habitStreak(habit, checkIns, today),
    }))
    .sort(
      (a, b) =>
        Number(a.progress.met) - Number(b.progress.met) ||
        a.progress.percent - b.progress.percent ||
        a.habit.title.localeCompare(b.habit.title),
    );

  const areas: AreaOverview[] = input.areas
    .map((area) => {
      const areaHabits = activeHabits.filter(
        (habit) => effectiveAreaId(habit, projects) === area.id,
      );
      return {
        area,
        summary: areaSummary(area.id, projects, tasks, notes),
        habits: areaHabits.length,
        habitsOnTrack: areaHabits.filter(
          (habit) => habitProgress(habit, checkIns, today).met,
        ).length,
      };
    })
    .sort((a, b) => b.summary.openTasks - a.summary.openTasks || a.area.name.localeCompare(b.area.name));

  const projectsAtRisk: ProjectRisk[] = projects
    .filter((project) => project.status === 'active')
    .map((project) => {
      const projectTasks = tasks.filter((task) => task.projectId === project.id);
      return {
        project,
        progress: projectProgress(project.id, tasks),
        overdue: projectTasks.filter((task) => isOverdue(task, now)).length,
        open: projectTasks.filter((task) => task.status !== 'done').length,
      };
    })
    .filter((entry) => entry.overdue > 0)
    .sort(
      (a, b) =>
        b.overdue - a.overdue ||
        a.progress.percent - b.progress.percent ||
        a.project.updatedAt.localeCompare(b.project.updatedAt),
    )
    .slice(0, RISK_LIMIT);

  const tagCounts = new Map<string, number>();
  for (const note of notes) {
    for (const tag of note.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, TAG_LIMIT)
    .map(([tag, count]) => ({ tag, count }));

  const weekLoad: WeekLoadDay[] = Array.from({ length: 7 }, (_, index) => {
    const date = daysFromNow(index, now);
    return {
      date,
      tasks: openTasks.filter((task) => task.dueDate === date).length,
      events: events.filter((event) => event.date === date).length,
    };
  });

  const oldestInboxItem =
    inbox.length > 0
      ? [...inbox].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0]
      : null;

  return {
    stats: {
      openTasks: openTasks.length,
      overdueTasks: openTasks.filter((task) => isOverdue(task, now)).length,
      dueThisWeek: openTasks.filter(
        (task) => task.dueDate && task.dueDate >= today && task.dueDate <= weekEnd,
      ).length,
      doneLast7Days: tasks.filter(
        (task) => task.status === 'done' && task.updatedAt >= doneCutoff,
      ).length,
      completionPercent,
      activeProjects: projects.filter((project) => project.status === 'active').length,
      habitsOnTrack: habitOverviews.filter((entry) => entry.progress.met).length,
      habitsTotal: habits.length,
      notes: notes.length,
      inboxItems: inbox.length,
      eventsNext7Days: events.filter((event) => event.date >= today && event.date <= weekEnd).length,
    },
    weekLoad,
    status: {
      todo: tasks.filter((task) => task.status === 'todo').length,
      in_progress: tasks.filter((task) => task.status === 'in_progress').length,
      done: tasks.filter((task) => task.status === 'done').length,
      total: tasks.length,
    },
    projectsAtRisk,
    areas,
    habits: habitOverviews.slice(0, HABIT_LIMIT),
    recentNotes: [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3),
    topTags,
    oldestInboxItem,
  };
}

export function habitDueTodayCount(input: DashboardInput, now: Date = new Date()): number {
  const today = todayIso(now);
  return input.habits.filter((habit) => isHabitDueOn(habit, input.checkIns, today)).length;
}
