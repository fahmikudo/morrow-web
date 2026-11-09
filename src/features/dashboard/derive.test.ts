import { describe, expect, it } from 'vitest';
import type { Area, Event, Habit, HabitCheckIn, InboxItem, Note, Project, Task } from '@/types';
import { buildDashboard, habitDueTodayCount, type DashboardInput } from './derive';

const now = new Date(2026, 10, 8, 9, 0, 0); // Sunday Nov 8 2026
const iso = '2026-11-01T00:00:00.000Z';

const task = (id: string, overrides: Partial<Task> = {}): Task => ({
  id,
  key: id.toUpperCase(),
  title: id,
  type: 'task',
  status: 'todo',
  priority: 'medium',
  labels: [],
  createdAt: iso,
  updatedAt: iso,
  ...overrides,
});

const project = (id: string, overrides: Partial<Project> = {}): Project => ({
  id,
  key: id.toUpperCase(),
  name: id,
  status: 'active',
  createdAt: iso,
  updatedAt: iso,
  ...overrides,
});

const area = (id: string): Area => ({
  id,
  name: id,
  tone: 'accent',
  icon: 'briefcase',
  createdAt: iso,
  updatedAt: iso,
});

const habit = (id: string, overrides: Partial<Habit> = {}): Habit => ({
  id,
  title: id,
  cadence: 'weekly',
  target: 2,
  schedule: { kind: 'flexible' },
  startDate: '2026-10-01',
  createdAt: iso,
  updatedAt: iso,
  ...overrides,
});

const checkIn = (habitId: string, date: string): HabitCheckIn => ({
  id: `${habitId}-${date}`,
  habitId,
  date,
  createdAt: iso,
});

const note = (id: string, overrides: Partial<Note> = {}): Note => ({
  id,
  title: id,
  content: '',
  tags: [],
  createdAt: iso,
  updatedAt: iso,
  ...overrides,
});

const event = (id: string, date: string): Event => ({
  id,
  title: id,
  date,
  createdAt: iso,
  updatedAt: iso,
});

const inbox = (id: string, createdAt: string): InboxItem => ({
  id,
  title: id,
  type: 'note',
  createdAt,
});

const input = (overrides: Partial<DashboardInput> = {}): DashboardInput => ({
  areas: [area('a1'), area('a2')],
  tasks: [
    task('open', { projectId: 'p1' }),
    task('overdue', { projectId: 'p1', dueDate: '2026-11-05' }),
    task('due-today', { projectId: 'p1', dueDate: '2026-11-08' }),
    task('due-week', { dueDate: '2026-11-12' }),
    task('done', { status: 'done', updatedAt: '2026-11-06T00:00:00.000Z' }),
    task('done-old', { status: 'done', updatedAt: '2026-10-01T00:00:00.000Z' }),
    task('parent', { projectId: 'p1', dueDate: '2026-11-06' }),
    task('child', { parentId: 'parent', projectId: 'p1' }),
  ],
  projects: [
    project('p1', { areaId: 'a1', updatedAt: '2026-11-01T00:00:00.000Z' }),
    project('p2', { areaId: 'a2', status: 'archived' }),
  ],
  notes: [
    note('n1', { tags: ['go', 'data'], updatedAt: '2026-11-07T00:00:00.000Z', projectId: 'p1' }),
    note('n2', { tags: ['go'], updatedAt: '2026-11-05T00:00:00.000Z', areaId: 'a2' }),
    note('n3', { tags: ['meta'], updatedAt: '2026-11-03T00:00:00.000Z' }),
    note('n4', { updatedAt: '2026-11-01T00:00:00.000Z' }),
  ],
  events: [event('e1', '2026-11-09'), event('e2', '2026-11-20')],
  habits: [
    habit('h-met', { cadence: 'daily', target: 1, areaId: 'a1' }),
    habit('h-unmet', { cadence: 'weekly', target: 4, areaId: 'a1' }),
    habit('h-due', { areaId: 'a1' }),
  ],
  checkIns: [
    checkIn('h-met', '2026-11-08'),
    checkIn('h-unmet', '2026-11-03'),
    checkIn('h-unmet', '2026-11-05'),
  ],
  inbox: [inbox('i-old', '2026-11-01T00:00:00.000Z'), inbox('i-new', '2026-11-07T00:00:00.000Z')],
  ...overrides,
});

