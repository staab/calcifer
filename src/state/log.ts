import { persisted } from './persist';
import { createStorage } from '$src/adapters/storage';
import { emptyDayLog } from '$src/domain/daylog';
import type { Activity, DayLog, DayLogs, Meal } from '$src/domain/types';

export const dayLogs = persisted<DayLogs>(createStorage(), 'calcifer.dayLogs', {});

function updateDay(date: string, fn: (log: DayLog) => DayLog): void {
  dayLogs.update((logs) => ({ ...logs, [date]: fn(logs[date] ?? emptyDayLog()) }));
}

export function addActivity(date: string, entry: Omit<Activity, 'id' | 'loggedAt'>): void {
  updateDay(date, (log) => ({
    ...log,
    activities: [...log.activities, { ...entry, id: crypto.randomUUID(), loggedAt: Date.now() }],
  }));
}

export function addMeal(date: string, entry: Omit<Meal, 'id' | 'loggedAt'>): void {
  updateDay(date, (log) => ({
    ...log,
    meals: [...log.meals, { ...entry, id: crypto.randomUUID(), loggedAt: Date.now() }],
  }));
}

export function removeActivity(date: string, id: string): void {
  updateDay(date, (log) => ({ ...log, activities: log.activities.filter((a) => a.id !== id) }));
}

export function removeMeal(date: string, id: string): void {
  updateDay(date, (log) => ({ ...log, meals: log.meals.filter((m) => m.id !== id) }));
}
