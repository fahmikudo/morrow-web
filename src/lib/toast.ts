import { toast } from '@heroui/react';

export function notifyError(error: unknown): void {
  toast.danger(error instanceof Error ? error.message : 'Something went wrong');
}
