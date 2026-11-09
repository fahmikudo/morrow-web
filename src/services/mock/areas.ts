import { createId } from '@/lib/id';
import type { AreaRepository, UpdateArea } from '@/services/repositories/contracts';
import type { Area, NewArea } from '@/types';
import { latency } from './latency';
import { loadDatabase, saveDatabase } from './storage';

function indexOf(areas: Area[], id: string): number {
  const index = areas.findIndex((area) => area.id === id);
  if (index === -1) throw new Error('Area not found');
  return index;
}

export function createAreaRepository(): AreaRepository {
  return {
    async list() {
      await latency();
      return loadDatabase().areas;
    },

    async get(id) {
      await latency();
      return loadDatabase().areas.find((area) => area.id === id) ?? null;
    },

    async create(input: NewArea) {
      await latency();
      const db = loadDatabase();
      const timestamp = new Date().toISOString();
      const area: Area = {
        id: createId('a'),
        name: input.name,
        tone: input.tone ?? 'neutral',
        icon: input.icon ?? 'sparkles',
        createdAt: timestamp,
        updatedAt: timestamp,
        ...(input.description !== undefined ? { description: input.description } : {}),
      };

      db.areas.push(area);
      saveDatabase(db);
      return area;
    },

    async update(id: string, patch: UpdateArea) {
      await latency();
      const db = loadDatabase();
      const index = indexOf(db.areas, id);
      const next: Area = { ...db.areas[index], updatedAt: new Date().toISOString() };

      if (patch.name !== undefined) next.name = patch.name;
      if (patch.description !== undefined) next.description = patch.description;
      if (patch.tone !== undefined) next.tone = patch.tone;
      if (patch.icon !== undefined) next.icon = patch.icon;

      db.areas[index] = next;
      saveDatabase(db);
      return next;
    },

    async remove(id: string) {
      await latency();
      const db = loadDatabase();
      const index = indexOf(db.areas, id);
      db.areas.splice(index, 1);

      const unlink = <T extends { areaId?: string }>(item: T): T => {
        if (item.areaId !== id) return item;
        const next = { ...item };
        delete next.areaId;
        return next;
      };

      db.projects = db.projects.map(unlink);
      db.tasks = db.tasks.map(unlink);
      db.notes = db.notes.map(unlink);
      saveDatabase(db);
    },
  };
}
