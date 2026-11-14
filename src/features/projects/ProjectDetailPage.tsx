import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { FolderKanban, Plus } from 'lucide-react';
import { Button, ProgressBar } from '@heroui/react';
import { AppTag } from '@/components/shared/AppTag';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { InsightStrip } from '@/components/shared/InsightStrip';
import { ErrorState } from '@/components/shared/ErrorState';
import { RelativeTime } from '@/components/shared/RelativeTime';
import { RichTextContent } from '@/components/shared/rich-text/RichTextContent';
import { SkeletonList } from '@/components/shared/SkeletonList';
import { AttachmentsPanel } from '@/features/attachments/AttachmentsPanel';
import { ProjectStatusTag } from '@/components/shared/tags';
import { HabitFormDialog } from '@/features/habits/HabitFormDialog';
import { HabitRow } from '@/features/habits/HabitRow';
import { useHabitCheckIns, useHabitSkips, useHabits } from '@/features/habits/queries';
import { useNotes } from '@/features/knowledge/queries';
import { useTasks } from '@/features/tasks/queries';
import { TaskRow } from '@/features/tasks/TaskRow';
import { TaskFormDialog } from '@/features/tasks/TaskFormDialog';
import type { Task } from '@/types';
import { projectDetailInsights } from '@/lib/insights';
import { projectProgress } from './progress';
import { useArchiveProject, useProject, useReactivateProject } from './queries';
import { ProjectFormDialog } from './ProjectFormDialog';

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const projectQuery = useProject(projectId);
  const { data: tasks } = useTasks();
  const { data: notes } = useNotes();
  const { data: habits } = useHabits();
  const { data: checkIns } = useHabitCheckIns();
  const { data: skips } = useHabitSkips();
  const archiveProject = useArchiveProject();
  const reactivateProject = useReactivateProject();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isHabitFormOpen, setIsHabitFormOpen] = useState(false);

  if (projectQuery.isPending) return <SkeletonList rows={4} />;
  if (projectQuery.isError) return <ErrorState onRetry={() => void projectQuery.refetch()} />;

  const project = projectQuery.data;

  if (!project) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Project not found"
        description="This project may have been deleted. Head back to the project list."
        action={<Button onPress={() => navigate('/projects')}>Back to projects</Button>}
      />
    );
  }

  const progress = projectProgress(project.id, tasks ?? []);
  const insights = projectDetailInsights(project, tasks ?? []);
  const linkedTasks = (tasks ?? [])
    .filter((task) => task.projectId === project.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const linkedNotes = (notes ?? [])
    .filter((note) => note.projectId === project.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const isArchived = project.status === 'archived';
  const projectHabits = (habits ?? []).filter((habit) => habit.projectId === project.id);

  const handleToggleArchive = () => {
    if (isArchived) reactivateProject.mutate(project.id);
    else archiveProject.mutate(project.id);
  };

  return (
    <>
      <Breadcrumbs
        className="mb-4"
        items={[{ label: 'Projects', to: '/projects' }, { label: project.name }]}
      />

      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted">{project.key}</span>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{project.name}</h1>
            <ProjectStatusTag status={project.status} />
          </div>
          <RichTextContent
            html={project.description}
            fallback="No description yet."
            className="mt-1 max-w-2xl text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onPress={() => setIsTaskFormOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Add task
          </Button>
          <Button variant="secondary" onPress={() => setIsEditOpen(true)}>
            Edit
          </Button>
          <Button
            variant={isArchived ? 'secondary' : 'ghost'}
            onPress={() => setIsArchiveOpen(true)}
            className={isArchived ? undefined : 'text-muted'}
          >
            {isArchived ? 'Reactivate' : 'Archive'}
          </Button>
        </div>
      </header>

      <section className="surface-card mb-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="section-label">Progress</p>
          <p className="text-sm text-muted">
            {progress.percent}% · {progress.done} of {progress.total} tasks done · {linkedNotes.length}{' '}
            {linkedNotes.length === 1 ? 'note' : 'notes'}
          </p>
        </div>
        <ProgressBar aria-label={`Progress for ${project.name}`} value={progress.percent}>
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      </section>

      <InsightStrip
        className="mb-6"
        items={[
          { label: 'Open tasks', value: insights.open, hint: 'still to do' },
          {
            label: 'Overdue',
            value: insights.overdue,
            tone: insights.overdue > 0 ? 'danger' : 'neutral',
            hint: 'past due date',
          },
          { label: 'Done', value: insights.done, tone: 'success', hint: 'tasks completed' },
          {
            label: 'Last activity',
            value: insights.lastActivity ? <RelativeTime iso={insights.lastActivity} /> : '—',
            hint: 'project or task update',
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="section-label">Tasks</h2>

          {linkedTasks.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No tasks linked yet"
              description="Add a task to start tracking progress on this project."
              action={<Button onPress={() => setIsTaskFormOpen(true)}>Add task</Button>}
            />
          ) : (
            <div className="flex flex-col gap-2">
              {linkedTasks.map((task: Task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          )}
        </section>

        <section className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="section-label">Habits</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted"
              onPress={() => setIsHabitFormOpen(true)}
            >
              <Plus className="size-4" aria-hidden />
              New habit
            </Button>
          </div>

          {projectHabits.length === 0 ? (
            <div className="surface-card text-sm text-muted">
              No habits in this project yet.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {projectHabits.map((habit) => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  checkIns={checkIns ?? []}
                  skips={skips ?? []}
                  projectName={project.name}
                />
              ))}
            </div>
          )}
        </section>

        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="section-label">Notes</h2>

          {linkedNotes.length === 0 ? (
            <div className="surface-card text-sm text-muted">No notes linked to this project.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {linkedNotes.map((note) => (
                <Link
                  key={note.id}
                  to={`/knowledge/${note.id}`}
                  className="surface-card transition-colors hover:border-accent/50 hover:bg-surface-secondary/40"
                >
                  <p className="text-sm font-medium text-foreground">{note.title}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {note.tags.map((tag) => (
                      <AppTag key={tag}>{tag}</AppTag>
                    ))}
                    <RelativeTime iso={note.updatedAt} className="text-xs text-muted" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <AttachmentsPanel entityType="project" entityId={project.id} className="mt-6" />

      <ProjectFormDialog
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        project={project}
      />

      <TaskFormDialog
        isOpen={isTaskFormOpen}
        onOpenChange={setIsTaskFormOpen}
        defaultProjectId={project.id}
      />

      <HabitFormDialog
        isOpen={isHabitFormOpen}
        onOpenChange={setIsHabitFormOpen}
        defaultProjectId={project.id}
      />

      <ConfirmDialog
        isOpen={isArchiveOpen}
        onOpenChange={setIsArchiveOpen}
        title={isArchived ? 'Reactivate this project?' : 'Archive this project?'}
        description={
          isArchived
            ? 'The project returns to the active list and stays linked to its tasks and notes.'
            : 'The project moves to Archived. Its tasks and notes are kept and stay linked.'
        }
        confirmLabel={isArchived ? 'Reactivate' : 'Archive'}
        onConfirm={handleToggleArchive}
      />
    </>
  );
}
