import { describe, expect, it } from 'vitest';
import { cleanHtml, excerpt, stripHtml, toNoteHtml } from './text';

describe('cleanHtml', () => {
  it('drops trailing empty paragraphs', () => {
    expect(cleanHtml('<p>Hello</p><p></p>')).toBe('<p>Hello</p>');
    expect(cleanHtml('<p>Hello</p><p><br></p>')).toBe('<p>Hello</p>');
    expect(cleanHtml('<ul><li><p>Item</p></li></ul><p></p><p></p>')).toBe(
      '<ul><li><p>Item</p></li></ul>',
    );
  });

  it('keeps meaningful markup intact', () => {
    const html = '<p><strong>Bold</strong> detail</p><ul><li><p>First</p></li></ul>';
    expect(cleanHtml(html)).toBe(html);
  });

  it('returns an empty string for blank input', () => {
    expect(cleanHtml('')).toBe('');
    expect(cleanHtml('<p></p>')).toBe('');
  });
});

describe('stripHtml', () => {
  it('flattens block markup to text', () => {
    expect(stripHtml('<h2>Title</h2><p>Body <strong>text</strong></p>')).toBe('Title Body text');
  });

  it('treats an empty paragraph as empty text', () => {
    expect(stripHtml('<p></p>')).toBe('');
  });

  it('separates table cells', () => {
    expect(stripHtml('<table><tbody><tr><td>A</td><td>B</td></tr></table>')).toBe('A B');
  });
});

describe('excerpt', () => {
  it('truncates on a word boundary with an ellipsis', () => {
    const html = `<p>${'word '.repeat(40)}</p>`;
    const result = excerpt(html, 20);

    expect(result.endsWith('…')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(21);
  });
});

describe('toNoteHtml', () => {
  it('escapes user text and splits on blank lines', () => {
    expect(toNoteHtml('First line\nstill first\n\nSecond <script>')).toBe(
      '<p>First line<br>still first</p><p>Second &lt;script&gt;</p>',
    );
  });

  it('returns empty markup for blank content', () => {
    expect(toNoteHtml('   ')).toBe('');
  });
});
