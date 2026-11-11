import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Checkbox,
  FieldError,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Switch,
  TextArea,
  TextField,
} from '@heroui/react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useAreas } from '@/features/areas/queries';
import { DatePickerField } from '@/components/shared/DatePickerField';
import { TimePickerField } from '@/components/shared/TimePickerField';
import { useProjects } from '@/features/projects/queries';
import { useIsDesktop } from '@/hooks/use-media-query';
import { cn } from '@/lib/cn';
import { todayIso } from '@/lib/date';
import type { Habit, HabitCadence } from '@/types';
import { useCreateHabit, useUpdateHabit } from './queries';

const WEEKDAY_OPTIONS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

const habitSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(120, 'Keep the title under 120 characters'),
    description: z.string().max(300, 'Keep the description under 300 characters').optional(),
    cadence: z.enum(['daily', 'weekly', 'monthly']),
    startTime: z.string().regex(/^\d{2}:\d{2}$/).or(z.literal('')),
    endTime: z.string().regex(/^\d{2}:\d{2}$/).or(z.literal('')),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal('')),
    remindMe: z.boolean(),
    reminderLead: z
      .string()
      .refine(
        (value) =>
          value === 'inherit' || (/^\d+$/.test(value) && Number(value) <= 1440),
        'Pick a valid reminder time',
      ),
    target: z
      .string()
      .trim()
      .regex(/^\d+$/, 'Use a whole number')
      .refine((value) => Number(value) >= 1, 'At least once')
      .refine((value) => Number(value) <= 30, 'Keep it under 30'),
    fixed: z.boolean(),
    weekdays: z.array(z.number().int().min(0).max(6)),
    projectId: z.string(),
    areaId: z.string(),
  })
  .refine((values) => !values.fixed || values.weekdays.length > 0, {
    message: 'Pick at least one day',
    path: ['weekdays'],
  })
  .refine(
    (values) => !values.startTime || !values.endTime || values.endTime > values.startTime,
    { message: 'End time must be after the start time', path: ['endTime'] },
  )
  .refine((values) => !values.endDate || values.endDate >= values.startDate, {
    message: 'End date must be on or after the start date',
    path: ['endDate'],
  });

type HabitValues = z.infer<typeof habitSchema>;

const PRESET_LEAD_IDS: Record<string, true> = {
  inherit: true,
  '5': true,
  '10': true,
  '15': true,
  '30': true,
  '60': true,
};

const REMINDER_LEAD_OPTIONS: Array<{ id: string; label: string }> = [
  { id: 'inherit', label: 'At start' },
  { id: '5', label: '5 minutes before' },
  { id: '10', label: '10 minutes before' },
  { id: '15', label: '15 minutes before' },
  { id: '30', label: '30 minutes before' },
  { id: '60', label: '60 minutes before' },
];

const CADENCE_OPTIONS: Array<{ id: HabitCadence; label: string }> = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

type HabitFormDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  habit?: Habit | null;
  defaultAreaId?: string;
  defaultProjectId?: string;
};

