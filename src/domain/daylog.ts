import type { DayLog, DayLogs, Macros, Meal, MealSlot } from './types';
import { activityCalories, mealCalories, mealMacros } from './energy';
import { addDays, lastNDays } from '$lib/date';

export interface DayTotals {
  consumed: number;
  burned: number;
  macros: Macros;
}

export function emptyDayLog(): DayLog {
  return { activities: [], meals: [] };
}

export function dayTotals(log: DayLog): DayTotals {
  const macros: Macros = { carbs: 0, fat: 0, protein: 0 };
  let consumed = 0;
  for (const meal of log.meals) {
    consumed += mealCalories(meal.macrosPerGram, meal.grams);
    const m = mealMacros(meal.macrosPerGram, meal.grams);
    macros.carbs += m.carbs;
    macros.fat += m.fat;
    macros.protein += m.protein;
  }
  const burned = log.activities.reduce((sum, a) => sum + activityCalories(a.caloriesPerHour, a.minutes), 0);
  return { consumed, burned, macros };
}

export function mealsBySlot(log: DayLog): Record<MealSlot, Meal[]> {
  const bySlot: Record<MealSlot, Meal[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
  for (const meal of log.meals) bySlot[meal.slot].push(meal);
  return bySlot;
}

export function slotTotals(meals: Meal[]): { calories: number; macros: Macros } {
  const macros: Macros = { carbs: 0, fat: 0, protein: 0 };
  let calories = 0;
  for (const meal of meals) {
    calories += mealCalories(meal.macrosPerGram, meal.grams);
    const m = mealMacros(meal.macrosPerGram, meal.grams);
    macros.carbs += m.carbs;
    macros.fat += m.fat;
    macros.protein += m.protein;
  }
  return { calories, macros };
}

export interface DayPoint {
  date: string;
  calories: number;
  carbs: number;
  fat: number;
  protein: number;
}

export function seriesForRange(logs: DayLogs, days: number | 'all', today: string): DayPoint[] {
  let keys: string[];
  if (days === 'all') {
    const earliest = Object.keys(logs).sort()[0] ?? today;
    keys = [];
    for (let key = earliest; key <= today; key = addDays(key, 1)) keys.push(key);
  } else {
    keys = lastNDays(days, today);
  }
  return keys.map((date) => {
    const log = logs[date];
    if (!log) return { date, calories: 0, carbs: 0, fat: 0, protein: 0 };
    const totals = dayTotals(log);
    return { date, calories: totals.consumed, ...totals.macros };
  });
}

export function dailyAverage(points: DayPoint[]): { calories: number; carbs: number; fat: number; protein: number } {
  const withData = points.filter((p) => p.calories > 0);
  if (withData.length === 0) return { calories: 0, carbs: 0, fat: 0, protein: 0 };
  const n = withData.length;
  const sum = (f: (p: DayPoint) => number) => withData.reduce((s, p) => s + f(p), 0);
  return {
    calories: sum((p) => p.calories) / n,
    carbs: sum((p) => p.carbs) / n,
    fat: sum((p) => p.fat) / n,
    protein: sum((p) => p.protein) / n,
  };
}

export interface RecentActivity {
  title: string;
  description: string;
  caloriesPerHour: number;
}

export interface RecentMeal {
  title: string;
  description: string;
  macrosPerGram: Macros;
}

function dedupeByTitle<T extends { title: string }>(items: T[], limit: number): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = item.title.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
    if (result.length >= limit) break;
  }
  return result;
}

export function recentActivities(logs: DayLogs, limit = 20): RecentActivity[] {
  const all = Object.values(logs)
    .flatMap((log) => log.activities)
    .sort((a, b) => b.loggedAt - a.loggedAt);
  return dedupeByTitle(all, limit).map(({ title, description, caloriesPerHour }) => ({
    title,
    description,
    caloriesPerHour,
  }));
}

export function recentMeals(logs: DayLogs, limit = 20): RecentMeal[] {
  const all = Object.values(logs)
    .flatMap((log) => log.meals)
    .sort((a, b) => b.loggedAt - a.loggedAt);
  return dedupeByTitle(all, limit).map(({ title, description, macrosPerGram }) => ({
    title,
    description,
    macrosPerGram,
  }));
}
