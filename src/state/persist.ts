import { writable, type Writable } from 'svelte/store';
import type { StorageAdapter } from '$src/adapters/storage';

export type Persisted<T> = Writable<T> & { ready: Promise<void> };

export function persisted<T>(storage: StorageAdapter, key: string, initial: T): Persisted<T> {
  const store = writable<T>(initial);
  let loaded = false;

  const ready = storage.get(key).then((raw) => {
    if (raw !== null) {
      try {
        store.set({ ...initial, ...JSON.parse(raw) });
      } catch {
        // corrupt value: keep initial
      }
    }
    loaded = true;
  });

  store.subscribe((value) => {
    if (loaded) void storage.set(key, JSON.stringify(value));
  });

  return { ...store, ready };
}
