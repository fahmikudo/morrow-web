import type { Task } from '@/types';

export type AssistantProvider = 'deepseek' | 'fallback';

export type AssistantSourceKind = 'task' | 'project' | 'note' | 'inbox' | 'habit' | 'area';

export type AssistantSource = {
  kind: AssistantSourceKind;
  id: string;
  title: string;
  /** App-relative link supplied by the server, e.g. `/tasks`. */
  href: string;
};

export type AssistantFallbackReason =
  | 'ai_disabled'
  | 'key_missing'
  | 'provider_error'
  | 'empty_completion';

export type AssistantReply = {
  reply: string;
  provider: AssistantProvider;
  /** Always present; may be empty. */
  sources: AssistantSource[];
  /** Tasks the assistant created for this reply. Always present; may be empty. */
  created: Task[];
  /** Only set when the server fell back to a derived answer. */
  reason?: AssistantFallbackReason;
};
