import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './client';
import { createApiTokenRepository } from './tokens';
import { clearToken } from './token';

const base = 'http://api.test/api/v1';
const repo = createApiTokenRepository(base);

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  clearToken();
});

describe('api token repository', () => {
  it('creates a token with the name in the body', async () => {
    const created = {
      token: 'sb_abc',
      apiToken: { id: 'tok_1', name: 'MCP', createdAt: '2026-01-01T00:00:00.000Z' },
    };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(created, 201));
    vi.stubGlobal('fetch', fetchMock);

    await expect(repo.create('MCP')).resolves.toEqual(created);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${base}/api-tokens`);
    expect((init as RequestInit).method).toBe('POST');
    expect((init as RequestInit).body).toBe(JSON.stringify({ name: 'MCP' }));
  });

  it('lists tokens', async () => {
    const tokens = [
      {
        id: 'tok_1',
        name: 'MCP',
        createdAt: '2026-01-01T00:00:00.000Z',
        lastUsedAt: '2026-01-02T00:00:00.000Z',
      },
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(tokens)));

    await expect(repo.list()).resolves.toEqual(tokens);
  });

  it('revokes a token and accepts 204', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(undefined, 204));
    vi.stubGlobal('fetch', fetchMock);

    await expect(repo.revoke('tok_1')).resolves.toBeNull();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${base}/api-tokens/tok_1`);
    expect((init as RequestInit).method).toBe('DELETE');
  });

  it('surfaces the server message on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => jsonResponse({ error: 'Name is required' }, 400)),
    );

    await expect(repo.create('')).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      message: 'Name is required',
    });
    await expect(repo.create('')).rejects.toBeInstanceOf(ApiError);
  });
});
