import { createId } from '@/lib/id';
import type { InboxRepository, UpdateInboxItem } from '@/services/repositories/contracts';
import type { InboxItem, NewInboxItem } from '@/types';
import { latency } from './latency';
import { loadDatabase, saveDatabase } from './storage';

function indexOf(db: { inbox: InboxItem[] }, id: string): number {
  const index = db.inbox.findIndex((item) => item.id === id);
  if (index === -1) throw new Error('Inbox item not found');
  return index;
}

export function createInboxRepository(): InboxRepository {
  return {
    async list() {
      await latency();
      return loadDatabase().inbox.filter((item) => !item.archivedAt);
    },

    async listArchived() {
      await latency();
      return loadDatabase().inbox.filter((item) => Boolean(item.archivedAt));
    },

    async get(id) {
      await latency();
      return loadDatabase().inbox.find((item) => item.id === id) ?? null;
    },

    async create(input: NewInboxItem) {
      await latency();
      const db = loadDatabase();
      const item: InboxItem = {
        id: createId('i'),
        title: input.title,
        type: input.type,
        createdAt: new Date().toISOString(),
        ...(input.content !== undefined ? { content: input.content } : {}),
      };
      db.inbox.push(item);
      saveDatabase(db);
      return item;
    },

    async update(id: string, patch: UpdateInboxItem) {
      await latency();
      const db = loadDatabase();
      const index = indexOf(db, id);
      const next: InboxItem = { ...db.inbox[index] };
      if (patch.title !== undefined) next.title = patch.title;
      if (patch.content !== undefined) next.content = patch.content;
      if (patch.type !== undefined) next.type = patch.type;
      db.inbox[index] = next;
      saveDatabase(db);
      return next;
    },

    async archive(id: string) {
      await latency();
      const db = loadDatabase();
      const index = indexOf(db, id);
      const next: InboxItem = { ...db.inbox[index], archivedAt: db.inbox[index].archivedAt ?? new Date().toISOString() };
      db.inbox[index] = next;
      saveDatabase(db);
      return next;
    },

    async restore(id: string) {
      await latency();
      const db = loadDatabase();
      const index = indexOf(db, id);
      const next: InboxItem = { ...db.inbox[index] };
      delete next.archivedAt;
      db.inbox[index] = next;
      saveDatabase(db);
      return next;
    },

    async remove(id: string) {
      await latency();
      const db = loadDatabase();
      const index = indexOf(db, id);
      db.inbox.splice(index, 1);
      saveDatabase(db);
    },
  };
}
