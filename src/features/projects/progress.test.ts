import { describe, expect, it } from 'vitest';
import type { Task } from '@/types';
import { projectProgress } from './progress';

const makeTask = (id: string, projectId: string | undefined, status: Task['status']): Task => ({
  id,
  key: id.toUpperCase(),
  title: id,
  type: 'task',
  status,
  priority: 'medium',
  labels: [],
  projectId,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('projectProgress', () => {
  it('is zero for a project without tasks', () => {
    expect(projectProgress('p9', [])).toEqual({ total: 0, done: 0, percent: 0 });
  });

  it('rounds the done ratio', () => {
    const tasks = [
      makeTask('t1', 'p1', 'done'),
      makeTask('t2', 'p1', 'todo'),
      makeTask('t3', 'p1', 'in_progress'),
    ];

    expect(projectProgress('p1', tasks)).toEqual({ total: 3, done: 1, percent: 33 });
  });

  it('counts leaves only when a task has subtasks', () => {
    const tasks = [
      makeTask('parent', 'p1', 'in_progress'),
      { ...makeTask('child-a', 'p1', 'done'), parentId: 'parent' },
      { ...makeTask('child-b', 'p1', 'todo'), parentId: 'parent' },
    ];

    expect(projectProgress('p1', tasks)).toEqual({ total: 2, done: 1, percent: 50 });
  });

  it('ignores tasks belonging to other projects', () => {
    const tasks = [
      makeTask('t1', 'p1', 'done'),
      makeTask('t2', 'p2', 'done'),
      makeTask('t3', undefined, 'done'),
    ];

    expect(projectProgress('p1', tasks)).toEqual({ total: 1, done: 1, percent: 100 });
  });
});
