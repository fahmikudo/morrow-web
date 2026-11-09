import type { Database } from '@/types';
import type { AiSettings, IntegrationConnection, IntegrationId } from './settings';

/** Server-owned snapshot: the local database envelope plus server settings. */
export type ServerSnapshot = Database & {
  integrations: Record<IntegrationId, IntegrationConnection>;
  ai: AiSettings;
  serverTime: string;
};
