/** Personal access token metadata; the secret itself is never returned again. */
export type ApiToken = {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
};

export type CreatedApiToken = {
  token: string;
  apiToken: ApiToken;
};
