import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@heroui/react';
import { notifyError } from '@/lib/toast';
import { repositories } from '@/services';
import type { UpdateEvent } from '@/services';
import type { NewEvent } from '@/types';

export const eventKeys = {
  all: ['events'] as const,
};

function useInvalidateEvents() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: eventKeys.all });
  };
}

export function useEvents() {
  return useQuery({
    queryKey: eventKeys.all,
    queryFn: () => repositories.events.list(),
    refetchInterval: 60_000,
  });
}

export function useCreateEvent() {
  const invalidate = useInvalidateEvents();

  return useMutation({
    mutationFn: (input: NewEvent) => repositories.events.create(input),
    onSuccess: () => {
      invalidate();
      toast.success('Event created');
    },
    onError: notifyError,
  });
}

export function useUpdateEvent() {
  const invalidate = useInvalidateEvents();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateEvent }) =>
      repositories.events.update(id, patch),
    onSuccess: () => {
      invalidate();
      toast.success('Event updated');
    },
    onError: notifyError,
  });
}

export function useDeleteEvent() {
  const invalidate = useInvalidateEvents();

  return useMutation({
    mutationFn: (id: string) => repositories.events.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success('Event deleted');
    },
    onError: notifyError,
  });
}
