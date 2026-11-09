import type { Profile } from '@/types';

/** Seeded identity for the prototype's single local user. */
export function createDefaultProfile(now: Date = new Date()): Profile {
  const joinedAt = new Date(now.getTime() - 120 * 86_400_000).toISOString();

  return {
    id: 'me',
    name: 'Raka Pratama',
    email: 'raka@example.com',
    role: 'Product engineer',
    timezone: 'Asia/Jakarta',
    joinedAt,
    updatedAt: new Date(now.getTime() - 3 * 3_600_000).toISOString(),
  };
}
