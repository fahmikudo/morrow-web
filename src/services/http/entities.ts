import type {
  Area,
  Event,
  Habit,
  HabitCheckIn,
  InboxItem,
  NewArea,
  NewEvent,
  NewHabit,
  NewInboxItem,
  NewNote,
  NewProject,
  NewTask,
  Note,
  Profile,
  Project,
  Task,
} from '@/types';
import type {
  AreaRepository,
  EventRepository,
  HabitRepository,
  InboxRepository,
  NoteRepository,
  ProfileRepository,
  ProjectRepository,
  TaskRepository,
  UpdateArea,
  UpdateEvent,
  UpdateHabit,
  UpdateInboxItem,
  UpdateNote,
  UpdateProfile,
  UpdateProject,
  UpdateTask,
} from '@/services/repositories/contracts';
import { request, requestOptional } from './client';

const encode = (id: string) => encodeURIComponent(id);

export function createInboxRepository(baseUrl: string): InboxRepository {
  return {
    list: () => request<InboxItem[]>(baseUrl, '/inbox'),
    listArchived: () => request<InboxItem[]>(baseUrl, '/inbox/archived'),
    get: (id) => requestOptional<InboxItem>(baseUrl, `/inbox/${encode(id)}`),
    create: (input: NewInboxItem) =>
      request<InboxItem>(baseUrl, '/inbox', { method: 'POST', body: input }),
    update: (id: string, patch: UpdateInboxItem) =>
      request<InboxItem>(baseUrl, `/inbox/${encode(id)}`, { method: 'PATCH', body: patch }),
    archive: (id: string) =>
      request<InboxItem>(baseUrl, `/inbox/${encode(id)}/archive`, { method: 'POST' }),
    restore: (id: string) =>
      request<InboxItem>(baseUrl, `/inbox/${encode(id)}/restore`, { method: 'POST' }),
    remove: async (id: string) => {
      await request<void>(baseUrl, `/inbox/${encode(id)}`, { method: 'DELETE' });
    },
  };
}

export function createTaskRepository(baseUrl: string): TaskRepository {
  return {
    list: () => request<Task[]>(baseUrl, '/tasks'),
    get: (id) => requestOptional<Task>(baseUrl, `/tasks/${encode(id)}`),
    create: (input: NewTask) =>
      request<Task>(baseUrl, '/tasks', { method: 'POST', body: input }),
    update: (id: string, patch: UpdateTask) =>
      request<Task>(baseUrl, `/tasks/${encode(id)}`, { method: 'PATCH', body: patch }),
    remove: async (id: string) => {
      await request<void>(baseUrl, `/tasks/${encode(id)}`, { method: 'DELETE' });
    },
  };
}

export function createProjectRepository(baseUrl: string): ProjectRepository {
  return {
    list: () => request<Project[]>(baseUrl, '/projects'),
    get: (id) => requestOptional<Project>(baseUrl, `/projects/${encode(id)}`),
    create: (input: NewProject) =>
      request<Project>(baseUrl, '/projects', { method: 'POST', body: input }),
    update: (id: string, patch: UpdateProject) =>
      request<Project>(baseUrl, `/projects/${encode(id)}`, { method: 'PATCH', body: patch }),
    remove: async (id: string) => {
      await request<void>(baseUrl, `/projects/${encode(id)}`, { method: 'DELETE' });
    },
  };
}

export function createNoteRepository(baseUrl: string): NoteRepository {
  return {
    list: () => request<Note[]>(baseUrl, '/notes'),
    get: (id) => requestOptional<Note>(baseUrl, `/notes/${encode(id)}`),
    create: (input: NewNote) =>
      request<Note>(baseUrl, '/notes', { method: 'POST', body: input }),
    update: (id: string, patch: UpdateNote) =>
      request<Note>(baseUrl, `/notes/${encode(id)}`, { method: 'PATCH', body: patch }),
    remove: async (id: string) => {
      await request<void>(baseUrl, `/notes/${encode(id)}`, { method: 'DELETE' });
    },
  };
}

export function createEventRepository(baseUrl: string): EventRepository {
  return {
    list: () => request<Event[]>(baseUrl, '/events'),
    get: (id) => requestOptional<Event>(baseUrl, `/events/${encode(id)}`),
    create: (input: NewEvent) =>
      request<Event>(baseUrl, '/events', { method: 'POST', body: input }),
    update: (id: string, patch: UpdateEvent) =>
      request<Event>(baseUrl, `/events/${encode(id)}`, { method: 'PATCH', body: patch }),
    remove: async (id: string) => {
      await request<void>(baseUrl, `/events/${encode(id)}`, { method: 'DELETE' });
    },
  };
}

export function createAreaRepository(baseUrl: string): AreaRepository {
  return {
    list: () => request<Area[]>(baseUrl, '/areas'),
    get: (id) => requestOptional<Area>(baseUrl, `/areas/${encode(id)}`),
    create: (input: NewArea) =>
      request<Area>(baseUrl, '/areas', { method: 'POST', body: input }),
    update: (id: string, patch: UpdateArea) =>
      request<Area>(baseUrl, `/areas/${encode(id)}`, { method: 'PATCH', body: patch }),
    remove: async (id: string) => {
      await request<void>(baseUrl, `/areas/${encode(id)}`, { method: 'DELETE' });
    },
  };
}

export function createHabitRepository(baseUrl: string): HabitRepository {
  return {
    list: () => request<Habit[]>(baseUrl, '/habits'),
    listArchived: () => request<Habit[]>(baseUrl, '/habits/archived'),
    get: (id) => requestOptional<Habit>(baseUrl, `/habits/${encode(id)}`),
    create: (input: NewHabit) =>
      request<Habit>(baseUrl, '/habits', { method: 'POST', body: input }),
    update: (id: string, patch: UpdateHabit) =>
      request<Habit>(baseUrl, `/habits/${encode(id)}`, { method: 'PATCH', body: patch }),
    archive: (id: string) =>
      request<Habit>(baseUrl, `/habits/${encode(id)}/archive`, { method: 'POST' }),
    restore: (id: string) =>
      request<Habit>(baseUrl, `/habits/${encode(id)}/restore`, { method: 'POST' }),
    remove: async (id: string) => {
      await request<void>(baseUrl, `/habits/${encode(id)}`, { method: 'DELETE' });
    },
    listCheckIns: () => request<HabitCheckIn[]>(baseUrl, '/habit-check-ins'),
    checkIn: (habitId: string, date: string) =>
      request<HabitCheckIn>(baseUrl, `/habits/${encode(habitId)}/check-ins/${encode(date)}`, {
        method: 'PUT',
      }),
    removeCheckIn: async (habitId: string, date: string) => {
      await request<void>(baseUrl, `/habits/${encode(habitId)}/check-ins/${encode(date)}`, {
        method: 'DELETE',
      });
    },
  };
}

export function createProfileRepository(baseUrl: string): ProfileRepository {
  return {
    get: () => request<Profile>(baseUrl, '/profile'),
    update: (patch: UpdateProfile) =>
      request<Profile>(baseUrl, '/profile', { method: 'PATCH', body: patch }),
  };
}
