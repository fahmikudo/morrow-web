import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, BookOpen, Download, Maximize2, Minimize2, Trash2 } from 'lucide-react';
import { Button, Input, Label, ListBox, Select, TextField, toast } from '@heroui/react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { RichTextEditor } from '@/components/shared/rich-text/RichTextEditor';
import { cleanHtml, stripHtml } from '@/lib/text';
import { markdownFileName, noteToMarkdown } from '@/lib/markdown';
import { SkeletonList } from '@/components/shared/SkeletonList';
import { useAreas } from '@/features/areas/queries';
import { useProjects } from '@/features/projects/queries';
import { useUiStore } from '@/stores/ui-store';
import { cn } from '@/lib/cn';
import { TagInput } from '@/components/shared/TagInput';
import { AttachmentsPanel } from '@/features/attachments/AttachmentsPanel';
import type { Note } from '@/types';
import { useCreateNote, useDeleteNote, useNote, useUpdateNote } from '../queries';

type Snapshot = {
  title: string;
  tags: string[];
  projectId: string;
  areaId: string;
  html: string;
  updatedAt: string;
};

const EMPTY_SNAPSHOT: Snapshot = {
  title: '',
  tags: [],
  projectId: 'none',
  areaId: 'none',
  html: '',
  updatedAt: '',
};

const AUTOSAVE_MS = 900;

function snapshotFrom(note: Note): Snapshot {
  return {
    title: note.title,
    tags: note.tags,
    projectId: note.projectId ?? 'none',
    areaId: note.areaId ?? 'none',
    html: cleanHtml(note.content),
    updatedAt: note.updatedAt,
  };
}

