import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, BookOpen, Download, Maximize2, Minimize2, Trash2 } from 'lucide-react';
import { Button, FieldError, Input, Label, ListBox, Select, TextField, toast } from '@heroui/react';
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
import { useCreateNote, useDeleteNote, useNote, useUpdateNote } from '../queries';

type Snapshot = {
  title: string;
  tags: string[];
  projectId: string;
  areaId: string;
  html: string;
};

const EMPTY_SNAPSHOT: Snapshot = {
  title: '',
  tags: [],
  projectId: 'none',
  areaId: 'none',
  html: '',
};

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
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [projectId, setProjectId] = useState('none');
  const [areaId, setAreaId] = useState('none');
  const [html, setHtml] = useState('');
  const [titleError, setTitleError] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    const note = noteQuery.data;
    if (!note || loadedNoteId === note.id) return;

    const next: Snapshot = {
      title: note.title,
      tags: note.tags,
      projectId: note.projectId ?? 'none',
      areaId: note.areaId ?? 'none',
      html: note.content,
    };
    setSnapshot(next);
    setTitle(next.title);
    setTags(next.tags);
    setProjectId(next.projectId);
    setAreaId(next.areaId);
    setHtml(next.html);
    setLoadedNoteId(note.id);
  }, [noteQuery.data, loadedNoteId]);

  const isFocusMode = useUiStore((state) => state.isNoteFocusMode);
  const setNoteFocusMode = useUiStore((state) => state.setNoteFocusMode);

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

  const dirty =
    title !== snapshot.title ||
    html !== snapshot.html ||
    projectId !== snapshot.projectId ||
    areaId !== snapshot.areaId ||
    tags.join('\u0000') !== snapshot.tags.join('\u0000');

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError(true);
      return;
    }
    setTitleError(false);
    const cleanedContent = cleanHtml(html);

    try {
      if (isNew) {
        const created = await createNote.mutateAsync({
          title: trimmedTitle,
          content: cleanedContent,
          tags,
          projectId: projectId === 'none' ? undefined : projectId,
          areaId: projectId === 'none' && areaId !== 'none' ? areaId : undefined,
        });
        setSnapshot({
          title: created.title,
          tags: created.tags,
          projectId: created.projectId ?? 'none',
          areaId: created.areaId ?? 'none',
          html: created.content,
        });
        setAreaId(created.areaId ?? 'none');
        setHtml(created.content);
        setLoadedNoteId(created.id);
        navigate(`/knowledge/${created.id}`, { replace: true });
        return;
      }

      if (!noteId) return;

      const updated = await updateNote.mutateAsync({
        id: noteId,
        patch: {
          title: trimmedTitle,
          content: cleanedContent,
          tags,
          projectId: projectId === 'none' ? null : projectId,
          areaId: projectId === 'none' && areaId !== 'none' ? areaId : null,
        },
      });
      setSnapshot({
        title: updated.title,
        tags: updated.tags,
        projectId: updated.projectId ?? 'none',
        areaId: updated.areaId ?? 'none',
        html: updated.content,
      });
      setAreaId(updated.areaId ?? 'none');
      setHtml(updated.content);
    } catch {
      // The mutation hook already surfaced the error as a toast.
    }
  };

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

  const saveRef = useRef(handleSave);

  useEffect(() => {
    saveRef.current = handleSave;
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && !event.shiftKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void saveRef.current();
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
  }, []);

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

  const isSaving = createNote.isPending || updateNote.isPending;
  const wordCount = stripHtml(html).split(/\s+/).filter(Boolean).length;

  return (
    <>
      <div
        className={cn(
          isFocusMode
            ? 'motion-overlay fixed inset-0 z-50 flex flex-col bg-background sm:p-4'
            : 'mx-auto w-full max-w-4xl',
        )}
      >
        <div
          className={cn(
            'flex min-h-0 flex-col bg-surface',
            isFocusMode
              ? 'mx-auto h-full w-full max-w-6xl overflow-hidden border-border sm:rounded-xl sm:border sm:shadow-xl'
              : 'overflow-hidden rounded-xl border border-border shadow-sm',
          )}
        >
          <header
            className={cn(
              'flex shrink-0 items-center justify-between gap-3 border-b border-border px-4',
              isFocusMode ? 'h-14' : 'h-12',
            )}
          >
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
              <span className="hidden text-xs text-muted sm:inline">
                {dirty ? 'Unsaved changes' : isNew ? 'New note' : 'Saved'}
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
              <Button size="sm" isPending={isSaving} onPress={() => void handleSave()}>
                Save
              </Button>
              {isNew ? null : (
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
              )}
            </div>
          </header>

          <div
            className={cn(
              isFocusMode
                ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-8'
                : 'p-4 sm:p-6',
            )}
          >
            <div className={cn('mx-auto flex w-full flex-col gap-4', isFocusMode && 'max-w-4xl')}>
              <TextField
                value={title}
                onChange={(value) => {
                  setTitle(value);
                  if (titleError && value.trim()) setTitleError(false);
                }}
                isInvalid={titleError}
                className="w-full"
              >
                <Label className="sr-only">Note title</Label>
                <Input
                  placeholder="Untitled note"
                  className={cn(
                    'h-auto border-0 bg-transparent px-0 font-semibold shadow-none',
                    isFocusMode ? 'text-3xl' : 'text-2xl',
                  )}
                />
                <FieldError>Title is required</FieldError>
              </TextField>

              <TagInput tags={tags} onChange={setTags} />

              <div className="flex flex-col gap-2 sm:flex-row">
                <Select
                  value={projectId}
                  onChange={(value) => setProjectId((value as string) ?? 'none')}
                  aria-label="Link note to a project"
                  className="w-full sm:w-56"
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
                    className="w-full sm:w-56"
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

              <RichTextEditor
                key={loadedNoteId ?? 'new'}
                value={snapshot.html}
                onChange={setHtml}
                label="Note content"
                variant="full"
                minHeight={isFocusMode ? 'full' : 'lg'}
                stickyToolbar={isFocusMode}
                stickyTopClass="top-0"
              />

              {!isNew && noteId ? (
                <AttachmentsPanel entityType="note" entityId={noteId} />
              ) : null}
            </div>
          </div>

          <footer
            className={cn(
              'flex shrink-0 items-center justify-between gap-2 border-t border-border px-4 text-xs text-muted',
              isFocusMode ? 'h-11' : 'h-10',
            )}
          >
            <span className="truncate">
              ⌘S to save · {isFocusMode ? 'Esc collapses' : '⌘⇧F for full screen'}
            </span>
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
          if (!noteId) return;
          deleteNote.mutate(noteId, {
            onSuccess: () => navigate('/knowledge', { replace: true }),
          });
        }}
      />
    </>
  );
}
