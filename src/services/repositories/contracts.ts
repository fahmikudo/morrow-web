import type {
  Area,
  Event,
  Habit,
  HabitCheckIn,
  NewHabit,
  Profile,
  InboxItem,
  NewArea,
  NewEvent,
  NewInboxItem,
  NewNote,
  NewProject,
  NewTask,
  Note,
  Project,
  Task,
} from '@/types';
import type { AssistantReply } from '@/types/assistant';
import type { SearchResult } from '@/types/search';
import type {
  Attachment,
  AttachmentConfig,
  AttachmentPrepare,
  AttachmentUploadTicket,
} from '@/types/attachments';
import type { ApiToken, CreatedApiToken } from '@/types/tokens';
import type {
  PushConfig,
  PushSubscribePayload,
  Reminder,
  ReminderSettings,
  ReminderSettingsPatch,
} from '@/types/reminders';
import type {
  AiSettings,
  AiTestResult,
  GoogleCalendar,
  IntegrationConnection,
  IntegrationId,
  SettingsState,
  UpdateAiSettings,
} from '@/types/settings';

export type UpdateInboxItem = Partial<Pick<InboxItem, 'title' | 'content' | 'type'>>;
export type UpdateTask = Partial<
  Pick<Task, 'title' | 'description' | 'type' | 'status' | 'priority' | 'labels'>
> & {
  dueDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  projectId?: string | null;
  areaId?: string | null;
  /** `null` promotes a subtask back to a top-level task. */
  parentId?: string | null;
  syncToPepy?: boolean;
};
export type UpdateProject = Partial<Pick<Project, 'name' | 'description' | 'status'>> & {
  areaId?: string | null;
};
export type UpdateNote = Partial<Pick<Note, 'title' | 'content' | 'tags'>> & {
  projectId?: string | null;
  areaId?: string | null;
};

export type UpdateArea = Partial<Pick<Area, 'name' | 'description' | 'tone' | 'icon'>>;

export type UpdateProfile = Partial<Pick<Profile, 'name' | 'email' | 'role' | 'timezone'>>;

export type UpdateHabit = Partial<
  Pick<Habit, 'title' | 'description' | 'cadence' | 'target' | 'schedule' | 'startDate'>
> & {
  areaId?: string | null;
  projectId?: string | null;
  archivedAt?: string | null;
  startTime?: string | null;
  endTime?: string | null;
};

export type UpdateEvent = Partial<Pick<Event, 'title' | 'date' | 'notes'>> & {
  startTime?: string | null;
  endTime?: string | null;
  projectId?: string | null;
};

export interface InboxRepository {
  list(): Promise<InboxItem[]>;
  listArchived(): Promise<InboxItem[]>;
  get(id: string): Promise<InboxItem | null>;
  create(input: NewInboxItem): Promise<InboxItem>;
  update(id: string, patch: UpdateInboxItem): Promise<InboxItem>;
  archive(id: string): Promise<InboxItem>;
  restore(id: string): Promise<InboxItem>;
  remove(id: string): Promise<void>;
}

export interface TaskRepository {
  list(): Promise<Task[]>;
  get(id: string): Promise<Task | null>;
  create(input: NewTask): Promise<Task>;
  update(id: string, patch: UpdateTask): Promise<Task>;
  remove(id: string): Promise<void>;
}

export interface ProjectRepository {
  list(): Promise<Project[]>;
  get(id: string): Promise<Project | null>;
  create(input: NewProject): Promise<Project>;
  update(id: string, patch: UpdateProject): Promise<Project>;
  remove(id: string): Promise<void>;
}

export interface NoteRepository {
  list(): Promise<Note[]>;
  get(id: string): Promise<Note | null>;
  create(input: NewNote): Promise<Note>;
  update(id: string, patch: UpdateNote): Promise<Note>;
  remove(id: string): Promise<void>;
}

export interface AreaRepository {
  list(): Promise<Area[]>;
  get(id: string): Promise<Area | null>;
  create(input: NewArea): Promise<Area>;
  update(id: string, patch: UpdateArea): Promise<Area>;
  /** Removes the area and clears its references on projects, tasks and notes. */
  remove(id: string): Promise<void>;
}

