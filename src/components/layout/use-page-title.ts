import { useLocation } from 'react-router';

const PAGE_TITLES: Array<{ prefix: string; title: string }> = [
  { prefix: '/today', title: 'Today' },
  { prefix: '/dashboard', title: 'Dashboard' },
  { prefix: '/calendar', title: 'Calendar' },
  { prefix: '/inbox', title: 'Inbox' },
  { prefix: '/tasks', title: 'Tasks' },
  { prefix: '/habits', title: 'Habits' },
  { prefix: '/projects', title: 'Projects' },
  { prefix: '/areas', title: 'Areas' },
  { prefix: '/settings', title: 'Settings' },
  { prefix: '/knowledge', title: 'Knowledge' },
];

export function usePageTitle(): string {
  const { pathname } = useLocation();
  return PAGE_TITLES.find((entry) => pathname.startsWith(entry.prefix))?.title ?? 'Morrow';
}
