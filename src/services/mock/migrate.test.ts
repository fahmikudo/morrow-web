import { describe, expect, it } from 'vitest';
import {
  migrateV1ToV2,
  migrateV2ToV3,
  migrateV3ToV4,
  migrateV4ToV5,
  migrateV5ToV6,
} from './migrate';
import { databaseV1Schema } from './schema';

const iso = '2026-01-01T00:00:00.000Z';

const buildV1 = () => ({
  version: 1,
  inbox: [],
  notes: [],
  projects: [
    {
      id: 'p1',
      name: 'Data Warehouse Platform',
      status: 'active',
      createdAt: iso,
      updatedAt: iso,
    },
    {
      id: 'p2',
      name: 'Data Warehouse Planning',
      status: 'active',
      createdAt: iso,
      updatedAt: iso,
    },
  ],
  tasks: [
    {
      id: 't1',
      title: 'A',
      status: 'todo',
      priority: 'low',
      projectId: 'p1',
      createdAt: iso,
      updatedAt: iso,
    },
    {
      id: 't2',
      title: 'B',
      status: 'done',
      priority: 'high',
      projectId: 'p1',
      createdAt: iso,
      updatedAt: iso,
    },
    {
      id: 't3',
      title: 'C',
      status: 'in_progress',
      priority: 'medium',
      createdAt: iso,
      updatedAt: iso,
    },
  ],
});

describe('migrateV1ToV2', () => {
  it('assigns unique project keys and sequential task keys per bucket', () => {
    const migrated = migrateV1ToV2(databaseV1Schema.parse(buildV1()));

    expect(migrated.version).toBe(2);
    expect(migrated.projects.map((project) => project.key)).toEqual(['DWP', 'DWP2']);
    expect(migrated.tasks.map((task) => task.key)).toEqual(['DWP-1', 'DWP-2', 'SB-1']);
    expect(migrated.counters).toEqual({ p1: 2, none: 1 });
  });

  it('defaults the new task fields without touching existing data', () => {
    const migrated = migrateV1ToV2(databaseV1Schema.parse(buildV1()));

    expect(migrated.tasks.every((task) => task.type === 'task')).toBe(true);
    expect(migrated.tasks.every((task) => task.labels.length === 0)).toBe(true);
    expect(migrated.tasks.every((task) => task.parentId === undefined)).toBe(true);

    expect(migrated.tasks[1].status).toBe('done');
    expect(migrated.tasks[1].priority).toBe('high');
    expect(migrated.tasks[2].projectId).toBeUndefined();
  });

  it('adds the events collection when upgrading v2 to v3', () => {
    const v2 = migrateV1ToV2(databaseV1Schema.parse(buildV1()));
    const v3 = migrateV2ToV3(v2);

    expect(v3.version).toBe(3);
    expect(v3.events).toEqual([]);
    expect(v3.tasks).toEqual(v2.tasks);
    expect(v3.projects).toEqual(v2.projects);
  });

  it('adds the areas collection when upgrading v3 to v4', () => {
    const v3 = migrateV2ToV3(migrateV1ToV2(databaseV1Schema.parse(buildV1())));
    const v4 = migrateV3ToV4(v3);

    expect(v4.version).toBe(4);
    expect(v4.areas).toEqual([]);
    expect(v4.events).toEqual([]);
    expect(v4.tasks).toEqual(v3.tasks);
  });

  it('adds habit collections when upgrading v4 to v5', () => {
    const v4 = migrateV3ToV4(migrateV2ToV3(migrateV1ToV2(databaseV1Schema.parse(buildV1()))));
    const v5 = migrateV4ToV5(v4);

    expect(v5.version).toBe(5);
    expect(v5.habits).toEqual([]);
    expect(v5.habitCheckIns).toEqual([]);
    expect(v5.areas).toEqual([]);
  });

  it('adds the local profile when upgrading v5 to v6', () => {
    const v5 = migrateV4ToV5(
      migrateV3ToV4(migrateV2ToV3(migrateV1ToV2(databaseV1Schema.parse(buildV1())))),
    );
    const v6 = migrateV5ToV6(v5);

    expect(v6.version).toBe(6);
    expect(v6.profile.id).toBe('me');
    expect(v6.profile.name).toBe('Raka Pratama');
    expect(v6.habits).toEqual([]);
  });
});
