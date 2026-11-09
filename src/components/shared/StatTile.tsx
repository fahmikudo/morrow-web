import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type StatTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

const TONE_TILE: Record<StatTone, string> = {
  neutral: 'bg-surface-secondary text-muted',
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
};

type StatTileProps = {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  hint?: string;
  tone?: StatTone;
  valueClassName?: string;
};

export function StatTile({
  label,
  value,
  icon: Icon,
  hint,
  tone = 'neutral',
  valueClassName,
}: StatTileProps) {
  return (
    <div className="surface-card flex items-center gap-3">
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg',
          TONE_TILE[tone],
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="section-label truncate">{label}</span>
        <span className={cn('text-2xl font-semibold text-foreground', valueClassName)}>
          {value}
        </span>
        {hint ? <span className="truncate text-xs text-muted">{hint}</span> : null}
      </div>
    </div>
  );
}
