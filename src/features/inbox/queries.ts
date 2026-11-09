import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@heroui/react';
import { useNavigate } from 'react-router';
import { noteKeys } from '@/features/knowledge/queries';
import { searchKeys } from '@/features/search/query-keys';
import { taskKeys } from '@/features/tasks/queries';
import { notifyError } from '@/lib/toast';
import { repositories } from '@/services';
import type { UpdateInboxItem } from '@/services';
import { useUiStore } from '@/stores/ui-store';
import type { NewInboxItem } from '@/types';
import { convertInboxItem, type ConversionResult } from './convert';

export const inboxKeys = {
  all: ['inbox'] as const,
  archived: ['inbox', 'archived'] as const,
};

function useInvalidateInbox() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: inboxKeys.all });
    void queryClient.invalidateQueries({ queryKey: inboxKeys.archived });
    void queryClient.invalidateQueries({ queryKey: searchKeys.all });
  };
}

export function useInboxItems() {
  return useQuery({
    queryKey: inboxKeys.all,
    queryFn: () => repositories.inbox.list(),
  });
}

export function useArchivedInboxItems() {
  return useQuery({
    queryKey: inboxKeys.archived,
    queryFn: () => repositories.inbox.listArchived(),
  });
}

export function useCreateInboxItem() {
  const invalidate = useInvalidateInbox();

  return useMutation({
    mutationFn: (input: NewInboxItem) => repositories.inbox.create(input),
    onSuccess: () => {
      invalidate();
      toast.success('Captured to Inbox');
    },
    onError: notifyError,
  });
}

export function useUpdateInboxItem() {
  const invalidate = useInvalidateInbox();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateInboxItem }) =>
      repositories.inbox.update(id, patch),
    onSuccess: () => {
      invalidate();
      toast.success('Item updated');
    },
    onError: notifyError,
  });
}

export function useArchiveInboxItem() {
  const invalidate = useInvalidateInbox();

  return useMutation({
    mutationFn: (id: string) => repositories.inbox.archive(id),
    onSuccess: () => {
      invalidate();
      toast.success('Item archived');
    },
    onError: notifyError,
  });
}

export function useRestoreInboxItem() {
  const invalidate = useInvalidateInbox();

  return useMutation({
    mutationFn: (id: string) => repositories.inbox.restore(id),
    onSuccess: () => {
      invalidate();
      toast.success('Item restored');
    },
    onError: notifyError,
  });
}

export function useDeleteInboxItem() {
  const invalidate = useInvalidateInbox();

  return useMutation({
    mutationFn: (id: string) => repositories.inbox.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success('Item deleted');
    },
    onError: notifyError,
  });
}

export function useConvertInboxItem() {
  const invalidate = useInvalidateInbox();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<ConversionResult, Error, { id: string; target: 'note' | 'task' }>({
    mutationFn: ({ id, target }) => convertInboxItem(repositories, id, target),
    onSuccess: (result) => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: taskKeys.all });
      void queryClient.invalidateQueries({ queryKey: noteKeys.all });

      toast.success(result.kind === 'task' ? 'Converted to task' : 'Converted to note', {
        actionProps: {
          children: 'Open',
          onPress: () => {
            if (result.kind === 'task') {
              useUiStore.getState().openTaskPanel(result.id);
              navigate('/tasks');
              return;
            }
            navigate(`/knowledge/${result.id}`);
          },
        },
      });
    },
    onError: notifyError,
  });
}
