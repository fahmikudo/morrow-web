import type { ApiTokenRepository } from '@/services/repositories/contracts';
import type { ApiToken, CreatedApiToken } from '@/types/tokens';
import { request } from './client';

export function createApiTokenRepository(baseUrl: string): ApiTokenRepository {
  return {
    list: () => request<ApiToken[]>(baseUrl, '/api-tokens'),
    create: (name: string) =>
      request<CreatedApiToken>(baseUrl, '/api-tokens', {
        method: 'POST',
        body: { name },
      }),
    revoke: (id: string) =>
      request<void>(baseUrl, `/api-tokens/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  };
}
