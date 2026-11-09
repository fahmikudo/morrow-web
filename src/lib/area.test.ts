import { describe, expect, it } from 'vitest';
import type { Note, Project, Task } from '@/types';
import { areaSummary, effectiveAreaId } from './area';

const project = (id: string, areaId?: string): Project => ({
  id,
  key: id.toUpperCase(),
  name: id,
  status: 'active',
  areaId,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const task = (id: string, overrides: Partial<Task> = {}): Task => ({
  id,
  key: id.toUpperCase(),
  title: id,
  type: 'task',
  status: 'todo',
  priority: 'medium',
  labels: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const note = (id: string, overrides: Partial<Note> = {}): Note => ({
  id,
  title: id,
  content: '',
  tags: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('effectiveAreaId', () => {
  const projects = [project('p1', 'a1'), project('p2')];

  it('inherits the project area, even when the item carries its own', () => {
    expect(effectiveAreaId({ projectId: 'p1', areaId: 'a9' }, projects)).toBe('a1');
  });

  it('uses its own area when there is no project', () => {
    expect(effectiveAreaId({ areaId: 'a2' }, projects)).toBe('a2');
    expect(effectiveAreaId({}, projects)).toBeUndefined();
  });

  it('returns undefined when the project has no area', () => {
    expect(effectiveAreaId({ projectId: 'p2', areaId: 'a2' }, projects)).toBeUndefined();
  });
});

describe('areaSummary', () => {
  const projects = [project('p1', 'a1'), project('p2', 'a2')];
  const tasks = [
    task('leaf-done', { projectId: 'p1', status: 'done' }),
    task('leaf-open', { projectId: 'p1' }),
    task('parent', { projectId: 'p1', status: 'in_progress' }),
    task('child', { projectId: 'p1', parentId: 'parent' }),
    task('unfiled-own', { areaId: 'a1' }),
    task('other-area', { projectId: 'p2' }),
    task('inherited-override', { projectId: 'p1', areaId: 'a2' }),
  ];
  const notes = [note('n-inherited', { projectId: 'p1' }), note('n-own', { areaId: 'a1' }), note('n-other', { areaId: 'a2' })];

  it('counts projects, notes and open tasks in the area', () => {
    const summary = areaSummary('a1', projects, tasks, notes);

    expect(summary.projects).toBe(1);
    expect(summary.notes).toBe(2);
    expect(summary.openTasks).toBe(5);
  });

  it('counts leaf tasks only for progress', () => {
    const summary = areaSummary('a1', projects, tasks, notes);

    expect(summary.leafTasks).toBe(5);
    expect(summary.doneLeaves).toBe(1);
    expect(summary.percent).toBe(20);
  });

  it('is zero for an empty area', () => {
    expect(areaSummary('a9', projects, tasks, notes)).toMatchObject({
      projects: 0,
      notes: 0,
      openTasks: 0,
      percent: 0,
    });
  });
});
