import { latency } from './latency';
import { loadDatabase } from './storage';
import { generateAssistantReply } from '@/features/assistant/respond';
import { parseDateOnly } from '@/lib/date';
import type { AssistantRepository } from '@/services/repositories/contracts';

export function createAssistantRepository(): AssistantRepository {
  return {
    async reply(message, today) {
      await latency();
      const db = loadDatabase();

      return {
        reply: generateAssistantReply(
          message,
          {
            tasks: db.tasks,
            projects: db.projects,
            notes: db.notes,
            inbox: db.inbox.filter((item) => !item.archivedAt),
          },
          parseDateOnly(today),
        ),
        provider: 'fallback',
        sources: [],
        created: [],
      };
    },
  };
}
