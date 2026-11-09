import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowDown, Copy, Send, Sparkles, Trash2, X } from 'lucide-react';
import { Button, Drawer, toast } from '@heroui/react';
import { useQueryClient } from '@tanstack/react-query';
import { AppTag } from '@/components/shared/AppTag';
import { EntityIcon } from '@/components/shared/EntityIcon';
import { useHabitCheckIns, useHabits } from '@/features/habits/queries';
import { useInboxItems } from '@/features/inbox/queries';
import { taskKeys, useTasks } from '@/features/tasks/queries';
import { useIsDesktop } from '@/hooks/use-media-query';
import { formatTime, isOverdue, todayIso } from '@/lib/date';
import { habitProgress } from '@/lib/habits';
import { createId } from '@/lib/id';
import { cn } from '@/lib/cn';
import { useUiStore } from '@/stores/ui-store';
import { repositories } from '@/services';
import { useSettings } from '@/features/settings/queries';
import { ASSISTANT_REASON_COPY, type AssistantMessage } from './types';

const SUGGESTIONS = [
  {
    title: 'Summarize my day',
    description: 'Due, overdue, in-progress and inbox counts',
    prompt: 'Summarize my day',
  },
  {
    title: 'What should I focus on?',
    description: 'The overdue and high-priority work first',
    prompt: 'What should I focus on?',
  },
  {
    title: 'Walk through my active projects',
    description: 'Progress across every active project',
    prompt: 'Walk through my active projects',
  },
];

const QUICK_PROMPTS = SUGGESTIONS.map((suggestion) => suggestion.prompt);

export function AssistantPanel() {
  const isDesktop = useIsDesktop();
  const isOpen = useUiStore((state) => state.isAssistantOpen);
  const closeAssistant = useUiStore((state) => state.closeAssistant);
  const clearAssistantMessages = useUiStore((state) => state.clearAssistantMessages);
  const messages = useUiStore((state) => state.assistantMessages);
  const appendMessage = useUiStore((state) => state.appendAssistantMessage);

  const { data: tasks = [] } = useTasks();
  const { data: inbox = [] } = useInboxItems();
  const { data: habits = [] } = useHabits();
  const { data: checkIns = [] } = useHabitCheckIns();

  const { data: settings } = useSettings();
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const today = todayIso();
  const openTasks = tasks.filter((task) => task.status !== 'done').length;
  const overdueTasks = tasks.filter((task) => isOverdue(task)).length;
  const habitsOnTrack = habits.filter(
    (habit) => habitProgress(habit, checkIns, today).met,
  ).length;

  const scrollToLatest = (behavior: ScrollBehavior = 'smooth') => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior });
  };

  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => {
      scrollToLatest('auto');
      setIsNearBottom(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    if (isNearBottom) scrollToLatest();
  }, [messages.length, isThinking, isNearBottom]);

  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = 'auto';
    node.style.height = `${Math.min(node.scrollHeight, 128)}px`;
  }, [draft]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || isThinking) return;

    appendMessage({
      id: createId('m'),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    });
    setDraft('');
    setIsThinking(true);
    setIsNearBottom(true);

    try {
      const reply = await repositories.assistant.reply(content, todayIso());

      appendMessage({
        id: createId('m'),
        role: 'assistant',
        content: reply.reply,
        sources: reply.sources,
        ...(reply.created.length > 0 ? { created: reply.created } : {}),
        ...(reply.reason ? { reason: reply.reason } : {}),
        createdAt: new Date().toISOString(),
      });

      if (reply.created.length > 0) {
        void queryClient.invalidateQueries({ queryKey: taskKeys.all });
      }
    } catch {
      appendMessage({
        id: createId('m'),
        role: 'assistant',
        content: "I couldn't reach the server. Try again when you're online.",
        createdAt: new Date().toISOString(),
      });
    } finally {
      setIsThinking(false);
    }
  };

  const copyMessage = async (message: AssistantMessage) => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success('Copied to clipboard');
    } catch {
      toast.danger('Clipboard is unavailable');
    }
  };

  const body = (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <header className="flex shrink-0 items-start gap-2.5 border-b border-border px-4 py-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <Sparkles className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Assistant</h2>
            <AppTag>{settings?.ai.enabled ? 'AI' : 'Derived'}</AppTag>
          </div>
          <p className="text-xs text-muted">Answers are grounded in your synced data.</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label="Clear conversation"
            isDisabled={messages.length <= 1}
            onPress={() => {
              clearAssistantMessages();
              toast.success('Conversation cleared');
            }}
            className="text-muted"
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label="Close assistant"
            onPress={closeAssistant}
            className="text-muted"
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-border bg-surface-secondary/40 px-4 py-1.5 text-[11px] text-muted">
        <span>{openTasks} open tasks</span>
        <span aria-hidden>·</span>
        <span className={overdueTasks > 0 ? 'text-danger' : undefined}>
          {overdueTasks} overdue
        </span>
        <span aria-hidden>·</span>
        <span>
          {habitsOnTrack}/{habits.length} habits on track
        </span>
        <span aria-hidden>·</span>
        <span>{inbox.length} inbox</span>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          ref={scrollRef}
          onScroll={(event) => {
            const node = event.currentTarget;
            setIsNearBottom(node.scrollHeight - node.scrollTop - node.clientHeight < 48);
          }}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          <div className="flex flex-col gap-4 px-4 py-4">
            {messages.map((message, index) => {
              const previous = messages[index - 1];
              const showAvatar = !previous || previous.role !== message.role;

              return (
                <MessageRow
                  key={message.id}
                  message={message}
                  showAvatar={showAvatar}
                  onCopy={() => void copyMessage(message)}
                />
              );
            })}

            {isThinking ? <TypingRow /> : null}
          </div>
        </div>

        {!isNearBottom ? (
          <Button
            size="sm"
            variant="secondary"
            aria-label="Jump to latest message"
            onPress={() => scrollToLatest()}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full shadow-md"
          >
            <ArrowDown className="size-3.5" aria-hidden />
            Latest
          </Button>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-border px-4 py-3">
        {messages.length <= 1 ? (
          <div className="mb-3 flex flex-col gap-2">
            <p className="section-label">Try asking</p>
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion.prompt}
                type="button"
                onClick={() => void send(suggestion.prompt)}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-left transition-colors hover:border-accent/50 hover:bg-accent-soft"
              >
                <span className="block text-sm font-medium text-foreground">
                  {suggestion.title}
                </span>
                <span className="block text-xs text-muted">{suggestion.description}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((prompt) => (
              <Button
                key={prompt}
                size="sm"
                variant="secondary"
                onPress={() => void send(prompt)}
                className="h-7 rounded-full px-3 text-xs"
              >
                {prompt}
              </Button>
            ))}
          </div>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send(draft);
          }}
          className="flex items-end gap-2"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void send(draft);
              }
            }}
            aria-label="Message the assistant"
            placeholder="Ask about your day, projects, or habits…"
            className="max-h-32 min-h-10 flex-1 resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus-visible:border-accent"
          />
          <Button
            isIconOnly
            type="submit"
            aria-label="Send message"
            isDisabled={!draft.trim() || isThinking}
          >
            <Send className="size-4" aria-hidden />
          </Button>
        </form>
        <p className="mt-1.5 text-[11px] text-muted">
          Enter to send · Shift+Enter for a new line
        </p>
      </div>
    </div>
  );

  if (isDesktop) {
    if (!isOpen) return null;
    return (
      <aside
        aria-label="Assistant"
        className="fixed top-14 right-0 bottom-0 z-30 hidden w-96 flex-col border-l border-border bg-surface lg:flex"
      >
        {body}
      </aside>
    );
  }

  return (
    <Drawer.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) closeAssistant();
      }}
    >
      <Drawer.Content placement="bottom">
        <Drawer.Dialog className="h-[90dvh]">
          <Drawer.Handle />
          <Drawer.Body className="flex min-h-0 flex-col p-0">{body}</Drawer.Body>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}

