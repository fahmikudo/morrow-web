import { useState } from 'react';
import { X } from 'lucide-react';
import { Button, Input, TextField } from '@heroui/react';
import { AppTag } from '@/components/shared/AppTag';
import { addTag } from '@/features/knowledge/tags';

type TagInputProps = {
  tags: string[];
  onChange: (tags: string[]) => void;
};

export function TagInput({ tags, onChange }: TagInputProps) {
  const [draft, setDraft] = useState('');

  const commit = (value: string) => {
    const next = addTag(tags, value);
    if (next !== tags) onChange(next);
    setDraft('');
  };

  return (
    <div className="flex flex-col gap-2">
      <TextField
        value={draft}
        onChange={setDraft}
        className="w-full"
      >
        <Input
          aria-label="Add a tag"
          placeholder="Add a tag and press Enter"
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              commit(draft);
            }
            if (event.key === 'Backspace' && draft === '' && tags.length > 0) {
              onChange(tags.slice(0, -1));
            }
          }}
        />
      </TextField>

      {tags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1">
              <AppTag variant="accent">{tag}</AppTag>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label={`Remove tag ${tag}`}
                onPress={() => onChange(tags.filter((entry) => entry !== tag))}
                className="size-5 text-muted"
              >
                <X className="size-3" aria-hidden />
              </Button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
