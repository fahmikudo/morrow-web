import type { AreaIconName } from '@/types';
import { cn } from '@/lib/cn';
import { AREA_ICONS, AREA_ICON_LABELS } from './area-icons';

export function AreaIcon({
  icon,
  className,
  labelled = false,
}: {
  icon: AreaIconName;
  className?: string;
  labelled?: boolean;
}) {
  const Icon = AREA_ICONS[icon];

  return (
    <Icon
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? AREA_ICON_LABELS[icon] : undefined}
      aria-hidden={labelled ? undefined : true}
      className={cn('shrink-0', className)}
    />
  );
}