function MessageRow({
  message,
  showAvatar,
  onCopy,
}: {
  message: AssistantMessage;
  showAvatar: boolean;
  onCopy: () => void;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-2', isUser ? 'justify-end' : 'justify-start')}>
      {isUser ? null : (
        <span
          className={cn(
            'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full',
            showAvatar ? 'bg-accent-soft text-accent' : 'opacity-0',
          )}
          aria-hidden
        >
          <Sparkles className="size-3.5" />
        </span>
      )}

      <div className={cn('flex min-w-0 max-w-[85%] flex-col gap-1', isUser && 'items-end')}>
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line',
            isUser
              ? 'rounded-br-md bg-accent text-accent-foreground'
              : 'rounded-bl-md bg-surface-secondary text-foreground',
          )}
        >
          {message.content}
        </div>
        {!isUser && message.sources && message.sources.length > 0 ? (
          <div className="flex flex-col gap-1">
            {message.sources.map((source) => (
              <Link
                key={`${source.kind}-${source.id}`}
                to={source.href}
                className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted transition-colors hover:text-foreground"
              >
                <EntityIcon kind={source.kind} className="size-3.5" />
                <span className="truncate">{source.title}</span>
              </Link>
            ))}
          </div>
        ) : null}
        {!isUser && message.created && message.created.length > 0 ? (
          <div className="mt-0.5 flex flex-col gap-1 rounded-xl border border-border bg-surface p-2">
            <p className="section-label">Created tasks</p>
            {message.created.map((entry) => (
              <Link
                key={entry.id}
                to="/tasks"
                className="flex min-w-0 items-center gap-2 text-xs text-muted transition-colors hover:text-foreground"
              >
                <span className="shrink-0 font-mono text-[10px] text-muted">{entry.key}</span>
                <span className="truncate">{entry.title}</span>
              </Link>
            ))}
          </div>
        ) : null}
        {!isUser && message.reason ? (
          <p className="text-[11px] text-muted">{ASSISTANT_REASON_COPY[message.reason]}</p>
        ) : null}
        <div className="flex items-center gap-1 text-[11px] text-muted">
          <span>{formatTime(message.createdAt)}</span>
          {isUser ? null : (
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label="Copy reply"
              onPress={onCopy}
              className="size-5 text-muted"
            >
              <Copy className="size-3" aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function TypingRow() {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Sparkles className="size-3.5" aria-hidden />
      </span>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-surface-secondary px-3.5 py-3">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-1.5 animate-bounce rounded-full bg-muted"
            style={{ animationDelay: `${delay}ms` }}
            aria-hidden
          />
        ))}
        <span className="sr-only">Assistant is thinking</span>
      </div>
    </div>
  );
}
