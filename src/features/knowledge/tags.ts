const MAX_TAGS = 10;

export function addTag(tags: string[], value: string): string[] {
  const tag = value.replace(/,/g, '').trim();
  if (!tag) return tags;
  if (tags.length >= MAX_TAGS) return tags;
  if (tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) return tags;
  return [...tags, tag];
}

export function parseTags(input: string): string[] {
  return input
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<string[]>(addTag, []);
}
