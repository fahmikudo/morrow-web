import { useState } from 'react';
import { Link } from 'react-router';
import { Plus, Shapes } from 'lucide-react';
import { Button, ProgressBar } from '@heroui/react';
import { AreaIcon } from '@/components/shared/AreaIcon';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { PageHeader } from '@/components/shared/PageHeader';
import { SkeletonList } from '@/components/shared/SkeletonList';
import { useNotes } from '@/features/knowledge/queries';
import { useProjects } from '@/features/projects/queries';
import { useTasks } from '@/features/tasks/queries';
import { areaSummary } from '@/lib/area';
import { cn } from '@/lib/cn';
import { AreaFormDialog } from './AreaFormDialog';
import { useAreas } from './queries';
import { AREA_TONE_PROGRESS, AREA_TONE_STRIPE, AREA_TONE_TILE } from './tones';

export function AreasPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const areasQuery = useAreas();
  const projectsQuery = useProjects();
  const tasksQuery = useTasks();
  const notesQuery = useNotes();

  const isPending =
    areasQuery.isPending ||
    projectsQuery.isPending ||
    tasksQuery.isPending ||
    notesQuery.isPending;
  const isError =
    areasQuery.isError || projectsQuery.isError || tasksQuery.isError || notesQuery.isError;

  const areas = areasQuery.data ?? [];
  const projects = projectsQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];
  const notes = notesQuery.data ?? [];

  return (
    <>
      <PageHeader
        title="Areas"
        description="Spaces that group projects, tasks and notes by part of life."
        actions={
          <Button onPress={() => setIsFormOpen(true)}>
            <Plus className="size-4" aria-hidden />
            New area
          </Button>
        }
      />

      {isPending ? <SkeletonList rows={3} /> : null}
      {isError ? (
        <ErrorState
          onRetry={() => {
            void areasQuery.refetch();
            void projectsQuery.refetch();
            void tasksQuery.refetch();
            void notesQuery.refetch();
          }}
        />
      ) : null}

      {areasQuery.isSuccess && areas.length === 0 ? (
        <EmptyState
          icon={Shapes}
          title="No areas yet"
          description="Create areas such as Works, Family, or Health to group everything that belongs together."
          action={<Button onPress={() => setIsFormOpen(true)}>Create area</Button>}
        />
      ) : null}

      {areas.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {areas.map((area) => {
            const summary = areaSummary(area.id, projects, tasks, notes);

            return (
              <Link
                key={area.id}
                to={`/areas/${area.id}`}
                className="motion-card surface-card relative flex flex-col gap-3 overflow-hidden pl-5 hover:border-accent/50"
              >
                <span
                  className={cn('absolute inset-y-0 left-0 w-1', AREA_TONE_STRIPE[area.tone])}
                  aria-hidden
                />
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex size-8 items-center justify-center rounded-lg',
                      AREA_TONE_TILE[area.tone],
                    )}
                  >
                    <AreaIcon icon={area.icon} className="size-4" />
                  </span>
                  <h2 className="min-w-0 truncate text-sm font-semibold text-foreground">
                    {area.name}
                  </h2>
                </div>

                <p className="line-clamp-2 text-xs leading-relaxed text-muted">
                  {area.description?.trim() ? area.description : 'No description yet.'}
                </p>

                <div className="mt-auto flex flex-col gap-1.5">
                  <ProgressBar
                    aria-label={`Progress for ${area.name}`}
                    value={summary.percent}
                    color={AREA_TONE_PROGRESS[area.tone]}
                  >
                    <ProgressBar.Track>
                      <ProgressBar.Fill />
                    </ProgressBar.Track>
                  </ProgressBar>
                  <div className="flex items-center justify-between gap-2 text-xs text-muted">
                    <span>
                      {summary.projects} projects · {summary.openTasks} open · {summary.notes} notes
                    </span>
                    <span>{summary.percent}%</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : null}

      <AreaFormDialog isOpen={isFormOpen} onOpenChange={setIsFormOpen} />
    </>
  );
}
