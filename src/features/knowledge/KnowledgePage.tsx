import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Upload } from 'lucide-react';
import { Button, ListBox, SearchField, Select, toast } from '@heroui/react';
import { AppTag } from '@/components/shared/AppTag';
import { AreaBadge } from '@/components/shared/AreaBadge';
import { EntityIcon } from '@/components/shared/EntityIcon';
import { EmptyState } from '@/components/shared/EmptyState';
import { InsightStrip } from '@/components/shared/InsightStrip';
import { ErrorState } from '@/components/shared/ErrorState';
import { PageHeader } from '@/components/shared/PageHeader';
import { RelativeTime } from '@/components/shared/RelativeTime';
import { SkeletonList } from '@/components/shared/SkeletonList';
import { excerpt, stripHtml } from '@/lib/text';
import { markdownToHtml, parseMarkdownDocument } from '@/lib/markdown';
import { cn } from '@/lib/cn';
import { useAreas } from '@/features/areas/queries';
import { projectKeys, useProjects } from '@/features/projects/queries';
import { searchKeys } from '@/features/search/query-keys';
import { effectiveAreaId } from '@/lib/area';
import { knowledgeInsights } from '@/lib/insights';
import { repositories } from '@/services';
import { noteKeys, useNotes } from './queries';

const ALL_TAGS = 'all';

