import type { Event } from '@/types';

/** Chronological order: date, then all-day entries first, then start time, then title. */
export function compareEvents(a: Event, b: Event): number {
  return (
    a.date.localeCompare(b.date) ||
    (a.startTime ?? '').localeCompare(b.startTime ?? '') ||
    a.title.localeCompare(b.title)
  );
}

export function eventsByDate(events: Event[]): Map<string, Event[]> {
  const groups = new Map<string, Event[]>();

  for (const event of events) {
    const bucket = groups.get(event.date) ?? [];
    bucket.push(event);
    groups.set(event.date, bucket);
  }

  for (const [date, bucket] of groups) {
    groups.set(date, bucket.sort(compareEvents));
  }

  return groups;
}

/** Inclusive range on `YYYY-MM-DD` strings. */
export function eventsInRange(events: Event[], fromDate: string, toDate: string): Event[] {
  return events
    .filter((event) => event.date >= fromDate && event.date <= toDate)
    .sort(compareEvents);
}

export function eventTimeLabel(event: Pick<Event, 'startTime' | 'endTime'>): string {
  if (!event.startTime) return 'All day';
  return event.endTime ? `${event.startTime} – ${event.endTime}` : event.startTime;
}
