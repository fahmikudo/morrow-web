import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@heroui/react';
import { notifyError } from '@/lib/toast';
import { isServerMode, repositories } from '@/services';
import type { AttachmentEntityType } from '@/types/attachments';

export const attachmentKeys = {
  all: ['attachments'] as const,
  config: ['attachments', 'config'] as const,
  list: (entityType: AttachmentEntityType, entityId: string) =>
    ['attachments', entityType, entityId] as const,
};

export function useAttachmentConfig() {
  return useQuery({
    queryKey: attachmentKeys.config,
    queryFn: () => repositories.attachments.config(),
    enabled: isServerMode,
  });
}

export function useAttachments(entityType: AttachmentEntityType, entityId?: string) {
  return useQuery({
    queryKey: attachmentKeys.list(entityType, entityId ?? ''),
    queryFn: () => repositories.attachments.list(entityType, entityId ?? ''),
    enabled: isServerMode && Boolean(entityId),
  });
}

export function useUploadAttachment(entityType: AttachmentEntityType, entityId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!entityId) throw new Error('Save this item before adding attachments');
      const ticket = await repositories.attachments.prepare({
        entityType,
        entityId,
        filename: file.name,
        size: file.size,
      });
      await repositories.attachments.upload(ticket, file);
      return repositories.attachments.complete(ticket.attachment.id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: attachmentKeys.all });
      toast.success('File attached');
    },
    onError: notifyError,
  });
}

export function useDeleteAttachment(entityType: AttachmentEntityType, entityId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => repositories.attachments.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: attachmentKeys.list(entityType, entityId ?? ''),
      });
      toast.success('Attachment removed');
    },
    onError: notifyError,
  });
}
