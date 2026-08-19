import { Capacitor, CapacitorHttp } from '@capacitor/core';
import type { Macros } from '$src/domain/types';

// in the browser, go through the vite proxy to sidestep CORS
const ENDPOINT = Capacitor.isNativePlatform()
  ? 'https://api.search.brave.com/res/v1/chat/completions'
  : '/brave-api/res/v1/chat/completions';
const TIMEOUT_MS = 10000;

export interface ActivityEstimate {
  caloriesPerHour: number;
}

export interface MealEstimate {
  macrosPer100g: Macros;
  servingGrams: number;
}

export interface LlmAdapter {
  estimateActivityCaloriesPerHour(title: string, description: string): Promise<ActivityEstimate | null>;
  estimateMealMacros(title: string, description: string): Promise<MealEstimate | null>;
  estimateActivityMinutes(title: string, description: string, estimate: string): Promise<number | null>;
  estimateMealGrams(title: string, description: string, estimate: string): Promise<number | null>;
}

// Brave may embed <citation>/<usage> tags in the answer text around the JSON
function extractJson(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/<(citation|usage)>.*?<\/\1>/gs, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

// Brave's chat completions endpoint accepts exactly one message, so
// instructions and input are combined into a single user message
async function chat(apiKey: string, instructions: string, input: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await CapacitorHttp.post({
      url: ENDPOINT,
      headers: { 'Content-Type': 'application/json', 'x-subscription-token': apiKey },
      connectTimeout: TIMEOUT_MS,
      readTimeout: TIMEOUT_MS,
      data: {
        model: 'brave',
        stream: false,
        messages: [{ role: 'user', content: `${instructions}\n\n${input}` }],
      },
    });
    if (res.status < 200 || res.status >= 300) return null;
    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === 'string' ? extractJson(content) : null;
  } catch {
    return null;
  }
}

const inRange = (n: unknown, min: number, max: number): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;

export function createLlm(apiKey: string): LlmAdapter {
  return {
    async estimateActivityCaloriesPerHour(title, description) {
      if (apiKey === '') return null;
      const result = await chat(
        apiKey,
        'You estimate calories burned by physical activities. Respond with ONLY a JSON object of the form {"caloriesPerHour": number} — the calories burned per hour by an average adult doing the described activity. No prose, no citations.',
        `Activity: ${title}\nDescription: ${description}`
      );
      if (!result || !inRange(result.caloriesPerHour, 0, 3000)) return null;
      return { caloriesPerHour: result.caloriesPerHour };
    },
    async estimateMealMacros(title, description) {
      if (apiKey === '') return null;
      const result = await chat(
        apiKey,
        'You estimate the nutritional content of foods. Respond with ONLY a JSON object of the form {"servingGrams": number, "carbs": number, "fat": number, "protein": number}. servingGrams is the total weight in grams of the described portion; if no portion size is described, use a typical single serving. carbs, fat, and protein are the grams of each macronutrient contained in the full servingGrams of that portion. No prose, no citations.',
        `Food: ${title}\nDescription: ${description}`
      );
      if (!result) return null;
      const { servingGrams, carbs, fat, protein } = result;
      if (!inRange(servingGrams, 1, 5000)) return null;
      if (!inRange(carbs, 0, 5000) || !inRange(fat, 0, 5000) || !inRange(protein, 0, 5000)) return null;
      // macros are constituents of the portion, so their total can't exceed its weight
      if (carbs + fat + protein > servingGrams) return null;
      const per100 = (n: number) => Math.round((n * 100 * 10) / servingGrams) / 10;
      return {
        macrosPer100g: { carbs: per100(carbs), fat: per100(fat), protein: per100(protein) },
        servingGrams: Math.round(servingGrams),
      };
    },
    async estimateActivityMinutes(title, description, estimate) {
      if (apiKey === '') return null;
      const result = await chat(
        apiKey,
        'You convert informal descriptions of how long an activity was performed into a duration. Respond with ONLY a JSON object of the form {"minutes": number} — the total minutes. No prose, no citations.',
        `Activity: ${title}\nDescription: ${description}\nDuration described as: ${estimate}`
      );
      if (!result || !inRange(result.minutes, 0, 1440)) return null;
      return result.minutes;
    },
    async estimateMealGrams(title, description, estimate) {
      if (apiKey === '') return null;
      const result = await chat(
        apiKey,
        'You convert informal portion descriptions into a weight. Respond with ONLY a JSON object of the form {"grams": number} — the total grams of the described food that was eaten. No prose, no citations.',
        `Food: ${title}\nDescription: ${description}\nPortion described as: ${estimate}`
      );
      if (!result || !inRange(result.grams, 0, 5000)) return null;
      return result.grams;
    },
  };
}
