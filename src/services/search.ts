import { habitCadenceLabel } from '@/lib/habits';
import { excerpt, stripHtml, truncate } from '@/lib/text';
import type { Repositories } from '@/services/repositories/contracts';
import type { SearchResult } from '@/types/search';

const PER_KIND_LIMIT = 5;

const subtitleFrom = (value: string | undefined, fallback: string) =>
  value?.trim() ? truncate(value.trim(), 60) : fallback;

/**
 * Shared search implementation used by the mock repositories. The HTTP
 * implementation asks the server for the same results.
 */
export async function searchAll(repos: Repositories, query: string): Promise<SearchResult[]> {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const [tasks, notes, projects, inbox, areas, habits] = await Promise.all([
    repos.tasks.list(),
    repos.notes.list(),
    repos.projects.list(),
    repos.inbox.list(),
    repos.areas.list(),
    repos.habits.list(),
  ]);

  const projectNames = new Map(projects.map((project) => [project.id, project.name]));

  const taskResults: SearchResult[] = tasks
    .filter(
      (task) =>
        task.title.toLowerCase().includes(needle) ||
        task.key.toLowerCase().includes(needle) ||
        task.labels.some((label) => label.toLowerCase().includes(needle)) ||
        stripHtml(task.description ?? '').toLowerCase().includes(needle),
    )
    .slice(0, PER_KIND_LIMIT)
    .map((task) => ({
      kind: 'task',
      id: task.id,
      title: task.title,
      subtitle: `${task.key} · ${subtitleFrom(
        task.projectId
          ? projectNames.get(task.projectId)
          : stripHtml(task.description ?? ''),
        'Task',
      )}`,
      href: '/tasks',
    }));

  const noteResults: SearchResult[] = notes
    .filter(
      (note) =>
        note.title.toLowerCase().includes(needle) ||
        stripHtml(note.content).toLowerCase().includes(needle) ||
        note.tags.some((tag) => tag.toLowerCase().includes(needle)),
    )
    .slice(0, PER_KIND_LIMIT)
    .map((note) => ({
      kind: 'note',
      id: note.id,
      title: note.title,
      subtitle: subtitleFrom(excerpt(note.content, 60), 'Note'),
      href: `/knowledge/${note.id}`,
    }));

  const projectResults: SearchResult[] = projects
    .filter(
      (project) =>
        project.name.toLowerCase().includes(needle) ||
        stripHtml(project.description ?? '').toLowerCase().includes(needle),
    )
    .slice(0, PER_KIND_LIMIT)
    .map((project) => ({
      kind: 'project',
      id: project.id,
      title: project.name,
      subtitle: `${project.key} · ${subtitleFrom(stripHtml(project.description ?? ''), 'Project')}`,
      href: `/projects/${project.id}`,
    }));

  const inboxResults: SearchResult[] = inbox
    .filter(
      (item) =>
        item.title.toLowerCase().includes(needle) ||
        (item.content ?? '').toLowerCase().includes(needle),
    )
    .slice(0, PER_KIND_LIMIT)
    .map((item) => ({
      kind: 'inbox',
      id: item.id,
      title: item.title,
      subtitle: subtitleFrom(item.content, 'Inbox'),
      href: '/inbox',
    }));

  const habitResults: SearchResult[] = habits
    .filter(
      (habit) =>
        habit.title.toLowerCase().includes(needle) ||
        (habit.description ?? '').toLowerCase().includes(needle),
    )
    .slice(0, PER_KIND_LIMIT)
    .map((habit) => {
      const project = habit.projectId ? projectNames.get(habit.projectId) : undefined;
      return {
        kind: 'habit',
        id: habit.id,
        title: habit.title,
        subtitle: `${habitCadenceLabel(habit)}${project ? ` · ${project}` : ''}`,
        href: '/habits',
      };
    });

  const areaResults: SearchResult[] = areas
    .filter(
      (area) =>
        area.name.toLowerCase().includes(needle) ||
        (area.description ?? '').toLowerCase().includes(needle),
    )
    .slice(0, PER_KIND_LIMIT)
    .map((area) => ({
      kind: 'area',
      id: area.id,
      title: area.name,
      subtitle: subtitleFrom(area.description, 'Area'),
      href: `/areas/${area.id}`,
    }));

  return [
    ...taskResults,
    ...noteResults,
    ...projectResults,
    ...inboxResults,
    ...habitResults,
    ...areaResults,
  ];
}
