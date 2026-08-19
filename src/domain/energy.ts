import type { Macros, MacroSplit, MacroTargets, Settings } from './types';
import { GOAL_OFFSET_KCAL, KCAL_PER_GRAM, PA_COEFFICIENT } from './constants';

export function lbsToKg(lbs: number): number {
  return lbs * 0.45359237;
}

// IOM 2005: PA multiplies only the weight term (matches the reference screenshot).
export function tdee(s: Settings): number {
  const kg = lbsToKg(s.weightLbs);
  const m = s.heightCm / 100;
  const pa = PA_COEFFICIENT[s.activityLevel];
  return Math.round(864 - 9.72 * s.age + pa * 14.2 * kg + 503 * m);
}

export function calorieGoal(s: Settings, activityBurnedKcal: number): number {
  return tdee(s) + GOAL_OFFSET_KCAL[s.goal] + s.dailyKcalAdjustment + activityBurnedKcal;
}

export function macroTargets(s: Settings, activityBurnedKcal: number): MacroTargets {
  const calories = calorieGoal(s, activityBurnedKcal);
  const { carbsPct, fatPct, proteinPct } = s.macroSplit;
  return {
    calories,
    carbs: Math.round((calories * carbsPct) / 100 / KCAL_PER_GRAM.carbs),
    fat: Math.round((calories * fatPct) / 100 / KCAL_PER_GRAM.fat),
    protein: Math.round((calories * proteinPct) / 100 / KCAL_PER_GRAM.protein),
  };
}

export function activityCalories(caloriesPerHour: number, minutes: number): number {
  return Math.round((caloriesPerHour * minutes) / 60);
}

export function mealMacros(macrosPerGram: Macros, grams: number): Macros {
  const dp1 = (n: number) => Math.round(n * 10) / 10;
  return {
    carbs: dp1(macrosPerGram.carbs * grams),
    fat: dp1(macrosPerGram.fat * grams),
    protein: dp1(macrosPerGram.protein * grams),
  };
}

export function caloriesFromMacros(m: Macros): number {
  return KCAL_PER_GRAM.carbs * m.carbs + KCAL_PER_GRAM.fat * m.fat + KCAL_PER_GRAM.protein * m.protein;
}

export function mealCalories(macrosPerGram: Macros, grams: number): number {
  return Math.round(caloriesFromMacros(mealMacros(macrosPerGram, grams)));
}

export function rebalanceSplit(split: MacroSplit, changed: keyof MacroSplit, value: number): MacroSplit {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const keys: (keyof MacroSplit)[] = ['carbsPct', 'fatPct', 'proteinPct'];
  const [a, b] = keys.filter((k) => k !== changed);
  const rest = 100 - v;
  const sum = split[a] + split[b];
  const share = sum === 0 ? 0.5 : split[a] / sum;
  const first = Math.round(rest * share);
  return { ...split, [changed]: v, [a]: first, [b]: rest - first };
}
