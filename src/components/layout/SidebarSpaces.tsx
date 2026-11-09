import { useState } from 'react';
import { NavLink } from 'react-router';
import { ChevronDown } from 'lucide-react';
import { Tooltip } from '@heroui/react';
import { AreaIcon } from '@/components/shared/AreaIcon';
import { cn } from '@/lib/cn';
import type { Area, AreaTone, Project } from '@/types';

const TONE_SURFACE: Record<AreaTone, string> = {
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  neutral: 'bg-surface-secondary text-muted',
};

const TONE_TEXT: Record<AreaTone, string> = {
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  neutral: 'text-muted',
};

const IDLE_LINK = 'text-muted hover:bg-surface-secondary hover:text-foreground';
const ACTIVE_LINK = 'bg-accent-soft text-accent';

function visibleProjects(projects: Project[]): Project[] {
  return [...projects]
    .filter((project) => project.status !== 'archived')
    .sort((left, right) => left.name.localeCompare(right.name));
}

/** ClickUp-style tree: spaces (areas) expand into their project lists. */
export function SidebarSpaces({ areas, projects }: { areas: Area[]; projects: Project[] }) {
  const byArea = new Map<string, Project[]>();
  const loose: Project[] = [];

  for (const project of visibleProjects(projects)) {
    if (project.areaId) {
      const bucket = byArea.get(project.areaId) ?? [];
      bucket.push(project);
      byArea.set(project.areaId, bucket);
    } else {
      loose.push(project);
    }
  }

  const orderedAreas = [...areas].sort((left, right) => left.name.localeCompare(right.name));

  if (orderedAreas.length === 0 && loose.length === 0) {
    return (
      <NavLink
        to="/projects"
        className="rounded-md px-2 py-1.5 text-xs text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
      >
        Create your first project
      </NavLink>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {orderedAreas.map((area) => (
        <SpaceGroup key={area.id} area={area} projects={byArea.get(area.id) ?? []} />
      ))}
      {loose.length > 0 ? <LooseGroup projects={loose} /> : null}
    </div>
  );
}

function SpaceGroup({ area, projects }: { area: Area; projects: Project[] }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div>
      <div className="flex items-center gap-0.5">
        <NavLink
          to={`/areas/${area.id}`}
          className={({ isActive }) =>
            cn(
              'flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-[13px] font-medium transition-colors',
              isActive ? ACTIVE_LINK : cn('text-foreground', IDLE_LINK),
            )
          }
        >
          <span
            className={cn(
              'flex size-5 shrink-0 items-center justify-center rounded-md',
              TONE_SURFACE[area.tone],
            )}
          >
            <AreaIcon icon={area.icon} className="size-3" />
          </span>
          <span className="truncate">{area.name}</span>
          {projects.length > 0 ? (
            <span className="ml-auto text-[10px] font-normal text-muted">{projects.length}</span>
          ) : null}
        </NavLink>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${area.name}`}
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
        >
          <ChevronDown
            className={cn('size-3.5 transition-transform', !isOpen && '-rotate-90')}
            aria-hidden
          />
        </button>
      </div>

      {isOpen ? (
        projects.length > 0 ? (
          <ul className="mt-0.5 ml-3.5 space-y-0.5 border-l border-border pl-2">
            {projects.map((project) => (
              <li key={project.id}>
                <NavLink
                  to={`/projects/${project.id}`}
                  className={({ isActive }) =>
                    cn(
                      'flex h-7 items-center gap-2 rounded-md px-2 text-xs transition-colors',
                      isActive ? ACTIVE_LINK : IDLE_LINK,
                    )
                  }
                >
                  <span className="truncate">{project.name}</span>
                  <span className="ml-auto shrink-0 font-mono text-[10px] text-muted">
                    {project.key}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-0.5 ml-3.5 border-l border-border py-1 pl-3 text-[11px] text-muted">
            No projects yet
          </p>
        )
      ) : null}
    </div>
  );
}

function LooseGroup({ projects }: { projects: Project[] }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div>
      <div className="flex items-center gap-0.5">
        <span className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-[13px] font-medium text-muted">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-surface-secondary text-[10px] text-muted">
            ·
          </span>
          <span className="truncate">Unsorted</span>
          <span className="ml-auto text-[10px] font-normal text-muted">{projects.length}</span>
        </span>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-label={`${isOpen ? 'Collapse' : 'Expand'} unsorted projects`}
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
        >
          <ChevronDown
            className={cn('size-3.5 transition-transform', !isOpen && '-rotate-90')}
            aria-hidden
          />
        </button>
      </div>

      {isOpen ? (
        <ul className="mt-0.5 ml-3.5 space-y-0.5 border-l border-border pl-2">
          {projects.map((project) => (
            <li key={project.id}>
              <NavLink
                to={`/projects/${project.id}`}
                className={({ isActive }) =>
                  cn(
                    'flex h-7 items-center gap-2 rounded-md px-2 text-xs transition-colors',
                    isActive ? ACTIVE_LINK : IDLE_LINK,
                  )
                }
              >
                <span className="truncate">{project.name}</span>
                <span className="ml-auto shrink-0 font-mono text-[10px] text-muted">
                  {project.key}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Space icons for the collapsed rail. */
export function SidebarAreaRail({ areas }: { areas: Area[] }) {
  if (areas.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      {[...areas]
        .sort((left, right) => left.name.localeCompare(right.name))
        .map((area) => (
          <Tooltip key={area.id} delay={200}>
            <Tooltip.Trigger>
              <NavLink
                to={`/areas/${area.id}`}
                aria-label={area.name}
                className={({ isActive }) =>
                  cn(
                    'flex size-10 items-center justify-center rounded-md transition-colors',
                    isActive ? ACTIVE_LINK : cn(TONE_TEXT[area.tone], IDLE_LINK),
                  )
                }
              >
                <AreaIcon icon={area.icon} className="size-4" />
              </NavLink>
            </Tooltip.Trigger>
            <Tooltip.Content placement="right">{area.name}</Tooltip.Content>
          </Tooltip>
        ))}
    </div>
  );
}
