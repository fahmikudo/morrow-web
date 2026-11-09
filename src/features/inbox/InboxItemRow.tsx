import { Ellipsis } from 'lucide-react';
import { Button, Dropdown, Label } from '@heroui/react';
import { RelativeTime } from '@/components/shared/RelativeTime';
import { TypeTag } from '@/components/shared/tags';
import { excerpt } from '@/lib/text';
import type { InboxItem } from '@/types';

type InboxItemRowProps = {
  item: InboxItem;
  onEdit: (item: InboxItem) => void;
  onConvertToNote: (item: InboxItem) => void;
  onConvertToTask: (item: InboxItem) => void;
  onArchive: (item: InboxItem) => void;
  onRestore: (item: InboxItem) => void;
  onDelete: (item: InboxItem) => void;
  isArchived?: boolean;
};

export function InboxItemRow({
  item,
  onEdit,
  onConvertToNote,
  onConvertToTask,
  onArchive,
  onRestore,
  onDelete,
  isArchived = false,
}: InboxItemRowProps) {
  const preview = item.content ? excerpt(item.content, 100) : '';

  return (
    <div className="surface-card flex items-start gap-3">
      <div className="pt-0.5">
        <TypeTag type={item.type} />
      </div>

      <button
        type="button"
        onClick={() => onEdit(item)}
        className="min-w-0 flex-1 cursor-pointer text-left"
      >
        <span className="block truncate text-sm font-medium text-foreground">{item.title}</span>
        {preview ? <span className="mt-0.5 block truncate text-xs text-muted">{preview}</span> : null}
      </button>

      <RelativeTime iso={item.createdAt} className="shrink-0 text-xs text-muted" />

      <div className="flex shrink-0 items-center gap-1">
        {isArchived ? (
          <Button size="sm" variant="tertiary" onPress={() => onRestore(item)}>
            Restore
          </Button>
        ) : null}

        <Dropdown>
          <Button isIconOnly size="sm" variant="ghost" aria-label={`Actions for ${item.title}`}>
            <Ellipsis className="size-4" aria-hidden />
          </Button>
          <Dropdown.Popover placement="bottom end" className="min-w-48">
            <Dropdown.Menu
              onAction={(key) => {
                if (key === 'edit') onEdit(item);
                if (key === 'convert-note') onConvertToNote(item);
                if (key === 'convert-task') onConvertToTask(item);
                if (key === 'archive') onArchive(item);
                if (key === 'restore') onRestore(item);
                if (key === 'delete') onDelete(item);
              }}
            >
              {isArchived ? null : (
                <>
                  <Dropdown.Item id="edit" textValue="Edit">
                    <Label>Edit</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="convert-task" textValue="Convert to task">
                    <Label>Convert to task</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="convert-note" textValue="Convert to note">
                    <Label>Convert to note</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="archive" textValue="Archive">
                    <Label>Archive</Label>
                  </Dropdown.Item>
                </>
              )}
              <Dropdown.Item id="delete" textValue="Delete" variant="danger">
                <Label>Delete</Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
    </div>
  );
}
