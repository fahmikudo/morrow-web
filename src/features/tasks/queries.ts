import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@heroui/react';
import { projectKeys } from '@/features/projects/queries';
import { searchKeys } from '@/features/search/query-keys';
import { notifyError } from '@/lib/toast';
import { repositories } from '@/services';
import type { UpdateTask } from '@/services';
import type { NewTask } from '@/types';

export const taskKeys = {
  all: ['tasks'] as const,
};

function useInvalidateTasks() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: taskKeys.all });
    void queryClient.invalidateQueries({ queryKey: searchKeys.all });
  };
}

export function useTasks() {
  return useQuery({
    queryKey: taskKeys.all,
    queryFn: () => repositories.tasks.list(),
  });
}

export function useCreateTask() {
  const invalidate = useInvalidateTasks();

  return useMutation({
    mutationFn: (input: NewTask) => repositories.tasks.create(input),
    onSuccess: () => {
      invalidate();
      toast.success('Task created');
    },
    onError: notifyError,
  });
}

export function useUpdateTask() {
  const invalidate = useInvalidateTasks();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateTask }) =>
      repositories.tasks.update(id, patch),
    onSuccess: () => {
      invalidate();
      toast.success('Task updated');
    },
    onError: notifyError,
  });
}

export function useDeleteTask() {
  const invalidate = useInvalidateTasks();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => repositories.tasks.remove(id),
    onSuccess: () => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
      toast.success('Task deleted');
    },
    onError: notifyError,
  });
}
