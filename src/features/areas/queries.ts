import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@heroui/react';
import { searchKeys } from '@/features/search/query-keys';
import { notifyError } from '@/lib/toast';
import { repositories } from '@/services';
import type { UpdateArea } from '@/services';
import type { NewArea } from '@/types';

export const areaKeys = {
  all: ['areas'] as const,
  detail: (id: string) => ['areas', id] as const,
};

export function useAreas() {
  return useQuery({
    queryKey: areaKeys.all,
    queryFn: () => repositories.areas.list(),
  });
}

export function useArea(id: string | undefined) {
  return useQuery({
    queryKey: areaKeys.detail(id ?? ''),
    queryFn: () => repositories.areas.get(id ?? ''),
    enabled: Boolean(id),
  });
}

export function useCreateArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NewArea) => repositories.areas.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: areaKeys.all });
      toast.success('Area created');
    },
    onError: notifyError,
  });
}

export function useUpdateArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateArea }) =>
      repositories.areas.update(id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: areaKeys.all });
      toast.success('Area updated');
    },
    onError: notifyError,
  });
}

export function useDeleteArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => repositories.areas.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: areaKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['notes'] });
      void queryClient.invalidateQueries({ queryKey: searchKeys.all });
      toast.success('Area deleted');
    },
    onError: notifyError,
  });
}
