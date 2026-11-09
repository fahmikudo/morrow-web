import { createId } from '@/lib/id';
import type { EventRepository, UpdateEvent } from '@/services/repositories/contracts';
import type { Event, NewEvent } from '@/types';
import { latency } from './latency';
import { loadDatabase, saveDatabase } from './storage';

function indexOf(events: Event[], id: string): number {
  const index = events.findIndex((event) => event.id === id);
  if (index === -1) throw new Error('Event not found');
  return index;
}

export function createEventRepository(): EventRepository {
  return {
    async list() {
      await latency();
      return loadDatabase().events;
    },

    async get(id) {
      await latency();
      return loadDatabase().events.find((event) => event.id === id) ?? null;
    },

    async create(input: NewEvent) {
      await latency();
      const db = loadDatabase();
      const timestamp = new Date().toISOString();
      const event: Event = {
        id: createId('e'),
        title: input.title,
        date: input.date,
        createdAt: timestamp,
        updatedAt: timestamp,
        ...(input.startTime !== undefined ? { startTime: input.startTime } : {}),
        ...(input.endTime !== undefined ? { endTime: input.endTime } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.projectId !== undefined ? { projectId: input.projectId } : {}),
        source: 'local',
      };

      db.events.push(event);
      saveDatabase(db);
      return event;
    },

    async update(id: string, patch: UpdateEvent) {
      await latency();
      const db = loadDatabase();
      const index = indexOf(db.events, id);
      const next: Event = { ...db.events[index], updatedAt: new Date().toISOString() };

      if (patch.title !== undefined) next.title = patch.title;
      if (patch.date !== undefined) next.date = patch.date;
      if (patch.notes !== undefined) next.notes = patch.notes;

      if (patch.startTime !== undefined) {
        if (patch.startTime === null) delete next.startTime;
        else next.startTime = patch.startTime;
      }
      if (patch.endTime !== undefined) {
        if (patch.endTime === null) delete next.endTime;
        else next.endTime = patch.endTime;
      }
      if (patch.projectId !== undefined) {
        if (patch.projectId === null) delete next.projectId;
        else next.projectId = patch.projectId;
      }

      db.events[index] = next;
      saveDatabase(db);
      return next;
    },

    async remove(id: string) {
      await latency();
      const db = loadDatabase();
      const index = indexOf(db.events, id);
      db.events.splice(index, 1);
      saveDatabase(db);
    },
  };
}
