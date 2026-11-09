import { createId } from '@/lib/id';
import type { NoteRepository, UpdateNote } from '@/services/repositories/contracts';
import type { NewNote, Note } from '@/types';
import { latency } from './latency';
import { loadDatabase, saveDatabase } from './storage';

function indexOf(notes: Note[], id: string): number {
  const index = notes.findIndex((note) => note.id === id);
  if (index === -1) throw new Error('Note not found');
  return index;
}

export function createNoteRepository(): NoteRepository {
  return {
    async list() {
      await latency();
      return loadDatabase().notes;
    },

    async get(id) {
      await latency();
      return loadDatabase().notes.find((note) => note.id === id) ?? null;
    },

    async create(input: NewNote) {
      await latency();
      const db = loadDatabase();
      const timestamp = new Date().toISOString();
      const note: Note = {
        id: createId('n'),
        title: input.title,
        content: input.content ?? '',
        tags: input.tags ?? [],
        createdAt: timestamp,
        updatedAt: timestamp,
        ...(input.projectId !== undefined ? { projectId: input.projectId } : {}),
        ...(input.areaId !== undefined ? { areaId: input.areaId } : {}),
      };
      db.notes.push(note);
      saveDatabase(db);
      return note;
    },

    async update(id: string, patch: UpdateNote) {
      await latency();
      const db = loadDatabase();
      const index = indexOf(db.notes, id);
      const next: Note = { ...db.notes[index], updatedAt: new Date().toISOString() };

      if (patch.title !== undefined) next.title = patch.title;
      if (patch.content !== undefined) next.content = patch.content;
      if (patch.tags !== undefined) next.tags = patch.tags;
      if (patch.projectId !== undefined) {
        if (patch.projectId === null) delete next.projectId;
        else next.projectId = patch.projectId;
      }
      if (patch.areaId !== undefined) {
        if (patch.areaId === null) delete next.areaId;
        else next.areaId = patch.areaId;
      }

      db.notes[index] = next;
      saveDatabase(db);
      return next;
    },

    async remove(id: string) {
      await latency();
      const db = loadDatabase();
      const index = indexOf(db.notes, id);
      db.notes.splice(index, 1);
      saveDatabase(db);
    },
  };
}
