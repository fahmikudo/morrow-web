import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Ellipsis, Plus, X } from 'lucide-react';
import {
  Button,
  Checkbox,
  Drawer,
  Dropdown,
  Label,
  ListBox,
  Select,
  ToggleButton,
  ToggleButtonGroup,
} from '@heroui/react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { RelativeTime } from '@/components/shared/RelativeTime';
import { RichTextContent } from '@/components/shared/rich-text/RichTextContent';
import { TaskTypeIcon } from '@/components/shared/TaskTypeIcon';
import { StatusTag } from '@/components/shared/tags';
import { TagInput } from '@/components/shared/TagInput';
import { AttachmentsPanel } from '@/features/attachments/AttachmentsPanel';
import { useProjects } from '@/features/projects/queries';
import { useIsDesktop } from '@/hooks/use-media-query';
import { dueLabel, isOverdue, taskTimeLabel } from '@/lib/date';
import { cn } from '@/lib/cn';
import { useUiStore } from '@/stores/ui-store';
import type { Project, Task, TaskPriority, TaskStatus, TaskType } from '@/types';
import { useDeleteTask, useTasks, useUpdateTask } from './queries';
import { TaskFormDialog } from './TaskFormDialog';

const TYPE_OPTIONS: Array<{ id: TaskType; label: string }> = [
  { id: 'task', label: 'Task' },
  { id: 'story', label: 'Story' },
  { id: 'bug', label: 'Bug' },
];

const STATUS_OPTIONS: Array<{ id: TaskStatus; label: string }> = [
  { id: 'todo', label: 'Todo' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS: Array<{ id: TaskPriority; label: string }> = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
];

export function TaskDetailPanel() {
  const isDesktop = useIsDesktop();
  const selectedTaskId = useUiStore((state) => state.selectedTaskId);
  const closeTaskPanel = useUiStore((state) => state.closeTaskPanel);
  const openTaskPanel = useUiStore((state) => state.openTaskPanel);

  const { data: tasks } = useTasks();
  const { data: projects } = useProjects();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubtaskOpen, setIsSubtaskOpen] = useState(false);

  const task = tasks?.find((entry) => entry.id === selectedTaskId) ?? null;

  useEffect(() => {
    if (selectedTaskId && tasks && !task) closeTaskPanel();
  }, [selectedTaskId, tasks, task, closeTaskPanel]);

  if (!task) return null;

  const project = projects?.find((entry) => entry.id === task.projectId);
  const parent = task.parentId ? tasks?.find((entry) => entry.id === task.parentId) : undefined;
  const children = (tasks ?? []).filter((entry) => entry.parentId === task.id);

  const body = (
    <TaskDetailBody
      task={task}
      project={project}
      parent={parent}
      subtasks={children}
      onClose={closeTaskPanel}
      onSelectTask={openTaskPanel}
      onEdit={() => setIsEditOpen(true)}
      onDelete={() => setIsDeleteOpen(true)}
      onTypeChange={(type) => updateTask.mutate({ id: task.id, patch: { type } })}
      onStatusChange={(status) => updateTask.mutate({ id: task.id, patch: { status } })}
      onPriorityChange={(priority) => updateTask.mutate({ id: task.id, patch: { priority } })}
      onLabelsChange={(labels) => updateTask.mutate({ id: task.id, patch: { labels } })}
      onToggleChild={(child, done) =>
        updateTask.mutate({ id: child.id, patch: { status: done ? 'done' : 'todo' } })
      }
      onAddSubtask={() => setIsSubtaskOpen(true)}
    />
  );

  return (
    <>
      {isDesktop ? (
        <aside
          role="region"
          aria-label="Task details"
          className="fixed top-14 right-0 bottom-0 z-20 hidden w-[400px] overflow-y-auto border-l border-border bg-surface p-5 lg:block"
        >
          {body}
        </aside>
      ) : (
        <Drawer.Backdrop
          isOpen
          onOpenChange={(open) => {
            if (!open) closeTaskPanel();
          }}
        >
          <Drawer.Content placement="bottom">
            <Drawer.Dialog className="max-h-[90dvh]">
              <Drawer.Handle />
              <Drawer.Body className="overflow-y-auto">{body}</Drawer.Body>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      )}

      <TaskFormDialog isOpen={isEditOpen} onOpenChange={setIsEditOpen} task={task} />

      <TaskFormDialog
        isOpen={isSubtaskOpen}
        onOpenChange={setIsSubtaskOpen}
        parentId={task.id}
        defaultProjectId={task.projectId}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete this task?"
        description={`“${task.title}” will be removed permanently. Its subtasks stay and become top-level tasks.`}
        confirmLabel="Delete task"
        isDanger
        isPending={deleteTask.isPending}
        onConfirm={() => {
          deleteTask.mutate(task.id);
          closeTaskPanel();
        }}
      />
    </>
  );
}

