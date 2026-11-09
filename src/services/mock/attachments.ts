import type { AttachmentConfig, AttachmentUploadTicket } from '@/types/attachments';
import type { AttachmentRepository } from '@/services/repositories/contracts';

const config: AttachmentConfig = {
  enabled: false,
  maxBytes: 0,
  imageMaxBytes: 0,
  extensions: [],
};

export function createAttachmentRepository(): AttachmentRepository {
  return {
    config: async () => config,
    list: async () => [],
    prepare: async () => {
      throw new Error('File attachments require the server');
    },
    upload: async (_ticket: AttachmentUploadTicket) => {
      throw new Error('File attachments require the server');
    },
    complete: async () => {
      throw new Error('File attachments require the server');
    },
    url: async () => {
      throw new Error('File attachments require the server');
    },
    remove: async () => undefined,
  };
}
