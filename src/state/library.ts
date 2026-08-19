import { persisted } from './persist';
import { createStorage } from '$src/adapters/storage';
import type { UnboundActivity, UnboundMeal } from '$src/domain/types';

export const unboundActivities = persisted<UnboundActivity[]>(createStorage(), 'calcifer.unboundActivities', []);
export const unboundMeals = persisted<UnboundMeal[]>(createStorage(), 'calcifer.unboundMeals', []);

const titleKey = (title: string) => title.trim().toLowerCase();

// lists stay ordered most-recently-used first
function upsert<T extends { id: string; title: string }>(items: T[], item: T): T[] {
  return [item, ...items.filter((i) => titleKey(i.title) !== titleKey(item.title))];
}

function touch<T extends { id: string; lastUsedAt: number }>(items: T[], id: string, now: number): T[] {
  const item = items.find((i) => i.id === id);
  return item ? [{ ...item, lastUsedAt: now }, ...items.filter((i) => i.id !== id)] : items;
}

export function saveUnboundActivity(entry: Omit<UnboundActivity, 'id' | 'lastUsedAt'>): UnboundActivity {
  const item: UnboundActivity = { ...entry, id: crypto.randomUUID(), lastUsedAt: Date.now() };
  unboundActivities.update((items) => upsert(items, item));
  return item;
}

export function saveUnboundMeal(entry: Omit<UnboundMeal, 'id' | 'lastUsedAt'>): UnboundMeal {
  const item: UnboundMeal = { ...entry, id: crypto.randomUUID(), lastUsedAt: Date.now() };
  unboundMeals.update((items) => upsert(items, item));
  return item;
}

export function touchUnboundActivity(id: string): void {
  unboundActivities.update((items) => touch(items, id, Date.now()));
}

export function touchUnboundMeal(id: string): void {
  unboundMeals.update((items) => touch(items, id, Date.now()));
}

export function removeUnboundActivity(id: string): void {
  unboundActivities.update((items) => items.filter((i) => i.id !== id));
}

export function removeUnboundMeal(id: string): void {
  unboundMeals.update((items) => items.filter((i) => i.id !== id));
}
