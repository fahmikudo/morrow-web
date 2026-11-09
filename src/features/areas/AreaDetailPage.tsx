import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { FolderKanban, Plus, Shapes, Trash2 } from 'lucide-react';
import { Button, ProgressBar } from '@heroui/react';
import { AreaIcon } from '@/components/shared/AreaIcon';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { RelativeTime } from '@/components/shared/RelativeTime';
import { RichTextContent } from '@/components/shared/rich-text/RichTextContent';
import { SkeletonList } from '@/components/shared/SkeletonList';
import { HabitFormDialog } from '@/features/habits/HabitFormDialog';
import { HabitRow } from '@/features/habits/HabitRow';
import { useHabitCheckIns, useHabits } from '@/features/habits/queries';
import { useNotes } from '@/features/knowledge/queries';
import { ProjectCard } from '@/features/projects/ProjectCard';
import { ProjectFormDialog } from '@/features/projects/ProjectFormDialog';
import { projectProgress } from '@/features/projects/progress';
import { useProjects } from '@/features/projects/queries';
import { TaskRow } from '@/features/tasks/TaskRow';
import { defaultTaskFilters, filterAndSortTasks } from '@/features/tasks/filter';
import { useTasks } from '@/features/tasks/queries';
import { areaSummary, effectiveAreaId } from '@/lib/area';
import { cn } from '@/lib/cn';
import { AreaFormDialog } from './AreaFormDialog';
import { useArea, useDeleteArea } from './queries';
import { AREA_TONE_PROGRESS, AREA_TONE_TILE } from './tones';

