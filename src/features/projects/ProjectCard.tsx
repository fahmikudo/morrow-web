import { Link } from 'react-router';
import { EntityIcon } from '@/components/shared/EntityIcon';
import { ProgressBar } from '@heroui/react';
import { RelativeTime } from '@/components/shared/RelativeTime';
import { AreaBadge } from '@/components/shared/AreaBadge';
import { ProjectStatusTag } from '@/components/shared/tags';
import { stripHtml } from '@/lib/text';
import type { Area, Project } from '@/types';
import type { ProjectProgress } from './progress';

type ProjectCardProps = {
  project: Project;
  progress: ProjectProgress;
  area?: Area;
};

export function ProjectCard({ project, progress, area }: ProjectCardProps) {
  const description = stripHtml(project.description ?? '');

  return (
    <Link
      to={`/projects/${project.id}`}
      className="motion-card surface-card flex flex-col gap-3 hover:border-accent/50"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="flex min-w-0 items-baseline gap-2 text-sm font-semibold text-foreground">
          <EntityIcon kind="project" className="size-4 self-center" />
          <span className="shrink-0 font-mono text-[10px] font-normal text-muted">
            {project.key}
          </span>
          <span className="min-w-0 truncate">{project.name}</span>
        </h2>
        <span className="flex shrink-0 items-center gap-1.5">
          {area ? <AreaBadge area={area} /> : null}
          <ProjectStatusTag status={project.status} />
        </span>
      </div>

      {description ? (
        <p className="line-clamp-2 text-xs leading-relaxed text-muted">{description}</p>
      ) : (
        <p className="text-xs text-muted">No description yet.</p>
      )}

      <div className="mt-auto flex flex-col gap-1.5">
        <ProgressBar aria-label={`Progress for ${project.name}`} value={progress.percent}>
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
        <div className="flex items-center justify-between text-xs text-muted">
          <span>
            {progress.done} of {progress.total} tasks done
          </span>
          <RelativeTime iso={project.updatedAt} />
        </div>
      </div>
    </Link>
  );
}