export function KnowledgePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState(ALL_TAGS);
  const [activeArea, setActiveArea] = useState(ALL_TAGS);

  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const notesQuery = useNotes();
  const { data: projects } = useProjects();
  const { data: areas } = useAreas();
  const areaById = new Map((areas ?? []).map((area) => [area.id, area]));
  const notes = notesQuery.data ?? [];
  const projectNames = new Map((projects ?? []).map((project) => [project.id, project.name]));
  const insights = knowledgeInsights(notes);

  const allTags = [...new Set(notes.flatMap((note) => note.tags))].sort((a, b) =>
    a.localeCompare(b),
  );

  const importMarkdown = async (fileList: FileList | null) => {
    const files = [...(fileList ?? [])].filter(
      (file) => /\.(md|markdown)$/i.test(file.name) || file.type === 'text/markdown',
    );

    if (files.length === 0) {
      toast.danger('Choose a .md or .markdown file');
      return;
    }

    setIsImporting(true);
    let imported = 0;
    const failed: string[] = [];

    for (const file of files) {
      try {
        const parsed = parseMarkdownDocument(await file.text());
        const fallbackTitle = file.name.replace(/\.(md|markdown)$/i, '').trim();
        await repositories.notes.create({
          title: parsed.title ?? (fallbackTitle || 'Untitled note'),
          content: markdownToHtml(parsed.body),
          tags: parsed.tags,
        });
        imported += 1;
      } catch {
        failed.push(file.name);
      }
    }

    if (imported > 0) {
      void queryClient.invalidateQueries({ queryKey: noteKeys.all });
      void queryClient.invalidateQueries({ queryKey: searchKeys.all });
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
      toast.success(`Imported ${imported} markdown note${imported === 1 ? '' : 's'}`);
    }
    if (failed.length > 0) {
      toast.danger(`Could not import ${failed.join(', ')}`);
    }

    setIsImporting(false);
  };

  const needle = query.trim().toLowerCase();
  const visibleNotes = [...notes]
    .filter((note) => activeTag === ALL_TAGS || note.tags.includes(activeTag))
    .filter(
      (note) =>
        activeArea === ALL_TAGS || effectiveAreaId(note, projects ?? []) === activeArea,
    )
    .filter((note) => {
      if (!needle) return true;
      return (
        note.title.toLowerCase().includes(needle) ||
        stripHtml(note.content).toLowerCase().includes(needle) ||
        note.tags.some((tag) => tag.toLowerCase().includes(needle))
      );
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <>
      <PageHeader
        title="Knowledge"
        description="Notes worth keeping — readable now, findable later."
        actions={
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown,text/markdown"
              multiple
              hidden
              onChange={(event) => {
                void importMarkdown(event.currentTarget.files);
                event.currentTarget.value = '';
              }}
            />
            <Button
              variant="secondary"
              isPending={isImporting}
              isDisabled={isImporting}
              aria-label="Import Markdown files"
              onPress={() => fileInputRef.current?.click()}
            >
              <Upload className="size-4" aria-hidden />
              Import .md
            </Button>
            <Button onPress={() => navigate('/knowledge/new')}>
              <Plus className="size-4" aria-hidden />
              New note
            </Button>
          </>
        }
      />

      <InsightStrip
        className="mb-4"
        items={[
          { label: 'Notes', value: insights.notes, hint: 'kept knowledge' },
          { label: 'New this week', value: insights.newThisWeek, tone: 'accent', hint: 'captured' },
          { label: 'Linked to projects', value: insights.linkedToProjects, hint: 'in project context' },
          { label: 'Tags', value: insights.tags, hint: 'distinct topics' },
        ]}
      />

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchField
            value={query}
            onChange={setQuery}
            aria-label="Search notes"
            className="sm:max-w-sm"
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search titles, content, tags" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>

          <Select
            value={activeArea}
            onChange={(value) => setActiveArea((value as string) ?? ALL_TAGS)}
            aria-label="Filter notes by area"
            className="w-40"
          >
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="all" textValue="All areas">
                  All areas
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
        </div>

        {allTags.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <TagFilterButton
              label="All"
              isActive={activeTag === ALL_TAGS}
              onPress={() => setActiveTag(ALL_TAGS)}
            />
            {allTags.map((tag) => (
              <TagFilterButton
                key={tag}
                label={tag}
                isActive={activeTag === tag}
                onPress={() => setActiveTag(tag)}
              />
            ))}
          </div>
        ) : null}
      </div>

      {notesQuery.isPending ? <SkeletonList rows={4} /> : null}
      {notesQuery.isError ? <ErrorState onRetry={() => void notesQuery.refetch()} /> : null}

      {notesQuery.isSuccess && notes.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No notes yet"
          description="Turn an idea into the first note. Formatting, tags, and project links are all optional."
          action={<Button onPress={() => navigate('/knowledge/new')}>Write a note</Button>}
        />
      ) : null}

      {notes.length > 0 && visibleNotes.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No notes match your filters"
          description="Try a different search term or clear the tag filter."
          action={
            <Button
              onPress={() => {
                setQuery('');
                setActiveTag(ALL_TAGS);
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : null}

      {visibleNotes.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleNotes.map((note) => (
            <Link
              key={note.id}
              to={`/knowledge/${note.id}`}
              className="motion-card surface-card flex flex-col gap-2 hover:border-accent/50"
            >
              <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
                <EntityIcon kind="note" className="size-4" />
                <span className="truncate">{note.title || 'Untitled'}</span>
              </h2>
              <p className="line-clamp-3 text-xs leading-relaxed text-muted">
                {excerpt(note.content, 140) || 'Empty note'}
              </p>
              <div className="mt-auto flex flex-wrap items-center gap-1.5">
                {note.projectId && projectNames.get(note.projectId) ? (
                  <AppTag variant="accent">{projectNames.get(note.projectId)}</AppTag>
                ) : note.areaId && areaById.get(note.areaId) ? (
                  <AreaBadge area={areaById.get(note.areaId)!} />
                ) : null}
                {note.tags.map((tag) => (
                  <AppTag key={tag}>{tag}</AppTag>
                ))}
                <RelativeTime iso={note.updatedAt} className="text-xs text-muted" />
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </>
  );
}

function TagFilterButton({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Button
      size="sm"
      variant={isActive ? 'secondary' : 'ghost'}
      aria-pressed={isActive}
      onPress={onPress}
      className={cn('h-7 rounded-full px-3 text-xs', !isActive && 'text-muted')}
    >
      {label}
    </Button>
  );
}
