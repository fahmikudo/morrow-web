import { useState } from 'react';
import { FolderKanban, Plus } from 'lucide-react';
import { Button, Tabs } from '@heroui/react';
import { EmptyState } from '@/components/shared/EmptyState';
import { InsightStrip } from '@/components/shared/InsightStrip';
import { ErrorState } from '@/components/shared/ErrorState';
import { PageHeader } from '@/components/shared/PageHeader';
import { SkeletonList } from '@/components/shared/SkeletonList';
import { useAreas } from '@/features/areas/queries';
import { projectInsights } from '@/lib/insights';
import { useTasks } from '@/features/tasks/queries';
import type { Project, ProjectStatus } from '@/types';
import { ProjectCard } from './ProjectCard';
import { ProjectFormDialog } from './ProjectFormDialog';
import { projectProgress } from './progress';
import { useProjects } from './queries';

const TABS: Array<{ id: ProjectStatus; label: string }> = [
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'archived', label: 'Archived' },
];

const EMPTY_COPY: Record<ProjectStatus, { title: string; description: string }> = {
  active: {
    title: 'No active projects',
    description: 'Create a project to give related tasks and notes a home.',
  },
  completed: {
    title: 'Nothing completed yet',
    description: 'Projects land here once their outcome is reached.',
  },
  archived: {
    title: 'No archived projects',
    description: 'Archive a project when you want it out of the way without deleting it.',
  },
};

const byUpdated = (a: Project, b: Project) => b.updatedAt.localeCompare(a.updatedAt);

export function ProjectsPage() {
  const [tab, setTab] = useState<ProjectStatus>('active');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: projects, isPending, isError, refetch } = useProjects();
  const { data: tasks } = useTasks();
  const { data: areas } = useAreas();
  const areaById = new Map((areas ?? []).map((area) => [area.id, area]));
  const insights = projectInsights(projects ?? [], tasks ?? []);

  const visibleProjects = (projects ?? []).filter((project) => project.status === tab).sort(byUpdated);

  return (
    <>
      <PageHeader
        title="Projects"
        description="Focused workspaces for work that has a concrete outcome."
        actions={
          <Button onPress={() => setIsFormOpen(true)}>
            <Plus className="size-4" aria-hidden />
            New project
          </Button>
        }
      />

      <InsightStrip
        className="mb-4"
        items={[
          { label: 'Active projects', value: insights.active, hint: 'in progress' },
          {
            label: 'On track',
            value: insights.onTrack,
            tone: 'success',
            hint: 'no overdue tasks',
          },
          {
            label: 'Needs attention',
            value: insights.needsAttention,
            tone: insights.needsAttention > 0 ? 'danger' : 'neutral',
            hint: 'with overdue work',
          },
          {
            label: 'Quiet 14d+',
            value: insights.quiet,
            tone: insights.quiet > 0 ? 'warning' : 'neutral',
            hint: 'no recent updates',
          },
        ]}
      />

      <Tabs selectedKey={tab} onSelectionChange={(key) => setTab(key as ProjectStatus)} className="mb-4">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Filter projects by status">
            {TABS.map((entry) => (
              <Tabs.Tab key={entry.id} id={entry.id}>
                {entry.label}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      {isPending ? <SkeletonList rows={3} /> : null}
      {isError ? <ErrorState onRetry={() => void refetch()} /> : null}

      {projects && visibleProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={EMPTY_COPY[tab].title}
          description={EMPTY_COPY[tab].description}
          action={
            tab === 'active' ? (
              <Button onPress={() => setIsFormOpen(true)}>New project</Button>
            ) : undefined
          }
        />
      ) : null}

      {visibleProjects.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibleProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              progress={projectProgress(project.id, tasks ?? [])}
              area={project.areaId ? areaById.get(project.areaId) : undefined}
            />
          ))}
        </div>
      ) : null}

      <ProjectFormDialog isOpen={isFormOpen} onOpenChange={setIsFormOpen} />
    </>
  );
}
