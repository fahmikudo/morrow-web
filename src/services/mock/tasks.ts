import { createId } from '@/lib/id';
import type { TaskRepository, UpdateTask } from '@/services/repositories/contracts';
import type { NewTask, Task } from '@/types';
import { latency } from './latency';
import { loadDatabase, saveDatabase } from './storage';

const PROJECTLESS_BUCKET = 'none';
const PROJECTLESS_PREFIX = 'SB';

function indexOf(tasks: Task[], id: string): number {
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) throw new Error('Task not found');
  return index;
}

function requireTimeBox(startTime?: string, endTime?: string): void {
  if (startTime && endTime && endTime <= startTime) {
    throw new Error('End time must be after start time');
  }
}

function requireParent(tasks: Task[], parentId: string, selfId?: string): Task {
  if (parentId === selfId) throw new Error('A task cannot be its own parent');

  const parent = tasks.find((task) => task.id === parentId);
  if (!parent) throw new Error('Parent task not found');
  if (parent.parentId) throw new Error('Subtasks cannot have subtasks');

  return parent;
}

export function createTaskRepository(): TaskRepository {
  return {
    async list() {
      await latency();
      return loadDatabase().tasks;
    },

    async get(id) {
      await latency();
      return loadDatabase().tasks.find((task) => task.id === id) ?? null;
    },

    async create(input: NewTask) {
      await latency();
      const db = loadDatabase();

      requireTimeBox(input.startTime, input.endTime);

      const parent = input.parentId ? requireParent(db.tasks, input.parentId) : undefined;
      const projectId = parent ? parent.projectId : input.projectId;
      const project = projectId ? db.projects.find((entry) => entry.id === projectId) : undefined;

      const bucket = projectId ?? PROJECTLESS_BUCKET;
      const next = (db.counters[bucket] ?? 0) + 1;
      db.counters[bucket] = next;

      const timestamp = new Date().toISOString();
      const task: Task = {
        id: createId('t'),
        key: `${project?.key ?? PROJECTLESS_PREFIX}-${next}`,
        title: input.title,
        type: input.type ?? 'task',
        status: input.status ?? 'todo',
        priority: input.priority ?? 'medium',
        labels: (input.labels ?? []).map((label) => label.trim()).filter(Boolean),
        createdAt: timestamp,
        updatedAt: timestamp,
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
        ...(input.startTime !== undefined ? { startTime: input.startTime } : {}),
        ...(input.endTime !== undefined ? { endTime: input.endTime } : {}),
        ...(projectId !== undefined ? { projectId } : {}),
        ...(input.areaId !== undefined ? { areaId: input.areaId } : {}),
        ...(parent ? { parentId: parent.id } : {}),
        ...(input.syncToPepy ? { syncToPepy: true } : {}),
      };

      db.tasks.push(task);
      saveDatabase(db);
      return task;
    },

    async update(id: string, patch: UpdateTask) {
      await latency();
      const db = loadDatabase();
      const index = indexOf(db.tasks, id);
      const next: Task = { ...db.tasks[index], updatedAt: new Date().toISOString() };

      if (patch.title !== undefined) next.title = patch.title;
      if (patch.description !== undefined) next.description = patch.description;
      if (patch.type !== undefined) next.type = patch.type;
      if (patch.status !== undefined) next.status = patch.status;
      if (patch.priority !== undefined) next.priority = patch.priority;
      if (patch.labels !== undefined) {
        next.labels = patch.labels.map((label) => label.trim()).filter(Boolean);
      }
      if (patch.syncToPepy !== undefined) {
        if (patch.syncToPepy) next.syncToPepy = true;
        else delete next.syncToPepy;
      }
      if (patch.dueDate !== undefined) {
        if (patch.dueDate === null) delete next.dueDate;
        else next.dueDate = patch.dueDate;
      }
      if (patch.startTime !== undefined) {
        if (patch.startTime === null) delete next.startTime;
        else next.startTime = patch.startTime;
      }
      if (patch.endTime !== undefined) {
        if (patch.endTime === null) delete next.endTime;
        else next.endTime = patch.endTime;
      }
      requireTimeBox(next.startTime, next.endTime);

      if (patch.projectId !== undefined) {
        if (patch.projectId === null) delete next.projectId;
        else next.projectId = patch.projectId;
      }
      if (patch.areaId !== undefined) {
        if (patch.areaId === null) delete next.areaId;
        else next.areaId = patch.areaId;
      }

      if (patch.parentId !== undefined) {
        if (patch.parentId === null) {
          delete next.parentId;
        } else {
          const hasChildren = db.tasks.some((task) => task.parentId === id && task.id !== id);
          if (hasChildren) throw new Error('A task with subtasks cannot become a subtask');

          const parent = requireParent(db.tasks, patch.parentId, id);

          next.parentId = parent.id;
          if (parent.projectId === undefined) delete next.projectId;
          else next.projectId = parent.projectId;
        }
      }

      db.tasks[index] = next;
      saveDatabase(db);
      return next;
    },

    async remove(id: string) {
      await latency();
      const db = loadDatabase();
      const index = indexOf(db.tasks, id);
      db.tasks.splice(index, 1);

      db.tasks = db.tasks.map((task) => {
        if (task.parentId !== id) return task;
        const detached = { ...task };
        delete detached.parentId;
        return detached;
      });

      saveDatabase(db);
    },
  };
}
