import { Building2, CalendarDays } from 'lucide-react';
import type { IntegrationId } from '@/types/settings';

export type IntegrationDefinition = {
  id: IntegrationId;
  name: string;
  description: string;
  icon: typeof CalendarDays;
};

export const INTEGRATIONS: IntegrationDefinition[] = [
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Pull events into the calendar and push scheduled habits out.',
    icon: CalendarDays,
  },
  {
    id: 'softwareseni-pepy',
    name: 'SoftwareSeni Pepy',
    description: 'Push opted-in time-boxed tasks and completion times to Pepy.',
    icon: Building2,
  },
];
