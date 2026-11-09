import { describe, expect, it } from 'vitest';
import { addTag, parseTags } from './tags';

describe('addTag', () => {
  it('trims and appends a tag', () => {
    expect(addTag([], '  go  ')).toEqual(['go']);
  });

  it('rejects empty values', () => {
    expect(addTag(['go'], '   ')).toEqual(['go']);
    expect(addTag(['go'], ',')).toEqual(['go']);
  });

  it('dedupes case-insensitively', () => {
    expect(addTag(['Go'], 'go')).toEqual(['Go']);
  });

  it('caps the tag list at ten', () => {
    const full = Array.from({ length: 10 }, (_, index) => `tag-${index}`);
    expect(addTag(full, 'one-more')).toHaveLength(10);
  });
});

describe('parseTags', () => {
  it('splits on commas, trimming and deduping', () => {
    expect(parseTags(' go, architecture ,GO, ,reading ')).toEqual(['go', 'architecture', 'reading']);
  });

  it('returns an empty array for blank input', () => {
    expect(parseTags('')).toEqual([]);
    expect(parseTags(' , , ')).toEqual([]);
  });
});
