import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Checkbox, FieldError, Input, Label, ListBox, Modal, Select, TextField } from '@heroui/react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { DatePickerField } from '@/components/shared/DatePickerField';
import { TimePickerField } from '@/components/shared/TimePickerField';
import { RichTextEditor } from '@/components/shared/rich-text/RichTextEditor';
import { useIsDesktop } from '@/hooks/use-media-query';
import { useAreas } from '@/features/areas/queries';
import { useProjects } from '@/features/projects/queries';
import { useSettings } from '@/features/settings/queries';
import { TagInput } from '@/components/shared/TagInput';
import { cleanHtml, stripHtml } from '@/lib/text';
import type { Task, TaskPriority, TaskStatus, TaskType } from '@/types';
import { useCreateTask, useUpdateTask } from './queries';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const taskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(140, 'Keep the title under 140 characters'),
    description: z
      .string()
      .optional()
      .refine(
        (value) => stripHtml(value ?? '').length <= 2000,
        'Keep the description under 2000 characters',
      ),
    type: z.enum(['task', 'story', 'bug']),
    status: z.enum(['todo', 'in_progress', 'done']),
    priority: z.enum(['low', 'medium', 'high']),
    labels: z.array(z.string()).max(10, 'Keep it to 10 labels'),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal('')),
    startTime: z.string().regex(TIME_PATTERN).or(z.literal('')),
    endTime: z.string().regex(TIME_PATTERN).or(z.literal('')),
    projectId: z.string(),
    areaId: z.string(),
    syncToPepy: z.boolean(),
  })
  .refine(
    (values) =>
      values.startTime === '' ||
      values.endTime === '' ||
      values.endTime > values.startTime,
    { message: 'End time must be after start time', path: ['endTime'] },
  )
  .refine(
    (values) =>
      !values.syncToPepy ||
      (values.dueDate !== '' && values.startTime !== '' && values.endTime !== ''),
    {
      message: 'Set a due date and start/end time before sending to Pepy',
      path: ['syncToPepy'],
    },
  );

type TaskValues = z.infer<typeof taskSchema>;

const TYPE_OPTIONS: Array<{ id: TaskType; label: string }> = [
  { id: 'task', label: 'Task' },
  { id: 'story', label: 'Story' },
  { id: 'bug', label: 'Bug' },
];

const STATUS_OPTIONS: Array<{ id: TaskStatus; label: string }> = [
  { id: 'todo', label: 'Todo' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS: Array<{ id: TaskPriority; label: string }> = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
];

type TaskFormDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  task?: Task | null;
  defaultProjectId?: string;
  defaultDueDate?: string;
  /** When set, the dialog creates a subtask of this task. */
  parentId?: string;
};

