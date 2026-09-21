import { CapacitorHttp } from '@capacitor/core';
import type { Macros } from '$src/domain/types';

// the api key stays on the proxy, so nothing secret ships in the bundle
const ENDPOINT = import.meta.env.VITE_JEV_PROXY_URL ?? '';
const MODEL = 'jev-latest';
const TIMEOUT_MS = 15000;

/** false only if the bundle was built without a proxy url, so callers can hide the feature */
export const canEstimate = ENDPOINT !== '';

export interface ActivityEstimate {
  caloriesPerHour: number;
}

export interface MealEstimate {
  macrosPer100g: Macros;
  servingGrams: number;
}

/**
 * Jev answers with a judgment, never a free-form number: a Score comes back as a
 * position along the levels it was given, which can fall between two of them. Each
 * level therefore anchors a value, and code interpolates the position back into one.
 */
interface Level {
  label: string;
  value: number;
}

const CALORIES_PER_HOUR: Level[] = [
  { label: 'Sitting or lying still, such as desk work or watching television', value: 75 },
  { label: 'On your feet but barely exerting, such as light housework or a slow stroll', value: 150 },
  { label: 'Easy sustained movement, such as walking at a normal pace or cycling gently', value: 250 },
  { label: 'Moderate effort that noticeably raises breathing, such as brisk walking, recreational swimming, or doubles tennis', value: 370 },
  { label: 'Hard continuous effort, such as jogging, swimming laps, or cycling at speed', value: 550 },
  { label: 'Very hard sustained effort, such as running at pace, singles squash, or a hard rowing session', value: 800 },
  { label: 'Near-maximal effort, such as sprint intervals, competitive racing, or hard interval training', value: 1100 },
];

const CARBS_PER_100G: Level[] = [
  { label: 'No meaningful carbohydrate, such as meat, fish, eggs, or cooking oil', value: 0 },
  { label: 'Very little, such as leafy greens, non-starchy vegetables, or hard cheese', value: 3 },
  { label: 'A small amount, such as milk, plain yogurt, or tomatoes', value: 8 },
  { label: 'A moderate amount, such as whole fruit, cooked beans, or cooked pasta and rice', value: 20 },
  { label: 'A lot, such as bread, dried fruit, or a sweet pastry', value: 45 },
  { label: 'Very carbohydrate dense, such as dry oats, flour, or crackers', value: 65 },
  { label: 'Almost entirely carbohydrate, such as sugar, honey, or hard candy', value: 90 },
];

const FAT_PER_100G: Level[] = [
  { label: 'Essentially fat free, such as fruit, plain vegetables, or sugar', value: 0 },
  { label: 'Very little, such as skimmed milk, white fish, or cooked beans', value: 2 },
  { label: 'A small amount, such as skinless chicken breast or low-fat yogurt', value: 5 },
  { label: 'A moderate amount, such as whole milk, eggs, or lean beef', value: 11 },
  { label: 'A lot, such as fatty cuts of meat, most cheese, or a fried dish', value: 22 },
  { label: 'Very fat dense, such as nuts, seeds, or cream', value: 45 },
  { label: 'Almost entirely fat, such as butter, lard, or cooking oil', value: 85 },
];

const PROTEIN_PER_100G: Level[] = [
  { label: 'Essentially no protein, such as cooking oil, sugar, fruit juice, or soda', value: 0 },
  { label: 'Very little, such as whole fruit, most vegetables, or butter', value: 2 },
  { label: 'A small amount, such as milk, cooked rice, or bread', value: 6 },
  { label: 'A moderate amount, such as yogurt, cooked beans, or cooked pasta', value: 11 },
  { label: 'A lot, such as eggs, tofu, or cottage cheese', value: 17 },
  { label: 'Very protein dense, such as cooked chicken, fish, beef, or most cheese', value: 26 },
  { label: 'Almost entirely protein, such as protein powder, dried egg white, or jerky', value: 60 },
];

const SERVING_GRAMS: Level[] = [
  { label: 'A single bite or a teaspoon, such as a sugar cube or a mint', value: 5 },
  { label: 'A tablespoon or a garnish, such as a spoon of sauce or a small handful of nuts', value: 15 },
  { label: 'A small side, such as one piece of fruit, a slice of bread, or a pot of yogurt', value: 60 },
  { label: 'One standard serving, such as a sandwich, a bowl of cereal, or a chicken breast', value: 180 },
  { label: 'A full main course, such as a plate of pasta or a burrito', value: 350 },
  { label: 'A large main or a generous restaurant plate', value: 550 },
  { label: 'An unusually large meal, such as a sharing platter eaten alone', value: 900 },
];

const MINUTES: Level[] = [
  { label: 'A brief moment, under five minutes', value: 3 },
  { label: 'A short burst of around ten minutes', value: 10 },
  { label: 'About a quarter of an hour', value: 15 },
  { label: 'About half an hour', value: 30 },
  { label: 'About an hour', value: 60 },
  { label: 'A long session of two to three hours', value: 150 },
  { label: 'Most of a day, four hours or more', value: 300 },
];

