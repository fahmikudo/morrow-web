import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@heroui/react';
import { projectKeys } from '@/features/projects/queries';
import { searchKeys } from '@/features/search/query-keys';
import { notifyError } from '@/lib/toast';
import { repositories } from '@/services';
import type { UpdateNote } from '@/services';
import type { NewNote } from '@/types';

export const noteKeys = {
  all: ['notes'] as const,
  detail: (id: string) => ['notes', id] as const,
};

function useInvalidateNotes() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: noteKeys.all });
    void queryClient.invalidateQueries({ queryKey: searchKeys.all });
  };
}

export function useNotes() {
  return useQuery({
    queryKey: noteKeys.all,
    queryFn: () => repositories.notes.list(),
  });
}

export function useNote(id: string | undefined) {
  return useQuery({
    queryKey: noteKeys.detail(id ?? ''),
    queryFn: () => repositories.notes.get(id ?? ''),
    enabled: Boolean(id),
  });
}

export function useCreateNote() {
  const invalidate = useInvalidateNotes();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NewNote) => repositories.notes.create(input),
    onSuccess: () => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
      toast.success('Note saved');
    },
    onError: notifyError,
  });
}

export function useUpdateNote() {
  const invalidate = useInvalidateNotes();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateNote }) =>
      repositories.notes.update(id, patch),
    onSuccess: () => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
      toast.success('Note saved');
    },
    onError: notifyError,
  });
}

export function useDeleteNote() {
  const invalidate = useInvalidateNotes();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => repositories.notes.remove(id),
    onSuccess: () => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
      toast.success('Note deleted');
    },
    onError: notifyError,
  });
}
