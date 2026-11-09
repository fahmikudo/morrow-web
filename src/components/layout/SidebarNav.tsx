import { NavLink } from 'react-router';
import {
  BookOpen,
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  Repeat,
  Settings2,
  Shapes,
  SquareCheck,
  Sun,
} from 'lucide-react';
import { Avatar, ScrollShadow, Tooltip } from '@heroui/react';
import { SidebarAreaRail, SidebarSpaces } from '@/components/layout/SidebarSpaces';
import { useMediaQuery } from '@/components/layout/use-media-query';
import { useAreas } from '@/features/areas/queries';
import { useInboxItems } from '@/features/inbox/queries';
import { useProfile } from '@/features/profile/queries';
import { useProjects } from '@/features/projects/queries';
import { cn } from '@/lib/cn';
import { initials } from '@/lib/initials';
import { useUiStore } from '@/stores/ui-store';

type NavItem = { to: string; label: string; icon: typeof Sun; module: string };

const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Home',
    items: [
      { to: '/today', label: 'Today', icon: Sun, module: 'today' },
      { to: '/inbox', label: 'Inbox', icon: Inbox, module: 'inbox' },
    ],
  },
  {
    label: 'Work',
    items: [
      { to: '/tasks', label: 'Tasks', icon: SquareCheck, module: 'tasks' },
      { to: '/habits', label: 'Habits', icon: Repeat, module: 'habits' },
      { to: '/knowledge', label: 'Knowledge', icon: BookOpen, module: 'knowledge' },
    ],
  },
  {
    label: 'Plan',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' },
      { to: '/calendar', label: 'Calendar', icon: CalendarDays, module: 'calendar' },
    ],
  },
];

const IDLE_LINK = 'text-muted hover:bg-surface-secondary hover:text-foreground';
const ACTIVE_LINK = 'bg-accent-soft text-accent';

