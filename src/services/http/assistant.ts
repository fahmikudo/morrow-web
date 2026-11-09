import type { AssistantRepository } from '@/services/repositories/contracts';
import type { AssistantReply } from '@/types/assistant';
import { request } from './client';

export function createAssistantRepository(baseUrl: string): AssistantRepository {
  return {
    reply: async (message: string, today: string) => {
      const response = await request<AssistantReply>(baseUrl, '/assistant', {
        method: 'POST',
        body: { message, today },
      });

      return { ...response, sources: response.sources ?? [], created: response.created ?? [] };
    },
  };
}
