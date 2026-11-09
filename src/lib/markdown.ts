import { marked } from 'marked';
import TurndownService from 'turndown';

/** Markdown file with optional YAML frontmatter parsed into note fields. */
export type MarkdownDocument = {
  title?: string;
  tags: string[];
  body: string;
};

const FRONTMATTER_OPEN = '---';

const ALLOWED_TAGS = new Set([
  'P',
  'BR',
  'H1',
  'H2',
  'H3',
  'UL',
  'OL',
  'LI',
  'BLOCKQUOTE',
  'PRE',
  'CODE',
  'STRONG',
  'EM',
  'S',
  'A',
  'HR',
  'TABLE',
  'THEAD',
  'TBODY',
  'TFOOT',
  'TR',
  'TH',
  'TD',
]);

/** Tags that must never reach the note HTML, even as text. */
const DROPPED_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'IFRAME',
  'OBJECT',
  'EMBED',
  'LINK',
  'META',
  'BASE',
  'FORM',
  'INPUT',
  'BUTTON',
  'TEXTAREA',
  'SELECT',
  'OPTION',
  'VIDEO',
  'AUDIO',
  'SOURCE',
  'TRACK',
  'CANVAS',
  'SVG',
  'MATH',
  'TEMPLATE',
  'NOSCRIPT',
  'FRAME',
  'FRAMESET',
]);

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed) as string;
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replace(/\\'/g, "'");
  }
  return trimmed;
}

function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
}

function extractFrontmatter(input: string): {
  title?: string;
  tags: string[];
  rest: string;
} | null {
  if (!input.startsWith(`${FRONTMATTER_OPEN}\n`)) return null;

  const end = input.indexOf(`\n${FRONTMATTER_OPEN}`, FRONTMATTER_OPEN.length + 1);
  if (end === -1) return null;

  const block = input.slice(FRONTMATTER_OPEN.length + 1, end);
  let rest = input.slice(end + FRONTMATTER_OPEN.length + 1);
  if (rest.startsWith('\n')) rest = rest.slice(1);

  let title: string | undefined;
  let tags: string[] = [];
  let collectingTags = false;

  for (const line of block.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (collectingTags && trimmed.startsWith('-')) {
      tags.push(unquote(trimmed.slice(1).trim()));
      continue;
    }
    collectingTags = false;

    const match = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(trimmed);
    if (!match) continue;

    const [, key, rawValue] = match;
    const normalizedKey = key.toLowerCase();
    if (normalizedKey === 'title') {
      title = unquote(rawValue) || undefined;
    }
    if (normalizedKey === 'tags') {
      const value = rawValue.trim();
      if (value.startsWith('[') && value.endsWith(']')) {
        tags = value
          .slice(1, -1)
          .split(',')
          .map((tag) => unquote(tag))
          .filter(Boolean);
      } else if (value) {
        tags = [unquote(value)];
      } else {
        collectingTags = true;
      }
    }
  }

  return { title, tags, rest };
}

/**
 * Parses a Markdown file. `title` comes from frontmatter, otherwise from a
 * leading `# Heading` (which is removed from the body); callers fall back to
 * the filename when both are missing.
 */
export function parseMarkdownDocument(raw: string): MarkdownDocument {
  let text = raw.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  let title: string | undefined;
  let tags: string[] = [];

  const frontmatter = extractFrontmatter(text);
  if (frontmatter) {
    title = frontmatter.title;
    tags = frontmatter.tags;
    text = frontmatter.rest;
  }

  if (!title) {
    const lines = text.split('\n');
    const index = lines.findIndex((line) => line.trim().length > 0);
    const heading = index >= 0 ? /^#\s+(.+)$/.exec(lines[index].trim()) : null;
    if (heading) {
      title = heading[1].trim();
      lines.splice(index, 1);
      while (lines.length > 0 && lines[0]?.trim() === '') lines.shift();
      text = lines.join('\n');
    }
  }

  return {
    title: title?.trim() || undefined,
    tags: normalizeTags(tags),
    body: text.trim(),
  };
}

function compactScheme(value: string): string {
  let compact = '';
  for (const char of value.trim().toLowerCase()) {
    if (char.charCodeAt(0) > 0x1f && !/\s/.test(char)) compact += char;
  }
  return compact;
}

function sanitizeHref(value: string | null): string | null {
  if (!value) return null;
  const href = value.trim();
  if (!href) return null;

  const scheme = compactScheme(href);
  if (
    scheme.startsWith('javascript:') ||
    scheme.startsWith('data:') ||
    scheme.startsWith('vbscript:')
  ) {
    return null;
  }
  return href;
}

/**
 * Whitelists the HTML that the note editor understands. Raw HTML inside a
 * Markdown file is therefore never stored verbatim.
 */
