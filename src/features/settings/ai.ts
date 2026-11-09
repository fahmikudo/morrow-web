import type { AiProvider } from '@/types/settings';

export const AI_PROVIDER: { id: AiProvider; label: string; hint: string } = {
  id: 'deepseek',
  label: 'DeepSeek',
  hint: 'The server calls DeepSeek with your personal key. It is stored per account and never returned by the API.',
};

/** DeepSeek's OpenAI-compatible model ids. */
export const AI_MODELS = ['deepseek-chat', 'deepseek-reasoner'];

export function modelsFor(provider: AiProvider): string[] {
  return provider === AI_PROVIDER.id ? AI_MODELS : [];
}
