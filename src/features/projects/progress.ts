import type { Task } from '@/types';

export type ProjectProgress = {
  total: number;
  done: number;
  percent: number;
};

/**
 * Counts leaf tasks only: a parent and its subtasks must not inflate the same bar.
 */
export function projectProgress(projectId: string, tasks: Task[]): ProjectProgress {
  const parentIds = new Set(
    tasks.map((task) => task.parentId).filter((parentId): parentId is string => Boolean(parentId)),
  );

  const leaves = tasks.filter(
    (task) => task.projectId === projectId && !parentIds.has(task.id),
  );
  const done = leaves.filter((task) => task.status === 'done').length;
  const total = leaves.length;

  return {
    total,
    done,
    percent: total > 0 ? Math.round((done / total) * 100) : 0,
  };
}
