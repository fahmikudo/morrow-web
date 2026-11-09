import { toDateOnly } from '@/lib/date';
import type { Task, TaskPriority } from '@/types';

export type CalendarDay = {
  date: string;
  day: number;
  inMonth: boolean;
};

export type WeekCalendarDay = {
  date: string;
  day: number;
};

const PRIORITY_RANK: Record<TaskPriority, number> = { low: 1, medium: 2, high: 3 };

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

/** Sunday-first week containing `date`. */
export function startOfWeek(date: Date): Date {
  return addDays(date, -date.getDay());
}

export function addDays(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta);
}

export function addWeeks(date: Date, delta: number): Date {
  return addDays(date, delta * 7);
}

export function buildWeekDays(weekStart: Date): WeekCalendarDay[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    return { date: toDateOnly(date), day: date.getDate() };
  });
}

/** Six Sunday-first weeks covering the given month, including adjacent days. */
export function buildMonthGrid(month: Date): CalendarDay[] {
  const first = startOfMonth(month);
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    return {
      date: toDateOnly(date),
      day: date.getDate(),
      inMonth: date.getMonth() === first.getMonth(),
    };
  });
}

/** Groups dated tasks by due date; within a day, high priority first, then title. */
export function tasksByDueDate(tasks: Task[]): Map<string, Task[]> {
  const groups = new Map<string, Task[]>();

  for (const task of tasks) {
    if (!task.dueDate) continue;
    const bucket = groups.get(task.dueDate) ?? [];
    bucket.push(task);
    groups.set(task.dueDate, bucket);
  }

  for (const [date, bucket] of groups) {
    groups.set(
      date,
      bucket.sort(
        (a, b) =>
          PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] || a.title.localeCompare(b.title),
      ),
    );
  }

  return groups;
}

/** `YYYY-MM` key used to compare a date against a month. */
export function monthKey(date: Date): string {
  return toDateOnly(date).slice(0, 7);
}
