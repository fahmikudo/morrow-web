import type { SearchRepository } from '@/services/repositories/contracts';
import type { SearchResult } from '@/types/search';
import { request } from './client';

export function createSearchRepository(baseUrl: string): SearchRepository {
  return {
    search: (query: string) =>
      request<SearchResult[]>(baseUrl, `/search?q=${encodeURIComponent(query)}`),
  };
}
