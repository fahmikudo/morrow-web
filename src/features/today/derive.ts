import { isDueToday, isOverdue, todayIso } from '@/lib/date';
import { projectProgress, type ProjectProgress } from '@/features/projects/progress';
import type { Note, Project, Task, TaskPriority } from '@/types';

export type TodayStats = {
  dueToday: number;
  overdue: number;
  inProgress: number;
  activeProjects: number;
};

const PRIORITY_RANK: Record<TaskPriority, number> = { low: 1, medium: 2, high: 3 };

export type TodayView = {
  stats: TodayStats;
  attention: Task[];
  upcoming: Task[];
  recentNotes: Note[];
  activeProjects: Array<{ project: Project; progress: ProjectProgress }>;
};

export function deriveToday(
  tasks: Task[],
  notes: Note[],
  projects: Project[],
  now: Date = new Date(),
): TodayView {
  const today = todayIso(now);
  const openTasks = tasks.filter((task) => task.status !== 'done');
  const isOverdueTask = (task: Task) => Boolean(task.dueDate) && task.dueDate! < today;

  const attention = openTasks
    .filter((task) => isOverdue(task, now) || isDueToday(task, now))
    .sort(
      (a, b) =>
        Number(isOverdueTask(b)) - Number(isOverdueTask(a)) ||
        PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] ||
        a.title.localeCompare(b.title),
    )
    .slice(0, 6);

  const upcoming = openTasks
    .filter((task) => Boolean(task.dueDate) && task.dueDate! > today)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!) || a.title.localeCompare(b.title))
    .slice(0, 5);

  const recentNotes = [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4);

  const activeProjects = projects
    .filter((project) => project.status === 'active')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3)
    .map((project) => ({ project, progress: projectProgress(project.id, tasks) }));

  return {
    stats: {
      dueToday: openTasks.filter((task) => isDueToday(task, now)).length,
      overdue: openTasks.filter((task) => isOverdue(task, now)).length,
      inProgress: tasks.filter((task) => task.status === 'in_progress').length,
      activeProjects: projects.filter((project) => project.status === 'active').length,
    },
    attention,
    upcoming,
    recentNotes,
    activeProjects,
  };
}
