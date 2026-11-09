import { useRef, useState } from 'react';
import {
  Button,
  Modal,
  toast,
} from '@heroui/react';
import {
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Trash2,
  Upload,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { notifyError } from '@/lib/toast';
import { cn } from '@/lib/cn';
import { isServerMode, repositories } from '@/services';
import type { Attachment, AttachmentEntityType } from '@/types/attachments';
import {
  useAttachmentConfig,
  useAttachments,
  useDeleteAttachment,
  useUploadAttachment,
} from './queries';

type AttachmentsPanelProps = {
  entityType: AttachmentEntityType;
  entityId?: string;
  className?: string;
};

type Preview = {
  attachment: Attachment;
  url: string;
};

function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPreviewable(contentType: string): boolean {
  return contentType === 'application/pdf' || contentType.startsWith('image/');
}

function FileTypeIcon({ contentType }: { contentType: string }) {
  const Icon = contentType.startsWith('image/') ? ImageIcon : FileText;
  return <Icon className="size-4" aria-hidden />;
}

export function AttachmentsPanel({ entityType, entityId, className }: AttachmentsPanelProps) {
  const config = useAttachmentConfig();
  const attachments = useAttachments(entityType, entityId);
  const upload = useUploadAttachment(entityType, entityId);
  const remove = useDeleteAttachment(entityType, entityId);

  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [deleting, setDeleting] = useState<Attachment | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!isServerMode) return null;

  const enabled = Boolean(config.data?.enabled);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (inputRef.current) inputRef.current.value = '';
    if (!file) return;

    const extension = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;
    if (!config.data?.extensions.includes(extension)) {
      toast.danger('Choose a PDF, image, or Office file');
      return;
    }

    const image = ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(extension);
    const limit = image ? config.data.imageMaxBytes : config.data.maxBytes;
    if (file.size > limit) {
      toast.danger(`File must be ${fileSize(limit)} or smaller`);
      return;
    }

    upload.mutate(file);
  };

  const openFile = async (attachment: Attachment, inline: boolean) => {
    setBusyId(attachment.id);
    try {
      const url = await repositories.attachments.url(attachment.id, inline);
      if (inline) {
        setPreview({ attachment, url });
        return;
      }

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = attachment.filename;
      anchor.rel = 'noopener';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (error) {
      notifyError(error);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className={cn('flex flex-col gap-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Paperclip className="size-4 text-muted" aria-hidden />
          <h3 className="section-label">Attachments</h3>
          {attachments.data && attachments.data.length > 0 ? (
            <span className="text-xs text-muted">{attachments.data.length}</span>
          ) : null}
        </div>
        <Button
          size="sm"
          variant="secondary"
          isPending={upload.isPending}
          isDisabled={!enabled || !entityId}
          onPress={() => inputRef.current?.click()}
        >
          <Upload className="size-4" aria-hidden />
          Add file
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={config.data?.extensions.join(',')}
          onChange={(event) => handleFiles(event.currentTarget.files)}
        />
      </div>

      {!enabled ? (
        <p className="text-sm text-muted">
          {config.isPending
            ? 'Checking file storage…'
            : 'File storage is not configured. Set the S3 variables to enable attachments.'}
        </p>
      ) : null}

      {enabled && attachments.data?.length === 0 ? (
        <p className="text-sm text-muted">
          No files yet. PDF, images, and Office documents up to{' '}
          {fileSize(config.data?.maxBytes ?? 0)} are supported.
        </p>
      ) : null}

      {attachments.data && attachments.data.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {attachments.data.map((attachment) => (
            <li
              key={attachment.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface-secondary/40 px-3 py-2"
            >
              <FileTypeIcon contentType={attachment.contentType} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {attachment.filename}
                </p>
                <p className="text-xs text-muted">{fileSize(attachment.size)}</p>
              </div>
              {isPreviewable(attachment.contentType) ? (
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  aria-label={`Preview ${attachment.filename}`}
                  isPending={busyId === attachment.id}
                  onPress={() => void openFile(attachment, true)}
                >
                  <Eye className="size-4" aria-hidden />
                </Button>
              ) : null}
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label={`Download ${attachment.filename}`}
                isPending={busyId === attachment.id}
                onPress={() => void openFile(attachment, false)}
              >
                <Download className="size-4" aria-hidden />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label={`Delete ${attachment.filename}`}
                onPress={() => setDeleting(attachment)}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      <Modal.Backdrop isOpen={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <Modal.Container placement="center" size="lg">
          <Modal.Dialog className="sm:max-w-4xl">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading className="truncate">{preview?.attachment.filename}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              {preview?.attachment.contentType === 'application/pdf' ? (
                <iframe
                  title={preview.attachment.filename}
                  src={preview.url}
                  className="h-[70dvh] w-full rounded-lg border border-border"
                />
              ) : preview ? (
                <img
                  src={preview.url}
                  alt={preview.attachment.filename}
                  className="mx-auto max-h-[70dvh] w-auto max-w-full rounded-lg object-contain"
                />
              ) : null}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <ConfirmDialog
        isOpen={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this attachment?"
        description={
          deleting
            ? `“${deleting.filename}” will be removed permanently from this item.`
            : 'This file will be removed permanently.'
        }
        confirmLabel="Delete file"
        isDanger
        isPending={remove.isPending}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
        }}
      />
    </section>
  );
}
