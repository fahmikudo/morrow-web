import type { Task } from '@/types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const LONG_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const pad = (value: number) => String(value).padStart(2, '0');

/** Local calendar date as `YYYY-MM-DD` (never a UTC instant). */
export function toDateOnly(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayIso(now: Date = new Date()): string {
  return toDateOnly(now);
}

export function daysFromNow(days: number, now: Date = new Date()): string {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
  return toDateOnly(date);
}

/** Parses `YYYY-MM-DD` as local midnight; falls back to `Date` for timestamps. */
export function parseDateOnly(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return new Date(iso);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function formatDate(iso: string): string {
  const date = parseDateOnly(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function formatLongDate(now: Date = new Date()): string {
  return `${WEEKDAYS[now.getDay()]}, ${LONG_MONTHS[now.getMonth()]} ${now.getDate()}`;
}

export function formatMonthYear(date: Date = new Date()): string {
  return `${LONG_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** Human-readable inclusive week range, e.g. `Nov 8 – 14, 2026`. */
export function formatWeekRange(start: Date, end: Date): string {
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  const startMonth = MONTHS[start.getMonth()];
  const endMonth = MONTHS[end.getMonth()];

  if (startYear === endYear && start.getMonth() === end.getMonth()) {
    return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${endYear}`;
  }
  if (startYear === endYear) {
    return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${endYear}`;
  }
  return `${startMonth} ${start.getDate()}, ${startYear} – ${endMonth} ${end.getDate()}, ${endYear}`;
}

export function formatWeekday(now: Date = new Date(), dayOffset = 0): string {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
  return WEEKDAYS[date.getDay()].slice(0, 3);
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatRelative(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;

  return formatDate(iso);
}

function dayDiff(dateOnly: string, now: Date): number {
  const target = parseDateOnly(dateOnly);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
}

export function dueLabel(dueDate: string, now: Date = new Date()): string {
  const diff = dayDiff(dueDate, now);
  if (diff < 0) return `Overdue by ${Math.abs(diff)}d`;
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff <= 7) return `in ${diff}d`;
  return formatDate(dueDate);
}

/** Renders an optional time box as `09:00–10:30`, `from 09:00`, or `until 10:30`. */
export function taskTimeLabel(startTime?: string, endTime?: string): string | null {
  if (startTime && endTime) return `${startTime}–${endTime}`;
  if (startTime) return `from ${startTime}`;
  if (endTime) return `until ${endTime}`;
  return null;
}

export function isOverdue(task: Pick<Task, 'dueDate' | 'status'>, now: Date = new Date()): boolean {
  if (!task.dueDate || task.status === 'done') return false;
  return task.dueDate < todayIso(now);
}

export function isDueToday(task: Pick<Task, 'dueDate' | 'status'>, now: Date = new Date()): boolean {
  if (!task.dueDate) return false;
  return task.dueDate === todayIso(now);
}

export function greeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
