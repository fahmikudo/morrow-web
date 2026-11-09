import { describe, expect, it } from 'vitest';
import { AI_MODELS, AI_PROVIDER, modelsFor } from './ai';

describe('ai settings helpers', () => {
  it('exposes DeepSeek as the only provider', () => {
    expect(AI_PROVIDER.id).toBe('deepseek');
    expect(AI_PROVIDER.label).toBe('DeepSeek');
  });

  it('returns the DeepSeek model catalogue', () => {
    expect(AI_MODELS).toEqual(['deepseek-chat', 'deepseek-reasoner']);
    expect(modelsFor('deepseek')).toEqual(AI_MODELS);
  });
});
