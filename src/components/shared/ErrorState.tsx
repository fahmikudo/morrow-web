import { TriangleAlert } from 'lucide-react';
import { Button } from '@heroui/react';

type ErrorStateProps = {
  message?: string;
  onRetry: () => void;
};

export function ErrorState({ message = 'Something went wrong while loading data.', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface px-6 py-10 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-danger-soft text-danger">
        <TriangleAlert className="size-5" aria-hidden />
      </span>
      <p className="mt-4 text-sm font-medium text-foreground">Could not load this view</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
      <Button className="mt-4" variant="secondary" onPress={onRetry}>
        Retry
      </Button>
    </div>
  );
}
