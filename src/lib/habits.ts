import { parseDateOnly, toDateOnly } from '@/lib/date';
import type { Habit, HabitCadence, HabitCheckIn, HabitSkip } from '@/types';

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

type HabitRange = Pick<Habit, 'startDate'> & Pick<Partial<Habit>, 'endDate'>;

/** A habit counts from its start date through its end date, both inclusive. */
export function isHabitActiveOn(habit: HabitRange, dateOnly: string): boolean {
  if (dateOnly < habit.startDate) return false;
  return !habit.endDate || dateOnly <= habit.endDate;
}

/** True once the habit's inclusive end date is in the past. */
export function isHabitEnded(habit: HabitRange, dateOnly: string): boolean {
  return Boolean(habit.endDate && habit.endDate < dateOnly);
}

/** Clamps a reference date to the habit's active range so final stats are stable after it ends. */
export function habitAnchorDate(habit: HabitRange, dateOnly: string): string {
  if (dateOnly < habit.startDate) return habit.startDate;
  if (habit.endDate && dateOnly > habit.endDate) return habit.endDate;
  return dateOnly;
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
  habit: Pick<Habit, 'id' | 'cadence' | 'target' | 'startDate' | 'endDate'>,
  checkIns: HabitCheckIn[],
  dateOnly: string,
): HabitProgress {
  const period = periodRange(habit.cadence, habitAnchorDate(habit, dateOnly));
  const from = period.start < habit.startDate ? habit.startDate : period.start;
  const to = habit.endDate && period.end > habit.endDate ? habit.endDate : period.end;
  const count =
    from > to
      ? 0
      : checkIns.filter(
          (entry) =>
            entry.habitId === habit.id && entry.date >= from && entry.date <= to,
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

export function skipOn(skips: HabitSkip[], habitId: string, date: string): boolean {
  return skips.some((entry) => entry.habitId === habitId && entry.date === date);
}

/**
 * Consecutive completed periods. An unfinished current period does not break the
 * streak — it starts counting from the previous period instead.
 */
export function habitStreak(
  habit: Pick<Habit, 'id' | 'cadence' | 'target' | 'startDate' | 'endDate'>,
  checkIns: HabitCheckIn[],
  dateOnly: string,
): number {
  const target = Math.max(1, habit.target);
  const anchor = habitAnchorDate(habit, dateOnly);
  const current = habitProgress(habit, checkIns, anchor);
  let cursor = current.met ? anchor : shiftDate(current.period.start, -1);
  let streak = 0;

  for (let guard = 0; guard < 500; guard += 1) {
    const period = periodRange(habit.cadence, cursor);
    if (period.end < habit.startDate) break;
    if (habit.endDate && period.start > habit.endDate) break;

    const from = period.start < habit.startDate ? habit.startDate : period.start;
    const to = habit.endDate && period.end > habit.endDate ? habit.endDate : period.end;
    const count =
      from > to
        ? 0
        : checkIns.filter(
            (entry) =>
              entry.habitId === habit.id && entry.date >= from && entry.date <= to,
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

/** Due today: a scheduled, unchecked, unskipped fixed habit, or an unmet flexible one. */
export function isHabitDueOn(
  habit: Pick<Habit, 'id' | 'cadence' | 'target' | 'schedule' | 'startDate' | 'endDate'>,
  checkIns: HabitCheckIn[],
  dateOnly: string,
  skips: HabitSkip[] = [],
): boolean {
  if (!isHabitActiveOn(habit, dateOnly)) return false;
  if (checkInOn(checkIns, habit.id, dateOnly)) return false;
  if (skipOn(skips, habit.id, dateOnly)) return false;
  if (habit.schedule.kind === 'fixed') return isHabitScheduledOn(habit, dateOnly);

  return !habitProgress(habit, checkIns, dateOnly).met;
}

/** Dates a fixed habit expects a check-in; flexible habits have no scheduled days. */
export function habitScheduleDates(
  habit: Pick<Habit, 'schedule' | 'startDate' | 'endDate'>,
  fromDate: string,
  toDate: string,
): string[] {
  if (habit.schedule.kind === 'flexible') return [];

  const from = fromDate < habit.startDate ? habit.startDate : fromDate;
  const to = habit.endDate && toDate > habit.endDate ? habit.endDate : toDate;
  if (from > to) return [];

  const dates: string[] = [];
  let cursor = from;
  while (cursor <= to) {
    if (isHabitScheduledOn(habit, cursor)) dates.push(cursor);
    cursor = shiftDate(cursor, 1);
  }
  return dates;
}

export type HabitDot = { date: string; checked: boolean; skipped: boolean; today: boolean };

/** Weekly habits show Monday–Sunday; daily habits show the last seven days. */
export function habitDots(
  habit: Pick<Habit, 'id' | 'cadence' | 'startDate' | 'endDate'>,
  checkIns: HabitCheckIn[],
  dateOnly: string,
  skips: HabitSkip[] = [],
): HabitDot[] {
  if (habit.cadence === 'monthly') return [];

  const anchor = habitAnchorDate(habit, dateOnly);
  const period =
    habit.cadence === 'weekly'
      ? periodRange('weekly', anchor)
      : { start: shiftDate(anchor, -6), end: anchor };
  const from = period.start < habit.startDate ? habit.startDate : period.start;
  const to = habit.endDate && period.end > habit.endDate ? habit.endDate : period.end;

  const dots: HabitDot[] = [];
  let cursor = from;
  while (cursor <= to) {
    dots.push({
      date: cursor,
      checked: checkInOn(checkIns, habit.id, cursor),
      skipped: skipOn(skips, habit.id, cursor),
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
