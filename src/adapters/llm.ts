import { Capacitor, CapacitorHttp } from '@capacitor/core';
import type { Macros } from '$src/domain/types';

// OpenRouter accepts browser (CORS) calls, so no dev proxy is needed
const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-3.7-flash';
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

// response_format requests strict JSON, but tolerate fences/prose just in case
function extractJson(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/```(?:json)?/g, '');
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

// every estimation returns a flat object of numbers, one field per answer
function schema(fields: string[]): unknown {
  return {
    type: 'object',
    properties: Object.fromEntries(fields.map((f) => [f, { type: 'number', description: f }])),
    required: fields,
    additionalProperties: false,
  };
}

async function chat(
  apiKey: string,
  system: string,
  input: string,
  fields: string[]
): Promise<Record<string, unknown> | null> {
  try {
    const res = await CapacitorHttp.post({
      url: ENDPOINT,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      connectTimeout: TIMEOUT_MS,
      readTimeout: TIMEOUT_MS,
      data: {
        model: MODEL,
        stream: false,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: input },
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'estimate', strict: true, schema: schema(fields) } },
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
        'You estimate calories burned per hour by an average adult doing a described physical activity.',
        `Activity: ${title}\nDescription: ${description}`,
        ['caloriesPerHour']
      );
      if (!result || !inRange(result.caloriesPerHour, 0, 3000)) return null;
      return { caloriesPerHour: result.caloriesPerHour };
    },
    async estimateMealMacros(title, description) {
      if (apiKey === '') return null;
      const result = await chat(
        apiKey,
        'You estimate the nutritional content of foods. servingGrams is the total weight in grams of the described portion; if no portion size is specified, default it to 100 grams. carbs, fat, and protein are the grams of each macronutrient contained in the full portion.',
        `Food: ${title}\nDescription: ${description}`,
        ['servingGrams', 'carbs', 'fat', 'protein']
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
        'You convert an informal description of how long an activity was performed into the total minutes.',
        `Activity: ${title}\nDescription: ${description}\nDuration described as: ${estimate}`,
        ['minutes']
      );
      if (!result || !inRange(result.minutes, 0, 1440)) return null;
      return result.minutes;
    },
    async estimateMealGrams(title, description, estimate) {
      if (apiKey === '') return null;
      const result = await chat(
        apiKey,
        'You convert an informal portion of a described food into the total grams eaten.',
        `Food: ${title}\nDescription: ${description}\nPortion described as: ${estimate}`,
        ['grams']
      );
      if (!result || !inRange(result.grams, 0, 5000)) return null;
      return result.grams;
    },
  };
}
