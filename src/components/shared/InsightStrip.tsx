import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type InsightTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export type InsightItem = {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: InsightTone;
};

const TONE_CLASSES: Record<InsightTone, string> = {
  neutral: 'text-foreground',
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

export function InsightStrip({
  items,
  className,
}: {
  items: InsightItem[];
  className?: string;
}) {
  return (
    <dl
      className={cn(
        'surface-card grid grid-cols-2 gap-x-4 gap-y-3',
        items.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-4',
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="section-label truncate">{item.label}</dt>
          <dd
            className={cn(
              'mt-0.5 truncate text-xl font-semibold',
              TONE_CLASSES[item.tone ?? 'neutral'],
            )}
          >
            {item.value}
          </dd>
          {item.hint ? (
            <p className="mt-0.5 truncate text-[11px] text-muted">{item.hint}</p>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
