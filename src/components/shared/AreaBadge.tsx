import { AppTag } from '@/components/shared/AppTag';
import { AreaIcon } from '@/components/shared/AreaIcon';
import type { Area } from '@/types';

export function AreaBadge({ area, className }: { area: Area; className?: string }) {
  return (
    <AppTag variant={area.tone} className={className}>
      <span className="inline-flex items-center gap-1">
        <AreaIcon icon={area.icon} className="size-3" />
        {area.name}
      </span>
    </AppTag>
  );
}
