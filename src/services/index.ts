import type { Repositories } from './repositories/contracts';
import { createHttpRepositories } from './http';
import { createMockRepositories } from './mock';

const baseUrl = (import.meta.env.VITE_API_URL ?? '').trim();

/** When `VITE_API_URL` is set the app talks to the Rust API instead of localStorage. */
export const isServerMode = baseUrl.length > 0;
export const apiBaseUrl = baseUrl;

export const repositories: Repositories = isServerMode
  ? createHttpRepositories(baseUrl)
  : createMockRepositories();

export { ApiError, OfflineError, UNAUTHORIZED_EVENT } from './http/client';
export { clearToken, getToken, hasToken, setToken } from './http/token';
export type * from './repositories/contracts';
