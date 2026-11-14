import { z } from 'zod';

const inboxItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string().optional(),
  type: z.enum(['note', 'task', 'idea']),
  createdAt: z.string(),
  archivedAt: z.string().optional(),
});

const areaSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  tone: z.enum(['accent', 'success', 'warning', 'danger', 'neutral']),
  icon: z.enum(['briefcase', 'users', 'heart', 'user', 'book', 'home', 'sparkles']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const taskSchema = z.object({
  id: z.string(),
  key: z.string(),
  title: z.string(),
  description: z.string().optional(),
  type: z.enum(['task', 'story', 'bug']),
  status: z.enum(['todo', 'in_progress', 'done']),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.string().optional(),
  startTime: z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  endTime: z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  projectId: z.string().optional(),
  areaId: z.string().optional(),
  parentId: z.string().optional(),
  labels: z.array(z.string()),
  syncToPepy: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const projectSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  description: z.string().optional(),
  status: z.enum(['active', 'completed', 'archived']),
  areaId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const noteSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  projectId: z.string().optional(),
  areaId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const profileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string().optional(),
  timezone: z.string().optional(),
  joinedAt: z.string(),
  updatedAt: z.string(),
});

const habitScheduleSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('flexible') }),
  z.object({ kind: z.literal('fixed'), weekdays: z.array(z.number().int().min(0).max(6)) }),
]);

const habitSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  areaId: z.string().optional(),
  projectId: z.string().optional(),
  cadence: z.enum(['daily', 'weekly', 'monthly']),
  target: z.number().int().min(1),
  schedule: habitScheduleSchema,
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  reminderEnabled: z.boolean().optional(),
  reminderLeadMinutes: z.number().int().min(0).max(1440).optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  archivedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const habitCheckInSchema = z.object({
  id: z.string(),
  habitId: z.string(),
  date: z.string(),
  createdAt: z.string(),
});

const habitSkipSchema = z.object({
  id: z.string(),
  habitId: z.string(),
  date: z.string(),
  createdAt: z.string(),
});

const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  notes: z.string().optional(),
  projectId: z.string().optional(),
  source: z.enum(['local', 'google']).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const databaseSchema = z.object({
  version: z.literal(6),
  inbox: z.array(inboxItemSchema),
  tasks: z.array(taskSchema),
  projects: z.array(projectSchema),
  notes: z.array(noteSchema),
  events: z.array(eventSchema),
  areas: z.array(areaSchema),
  habits: z.array(habitSchema),
  habitCheckIns: z.array(habitCheckInSchema),
  // Additive in v6: older payloads and server snapshots parse with no skips.
  habitSkips: z.array(habitSkipSchema).default([]),
  profile: profileSchema,
  counters: z.record(z.string(), z.number()),
});

/** v5 payload: habit tracking, but no profile yet. */
export const databaseV5Schema = z.object({
  version: z.literal(5),
  inbox: z.array(inboxItemSchema),
  tasks: z.array(taskSchema),
  projects: z.array(projectSchema),
  notes: z.array(noteSchema),
  events: z.array(eventSchema),
  areas: z.array(areaSchema),
  habits: z.array(habitSchema),
  habitCheckIns: z.array(habitCheckInSchema),
  counters: z.record(z.string(), z.number()),
});

/** v4 payload: areas, but no habits yet. */
export const databaseV4Schema = z.object({
  version: z.literal(4),
  inbox: z.array(inboxItemSchema),
  tasks: z.array(taskSchema),
  projects: z.array(projectSchema),
  notes: z.array(noteSchema),
  events: z.array(eventSchema),
  areas: z.array(areaSchema),
  counters: z.record(z.string(), z.number()),
});

/** v3 payload: calendar events, but no areas yet. */
export const databaseV3Schema = z.object({
  version: z.literal(3),
  inbox: z.array(inboxItemSchema),
  tasks: z.array(taskSchema),
  projects: z.array(projectSchema),
  notes: z.array(noteSchema),
  events: z.array(eventSchema),
  counters: z.record(z.string(), z.number()),
});

/** v2 payload: issue model, but no events yet. */
export const databaseV2Schema = z.object({
  version: z.literal(2),
  inbox: z.array(inboxItemSchema),
  tasks: z.array(taskSchema),
  projects: z.array(projectSchema),
  notes: z.array(noteSchema),
  counters: z.record(z.string(), z.number()),
});

const taskV1Schema = taskSchema.omit({
  key: true,
  type: true,
  labels: true,
  parentId: true,
});

const projectV1Schema = projectSchema.omit({ key: true });

export const databaseV1Schema = z.object({
  version: z.literal(1),
  inbox: z.array(inboxItemSchema),
  tasks: z.array(taskV1Schema),
  projects: z.array(projectV1Schema),
  notes: z.array(noteSchema),
});

export type DatabaseV1 = z.infer<typeof databaseV1Schema>;
export type DatabaseV2 = z.infer<typeof databaseV2Schema>;
export type DatabaseV3 = z.infer<typeof databaseV3Schema>;
export type DatabaseV4 = z.infer<typeof databaseV4Schema>;
export type DatabaseV5 = z.infer<typeof databaseV5Schema>;
