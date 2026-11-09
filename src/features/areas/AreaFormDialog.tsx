import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, FieldError, Input, Label, ListBox, Modal, Select, TextArea, TextField } from '@heroui/react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { AreaIcon } from '@/components/shared/AreaIcon';
import { areaIconLabel } from '@/components/shared/area-icons';
import { useIsDesktop } from '@/hooks/use-media-query';
import type { Area, AreaIconName, AreaTone } from '@/types';
import { useCreateArea, useUpdateArea } from './queries';

const areaSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60, 'Keep the name under 60 characters'),
  description: z.string().max(200, 'Keep the description under 200 characters').optional(),
  tone: z.enum(['accent', 'success', 'warning', 'danger', 'neutral']),
  icon: z.enum(['briefcase', 'users', 'heart', 'user', 'book', 'home', 'sparkles']),
});

type AreaValues = z.infer<typeof areaSchema>;

const TONE_OPTIONS: Array<{ id: AreaTone; label: string }> = [
  { id: 'accent', label: 'Sky' },
  { id: 'success', label: 'Green' },
  { id: 'warning', label: 'Amber' },
  { id: 'danger', label: 'Red' },
  { id: 'neutral', label: 'Slate' },
];

const ICON_OPTIONS: AreaIconName[] = [
  'briefcase',
  'users',
  'heart',
  'user',
  'book',
  'home',
  'sparkles',
];

type AreaFormDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  area?: Area | null;
};

export function AreaFormDialog({ isOpen, onOpenChange, area }: AreaFormDialogProps) {
  const isDesktop = useIsDesktop();
  const createArea = useCreateArea();
  const updateArea = useUpdateArea();
  const isEditing = Boolean(area);

  const { control, handleSubmit, reset, formState } = useForm<AreaValues>({
    resolver: zodResolver(areaSchema),
    defaultValues: { name: '', description: '', tone: 'accent', icon: 'sparkles' },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      name: area?.name ?? '',
      description: area?.description ?? '',
      tone: area?.tone ?? 'accent',
      icon: area?.icon ?? 'sparkles',
    });
  }, [isOpen, area, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const description = values.description?.trim();

    try {
      if (area) {
        await updateArea.mutateAsync({
          id: area.id,
          patch: {
            name: values.name,
            description: description ?? '',
            tone: values.tone,
            icon: values.icon,
          },
        });
      } else {
        await createArea.mutateAsync({
          name: values.name,
          description: description || undefined,
          tone: values.tone,
          icon: values.icon,
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
            <Modal.Heading>{isEditing ? 'Edit area' : 'New area'}</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <form id="area-form" onSubmit={onSubmit} className="flex flex-col gap-4">
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
                    <Input autoFocus placeholder="Works, Family, Health…" />
                    <FieldError>{formState.errors.name?.message}</FieldError>
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
                    <TextArea rows={2} placeholder="What belongs in this area?" />
                    <FieldError>{formState.errors.description?.message}</FieldError>
                  </TextField>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  control={control}
                  name="tone"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onChange={(value) => field.onChange(value ?? 'accent')}
                    >
                      <Label>Colour</Label>
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {TONE_OPTIONS.map((option) => (
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
                  name="icon"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onChange={(value) => field.onChange(value ?? 'sparkles')}
                    >
                      <Label>Icon</Label>
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {ICON_OPTIONS.map((icon) => (
                            <ListBox.Item
                              key={icon}
                              id={icon}
                              textValue={areaIconLabel(icon)}
                            >
                              <span className="flex items-center gap-2">
                                <AreaIcon icon={icon} className="size-4" />
                                {areaIconLabel(icon)}
                              </span>
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  )}
                />
              </div>
            </form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="tertiary" onPress={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="area-form"
              isPending={createArea.isPending || updateArea.isPending}
            >
              {isEditing ? 'Save changes' : 'Create area'}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
