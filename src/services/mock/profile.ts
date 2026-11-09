import type { ProfileRepository, UpdateProfile } from '@/services/repositories/contracts';
import { latency } from './latency';
import { loadDatabase, saveDatabase } from './storage';

export function createProfileRepository(): ProfileRepository {
  return {
    async get() {
      await latency();
      return loadDatabase().profile;
    },

    async update(patch: UpdateProfile) {
      await latency();
      const db = loadDatabase();
      const next = { ...db.profile, updatedAt: new Date().toISOString() };

      if (patch.name !== undefined) next.name = patch.name;
      if (patch.email !== undefined) next.email = patch.email;
      if (patch.role !== undefined) next.role = patch.role;
      if (patch.timezone !== undefined) next.timezone = patch.timezone;

      db.profile = next;
      saveDatabase(db);
      return next;
    },
  };
}
