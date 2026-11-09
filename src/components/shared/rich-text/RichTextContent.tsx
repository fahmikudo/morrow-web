import { escapeHtml } from '@/lib/text';
import { cn } from '@/lib/cn';

type RichTextContentProps = {
  html?: string;
  fallback?: string;
  className?: string;
};

const HAS_TAGS = /<[a-z][\s\S]*>/i;

export function RichTextContent({ html, fallback, className }: RichTextContentProps) {
  const value = html?.trim() ?? '';

  if (!value) {
    return fallback ? <p className={cn('text-muted', className)}>{fallback}</p> : null;
  }

  const markup = HAS_TAGS.test(value) ? value : `<p>${escapeHtml(value)}</p>`;

  return (
    <div
      className={cn('rich-text text-sm leading-relaxed', className)}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
