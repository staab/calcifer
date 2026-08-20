import { derived, get, writable, type Readable, type Writable } from 'svelte/store';
import { Capacitor } from '@capacitor/core';
import type { MealSlot } from '$src/domain/types';
import { todayKey } from '$lib/date';

export type View = 'dashboard' | 'add-activity' | 'add-meal' | 'stats' | 'settings';

const isNative = Capacitor.isNativePlatform();

const stack = writable<View[]>(['dashboard']);

/** The current view — the top of the navigation stack. */
export const view: Readable<View> = derived(stack, ($stack) => $stack[$stack.length - 1]);

function pushHistory(s: View[]) {
  if (isNative) return;
  history.pushState({ stack: s }, '');
}

function replaceHistory(s: View[]) {
  if (isNative) return;
  history.replaceState({ stack: s }, '');
}

/** Push a view onto the stack (e.g. opening an add screen). */
export function navigate(v: View) {
  const next = [...get(stack), v];
  pushHistory(next);
  stack.set(next);
}

/** Switch to a top-level tab, resetting the stack. */
export function goToTab(v: View) {
  stack.set([v]);
  pushHistory([v]);
}

/** Pop the stack. Returns false when already at the root. */
export function back(): boolean {
  if (isNative) {
    let popped = false;
    stack.update((s) => {
      if (s.length > 1) {
        popped = true;
        return s.slice(0, -1);
      }
      return s;
    });
    return popped;
  }
  // On web, delegate to browser history so the back button stays in sync.
  if (history.state?.stack?.length > 1) {
    history.back();
    return true;
  }
  return false;
}

// On web, the browser back/forward buttons drive the stack via popstate.
if (!isNative && typeof window !== 'undefined') {
  window.addEventListener('popstate', (e) => {
    const s = e.state?.stack;
    if (Array.isArray(s) && s.length > 0) {
      stack.set(s);
    } else {
      stack.update((cur) => (cur.length > 1 ? cur.slice(0, -1) : cur));
    }
  });
  // Establish the home tab as a history entry so the back button can return to
  // it after switching tabs.
  replaceHistory(['dashboard']);
}

export const selectedDate: Writable<string> = writable(todayKey());
export const addMealSlot: Writable<MealSlot> = writable('breakfast');
