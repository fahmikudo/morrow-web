import { describe, expect, it } from 'vitest';
import {
  eventInsights,
  eventRangeInsights,
  habitInsights,
  knowledgeInsights,
  personalInsights,
  projectDetailInsights,
  projectInsights,
  taskInsights,
} from './insights';
import type { Event, Habit, HabitCheckIn, Note, Project, Task } from '@/types';

const NOW = new Date(2026, 10, 11, 12, 0, 0); // Wednesday, 11 Nov 2026.

function task(overrides: Partial<Task> & Pick<Task, 'id'>): Task {
  return {
    key: `SB-${overrides.id}`,
    title: overrides.id,
    type: 'task',
    status: 'todo',
    priority: 'medium',
    labels: [],
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    ...overrides,
  };
}

function project(overrides: Partial<Project> & Pick<Project, 'id'>): Project {
  return {
    key: 'P',
    name: 'Project',
    status: 'active',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-20T00:00:00.000Z',
    ...overrides,
  };
}

function habit(overrides: Partial<Habit> & Pick<Habit, 'id'>): Habit {
  return {
    title: 'Habit',
    cadence: 'weekly',
    target: 1,
    schedule: { kind: 'fixed', weekdays: [1, 3] },
    startDate: '2026-11-01',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    ...overrides,
  };
}

function note(overrides: Partial<Note> & Pick<Note, 'id'>): Note {
  return {
    title: 'Note',
    content: '',
    tags: [],
    createdAt: '2026-11-10T02:00:00.000Z',
    updatedAt: '2026-11-10T02:00:00.000Z',
    ...overrides,
  };
}

function event(overrides: Partial<Event> & Pick<Event, 'id'>): Event {
  return {
    title: 'Event',
    date: '2026-11-10',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    ...overrides,
  };
}

const tasks = [
  task({ id: 't1', dueDate: '2026-11-09', status: 'done', projectId: 'p1', updatedAt: '2026-11-09T10:00:00.000Z' }),
  task({ id: 't2', dueDate: '2026-11-10', projectId: 'p1' }),
  task({ id: 't3', dueDate: '2026-11-08', projectId: 'p1' }),
  task({ id: 't4' }),
];

const checkIns: HabitCheckIn[] = [
  { id: 'c1', habitId: 'h1', date: '2026-11-09', createdAt: '2026-11-09T00:00:00.000Z' },
];

describe('domain insights', () => {
  it('summarises tasks without exposing formulas', () => {
    const value = taskInsights(tasks, NOW);

    expect(value.open).toBe(3);
    expect(value.overdue).toBe(2);
    expect(value.dueThisWeek).toBe(1);
    expect(value.doneThisWeek).toBe(1);
    expect(value.dueSoFar).toBe(2);
    expect(value.completedDueSoFar).toBe(1);
  });

  it('summarises portfolio health and project detail', () => {
    const value = projectInsights(
      [
        project({ id: 'p1' }),
        project({ id: 'p2', updatedAt: '2026-10-01T00:00:00.000Z' }),
      ],
      tasks,
      NOW,
    );

    expect(value.active).toBe(2);
    expect(value.onTrack).toBe(1);
    expect(value.needsAttention).toBe(1);
    expect(value.quiet).toBe(1);

    const detail = projectDetailInsights(project({ id: 'p1' }), tasks, NOW);
    expect(detail.open).toBe(2);
    expect(detail.overdue).toBe(2);
    expect(detail.done).toBe(1);
    expect(detail.progress).toBe(33);
  });

  it('summarises habit consistency and streaks', () => {
    const value = habitInsights([habit({ id: 'h1' })], checkIns, NOW);

    expect(value.active).toBe(1);
    expect(value.onTrack).toBe(1);
    expect(value.weeklyConsistency).toBe(50);
    expect(value.bestStreak).toBeGreaterThanOrEqual(1);
  });

  it('counts event overlaps, knowledge capture, and personal rhythm', () => {
    const events = [
      event({ id: 'e1', startTime: '09:00', endTime: '10:00' }),
      event({ id: 'e2', startTime: '09:30', endTime: '10:30' }),
      event({ id: 'e3', date: '2026-11-11', startTime: '11:00', endTime: '12:00' }),
    ];
    const notes = [
      note({ id: 'n1', tags: ['kpi', 'plan'] }),
      note({ id: 'n2', createdAt: '2026-10-01T02:00:00.000Z', projectId: 'p1', tags: ['kpi'] }),
    ];

    expect(eventInsights(events, NOW)).toMatchObject({
      events: 3,
      overlaps: 2,
      busyDays: 2,
      timedEvents: 3,
    });
    expect(eventRangeInsights(events, '2026-11-10', '2026-11-10')).toMatchObject({
      events: 2,
      overlaps: 2,
      busyDays: 1,
      timedEvents: 2,
    });
    expect(knowledgeInsights(notes, NOW)).toMatchObject({
      notes: 2,
      newThisWeek: 1,
      linkedToProjects: 1,
      tags: 2,
    });
    expect(personalInsights(tasks, [habit({ id: 'h1' })], checkIns, NOW)).toEqual({
      execution: 50,
      consistency: 33,
      carryover: 50,
    });
  });

  it('hides ratios when there is nothing to measure', () => {
    expect(taskInsights([], NOW).open).toBe(0);
    expect(habitInsights([], [], NOW)).toMatchObject({
      active: 0,
      onTrack: 0,
      weeklyConsistency: null,
      bestStreak: 0,
    });
    expect(personalInsights([], [], [], NOW)).toEqual({
      execution: null,
      consistency: null,
      carryover: null,
    });
  });
});
