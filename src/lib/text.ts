const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => HTML_ENTITIES[char] ?? char);
}

export function stripHtml(html: string): string {
  if (!html) return '';

  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.body.querySelectorAll('p, div, li, h1, h2, h3, blockquote, pre, table, tr, td, th').forEach((node) => {
      node.append(' ');
    });
    return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  return html
    .replace(/<(p|div|li|h[1-6]|blockquote|pre|br|table|tr|td|th)\b[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function excerpt(html: string, max = 120): string {
  const text = stripHtml(html);
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

export function toNoteHtml(content?: string): string {
  const text = content?.trim();
  if (!text) return '';
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function toTaskDescription(content?: string): string | undefined {
  const text = stripHtml(content ?? '').trim();
  return text.length > 0 ? text : undefined;
}

/** Drops trailing empty paragraphs the editor adds after block content. */
export function cleanHtml(html: string): string {
  return html.replace(/(?:<p>(?:\s|<br\s*\/?>)*<\/p>\s*)+$/gi, '').trim();
}

export function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max).trimEnd()}…`;
}
