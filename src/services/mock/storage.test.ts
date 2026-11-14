import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearDatabase,
  loadDatabase,
  resetDatabase,
  saveDatabase,
  STORAGE_KEY,
} from './storage';

const readStored = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');

const legacyPayload = {
  version: 1,
  inbox: [],
  notes: [],
  projects: [
    {
      id: 'p1',
      name: 'Data Warehouse Platform',
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  tasks: [
    {
      id: 't1',
      title: 'Legacy task',
      status: 'todo',
      priority: 'medium',
      projectId: 'p1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
};

describe('storage engine', () => {
  beforeEach(() => {
    clearDatabase();
  });

  it('seeds and persists a version 6 database when storage is empty', () => {
    const db = loadDatabase();

    expect(db.version).toBe(6);
    expect(db.profile.name).toBe('Raka Pratama');
    expect(db.profile.email).toBe('raka@example.com');
    expect(db.projects).toHaveLength(7);
    expect(db.events).toHaveLength(3);
    expect(db.areas).toHaveLength(4);
    expect(db.habits).toHaveLength(3);
    expect(db.habitCheckIns).toHaveLength(13);
    expect(db.habitSkips).toEqual([]);
    expect(db.tasks).toHaveLength(20);
    expect(db.notes).toHaveLength(7);
    expect(db.inbox).toHaveLength(6);
    expect(db.counters).toEqual({ p1: 4, p2: 4, p3: 3, p4: 3, p5: 1, p6: 1, none: 4 });
    expect(readStored()).toEqual(db);
  });

  it('migrates a version 1 payload instead of reseeding it', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyPayload));

    const db = loadDatabase();

    expect(db.version).toBe(6);
    expect(db.profile.id).toBe('me');
    expect(db.events).toEqual([]);
    expect(db.areas).toEqual([]);
    expect(db.habits).toEqual([]);
    expect(db.habitCheckIns).toEqual([]);
    expect(db.projects).toHaveLength(1);
    expect(db.projects[0].key).toBe('DWP');
    expect(db.tasks).toHaveLength(1);
    expect(db.tasks[0]).toMatchObject({
      id: 't1',
      title: 'Legacy task',
      key: 'DWP-1',
      type: 'task',
      labels: [],
    });
    expect(readStored().version).toBe(6);
  });

  it('upgrades a version 3 payload with an empty areas collection', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 3,
        inbox: [],
        tasks: [],
        projects: [],
        notes: [],
        events: [],
        counters: { none: 0 },
      }),
    );

    const db = loadDatabase();

    expect(db.version).toBe(6);
    expect(db.areas).toEqual([]);
    expect(db.habits).toEqual([]);
    expect(db.counters).toEqual({ none: 0 });
  });

  it('upgrades a version 5 payload with the default profile', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 5,
        inbox: [],
        tasks: [],
        projects: [],
        notes: [],
        events: [],
        areas: [],
        habits: [],
        habitCheckIns: [],
        counters: { none: 0 },
      }),
    );

    const db = loadDatabase();

    expect(db.version).toBe(6);
    expect(db.profile.name).toBe('Raka Pratama');
    expect(db.habits).toEqual([]);
  });

  it('upgrades a version 4 payload with empty habit collections', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 4,
        inbox: [],
        tasks: [],
        projects: [],
        notes: [],
        events: [],
        areas: [],
        counters: { none: 0 },
      }),
    );

    const db = loadDatabase();

    expect(db.version).toBe(6);
    expect(db.habits).toEqual([]);
    expect(db.habitCheckIns).toEqual([]);
    expect(db.areas).toEqual([]);
  });

  it('reseeds when the payload is malformed JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{ this is not json');

    const db = loadDatabase();

    expect(db.tasks).toHaveLength(20);
    expect(readStored().version).toBe(6);
  });

  it('reseeds when the stored version is unknown', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 7,
        inbox: [],
        tasks: [],
        projects: [],
        notes: [],
        events: [],
        areas: [],
        habits: [],
        habitCheckIns: [],
        counters: {},
      }),
    );

    const db = loadDatabase();

    expect(db.version).toBe(6);
    expect(db.notes).toHaveLength(7);
  });

  it('keeps an intentionally empty dataset instead of reseeding it', () => {
    const empty = {
      version: 6,
      inbox: [],
      tasks: [],
      projects: [],
      notes: [],
      events: [],
      areas: [],
      habits: [],
      habitCheckIns: [],
      habitSkips: [],
      profile: {
        id: 'me',
        name: 'Empty',
        email: 'empty@example.com',
        joinedAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      counters: {},
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));

    expect(loadDatabase()).toEqual(empty);
  });

  it('round-trips a saved database', () => {
    const db = loadDatabase();
    db.tasks[0].title = 'Persisted title';
    saveDatabase(db);

    expect(loadDatabase().tasks[0].title).toBe('Persisted title');
  });

  it('restores the seed dataset on reset', () => {
    const db = loadDatabase();
    db.tasks.splice(0, db.tasks.length);
    saveDatabase(db);

    const reset = resetDatabase();

    expect(reset.tasks).toHaveLength(20);
    expect(reset.events).toHaveLength(3);
    expect(reset.areas).toHaveLength(4);
    expect(reset.habits).toHaveLength(3);
    expect(reset.habitCheckIns).toHaveLength(13);
    expect(reset.profile.name).toBe('Raka Pratama');
    expect(loadDatabase().tasks).toHaveLength(20);
  });
});