export function HabitFormDialog({
  isOpen,
  onOpenChange,
  habit,
  defaultAreaId,
  defaultProjectId,
}: HabitFormDialogProps) {
  const isDesktop = useIsDesktop();
  const { data: projects } = useProjects();
  const { data: areas } = useAreas();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const isEditing = Boolean(habit);

  const { control, handleSubmit, reset, formState } = useForm<HabitValues>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      title: '',
      description: '',
      cadence: 'weekly',
      target: '3',
      fixed: false,
      weekdays: [],
      projectId: 'none',
      areaId: 'none',
      startDate: todayIso(),
      endDate: '',
      remindMe: true,
      reminderLead: 'inherit',
    },
  });

  const watchProject = useWatch({ control, name: 'projectId' });
  const watchFixed = useWatch({ control, name: 'fixed' });
  const watchWeekdays = useWatch({ control, name: 'weekdays' });
  const watchRemindMe = useWatch({ control, name: 'remindMe' });
  const watchStartTime = useWatch({ control, name: 'startTime' });
  const watchStartDate = useWatch({ control, name: 'startDate' });

  const storedLead = habit?.reminderLeadMinutes || undefined;
  const reminderLeadOptions =
    storedLead != null && !Object.hasOwn(PRESET_LEAD_IDS, String(storedLead))
      ? [
          ...REMINDER_LEAD_OPTIONS,
          { id: String(storedLead), label: `${storedLead} minutes before` },
        ]
      : REMINDER_LEAD_OPTIONS;

  useEffect(() => {
    if (!isOpen) return;
    const schedule = habit?.schedule;
    reset({
      title: habit?.title ?? '',
      description: habit?.description ?? '',
      cadence: habit?.cadence ?? 'weekly',
      target: String(habit?.target ?? 3),
      fixed: schedule?.kind === 'fixed',
      weekdays: schedule?.kind === 'fixed' ? schedule.weekdays : [],
      startTime: habit?.startTime ?? '',
      endTime: habit?.endTime ?? '',
      startDate: habit?.startDate ?? todayIso(),
      endDate: habit?.endDate ?? '',
      remindMe: habit?.reminderEnabled !== false,
      reminderLead: habit?.reminderLeadMinutes
        ? String(habit.reminderLeadMinutes)
        : 'inherit',
      projectId: habit?.projectId ?? defaultProjectId ?? 'none',
      areaId: habit?.areaId ?? defaultAreaId ?? 'none',
    });
  }, [isOpen, habit, defaultAreaId, defaultProjectId, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const projectId = values.projectId === 'none' ? null : values.projectId;
    const areaId =
      values.projectId === 'none' && values.areaId !== 'none' ? values.areaId : null;
    const schedule = values.fixed
      ? { kind: 'fixed' as const, weekdays: [...values.weekdays].sort((a, b) => a - b) }
      : { kind: 'flexible' as const };
    const reminderLead =
      values.reminderLead === 'inherit' ? null : Number(values.reminderLead);

    try {
      if (habit) {
        await updateHabit.mutateAsync({
          id: habit.id,
          patch: {
            title: values.title,
            description: values.description?.trim() ?? '',
            cadence: values.cadence,
            target: Number(values.target),
            schedule,
            startTime: values.startTime || null,
            endTime: values.endTime || null,
            endDate: values.endDate || null,
            reminderEnabled: values.remindMe ? null : false,
            reminderLeadMinutes: reminderLead,
            projectId,
            areaId,
          },
        });
      } else {
        await createHabit.mutateAsync({
          title: values.title,
          startDate: values.startDate,
          endDate: values.endDate || undefined,
          description: values.description?.trim() || undefined,
          cadence: values.cadence,
          target: Number(values.target),
          schedule,
          startTime: values.startTime || undefined,
          endTime: values.endTime || undefined,
          reminderEnabled: values.remindMe ? undefined : false,
          reminderLeadMinutes: reminderLead ?? undefined,
          projectId: projectId ?? undefined,
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
            <Modal.Heading>{isEditing ? 'Edit habit' : 'New habit'}</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <form id="habit-form" onSubmit={onSubmit} className="flex flex-col gap-4">
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
                    <Input autoFocus placeholder="Run 4× a week, meditate, read…" />
                    <FieldError>{formState.errors.title?.message}</FieldError>
                  </TextField>
                )}
              />

              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <TextField
                    isInvalid={Boolean(formState.errors.description)}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                  >
                    <Label>Description (optional)</Label>
                    <TextArea rows={2} placeholder="What counts as a completion?" />
                    <FieldError>{formState.errors.description?.message}</FieldError>
                  </TextField>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  control={control}
                  name="cadence"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onChange={(value) => field.onChange(value ?? 'weekly')}
                    >
                      <Label>Cadence</Label>
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {CADENCE_OPTIONS.map((option) => (
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
                  name="target"
                  render={({ field }) => (
                    <TextField
                      isInvalid={Boolean(formState.errors.target)}
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <Label>Times per period</Label>
                      <Input type="number" min={1} max={30} placeholder="4" />
                      <FieldError>{formState.errors.target?.message}</FieldError>
                    </TextField>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  control={control}
                  name="startTime"
                  render={({ field }) => (
                    <TimePickerField
                      label="Start time (optional)"
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
                      label="End time (optional)"
                      value={field.value}
                      onChange={field.onChange}
                      isInvalid={Boolean(formState.errors.endTime)}
                      error={formState.errors.endTime?.message}
                    />
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  control={control}
                  name="endDate"
                  render={({ field }) => (
                    <DatePickerField
                      label="End date (optional)"
                      value={field.value}
                      onChange={field.onChange}
                      minValue={watchStartDate}
                      calendarLabel="Choose the habit end date"
                      isInvalid={Boolean(formState.errors.endDate)}
                      error={formState.errors.endDate?.message}
                    />
                  )}
                />
                <p className="self-end pb-2 text-xs text-muted">
                  Counts from {watchStartDate} through this date. Leave empty to keep it
                  ongoing.
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded-xl border border-border p-3">
                <Controller
                  control={control}
                  name="remindMe"
                  render={({ field }) => (
                    <Switch isSelected={field.value} onChange={field.onChange}>
                      <Switch.Content>
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        Remind me
                      </Switch.Content>
                    </Switch>
                  )}
                />

                {watchRemindMe ? (
                  <Controller
                    control={control}
                    name="reminderLead"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onChange={(value) => field.onChange(value ?? 'inherit')}
                        isDisabled={!watchStartTime}
                      >
                        <Label>Reminder time</Label>
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {reminderLeadOptions.map((option) => (
                              <ListBox.Item
                                key={option.id}
                                id={option.id}
                                textValue={option.label}
                              >
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

                <p className="text-xs text-muted">
                  {watchStartTime
                    ? 'Counts back from the start time. Defaults follow Settings → Notifications.'
                    : 'Set a start time to receive this reminder.'}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Controller
                  control={control}
                  name="fixed"
                  render={({ field }) => (
                    <Checkbox isSelected={field.value} onChange={field.onChange}>
                      <Checkbox.Content>
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        Scheduled days (optional)
                      </Checkbox.Content>
                    </Checkbox>
                  )}
                />

                {watchFixed ? (
                  <Controller
                    control={control}
                    name="weekdays"
                    render={({ field }) => (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex flex-wrap gap-1.5">
                          {WEEKDAY_OPTIONS.map((option) => {
                            const active = field.value.includes(option.value);
                            return (
                              <Button
                                key={option.value}
                                size="sm"
                                variant={active ? 'secondary' : 'ghost'}
                                aria-pressed={active}
                                aria-label={option.label}
                                className={cn('h-8 w-11 text-xs', !active && 'text-muted')}
                                onPress={() =>
                                  field.onChange(
                                    active
                                      ? field.value.filter((day) => day !== option.value)
                                      : [...field.value, option.value],
                                  )
                                }
                              >
                                {option.label}
                              </Button>
                            );
                          })}
                        </div>
                        {formState.errors.weekdays ? (
                          <span className="text-xs text-danger">
                            {formState.errors.weekdays.message}
                          </span>
                        ) : watchWeekdays.length === 0 ? (
                          <span className="text-xs text-muted">
                            Pick the days this habit usually happens.
                          </span>
                        ) : null}
                      </div>
                    )}
                  />
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
                            <ListBox.Item key={project.id} id={project.id} textValue={project.name}>
                              {project.name}
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
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
              </div>
            </form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="tertiary" onPress={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="habit-form"
              isPending={createHabit.isPending || updateHabit.isPending}
            >
              {isEditing ? 'Save changes' : 'Create habit'}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
