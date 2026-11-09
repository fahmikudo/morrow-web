import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, FieldError, Input, Label, ListBox, Modal, Select, TextArea, TextField } from '@heroui/react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useIsDesktop } from '@/hooks/use-media-query';
import { useUiStore } from '@/stores/ui-store';
import { useCreateInboxItem } from './queries';

const captureSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(140, 'Keep the title under 140 characters'),
  content: z.string().max(4000, 'Keep the details under 4000 characters').optional(),
  type: z.enum(['note', 'task', 'idea']),
});

type CaptureValues = z.infer<typeof captureSchema>;

const TYPE_OPTIONS = [
  { id: 'note', label: 'Note' },
  { id: 'task', label: 'Task' },
  { id: 'idea', label: 'Idea' },
];

export function QuickCaptureDialog() {
  const isDesktop = useIsDesktop();
  const isOpen = useUiStore((state) => state.isQuickCaptureOpen);
  const quickCaptureType = useUiStore((state) => state.quickCaptureType);
  const closeQuickCapture = useUiStore((state) => state.closeQuickCapture);
  const createItem = useCreateInboxItem();

  const { control, handleSubmit, reset, formState } = useForm<CaptureValues>({
    resolver: zodResolver(captureSchema),
    defaultValues: { title: '', content: '', type: quickCaptureType },
  });

  useEffect(() => {
    if (isOpen) reset({ title: '', content: '', type: quickCaptureType });
  }, [isOpen, quickCaptureType, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createItem.mutateAsync({
        title: values.title,
        content: values.content?.trim() ? values.content.trim() : undefined,
        type: values.type,
      });
      reset({ title: '', content: '', type: quickCaptureType });
      closeQuickCapture();
    } catch {
      // The mutation hook already surfaced the error as a toast.
    }
  });

  return (
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) closeQuickCapture();
      }}
    >
      <Modal.Container placement={isDesktop ? 'center' : 'bottom'} size="md">
        <Modal.Dialog className="sm:max-w-lg">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>Quick capture</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <form id="quick-capture-form" onSubmit={onSubmit} className="flex flex-col gap-4">
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
                    <Input autoFocus placeholder="What did you capture?" />
                    <FieldError>{formState.errors.title?.message}</FieldError>
                  </TextField>
                )}
              />

              <Controller
                control={control}
                name="content"
                render={({ field }) => (
                  <TextField
                    isInvalid={Boolean(formState.errors.content)}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                  >
                    <Label>Details (optional)</Label>
                    <TextArea rows={3} placeholder="Add context you want to keep." />
                    <FieldError>{formState.errors.content?.message}</FieldError>
                  </TextField>
                )}
              />

              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select fullWidth value={field.value} onChange={(value) => field.onChange(value ?? 'note')}>
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
            </form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="tertiary" onPress={closeQuickCapture}>
              Cancel
            </Button>
            <Button type="submit" form="quick-capture-form" isPending={createItem.isPending}>
              Capture
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
