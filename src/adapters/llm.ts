import type { Macros } from '$src/domain/types';

const ENDPOINT = 'http://localhost:11434/api/chat';
const MODEL = 'llama3.2';
const TIMEOUT_MS = 5000;

export interface ActivityEstimate {
  caloriesPerHour: number;
}

export interface MealEstimate {
  macrosPerGram: Macros;
}

export interface LlmAdapter {
  estimateActivityCaloriesPerHour(title: string, description: string): Promise<ActivityEstimate | null>;
  estimateMealMacrosPerGram(title: string, description: string): Promise<MealEstimate | null>;
}

async function chat(system: string, user: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        format: 'json',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const parsed = JSON.parse(data.message?.content ?? '');
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

const inRange = (n: unknown, min: number, max: number): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;

export function createLlm(): LlmAdapter {
  return {
    async estimateActivityCaloriesPerHour(title, description) {
      const result = await chat(
        'You estimate calories burned by physical activities. Respond with ONLY a JSON object of the form {"caloriesPerHour": number} — the calories burned per hour by an average adult doing the described activity.',
        `Activity: ${title}\nDescription: ${description}`
      );
      if (!result || !inRange(result.caloriesPerHour, 0, 3000)) return null;
      return { caloriesPerHour: result.caloriesPerHour };
    },
    async estimateMealMacrosPerGram(title, description) {
      const result = await chat(
        'You estimate the macronutrient composition of foods. Respond with ONLY a JSON object of the form {"carbs": number, "fat": number, "protein": number} — grams of each macronutrient per 1 gram of the described food, each between 0 and 1.',
        `Food: ${title}\nDescription: ${description}`
      );
      if (!result) return null;
      const { carbs, fat, protein } = result;
      if (!inRange(carbs, 0, 1) || !inRange(fat, 0, 1) || !inRange(protein, 0, 1)) return null;
      return { macrosPerGram: { carbs, fat, protein } };
    },
  };
}
