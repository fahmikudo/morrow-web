import { createId } from '@/lib/id';
import type { ProjectRepository, UpdateProject } from '@/services/repositories/contracts';
import type { NewProject, Project } from '@/types';
import { deriveKeyPrefix, uniqueKey } from './keys';
import { latency } from './latency';
import { loadDatabase, saveDatabase } from './storage';

function indexOf(projects: Project[], id: string): number {
  const index = projects.findIndex((project) => project.id === id);
  if (index === -1) throw new Error('Project not found');
  return index;
}

export function createProjectRepository(): ProjectRepository {
  return {
    async list() {
      await latency();
      return loadDatabase().projects;
    },

    async get(id) {
      await latency();
      return loadDatabase().projects.find((project) => project.id === id) ?? null;
    },

    async create(input: NewProject) {
      await latency();
      const db = loadDatabase();
      const timestamp = new Date().toISOString();

      const takenKeys = new Set(db.projects.map((project) => project.key));
      const project: Project = {
        id: createId('p'),
        key: uniqueKey(deriveKeyPrefix(input.name), takenKeys),
        name: input.name,
        status: input.status ?? 'active',
        createdAt: timestamp,
        updatedAt: timestamp,
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.areaId !== undefined ? { areaId: input.areaId } : {}),
      };

      db.projects.push(project);
      saveDatabase(db);
      return project;
    },

    async update(id: string, patch: UpdateProject) {
      await latency();
      const db = loadDatabase();
      const index = indexOf(db.projects, id);
      const next: Project = { ...db.projects[index], updatedAt: new Date().toISOString() };

      if (patch.name !== undefined) next.name = patch.name;
      if (patch.description !== undefined) next.description = patch.description;
      if (patch.status !== undefined) next.status = patch.status;
      if (patch.areaId !== undefined) {
        if (patch.areaId === null) delete next.areaId;
        else next.areaId = patch.areaId;
      }

      db.projects[index] = next;
      saveDatabase(db);
      return next;
    },

    async remove(id: string) {
      await latency();
      const db = loadDatabase();
      const index = indexOf(db.projects, id);
      db.projects.splice(index, 1);
      saveDatabase(db);
    },
  };
}
