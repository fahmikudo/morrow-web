import { createSeedDatabase } from '@/mocks/data/seed';
import type { Database } from '@/types';
import {
  migrateV1ToV2,
  migrateV2ToV3,
  migrateV3ToV4,
  migrateV4ToV5,
  migrateV5ToV6,
} from './migrate';
import {
  databaseSchema,
  databaseV1Schema,
  databaseV2Schema,
  databaseV3Schema,
  databaseV4Schema,
  databaseV5Schema,
} from './schema';

/** Kept from v1 so existing browser data is migrated, not lost. */
export const STORAGE_KEY = 'second-brain:data:v1';

export class StorageUnavailableError extends Error {
  constructor(message = 'Browser storage is unavailable') {
    super(message);
    this.name = 'StorageUnavailableError';
  }
}

/**
 * Session-only copy used when `localStorage` refuses writes (private mode, quota).
 * Once set, it becomes the source of truth for the rest of the session.
 */
let memoryDatabase: Database | null = null;

function writeDatabase(db: Database): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    memoryDatabase = db;
    throw new StorageUnavailableError();
  }
}

function upgrade(parsed: unknown): Database | null {
  const v5 = databaseV5Schema.safeParse(parsed);
  if (v5.success) return migrateV5ToV6(v5.data);

  const v4 = databaseV4Schema.safeParse(parsed);
  if (v4.success) return migrateV5ToV6(migrateV4ToV5(v4.data));

  const v3 = databaseV3Schema.safeParse(parsed);
  if (v3.success) return migrateV5ToV6(migrateV4ToV5(migrateV3ToV4(v3.data)));

  const v2 = databaseV2Schema.safeParse(parsed);
  if (v2.success) {
    return migrateV5ToV6(migrateV4ToV5(migrateV3ToV4(migrateV2ToV3(v2.data))));
  }

  const v1 = databaseV1Schema.safeParse(parsed);
  if (v1.success) {
    return migrateV5ToV6(
      migrateV4ToV5(migrateV3ToV4(migrateV2ToV3(migrateV1ToV2(v1.data)))),
    );
  }

  return null;
}

export function loadDatabase(): Database {
  if (memoryDatabase) return memoryDatabase;

  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage read blocked: fall through to a fresh seed.
  }

  if (raw) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }

    const current = databaseSchema.safeParse(parsed);
    if (current.success) return current.data;

    const migrated = upgrade(parsed);
    if (migrated) {
      try {
        writeDatabase(migrated);
      } catch {
        // Storage unavailable; keep the migrated copy in memory.
      }
      return migrated;
    }
  }

  const seed = createSeedDatabase();
  try {
    writeDatabase(seed);
  } catch {
    // Storage unavailable; keep the seed in memory for this session.
  }
  return seed;
}

export function saveDatabase(db: Database): void {
  writeDatabase(db);
}

export function resetDatabase(): Database {
  const seed = createSeedDatabase();
  memoryDatabase = null;
  writeDatabase(seed);
  return seed;
}

export function clearDatabase(): void {
  memoryDatabase = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
