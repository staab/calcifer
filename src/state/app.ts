import { writable, type Writable } from 'svelte/store';
import type { MealSlot } from '$src/domain/types';
import { todayKey } from '$lib/date';

export type View = 'dashboard' | 'add-activity' | 'add-meal' | 'stats' | 'settings';

export const view: Writable<View> = writable('dashboard');
export const selectedDate: Writable<string> = writable(todayKey());
export const addMealSlot: Writable<MealSlot> = writable('breakfast');
