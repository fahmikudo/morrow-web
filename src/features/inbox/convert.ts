import type { Repositories } from '@/services';
import { toNoteHtml, toTaskDescription } from '@/lib/text';

export type ConversionResult =
  | { kind: 'task'; id: string }
  | { kind: 'note'; id: string };

/** Converts an inbox item into a task or note, archiving (never deleting) the source. */
export async function convertInboxItem(
  repos: Repositories,
  id: string,
  target: 'note' | 'task',
): Promise<ConversionResult> {
  const item = await repos.inbox.get(id);
  if (!item) throw new Error('Inbox item not found');

  if (target === 'task') {
    const created = await repos.tasks.create({
      title: item.title,
      description: toTaskDescription(item.content),
      status: 'todo',
      priority: 'medium',
    });
    await repos.inbox.archive(id);
    return { kind: 'task', id: created.id };
  }

  const created = await repos.notes.create({
    title: item.title,
    content: toNoteHtml(item.content),
    tags: [],
  });
  await repos.inbox.archive(id);
  return { kind: 'note', id: created.id };
}
