import { parseDate, Time, type DateValue } from '@internationalized/date';

/** Converts the app's `YYYY-MM-DD` string into a HeroUI date value. */
export function toCalendarDate(iso: string): DateValue | null {
  if (!iso) return null;
  try {
    return parseDate(iso);
  } catch {
    return null;
  }
}

/** Converts a HeroUI date value back into the app's `YYYY-MM-DD` string. */
export function fromCalendarDate(value: DateValue | null): string {
  return value ? value.toString() : '';
}

/** Converts an `HH:mm` string into a HeroUI time value. */
export function toTimeValue(time: string): Time | null {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return null;
  return new Time(Number(match[1]), Number(match[2]));
}

/** Converts a HeroUI time value back into an `HH:mm` string. */
export function fromTimeValue(value: { hour: number; minute: number } | null): string {
  if (!value) return '';
  return `${String(value.hour).padStart(2, '0')}:${String(value.minute).padStart(2, '0')}`;
}
