export const TOKEN_STORAGE_KEY = 'second-brain:token:v1';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // The session stays in memory for the page lifetime only.
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}

export function hasToken(): boolean {
  return Boolean(getToken());
}
