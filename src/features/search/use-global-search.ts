import { useQuery } from '@tanstack/react-query';
import { repositories } from '@/services';
import { searchKeys } from './query-keys';

export function useGlobalSearch(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: searchKeys.byQuery(trimmed),
    queryFn: () => repositories.search.search(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 30_000,
  });
}
