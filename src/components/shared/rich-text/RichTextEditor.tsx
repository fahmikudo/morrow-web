import { useEffect, useRef } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table';
import '@/styles/editor.css';
import { cn } from '@/lib/cn';
import { EditorToolbar, type EditorToolbarVariant } from './EditorToolbar';

const MIN_HEIGHT: Record<'sm' | 'lg', string> = {
  sm: 'min-h-40',
  lg: 'min-h-[280px]',
};

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  label: string;
  variant?: EditorToolbarVariant;
  /** Borderless, padding-free surface for a document page. */
  plain?: boolean;
  minHeight?: 'sm' | 'lg';
  stickyToolbar?: boolean;
  stickyTopClass?: string;
  /** Hint shown inside the empty document, in place of a text cursor prompt. */
  placeholder?: string;
  /** Focus the caret at the end on mount; used after a note is first saved. */
  autoFocus?: boolean;
  /** Called once the editor has taken focus, so the caller can clear the request. */
  onAutoFocus?: () => void;
  className?: string;
};

export function RichTextEditor({
  value,
  onChange,
  label,
  variant = 'compact',
  plain = false,
  minHeight = 'sm',
  stickyToolbar = false,
  stickyTopClass,
  placeholder,
  autoFocus = false,
  onAutoFocus,
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

  const autoFocusRef = useRef(autoFocus);
  const onAutoFocusRef = useRef(onAutoFocus);

  useEffect(() => {
    onAutoFocusRef.current = onAutoFocus;
  }, [onAutoFocus]);

  useEffect(() => {
    if (!editor || !autoFocusRef.current) return;
    autoFocusRef.current = false;
    editor.commands.focus('end');
    onAutoFocusRef.current?.();
  }, [editor]);

  const isEmpty = useEditorState({
    editor,
    selector: ({ editor: instance }) => instance?.isEmpty ?? true,
  });

  return (
    <div
      className={cn(
        plain ? 'bg-transparent' : 'rounded-xl border border-border bg-surface',
        className,
      )}
    >
      <EditorToolbar
        editor={editor}
        variant={variant}
        sticky={stickyToolbar}
        stickyTopClass={stickyTopClass}
      />
      <div className="relative">
        <EditorContent editor={editor} />
        {placeholder && isEmpty ? (
          <p
            aria-hidden
            className={cn(
              'pointer-events-none absolute select-none text-base leading-[1.7] text-muted',
              plain ? 'inset-x-0 top-0' : 'top-4 right-5 left-5',
            )}
          >
            {placeholder}
          </p>
        ) : null}
      </div>
    </div>
  );
}
