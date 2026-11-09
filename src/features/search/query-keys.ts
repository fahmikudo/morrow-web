export const searchKeys = {
  all: ['search'] as const,
  byQuery: (query: string) => ['search', query] as const,
};
