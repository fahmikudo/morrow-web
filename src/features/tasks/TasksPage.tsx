import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { FolderKanban, ListTodo, Plus, SlidersHorizontal } from 'lucide-react';
import { Badge, Button, Label, ListBox, SearchField, Select, Sheet, Tabs } from '@heroui/react';
import { useMediaQuery } from '@/components/layout/use-media-query';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { InsightStrip } from '@/components/shared/InsightStrip';
import { ErrorState } from '@/components/shared/ErrorState';
import { PageHeader } from '@/components/shared/PageHeader';
import { SkeletonList } from '@/components/shared/SkeletonList';
import { useAreas } from '@/features/areas/queries';
import { useProjects } from '@/features/projects/queries';
import type { Task, TaskPriority, TaskStatus, TaskType } from '@/types';
import { taskInsights } from '@/lib/insights';
import { defaultTaskFilters, filterAndSortTasks, type TaskFilters } from './filter';
import { useDeleteTask, useTasks } from './queries';
import { TaskFormDialog } from './TaskFormDialog';
import { TaskRow } from './TaskRow';

const STATUS_TABS: Array<{ id: 'all' | TaskStatus; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'todo', label: 'Todo' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'done', label: 'Done' },
];

const TYPE_OPTIONS: Array<{ id: 'all' | TaskType; label: string }> = [
  { id: 'all', label: 'All types' },
  { id: 'task', label: 'Task' },
  { id: 'story', label: 'Story' },
  { id: 'bug', label: 'Bug' },
];

