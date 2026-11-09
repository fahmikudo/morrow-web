import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { CornerDownLeft, Search, Sparkles } from 'lucide-react';
import { Kbd, Modal } from '@heroui/react';
import { EntityIcon } from '@/components/shared/EntityIcon';
import { cn } from '@/lib/cn';
import { useUiStore } from '@/stores/ui-store';
import type { SearchResult } from '@/types/search';
import { useGlobalSearch } from './use-global-search';

type PaletteAction = {
  kind: 'action';
  id: string;
  title: string;
  subtitle: string;
  run: () => void;
};

type PaletteItem = SearchResult | PaletteAction;

const GROUP_LABELS: Record<SearchResult['kind'], string> = {
  task: 'Tasks',
  note: 'Notes',
  project: 'Projects',
  inbox: 'Inbox',
  area: 'Areas',
  habit: 'Habits',
};

export function CommandPalette() {
  const isOpen = useUiStore((state) => state.isCommandPaletteOpen);
  const closeCommandPalette = useUiStore((state) => state.closeCommandPalette);
  const openTaskPanel = useUiStore((state) => state.openTaskPanel);
  const toggleAssistant = useUiStore((state) => state.toggleAssistant);
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(query), 200);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setDebounced('');
      setActiveIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [debounced]);

  const { data: results = [] } = useGlobalSearch(debounced);

  const actions = useMemo<PaletteAction[]>(
    () => [
      { kind: 'action', id: 'dashboard', title: 'Open dashboard', subtitle: 'Everything at a glance', run: () => navigate('/dashboard') },
      { kind: 'action', id: 'today', title: 'Go to Today', subtitle: 'Daily overview', run: () => navigate('/today') },
      { kind: 'action', id: 'calendar', title: 'Open calendar', subtitle: 'Due dates by month', run: () => navigate('/calendar') },
      { kind: 'action', id: 'habits', title: 'Open habits', subtitle: 'Repeating practice', run: () => navigate('/habits') },
      { kind: 'action', id: 'areas', title: 'Open areas', subtitle: 'Life spaces', run: () => navigate('/areas') },
      { kind: 'action', id: 'inbox', title: 'Open Inbox', subtitle: 'Captured items', run: () => navigate('/inbox') },
      { kind: 'action', id: 'tasks', title: 'New task', subtitle: 'Open the tasks page', run: () => navigate('/tasks') },
      { kind: 'action', id: 'note', title: 'New note', subtitle: 'Open the editor', run: () => navigate('/knowledge/new') },
      { kind: 'action', id: 'settings', title: 'Open settings', subtitle: 'Integrations and AI', run: () => navigate('/settings') },
      { kind: 'action', id: 'assistant', title: 'Open assistant', subtitle: 'Simulated', run: () => toggleAssistant() },
    ],
    [navigate, toggleAssistant],
  );

  const trimmed = query.trim();
  const items: PaletteItem[] = trimmed.length === 0 ? actions : results;

  useEffect(() => {
    document.getElementById(`palette-item-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const activate = (item: PaletteItem) => {
    closeCommandPalette();

    if (item.kind === 'action') {
      item.run();
      return;
    }

    if (item.kind === 'task') {
      openTaskPanel(item.id);
      navigate('/tasks');
      return;
    }

    navigate(item.href);
  };

  return (
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) closeCommandPalette();
      }}
    >
      <Modal.Container placement="top" size="lg">
        <Modal.Dialog className="mt-6 sm:max-w-xl">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 shrink-0 text-muted" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (items.length === 0) return;
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setActiveIndex((index) => (index + 1) % items.length);
                }
                if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  setActiveIndex((index) => (index - 1 + items.length) % items.length);
                }
                if (event.key === 'Enter') {
                  event.preventDefault();
                  const item = items[activeIndex];
                  if (item) activate(item);
                }
              }}
              role="combobox"
              aria-expanded
              aria-controls="palette-results"
              aria-label="Search everything"
              placeholder="Search tasks, notes, projects, inbox…"
              className="h-12 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
            />
            <Kbd className="hidden sm:inline-flex">
              <Kbd.Content>Esc</Kbd.Content>
            </Kbd>
          </div>

          <ul
            id="palette-results"
            role="listbox"
            aria-label="Search results"
            className="max-h-[60vh] overflow-y-auto p-2"
          >
            {trimmed.length === 1 ? (
              <li className="px-3 py-6 text-center text-sm text-muted">Keep typing to search.</li>
            ) : null}

            {trimmed.length >= 2 && items.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted">
                No results for “{trimmed}”
              </li>
            ) : null}

            {items.map((item, index) => {
              const previous = items[index - 1];
              const heading =
                !previous || previous.kind !== item.kind
                  ? item.kind === 'action'
                    ? 'Actions'
                    : GROUP_LABELS[item.kind]
                  : null;

              return (
                <li key={`${item.kind}-${item.id}`}>
                  {heading ? (
                    <p className="px-3 pt-3 pb-1 text-xs font-medium tracking-wide text-muted uppercase">
                      {heading}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    id={`palette-item-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => activate(item)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm',
                      index === activeIndex
                        ? 'bg-surface-secondary text-foreground'
                        : 'text-muted hover:bg-surface-secondary/60',
                    )}
                  >
                    {item.kind === 'action' ? (
                      <Sparkles className="size-4 shrink-0" aria-hidden />
                    ) : (
                      <EntityIcon kind={item.kind} className="size-4" />
                    )}
                    <span className="min-w-0 flex-1 truncate">{item.title}</span>
                    <span className="hidden max-w-48 truncate text-xs text-muted sm:block">
                      {item.subtitle}
                    </span>
                    {index === activeIndex ? (
                      <CornerDownLeft className="size-3.5 shrink-0 text-muted" aria-hidden />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
