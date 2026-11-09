import type { Profile } from '@/types';
import { request } from './client';
import { clearToken, getToken, hasToken, setToken } from './token';

type LoginResponse = { token: string; profile: Profile };
type SessionResponse = { profile: Profile };

export function createAuthClient(baseUrl: string) {
  return {
    async login(email: string, password: string): Promise<Profile> {
      const response = await request<LoginResponse>(baseUrl, '/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      setToken(response.token);
      return response.profile;
    },

    async register(name: string, email: string, password: string): Promise<Profile> {
      const response = await request<LoginResponse>(baseUrl, '/auth/register', {
        method: 'POST',
        body: { name, email, password },
      });
      setToken(response.token);
      return response.profile;
    },

    async getSession(): Promise<Profile> {
      const response = await request<SessionResponse>(baseUrl, '/auth/session');
      return response.profile;
    },

    async logout(): Promise<void> {
      try {
        await request<void>(baseUrl, '/auth/logout', { method: 'POST' });
      } catch {
        // Signing out locally must succeed even when the server is unreachable.
      } finally {
        clearToken();
      }
    },
  };
}

export { clearToken, getToken, hasToken, setToken };
