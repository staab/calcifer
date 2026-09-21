import { CapacitorHttp } from '@capacitor/core';
import type { Macros } from '$src/domain/types';

// the api key and the estimation prompts both live on the server, so they can be
// tuned without shipping an app release
const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
const TIMEOUT_MS = 15000;

/** false only if the bundle was built without an api url, so callers can hide the feature */
export const canEstimate = BASE_URL !== '';

export interface ActivityEstimate {
  caloriesPerHour: number;
}

export interface MealEstimate {
  macrosPer100g: Macros;
  servingGrams: number;
}

const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

async function post(path: string, body: unknown): Promise<Record<string, unknown> | null> {
  if (BASE_URL === '') return null;
  try {
    const res = await CapacitorHttp.post({
      url: `${BASE_URL}${path}`,
      headers: { 'Content-Type': 'application/json' },
      connectTimeout: TIMEOUT_MS,
      readTimeout: TIMEOUT_MS,
      data: body,
    });
    if (res.status < 200 || res.status >= 300) return null;
    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
    return typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

// A duration the user spelled out is arithmetic, not a judgment, so code reads it
// here and only genuinely vague wording ("a walk around the block") costs a request.
function parseMinutes(text: string): number | null {
  const s = text.toLowerCase();
  const combined = s.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\s*(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)?\b/);
  if (combined) return Number(combined[1]) * 60 + Number(combined[2]);

  let total = 0;
  let matched = false;
  const units: [RegExp, number][] = [
    [/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/g, 60],
    [/(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)\b/g, 1],
  ];
  for (const [re, factor] of units) {
    for (const match of s.matchAll(re)) {
      total += Number(match[1]) * factor;
      matched = true;
    }
  }
  if (matched) return total;

  const bare = s.match(/^\s*(\d+(?:\.\d+)?)\s*$/);
  return bare ? Number(bare[1]) : null;
}

// Same idea for a weight the user stated outright. Millilitres are treated as grams,
// which holds for most foods and drinks but not for oils or spirits.
function parseGrams(text: string): number | null {
  const s = text.toLowerCase();
  const units: [RegExp, number][] = [
    [/(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilos|kilogram|kilograms)\b/, 1000],
    [/(\d+(?:\.\d+)?)\s*(?:lb|lbs|pound|pounds)\b/, 453.6],
    [/(\d+(?:\.\d+)?)\s*(?:oz|ounce|ounces)\b/, 28.35],
    [/(\d+(?:\.\d+)?)\s*(?:l|litre|litres|liter|liters)\b/, 1000],
    [/(\d+(?:\.\d+)?)\s*(?:g|gram|grams)\b/, 1],
    [/(\d+(?:\.\d+)?)\s*(?:ml|millilitre|millilitres|milliliter|milliliters)\b/, 1],
  ];
  for (const [re, factor] of units) {
    const match = s.match(re);
    if (match) return Number(match[1]) * factor;
  }
  return null;
}

export async function estimateActivityCaloriesPerHour(
  title: string,
  description: string
): Promise<ActivityEstimate | null> {
  const result = await post('/v1/activity/rate', { title, description });
  if (!result || !num(result.caloriesPerHour)) return null;
  return { caloriesPerHour: result.caloriesPerHour };
}

export async function estimateMealMacros(title: string, description: string): Promise<MealEstimate | null> {
  const result = await post('/v1/meal/macros', { title, description });
  if (!result) return null;
  const { carbs, fat, protein, servingGrams } = result;
  if (!num(carbs) || !num(fat) || !num(protein) || !num(servingGrams)) return null;
  return { macrosPer100g: { carbs, fat, protein }, servingGrams };
}

export async function estimateActivityMinutes(
  title: string,
  description: string,
  estimate: string
): Promise<number | null> {
  const stated = parseMinutes(estimate);
  if (stated !== null) return Math.round(clamp(stated, 0, 1440));

  const result = await post('/v1/activity/minutes', { title, description, duration: estimate });
  return result && num(result.minutes) ? result.minutes : null;
}

export async function estimateMealGrams(
  title: string,
  description: string,
  estimate: string
): Promise<number | null> {
  const stated = parseGrams(estimate);
  if (stated !== null) return Math.round(clamp(stated, 0, 5000));

  const result = await post('/v1/meal/grams', { title, description, portion: estimate });
  return result && num(result.grams) ? result.grams : null;
}
