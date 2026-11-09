import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { BottomNav } from '@/components/layout/BottomNav';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { Topbar } from '@/components/layout/Topbar';
import { AssistantPanel } from '@/features/assistant/AssistantPanel';
import { QuickCaptureDialog } from '@/features/inbox/QuickCaptureDialog';
import { CommandPalette } from '@/features/search/CommandPalette';
import { TaskDetailPanel } from '@/features/tasks/TaskDetailPanel';
import { useUiStore } from '@/stores/ui-store';

export function AppShell() {
  const location = useLocation();
  const isOffline = useUiStore((state) => state.isOffline);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const store = useUiStore.getState();

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (store.isCommandPaletteOpen) store.closeCommandPalette();
        else store.openCommandPalette();
        return;
      }

      if (event.key === 'Escape') {
        if (store.isCommandPaletteOpen) store.closeCommandPalette();
        if (store.isAssistantOpen) store.closeAssistant();
        if (store.selectedTaskId) store.closeTaskPanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:shadow-lg"
      >
        Skip to content
      </a>

      <Topbar />

      {isOffline ? (
        <p
          role="status"
          className="border-b border-border bg-warning-soft px-4 py-2 text-xs text-warning md:px-6"
        >
          Offline — showing last synced data. Changes are disabled.
        </p>
      ) : null}

      <div className="flex">
        <SidebarNav />
        <div className="flex min-w-0 flex-1 flex-col">
          <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
            <div className="page-container">
              <div key={location.pathname} className="motion-page">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>

      <BottomNav />
      <QuickCaptureDialog />
      <CommandPalette />
      <AssistantPanel />
      <TaskDetailPanel />
    </div>
  );
}
