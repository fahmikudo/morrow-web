import { parseDateOnly, toDateOnly } from '@/lib/date';
import type { Habit, HabitCadence, HabitCheckIn } from '@/types';

/** Weeks start on Monday; the calendar grid is Sunday-first for display only. */
export const WEEK_START_DAY = 1;

export type PeriodRange = { start: string; end: string };

export function shiftDate(dateOnly: string, days: number): string {
  const date = parseDateOnly(dateOnly);
  return toDateOnly(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days));
}

export function periodRange(cadence: HabitCadence, dateOnly: string): PeriodRange {
  const date = parseDateOnly(dateOnly);

  if (cadence === 'daily') return { start: dateOnly, end: dateOnly };

  if (cadence === 'weekly') {
    const offset = (date.getDay() - WEEK_START_DAY + 7) % 7;
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - offset);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    return { start: toDateOnly(start), end: toDateOnly(end) };
  }

  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start: toDateOnly(start), end: toDateOnly(end) };
}

export type HabitProgress = {
  count: number;
  target: number;
  remaining: number;
  percent: number;
  met: boolean;
  period: PeriodRange;
};

export function habitProgress(
  habit: Pick<Habit, 'id' | 'cadence' | 'target'>,
  checkIns: HabitCheckIn[],
  dateOnly: string,
): HabitProgress {
  const period = periodRange(habit.cadence, dateOnly);
  const count = checkIns.filter(
    (entry) =>
      entry.habitId === habit.id && entry.date >= period.start && entry.date <= period.end,
  ).length;
  const target = Math.max(1, habit.target);

  return {
    count,
    target,
    remaining: Math.max(0, target - count),
    percent: Math.min(100, Math.round((count / target) * 100)),
    met: count >= target,
    period,
  };
}

export function checkInOn(checkIns: HabitCheckIn[], habitId: string, date: string): boolean {
  return checkIns.some((entry) => entry.habitId === habitId && entry.date === date);
}

/**
 * Consecutive completed periods. An unfinished current period does not break the
 * streak — it starts counting from the previous period instead.
 */
export function habitStreak(
  habit: Pick<Habit, 'id' | 'cadence' | 'target' | 'startDate'>,
  checkIns: HabitCheckIn[],
  dateOnly: string,
): number {
  const target = Math.max(1, habit.target);
  const current = habitProgress(habit, checkIns, dateOnly);
  let cursor = current.met ? dateOnly : shiftDate(current.period.start, -1);
  let streak = 0;

  for (let guard = 0; guard < 500; guard += 1) {
    const period = periodRange(habit.cadence, cursor);
    if (period.end < habit.startDate) break;

    const count = checkIns.filter(
      (entry) =>
        entry.habitId === habit.id && entry.date >= period.start && entry.date <= period.end,
    ).length;
    if (count < target) break;

    streak += 1;
    cursor = shiftDate(period.start, -1);
  }

  return streak;
}

export function isHabitScheduledOn(
  habit: Pick<Habit, 'schedule'>,
  dateOnly: string,
): boolean {
  if (habit.schedule.kind === 'flexible') return false;
  return habit.schedule.weekdays.includes(parseDateOnly(dateOnly).getDay());
}

/** Due today: a scheduled, unchecked fixed habit, or an unmet, unchecked flexible one. */
export function isHabitDueOn(
  habit: Pick<Habit, 'id' | 'cadence' | 'target' | 'schedule'>,
  checkIns: HabitCheckIn[],
  dateOnly: string,
): boolean {
  if (checkInOn(checkIns, habit.id, dateOnly)) return false;
  if (habit.schedule.kind === 'fixed') return isHabitScheduledOn(habit, dateOnly);

  return !habitProgress(habit, checkIns, dateOnly).met;
}

/** Dates a fixed habit expects a check-in; flexible habits have no scheduled days. */
export function habitScheduleDates(
  habit: Pick<Habit, 'schedule'>,
  fromDate: string,
  toDate: string,
): string[] {
  if (habit.schedule.kind === 'flexible') return [];

  const dates: string[] = [];
  let cursor = fromDate;
  while (cursor <= toDate) {
    if (isHabitScheduledOn(habit, cursor)) dates.push(cursor);
    cursor = shiftDate(cursor, 1);
  }
  return dates;
}

export type HabitDot = { date: string; checked: boolean; today: boolean };

/** Weekly habits show Monday–Sunday; daily habits show the last seven days. */
export function habitDots(
  habit: Pick<Habit, 'id' | 'cadence'>,
  checkIns: HabitCheckIn[],
  dateOnly: string,
): HabitDot[] {
  if (habit.cadence === 'monthly') return [];

  const period =
    habit.cadence === 'weekly'
      ? periodRange('weekly', dateOnly)
      : { start: shiftDate(dateOnly, -6), end: dateOnly };

  const dots: HabitDot[] = [];
  let cursor = period.start;
  while (cursor <= period.end) {
    dots.push({
      date: cursor,
      checked: checkInOn(checkIns, habit.id, cursor),
      today: cursor === dateOnly,
    });
    cursor = shiftDate(cursor, 1);
  }
  return dots;
}

export function habitTimeLabel(habit: Pick<Habit, 'startTime' | 'endTime'>): string {
  if (!habit.startTime) return 'All day';
  return habit.endTime ? `${habit.startTime} – ${habit.endTime}` : habit.startTime;
}

export function habitCadenceLabel(habit: Pick<Habit, 'cadence' | 'target'>): string {
  const target = Math.max(1, habit.target);
  if (habit.cadence === 'daily') return target === 1 ? 'Daily' : `${target}×/day`;
  if (habit.cadence === 'weekly') return `${target}×/week`;
  return `${target}×/month`;
}
