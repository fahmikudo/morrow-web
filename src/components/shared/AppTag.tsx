import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type AppTagVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

const VARIANT_CLASSES: Record<AppTagVariant, string> = {
  neutral: 'bg-surface-secondary text-muted',
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
};

type AppTagProps = {
  children: ReactNode;
  variant?: AppTagVariant;
  className?: string;
};

export function AppTag({ children, variant = 'neutral', className }: AppTagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
