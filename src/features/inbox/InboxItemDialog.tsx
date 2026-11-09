import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  FieldError,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  TextArea,
  TextField,
} from '@heroui/react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useIsDesktop } from '@/hooks/use-media-query';
import type { InboxItem, InboxItemType } from '@/types';
import { useUpdateInboxItem } from './queries';

const editSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(140, 'Keep the title under 140 characters'),
  content: z.string().max(4000, 'Keep the details under 4000 characters').optional(),
  type: z.enum(['note', 'task', 'idea']),
});

type EditValues = z.infer<typeof editSchema>;

const TYPE_OPTIONS: Array<{ id: InboxItemType; label: string }> = [
  { id: 'note', label: 'Note' },
  { id: 'task', label: 'Task' },
  { id: 'idea', label: 'Idea' },
];

type InboxItemDialogProps = {
  item: InboxItem | null;
  onClose: () => void;
};

export function InboxItemDialog({ item, onClose }: InboxItemDialogProps) {
  const isDesktop = useIsDesktop();
  const updateItem = useUpdateInboxItem();
  const { control, handleSubmit, reset, formState } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { title: '', content: '', type: 'note' },
  });

  useEffect(() => {
    if (item) {
      reset({ title: item.title, content: item.content ?? '', type: item.type });
    }
  }, [item, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (!item) return;
    try {
      await updateItem.mutateAsync({
        id: item.id,
        patch: {
          title: values.title,
          content: values.content?.trim() ?? '',
          type: values.type,
        },
      });
      onClose();
    } catch {
      // The mutation hook already surfaced the error as a toast.
    }
  });

  return (
    <Modal.Backdrop isOpen={Boolean(item)} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <Modal.Container placement={isDesktop ? 'center' : 'bottom'} size="md">
        <Modal.Dialog className="sm:max-w-lg">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>Edit inbox item</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <form id="inbox-item-form" onSubmit={onSubmit} className="flex flex-col gap-4">
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
                    <Input placeholder="Item title" />
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
                    <Label>Details</Label>
                    <TextArea rows={4} placeholder="Add context, links, or thoughts." />
                    <FieldError>{formState.errors.content?.message}</FieldError>
                  </TextField>
                )}
              />

              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select
                    fullWidth
                    value={field.value}
                    onChange={(value) => field.onChange(value ?? 'note')}
                  >
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
            <Button variant="tertiary" onPress={onClose}>
              Cancel
            </Button>
            <Button type="submit" form="inbox-item-form" isPending={updateItem.isPending}>
              Save changes
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
