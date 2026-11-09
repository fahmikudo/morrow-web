import { BookOpen, Briefcase, HeartPulse, Home, Sparkles, User, Users } from 'lucide-react';
import type { AreaIconName } from '@/types';

export const AREA_ICONS: Record<AreaIconName, typeof Briefcase> = {
  briefcase: Briefcase,
  users: Users,
  heart: HeartPulse,
  user: User,
  book: BookOpen,
  home: Home,
  sparkles: Sparkles,
};

export const AREA_ICON_LABELS: Record<AreaIconName, string> = {
  briefcase: 'Briefcase',
  users: 'People',
  heart: 'Heart',
  user: 'Person',
  book: 'Book',
  home: 'Home',
  sparkles: 'Sparkles',
};

export function areaIconLabel(icon: AreaIconName): string {
  return AREA_ICON_LABELS[icon];
}
