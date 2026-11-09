import { beforeEach, describe, expect, it } from 'vitest';
import { createMockRepositories } from './index';
import { resetDatabase } from './storage';

const repos = createMockRepositories();

describe('mock repositories', () => {
  beforeEach(() => {
    resetDatabase();
  });

  it('applies task create defaults', async () => {
    const task = await repos.tasks.create({ title: 'Plan offsite' });

    expect(task.id).toMatch(/^t_/);
    expect(task.key).toMatch(/^SB-\d+$/);
    expect(task.type).toBe('task');
    expect(task.labels).toEqual([]);
    expect(task.status).toBe('todo');
    expect(task.priority).toBe('medium');
    expect(task.createdAt).toBe(task.updatedAt);
    expect(await repos.tasks.get(task.id)).toEqual(task);
  });

  it('clears optional task fields when null is passed', async () => {
    const created = await repos.tasks.create({
      title: 'Temporary link',
      dueDate: '2026-01-01',
      projectId: 'p1',
    });

    const updated = await repos.tasks.update(created.id, { dueDate: null, projectId: null });

    expect(updated.dueDate).toBeUndefined();
    expect(updated.projectId).toBeUndefined();
    expect('dueDate' in updated).toBe(false);
  });

  it('stores and clears optional task time boxes', async () => {
    const created = await repos.tasks.create({
      title: 'Deep work',
      startTime: '09:00',
      endTime: '10:30',
    });

    expect(created.startTime).toBe('09:00');
    expect(created.endTime).toBe('10:30');
    expect(await repos.tasks.get(created.id)).toEqual(created);

    await expect(
      repos.tasks.update(created.id, { startTime: '11:00' }),
    ).rejects.toThrow('End time must be after start time');

    const cleared = await repos.tasks.update(created.id, {
      startTime: null,
      endTime: null,
    });

    expect(cleared.startTime).toBeUndefined();
    expect(cleared.endTime).toBeUndefined();
  });

  it('allocates sequential issue keys per project', async () => {
    const first = await repos.tasks.create({ title: 'First', projectId: 'p1' });
    const second = await repos.tasks.create({ title: 'Second', projectId: 'p1' });
    const other = await repos.tasks.create({ title: 'Other', projectId: 'p2' });

    expect(first.key).toBe('DWP-5');
    expect(second.key).toBe('DWP-6');
    expect(other.key).toBe('SPD-5');
  });

  it('creates one level of subtasks that inherit the parent project', async () => {
    const parent = await repos.tasks.create({ title: 'Parent', projectId: 'p3' });
    const child = await repos.tasks.create({ title: 'Child', parentId: parent.id });

    expect(parent.key).toBe('FG-4');
    expect(child.parentId).toBe(parent.id);
    expect(child.projectId).toBe('p3');
    expect(child.key).toBe('FG-5');

    await expect(repos.tasks.create({ title: 'Grandchild', parentId: child.id })).rejects.toThrow(
      'Subtasks cannot have subtasks',
    );
  });

  it('refuses to nest a task that already has subtasks', async () => {
    const parent = await repos.tasks.create({ title: 'Parent', projectId: 'p1' });
    await repos.tasks.create({ title: 'Child', parentId: parent.id });

    const other = await repos.tasks.create({ title: 'Other parent', projectId: 'p1' });

    await expect(
      repos.tasks.update(parent.id, { parentId: other.id }),
    ).rejects.toThrow('A task with subtasks cannot become a subtask');
  });

  it('detaches children when their parent is deleted and can promote a subtask', async () => {
    const parent = await repos.tasks.create({ title: 'Parent', projectId: 'p1' });
    const child = await repos.tasks.create({ title: 'Child', parentId: parent.id });

    const promoted = await repos.tasks.update(child.id, { parentId: null });
    expect(promoted.parentId).toBeUndefined();
    expect(promoted.projectId).toBe('p1');

    const reattached = await repos.tasks.update(child.id, { parentId: parent.id });
    expect(reattached.parentId).toBe(parent.id);

    await repos.tasks.remove(parent.id);

    const survivor = await repos.tasks.get(child.id);
    expect(survivor).not.toBeNull();
    expect(survivor?.parentId).toBeUndefined();
  });

  it('derives unique project keys from the name', async () => {
    const first = await repos.projects.create({ name: 'Demo Project' });
    const second = await repos.projects.create({ name: 'Demo Project' });

    expect(first.key).toBe('DP');
    expect(second.key).toBe('DP2');

    const renamed = await repos.projects.update(first.id, { name: 'Renamed' });
    expect(renamed.key).toBe('DP');
  });

  it('creates, updates and removes calendar events', async () => {
    const created = await repos.events.create({
      title: 'Design review',
      date: '2026-11-12',
      startTime: '10:00',
      endTime: '11:00',
      projectId: 'p1',
    });

    expect(created.id).toMatch(/^e_/);
    expect(created.startTime).toBe('10:00');
    expect(await repos.events.get(created.id)).toEqual(created);

    const updated = await repos.events.update(created.id, {
      title: 'Design review (moved)',
      endTime: null,
      projectId: null,
    });

    expect(updated.endTime).toBeUndefined();
    expect(updated.projectId).toBeUndefined();
    expect(updated.startTime).toBe('10:00');

    await repos.events.remove(created.id);
    expect(await repos.events.get(created.id)).toBeNull();
    await expect(repos.events.update('missing', { title: 'x' })).rejects.toThrow('Event not found');
  });

  it('creates areas and clears their references on delete', async () => {
    const area = await repos.areas.create({ name: 'Health', tone: 'danger', icon: 'heart' });

    expect(area.id).toMatch(/^a_/);
    expect(area.tone).toBe('danger');
    expect(await repos.areas.get(area.id)).toEqual(area);

    const updated = await repos.areas.update(area.id, { name: 'Wellbeing' });
    expect(updated.name).toBe('Wellbeing');

    const project = await repos.projects.create({ name: 'Clinic visits', areaId: area.id });
    const task = await repos.tasks.create({ title: 'Book checkup', areaId: area.id });
    const note = await repos.notes.create({ title: 'Checkup notes', areaId: area.id });

    expect(project.areaId).toBe(area.id);

    await repos.areas.remove(area.id);

    expect(await repos.areas.get(area.id)).toBeNull();
    expect((await repos.projects.get(project.id))?.areaId).toBeUndefined();
    expect((await repos.tasks.get(task.id))?.areaId).toBeUndefined();
    expect((await repos.notes.get(note.id))?.areaId).toBeUndefined();
    await expect(repos.areas.update(area.id, { name: 'x' })).rejects.toThrow('Area not found');
  });

  it('creates habits and enforces one check-in per day', async () => {
    const habit = await repos.habits.create({
      title: 'Run 4× a week',
      cadence: 'weekly',
      target: 4,
      schedule: { kind: 'fixed', weekdays: [1, 3, 5, 6] },
      startTime: '06:30',
      endTime: '07:15',
      projectId: 'p7',
    });

    expect(habit.id).toMatch(/^h_/);
    expect(habit.schedule).toEqual({ kind: 'fixed', weekdays: [1, 3, 5, 6] });
    expect(habit.startTime).toBe('06:30');

    const cleared = await repos.habits.update(habit.id, { startTime: null, endTime: null });
    expect(cleared.startTime).toBeUndefined();
    expect(cleared.endTime).toBeUndefined();

    const first = await repos.habits.checkIn(habit.id, '2026-11-09');
    const second = await repos.habits.checkIn(habit.id, '2026-11-09');
    expect(second.id).toBe(first.id);
    expect((await repos.habits.listCheckIns()).filter((entry) => entry.habitId === habit.id)).toHaveLength(1);

    await repos.habits.removeCheckIn(habit.id, '2026-11-09');
    expect((await repos.habits.listCheckIns()).some((entry) => entry.habitId === habit.id)).toBe(false);

    await expect(repos.habits.checkIn(habit.id, '09-11-2026')).rejects.toThrow(
      'Use a YYYY-MM-DD date for check-ins',
    );
    await expect(repos.habits.checkIn('missing', '2026-11-09')).rejects.toThrow('Habit not found');
  });

  it('archives, restores and deletes habits with their check-in history', async () => {
    const habit = await repos.habits.create({ title: 'Meditate', cadence: 'daily' });
    await repos.habits.checkIn(habit.id, '2026-11-09');

    await repos.habits.archive(habit.id);
    expect((await repos.habits.list()).some((entry) => entry.id === habit.id)).toBe(false);
    expect((await repos.habits.listArchived()).some((entry) => entry.id === habit.id)).toBe(true);

    await repos.habits.restore(habit.id);
    expect((await repos.habits.list()).some((entry) => entry.id === habit.id)).toBe(true);

    await repos.habits.remove(habit.id);
    expect(await repos.habits.get(habit.id)).toBeNull();
    expect((await repos.habits.listCheckIns()).some((entry) => entry.habitId === habit.id)).toBe(false);
  });

  it('reads and updates the singleton profile', async () => {
    const profile = await repos.profile.get();

    expect(profile.id).toBe('me');
    expect(profile.name).toBe('Raka Pratama');

    const updated = await repos.profile.update({
      name: 'Raka P.',
      email: 'raka.p@example.com',
      role: 'Engineering lead',
    });

    expect(updated.name).toBe('Raka P.');
    expect(updated.email).toBe('raka.p@example.com');
    expect(updated.role).toBe('Engineering lead');
    expect(updated.updatedAt).not.toBe(profile.updatedAt);
    expect(await repos.profile.get()).toEqual(updated);
  });

  it('returns null for unknown ids and throws on mutation', async () => {
    expect(await repos.tasks.get('missing')).toBeNull();
    await expect(repos.tasks.update('missing', { title: 'x' })).rejects.toThrow('Task not found');
    await expect(repos.inbox.archive('missing')).rejects.toThrow('Inbox item not found');
    await expect(repos.notes.remove('missing')).rejects.toThrow('Note not found');
    await expect(repos.projects.update('missing', { name: 'x' })).rejects.toThrow(
      'Project not found',
    );
  });

  it('archives, restores and removes inbox items', async () => {
    const item = await repos.inbox.create({ title: 'Call insurance', type: 'task' });

    expect((await repos.inbox.list()).map((entry) => entry.id)).toContain(item.id);

    const archived = await repos.inbox.archive(item.id);
    expect(archived.archivedAt).toBeTruthy();
    expect((await repos.inbox.list()).map((entry) => entry.id)).not.toContain(item.id);
    expect((await repos.inbox.listArchived()).map((entry) => entry.id)).toContain(item.id);

    const restored = await repos.inbox.restore(item.id);
    expect(restored.archivedAt).toBeUndefined();
    expect((await repos.inbox.list()).map((entry) => entry.id)).toContain(item.id);

    await repos.inbox.remove(item.id);
    expect(await repos.inbox.get(item.id)).toBeNull();
  });

  it('keeps archive idempotent', async () => {
    const item = await repos.inbox.create({ title: 'Archive twice', type: 'note' });
    const first = await repos.inbox.archive(item.id);
    const second = await repos.inbox.archive(item.id);

    expect(second.archivedAt).toBe(first.archivedAt);
  });

  it('stamps updatedAt on project and note updates', async () => {
    const [project] = await repos.projects.list();
    const updatedProject = await repos.projects.update(project.id, { description: 'New scope' });

    expect(updatedProject.description).toBe('New scope');
    expect(updatedProject.updatedAt).not.toBe(project.updatedAt);
    expect(updatedProject.createdAt).toBe(project.createdAt);

    const note = await repos.notes.create({ title: 'Draft' });
    expect(note.content).toBe('');
    expect(note.tags).toEqual([]);

    const updatedNote = await repos.notes.update(note.id, { tags: ['meta'], projectId: null });
    expect(updatedNote.tags).toEqual(['meta']);
    expect(updatedNote.projectId).toBeUndefined();
    expect(updatedNote.updatedAt >= note.updatedAt).toBe(true);
  });

  it('unlinks notes and tasks from deleted projects without losing the record', async () => {
    const project = await repos.projects.create({ name: 'Disposable' });
    const task = await repos.tasks.create({ title: 'Linked task', projectId: project.id });

    await repos.projects.remove(project.id);

    expect(await repos.projects.get(project.id)).toBeNull();
    expect((await repos.tasks.get(task.id))?.projectId).toBe(project.id);
  });
});
