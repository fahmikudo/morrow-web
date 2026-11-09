import { describe, expect, it } from 'vitest';
import type { Project, Task } from '@/types';
import { defaultTaskFilters, filterAndSortTasks } from './filter';

const makeTask = (overrides: Partial<Task> & { id: string }): Task => ({
  key: overrides.id.toUpperCase(),
  title: overrides.id,
  type: 'task',
  status: 'todo',
  priority: 'medium',
  labels: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const tasks: Task[] = [
  makeTask({ id: 'a', title: 'Review warehouse schema', priority: 'high', dueDate: '2026-02-02', projectId: 'p1' }),
  makeTask({ id: 'b', title: 'Call insurance', priority: 'low', dueDate: '2026-02-05' }),
  makeTask({
    id: 'c',
    title: 'Draft checkout spec',
    status: 'in_progress',
    priority: 'medium',
    dueDate: '2026-02-01',
    projectId: 'p2',
    description: 'Cover the guest flow',
  }),
  makeTask({ id: 'd', title: 'Read chapter 5', status: 'done', priority: 'high' }),
];

describe('filterAndSortTasks', () => {
  it('returns every task with default filters, undated last', () => {
    const result = filterAndSortTasks(tasks, defaultTaskFilters);

    expect(result.map((task) => task.id)).toEqual(['c', 'a', 'b', 'd']);
  });

  it('filters by status, priority and project', () => {
    expect(
      filterAndSortTasks(tasks, { ...defaultTaskFilters, status: 'done' }).map((task) => task.id),
    ).toEqual(['d']);

    expect(
      filterAndSortTasks(tasks, { ...defaultTaskFilters, priority: 'high' }).map((task) => task.id),
    ).toEqual(['a', 'd']);

    expect(
      filterAndSortTasks(tasks, { ...defaultTaskFilters, projectId: 'p2' }).map((task) => task.id),
    ).toEqual(['c']);
  });

  it('matches the query against title and description case-insensitively', () => {
    expect(
      filterAndSortTasks(tasks, { ...defaultTaskFilters, query: 'WAREHOUSE' }).map((task) => task.id),
    ).toEqual(['a']);

    expect(
      filterAndSortTasks(tasks, { ...defaultTaskFilters, query: 'guest' }).map((task) => task.id),
    ).toEqual(['c']);

    expect(filterAndSortTasks(tasks, { ...defaultTaskFilters, query: 'nothing' })).toEqual([]);
  });

  it('sorts by priority, then due date, then newest', () => {
    const result = filterAndSortTasks(tasks, { ...defaultTaskFilters, sort: 'priority' });

    expect(result.map((task) => task.id)).toEqual(['a', 'd', 'c', 'b']);
  });

  it('filters by issue type and label', () => {
    const typed = [
      makeTask({ id: 'bug-1', type: 'bug', labels: ['checkout', 'bug'] }),
      makeTask({ id: 'story-1', type: 'story', labels: ['checkout'] }),
    ];

    expect(
      filterAndSortTasks(typed, { ...defaultTaskFilters, type: 'bug' }).map((task) => task.id),
    ).toEqual(['bug-1']);

    expect(
      filterAndSortTasks(typed, { ...defaultTaskFilters, label: 'Checkout' }).map(
        (task) => task.id,
      ),
    ).toEqual(['bug-1', 'story-1']);

    expect(filterAndSortTasks(typed, { ...defaultTaskFilters, label: 'nope' })).toEqual([]);
  });

  it('matches issue keys in search', () => {
    const keyed = [makeTask({ id: 'SB-42', title: 'Unrelated title' })];

    expect(
      filterAndSortTasks(keyed, { ...defaultTaskFilters, query: 'sb-42' }).map((task) => task.id),
    ).toEqual(['SB-42']);
  });

  it('filters by effective area, inheriting from the project', () => {
    const withAreas = [
      makeTask({ id: 'inherited', projectId: 'p9' }),
      makeTask({ id: 'own', areaId: 'a1' }),
      makeTask({ id: 'other', areaId: 'a2' }),
    ];
    const projects: Project[] = [
      {
        id: 'p9',
        key: 'P9',
        name: 'Project nine',
        status: 'active',
        areaId: 'a1',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    expect(
      filterAndSortTasks(withAreas, { ...defaultTaskFilters, area: 'a1' }, projects).map(
        (task) => task.id,
      ),
    ).toEqual(['inherited', 'own']);
  });

  it('sorts by newest and by title', () => {
    expect(
      filterAndSortTasks(tasks, { ...defaultTaskFilters, sort: 'createdNewest' }).map(
        (task) => task.id,
      ),
    ).toEqual(['a', 'b', 'c', 'd']);

    expect(
      filterAndSortTasks(tasks, { ...defaultTaskFilters, sort: 'title' }).map((task) => task.id),
    ).toEqual(['b', 'c', 'd', 'a']);
  });
});