export function NoteEditorPage() {
  const { noteId } = useParams();
  const isNew = !noteId;
  const navigate = useNavigate();

  const noteQuery = useNote(noteId);
  const { data: projects } = useProjects();
  const { data: areas } = useAreas();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY_SNAPSHOT);
  const [loadedNoteId, setLoadedNoteId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(noteId ?? null);
  const savedIdRef = useRef<string | null>(noteId ?? null);

  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [projectId, setProjectId] = useState('none');
  const [areaId, setAreaId] = useState('none');
  const [html, setHtml] = useState('');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const mountedRef = useRef(true);
  const deletingRef = useRef(false);
  const saveCountRef = useRef(0);
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());
  const saveImplRef = useRef<(silent: boolean) => Promise<void>>(async () => {});

  const isFocusMode = useUiStore((state) => state.isNoteFocusMode);
  const setNoteFocusMode = useUiStore((state) => state.setNoteFocusMode);

  const normalizedTitle = title.trim();
  const normalizedHtml = cleanHtml(html);
  const dirty =
    normalizedTitle !== snapshot.title ||
    normalizedHtml !== snapshot.html ||
    projectId !== snapshot.projectId ||
    areaId !== snapshot.areaId ||
    tags.join('\u0000') !== snapshot.tags.join('\u0000');
  const dirtyRef = useRef(dirty);

  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  useEffect(() => {
    const note = noteQuery.data;
    if (!note) return;

    const same = loadedNoteId === note.id;
    if (same) {
      if (dirty) return;
      if (snapshot.updatedAt === note.updatedAt) return;
    }

    const next = snapshotFrom(note);
    setSnapshot(next);
    setTitle(next.title);
    setTags(next.tags);
    setProjectId(next.projectId);
    setAreaId(next.areaId);
    setHtml(note.content);
    savedIdRef.current = note.id;
    setSavedId(note.id);
    setLoadedNoteId(note.id);
  }, [noteQuery.data, loadedNoteId, dirty, snapshot.updatedAt]);

  useEffect(() => () => setNoteFocusMode(false), [setNoteFocusMode]);

  useEffect(() => {
    if (!isFocusMode) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
    };
  }, [isFocusMode]);

  const saveNow = async (silent: boolean) => {
    if (deletingRef.current) return;

    const content = cleanHtml(html);
    const projectValue = projectId === 'none' ? null : projectId;
    const areaValue = projectId === 'none' && areaId !== 'none' ? areaId : null;
    const currentId = savedIdRef.current;

    if (!currentId && !title.trim() && !stripHtml(html).trim()) return;

    saveCountRef.current += 1;
    if (mountedRef.current) setIsSaving(true);

    try {
      if (!currentId) {
        const created = await createNote.mutateAsync({
          input: {
            title: title.trim(),
            content,
            tags,
            projectId: projectValue ?? undefined,
            areaId: areaValue ?? undefined,
          },
          silent,
        });
        savedIdRef.current = created.id;
        if (mountedRef.current) {
          setSavedId(created.id);
          setLoadedNoteId(created.id);
          setSnapshot(snapshotFrom(created));
          navigate(`/knowledge/${created.id}`, { replace: true });
        }
        return;
      }

      const updated = await updateNote.mutateAsync({
        id: currentId,
        patch: {
          title: title.trim(),
          content,
          tags,
          projectId: projectValue,
          areaId: areaValue,
        },
        silent,
      });
      if (mountedRef.current) setSnapshot(snapshotFrom(updated));
    } catch {
      // The mutation hook already surfaced the error as a toast.
    } finally {
      saveCountRef.current -= 1;
      if (saveCountRef.current === 0 && mountedRef.current) setIsSaving(false);
    }
  };

  useEffect(() => {
    saveImplRef.current = saveNow;
  });

  const enqueueSave = useCallback((silent: boolean) => {
    saveChainRef.current = saveChainRef.current
      .then(() => saveImplRef.current(silent))
      .catch(() => {});
    return saveChainRef.current;
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const timer = window.setTimeout(() => {
      void enqueueSave(true);
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [dirty, title, html, tags, projectId, areaId, enqueueSave]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (dirtyRef.current && !deletingRef.current) void enqueueSave(true);
    };
  }, [enqueueSave]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && dirtyRef.current && !deletingRef.current) {
        void enqueueSave(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [enqueueSave]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && !event.shiftKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void enqueueSave(false);
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        useUiStore.getState().toggleNoteFocusMode();
        return;
      }

      if (event.key === 'Escape' && useUiStore.getState().isNoteFocusMode) {
        useUiStore.getState().setNoteFocusMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enqueueSave]);

  useEffect(() => {
    if (!dirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty]);

  if (!isNew && noteQuery.isPending) return <SkeletonList rows={4} />;
  if (!isNew && noteQuery.isError) return <ErrorState onRetry={() => void noteQuery.refetch()} />;

  if (!isNew && noteQuery.isSuccess && !noteQuery.data) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Note not found"
        description="This note may have been deleted. Head back to Knowledge to keep writing."
        action={<Button onPress={() => navigate('/knowledge')}>Back to Knowledge</Button>}
      />
    );
  }

  if (!isNew && noteQuery.data && loadedNoteId !== noteQuery.data.id) {
    return <SkeletonList rows={4} />;
  }

  const currentNoteId = savedId ?? noteId ?? null;
  const wordCount = stripHtml(html).split(/\s+/).filter(Boolean).length;
  const status = isSaving ? 'Saving…' : dirty ? 'Unsaved changes' : currentNoteId ? 'Saved' : 'New page';

  const handleExport = () => {
    const exportTitle = title.trim() || 'Untitled note';
    const markdown = noteToMarkdown({
      title: exportTitle,
      tags,
      content: cleanHtml(html),
    });
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = markdownFileName(exportTitle);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast.success('Markdown exported');
  };

  return (
    <>
      <div
        className={cn(
          isFocusMode ? 'motion-overlay fixed inset-0 z-50 overflow-y-auto bg-background' : '',
        )}
      >
        <div
          className={cn(
            'mx-auto flex w-full max-w-3xl flex-col',
            isFocusMode ? 'px-4 py-6 pb-16 sm:px-8 sm:py-10' : '',
          )}
        >
          <header className="mb-6 flex flex-wrap items-center justify-between gap-2">
            {isFocusMode ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted"
                aria-label="Collapse to page"
                onPress={() => setNoteFocusMode(false)}
              >
                <Minimize2 className="size-4" aria-hidden />
                <span className="hidden sm:inline">Collapse</span>
              </Button>
            ) : (
              <Link
                to="/knowledge"
                className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
              >
                <ArrowLeft className="size-4" aria-hidden />
                Knowledge
              </Link>
            )}

            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'text-xs',
                  isSaving ? 'text-accent' : dirty ? 'text-warning' : 'text-muted',
                )}
                aria-live="polite"
              >
                {status}
              </span>
              {isFocusMode ? null : (
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  aria-label="Expand to full screen"
                  className="text-muted"
                  onPress={() => setNoteFocusMode(true)}
                >
                  <Maximize2 className="size-4" aria-hidden />
                </Button>
              )}
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label="Export as Markdown"
                className="text-muted"
                onPress={handleExport}
              >
                <Download className="size-4" aria-hidden />
              </Button>
              {currentNoteId ? (
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  aria-label="Delete note"
                  onPress={() => setIsDeleteOpen(true)}
                  className="text-muted"
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              ) : null}
            </div>
          </header>

          <div className="flex flex-col gap-4">
            <TextField value={title} onChange={setTitle} className="w-full">
              <Label className="sr-only">Page title</Label>
              <Input
                autoFocus={isNew}
                placeholder="Untitled"
                className="h-auto border-0 bg-transparent px-0 text-3xl font-semibold tracking-tight shadow-none sm:text-4xl"
              />
            </TextField>

            <div className="flex flex-col gap-2">
              <TagInput tags={tags} onChange={setTags} />

              <div className="flex flex-wrap gap-2">
                <Select
                  value={projectId}
                  onChange={(value) => setProjectId((value as string) ?? 'none')}
                  aria-label="Link note to a project"
                  className="w-52"
                >
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="none" textValue="No project">
                        No project
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      {(projects ?? []).map((project) => (
                        <ListBox.Item key={project.id} id={project.id} textValue={project.name}>
                          {project.name}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>

                {projectId === 'none' ? (
                  <Select
                    value={areaId}
                    onChange={(value) => setAreaId((value as string) ?? 'none')}
                    aria-label="Link note to an area"
                    className="w-52"
                  >
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        <ListBox.Item id="none" textValue="No area">
                          No area
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        {(areas ?? []).map((area) => (
                          <ListBox.Item key={area.id} id={area.id} textValue={area.name}>
                            {area.name}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                ) : null}
              </div>
            </div>

            <RichTextEditor
              key={loadedNoteId ?? 'new'}
              value={html}
              onChange={setHtml}
              label="Page content"
              variant="full"
              toolbar="floating"
              plain
              minHeight="lg"
            />

            {currentNoteId ? (
              <div className="border-t border-border pt-5">
                <AttachmentsPanel entityType="note" entityId={currentNoteId} />
              </div>
            ) : null}
          </div>

          <footer className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted">
            <span className="hidden truncate sm:block">
              Select text for formatting · # heading · - list · ⌘S saves now
            </span>
            <span className="truncate sm:hidden">⌘S saves · select text to format</span>
            <span className="shrink-0">{wordCount} words</span>
          </footer>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete this note?"
        description="The note will be removed permanently."
        confirmLabel="Delete note"
        isDanger
        isPending={deleteNote.isPending}
        onConfirm={() => {
          if (!currentNoteId) return;
          deletingRef.current = true;
          deleteNote.mutate(currentNoteId, {
            onSuccess: () => navigate('/knowledge', { replace: true }),
            onError: () => {
              deletingRef.current = false;
            },
          });
        }}
      />
    </>
  );
}
