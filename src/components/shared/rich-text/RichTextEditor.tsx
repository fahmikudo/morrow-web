import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table';
import '@/styles/editor.css';
import { cn } from '@/lib/cn';
import { EditorToolbar, type EditorToolbarVariant } from './EditorToolbar';

const MIN_HEIGHT: Record<'sm' | 'lg' | 'full', string> = {
  sm: 'min-h-40',
  lg: 'min-h-[280px]',
  full: 'min-h-[calc(100dvh_-_18rem)]',
};

/** HeroUI/React Aria portals mark their top layer; clicks there are not outside the editor. */
const TOP_LAYER_SELECTOR =
  '[data-react-aria-top-layer="true"], [data-slot="dropdown-popover"], [data-slot="popover-content"], [role="menu"]';

type ToolbarMode = 'inline' | 'floating';

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  label: string;
  variant?: EditorToolbarVariant;
  toolbar?: ToolbarMode;
  /** Borderless, padding-free surface for a document page. */
  plain?: boolean;
  minHeight?: 'sm' | 'lg' | 'full';
  stickyToolbar?: boolean;
  stickyTopClass?: string;
  className?: string;
};

export function RichTextEditor({
  value,
  onChange,
  label,
  variant = 'compact',
  toolbar = 'inline',
  plain = false,
  minHeight = 'sm',
  stickyToolbar = false,
  stickyTopClass,
  className,
}: RichTextEditorProps) {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false },
      }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: `tiptap rich-text ${MIN_HEIGHT[minHeight]}${plain ? ' tiptap--plain' : ''}`,
        'aria-label': label,
      },
    },
    onUpdate: ({ editor: instance }) => onChangeRef.current(instance.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  return (
    <div
      className={cn(
        plain ? 'bg-transparent' : 'rounded-xl border border-border bg-surface',
        className,
      )}
    >
      {toolbar === 'inline' ? (
        <EditorToolbar
          editor={editor}
          variant={variant}
          sticky={stickyToolbar}
          stickyTopClass={stickyTopClass}
        />
      ) : null}
      {toolbar === 'floating' && editor ? (
        <FloatingEditorToolbar editor={editor} variant={variant} />
      ) : null}
      <EditorContent editor={editor} />
    </div>
  );
}

type FloatingEditorToolbarProps = {
  editor: Editor;
  variant: EditorToolbarVariant;
};

type ToolbarAnchor = {
  top: number;
  left: number;
  placement: 'above' | 'below';
};

/**
 * Selection toolbar for the document page. It also appears on an empty text
 * block so block types (headings, lists, tables) remain reachable without a
 * permanent toolbar over the page.
 */
function FloatingEditorToolbar({ editor, variant }: FloatingEditorToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const hasFocusedRef = useRef(false);
  const [anchor, setAnchor] = useState<ToolbarAnchor | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const update = () => {
      if (!hasFocusedRef.current) {
        setAnchor(null);
        return;
      }

      const { selection } = editor.state;
      const { $from } = selection;
      const inTable = editor.isActive('table');
      const emptyBlock =
        selection.empty && $from.parent.isTextblock && $from.parent.content.size === 0;

      if (selection.empty && !emptyBlock && !inTable) {
        setAnchor(null);
        return;
      }

      let rect: DOMRect | null = null;
      if (!selection.empty) {
        const range = window.getSelection();
        if (range && range.rangeCount > 0) {
          rect = range.getRangeAt(0).getBoundingClientRect();
        }
      }

      if (!rect || rect.width === 0) {
        const coords = editor.view.coordsAtPos(selection.empty ? selection.from : selection.to);
        rect = new DOMRect(coords.left, coords.top, 0, coords.bottom - coords.top);
      }

      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setAnchor(null);
        return;
      }

      const above = rect.top > 80;
      setAnchor({
        top: above ? rect.top - 8 : rect.bottom + 8,
        left: rect.left + rect.width / 2,
        placement: above ? 'above' : 'below',
      });
    };

    const handleFocus = () => {
      hasFocusedRef.current = true;
      update();
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (editor.view.dom.contains(target)) return;
      if (toolbarRef.current?.contains(target)) return;
      if (target.closest(TOP_LAYER_SELECTOR)) return;

      hasFocusedRef.current = false;
      setAnchor(null);
    };

    editor.on('selectionUpdate', update);
    editor.on('focus', handleFocus);
    document.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);

    return () => {
      editor.off('selectionUpdate', update);
      editor.off('focus', handleFocus);
      document.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [editor]);

  useLayoutEffect(() => {
    setWidth(toolbarRef.current?.offsetWidth ?? 0);
  }, [anchor]);

  if (!anchor) return null;

  const half = width / 2;
  const margin = 12;
  const left =
    half > 0
      ? Math.min(
          Math.max(anchor.left, half + margin),
          Math.max(half + margin, window.innerWidth - half - margin),
        )
      : anchor.left;

  return (
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label="Text formatting"
      className="fixed z-[60] max-w-[calc(100vw-1.5rem)] overflow-x-auto rounded-xl border border-border bg-surface p-1 shadow-lg"
      style={{
        top: anchor.top,
        left,
        transform:
          anchor.placement === 'above' ? 'translate(-50%, -100%)' : 'translateX(-50%)',
      }}
      onMouseDown={(event) => {
        // Keep the ProseMirror selection/focus while pressing toolbar controls.
        event.preventDefault();
      }}
    >
      <EditorToolbar editor={editor} variant={variant} bare />
    </div>
  );
}
