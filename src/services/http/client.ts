import { clearToken, getToken } from './token';

export const UNAUTHORIZED_EVENT = 'sb:unauthorized';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export class OfflineError extends Error {
  constructor(message = 'You are offline. Changes are disabled.') {
    super(message);
    this.name = 'OfflineError';
  }
}

type JsonInit = Omit<RequestInit, 'body'> & { body?: unknown };

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

async function send(baseUrl: string, path: string, init: JsonInit): Promise<Response> {
  const method = (init.method ?? 'GET').toUpperCase();

  if (method !== 'GET' && isOffline()) {
    throw new OfflineError();
  }

  const headers = new Headers(init.headers);
  headers.set('accept', 'application/json');

  const token = getToken();
  if (token) headers.set('authorization', `Bearer ${token}`);

  let body: BodyInit | undefined;
  if (init.body !== undefined) {
    headers.set('content-type', 'application/json');
    body = JSON.stringify(init.body);
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, { ...init, method, headers, body });
  } catch {
    throw new ApiError('Cannot reach the server', 0);
  }

  if (response.status === 401) {
    clearToken();
    if (token) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
  }

  return response;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function errorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const message = payload.error;
    if (typeof message === 'string' && message.length > 0) return message;
  }
  return `Request failed (HTTP ${status})`;
}

export async function request<T>(
  baseUrl: string,
  path: string,
  init: JsonInit = {},
): Promise<T> {
  const response = await send(baseUrl, path, init);
  const payload = await readJson(response);

  if (!response.ok) {
    throw new ApiError(errorMessage(payload, response.status), response.status);
  }

  return payload as T;
}

/** GET helper that maps `404` to `null`, matching the repository contract. */
export async function requestOptional<T>(baseUrl: string, path: string): Promise<T | null> {
  const response = await send(baseUrl, path, {});
  const payload = await readJson(response);

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new ApiError(errorMessage(payload, response.status), response.status);
  }

  return payload as T;
}
