import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, FieldError, Input, Label, ListBox, Modal, Select, TextField } from '@heroui/react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { RichTextEditor } from '@/components/shared/rich-text/RichTextEditor';
import { useIsDesktop } from '@/hooks/use-media-query';
import { cleanHtml, stripHtml } from '@/lib/text';
import type { Project, ProjectStatus } from '@/types';
import { useAreas } from '@/features/areas/queries';
import { useCreateProject, useUpdateProject } from './queries';

const projectSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Keep the name under 100 characters'),
  description: z
    .string()
    .optional()
    .refine(
      (value) => stripHtml(value ?? '').length <= 500,
      'Keep the description under 500 characters',
    ),
  status: z.enum(['active', 'completed', 'archived']),
  areaId: z.string(),
});

type ProjectValues = z.infer<typeof projectSchema>;

const STATUS_OPTIONS: Array<{ id: ProjectStatus; label: string }> = [
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'archived', label: 'Archived' },
];

type ProjectFormDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  project?: Project | null;
  defaultAreaId?: string;
};

export function ProjectFormDialog({
  isOpen,
  onOpenChange,
  project,
  defaultAreaId,
}: ProjectFormDialogProps) {
  const isDesktop = useIsDesktop();
  const { data: areas } = useAreas();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const isEditing = Boolean(project);

  const { control, handleSubmit, reset, formState } = useForm<ProjectValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: '', description: '', status: 'active', areaId: 'none' },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      name: project?.name ?? '',
      description: project?.description ?? '',
      status: project?.status ?? 'active',
      areaId: project?.areaId ?? defaultAreaId ?? 'none',
    });
  }, [isOpen, project, defaultAreaId, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const description = stripHtml(values.description ?? '').trim()
      ? cleanHtml(values.description ?? '')
      : '';
    const areaId = values.areaId === 'none' ? null : values.areaId;

    try {
      if (project) {
        await updateProject.mutateAsync({
          id: project.id,
          patch: { name: values.name, description, status: values.status, areaId },
        });
      } else {
        await createProject.mutateAsync({
          name: values.name,
          description: description || undefined,
          areaId: areaId ?? undefined,
        });
      }
      onOpenChange(false);
    } catch {
      // The mutation hook already surfaced the error as a toast.
    }
  });

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container placement={isDesktop ? 'center' : 'bottom'} size="md">
        <Modal.Dialog className="sm:max-w-lg">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>{isEditing ? 'Edit project' : 'New project'}</Modal.Heading>
            {project ? (
              <p className="text-xs text-muted">
                Key <span className="font-mono">{project.key}</span> is permanent
              </p>
            ) : null}
          </Modal.Header>
          <Modal.Body>
            <form id="project-form" onSubmit={onSubmit} className="flex flex-col gap-4">
              <Controller
                control={control}
                name="name"
                render={({ field }) => (
                  <TextField
                    isInvalid={Boolean(formState.errors.name)}
                    value={field.value}
                    onChange={field.onChange}
                  >
                    <Label>Name</Label>
                    <Input autoFocus placeholder="What is this project about?" />
                    <FieldError>{formState.errors.name?.message}</FieldError>
                  </TextField>
                )}
              />

              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-foreground">Description (optional)</span>
                    <RichTextEditor
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      label="Project description"
                    />
                    {formState.errors.description ? (
                      <p className="text-xs text-danger">{formState.errors.description.message}</p>
                    ) : null}
                  </div>
                )}
              />

              <Controller
                control={control}
                name="areaId"
                render={({ field }) => (
                  <Select
                    fullWidth
                    value={field.value}
                    onChange={(value) => field.onChange(value ?? 'none')}
                  >
                    <Label>Area</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        <ListBox.Item id="none" textValue="No area">
                          No area
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        {(areas ?? []).map((area) => (
                          <ListBox.Item key={area.id} id={area.id} textValue={area.name}>
                            {area.name}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                )}
              />

              {isEditing ? (
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select
                      fullWidth
                      value={field.value}
                      onChange={(value) => field.onChange(value ?? 'active')}
                    >
                      <Label>Status</Label>
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {STATUS_OPTIONS.map((option) => (
                            <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
                              {option.label}
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  )}
                />
              ) : null}
            </form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="tertiary" onPress={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="project-form"
              isPending={createProject.isPending || updateProject.isPending}
            >
              {isEditing ? 'Save changes' : 'Create project'}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
