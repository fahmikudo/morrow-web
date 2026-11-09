import { useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
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

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  label: string;
  variant?: EditorToolbarVariant;
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
        class: `tiptap rich-text ${MIN_HEIGHT[minHeight]}`,
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
    <div className={cn('rounded-xl border border-border bg-surface', className)}>
      <EditorToolbar
        editor={editor}
        variant={variant}
        sticky={stickyToolbar}
        stickyTopClass={stickyTopClass}
      />
      <EditorContent editor={editor} />
    </div>
  );
}
