import type { Note, Project, Task } from '@/types';

type AreaCarrier = { projectId?: string; areaId?: string };

/**
 * A project's area wins; an item's own `areaId` only applies when it has no project.
 */
export function effectiveAreaId(item: AreaCarrier, projects: Project[]): string | undefined {
  if (item.projectId) {
    return projects.find((project) => project.id === item.projectId)?.areaId;
  }
  return item.areaId;
}

export type AreaSummary = {
  projects: number;
  notes: number;
  openTasks: number;
  doneLeaves: number;
  leafTasks: number;
  percent: number;
};

/** Counts only leaf tasks so parents and subtasks never double-count. */
export function areaSummary(
  areaId: string,
  projects: Project[],
  tasks: Task[],
  notes: Note[],
): AreaSummary {
  const parentIds = new Set(
    tasks.map((task) => task.parentId).filter((parentId): parentId is string => Boolean(parentId)),
  );

  const areaProjects = projects.filter((project) => project.areaId === areaId);
  const areaTasks = tasks.filter((task) => effectiveAreaId(task, projects) === areaId);
  const leaves = areaTasks.filter((task) => !parentIds.has(task.id));
  const doneLeaves = leaves.filter((task) => task.status === 'done').length;

  return {
    projects: areaProjects.length,
    notes: notes.filter((note) => effectiveAreaId(note, projects) === areaId).length,
    openTasks: areaTasks.filter((task) => task.status !== 'done').length,
    doneLeaves,
    leafTasks: leaves.length,
    percent: leaves.length > 0 ? Math.round((doneLeaves / leaves.length) * 100) : 0,
  };
}
