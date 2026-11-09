import { dueLabel, isDueToday, isOverdue } from '@/lib/date';
import { projectProgress } from '@/features/projects/progress';
import type { InboxItem, Note, Project, Task, TaskPriority } from '@/types';

export type AssistantContext = {
  tasks: Task[];
  projects: Project[];
  notes: Note[];
  inbox: InboxItem[];
};

const PRIORITY_RANK: Record<TaskPriority, number> = { low: 1, medium: 2, high: 3 };

const FALLBACK =
  'I can summarize your day, suggest what to focus on, or walk through a project. Try one of the suggestions.';

function focusReply(ctx: AssistantContext, now: Date): string {
  const projectNames = new Map(ctx.projects.map((project) => [project.id, project.name]));

  const rank = (task: Task) => {
    if (isOverdue(task, now)) return 0;
    if (isDueToday(task, now)) return 1;
    if (task.priority === 'high') return 2;
    return 3;
  };

  const candidates = ctx.tasks
    .filter((task) => task.status !== 'done' && rank(task) < 3)
    .sort(
      (a, b) =>
        rank(a) - rank(b) ||
        PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] ||
        a.title.localeCompare(b.title),
    )
    .slice(0, 3);

  if (candidates.length === 0) {
    return 'Nothing is overdue or due today, so nothing is fighting for your attention. Pick one thing from Upcoming and finish it.';
  }

  const lines = candidates.map((task) => {
    const due = task.dueDate ? dueLabel(task.dueDate, now) : 'no due date';
    const project = task.projectId ? projectNames.get(task.projectId) : undefined;
    return `• ${task.title} — ${due}${project ? ` · ${project}` : ''}`;
  });

  return `Focus on these first:\n${lines.join('\n')}`;
}

function summaryReply(ctx: AssistantContext, now: Date): string {
  const open = ctx.tasks.filter((task) => task.status !== 'done');
  const dueToday = open.filter((task) => isDueToday(task, now)).length;
  const overdue = open.filter((task) => isOverdue(task, now)).length;
  const inProgress = ctx.tasks.filter((task) => task.status === 'in_progress').length;
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString();
  const doneThisWeek = ctx.tasks.filter(
    (task) => task.status === 'done' && task.updatedAt >= weekAgo,
  ).length;

  return [
    'Here is your day in numbers:',
    `• ${dueToday} due today · ${overdue} overdue`,
    `• ${inProgress} in progress · ${doneThisWeek} completed in the last 7 days`,
    `• ${ctx.inbox.length} ${ctx.inbox.length === 1 ? 'item' : 'items'} waiting in the Inbox`,
  ].join('\n');
}

function projectsReply(ctx: AssistantContext): string {
  const active = ctx.projects.filter((project) => project.status === 'active');

  if (active.length === 0) {
    return 'You have no active projects right now. Create one when a goal needs more than a single task.';
  }

  const lines = active.slice(0, 4).map((project) => {
    const progress = projectProgress(project.id, ctx.tasks);
    return `• ${project.name} — ${progress.percent}% (${progress.done}/${progress.total} tasks)`;
  });

  return `Active projects:\n${lines.join('\n')}`;
}

function notesReply(ctx: AssistantContext): string {
  const recent = [...ctx.notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3);

  if (recent.length === 0) {
    return 'You have no notes yet. Capture something and it will show up here.';
  }

  return `Recently updated notes:\n${recent.map((note) => `• ${note.title}`).join('\n')}`;
}

export function generateAssistantReply(
  input: string,
  ctx: AssistantContext,
  now: Date = new Date(),
): string {
  const text = input.toLowerCase();

  if (text.includes('focus') || text.includes('today')) return focusReply(ctx, now);
  if (text.includes('summar') || text.includes('day')) return summaryReply(ctx, now);
  if (text.includes('project')) return projectsReply(ctx);
  if (text.includes('note') || text.includes('find')) return notesReply(ctx);

  return FALLBACK;
}
