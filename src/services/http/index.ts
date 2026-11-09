import type { Repositories } from '@/services/repositories/contracts';
import { createAssistantRepository } from './assistant';
import { createAttachmentRepository } from './attachments';
import { createReminderRepository } from './reminders';
import { createSearchRepository } from './search';
import { createSettingsRepository } from './settings';
import { createApiTokenRepository } from './tokens';
import {
  createAreaRepository,
  createEventRepository,
  createHabitRepository,
  createInboxRepository,
  createNoteRepository,
  createProfileRepository,
  createProjectRepository,
  createTaskRepository,
} from './entities';

export function createHttpRepositories(baseUrl: string): Repositories {
  return {
    inbox: createInboxRepository(baseUrl),
    tasks: createTaskRepository(baseUrl),
    projects: createProjectRepository(baseUrl),
    notes: createNoteRepository(baseUrl),
    events: createEventRepository(baseUrl),
    areas: createAreaRepository(baseUrl),
    habits: createHabitRepository(baseUrl),
    profile: createProfileRepository(baseUrl),
    search: createSearchRepository(baseUrl),
    assistant: createAssistantRepository(baseUrl),
    settings: createSettingsRepository(baseUrl),
    tokens: createApiTokenRepository(baseUrl),
    reminders: createReminderRepository(baseUrl),
    attachments: createAttachmentRepository(baseUrl),
  };
}

export { createAuthClient } from './auth';
export {
  ApiError,
  OfflineError,
  UNAUTHORIZED_EVENT,
} from './client';
export { clearToken, getToken, hasToken } from './token';
