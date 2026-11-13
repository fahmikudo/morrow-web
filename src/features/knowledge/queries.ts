import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { toast } from '@heroui/react';
import { projectKeys } from '@/features/projects/queries';
import { searchKeys } from '@/features/search/query-keys';
import { notifyError } from '@/lib/toast';
import { repositories } from '@/services';
import type { UpdateNote } from '@/services';
import type { NewNote, Note } from '@/types';

export const noteKeys = {
  all: ['notes'] as const,
  detail: (id: string) => ['notes', id] as const,
};

type CreateNoteVariables = {
  input: NewNote;
  /** Autosave skips the toast and refetch; the caches are patched directly. */
  silent?: boolean;
};

type UpdateNoteVariables = {
  id: string;
  patch: UpdateNote;
  /** Autosave skips the toast and refetch; the caches are patched directly. */
  silent?: boolean;
};

function useInvalidateNotes() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: noteKeys.all });
    void queryClient.invalidateQueries({ queryKey: searchKeys.all });
  };
}

function syncNoteCaches(queryClient: QueryClient, note: Note) {
  queryClient.setQueryData(noteKeys.detail(note.id), note);
  queryClient.setQueryData<Note[]>(noteKeys.all, (notes) => {
    const list = notes ?? [];
    return list.some((entry) => entry.id === note.id)
      ? list.map((entry) => (entry.id === note.id ? note : entry))
      : [note, ...list];
  });
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
    mutationFn: ({ input }: CreateNoteVariables) => repositories.notes.create(input),
    onSuccess: (created, { silent }) => {
      syncNoteCaches(queryClient, created);
      if (silent) return;

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
    mutationFn: ({ id, patch }: UpdateNoteVariables) =>
      repositories.notes.update(id, patch),
    onSuccess: (updated, { silent }) => {
      syncNoteCaches(queryClient, updated);
      if (silent) return;

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
