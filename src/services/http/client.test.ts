import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, OfflineError, UNAUTHORIZED_EVENT, request, requestOptional } from './client';
import { clearToken, getToken, setToken } from './token';

const base = 'http://api.test/api/v1';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function fetchMockFor(response: Response) {
  return vi.fn().mockResolvedValue(response);
}

function setOnline(online: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: online });
}

beforeEach(() => {
  localStorage.clear();
  setOnline(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  clearToken();
});

describe('http client', () => {
  it('sends the bearer token and parses the response', async () => {
    setToken('token-123');
    const fetchMock = fetchMockFor(jsonResponse([{ id: 't_1' }]));
    vi.stubGlobal('fetch', fetchMock);

    const tasks = await request<Array<{ id: string }>>(base, '/tasks');

    expect(tasks).toEqual([{ id: 't_1' }]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${base}/tasks`);
    expect((init as RequestInit).method).toBe('GET');
    const headers = (init as RequestInit).headers as Headers;
    expect(headers.get('authorization')).toBe('Bearer token-123');
  });

  it('serializes JSON bodies and sets the content type', async () => {
    const fetchMock = fetchMockFor(jsonResponse({ id: 't_1' }, 201));
    vi.stubGlobal('fetch', fetchMock);

    await request(base, '/tasks', { method: 'POST', body: { title: 'Hello' } });

    const [, init] = fetchMock.mock.calls[0];
    expect((init as RequestInit).body).toBe(JSON.stringify({ title: 'Hello' }));
    expect(((init as RequestInit).headers as Headers).get('content-type')).toBe(
      'application/json',
    );
  });

  it('extracts the server error message', async () => {
    vi.stubGlobal('fetch', fetchMockFor(jsonResponse({ error: 'Title is required' }, 400)));

    await expect(request(base, '/tasks', { method: 'POST', body: { title: '' } })).rejects.toMatchObject(
      {
        name: 'ApiError',
        status: 400,
        message: 'Title is required',
      },
    );
  });

  it('maps 404 to null for optional reads', async () => {
    vi.stubGlobal('fetch', fetchMockFor(jsonResponse({ error: 'Task not found' }, 404)));

    await expect(requestOptional(base, '/tasks/t_missing')).resolves.toBeNull();
  });

  it('blocks mutations while offline', async () => {
    setOnline(false);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      request(base, '/tasks', { method: 'POST', body: { title: 'Offline' } }),
    ).rejects.toBeInstanceOf(OfflineError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('clears the token and signals the app on 401', async () => {
    setToken('stale-token');
    vi.stubGlobal('fetch', fetchMockFor(jsonResponse({ error: 'Unauthorized' }, 401)));

    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, listener);

    await expect(request(base, '/tasks')).rejects.toBeInstanceOf(ApiError);
    expect(getToken()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener(UNAUTHORIZED_EVENT, listener);
  });

  it('reports an unreachable server as an ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('failed to fetch')));

    await expect(request(base, '/tasks')).rejects.toMatchObject({
      name: 'ApiError',
      status: 0,
      message: 'Cannot reach the server',
    });
  });
});
