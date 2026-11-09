import { describe, expect, it } from 'vitest';
import type { Habit, HabitCheckIn } from '@/types';
import {
  checkInOn,
  habitCadenceLabel,
  habitDots,
  habitProgress,
  habitScheduleDates,
  habitStreak,
  habitTimeLabel,
  isHabitDueOn,
  isHabitScheduledOn,
  periodRange,
  shiftDate,
} from './habits';

const habit = (overrides: Partial<Habit> & { id: string }): Habit => ({
  title: overrides.id,
  cadence: 'weekly',
  target: 4,
  schedule: { kind: 'flexible' },
  startDate: '2026-10-01',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  ...overrides,
});

const checkIn = (habitId: string, date: string): HabitCheckIn => ({
  id: `${habitId}-${date}`,
  habitId,
  date,
  createdAt: '2026-10-01T00:00:00.000Z',
});

describe('periodRange', () => {
  it('uses a Monday–Sunday week', () => {
    expect(periodRange('weekly', '2026-11-08')).toEqual({ start: '2026-11-02', end: '2026-11-08' });
    expect(periodRange('weekly', '2026-11-02')).toEqual({ start: '2026-11-02', end: '2026-11-08' });
  });

  it('covers the calendar month', () => {
    expect(periodRange('monthly', '2026-11-15')).toEqual({
      start: '2026-11-01',
      end: '2026-11-30',
    });
    expect(periodRange('monthly', '2026-02-10')).toEqual({
      start: '2026-02-01',
      end: '2026-02-28',
    });
  });

  it('is a single day for daily habits', () => {
    expect(periodRange('daily', '2026-11-08')).toEqual({
      start: '2026-11-08',
      end: '2026-11-08',
    });
  });

  it('shifts across month boundaries', () => {
    expect(shiftDate('2026-11-01', -1)).toBe('2026-10-31');
    expect(shiftDate('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('habitProgress', () => {
  const run = habit({ id: 'run', target: 4 });
  const checkIns = [
    checkIn('run', '2026-11-03'),
    checkIn('run', '2026-11-05'),
    checkIn('run', '2026-10-28'),
  ];

  it('counts only the current period', () => {
    expect(habitProgress(run, checkIns, '2026-11-08')).toEqual({
      count: 2,
      target: 4,
      remaining: 2,
      percent: 50,
      met: false,
      period: { start: '2026-11-02', end: '2026-11-08' },
    });
  });

  it('caps percent at 100 when the target is exceeded', () => {
    const more = [1, 2, 3, 4, 5].map((day) => checkIn('run', `2026-11-0${day + 1}`));
    const progress = habitProgress(run, more, '2026-11-08');

    expect(progress.count).toBe(5);
    expect(progress.percent).toBe(100);
    expect(progress.met).toBe(true);
    expect(progress.remaining).toBe(0);
  });
});

describe('habitStreak', () => {
  it('counts completed periods backwards, skipping an unfinished current period', () => {
    const weekly = habit({ id: 'streak', target: 2 });
    const weeks = [
      // previous week (Oct 26 – Nov 1)
      checkIn('streak', '2026-10-27'),
      checkIn('streak', '2026-10-29'),
      // week before (Oct 19 – Oct 25)
      checkIn('streak', '2026-10-20'),
      checkIn('streak', '2026-10-22'),
      // current week only 1 of 2
      checkIn('streak', '2026-11-03'),
    ];

    expect(habitStreak(weekly, weeks, '2026-11-08')).toBe(2);
  });

  it('includes the current period when it is met', () => {
    const daily = habit({ id: 'daily', cadence: 'daily', target: 1 });
    const checkIns = [checkIn('daily', '2026-11-06'), checkIn('daily', '2026-11-07'), checkIn('daily', '2026-11-08')];

    expect(habitStreak(daily, checkIns, '2026-11-08')).toBe(3);
  });

  it('stops at the habit start date', () => {
    const daily = habit({ id: 'new', cadence: 'daily', target: 1, startDate: '2026-11-07' });
    const checkIns = [
      checkIn('new', '2026-11-05'),
      checkIn('new', '2026-11-06'),
      checkIn('new', '2026-11-07'),
      checkIn('new', '2026-11-08'),
    ];

    expect(habitStreak(daily, checkIns, '2026-11-08')).toBe(2);
  });
});

describe('due and schedule', () => {
  const fixed = habit({ id: 'fixed', schedule: { kind: 'fixed', weekdays: [1, 3, 5] } });
  const flexible = habit({ id: 'flexible', target: 2 });

  it('marks fixed habits due only on scheduled, unchecked days', () => {
    expect(isHabitScheduledOn(fixed, '2026-11-02')).toBe(true); // Monday
    expect(isHabitScheduledOn(fixed, '2026-11-08')).toBe(false); // Sunday
    expect(isHabitDueOn(fixed, [], '2026-11-02')).toBe(true);
    expect(isHabitDueOn(fixed, [checkIn('fixed', '2026-11-02')], '2026-11-02')).toBe(false);
    expect(isHabitDueOn(fixed, [], '2026-11-08')).toBe(false);
  });

  it('keeps flexible habits due until the target is met', () => {
    expect(isHabitDueOn(flexible, [], '2026-11-08')).toBe(true);
    expect(isHabitDueOn(flexible, [checkIn('flexible', '2026-11-03')], '2026-11-08')).toBe(true);
    expect(
      isHabitDueOn(
        flexible,
        [checkIn('flexible', '2026-11-03'), checkIn('flexible', '2026-11-04')],
        '2026-11-08',
      ),
    ).toBe(false);
  });

  it('lists scheduled dates only for fixed schedules', () => {
    expect(habitScheduleDates(fixed, '2026-11-02', '2026-11-08')).toEqual([
      '2026-11-02',
      '2026-11-04',
      '2026-11-06',
    ]);
    expect(habitScheduleDates(flexible, '2026-11-02', '2026-11-08')).toEqual([]);
  });
});

describe('habitDots and labels', () => {
  it('renders a Monday-first week with check states', () => {
    const dots = habitDots(
      { id: 'run', cadence: 'weekly' },
      [checkIn('run', '2026-11-03')],
      '2026-11-08',
    );

    expect(dots).toHaveLength(7);
    expect(dots[0].date).toBe('2026-11-02');
    expect(dots[1]).toMatchObject({ date: '2026-11-03', checked: true });
    expect(dots[6].today).toBe(true);
  });

  it('shows the last seven days for daily habits and no dots for monthly', () => {
    expect(habitDots({ id: 'd', cadence: 'daily' }, [], '2026-11-08')).toHaveLength(7);
    expect(habitDots({ id: 'm', cadence: 'monthly' }, [], '2026-11-08')).toEqual([]);
  });

  it('labels occurrence times', () => {
    expect(habitTimeLabel({})).toBe('All day');
    expect(habitTimeLabel({ startTime: '06:30' })).toBe('06:30');
    expect(habitTimeLabel({ startTime: '06:30', endTime: '07:15' })).toBe('06:30 – 07:15');
  });

  it('labels cadences', () => {
    expect(habitCadenceLabel({ cadence: 'daily', target: 1 })).toBe('Daily');
    expect(habitCadenceLabel({ cadence: 'weekly', target: 4 })).toBe('4×/week');
    expect(habitCadenceLabel({ cadence: 'monthly', target: 3 })).toBe('3×/month');
  });

  it('detects a check-in on a date', () => {
    expect(checkInOn([checkIn('x', '2026-11-08')], 'x', '2026-11-08')).toBe(true);
    expect(checkInOn([], 'x', '2026-11-08')).toBe(false);
  });
});
