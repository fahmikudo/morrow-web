import { Link, NavLink } from 'react-router';
import { Badge, Button, Kbd, Popover } from '@heroui/react';
import { Bell, Plus, Search, Sparkles } from 'lucide-react';
import { AccountMenu } from '@/components/layout/AccountMenu';
import { usePageTitle } from '@/components/layout/use-page-title';
import { ReminderRow } from '@/features/reminders/ReminderRow';
import { useReminders } from '@/features/reminders/queries';
import { isServerMode } from '@/services';
import { useUiStore } from '@/stores/ui-store';

/**
 * Global bar: brand and the three primary actions. There is one workspace, so
 * the brand is a plain home link; account actions live in the avatar menu.
 */
export function Topbar() {
  const title = usePageTitle();
  const openQuickCapture = useUiStore((state) => state.openQuickCapture);
  const openCommandPalette = useUiStore((state) => state.openCommandPalette);
  const isAssistantOpen = useUiStore((state) => state.isAssistantOpen);
  const toggleAssistant = useUiStore((state) => state.toggleAssistant);
  const { data: reminders } = useReminders();
  const reminderCount = reminders?.length ?? 0;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="flex h-12 items-center gap-2 px-2 md:px-3">
        <NavLink
          to="/today"
          aria-label="Morrow home"
          className="flex h-9 shrink-0 items-center gap-2 rounded-md px-1.5 transition-colors hover:bg-surface-secondary"
        >
          <img src="/brand/morrow-mark.svg" alt="" className="size-7 shrink-0" />
          <span className="hidden text-[13px] font-semibold text-foreground sm:inline">Morrow</span>
        </NavLink>

        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground md:hidden">
          {title}
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Search everything"
            onPress={openCommandPalette}
            className="hidden h-8 w-60 items-center gap-2 rounded-xl border border-border bg-surface px-2.5 text-xs font-normal text-muted hover:border-accent/60 hover:text-foreground md:flex"
          >
            <Search className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">Search everything</span>
            <Kbd className="ml-auto shrink-0">
              <Kbd.Abbr keyValue="command" />
              <Kbd.Content>K</Kbd.Content>
            </Kbd>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label="Search everything"
            onPress={openCommandPalette}
            className="text-muted md:hidden"
          >
            <Search className="size-4" aria-hidden />
          </Button>

          <Button size="sm" className="h-8 gap-1.5" onPress={() => openQuickCapture()}>
            <Plus className="size-4" aria-hidden />
            <span className="hidden sm:inline">Capture</span>
            <span className="sr-only sm:hidden">Quick capture</span>
          </Button>

          {isServerMode ? (
            <Badge.Anchor>
              <Popover>
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  aria-label="Reminders"
                  className="relative text-muted"
                >
                  <Bell className="size-4" aria-hidden />
                </Button>
                <Popover.Content placement="bottom end" className="w-80">
                  <Popover.Dialog>
                    <Popover.Heading>Reminders</Popover.Heading>
                    {reminderCount === 0 ? (
                      <p className="mt-2 text-xs text-muted">No reminders yet today.</p>
                    ) : (
                      <div className="mt-2 flex flex-col gap-2">
                        {reminders?.map((reminder) => (
                          <ReminderRow key={reminder.id} reminder={reminder} />
                        ))}
                      </div>
                    )}
                    <Link
                      to="/today"
                      className="mt-3 inline-block text-xs text-accent hover:underline"
                    >
                      Open Today
                    </Link>
                  </Popover.Dialog>
                </Popover.Content>
              </Popover>
              {reminderCount > 0 ? (
                <Badge color="danger" size="sm">
                  {reminderCount}
                </Badge>
              ) : null}
            </Badge.Anchor>
          ) : null}

          <Button
            isIconOnly
            size="sm"
            variant={isAssistantOpen ? 'secondary' : 'ghost'}
            aria-label="Toggle assistant"
            aria-pressed={isAssistantOpen}
            onPress={toggleAssistant}
          >
            <Sparkles className="size-4" aria-hidden />
          </Button>

          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
