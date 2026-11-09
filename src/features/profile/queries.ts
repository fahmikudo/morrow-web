import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@heroui/react';
import { notifyError } from '@/lib/toast';
import { repositories } from '@/services';
import type { UpdateProfile } from '@/services';

export const profileKeys = {
  me: ['profile'] as const,
};

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: () => repositories.profile.get(),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: UpdateProfile) => repositories.profile.update(patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileKeys.me });
      toast.success('Profile updated');
    },
    onError: notifyError,
  });
}
