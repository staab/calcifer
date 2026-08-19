import type { Migration } from './persist';
import type { BoundMeal, DayLogs, Macros } from '$src/domain/types';

/**
 * migrations[n] upgrades data from version n to n + 1.
 * Unwrapped values written before versioning are treated as version 1.
 */

// v1 loaded arrays through an object spread, corrupting them into { "0": ..., "1": ... }
export const repairArray: Migration = (data) => {
  if (Array.isArray(data)) return data;
  if (typeof data === 'object' && data !== null) return Object.values(data);
  return [];
};

// v1 stored meal macros per gram; v2 stores them per 100 g
export const macrosPerGramToPer100g: Migration = (data) => {
  const logs = data as DayLogs;
  for (const log of Object.values(logs)) {
    if (!Array.isArray(log?.meals)) continue;
    for (const meal of log.meals) {
      const legacy = (meal as Partial<BoundMeal> & { macrosPerGram?: Macros }).macrosPerGram;
      if (legacy && !meal.macrosPer100g) {
        meal.macrosPer100g = { carbs: legacy.carbs * 100, fat: legacy.fat * 100, protein: legacy.protein * 100 };
        delete (meal as { macrosPerGram?: Macros }).macrosPerGram;
      }
    }
  }
  return logs;
};
