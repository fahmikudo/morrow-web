import type { ApiTokenRepository } from '@/services/repositories/contracts';

const UNAVAILABLE = 'Agent tokens require server mode';

/**
 * Personal access tokens are server state by definition: localStorage has no
 * authentication boundary, so the mock repositories refuse to fake them.
 */
export function createApiTokenRepository(): ApiTokenRepository {
  return {
    list: async () => [],
    create: async () => {
      throw new Error(UNAVAILABLE);
    },
    revoke: async () => {
      throw new Error(UNAVAILABLE);
    },
  };
}