describe('buildDashboard', () => {
  it('computes headline stats', () => {
    const { stats } = buildDashboard(input(), now);

    expect(stats.openTasks).toBe(6);
    expect(stats.overdueTasks).toBe(2); // overdue + parent (2026-11-06)
    expect(stats.dueThisWeek).toBe(2); // due-today + due-week
    expect(stats.doneLast7Days).toBe(1); // done (2026-11-06), done-old excluded
    expect(stats.activeProjects).toBe(1);
    expect(stats.notes).toBe(4);
    expect(stats.inboxItems).toBe(2);
    expect(stats.eventsNext7Days).toBe(1); // 11-09 within Nov 8..14, 11-20 outside
  });

  it('computes completion over leaf tasks only', () => {
    const { stats } = buildDashboard(input(), now);

    // leaves: open, overdue, due-today, due-week, done, done-old, child (parent excluded)
    expect(stats.completionPercent).toBe(29); // 2 of 7 done
  });

  it('builds a seven-day workload starting today', () => {
    const { weekLoad } = buildDashboard(input(), now);

    expect(weekLoad).toHaveLength(7);
    expect(weekLoad[0]).toMatchObject({ date: '2026-11-08', tasks: 1, events: 0 });
    expect(weekLoad[1]).toMatchObject({ date: '2026-11-09', tasks: 0, events: 1 });
    expect(weekLoad[4]).toMatchObject({ date: '2026-11-12', tasks: 1 });
  });

  it('breaks tasks down by status', () => {
    const { status } = buildDashboard(input(), now);

    expect(status).toEqual({ todo: 6, in_progress: 0, done: 2, total: 8 });
  });

  it('lists only active projects with overdue work, worst first', () => {
    const { projectsAtRisk } = buildDashboard(input(), now);

    expect(projectsAtRisk).toHaveLength(1);
    expect(projectsAtRisk[0]).toMatchObject({ overdue: 2, open: 5 });
    expect(projectsAtRisk[0].project.id).toBe('p1');
  });

  it('rolls up areas with habits on track', () => {
    const { areas, stats } = buildDashboard(input(), now);
    const a1 = areas.find((entry) => entry.area.id === 'a1');

    expect(a1?.summary.projects).toBe(1);
    expect(a1?.summary.notes).toBe(1);
    expect(a1?.habits).toBe(3);
    expect(a1?.habitsOnTrack).toBe(1);
    expect(stats.habitsOnTrack).toBe(1);
    expect(stats.habitsTotal).toBe(3);
  });

  it('sorts habits with unmet ones first', () => {
    const { habits } = buildDashboard(input(), now);

    expect(habits.map((entry) => entry.habit.id).slice(0, 2)).toEqual(['h-due', 'h-unmet']);
    expect(habits.every((entry) => entry.streak >= 0)).toBe(true);
  });

  it('collects recent notes and tag counts', () => {
    const { recentNotes, topTags } = buildDashboard(input(), now);

    expect(recentNotes.map((entry) => entry.id)).toEqual(['n1', 'n2', 'n3']);
    expect(topTags[0]).toEqual({ tag: 'go', count: 2 });
    expect(topTags).toHaveLength(3);
  });

  it('reports the oldest inbox item', () => {
    const { oldestInboxItem } = buildDashboard(input(), now);

    expect(oldestInboxItem?.id).toBe('i-old');
  });

  it('counts habits due today', () => {
    expect(habitDueTodayCount(input(), now)).toBe(2); // h-met checked today; h-unmet and h-due are unmet
  });

  it('handles an empty dataset', () => {
    const view = buildDashboard(
      { areas: [], tasks: [], projects: [], notes: [], events: [], habits: [], checkIns: [], inbox: [] },
      now,
    );

    expect(view.stats).toMatchObject({
      openTasks: 0,
      overdueTasks: 0,
      dueThisWeek: 0,
      doneLast7Days: 0,
      completionPercent: 0,
      habitsOnTrack: 0,
      habitsTotal: 0,
    });
    expect(view.weekLoad).toHaveLength(7);
    expect(view.projectsAtRisk).toEqual([]);
    expect(view.recentNotes).toEqual([]);
    expect(view.topTags).toEqual([]);
    expect(view.oldestInboxItem).toBeNull();
  });
});
