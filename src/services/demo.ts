import { apiBaseUrl, isServerMode } from './index';
import { request } from './http/client';
import { loadDatabase } from './mock/storage';

/**
 * Pushes whatever the browser currently holds into the server. Used once when
 * switching an existing prototype session over to the API.
 */
export async function importLocalData(): Promise<void> {
  if (!isServerMode) return;

  await request<void>(apiBaseUrl, '/import', { method: 'POST', body: loadDatabase() });
}
