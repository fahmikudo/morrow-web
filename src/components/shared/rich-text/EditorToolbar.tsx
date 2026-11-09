import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import {
  Bold,
  Code2,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Table2,
  Underline,
  Undo2,
} from 'lucide-react';
import { Button, Dropdown, Label, Tooltip } from '@heroui/react';

export type EditorToolbarVariant = 'compact' | 'full';

type EditorToolbarProps = {
  editor: Editor | null;
  variant?: EditorToolbarVariant;
  sticky?: boolean;
  /** Scroll offset for the sticky toolbar; defaults to below the top bar. */
  stickyTopClass?: string;
};

export function EditorToolbar({
  editor,
  variant = 'compact',
  sticky = false,
  stickyTopClass = 'top-14',
}: EditorToolbarProps) {
  const state = useEditorState({
    editor,
    selector: (ctx) => {
      const instance = ctx.editor;
      if (!instance) return null;
      return {
        bold: instance.isActive('bold'),
        italic: instance.isActive('italic'),
        underline: instance.isActive('underline'),
        strike: instance.isActive('strike'),
        h1: instance.isActive('heading', { level: 1 }),
        h2: instance.isActive('heading', { level: 2 }),
        bulletList: instance.isActive('bulletList'),
        orderedList: instance.isActive('orderedList'),
        blockquote: instance.isActive('blockquote'),
        codeBlock: instance.isActive('codeBlock'),
        table: instance.isActive('table'),
        canUndo: instance.can().undo(),
        canRedo: instance.can().redo(),
      };
    },
  });

  return (
    <div
      className={
        sticky
          ? `sticky ${stickyTopClass} z-10 flex items-center gap-1 overflow-x-auto border-b border-border bg-surface p-1.5`
          : 'flex items-center gap-1 overflow-x-auto border-b border-border p-1.5'
      }
    >
      <ToolbarButton
        label="Bold"
        icon={Bold}
        isActive={state?.bold ?? false}
        onPress={() => editor?.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        label="Italic"
        icon={Italic}
        isActive={state?.italic ?? false}
        onPress={() => editor?.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        label="Underline"
        icon={Underline}
        isActive={state?.underline ?? false}
        onPress={() => editor?.chain().focus().toggleUnderline().run()}
      />
      <ToolbarButton
        label="Strikethrough"
        icon={Strikethrough}
        isActive={state?.strike ?? false}
        onPress={() => editor?.chain().focus().toggleStrike().run()}
      />

      {variant === 'full' ? (
        <>
          <span className="mx-1 h-5 w-px bg-border" aria-hidden />
          <ToolbarButton
            label="Heading 1"
            icon={Heading1}
            isActive={state?.h1 ?? false}
            onPress={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          />
          <ToolbarButton
            label="Heading 2"
            icon={Heading2}
            isActive={state?.h2 ?? false}
            onPress={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          />
        </>
      ) : null}

      <span className="mx-1 h-5 w-px bg-border" aria-hidden />
      <ToolbarButton
        label="Bullet list"
        icon={List}
        isActive={state?.bulletList ?? false}
        onPress={() => editor?.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        label="Numbered list"
        icon={ListOrdered}
        isActive={state?.orderedList ?? false}
        onPress={() => editor?.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        label="Quote"
        icon={Quote}
        isActive={state?.blockquote ?? false}
        onPress={() => editor?.chain().focus().toggleBlockquote().run()}
      />

      {variant === 'full' ? (
        <>
          <ToolbarButton
            label="Code block"
            icon={Code2}
            isActive={state?.codeBlock ?? false}
            onPress={() => editor?.chain().focus().toggleCodeBlock().run()}
          />
          <TableMenu editor={editor} isActive={state?.table ?? false} />
          <span className="mx-1 h-5 w-px bg-border" aria-hidden />
          <ToolbarButton
            label="Undo"
            icon={Undo2}
            isActive={false}
            isDisabled={!state?.canUndo}
            onPress={() => editor?.chain().focus().undo().run()}
          />
          <ToolbarButton
            label="Redo"
            icon={Redo2}
            isActive={false}
            isDisabled={!state?.canRedo}
            onPress={() => editor?.chain().focus().redo().run()}
          />
        </>
      ) : null}
    </div>
  );
}

type ToolbarButtonProps = {
  label: string;
  icon: typeof Bold;
  isActive: boolean;
  isDisabled?: boolean;
  onPress: () => void;
};

function ToolbarButton({ label, icon: Icon, isActive, isDisabled, onPress }: ToolbarButtonProps) {
  return (
    <Tooltip delay={400}>
      <Button
        isIconOnly
        size="sm"
        variant={isActive ? 'secondary' : 'ghost'}
        aria-label={label}
        aria-pressed={isActive}
        isDisabled={isDisabled}
        onPress={onPress}
        className="shrink-0 text-muted"
      >
        <Icon className="size-4" aria-hidden />
      </Button>
      <Tooltip.Content>
        <p>{label}</p>
      </Tooltip.Content>
    </Tooltip>
  );
}


type TableMenuProps = {
  editor: Editor | null;
  isActive: boolean;
};

function TableMenu({ editor, isActive }: TableMenuProps) {
  const run = (action: string) => {
    if (!editor) return;
    const chain = editor.chain().focus();

    switch (action) {
      case 'insert':
        chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        break;
      case 'row-before':
        chain.addRowBefore().run();
        break;
      case 'row-after':
        chain.addRowAfter().run();
        break;
      case 'column-before':
        chain.addColumnBefore().run();
        break;
      case 'column-after':
        chain.addColumnAfter().run();
        break;
      case 'delete-row':
        chain.deleteRow().run();
        break;
      case 'delete-column':
        chain.deleteColumn().run();
        break;
      case 'toggle-header':
        chain.toggleHeaderRow().run();
        break;
      case 'delete-table':
        chain.deleteTable().run();
        break;
      default:
        break;
    }
  };

  return (
    <Dropdown>
      <Button
        isIconOnly
        size="sm"
        variant={isActive ? 'secondary' : 'ghost'}
        aria-label="Table"
        className="shrink-0 text-muted"
      >
        <Table2 className="size-4" aria-hidden />
      </Button>
      <Dropdown.Popover placement="bottom start" className="min-w-56">
        <Dropdown.Menu onAction={(key) => run(String(key))}>
          <Dropdown.Item id="insert" textValue="Insert table">
            <Label>Insert table (3×3)</Label>
          </Dropdown.Item>
          <Dropdown.Item id="row-before" textValue="Add row above">
            <Label>Add row above</Label>
          </Dropdown.Item>
          <Dropdown.Item id="row-after" textValue="Add row below">
            <Label>Add row below</Label>
          </Dropdown.Item>
          <Dropdown.Item id="column-before" textValue="Add column left">
            <Label>Add column left</Label>
          </Dropdown.Item>
          <Dropdown.Item id="column-after" textValue="Add column right">
            <Label>Add column right</Label>
          </Dropdown.Item>
          <Dropdown.Item id="delete-row" textValue="Delete row">
            <Label>Delete row</Label>
          </Dropdown.Item>
          <Dropdown.Item id="delete-column" textValue="Delete column">
            <Label>Delete column</Label>
          </Dropdown.Item>
          <Dropdown.Item id="toggle-header" textValue="Toggle header row">
            <Label>Toggle header row</Label>
          </Dropdown.Item>
          <Dropdown.Item id="delete-table" textValue="Delete table">
            <Label>Delete table</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