const PORTION_GRAMS: Level[] = [
  { label: 'A taste or a single bite of this food', value: 10 },
  { label: 'A small snack portion or a side garnish of this food', value: 40 },
  { label: 'A small serving of this food, such as one piece or one slice', value: 90 },
  { label: 'One standard serving of this food', value: 200 },
  { label: 'A generous serving, noticeably more than standard', value: 350 },
  { label: 'A large or double portion', value: 550 },
  { label: 'An unusually large amount, such as a sharing platter eaten alone', value: 900 },
];

interface ScoreQuestion {
  type: 'score';
  instructions: string;
  criteria: string[];
}

const question = (instructions: string, levels: Level[]): ScoreQuestion => ({
  type: 'score',
  instructions,
  criteria: levels.map((l) => l.label),
});

async function ask(
  state: unknown,
  questions: Record<string, ScoreQuestion>
): Promise<Record<string, unknown> | null> {
  if (ENDPOINT === '') return null;
  try {
    const res = await CapacitorHttp.post({
      url: ENDPOINT,
      headers: { 'Content-Type': 'application/json' },
      connectTimeout: TIMEOUT_MS,
      readTimeout: TIMEOUT_MS,
      data: { state, model: MODEL, questions },
    });
    if (res.status < 200 || res.status >= 300) return null;
    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
    const answers: unknown = data?.answers;
    return typeof answers === 'object' && answers !== null ? (answers as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function readScore(answers: Record<string, unknown> | null, id: string, levels: Level[]): number | null {
  const score = (answers?.[id] as { score?: unknown } | undefined)?.score;
  if (typeof score !== 'number' || !Number.isFinite(score)) return null;
  const position = Math.min(Math.max(score, 0), levels.length - 1);
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return levels[lower].value;
  return levels[lower].value + (position - lower) * (levels[upper].value - levels[lower].value);
}

// A duration the user spelled out is arithmetic, not a judgment, so code reads it
// and only genuinely vague wording ("a walk around the block") reaches Jev.
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

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

export async function estimateActivityCaloriesPerHour(
  title: string,
  description: string
): Promise<ActivityEstimate | null> {
  const answers = await ask(
    { activity: { name: title, description } },
    {
      intensity: question(
        'How hard is an average adult working while doing `activity.name`, taking `activity.description` into account?',
        CALORIES_PER_HOUR
      ),
    }
  );
  const caloriesPerHour = readScore(answers, 'intensity', CALORIES_PER_HOUR);
  if (caloriesPerHour === null) return null;
  return { caloriesPerHour: Math.round(clamp(caloriesPerHour, 0, 3000)) };
}

export async function estimateMealMacros(title: string, description: string): Promise<MealEstimate | null> {
  // the four judgments share one state, so they go in a single request and run in parallel
  const answers = await ask(
    { food: { name: title, description } },
    {
      carbs: question('How much carbohydrate does 100 g of `food.name` contain, taking `food.description` into account?', CARBS_PER_100G),
      fat: question('How much fat does 100 g of `food.name` contain, taking `food.description` into account?', FAT_PER_100G),
      protein: question('How much protein does 100 g of `food.name` contain, taking `food.description` into account?', PROTEIN_PER_100G),
      serving: question('How much does one portion of `food.name` weigh, as described in `food.description`?', SERVING_GRAMS),
    }
  );
  const carbs = readScore(answers, 'carbs', CARBS_PER_100G);
  const fat = readScore(answers, 'fat', FAT_PER_100G);
  const protein = readScore(answers, 'protein', PROTEIN_PER_100G);
  const servingGrams = readScore(answers, 'serving', SERVING_GRAMS);
  if (carbs === null || fat === null || protein === null || servingGrams === null) return null;

  const round = (n: number) => Math.round(clamp(n, 0, 100) * 10) / 10;
  const macrosPer100g = { carbs: round(carbs), fat: round(fat), protein: round(protein) };
  // the three judgments are independent, so an incoherent combination is possible;
  // macros are constituents of the food, so they cannot exceed its weight
  if (macrosPer100g.carbs + macrosPer100g.fat + macrosPer100g.protein > 100) return null;

  return { macrosPer100g, servingGrams: Math.round(clamp(servingGrams, 1, 5000)) };
}

export async function estimateActivityMinutes(
  title: string,
  description: string,
  estimate: string
): Promise<number | null> {
  const stated = parseMinutes(estimate);
  if (stated !== null) return Math.round(clamp(stated, 0, 1440));

  const answers = await ask(
    { activity: { name: title, description }, duration: estimate },
    {
      minutes: question('How long did `duration` last, for someone doing `activity.name`?', MINUTES),
    }
  );
  const minutes = readScore(answers, 'minutes', MINUTES);
  return minutes === null ? null : Math.round(clamp(minutes, 0, 1440));
}

export async function estimateMealGrams(
  title: string,
  description: string,
  estimate: string
): Promise<number | null> {
  const stated = parseGrams(estimate);
  if (stated !== null) return Math.round(clamp(stated, 0, 5000));

  const answers = await ask(
    { food: { name: title, description }, portion: estimate },
    {
      grams: question('How much does the portion in `portion` weigh, given that the food is `food.name`?', PORTION_GRAMS),
    }
  );
  const grams = readScore(answers, 'grams', PORTION_GRAMS);
  return grams === null ? null : Math.round(clamp(grams, 0, 5000));
}