export interface HabitRepository {
  list(): Promise<Habit[]>;
  listArchived(): Promise<Habit[]>;
  get(id: string): Promise<Habit | null>;
  create(input: NewHabit): Promise<Habit>;
  update(id: string, patch: UpdateHabit): Promise<Habit>;
  archive(id: string): Promise<Habit>;
  restore(id: string): Promise<Habit>;
  /** Removes the habit together with its check-in history. */
  remove(id: string): Promise<void>;
  listCheckIns(): Promise<HabitCheckIn[]>;
  /** Idempotent: one check-in per habit per day. */
  checkIn(habitId: string, date: string): Promise<HabitCheckIn>;
  removeCheckIn(habitId: string, date: string): Promise<void>;
}

export interface ProfileRepository {
  /** Singleton local user; the prototype has no multi-user support. */
  get(): Promise<Profile>;
  update(patch: UpdateProfile): Promise<Profile>;
}

export interface EventRepository {
  list(): Promise<Event[]>;
  get(id: string): Promise<Event | null>;
  create(input: NewEvent): Promise<Event>;
  update(id: string, patch: UpdateEvent): Promise<Event>;
  remove(id: string): Promise<void>;
}

export interface SearchRepository {
  search(query: string): Promise<SearchResult[]>;
}

export interface AssistantRepository {
  reply(message: string, today: string): Promise<AssistantReply>;
}

export interface SettingsRepository {
  get(): Promise<SettingsState>;
  setIntegrationEnabled(id: IntegrationId, enabled: boolean): Promise<IntegrationConnection>;
  connect(id: IntegrationId): Promise<IntegrationConnection>;
  disconnect(id: IntegrationId): Promise<IntegrationConnection>;
  sync(id: IntegrationId): Promise<IntegrationConnection>;
  updateAi(patch: UpdateAiSettings): Promise<AiSettings>;
  testAi(): Promise<AiTestResult>;
  pepyConnect(): Promise<IntegrationConnection>;
  pepySync(): Promise<IntegrationConnection>;
  pepyDisconnect(): Promise<void>;
  googleAuthorizationUrl(): Promise<string>;
  googleCalendars(): Promise<GoogleCalendar[]>;
  selectGoogleCalendar(calendarId: string): Promise<IntegrationConnection>;
  syncGoogleCalendar(): Promise<IntegrationConnection>;
  disconnectGoogleCalendar(): Promise<void>;
}

/** Reminders and Web Push subscriptions. Server mode only. */
export interface ReminderRepository {
  today(): Promise<Reminder[]>;
  dismiss(id: string): Promise<void>;
  getSettings(): Promise<ReminderSettings>;
  updateSettings(patch: ReminderSettingsPatch): Promise<ReminderSettings>;
  pushConfig(): Promise<PushConfig>;
  subscribe(payload: PushSubscribePayload): Promise<void>;
  unsubscribe(endpoint: string): Promise<void>;
}

/** Personal access tokens for MCP clients and scripts. Server mode only. */
export interface ApiTokenRepository {
  list(): Promise<ApiToken[]>;
  create(name: string): Promise<CreatedApiToken>;
  revoke(id: string): Promise<void>;
}

/** File attachments on projects, tasks, and notes. Server mode only. */
export interface AttachmentRepository {
  config(): Promise<AttachmentConfig>;
  list(entityType: AttachmentPrepare['entityType'], entityId: string): Promise<Attachment[]>;
  prepare(input: AttachmentPrepare): Promise<AttachmentUploadTicket>;
  /** PUTs the file straight to object storage using the presigned ticket. */
  upload(ticket: AttachmentUploadTicket, file: File): Promise<void>;
  complete(id: string): Promise<Attachment>;
  url(id: string, inline: boolean): Promise<string>;
  remove(id: string): Promise<void>;
}

export interface Repositories {
  inbox: InboxRepository;
  tasks: TaskRepository;
  projects: ProjectRepository;
  notes: NoteRepository;
  events: EventRepository;
  areas: AreaRepository;
  habits: HabitRepository;
  profile: ProfileRepository;
  search: SearchRepository;
  assistant: AssistantRepository;
  settings: SettingsRepository;
  tokens: ApiTokenRepository;
  reminders: ReminderRepository;
  attachments: AttachmentRepository;
}
