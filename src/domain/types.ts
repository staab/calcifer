export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type ActivityLevel = 'sedentary' | 'lowActive' | 'active' | 'veryActive';
export type Goal = 'lose' | 'maintain' | 'gain';

export interface Macros {
  carbs: number;
  fat: number;
  protein: number;
}

export interface UnboundActivity {
  id: string;
  title: string;
  description: string;
  caloriesPerHour: number;
  lastUsedAt: number;
}

export interface UnboundMeal {
  id: string;
  title: string;
  description: string;
  macrosPer100g: Macros;
  lastUsedAt: number;
}

// bound entries snapshot their unbound source, so deleting either never affects the other
export interface BoundActivity {
  id: string;
  title: string;
  description: string;
  caloriesPerHour: number;
  minutes: number;
  loggedAt: number;
}

export interface BoundMeal {
  id: string;
  title: string;
  description: string;
  macrosPer100g: Macros;
  grams: number;
  slot: MealSlot;
  loggedAt: number;
}

export interface DayLog {
  activities: BoundActivity[];
  meals: BoundMeal[];
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
