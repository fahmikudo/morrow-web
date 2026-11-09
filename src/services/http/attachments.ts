import type {
  Attachment,
  AttachmentConfig,
  AttachmentPrepare,
  AttachmentUploadTicket,
} from '@/types/attachments';
import type { AttachmentRepository } from '@/services/repositories/contracts';
import { ApiError, OfflineError, request } from './client';

const encode = (value: string) => encodeURIComponent(value);

export function createAttachmentRepository(baseUrl: string): AttachmentRepository {
  return {
    config: () => request<AttachmentConfig>(baseUrl, '/attachments/config'),
    list: (entityType, entityId) =>
      request<Attachment[]>(
        baseUrl,
        `/attachments?entityType=${encode(entityType)}&entityId=${encode(entityId)}`,
      ),
    prepare: (input: AttachmentPrepare) =>
      request<AttachmentUploadTicket>(baseUrl, '/attachments', {
        method: 'POST',
        body: input,
      }),
    upload: async (ticket, file) => {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        throw new OfflineError();
      }

      const headers = new Headers();
      for (const [name, values] of Object.entries(ticket.headers)) {
        if (name.toLowerCase() === 'host' || values.length === 0) continue;
        headers.set(name, values[0]);
      }

      let response: Response;
      try {
        response = await fetch(ticket.uploadUrl, {
          method: ticket.method || 'PUT',
          headers,
          body: file,
        });
      } catch {
        throw new ApiError('Cannot reach file storage', 0);
      }

      if (!response.ok) {
        throw new ApiError(`Upload failed (HTTP ${response.status})`, response.status);
      }
    },
    complete: (id) =>
      request<Attachment>(baseUrl, `/attachments/${encode(id)}/complete`, { method: 'POST' }),
    url: async (id, inline) => {
      const response = await request<{ url: string }>(
        baseUrl,
        `/attachments/${encode(id)}/url?inline=${inline ? 'true' : 'false'}`,
      );
      return response.url;
    },
    remove: async (id) => {
      await request<void>(baseUrl, `/attachments/${encode(id)}`, { method: 'DELETE' });
    },
  };
}
