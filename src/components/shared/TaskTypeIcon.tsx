import { EntityIcon } from '@/components/shared/EntityIcon';
import type { TaskType } from '@/types';

export function TaskTypeIcon({ type, className }: { type: TaskType; className?: string }) {
  return <EntityIcon kind={type} className={className} />;
}
