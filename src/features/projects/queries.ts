import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@heroui/react';
import { searchKeys } from '@/features/search/query-keys';
import { notifyError } from '@/lib/toast';
import { repositories } from '@/services';
import type { UpdateProject } from '@/services';
import type { NewProject, ProjectStatus } from '@/types';

export const projectKeys = {
  all: ['projects'] as const,
  detail: (id: string) => ['projects', id] as const,
};

function useInvalidateProjects() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    void queryClient.invalidateQueries({ queryKey: searchKeys.all });
  };
}

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: () => repositories.projects.list(),
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(id ?? ''),
    queryFn: () => repositories.projects.get(id ?? ''),
    enabled: Boolean(id),
  });
}

export function useCreateProject() {
  const invalidate = useInvalidateProjects();

  return useMutation({
    mutationFn: (input: NewProject) => repositories.projects.create(input),
    onSuccess: () => {
      invalidate();
      toast.success('Project created');
    },
    onError: notifyError,
  });
}

export function useUpdateProject() {
  const invalidate = useInvalidateProjects();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateProject }) =>
      repositories.projects.update(id, patch),
    onSuccess: () => {
      invalidate();
      toast.success('Project updated');
    },
    onError: notifyError,
  });
}

function useSetProjectStatus(status: ProjectStatus, successMessage: string) {
  const invalidate = useInvalidateProjects();

  return useMutation({
    mutationFn: (id: string) => repositories.projects.update(id, { status }),
    onSuccess: () => {
      invalidate();
      toast.success(successMessage);
    },
    onError: notifyError,
  });
}

export function useArchiveProject() {
  return useSetProjectStatus('archived', 'Project archived');
}

export function useReactivateProject() {
  return useSetProjectStatus('active', 'Project reactivated');
}
