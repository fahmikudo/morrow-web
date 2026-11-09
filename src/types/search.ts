export type SearchKind = 'task' | 'note' | 'project' | 'inbox' | 'area' | 'habit';

export type SearchResult = {
  kind: SearchKind;
  id: string;
  title: string;
  subtitle: string;
  href: string;
};
