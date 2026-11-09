import { AppTag, type AppTagVariant } from '@/components/shared/AppTag';
import type { InboxItemType, ProjectStatus, TaskPriority, TaskStatus } from '@/types';

const TYPE_MAP: Record<InboxItemType, { label: string; variant: AppTagVariant }> = {
  note: { label: 'Note', variant: 'neutral' },
  task: { label: 'Task', variant: 'accent' },
  idea: { label: 'Idea', variant: 'warning' },
};

const STATUS_MAP: Record<TaskStatus, { label: string; variant: AppTagVariant }> = {
  todo: { label: 'Todo', variant: 'neutral' },
  in_progress: { label: 'In progress', variant: 'accent' },
  done: { label: 'Done', variant: 'success' },
};

const PRIORITY_MAP: Record<TaskPriority, { label: string; variant: AppTagVariant }> = {
  low: { label: 'Low', variant: 'neutral' },
  medium: { label: 'Medium', variant: 'warning' },
  high: { label: 'High', variant: 'danger' },
};

const PROJECT_STATUS_MAP: Record<ProjectStatus, { label: string; variant: AppTagVariant }> = {
  active: { label: 'Active', variant: 'accent' },
  completed: { label: 'Completed', variant: 'success' },
  archived: { label: 'Archived', variant: 'neutral' },
};

export function TypeTag({ type }: { type: InboxItemType }) {
  const { label, variant } = TYPE_MAP[type];
  return <AppTag variant={variant}>{label}</AppTag>;
}

export function StatusTag({ status }: { status: TaskStatus }) {
  const { label, variant } = STATUS_MAP[status];
  return <AppTag variant={variant}>{label}</AppTag>;
}

export function PriorityTag({ priority }: { priority: TaskPriority }) {
  const { label, variant } = PRIORITY_MAP[priority];
  return <AppTag variant={variant}>{label}</AppTag>;
}

export function ProjectStatusTag({ status }: { status: ProjectStatus }) {
  const { label, variant } = PROJECT_STATUS_MAP[status];
  return <AppTag variant={variant}>{label}</AppTag>;
}
