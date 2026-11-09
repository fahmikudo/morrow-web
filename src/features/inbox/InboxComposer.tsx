import { useState } from 'react';
import { Button, Input, ListBox, Select, TextField } from '@heroui/react';
import type { InboxItemType } from '@/types';
import { useCreateInboxItem } from './queries';

const TYPE_OPTIONS: Array<{ id: InboxItemType; label: string }> = [
  { id: 'note', label: 'Note' },
  { id: 'task', label: 'Task' },
  { id: 'idea', label: 'Idea' },
];

export function InboxComposer() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<InboxItemType>('note');
  const [showDetails, setShowDetails] = useState(false);
  const createItem = useCreateInboxItem();

  const canSubmit = title.trim().length > 0 && !createItem.isPending;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      await createItem.mutateAsync({
        title: title.trim(),
        content: content.trim() ? content.trim() : undefined,
        type,
      });
      setTitle('');
      setContent('');
      setShowDetails(false);
    } catch {
      // The mutation hook already surfaced the error as a toast.
    }
  };

  return (
    <form onSubmit={handleSubmit} className="surface-card flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <TextField value={title} onChange={setTitle} className="flex-1">
          <Input placeholder="Capture a thought, task, or idea…" aria-label="Inbox item title" />
        </TextField>

        <div className="flex items-center gap-2">
          <Select
            value={type}
            onChange={(value) => setType((value as InboxItemType | null) ?? 'note')}
            aria-label="Inbox item type"
            className="w-32"
          >
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

          <Button type="submit" isDisabled={!canSubmit} isPending={createItem.isPending}>
            Add
          </Button>
        </div>
      </div>

      {showDetails ? (
        <TextField value={content} onChange={setContent}>
          <Input placeholder="Optional details" aria-label="Inbox item details" />
        </TextField>
      ) : (
        <button
          type="button"
          onClick={() => setShowDetails(true)}
          className="self-start text-xs text-muted underline-offset-2 hover:text-foreground hover:underline"
        >
          Add details
        </button>
      )}
    </form>
  );
}
