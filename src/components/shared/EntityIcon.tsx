import {
  Bookmark,
  Bug,
  CalendarDays,
  FileText,
  FolderKanban,
  Inbox,
  Repeat,
  Shapes,
  SquareCheck,
} from 'lucide-react';
import { cn } from '@/lib/cn';

const ENTITY_MAP = {
  task: { icon: SquareCheck, label: 'Task', tone: 'text-module-tasks' },
  story: { icon: Bookmark, label: 'Story', tone: 'text-success' },
  bug: { icon: Bug, label: 'Bug', tone: 'text-danger' },
  inbox: { icon: Inbox, label: 'Inbox item', tone: 'text-module-inbox' },
  project: { icon: FolderKanban, label: 'Project', tone: 'text-module-projects' },
  note: { icon: FileText, label: 'Note', tone: 'text-module-knowledge' },
  event: { icon: CalendarDays, label: 'Event', tone: 'text-module-calendar' },
  area: { icon: Shapes, label: 'Area', tone: 'text-module-areas' },
  habit: { icon: Repeat, label: 'Habit', tone: 'text-module-habits' },
} as const;

export type EntityKind = keyof typeof ENTITY_MAP;

type EntityIconProps = {
  kind: EntityKind;
  className?: string;
};

/** One icon per entity kind, used consistently across rows, cards and search. */
export function EntityIcon({ kind, className }: EntityIconProps) {
  const { icon: Icon, label, tone } = ENTITY_MAP[kind];

  return <Icon role="img" aria-label={label} className={cn('shrink-0', tone, className)} />;
}
