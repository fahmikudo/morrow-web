export type AttachmentEntityType = 'project' | 'task' | 'note';

export type Attachment = {
  id: string;
  entityType: AttachmentEntityType;
  entityId: string;
  filename: string;
  contentType: string;
  size: number;
  createdAt: string;
};

export type AttachmentConfig = {
  enabled: boolean;
  maxBytes: number;
  imageMaxBytes: number;
  extensions: string[];
};

export type AttachmentPrepare = {
  entityType: AttachmentEntityType;
  entityId: string;
  filename: string;
  size: number;
};

export type AttachmentUploadTicket = {
  attachment: Attachment;
  uploadUrl: string;
  method: string;
  headers: Record<string, string[]>;
  expiresAt: string;
};

export type AttachmentURL = {
  url: string;
  expiresAt: string;
};
