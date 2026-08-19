import { writable } from 'svelte/store';
import { persisted } from './persist';
import { createStorage } from '$src/adapters/storage';
import { DEFAULT_SETTINGS } from '$src/domain/constants';
import type { Settings } from '$src/domain/types';

export const settings = persisted<Settings>(createStorage(), 'calcifer.settings', DEFAULT_SETTINGS);

export interface LlmConfig {
  openrouterApiKey: string;
}

export const llmConfig = persisted<LlmConfig>(createStorage(), 'calcifer.llm', {
  openrouterApiKey: '',
});

// dismissed per session only, so the prompt reappears on the next launch
export const bannerDismissed = writable(false);
