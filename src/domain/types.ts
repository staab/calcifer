export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type ActivityLevel = 'sedentary' | 'lowActive' | 'active' | 'veryActive';
export type Goal = 'lose' | 'maintain' | 'gain';

export interface Macros {
  carbs: number;
  fat: number;
  protein: number;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  caloriesPerHour: number;
  minutes: number;
  loggedAt: number;
}

export interface Meal {
  id: string;
  title: string;
  description: string;
  macrosPerGram: Macros;
  grams: number;
  slot: MealSlot;
  loggedAt: number;
}

export interface DayLog {
  activities: Activity[];
  meals: Meal[];
}

export type DayLogs = Record<string, DayLog>;

export interface MacroSplit {
  carbsPct: number;
  fatPct: number;
  proteinPct: number;
}

export interface Settings {
  age: number;
  heightCm: number;
  weightLbs: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  dailyKcalAdjustment: number;
  macroSplit: MacroSplit;
}

export interface MacroTargets {
  calories: number;
  carbs: number;
  fat: number;
  protein: number;
}
