import type { ActivityLevel, Goal, Macros, MacroSplit, MealSlot, Settings } from './types';

export const PA_COEFFICIENT: Record<ActivityLevel, number> = {
  sedentary: 1.0,
  lowActive: 1.12,
  active: 1.27,
  veryActive: 1.54,
};

export const GOAL_OFFSET_KCAL: Record<Goal, number> = { lose: -500, maintain: 0, gain: 500 };

export const KCAL_PER_GRAM: Macros = { carbs: 4, fat: 9, protein: 4 };

export const SLOT_ORDER: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export const DEFAULT_MACRO_SPLIT: MacroSplit = { carbsPct: 40, fatPct: 30, proteinPct: 30 };

export const DEFAULT_SETTINGS: Settings = {
  age: 30,
  heightCm: 175,
  weightLbs: 170,
  activityLevel: 'lowActive',
  goal: 'maintain',
  dailyKcalAdjustment: 0,
  macroSplit: DEFAULT_MACRO_SPLIT,
};
