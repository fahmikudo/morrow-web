import { Ellipsis } from 'lucide-react';
import { Button, Checkbox, Dropdown, Label } from '@heroui/react';
import { AppTag } from '@/components/shared/AppTag';
import { AreaBadge } from '@/components/shared/AreaBadge';
import { TaskTypeIcon } from '@/components/shared/TaskTypeIcon';
import { PriorityTag, StatusTag } from '@/components/shared/tags';
import { dueLabel, isOverdue, taskTimeLabel } from '@/lib/date';
import { cn } from '@/lib/cn';
import { useUiStore } from '@/stores/ui-store';
import type { Area, Task } from '@/types';
import { useUpdateTask } from './queries';

type TaskRowProps = {
  task: Task;
  projectName?: string;
  area?: Area;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
};

export function TaskRow({ task, projectName, area, onEdit, onDelete }: TaskRowProps) {
  const openTaskPanel = useUiStore((state) => state.openTaskPanel);
  const updateTask = useUpdateTask();
  const isDone = task.status === 'done';
  const overdue = isOverdue(task);
  const isSubtask = Boolean(task.parentId);
  const timeLabel = taskTimeLabel(task.startTime, task.endTime);

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-border bg-surface p-3',
        isSubtask && 'ml-6 border-l-2 border-l-border',
      )}
    >
      <div className="pt-0.5">
        <Checkbox
          isSelected={isDone}
          onChange={(selected) =>
            updateTask.mutate({
              id: task.id,
              patch: { status: selected ? 'done' : 'todo' },
            })
          }
        >
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <span className="sr-only">
              {isDone ? `Mark ${task.title} as not done` : `Mark ${task.title} as done`}
            </span>
          </Checkbox.Content>
        </Checkbox>
      </div>

      <button
        type="button"
        onClick={() => openTaskPanel(task.id)}
        className="min-w-0 flex-1 cursor-pointer text-left"
      >
        <span className="flex min-w-0 items-center gap-2">
          <TaskTypeIcon type={task.type} />
          <span className="shrink-0 font-mono text-[11px] text-muted">{task.key}</span>
          <span
            className={cn(
              'truncate text-sm font-medium',
              isDone ? 'text-muted line-through' : 'text-foreground',
            )}
          >
            {task.title}
          </span>
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5">
          <StatusTag status={task.status} />
          <PriorityTag priority={task.priority} />
          {task.labels.slice(0, 2).map((label) => (
            <AppTag key={label}>{label}</AppTag>
          ))}
          {task.labels.length > 2 ? <AppTag>+{task.labels.length - 2}</AppTag> : null}
          {projectName ? (
            <AppTag variant="accent">{projectName}</AppTag>
          ) : area ? (
            <AreaBadge area={area} />
          ) : null}
          {task.syncToPepy ? <AppTag variant="accent">Pepy</AppTag> : null}
          {task.dueDate ? (
            <span className={cn('text-xs', overdue ? 'text-danger' : 'text-muted')}>
              {dueLabel(task.dueDate)}
            </span>
          ) : null}
          {timeLabel ? <span className="text-xs text-muted">{timeLabel}</span> : null}
        </span>
      </button>

      {onEdit || onDelete ? (
        <Dropdown>
          <Button isIconOnly size="sm" variant="ghost" aria-label={`Actions for ${task.title}`}>
            <Ellipsis className="size-4" aria-hidden />
          </Button>
          <Dropdown.Popover placement="bottom end" className="min-w-44">
            <Dropdown.Menu
              onAction={(key) => {
                if (key === 'edit') onEdit?.(task);
                if (key === 'delete') onDelete?.(task);
              }}
            >
              {onEdit ? (
                <Dropdown.Item id="edit" textValue="Edit task">
                  <Label>Edit task</Label>
                </Dropdown.Item>
              ) : null}
              {onDelete ? (
                <Dropdown.Item id="delete" textValue="Delete task" variant="danger">
                  <Label>Delete task</Label>
                </Dropdown.Item>
              ) : null}
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      ) : null}
    </div>
  );
}
