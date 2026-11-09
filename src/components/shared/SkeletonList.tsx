import { Skeleton } from '@heroui/react';

type SkeletonListProps = {
  rows?: number;
};

export function SkeletonList({ rows = 3 }: SkeletonListProps) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading content">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="surface-card flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-1/2 rounded-md" />
            <Skeleton className="h-4 w-16 rounded-md" />
          </div>
          <Skeleton className="h-3 w-4/5 rounded-md" />
          <Skeleton className="h-3 w-2/5 rounded-md" />
        </div>
      ))}
    </div>
  );
}