const PRIORITY_OPTIONS: Array<{ id: 'all' | TaskPriority; label: string }> = [
  { id: 'all', label: 'All priorities' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
];

const SORT_OPTIONS = [
  { id: 'dueSoon', label: 'Due soon' },
  { id: 'priority', label: 'Priority' },
  { id: 'createdNewest', label: 'Newest' },
  { id: 'title', label: 'Title' },
];

/** Filters that show as a count on the filter button; search and sort stay quiet. */
const FILTER_KEYS = ['type', 'priority', 'projectId', 'area', 'label'] as const;

export function TasksPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(defaultTaskFilters);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
  const isWide = useMediaQuery('(min-width: 640px)');

  const { data: tasks, isPending, isError, refetch } = useTasks();
  const { data: projects } = useProjects();
  const { data: areas } = useAreas();
  const areaById = new Map((areas ?? []).map((area) => [area.id, area]));
  const deleteTask = useDeleteTask();
  const insights = taskInsights(tasks ?? []);

  const visibleTasks = filterAndSortTasks(tasks ?? [], filters, projects ?? []);
  const projectNames = new Map((projects ?? []).map((project) => [project.id, project.name]));
  const allLabels = [...new Set((tasks ?? []).flatMap((task) => task.labels))].sort((a, b) =>
    a.localeCompare(b),
  );
  const activeFilterCount = FILTER_KEYS.filter(
    (key) => filters[key] !== defaultTaskFilters[key],
  ).length;

  const openCreate = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const updateFilter = <Key extends keyof TaskFilters>(key: Key, value: TaskFilters[Key]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Everything that needs to happen, filtered the way you think."
        actions={
          <>
            <Button variant="ghost" onPress={() => navigate('/projects')}>
              <FolderKanban className="size-4" aria-hidden />
              Projects
            </Button>
            <Button onPress={openCreate}>
              <Plus className="size-4" aria-hidden />
              New task
            </Button>
          </>
        }
      />

      <InsightStrip
        className="mb-4"
        items={[
          { label: 'Open tasks', value: insights.open, hint: 'still to do' },
          {
            label: 'Overdue',
            value: insights.overdue,
            tone: insights.overdue > 0 ? 'danger' : 'neutral',
            hint: 'past due date',
          },
          { label: 'Due this week', value: insights.dueThisWeek, hint: 'open tasks' },
          {
            label: 'Finished this week',
            value: insights.doneThisWeek,
            tone: 'success',
            hint: `${insights.completedDueSoFar}/${insights.dueSoFar} due so far`,
          },
        ]}
      />

      <div className="mb-4 flex flex-col gap-3">
        <Tabs
          className="w-full sm:max-w-md"
          selectedKey={filters.status}
          onSelectionChange={(key) => updateFilter('status', key as 'all' | TaskStatus)}
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="Filter by status">
              {STATUS_TABS.map((tab) => (
                <Tabs.Tab
                  key={tab.id}
                  id={tab.id}
                  className="min-w-0 flex-1 px-2 text-[13px] sm:px-4"
                >
                  {tab.label}
                  <Tabs.Indicator />
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>

        <div className="flex items-center gap-2">
          <SearchField
            value={filters.query}
            onChange={(value) => updateFilter('query', value)}
            aria-label="Search tasks"
            className="min-w-0 flex-1"
          >
            <Label className="sr-only">Search tasks</Label>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search tasks" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>

          <Badge.Anchor>
            <Button
              isIconOnly
              variant="secondary"
              aria-label={
                activeFilterCount > 0 ? `Filters, ${activeFilterCount} active` : 'Filters'
              }
              onPress={() => setIsFiltersOpen(true)}
              className="size-9 shrink-0"
            >
              <SlidersHorizontal className="size-4" aria-hidden />
            </Button>
            {activeFilterCount > 0 ? (
              <Badge color="accent" size="sm" placement="top-right">
                {activeFilterCount}
              </Badge>
            ) : null}
          </Badge.Anchor>
        </div>
      </div>

      {isPending ? <SkeletonList rows={4} /> : null}
      {isError ? <ErrorState onRetry={() => void refetch()} /> : null}

      {tasks && tasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No tasks yet"
          description="Create the first task so today has something concrete to work with."
          action={<Button onPress={openCreate}>New task</Button>}
        />
      ) : null}

      {tasks && tasks.length > 0 && visibleTasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No tasks match these filters"
          description="Loosen a filter or clear the search to see more work."
          action={<Button onPress={() => setFilters(defaultTaskFilters)}>Clear filters</Button>}
        />
      ) : null}

      {visibleTasks.length > 0 ? (
        <div className="flex flex-col gap-2">
          {visibleTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              projectName={task.projectId ? projectNames.get(task.projectId) : undefined}
              area={!task.projectId && task.areaId ? areaById.get(task.areaId) : undefined}
              onEdit={(entry) => {
                setEditingTask(entry);
                setIsFormOpen(true);
              }}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      ) : null}

      <Sheet
        placement={isWide ? 'right' : 'bottom'}
        isOpen={isFiltersOpen}
        onOpenChange={setIsFiltersOpen}
      >
        <Sheet.Backdrop>
          <Sheet.Content className={isWide ? 'w-[360px]' : undefined}>
            <Sheet.Dialog>
              {isWide ? null : <Sheet.Handle />}
              <Sheet.CloseTrigger />
              <Sheet.Header>
                <Sheet.Heading>Filters</Sheet.Heading>
              </Sheet.Header>
              <Sheet.Body className="flex flex-col gap-4">
                <FilterSelect
                  label="Type"
                  value={filters.type}
                  onChange={(value) => updateFilter('type', value as 'all' | TaskType)}
                >
                  {TYPE_OPTIONS.map((option) => (
                    <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
                      {option.label}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </FilterSelect>

                <FilterSelect
                  label="Priority"
                  value={filters.priority}
                  onChange={(value) => updateFilter('priority', value as 'all' | TaskPriority)}
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
                      {option.label}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </FilterSelect>

                <FilterSelect
                  label="Project"
                  value={filters.projectId}
                  onChange={(value) => updateFilter('projectId', value)}
                >
                  <ListBox.Item id="all" textValue="All projects">
                    All projects
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  {(projects ?? []).map((project) => (
                    <ListBox.Item key={project.id} id={project.id} textValue={project.name}>
                      {project.name}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </FilterSelect>

                <FilterSelect
                  label="Area"
                  value={filters.area}
                  onChange={(value) => updateFilter('area', value)}
                >
                  <ListBox.Item id="all" textValue="All areas">
                    All areas
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  {(areas ?? []).map((area) => (
                    <ListBox.Item key={area.id} id={area.id} textValue={area.name}>
                      {area.name}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </FilterSelect>

                <FilterSelect
                  label="Label"
                  value={filters.label}
                  onChange={(value) => updateFilter('label', value)}
                >
                  <ListBox.Item id="all" textValue="All labels">
                    All labels
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  {allLabels.map((label) => (
                    <ListBox.Item key={label} id={label} textValue={label}>
                      {label}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </FilterSelect>

                <FilterSelect
                  label="Sort"
                  value={filters.sort}
                  onChange={(value) => updateFilter('sort', value as TaskFilters['sort'])}
                >
                  {SORT_OPTIONS.map((option) => (
                    <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
                      {option.label}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </FilterSelect>
              </Sheet.Body>
              <Sheet.Footer>
                <Button variant="ghost" onPress={() => setFilters(defaultTaskFilters)}>
                  Clear all
                </Button>
                <Sheet.Close>
                  <Button>
                    Show {visibleTasks.length} {visibleTasks.length === 1 ? 'task' : 'tasks'}
                  </Button>
                </Sheet.Close>
              </Sheet.Footer>
            </Sheet.Dialog>
          </Sheet.Content>
        </Sheet.Backdrop>
      </Sheet>

      <TaskFormDialog
        isOpen={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingTask(null);
        }}
        task={editingTask}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete this task?"
        description={`“${pendingDelete?.title ?? ''}” will be removed permanently.`}
        confirmLabel="Delete task"
        isDanger
        isPending={deleteTask.isPending}
        onConfirm={() => {
          if (pendingDelete) deleteTask.mutate(pendingDelete.id);
        }}
      />
    </>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <Select className="w-full" value={value} onChange={(next) => onChange(next as string)}>
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>{children}</ListBox>
      </Select.Popover>
    </Select>
  );
}
