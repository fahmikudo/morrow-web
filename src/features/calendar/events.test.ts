import { describe, expect, it } from 'vitest';
import type { Event } from '@/types';
import { compareEvents, eventTimeLabel, eventsByDate, eventsInRange } from './events';

const makeEvent = (id: string, overrides: Partial<Event> = {}): Event => ({
  id,
  title: id,
  date: '2026-11-10',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('eventsByDate', () => {
  it('groups by date and sorts all-day entries before timed ones', () => {
    const groups = eventsByDate([
      makeEvent('evening', { startTime: '19:30' }),
      makeEvent('morning', { startTime: '09:00' }),
      makeEvent('all-day'),
      makeEvent('next-day', { date: '2026-11-11', startTime: '08:00' }),
    ]);

    expect([...groups.keys()]).toEqual(['2026-11-10', '2026-11-11']);
    expect(groups.get('2026-11-10')?.map((event) => event.id)).toEqual([
      'all-day',
      'morning',
      'evening',
    ]);
  });

  it('returns an empty map for no events', () => {
    expect(eventsByDate([]).size).toBe(0);
  });
});

describe('eventsInRange', () => {
  it('filters inclusively and sorts chronologically', () => {
    const events = [
      makeEvent('before', { date: '2026-11-02' }),
      makeEvent('start', { date: '2026-11-03' }),
      makeEvent('middle', { date: '2026-11-05', startTime: '10:00' }),
      makeEvent('end', { date: '2026-11-09' }),
      makeEvent('after', { date: '2026-11-10' }),
    ];

    const result = eventsInRange(events, '2026-11-03', '2026-11-09');

    expect(result.map((event) => event.id)).toEqual(['start', 'middle', 'end']);
  });

  it('returns nothing when the range is empty', () => {
    expect(eventsInRange([makeEvent('a')], '2026-12-01', '2026-12-02')).toEqual([]);
  });
});

describe('eventTimeLabel', () => {
  it('formats all-day, single-time and ranged events', () => {
    expect(eventTimeLabel({})).toBe('All day');
    expect(eventTimeLabel({ startTime: '10:00' })).toBe('10:00');
    expect(eventTimeLabel({ startTime: '10:00', endTime: '10:45' })).toBe('10:00 – 10:45');
  });
});

describe('compareEvents', () => {
  it('orders by date then start time', () => {
    const a = makeEvent('a', { date: '2026-11-10', startTime: '09:00' });
    const b = makeEvent('b', { date: '2026-11-10', startTime: '11:00' });
    const c = makeEvent('c', { date: '2026-11-11' });

    expect([b, c, a].sort(compareEvents).map((event) => event.id)).toEqual(['a', 'b', 'c']);
  });
});
