import { createId } from '@/lib/id';
import type { HabitRepository, UpdateHabit } from '@/services/repositories/contracts';
import type { Habit, HabitCheckIn, NewHabit } from '@/types';
import { todayIso } from '@/lib/date';
import { latency } from './latency';
import { loadDatabase, saveDatabase } from './storage';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function indexOf(habits: Habit[], id: string): number {
  const index = habits.findIndex((habit) => habit.id === id);
  if (index === -1) throw new Error('Habit not found');
  return index;
}

export function createHabitRepository(): HabitRepository {
  return {
    async list() {
      await latency();
      return loadDatabase().habits.filter((habit) => !habit.archivedAt);
    },

    async listArchived() {
      await latency();
      return loadDatabase().habits.filter((habit) => Boolean(habit.archivedAt));
    },

    async get(id) {
      await latency();
      return loadDatabase().habits.find((habit) => habit.id === id) ?? null;
    },

    async create(input: NewHabit) {
      await latency();
      const db = loadDatabase();
      const timestamp = new Date().toISOString();
      const habit: Habit = {
        id: createId('h'),
        title: input.title,
        cadence: input.cadence ?? 'weekly',
        target: input.target ?? 1,
        schedule: input.schedule ?? { kind: 'flexible' },
        startDate: input.startDate ?? todayIso(),
        createdAt: timestamp,
        updatedAt: timestamp,
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.areaId !== undefined ? { areaId: input.areaId } : {}),
        ...(input.projectId !== undefined ? { projectId: input.projectId } : {}),
        ...(input.startTime !== undefined ? { startTime: input.startTime } : {}),
        ...(input.endTime !== undefined ? { endTime: input.endTime } : {}),
        ...(input.reminderEnabled !== undefined
          ? { reminderEnabled: input.reminderEnabled }
          : {}),
        ...(input.reminderLeadMinutes !== undefined
          ? { reminderLeadMinutes: input.reminderLeadMinutes }
          : {}),
      };

      db.habits.push(habit);
      saveDatabase(db);
      return habit;
    },

    async update(id: string, patch: UpdateHabit) {
      await latency();
      const db = loadDatabase();
      const index = indexOf(db.habits, id);
      const next: Habit = { ...db.habits[index], updatedAt: new Date().toISOString() };

      if (patch.title !== undefined) next.title = patch.title;
      if (patch.description !== undefined) next.description = patch.description;
      if (patch.cadence !== undefined) next.cadence = patch.cadence;
      if (patch.target !== undefined) next.target = Math.max(1, Math.round(patch.target));
      if (patch.schedule !== undefined) next.schedule = patch.schedule;
      if (patch.startTime !== undefined) {
        if (patch.startTime === null) delete next.startTime;
        else next.startTime = patch.startTime;
      }
      if (patch.endTime !== undefined) {
        if (patch.endTime === null) delete next.endTime;
        else next.endTime = patch.endTime;
      }
      if (patch.reminderEnabled !== undefined) {
        if (patch.reminderEnabled === null) delete next.reminderEnabled;
        else next.reminderEnabled = patch.reminderEnabled;
      }
      if (patch.reminderLeadMinutes !== undefined) {
        if (patch.reminderLeadMinutes === null) delete next.reminderLeadMinutes;
        else next.reminderLeadMinutes = patch.reminderLeadMinutes;
      }
      if (patch.startDate !== undefined) next.startDate = patch.startDate;

      if (patch.areaId !== undefined) {
        if (patch.areaId === null) delete next.areaId;
        else next.areaId = patch.areaId;
      }
      if (patch.projectId !== undefined) {
        if (patch.projectId === null) delete next.projectId;
        else next.projectId = patch.projectId;
      }
      if (patch.archivedAt !== undefined) {
        if (patch.archivedAt === null) delete next.archivedAt;
        else next.archivedAt = patch.archivedAt;
      }

      db.habits[index] = next;
      saveDatabase(db);
      return next;
    },

    async archive(id: string) {
      await latency();
      const db = loadDatabase();
      const index = indexOf(db.habits, id);
      const next: Habit = {
        ...db.habits[index],
        archivedAt: db.habits[index].archivedAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.habits[index] = next;
      saveDatabase(db);
      return next;
    },

    async restore(id: string) {
      await latency();
      const db = loadDatabase();
      const index = indexOf(db.habits, id);
      const next: Habit = { ...db.habits[index], updatedAt: new Date().toISOString() };
      delete next.archivedAt;
      db.habits[index] = next;
      saveDatabase(db);
      return next;
    },

    async remove(id: string) {
      await latency();
      const db = loadDatabase();
      const index = indexOf(db.habits, id);
      db.habits.splice(index, 1);
      db.habitCheckIns = db.habitCheckIns.filter((entry) => entry.habitId !== id);
      saveDatabase(db);
    },

    async listCheckIns() {
      await latency();
      return loadDatabase().habitCheckIns;
    },

    async checkIn(habitId: string, date: string) {
      await latency();
      if (!DATE_ONLY.test(date)) throw new Error('Use a YYYY-MM-DD date for check-ins');

      const db = loadDatabase();
      if (!db.habits.some((habit) => habit.id === habitId)) throw new Error('Habit not found');

      const existing = db.habitCheckIns.find(
        (entry) => entry.habitId === habitId && entry.date === date,
      );
      if (existing) return existing;

      const checkIn: HabitCheckIn = {
        id: createId('hc'),
        habitId,
        date,
        createdAt: new Date().toISOString(),
      };
      db.habitCheckIns.push(checkIn);
      saveDatabase(db);
      return checkIn;
    },

    async removeCheckIn(habitId: string, date: string) {
      await latency();
      const db = loadDatabase();
      if (!db.habits.some((habit) => habit.id === habitId)) throw new Error('Habit not found');

      db.habitCheckIns = db.habitCheckIns.filter(
        (entry) => !(entry.habitId === habitId && entry.date === date),
      );
      saveDatabase(db);
    },
  };
}
