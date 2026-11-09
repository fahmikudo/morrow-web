import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@heroui/react';
import { searchKeys } from '@/features/search/query-keys';
import { notifyError } from '@/lib/toast';
import { repositories } from '@/services';
import type { UpdateHabit } from '@/services';
import type { NewHabit } from '@/types';

export const habitKeys = {
  all: ['habits'] as const,
  archived: ['habits', 'archived'] as const,
  checkIns: ['habits', 'check-ins'] as const,
};

function useInvalidateHabits() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: habitKeys.all });
    void queryClient.invalidateQueries({ queryKey: habitKeys.archived });
    void queryClient.invalidateQueries({ queryKey: habitKeys.checkIns });
    void queryClient.invalidateQueries({ queryKey: searchKeys.all });
  };
}

export function useHabits() {
  return useQuery({
    queryKey: habitKeys.all,
    queryFn: () => repositories.habits.list(),
  });
}

export function useArchivedHabits() {
  return useQuery({
    queryKey: habitKeys.archived,
    queryFn: () => repositories.habits.listArchived(),
  });
}

export function useHabitCheckIns() {
  return useQuery({
    queryKey: habitKeys.checkIns,
    queryFn: () => repositories.habits.listCheckIns(),
  });
}

export function useCreateHabit() {
  const invalidate = useInvalidateHabits();

  return useMutation({
    mutationFn: (input: NewHabit) => repositories.habits.create(input),
    onSuccess: () => {
      invalidate();
      toast.success('Habit created');
    },
    onError: notifyError,
  });
}

export function useUpdateHabit() {
  const invalidate = useInvalidateHabits();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateHabit }) =>
      repositories.habits.update(id, patch),
    onSuccess: () => {
      invalidate();
      toast.success('Habit updated');
    },
    onError: notifyError,
  });
}

export function useArchiveHabit() {
  const invalidate = useInvalidateHabits();

  return useMutation({
    mutationFn: (id: string) => repositories.habits.archive(id),
    onSuccess: () => {
      invalidate();
      toast.success('Habit archived');
    },
    onError: notifyError,
  });
}

export function useRestoreHabit() {
  const invalidate = useInvalidateHabits();

  return useMutation({
    mutationFn: (id: string) => repositories.habits.restore(id),
    onSuccess: () => {
      invalidate();
      toast.success('Habit restored');
    },
    onError: notifyError,
  });
}

export function useDeleteHabit() {
  const invalidate = useInvalidateHabits();

  return useMutation({
    mutationFn: (id: string) => repositories.habits.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success('Habit deleted');
    },
    onError: notifyError,
  });
}

export function useToggleHabitCheckIn() {
  const invalidate = useInvalidateHabits();

  return useMutation({
    mutationFn: async ({
      habitId,
      date,
      remove,
    }: {
      habitId: string;
      date: string;
      remove: boolean;
    }) => {
      if (remove) {
        await repositories.habits.removeCheckIn(habitId, date);
        return;
      }
      await repositories.habits.checkIn(habitId, date);
    },
    onSuccess: (_result, variables) => {
      invalidate();
      toast.success(variables.remove ? 'Check-in removed' : 'Checked in');
    },
    onError: notifyError,
  });
}