export function AreaDetailPage() {
  const { areaId } = useParams();
  const navigate = useNavigate();

  const areaQuery = useArea(areaId);
  const projectsQuery = useProjects();
  const tasksQuery = useTasks();
  const notesQuery = useNotes();
  const { data: habits } = useHabits();
  const { data: checkIns } = useHabitCheckIns();
  const deleteArea = useDeleteArea();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isHabitFormOpen, setIsHabitFormOpen] = useState(false);

  const isPending =
    areaQuery.isPending ||
    projectsQuery.isPending ||
    tasksQuery.isPending ||
    notesQuery.isPending;
  const isError =
    areaQuery.isError || projectsQuery.isError || tasksQuery.isError || notesQuery.isError;

  if (isPending) return <SkeletonList rows={4} />;
  if (isError) {
    return (
      <ErrorState
        onRetry={() => {
          void areaQuery.refetch();
          void projectsQuery.refetch();
          void tasksQuery.refetch();
          void notesQuery.refetch();
        }}
      />
    );
  }

  const area = areaQuery.data;

  if (!area) {
    return (
      <EmptyState
        icon={Shapes}
        title="Area not found"
        description="This area may have been deleted. Head back to the area list."
        action={<Button onPress={() => navigate('/areas')}>Back to areas</Button>}
      />
    );
  }

  const projects = projectsQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];
  const notes = notesQuery.data ?? [];
  const projectNames = new Map(projects.map((project) => [project.id, project.name]));

  const summary = areaSummary(area.id, projects, tasks, notes);
  const areaProjects = projects
    .filter((project) => project.areaId === area.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const areaTasks = filterAndSortTasks(tasks, { ...defaultTaskFilters, area: area.id }, projects);
  const areaNotes = notes
    .filter((note) => effectiveAreaId(note, projects) === area.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const areaHabits = (habits ?? []).filter(
    (habit) => effectiveAreaId(habit, projects) === area.id,
  );

  return (
    <>
      <Breadcrumbs
        className="mb-4"
        items={[{ label: 'Areas', to: '/areas' }, { label: area.name }]}
      />

      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-lg',
              AREA_TONE_TILE[area.tone],
            )}
          >
            <AreaIcon icon={area.icon} className="size-5" labelled />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{area.name}</h1>
            <RichTextContent
              html={area.description}
              fallback="No description yet."
              className="mt-1 max-w-2xl text-sm text-muted"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onPress={() => setIsProjectOpen(true)}>
            <Plus className="size-4" aria-hidden />
            New project
          </Button>
          <Button variant="secondary" onPress={() => setIsEditOpen(true)}>
            Edit
          </Button>
          <Button
            isIconOnly
            variant="ghost"
            aria-label="Delete area"
            className="text-muted"
            onPress={() => setIsDeleteOpen(true)}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryTile label="Projects" value={summary.projects} />
        <SummaryTile label="Open tasks" value={summary.openTasks} />
        <SummaryTile label="Notes" value={summary.notes} />
        <div className="surface-card flex flex-col justify-center gap-1.5">
          <span className="section-label">Progress</span>
          <ProgressBar
            aria-label={`Progress for ${area.name}`}
            value={summary.percent}
            color={AREA_TONE_PROGRESS[area.tone]}
          >
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
          <span className="text-xs text-muted">
            {summary.doneLeaves} of {summary.leafTasks} tasks done
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="section-label">Projects</h2>
              <Link to="/projects" className="text-xs text-accent hover:underline">
                All projects
              </Link>
            </div>

            {areaProjects.length === 0 ? (
              <EmptyState
                icon={FolderKanban}
                title="No projects in this area"
                description="Projects give an area its concrete outcomes. Create the first one."
                action={<Button onPress={() => setIsProjectOpen(true)}>New project</Button>}
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {areaProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    progress={projectProgress(project.id, tasks)}
                    area={area}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="section-label">Tasks</h2>
              <Link to="/tasks" className="text-xs text-accent hover:underline">
                All tasks
              </Link>
            </div>

            {areaTasks.length === 0 ? (
              <div className="surface-card text-sm text-muted">No tasks in this area yet.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {areaTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    projectName={task.projectId ? projectNames.get(task.projectId) : undefined}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="section-label">Habits</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted"
              onPress={() => setIsHabitFormOpen(true)}
            >
              <Plus className="size-4" aria-hidden />
              New
            </Button>
          </div>

          {areaHabits.length === 0 ? (
            <div className="surface-card text-sm text-muted">No habits in this area yet.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {areaHabits.map((habit) => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  checkIns={checkIns ?? []}
                  area={area}
                  projectName={
                    habit.projectId ? projectNames.get(habit.projectId) : undefined
                  }
                />
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="section-label">Notes</h2>
            <Link to="/knowledge" className="text-xs text-accent hover:underline">
              All notes
            </Link>
          </div>

          {areaNotes.length === 0 ? (
            <div className="surface-card text-sm text-muted">No notes in this area yet.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {areaNotes.map((note) => (
                <Link
                  key={note.id}
                  to={`/knowledge/${note.id}`}
                  className="motion-card surface-card hover:border-accent/50"
                >
                  <p className="text-sm font-medium text-foreground">{note.title}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {note.projectId ? (
                      <span className="text-xs text-muted">
                        {projectNames.get(note.projectId) ?? 'Project note'}
                      </span>
                    ) : null}
                    <RelativeTime iso={note.updatedAt} className="text-xs text-muted" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <AreaFormDialog isOpen={isEditOpen} onOpenChange={setIsEditOpen} area={area} />

      <ProjectFormDialog
        isOpen={isProjectOpen}
        onOpenChange={setIsProjectOpen}
        defaultAreaId={area.id}
      />

      <HabitFormDialog
        isOpen={isHabitFormOpen}
        onOpenChange={setIsHabitFormOpen}
        defaultAreaId={area.id}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete this area?"
        description={`“${area.name}” will be removed. Its projects, tasks and notes stay and simply lose the area.`}
        confirmLabel="Delete area"
        isDanger
        isPending={deleteArea.isPending}
        onConfirm={() => {
          deleteArea.mutate(area.id, { onSuccess: () => navigate('/areas') });
        }}
      />
    </>
  );
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface-card flex flex-col gap-1">
      <span className="section-label truncate">{label}</span>
      <span className="text-2xl font-semibold text-foreground">{value}</span>
    </div>
  );
}
