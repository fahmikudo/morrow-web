import { describe, expect, it } from 'vitest';
import areaFixture from '../../../contracts/fixtures/area.json';
import eventFixture from '../../../contracts/fixtures/event.json';
import habitCheckInFixture from '../../../contracts/fixtures/habit-check-in.json';
import habitFixture from '../../../contracts/fixtures/habit.json';
import inboxItemFixture from '../../../contracts/fixtures/inbox-item.json';
import noteFixture from '../../../contracts/fixtures/note.json';
import profileFixture from '../../../contracts/fixtures/profile.json';
import projectFixture from '../../../contracts/fixtures/project.json';
import searchResultsFixture from '../../../contracts/fixtures/search-results.json';
import serverSnapshotFixture from '../../../contracts/fixtures/server-snapshot.json';
import taskMinimalFixture from '../../../contracts/fixtures/task-minimal.json';
import taskFixture from '../../../contracts/fixtures/task.json';
import { databaseSchema } from '@/services/mock/schema';
import type { SearchKind, SearchResult } from '@/types/search';
import type { ServerSnapshot } from '@/types/server';

const SEARCH_KINDS: readonly SearchKind[] = [
  'task',
  'note',
  'project',
  'inbox',
  'area',
  'habit',
];

function isSearchKind(value: string): value is SearchKind {
  return (SEARCH_KINDS as readonly string[]).includes(value);
}

/** Runtime-validates the fixtures through the same schema the mock database uses. */
function parseEntities() {
  const envelope = databaseSchema.parse({
    version: 6,
    inbox: [inboxItemFixture],
    tasks: [taskFixture, taskMinimalFixture],
    projects: [projectFixture],
    notes: [noteFixture],
    events: [eventFixture],
    areas: [areaFixture],
    habits: [habitFixture],
    habitCheckIns: [habitCheckInFixture],
    profile: profileFixture,
    counters: { p1: 12, none: 3 },
  });

  return {
    task: envelope.tasks[0],
    minimalTask: envelope.tasks[1],
    project: envelope.projects[0],
    note: envelope.notes[0],
    event: envelope.events[0],
    area: envelope.areas[0],
    habit: envelope.habits[0],
    checkIn: envelope.habitCheckIns[0],
    inboxItem: envelope.inbox[0],
    profile: envelope.profile,
  };
}

function parseSearchResults(): SearchResult[] {
  return searchResultsFixture.map((entry) => {
    if (!isSearchKind(entry.kind)) {
      throw new Error(`Unexpected search kind: ${entry.kind}`);
    }
    return { ...entry, kind: entry.kind };
  });
}

describe('wire contracts', () => {
  it('validates every entity fixture against the shared schema', () => {
    const { task, minimalTask, project, note, event, area, habit, checkIn, inboxItem, profile } =
      parseEntities();

    expect(task.key).toBe('DWP-12');
    expect(task.dueDate).toBe('2026-11-10');
    expect(task.startTime).toBe('09:00');
    expect(task.endTime).toBe('10:30');
    expect(minimalTask.labels).toEqual([]);
    expect(project.key).toBe('DWP');
    expect(note.tags).toContain('warehouse');
    expect(event.startTime).toBe('09:00');
    expect(area.icon).toBe('briefcase');
    expect(habit.schedule).toEqual({ kind: 'fixed', weekdays: [1, 2, 3, 4] });
    expect(checkIn.habitId).toBe(habit.id);
    expect(inboxItem.archivedAt).toBeTypeOf('string');
    expect(profile.id).toBe('me');
  });

  it('types the search result fixture', () => {
    const results = parseSearchResults();

    expect(results.map((entry) => entry.kind)).toEqual([
      'task',
      'note',
      'project',
      'inbox',
      'habit',
      'area',
    ]);
  });

  it('validates the server snapshot as a database envelope', () => {
    // JSON imports widen string literals, so a cast is the only way to reach the
    // typed snapshot; the assertions below cover the parts zod does not.
    const snapshot: ServerSnapshot = serverSnapshotFixture as ServerSnapshot;
    const {
      version,
      inbox,
      tasks,
      projects,
      notes,
      events,
      areas,
      habits,
      habitCheckIns,
      profile,
      counters,
    } = snapshot;

    const parsed = databaseSchema.parse({
      version,
      inbox,
      tasks,
      projects,
      notes,
      events,
      areas,
      habits,
      habitCheckIns,
      profile,
      counters,
    });

    expect(parsed.version).toBe(6);
    expect(snapshot.serverTime).toBe('2026-11-08T03:15:27.412Z');
    expect(snapshot.ai.provider).toBe('deepseek');
    expect(snapshot.ai.model).toBe('deepseek-chat');
    expect(snapshot.ai.keyConfigured).toBe(false);
    expect(Object.keys(snapshot.integrations)).toHaveLength(2);
  });
});
