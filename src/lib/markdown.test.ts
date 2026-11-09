import { describe, expect, it } from 'vitest';
import {
  htmlToMarkdown,
  markdownFileName,
  markdownToHtml,
  noteToMarkdown,
  parseMarkdownDocument,
} from './markdown';

const parseHtml = (html: string) =>
  new DOMParser().parseFromString(html, 'text/html').body;

describe('parseMarkdownDocument', () => {
  it('reads title and inline tags from frontmatter', () => {
    const doc = parseMarkdownDocument(
      ['---', 'title: "Release notes"', 'tags: [api, backend]', '---', '', 'Body text'].join(
        '\n',
      ),
    );

    expect(doc.title).toBe('Release notes');
    expect(doc.tags).toEqual(['api', 'backend']);
    expect(doc.body).toBe('Body text');
  });

  it('reads block-style tags and unquoted titles', () => {
    const doc = parseMarkdownDocument(
      ['---', 'title: Design log', 'tags:', '  - design', '  - "ux"', '---', 'Body'].join('\n'),
    );

    expect(doc.title).toBe('Design log');
    expect(doc.tags).toEqual(['design', 'ux']);
  });

  it('falls back to a leading H1 and removes it from the body', () => {
    const doc = parseMarkdownDocument('\n\n# My note\n\nFirst line\n\n## Section\n');

    expect(doc.title).toBe('My note');
    expect(doc.body).toBe('First line\n\n## Section');
    expect(doc.tags).toEqual([]);
  });

  it('keeps a later H1 as content and leaves the title to the filename', () => {
    const doc = parseMarkdownDocument('Intro paragraph\n\n# Later heading\n');

    expect(doc.title).toBeUndefined();
    expect(doc.body).toBe('Intro paragraph\n\n# Later heading');
  });

  it('normalizes CRLF, BOM and duplicate tags', () => {
    const doc = parseMarkdownDocument(
      '\uFEFF---\r\ntitle: T\r\ntags: [a, a, b]\r\n---\r\n\r\nBody\r\n',
    );

    expect(doc.title).toBe('T');
    expect(doc.tags).toEqual(['a', 'b']);
    expect(doc.body).toBe('Body');
  });
});

describe('markdownToHtml', () => {
  it('renders editor-supported markdown', () => {
    const body = parseHtml(
      markdownToHtml(
        [
          '# Heading',
          '',
          '**bold** and _italic_',
          '',
          '- one',
          '- two',
          '',
          '```js',
          'const x = 1;',
          '```',
          '',
          '[link](https://example.com)',
        ].join('\n'),
      ),
    );

    expect(body.querySelector('h1')?.textContent).toBe('Heading');
    expect(body.querySelector('strong')?.textContent).toBe('bold');
    expect(body.querySelector('em')?.textContent).toBe('italic');
    expect(body.querySelectorAll('li')).toHaveLength(2);
    expect(body.querySelector('pre code')?.textContent).toContain('const x = 1;');
    expect(body.querySelector('a')?.getAttribute('href')).toBe('https://example.com');
  });

  it('drops raw HTML that the editor cannot represent', () => {
    const body = parseHtml(
      markdownToHtml(
        [
          '<script>alert(1)</script>',
          '<span onclick="alert(2)">inline</span>',
          '',
          '<img src="x" onerror="alert(3)" alt="diagram">',
          '',
          '| A | B |',
          '| --- | --- |',
          '| 1 | 2 |',
          '',
          '#### Deep heading',
        ].join('\n'),
      ),
    );

    expect(body.textContent).not.toContain('alert');
    expect(body.querySelector('script')).toBeNull();
    expect(body.querySelector('span')).toBeNull();
    expect(body.querySelector('img')).toBeNull();
    expect(body.textContent).toContain('inline');
    expect(body.textContent).toContain('diagram');
    expect(body.querySelector('table')).not.toBeNull();
    expect(body.querySelectorAll('th')).toHaveLength(2);
    expect(body.querySelectorAll('td')).toHaveLength(2);
    expect(body.textContent).toContain('A');
    expect(body.textContent).toContain('1');
    expect(body.querySelector('h3')?.textContent).toBe('Deep heading');
  });

  it('keeps GFM tables as editor tables', () => {
    const body = parseHtml(
      markdownToHtml(
        ['| A | B |', '| --- | --- |', '| 1 | 2 |', '| 3 | 4 |'].join('\n'),
      ),
    );

    const table = body.querySelector('table');
    expect(table).not.toBeNull();
    expect(table?.querySelectorAll('thead th')).toHaveLength(2);
    expect(table?.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(table?.querySelectorAll('td')[0]?.textContent).toBe('1');
  });

  it('strips unsafe link protocols', () => {
    const body = parseHtml(markdownToHtml('[click](javascript:alert(1))'));

    expect(body.querySelector('a')?.getAttribute('href')).toBeNull();
    expect(body.textContent).toContain('click');
  });
});

describe('htmlToMarkdown', () => {
  it('converts editor HTML back to markdown', () => {
    const markdown = htmlToMarkdown(
      '<h2>Section</h2><p><strong>Bold</strong> and <em>italic</em> and <s>gone</s></p><ul><li>One</li><li>Two</li></ul><pre><code>const x = 1;</code></pre>',
    );

    expect(markdown).toContain('## Section');
    expect(markdown).toContain('**Bold**');
    expect(markdown).toContain('_italic_');
    expect(markdown).toContain('~~gone~~');
    expect(markdown).toContain('- One');
    expect(markdown).toContain('```');
    expect(markdown).toContain('const x = 1;');
  });

  it('exports tables as GFM', () => {
    const markdown = htmlToMarkdown(
      '<table><tbody><tr><th><p>A</p></th><th><p>B</p></th></tr><tr><td><p>1</p></td><td><p>2</p></td></tr><tr><td><p>3</p></td><td><p>4</p></td></tr></tbody></table>',
    );

    expect(markdown).toContain('| A | B |');
    expect(markdown).toContain('| --- | --- |');
    expect(markdown).toContain('| 1 | 2 |');
    expect(markdown).toContain('| 3 | 4 |');
  });

  it('synthesizes a header row when the table has none', () => {
    const markdown = htmlToMarkdown(
      '<table><tbody><tr><td><p>1</p></td><td><p>2</p></td></tr></tbody></table>',
    );

    expect(markdown).toContain('| --- | --- |');
    expect(markdown).toContain('| 1 | 2 |');
  });

  it('returns an empty string for empty content', () => {
    expect(htmlToMarkdown('')).toBe('');
    expect(htmlToMarkdown('   ')).toBe('');
  });
});

describe('noteToMarkdown', () => {
  it('writes frontmatter and a body without the title heading', () => {
    const markdown = noteToMarkdown({
      title: 'Release "notes"',
      tags: ['api', 'api', ' '],
      content: '<p>Body</p>',
    });

    expect(markdown).toContain('title: "Release \\"notes\\""');
    expect(markdown).toContain('tags:');
    expect(markdown).toContain('  - "api"');
    expect(markdown).not.toContain('# Release');
    expect(markdown.trimEnd().endsWith('Body')).toBe(true);

    const parsed = parseMarkdownDocument(markdown);
    expect(parsed.title).toBe('Release "notes"');
    expect(parsed.tags).toEqual(['api']);
    expect(parsed.body).toBe('Body');
  });
});

describe('markdownFileName', () => {
  it('slugifies note titles', () => {
    expect(markdownFileName('Release Notes: v1.2')).toBe('release-notes-v12.md');
    expect(markdownFileName('   ')).toBe('note.md');
  });
});
