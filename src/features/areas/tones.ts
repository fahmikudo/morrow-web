import type { AreaTone } from '@/types';

/** Tile that carries the area identity (icon on a tinted background). */
export const AREA_TONE_TILE: Record<AreaTone, string> = {
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  neutral: 'bg-surface-secondary text-muted',
};

/** Thin stripe used on cards to make an area scannable at a glance. */
export const AREA_TONE_STRIPE: Record<AreaTone, string> = {
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  neutral: 'bg-muted',
};

/** Progress bar colour that matches the area tone. */
export const AREA_TONE_PROGRESS: Record<
  AreaTone,
  'default' | 'accent' | 'success' | 'warning' | 'danger'
> = {
  accent: 'accent',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  neutral: 'default',
};
