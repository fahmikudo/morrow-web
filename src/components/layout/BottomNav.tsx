import { useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import {
  BookOpen,
  CalendarDays,
  Ellipsis,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  Plus,
  Repeat,
  Shapes,
  SquareCheck,
  Sun,
} from 'lucide-react';
import { Button, Drawer } from '@heroui/react';
import { cn } from '@/lib/cn';
import { useUiStore } from '@/stores/ui-store';

const PRIMARY_ITEMS = [
  { to: '/today', label: 'Today', icon: Sun, module: 'today' },
  { to: '/inbox', label: 'Inbox', icon: Inbox, module: 'inbox' },
  { to: '/tasks', label: 'Tasks', icon: SquareCheck, module: 'tasks' },
];

const MORE_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays, module: 'calendar' },
  { to: '/habits', label: 'Habits', icon: Repeat, module: 'habits' },
  { to: '/projects', label: 'Projects', icon: FolderKanban, module: 'projects' },
  { to: '/areas', label: 'Areas', icon: Shapes, module: 'areas' },
  { to: '/knowledge', label: 'Knowledge', icon: BookOpen, module: 'knowledge' },
];

export function BottomNav() {
  const openQuickCapture = useUiStore((state) => state.openQuickCapture);
  const { pathname } = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreIsActive = MORE_ITEMS.some((item) => pathname.startsWith(item.to));

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="grid grid-cols-5 items-end gap-1 px-2 pt-1 pb-1">
        {PRIMARY_ITEMS.slice(0, 2).map((item) => (
          <BottomNavLink key={item.to} {...item} />
        ))}

        <div className="flex justify-center">
          <Button
            isIconOnly
            aria-label="Quick capture"
            onPress={() => openQuickCapture()}
            className="-mt-5 size-14 rounded-full bg-accent text-accent-foreground shadow-lg"
          >
            <Plus className="size-6" aria-hidden />
          </Button>
        </div>

        <BottomNavLink {...PRIMARY_ITEMS[2]} />

        <button
          type="button"
          onClick={() => setIsMoreOpen(true)}
          aria-label="More navigation"
          aria-pressed={isMoreOpen}
          className={cn(
            'flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg py-1 text-[11px] font-medium transition-colors',
            moreIsActive ? 'text-accent' : 'text-muted hover:text-foreground',
          )}
        >
          <Ellipsis className="size-5" aria-hidden />
          More
        </button>
      </div>

      <Drawer.Backdrop isOpen={isMoreOpen} onOpenChange={setIsMoreOpen}>
        <Drawer.Content placement="bottom">
          <Drawer.Dialog className="max-h-[80dvh]">
            <Drawer.Handle />
            <Drawer.Header>
              <Drawer.Heading>More</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body className="overflow-y-auto">
              <nav aria-label="More navigation" className="flex flex-col gap-1">
                {MORE_ITEMS.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsMoreOpen(false)}
                      data-module={item.module}
                      className={({ isActive }) =>
                        cn(
                          'nav-module flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                          isActive
                            ? 'nav-module-active'
                            : 'text-muted hover:bg-surface-secondary/60 hover:text-foreground',
                        )
                      }
                    >
                      <Icon className="nav-module-icon size-4 shrink-0" aria-hidden />
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </nav>
  );
}

function BottomNavLink({
  to,
  label,
  icon: Icon,
  module,
}: {
  to: string;
  label: string;
  icon: typeof Sun;
  module: string;
}) {
  return (
    <NavLink
      to={to}
      data-module={module}
      className={({ isActive }) =>
        cn(
          'nav-module flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg py-1 text-[11px] font-medium transition-colors',
          isActive ? 'nav-module-active' : 'text-muted hover:text-foreground',
        )
      }
    >
      <Icon className="nav-module-icon size-5" aria-hidden />
      {label}
    </NavLink>
  );
}
