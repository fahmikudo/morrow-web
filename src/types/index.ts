export type InboxItemType = 'note' | 'task' | 'idea';
export type EventSource = 'local' | 'google';
export type TaskType = 'task' | 'story' | 'bug';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type AreaTone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
export type AreaIconName =
  | 'briefcase'
  | 'users'
  | 'heart'
  | 'user'
  | 'book'
  | 'home'
  | 'sparkles';

export type HabitCadence = 'daily' | 'weekly' | 'monthly';

export type HabitSchedule =
  | { kind: 'flexible' }
  | { kind: 'fixed'; weekdays: number[] };

export type Habit = {
  id: string;
  title: string;
  description?: string;
  /** Used only when the habit has no project; otherwise the project's area wins. */
  areaId?: string;
  projectId?: string;
  cadence: HabitCadence;
  /** Completions required per cadence period, e.g. 4 per week. */
  target: number;
  schedule: HabitSchedule;
  /** Local `HH:mm` start for scheduled occurrences. */
  startTime?: string;
  /** Local `HH:mm` end; optional. */
  endTime?: string;
  startDate: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type HabitCheckIn = {
  id: string;
  habitId: string;
  /** Local `YYYY-MM-DD`; at most one check-in per habit per day. */
  date: string;
  createdAt: string;
};

export type Area = {
  id: string;
  name: string;
  description?: string;
  tone: AreaTone;
  icon: AreaIconName;
  createdAt: string;
  updatedAt: string;
};
export type TaskPriority = 'low' | 'medium' | 'high';
export type ProjectStatus = 'active' | 'completed' | 'archived';

export type InboxItem = {
  id: string;
  title: string;
  content?: string;
  type: InboxItemType;
  createdAt: string;
  archivedAt?: string;
};

export type Task = {
  id: string;
  /** Immutable issue key, e.g. `DWP-12`. Assigned at creation. */
  key: string;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  /** Optional time-box start, local `HH:mm`. */
  startTime?: string;
  /** Optional time-box end, local `HH:mm`. */
  endTime?: string;
  projectId?: string;
  /** Used only when the task has no project; otherwise the project's area wins. */
  areaId?: string;
  /** Set for a subtask; at most one level deep. */
  parentId?: string;
  labels: string[];
  /** Opted into SoftwareSeni Pepy task sync. */
  syncToPepy?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  /** Immutable project key used as the task-key prefix, e.g. `DWP`. */
  key: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  areaId?: string;
  createdAt: string;
  updatedAt: string;
};

export type Event = {
  id: string;
  title: string;
  /** Local calendar date, `YYYY-MM-DD`. */
  date: string;
  /** Local start time, `HH:mm`; empty for an all-day entry. */
  startTime?: string;
  /** Local end time, `HH:mm`. */
  endTime?: string;
  notes?: string;
  projectId?: string;
  /** Imported events are editable in Google; local events are mirrored to it. */
  source?: EventSource;
  createdAt: string;
  updatedAt: string;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  projectId?: string;
  /** Used only when the note has no project; otherwise the project's area wins. */
  areaId?: string;
  createdAt: string;
  updatedAt: string;
};

export type Profile = {
  /** Singleton profile id (`me`) — the prototype has one local user. */
  id: string;
  name: string;
  email: string;
  role?: string;
  timezone?: string;
  joinedAt: string;
  updatedAt: string;
};

export type Database = {
  version: 6;
  inbox: InboxItem[];
  tasks: Task[];
  projects: Project[];
  notes: Note[];
  events: Event[];
  areas: Area[];
  habits: Habit[];
  habitCheckIns: HabitCheckIn[];
  profile: Profile;
  /** Next task number per project bucket (`projectId` or `none`). */
  counters: Record<string, number>;
};

export type NewInboxItem = { title: string; content?: string; type: InboxItemType };
export type NewTask = {
  title: string;
  description?: string;
  type?: TaskType;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  startTime?: string;
  endTime?: string;
  projectId?: string;
  areaId?: string;
  parentId?: string;
  labels?: string[];
  syncToPepy?: boolean;
};
export type NewProject = {
  name: string;
  description?: string;
  status?: ProjectStatus;
  areaId?: string;
};
export type NewHabit = {
  title: string;
  description?: string;
  areaId?: string;
  projectId?: string;
  cadence?: HabitCadence;
  target?: number;
  schedule?: HabitSchedule;
  startTime?: string;
  endTime?: string;
  startDate?: string;
};
export type NewArea = {
  name: string;
  description?: string;
  tone?: AreaTone;
  icon?: AreaIconName;
};
export type NewNote = {
  title: string;
  content?: string;
  tags?: string[];
  projectId?: string;
  areaId?: string;
};
export type NewEvent = {
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  projectId?: string;
};