type TaskDetailBodyProps = {
  task: Task;
  project?: Project;
  parent?: Task;
  subtasks: Task[];
  onClose: () => void;
  onSelectTask: (id: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onTypeChange: (type: TaskType) => void;
  onStatusChange: (status: TaskStatus) => void;
  onPriorityChange: (priority: TaskPriority) => void;
  onLabelsChange: (labels: string[]) => void;
  onToggleChild: (child: Task, done: boolean) => void;
  onAddSubtask: () => void;
};

function TaskDetailBody({
  task,
  project,
  parent,
  subtasks,
  onClose,
  onSelectTask,
  onEdit,
  onDelete,
  onTypeChange,
  onStatusChange,
  onPriorityChange,
  onLabelsChange,
  onToggleChild,
  onAddSubtask,
}: TaskDetailBodyProps) {
  const overdue = isOverdue(task);
  const doneChildren = subtasks.filter((child) => child.status === 'done').length;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <TaskTypeIcon type={task.type} className="size-3.5" />
            <span className="font-mono">{task.key}</span>
            {parent ? <span>· subtask</span> : null}
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
            {task.title}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Dropdown>
            <Button isIconOnly size="sm" variant="ghost" aria-label="Task actions">
              <Ellipsis className="size-4" aria-hidden />
            </Button>
            <Dropdown.Popover placement="bottom end" className="min-w-40">
              <Dropdown.Menu
                onAction={(key) => {
                  if (key === 'edit') onEdit();
                  if (key === 'delete') onDelete();
                }}
              >
                <Dropdown.Item id="edit" textValue="Edit task">
                  <Label>Edit task</Label>
                </Dropdown.Item>
                <Dropdown.Item id="delete" textValue="Delete task" variant="danger">
                  <Label>Delete task</Label>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label="Close task details"
            onPress={onClose}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>
      </header>

      <ToggleButtonGroup
        aria-label="Status"
        size="sm"
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={new Set([task.status])}
        onSelectionChange={(keys) => {
          const next = [...keys][0];
          if (next) onStatusChange(next as TaskStatus);
        }}
        className="w-full"
      >
        {STATUS_OPTIONS.map((option, index) => (
          <ToggleButton key={option.id} id={option.id} className="flex-1">
            {index > 0 ? <ToggleButtonGroup.Separator /> : null}
            {option.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {parent ? (
        <p className="text-xs text-muted">
          Subtask of{' '}
          <button
            type="button"
            onClick={() => onSelectTask(parent.id)}
            className="font-medium text-accent hover:underline"
          >
            {parent.key} · {parent.title}
          </button>
        </p>
      ) : null}

      <div className="rounded-xl border border-border bg-surface-secondary/40 px-3 py-2.5 text-sm">
        {task.description ? (
          <RichTextContent html={task.description} />
        ) : (
          <p className="text-muted">No description</p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Select value={task.type} onChange={(value) => value && onTypeChange(value as TaskType)}>
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

        <Select
          value={task.priority}
          onChange={(value) => {
            if (value) onPriorityChange(value as TaskPriority);
          }}
        >
          <Label>Priority</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {PRIORITY_OPTIONS.map((option) => (
                <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
                  {option.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="section-label">Labels</p>
        <TagInput tags={task.labels} onChange={onLabelsChange} />
      </div>

      <AttachmentsPanel entityType="task" entityId={task.id} />

      {task.parentId ? null : (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="section-label">Subtasks</p>
            {subtasks.length > 0 ? (
              <span className="text-xs text-muted">
                {doneChildren} of {subtasks.length} done
              </span>
            ) : null}
          </div>

          {subtasks.map((child) => (
            <div
              key={child.id}
              className="flex items-center gap-2 rounded-lg border border-border bg-surface-secondary/40 px-2 py-1.5"
            >
              <Checkbox
                isSelected={child.status === 'done'}
                onChange={(selected) => onToggleChild(child, selected)}
              >
                <Checkbox.Content>
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <span className="sr-only">
                    {child.status === 'done'
                      ? `Mark ${child.title} as not done`
                      : `Mark ${child.title} as done`}
                  </span>
                </Checkbox.Content>
              </Checkbox>
              <span className="shrink-0 font-mono text-[11px] text-muted">{child.key}</span>
              <button
                type="button"
                onClick={() => onSelectTask(child.id)}
                className={cn(
                  'min-w-0 flex-1 truncate text-left text-sm',
                  child.status === 'done' ? 'text-muted line-through' : 'text-foreground',
                )}
              >
                {child.title}
              </button>
              <StatusTag status={child.status} />
            </div>
          ))}

          <Button size="sm" variant="secondary" className="self-start" onPress={onAddSubtask}>
            <Plus className="size-4" aria-hidden />
            Add subtask
          </Button>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <p className="section-label">Details</p>
        <dl className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between gap-4 px-3 py-2.5">
            <dt className="text-muted">Project</dt>
            <dd>
              {project ? (
                <Link to={`/projects/${project.id}`} className="font-medium text-accent hover:underline">
                  {project.key} · {project.name}
                </Link>
              ) : (
                <span className="text-foreground">No project</span>
              )}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 px-3 py-2.5">
            <dt className="text-muted">Due date</dt>
            <dd className={cn(overdue ? 'text-danger' : 'text-foreground')}>
              {task.dueDate ? dueLabel(task.dueDate) : 'No due date'}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 px-3 py-2.5">
            <dt className="text-muted">Time box</dt>
            <dd className="text-foreground">
              {taskTimeLabel(task.startTime, task.endTime) ?? 'Not time-boxed'}
            </dd>
          </div>
          {task.syncToPepy ? (
            <div className="flex items-center justify-between gap-4 px-3 py-2.5">
              <dt className="text-muted">Pepy</dt>
              <dd className="text-foreground">Sync enabled</dd>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-4 px-3 py-2.5">
            <dt className="text-muted">Created</dt>
            <dd className="text-foreground">
              <RelativeTime iso={task.createdAt} />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 px-3 py-2.5">
            <dt className="text-muted">Updated</dt>
            <dd className="text-foreground">
              <RelativeTime iso={task.updatedAt} />
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

