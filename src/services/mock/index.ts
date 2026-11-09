import type { Repositories } from '@/services/repositories/contracts';
import { searchAll } from '@/services/search';
import { createAreaRepository } from './areas';
import { createAssistantRepository } from './assistant';
import { createAttachmentRepository } from './attachments';
import { createEventRepository } from './events';
import { createHabitRepository } from './habits';
import { createInboxRepository } from './inbox';
import { createNoteRepository } from './notes';
import { createProfileRepository } from './profile';
import { createProjectRepository } from './projects';
import { createReminderRepository } from './reminders';
import { createSettingsRepository } from './settings';
import { createTaskRepository } from './tasks';
import { createApiTokenRepository } from './tokens';

type EntityRepositories = Omit<
  Repositories,
  'search' | 'assistant' | 'settings' | 'tokens' | 'reminders' | 'attachments'
>;

export function createMockRepositories(): Repositories {
  const entities: EntityRepositories = {
    inbox: createInboxRepository(),
    tasks: createTaskRepository(),
    projects: createProjectRepository(),
    notes: createNoteRepository(),
    events: createEventRepository(),
    areas: createAreaRepository(),
    habits: createHabitRepository(),
    profile: createProfileRepository(),
  };

  const repositories: Repositories = {
    ...entities,
    search: {
      search: (query: string) => searchAll(repositories, query),
    },
    assistant: createAssistantRepository(),
    settings: createSettingsRepository(),
    tokens: createApiTokenRepository(),
    reminders: createReminderRepository(),
    attachments: createAttachmentRepository(),
  };

  return repositories;
}
