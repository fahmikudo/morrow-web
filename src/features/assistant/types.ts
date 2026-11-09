import type { AssistantFallbackReason, AssistantSource } from '@/types/assistant';
import type { Task } from '@/types';

export type AssistantMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** Grounding links returned by the server with the reply. */
  sources?: AssistantSource[];
  /** Tasks the server created for this reply. */
  created?: Task[];
  /** Why the server produced a derived answer instead of an AI reply. */
  reason?: AssistantFallbackReason;
  /** Local ISO timestamp, used for chat grouping. */
  createdAt: string;
};

export const ASSISTANT_REASON_COPY: Record<AssistantFallbackReason, string> = {
  ai_disabled: 'AI is off — derived answer.',
  key_missing: 'No API key configured — derived answer.',
  provider_error: 'Provider unavailable — derived answer.',
  empty_completion: 'Empty response — derived answer.',
};

export const ASSISTANT_GREETING =
  "Hi — I'm your assistant. I can summarize your day, suggest what to focus on, or walk through your projects.";