export function SidebarNav() {
  const isCollapsed = useUiStore((state) => state.isSidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const isWide = useMediaQuery('(min-width: 1024px)');
  const showLabels = isWide && !isCollapsed;

  const { data: inboxItems } = useInboxItems();
  const { data: areas } = useAreas();
  const { data: projects } = useProjects();
  const { data: profile } = useProfile();

  const inboxCount = inboxItems?.length ?? 0;
  const areaList = areas ?? [];
  const projectList = projects ?? [];

  return (
    <aside
      className={cn(
        'motion-sidebar sticky top-12 z-20 hidden h-[calc(100dvh-3rem)] shrink-0 flex-col border-r border-border bg-surface/50 md:flex',
        showLabels ? 'w-16 lg:w-64' : 'w-16',
      )}
    >
      <ScrollShadow
        hideScrollBar
        className={cn(
          'flex min-h-0 flex-1 flex-col gap-0.5 py-3',
          showLabels ? 'px-2' : 'px-2',
        )}
      >
        {showLabels ? (
          <>
            {NAV_GROUPS.map((group, index) => (
              <div key={group.label} className={cn('flex flex-col gap-0.5', index > 0 && 'mt-3')}>
                <p className="px-2 pb-1 text-[10px] font-medium tracking-wide text-muted uppercase">
                  {group.label}
                </p>
                {group.items.map((item) => (
                  <SidebarLink
                    key={item.to}
                    item={item}
                    count={item.to === '/inbox' ? inboxCount : 0}
                    showLabels
                  />
                ))}
              </div>
            ))}

            <div className="mt-3 flex flex-col gap-0.5">
              <div className="flex items-center justify-between pr-1 pl-2">
                <span className="text-[10px] font-medium tracking-wide text-muted uppercase">
                  Spaces
                </span>
                <div className="flex items-center gap-0.5">
                  <IconLink
                    to="/projects"
                    label="All projects"
                    icon={FolderKanban}
                    module="projects"
                  />
                  <IconLink to="/areas" label="All areas" icon={Shapes} module="areas" />
                </div>
              </div>
              <SidebarSpaces areas={areaList} projects={projectList} />
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-1">
              {NAV_GROUPS.flatMap((group) => group.items).map((item) => (
                <SidebarLink
                  key={item.to}
                  item={item}
                  count={item.to === '/inbox' ? inboxCount : 0}
                  showLabels={false}
                />
              ))}
            </div>

            <div className="mt-2 flex flex-col items-center gap-1 border-t border-border pt-2">
              <IconLink
                to="/projects"
                label="All projects"
                icon={FolderKanban}
                module="projects"
              />
              <IconLink to="/areas" label="All areas" icon={Shapes} module="areas" />
              <SidebarAreaRail areas={areaList} />
            </div>
          </>
        )}
      </ScrollShadow>

      <div className="border-t border-border p-2">
        <div
          className={cn(
            'flex items-center gap-2 rounded-md px-1.5 py-1.5',
            showLabels ? '' : 'justify-center',
          )}
        >
          <Avatar className="size-7 shrink-0">
            <Avatar.Fallback>{initials(profile?.name ?? 'Morrow')}</Avatar.Fallback>
          </Avatar>
          {showLabels ? (
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-foreground">
                {profile?.name ?? 'Morrow'}
              </p>
              <p className="truncate text-[10px] text-muted">
                {profile?.email ?? 'Local workspace'}
              </p>
            </div>
          ) : null}
        </div>

        <div
          className={cn(
            'mt-1 flex items-center gap-1',
            showLabels ? 'justify-between' : 'flex-col justify-center',
          )}
        >
          <NavLink
            to="/settings"
            aria-label="Settings"
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-md text-[13px] font-medium transition-colors',
                showLabels ? 'h-8 flex-1 gap-2.5 px-2' : 'size-10 justify-center',
                isActive ? ACTIVE_LINK : IDLE_LINK,
              )
            }
          >
            <Settings2 className="size-4 shrink-0" aria-hidden />
            {showLabels ? <span className="truncate">Settings</span> : null}
          </NavLink>

          {isWide ? (
            <Tooltip delay={200}>
              <Tooltip.Trigger>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  className="flex size-10 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
                >
                  {isCollapsed ? (
                    <ChevronsRight className="size-4" aria-hidden />
                  ) : (
                    <ChevronsLeft className="size-4" aria-hidden />
                  )}
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content placement="right">
                {isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              </Tooltip.Content>
            </Tooltip>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({
  item,
  count,
  showLabels,
}: {
  item: NavItem;
  count: number;
  showLabels: boolean;
}) {
  const Icon = item.icon;

  const link = (
    <NavLink
      to={item.to}
      aria-label={item.label}
      data-module={item.module}
      className={({ isActive }) =>
        cn(
          'nav-module flex items-center rounded-md text-[13px] font-medium transition-colors',
          showLabels ? 'h-8 w-full gap-2.5 px-2' : 'size-10 justify-center',
          isActive ? 'nav-module-active' : IDLE_LINK,
        )
      }
    >
      <Icon className="nav-module-icon size-4 shrink-0" aria-hidden />
      {showLabels ? <span className="truncate">{item.label}</span> : null}
      {showLabels && count > 0 ? (
        <span className="nav-module-badge ml-auto rounded-full px-1.5 text-[10px] font-semibold">
          {count}
        </span>
      ) : null}
    </NavLink>
  );

  if (showLabels) return link;

  return (
    <Tooltip delay={200}>
      <Tooltip.Trigger>{link}</Tooltip.Trigger>
      <Tooltip.Content placement="right">{item.label}</Tooltip.Content>
    </Tooltip>
  );
}

function IconLink({
  to,
  label,
  icon: Icon,
  module,
}: {
  to: string;
  label: string;
  icon: typeof Sun;
  module?: string;
}) {
  return (
    <Tooltip delay={200}>
      <Tooltip.Trigger>
        <NavLink
          to={to}
          aria-label={label}
          data-module={module}
          className={({ isActive }) =>
            cn(
              'flex size-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-secondary hover:text-foreground',
              module && 'nav-module',
              isActive && (module ? 'nav-module-active' : 'text-accent'),
            )
          }
        >
          <Icon className={cn('size-3.5', module && 'nav-module-icon')} aria-hidden />
        </NavLink>
      </Tooltip.Trigger>
      <Tooltip.Content placement="top">{label}</Tooltip.Content>
    </Tooltip>
  );
}
