const FALLBACK_KEY = 'SB';

/** Jira-style project key from a name: word initials, 2–4 characters. */
export function deriveKeyPrefix(name: string): string {
  const words = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter((word) => /[A-Z]/.test(word));

  if (words.length === 0) return FALLBACK_KEY;
  if (words.length === 1) return words[0].slice(0, 3).padEnd(2, 'X');

  return words
    .slice(0, 4)
    .map((word) => word[0])
    .join('');
}

/** Appends a numeric suffix until the key is unused. */
export function uniqueKey(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;

  let index = 2;
  while (taken.has(`${base}${index}`)) index += 1;
  return `${base}${index}`;
}
