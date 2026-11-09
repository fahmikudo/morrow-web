import { describe, expect, it } from 'vitest';
import type { Task } from '@/types';
import {
  addMonths,
  addWeeks,
  buildMonthGrid,
  buildWeekDays,
  monthKey,
  startOfMonth,
  startOfWeek,
  tasksByDueDate,
} from './calendar';

const makeTask = (id: string, overrides: Partial<Task> = {}): Task => ({
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

describe('buildMonthGrid', () => {
  it('starts on the Sunday on or before the first of the month', () => {
    const grid = buildMonthGrid(new Date(2026, 3, 1)); // April 2026 begins on a Wednesday

    expect(grid).toHaveLength(42);
    expect(grid[0]).toEqual({ date: '2026-03-29', day: 29, inMonth: false });
    expect(grid[3]).toEqual({ date: '2026-04-01', day: 1, inMonth: true });
    expect(grid.filter((day) => day.inMonth)).toHaveLength(30);
    expect(grid[41].date).toBe('2026-05-09');
  });

  it('starts on the first when the month begins on a Sunday', () => {
    const grid = buildMonthGrid(new Date(2026, 10, 1)); // November 2026 begins on a Sunday

    expect(grid[0]).toEqual({ date: '2026-11-01', day: 1, inMonth: true });
    expect(grid[41].date).toBe('2026-12-12');
  });

  it('handles February in a non-leap year', () => {
    const grid = buildMonthGrid(new Date(2026, 1, 1));
    const inMonth = grid.filter((day) => day.inMonth).map((day) => day.date);

    expect(inMonth).toHaveLength(28);
    expect(inMonth[0]).toBe('2026-02-01');
    expect(inMonth.at(-1)).toBe('2026-02-28');
  });
});

describe('month navigation', () => {
  it('normalizes to the first of the month and wraps years', () => {
    expect(monthKey(startOfMonth(new Date(2026, 10, 8)))).toBe('2026-11');
    expect(monthKey(addMonths(new Date(2026, 10, 1), 2))).toBe('2027-01');
    expect(monthKey(addMonths(new Date(2026, 0, 1), -1))).toBe('2025-12');
  });
});

describe('tasksByDueDate', () => {
  it('skips undated tasks and sorts each day by priority then title', () => {
    const groups = tasksByDueDate([
      makeTask('low', { dueDate: '2026-11-08', priority: 'low' }),
      makeTask('high-b', { dueDate: '2026-11-08', priority: 'high', title: 'B task' }),
      makeTask('high-a', { dueDate: '2026-11-08', priority: 'high', title: 'A task' }),
      makeTask('other-day', { dueDate: '2026-11-09' }),
      makeTask('undated'),
    ]);

    expect([...groups.keys()]).toEqual(['2026-11-08', '2026-11-09']);
    expect(groups.get('2026-11-08')?.map((task) => task.id)).toEqual(['high-a', 'high-b', 'low']);
    expect(groups.get('2026-11-09')?.map((task) => task.id)).toEqual(['other-day']);
  });

  it('returns an empty map for no tasks', () => {
    expect(tasksByDueDate([]).size).toBe(0);
  });
});

describe('week helpers', () => {
  it('starts weeks on Sunday and builds seven consecutive days', () => {
    const weekStart = startOfWeek(new Date(2026, 10, 9)); // Monday, Nov 9 2026

    expect(weekStart.getDay()).toBe(0);
    expect(buildWeekDays(weekStart).map((day) => day.date)).toEqual([
      '2026-11-08',
      '2026-11-09',
      '2026-11-10',
      '2026-11-11',
      '2026-11-12',
      '2026-11-13',
      '2026-11-14',
    ]);
  });

  it('moves by whole weeks without changing the weekday', () => {
    const start = startOfWeek(new Date(2026, 10, 9));
    const next = addWeeks(start, 1);

    expect(next.getDay()).toBe(0);
    expect(buildWeekDays(next)[0].date).toBe('2026-11-15');
  });
});
