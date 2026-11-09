import { useState } from 'react';
import { Inbox as InboxIcon } from 'lucide-react';
import { Button, Tabs } from '@heroui/react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { PageHeader } from '@/components/shared/PageHeader';
import { SkeletonList } from '@/components/shared/SkeletonList';
import { useUiStore } from '@/stores/ui-store';
import type { InboxItem } from '@/types';
import { InboxComposer } from './InboxComposer';
import { InboxItemDialog } from './InboxItemDialog';
import { InboxItemRow } from './InboxItemRow';
import {
  useArchiveInboxItem,
  useArchivedInboxItems,
  useConvertInboxItem,
  useDeleteInboxItem,
  useInboxItems,
  useRestoreInboxItem,
} from './queries';

type InboxTab = 'active' | 'archived';

const byNewest = (a: InboxItem, b: InboxItem) => b.createdAt.localeCompare(a.createdAt);

export function InboxPage() {
  const [tab, setTab] = useState<InboxTab>('active');
  const [editingItem, setEditingItem] = useState<InboxItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<InboxItem | null>(null);

  const openQuickCapture = useUiStore((state) => state.openQuickCapture);
  const activeQuery = useInboxItems();
  const archivedQuery = useArchivedInboxItems();
  const archiveItem = useArchiveInboxItem();
  const restoreItem = useRestoreInboxItem();
  const deleteItem = useDeleteInboxItem();
  const convertItem = useConvertInboxItem();

  const activeItems = [...(activeQuery.data ?? [])].sort(byNewest);
  const archivedItems = [...(archivedQuery.data ?? [])].sort(byNewest);

  const handleDelete = () => {
    if (!pendingDelete) return;
    deleteItem.mutate(pendingDelete.id);
  };

  return (
    <>
      <PageHeader
        title="Inbox"
        description="Everything you captured, before it finds a home."
        actions={
          <Button onPress={() => openQuickCapture()}>
            <InboxIcon className="size-4" aria-hidden />
            Capture
          </Button>
        }
      />

      <Tabs selectedKey={tab} onSelectionChange={(key) => setTab(key as InboxTab)}>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Inbox views">
            <Tabs.Tab id="active">
              Active
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="archived">
              Archived
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="active" className="flex flex-col gap-4 pt-5">
          <InboxComposer />

          {activeQuery.isPending ? <SkeletonList rows={4} /> : null}

          {activeQuery.isError ? (
            <ErrorState onRetry={() => void activeQuery.refetch()} />
          ) : null}

          {activeQuery.isSuccess && activeItems.length === 0 ? (
            <EmptyState
              icon={InboxIcon}
              title="Inbox is clear"
              description="Nothing waiting for a home. Capture the next thought before it disappears."
              action={<Button onPress={() => openQuickCapture()}>Capture something</Button>}
            />
          ) : null}

          {activeItems.length > 0 ? (
            <div className="flex flex-col gap-2">
              {activeItems.map((item) => (
                <InboxItemRow
                  key={item.id}
                  item={item}
                  onEdit={setEditingItem}
                  onConvertToNote={(entry) => convertItem.mutate({ id: entry.id, target: 'note' })}
                  onConvertToTask={(entry) => convertItem.mutate({ id: entry.id, target: 'task' })}
                  onArchive={(entry) => archiveItem.mutate(entry.id)}
                  onRestore={(entry) => restoreItem.mutate(entry.id)}
                  onDelete={setPendingDelete}
                />
              ))}
            </div>
          ) : null}
        </Tabs.Panel>

        <Tabs.Panel id="archived" className="flex flex-col gap-4 pt-5">
          {archivedQuery.isPending ? <SkeletonList rows={3} /> : null}

          {archivedQuery.isError ? (
            <ErrorState onRetry={() => void archivedQuery.refetch()} />
          ) : null}

          {archivedQuery.isSuccess && archivedItems.length === 0 ? (
            <EmptyState
              icon={InboxIcon}
              title="Nothing archived"
              description="Archived items stay here so the active inbox stays focused."
            />
          ) : null}

          {archivedItems.length > 0 ? (
            <div className="flex flex-col gap-2">
              {archivedItems.map((item) => (
                <InboxItemRow
                  key={item.id}
                  item={item}
                  isArchived
                  onEdit={setEditingItem}
                  onConvertToNote={(entry) => convertItem.mutate({ id: entry.id, target: 'note' })}
                  onConvertToTask={(entry) => convertItem.mutate({ id: entry.id, target: 'task' })}
                  onArchive={(entry) => archiveItem.mutate(entry.id)}
                  onRestore={(entry) => restoreItem.mutate(entry.id)}
                  onDelete={setPendingDelete}
                />
              ))}
            </div>
          ) : null}
        </Tabs.Panel>
      </Tabs>

      <InboxItemDialog item={editingItem} onClose={() => setEditingItem(null)} />

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete this item?"
        description={`“${pendingDelete?.title ?? ''}” will be removed permanently. Archiving keeps it instead.`}
        confirmLabel="Delete item"
        isDanger
        isPending={deleteItem.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