function sanitizeFragment(source: Node, document: Document): DocumentFragment {
  const fragment = document.createDocumentFragment();

  for (const child of [...source.childNodes]) {
    if (child.nodeType === 3) {
      fragment.appendChild(document.createTextNode(child.textContent ?? ''));
      continue;
    }
    if (child.nodeType !== 1) continue;

    const element = child as HTMLElement;
    const tag = element.tagName.toUpperCase();

    if (tag === 'IMG') {
      const alt = element.getAttribute('alt')?.trim();
      if (alt) fragment.appendChild(document.createTextNode(alt));
      continue;
    }

    if (DROPPED_TAGS.has(tag)) continue;

    const mapped = tag === 'H4' || tag === 'H5' || tag === 'H6' ? 'H3' : tag === 'DEL' ? 'S' : tag;

    if (!ALLOWED_TAGS.has(mapped)) {
      fragment.appendChild(sanitizeFragment(element, document));
      continue;
    }

    const output = document.createElement(mapped.toLowerCase());

    if (mapped === 'A') {
      const href = sanitizeHref(element.getAttribute('href'));
      if (href) output.setAttribute('href', href);
      const title = element.getAttribute('title');
      if (title) output.setAttribute('title', title);
    }

    if (mapped === 'OL') {
      const start = Number(element.getAttribute('start'));
      if (Number.isInteger(start) && start > 0) output.setAttribute('start', String(start));
    }

    if (mapped === 'TH' || mapped === 'TD') {
      for (const attribute of ['colspan', 'rowspan']) {
        const span = Number(element.getAttribute(attribute));
        if (Number.isInteger(span) && span > 1 && span <= 100) {
          output.setAttribute(attribute, String(span));
        }
      }
    }

    output.appendChild(sanitizeFragment(element, document));
    fragment.appendChild(output);
  }

  return fragment;
}

/** Markdown → editor HTML (sanitized, editor-compatible tags only). */
export function markdownToHtml(markdown: string): string {
  if (!markdown.trim()) return '';

  const rendered = marked.parse(markdown, {
    async: false,
    gfm: true,
    breaks: false,
  });

  const parsed = new DOMParser().parseFromString(rendered, 'text/html');
  const container = parsed.createElement('div');
  container.appendChild(sanitizeFragment(parsed.body, parsed));
  return container.innerHTML;
}

const turndown = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '_',
  strongDelimiter: '**',
  linkStyle: 'inlined',
});

turndown.addRule('strikethrough', {
  filter: ['del', 's'],
  replacement: (content) => `~~${content}~~`,
});

function tableCellMarkdown(cell: HTMLElement | undefined): string {
  if (!cell) return '';
  return turndown
    .turndown(cell.innerHTML)
    .replace(/\r?\n+/g, ' ')
    .replace(/\|/g, '\\|')
    .trim();
}

turndown.addRule('table', {
  filter: 'table',
  replacement: (_content, node) => {
    const rows = [...(node as HTMLElement).querySelectorAll('tr')]
      .map((row) =>
        [...row.children].filter(
          (cell): cell is HTMLElement => cell.tagName === 'TH' || cell.tagName === 'TD',
        ),
      )
      .filter((cells) => cells.length > 0);

    if (rows.length === 0) return '';

    const columns = Math.max(...rows.map((cells) => cells.length));
    if (columns === 0) return '';

    const hasHeader = rows[0].some((cell) => cell.tagName === 'TH');
    const header = hasHeader ? rows[0] : [];
    const body = hasHeader ? rows.slice(1) : rows;

    const line = (cells: HTMLElement[]) =>
      Array.from({ length: columns }, (_, index) => tableCellMarkdown(cells[index]))
        .map((value) => (value === '' ? ' ' : value))
        .join(' | ');

    const headerLine = line(header);
    const separator = Array.from({ length: columns }, () => '---').join(' | ');
    const bodyLines = body.map((cells) => `| ${line(cells)} |`);

    return `\n\n| ${headerLine} |\n| ${separator} |\n${bodyLines.join('\n')}\n\n`;
  },
});

/** Editor HTML → Markdown. */
export function htmlToMarkdown(html: string): string {
  if (!html.trim()) return '';

  return turndown
    .turndown(html)
    .replace(/^(\s*[-*+])\s{2,}/gm, '$1 ')
    .replace(/^(\s*\d+\.)\s{2,}/gm, '$1 ')
    .trim();
}

function yamlString(value: string): string {
  return JSON.stringify(value);
}

/** Which file name a note gets when exported. */
export function markdownFileName(title: string): string {
  const slug = title
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  return `${slug || 'note'}.md`;
}

/**
 * Note → Markdown with `title`/`tags` frontmatter. The body has no H1 because
 * the note title is carried by the frontmatter.
 */
export function noteToMarkdown(note: {
  title: string;
  tags: string[];
  content: string;
}): string {
  const tags = normalizeTags(note.tags);
  const lines = [FRONTMATTER_OPEN, `title: ${yamlString(note.title)}`];

  if (tags.length > 0) {
    lines.push('tags:');
    for (const tag of tags) lines.push(`  - ${yamlString(tag)}`);
  }

  lines.push(FRONTMATTER_OPEN, '');

  const body = htmlToMarkdown(note.content);
  return `${lines.join('\n')}${body ? `${body}\n` : ''}`;
}
