import type { Database, Project, Task } from '@/types';
import { deriveKeyPrefix, uniqueKey } from './keys';
import type { DatabaseV1, DatabaseV2, DatabaseV3, DatabaseV4, DatabaseV5 } from './schema';
import { createDefaultProfile } from './profile-default';

const PROJECTLESS_BUCKET = 'none';
const PROJECTLESS_PREFIX = 'SB';

/**
 * Upgrades a version 1 payload to the issue model: projects get immutable keys,
 * every task gets an issue key, and new task fields receive defaults.
 */
export function migrateV1ToV2(db: DatabaseV1): DatabaseV2 {
  const takenProjectKeys = new Set<string>();

  const projects: Project[] = db.projects.map((project) => {
    const key = uniqueKey(deriveKeyPrefix(project.name), takenProjectKeys);
    takenProjectKeys.add(key);
    return { ...project, key };
  });

  const projectById = new Map(projects.map((project) => [project.id, project]));
  const counters: Record<string, number> = {};

  const tasks: Task[] = db.tasks.map((task) => {
    const project = task.projectId ? projectById.get(task.projectId) : undefined;
    const bucket = project ? project.id : PROJECTLESS_BUCKET;
    const prefix = project ? project.key : PROJECTLESS_PREFIX;

    const next = (counters[bucket] ?? 0) + 1;
    counters[bucket] = next;

    return {
      ...task,
      key: `${prefix}-${next}`,
      type: 'task',
      labels: [],
    };
  });

  return { version: 2, inbox: db.inbox, tasks, projects, notes: db.notes, counters };
}

/** Adds the events collection introduced in v3. */
export function migrateV2ToV3(db: DatabaseV2): DatabaseV3 {
  return { ...db, version: 3, events: [] };
}

/** Adds the areas collection introduced in v4 (assignments come from the user). */
export function migrateV3ToV4(db: DatabaseV3): DatabaseV4 {
  return { ...db, version: 4, areas: [] };
}

/** Adds habit tracking collections introduced in v5. */
export function migrateV4ToV5(db: DatabaseV4): DatabaseV5 {
  return { ...db, version: 5, habits: [], habitCheckIns: [] };
}

/** Adds the single local profile introduced in v6. */
export function migrateV5ToV6(db: DatabaseV5): Database {
  return { ...db, version: 6, habitSkips: [], profile: createDefaultProfile() };
}
