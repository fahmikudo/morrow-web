import { effectiveAreaId } from '@/lib/area';
import type { Project, Task, TaskPriority, TaskStatus, TaskType } from '@/types';

export type TaskFilters = {
  type: 'all' | TaskType;
  status: 'all' | TaskStatus;
  priority: 'all' | TaskPriority;
  projectId: 'all' | string;
  area: 'all' | string;
  label: 'all' | string;
  query: string;
  sort: 'dueSoon' | 'priority' | 'createdNewest' | 'title';
};

export const defaultTaskFilters: TaskFilters = {
  type: 'all',
  status: 'all',
  priority: 'all',
  projectId: 'all',
  area: 'all',
  label: 'all',
  query: '',
  sort: 'dueSoon',
};

const PRIORITY_RANK: Record<TaskPriority, number> = { low: 1, medium: 2, high: 3 };

/** Ascending due date, undated tasks last. */
function compareDueDate(a: Task, b: Task): number {
  if (!a.dueDate && !b.dueDate) return 0;
  if (!a.dueDate) return 1;
  if (!b.dueDate) return -1;
  return a.dueDate.localeCompare(b.dueDate);
}

export function filterAndSortTasks(
  tasks: Task[],
  filters: TaskFilters,
  projects: Project[] = [],
): Task[] {
  const needle = filters.query.trim().toLowerCase();
  const label = filters.label.toLowerCase();

  const filtered = tasks.filter((task) => {
    if (filters.type !== 'all' && task.type !== filters.type) return false;
    if (filters.status !== 'all' && task.status !== filters.status) return false;
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
    if (filters.projectId !== 'all' && task.projectId !== filters.projectId) return false;
    if (filters.area !== 'all' && effectiveAreaId(task, projects) !== filters.area) return false;
    if (filters.label !== 'all' && !task.labels.some((entry) => entry.toLowerCase() === label)) {
      return false;
    }
    if (!needle) return true;

    return (
      task.title.toLowerCase().includes(needle) ||
      (task.description ?? '').toLowerCase().includes(needle) ||
      task.key.toLowerCase().includes(needle) ||
      task.labels.some((entry) => entry.toLowerCase().includes(needle))
    );
  });

  const sorted = [...filtered];

  switch (filters.sort) {
    case 'priority':
      sorted.sort(
        (a, b) =>
          PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] ||
          compareDueDate(a, b) ||
          b.createdAt.localeCompare(a.createdAt),
      );
      break;
    case 'createdNewest':
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
    case 'title':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'dueSoon':
      sorted.sort(
        (a, b) => compareDueDate(a, b) || PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority],
      );
      break;
  }

  return sorted;
}
