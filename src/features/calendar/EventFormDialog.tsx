import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, FieldError, Input, Label, ListBox, Modal, Select, TextArea, TextField } from '@heroui/react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DatePickerField } from '@/components/shared/DatePickerField';
import { TimePickerField } from '@/components/shared/TimePickerField';
import { useProjects } from '@/features/projects/queries';
import { useIsDesktop } from '@/hooks/use-media-query';
import { todayIso } from '@/lib/date';
import type { Event } from '@/types';
import { useCreateEvent, useDeleteEvent, useUpdateEvent } from './queries';

const eventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(120, 'Keep the title under 120 characters'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date'),
    startTime: z.string().regex(/^\d{2}:\d{2}$/).or(z.literal('')),
    endTime: z.string().regex(/^\d{2}:\d{2}$/).or(z.literal('')),
    notes: z.string().max(500, 'Keep the notes under 500 characters').optional(),
    projectId: z.string(),
  })
  .refine(
    (values) => !values.startTime || !values.endTime || values.endTime > values.startTime,
    { message: 'End time must be after the start time', path: ['endTime'] },
  );

type EventValues = z.infer<typeof eventSchema>;

type EventFormDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  event?: Event | null;
  defaultDate?: string;
};

export function EventFormDialog({ isOpen, onOpenChange, event, defaultDate }: EventFormDialogProps) {
  const isDesktop = useIsDesktop();
  const { data: projects } = useProjects();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const isEditing = Boolean(event);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { control, handleSubmit, reset, formState } = useForm<EventValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      date: defaultDate ?? todayIso(),
      startTime: '',
      endTime: '',
      notes: '',
      projectId: 'none',
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      title: event?.title ?? '',
      date: event?.date ?? defaultDate ?? todayIso(),
      startTime: event?.startTime ?? '',
      endTime: event?.endTime ?? '',
      notes: event?.notes ?? '',
      projectId: event?.projectId ?? 'none',
    });
  }, [isOpen, event, defaultDate, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const notes = values.notes?.trim();
    const projectId = values.projectId === 'none' ? null : values.projectId;

    try {
      if (event) {
        await updateEvent.mutateAsync({
          id: event.id,
          patch: {
            title: values.title,
            date: values.date,
            startTime: values.startTime || null,
            endTime: values.endTime || null,
            notes: notes ?? '',
            projectId,
          },
        });
      } else {
        await createEvent.mutateAsync({
          title: values.title,
          date: values.date,
          startTime: values.startTime || undefined,
          endTime: values.endTime || undefined,
          notes: notes || undefined,
          projectId: projectId ?? undefined,
        });
      }
      onOpenChange(false);
    } catch {
      // The mutation hook already surfaced the error as a toast.
    }
  });

  const isPending = createEvent.isPending || updateEvent.isPending;

  return (
    <>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
        <Modal.Container placement={isDesktop ? 'center' : 'bottom'} size="md">
          <Modal.Dialog className="sm:max-w-lg">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{isEditing ? 'Edit event' : 'New event'}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <form id="event-form" onSubmit={onSubmit} className="flex flex-col gap-4">
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
                      <Input autoFocus placeholder="What is happening?" />
                      <FieldError>{formState.errors.title?.message}</FieldError>
                    </TextField>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    control={control}
                    name="date"
                    render={({ field }) => (
                      <DatePickerField
                        label="Date"
                        value={field.value}
                        onChange={field.onChange}
                        calendarLabel="Choose the event date"
                        isInvalid={Boolean(formState.errors.date)}
                        error={formState.errors.date?.message}
                        clearable={false}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="projectId"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onChange={(value) => field.onChange(value ?? 'none')}
                      >
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

                  <Controller
                    control={control}
                    name="startTime"
                    render={({ field }) => (
                      <TimePickerField
                        label="Start time"
                        value={field.value}
                        onChange={field.onChange}
                        isInvalid={Boolean(formState.errors.startTime)}
                        error={formState.errors.startTime?.message}
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
                </div>

                <Controller
                  control={control}
                  name="notes"
                  render={({ field }) => (
                    <TextField
                      isInvalid={Boolean(formState.errors.notes)}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    >
                      <Label>Notes (optional)</Label>
                      <TextArea rows={3} placeholder="Agenda, links, or what to decide." />
                      <FieldError>{formState.errors.notes?.message}</FieldError>
                    </TextField>
                  )}
                />
              </form>
            </Modal.Body>
            <Modal.Footer className="justify-between">
              {isEditing ? (
                <Button
                  variant="ghost"
                  className="text-danger"
                  onPress={() => setIsDeleteOpen(true)}
                >
                  Delete event
                </Button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                <Button variant="tertiary" onPress={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" form="event-form" isPending={isPending}>
                  {isEditing ? 'Save changes' : 'Create event'}
                </Button>
              </div>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete this event?"
        description={`“${event?.title ?? ''}” will be removed from the calendar.`}
        confirmLabel="Delete event"
        isDanger
        isPending={deleteEvent.isPending}
        onConfirm={() => {
          if (!event) return;
          deleteEvent.mutate(event.id, { onSuccess: () => onOpenChange(false) });
        }}
      />
    </>
  );
}