export function TaskFormDialog({
  isOpen,
  onOpenChange,
  task,
  defaultProjectId,
  defaultDueDate,
  parentId,
}: TaskFormDialogProps) {
  const isDesktop = useIsDesktop();
  const { data: projects } = useProjects();
  const { data: areas } = useAreas();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const { data: settings } = useSettings();
  const pepyEnabled = settings?.features?.['softwareseni-pepy'] ?? false;
  const isEditing = Boolean(task);

  const { control, handleSubmit, reset, formState } = useForm<TaskValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'task',
      status: 'todo',
      labels: [],
      priority: 'medium',
      dueDate: '',
      startTime: '',
      endTime: '',
      projectId: 'none',
      areaId: 'none',
      syncToPepy: false,
    },
  });

  const watchProject = useWatch({ control, name: 'projectId' });
  const watchDueDate = useWatch({ control, name: 'dueDate' });
  const watchStartTime = useWatch({ control, name: 'startTime' });
  const watchEndTime = useWatch({ control, name: 'endTime' });
  const timeboxComplete = Boolean(watchDueDate && watchStartTime && watchEndTime);

  useEffect(() => {
    if (!isOpen) return;
    reset({
      title: task?.title ?? '',
      description: task?.description ?? '',
      type: task?.type ?? 'task',
      status: task?.status ?? 'todo',
      labels: task?.labels ?? [],
      priority: task?.priority ?? 'medium',
      dueDate: task?.dueDate ?? defaultDueDate ?? '',
      startTime: task?.startTime ?? '',
      endTime: task?.endTime ?? '',
      projectId: task?.projectId ?? defaultProjectId ?? 'none',
      areaId: task?.areaId ?? 'none',
      syncToPepy: task?.syncToPepy ?? false,
    });
  }, [isOpen, task, defaultProjectId, defaultDueDate, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const projectId = values.projectId === 'none' ? null : values.projectId;
    const areaId =
      values.projectId === 'none' && values.areaId !== 'none' ? values.areaId : null;
    const description = stripHtml(values.description ?? '').trim()
      ? cleanHtml(values.description ?? '')
      : '';

    try {
      if (task) {
        await updateTask.mutateAsync({
          id: task.id,
          patch: {
            title: values.title,
            description,
            type: values.type,
            status: values.status,
            priority: values.priority,
            labels: values.labels,
            dueDate: values.dueDate === '' ? null : values.dueDate,
            startTime: values.startTime === '' ? null : values.startTime,
            endTime: values.endTime === '' ? null : values.endTime,
            projectId,
            areaId,
            ...(pepyEnabled ? { syncToPepy: values.syncToPepy } : {}),
          },
        });
      } else {
        await createTask.mutateAsync({
          title: values.title,
          description: description || undefined,
          type: values.type,
          status: values.status,
          priority: values.priority,
          labels: values.labels,
          dueDate: values.dueDate === '' ? undefined : values.dueDate,
          startTime: values.startTime === '' ? undefined : values.startTime,
          endTime: values.endTime === '' ? undefined : values.endTime,
          projectId: projectId ?? undefined,
          areaId: areaId ?? undefined,
          parentId,
          ...(pepyEnabled ? { syncToPepy: values.syncToPepy } : {}),
        });
      }
      onOpenChange(false);
    } catch {
      // The mutation hook already surfaced the error as a toast.
    }
  });

  const isPending = createTask.isPending || updateTask.isPending;

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container placement={isDesktop ? 'center' : 'bottom'} size="lg">
        <Modal.Dialog className="sm:max-w-xl">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>
              {isEditing ? 'Edit task' : parentId ? 'New subtask' : 'New task'}
            </Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <form id="task-form" onSubmit={onSubmit} className="flex flex-col gap-4">
              <Controller
                control={control}
                name="title"
                render={({ field }) => (
                  <TextField
                    isInvalid={Boolean(formState.errors.title)}
                    value={field.value}
                    onChange={field.onChange}
                  >
                    <Label>Title</Label>
                    <Input autoFocus placeholder="What needs to happen?" />
                    <FieldError>{formState.errors.title?.message}</FieldError>
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
                      label="Task description"
                    />
                    {formState.errors.description ? (
                      <p className="text-xs text-danger">{formState.errors.description.message}</p>
                    ) : null}
                  </div>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onChange={(value) => field.onChange(value ?? 'task')}>
                      <Label>Type</Label>
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {TYPE_OPTIONS.map((option) => (
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

                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onChange={(value) => field.onChange(value ?? 'todo')}>
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

                <Controller
                  control={control}
                  name="priority"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onChange={(value) => field.onChange(value ?? 'medium')}
                    >
                      <Label>Priority</Label>
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {PRIORITY_OPTIONS.map((option) => (
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

                <Controller
                  control={control}
                  name="dueDate"
                  render={({ field }) => (
                    <DatePickerField
                      label="Due date"
                      value={field.value}
                      onChange={field.onChange}
                      calendarLabel="Choose a due date"
                      isInvalid={Boolean(formState.errors.dueDate)}
                      error="Enter a valid due date"
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="startTime"
                  render={({ field }) => (
                    <TimePickerField
                      label="Start time"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="endTime"
                  render={({ field }) => (
                    <TimePickerField
                      label="End time"
                      value={field.value}
                      onChange={field.onChange}
                      isInvalid={Boolean(formState.errors.endTime)}
                      error={formState.errors.endTime?.message}
                    />
                  )}
                />

                {watchProject === 'none' ? (
                  <Controller
                    control={control}
                    name="areaId"
                    render={({ field }) => (
                      <Select
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
                ) : null}

                {parentId ? (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-foreground">Project</span>
                    <p className="text-sm text-muted">
                      Inherits the parent task&apos;s project.
                    </p>
                  </div>
                ) : (
                <Controller
                  control={control}
                  name="projectId"
                  render={({ field }) => (
                    <Select value={field.value} onChange={(value) => field.onChange(value ?? 'none')}>
                      <Label>Project</Label>
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          <ListBox.Item id="none" textValue="No project">
                            No project
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                          {(projects ?? []).map((project) => (
                            <ListBox.Item
                              key={project.id}
                              id={project.id}
                              textValue={project.name}
                            >
                              {project.name}
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  )}
                />
                )}
              </div>

              <Controller
                control={control}
                name="labels"
                render={({ field }) => (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-foreground">Labels (optional)</span>
                    <TagInput tags={field.value} onChange={field.onChange} />
                    {formState.errors.labels ? (
                      <p className="text-xs text-danger">{formState.errors.labels.message}</p>
                    ) : null}
                  </div>
                )}
              />

              {pepyEnabled ? (
                <Controller
                  control={control}
                  name="syncToPepy"
                  render={({ field }) => (
                    <div className="flex flex-col gap-1 border-t border-border pt-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">Send to Pepy</p>
                          <p className="text-xs text-muted">
                            Sync this time-boxed task to SoftwareSeni Pepy. Tasks without a due
                            date and start/end time cannot be sent.
                          </p>
                        </div>
                        <Checkbox
                          isSelected={field.value}
                          isDisabled={!timeboxComplete}
                          onChange={field.onChange}
                        >
                          <Checkbox.Content>
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <span className="sr-only">Send to Pepy</span>
                          </Checkbox.Content>
                        </Checkbox>
                      </div>
                      {!timeboxComplete ? (
                        <p className="text-[11px] text-muted">
                          Fill the due date, start time, and end time first.
                        </p>
                      ) : null}
                      {formState.errors.syncToPepy ? (
                        <p className="text-xs text-danger">
                          {formState.errors.syncToPepy.message}
                        </p>
                      ) : null}
                    </div>
                  )}
                />
              ) : null}
            </form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="tertiary" onPress={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" form="task-form" isPending={isPending}>
              {isEditing ? 'Save changes' : parentId ? 'Create subtask' : 'Create task'}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
