import { describe, expect, it } from 'vitest';
import type { Note, Project, Task } from '@/types';
import { deriveToday } from './derive';

const now = new Date(2026, 1, 10, 9, 0, 0); // Feb 10 2026, local

const makeTask = (id: string, overrides: Partial<Task> = {}): Task => ({
  id,
  key: id.toUpperCase(),
  title: id,
  type: 'task',
  status: 'todo',
  priority: 'medium',
  labels: [],
  createdAt: '2026-02-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
  ...overrides,
});

const makeNote = (id: string, updatedAt: string): Note => ({
  id,
  title: id,
  content: '',
  tags: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt,
});

const makeProject = (id: string, status: Project['status'], updatedAt: string): Project => ({
  id,
  key: id.toUpperCase(),
  name: id,
  status,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt,
});

const tasks: Task[] = [
  makeTask('overdue-low', { dueDate: '2026-02-08', priority: 'low' }),
  makeTask('overdue-high', { dueDate: '2026-02-09', priority: 'high' }),
  makeTask('today-medium', { dueDate: '2026-02-10', priority: 'medium' }),
  makeTask('today-done', { dueDate: '2026-02-10', status: 'done' }),
  makeTask('soon', { dueDate: '2026-02-12' }),
  makeTask('later', { dueDate: '2026-02-20' }),
  makeTask('undated', { status: 'in_progress' }),
  makeTask('done-undated', { status: 'done' }),
];

const projects: Project[] = [
  makeProject('p-live', 'active', '2026-02-09T00:00:00.000Z'),
  makeProject('p-older', 'active', '2026-02-01T00:00:00.000Z'),
  makeProject('p-archived', 'archived', '2026-02-09T00:00:00.000Z'),
];

describe('deriveToday', () => {
  it('counts due today, overdue, in progress and active projects', () => {
    const view = deriveToday(tasks, [], projects, now);

    expect(view.stats).toEqual({
      dueToday: 1,
      overdue: 2,
      inProgress: 1,
      activeProjects: 2,
    });
  });

  it('puts overdue first, then priority, and caps attention at six', () => {
    const view = deriveToday(tasks, [], projects, now);

    expect(view.attention.map((task) => task.id)).toEqual([
      'overdue-high',
      'overdue-low',
      'today-medium',
    ]);
  });

  it('orders upcoming tasks by due date', () => {
    const view = deriveToday(tasks, [], projects, now);

    expect(view.upcoming.map((task) => task.id)).toEqual(['soon', 'later']);
  });

  it('returns the four most recently updated notes', () => {
    const notes = [
      makeNote('n1', '2026-02-01T00:00:00.000Z'),
      makeNote('n2', '2026-02-09T00:00:00.000Z'),
      makeNote('n3', '2026-02-08T00:00:00.000Z'),
      makeNote('n4', '2026-02-07T00:00:00.000Z'),
      makeNote('n5', '2026-02-06T00:00:00.000Z'),
    ];

    const view = deriveToday(tasks, notes, projects, now);

    expect(view.recentNotes.map((note) => note.id)).toEqual(['n2', 'n3', 'n4', 'n5']);
  });

  it('lists active projects newest first with progress', () => {
    const view = deriveToday(tasks, [], projects, now);

    expect(view.activeProjects.map((entry) => entry.project.id)).toEqual(['p-live', 'p-older']);
    expect(view.activeProjects[0].progress).toEqual({ total: 0, done: 0, percent: 0 });
  });

  it('handles an empty dataset', () => {
    const view = deriveToday([], [], [], now);

    expect(view.stats).toEqual({ dueToday: 0, overdue: 0, inProgress: 0, activeProjects: 0 });
    expect(view.attention).toEqual([]);
    expect(view.upcoming).toEqual([]);
    expect(view.recentNotes).toEqual([]);
    expect(view.activeProjects).toEqual([]);
  });
});
