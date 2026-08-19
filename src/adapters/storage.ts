import { Preferences } from '@capacitor/preferences';

export interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

export function createStorage(): StorageAdapter {
  return {
    async get(key) {
      try {
        const { value } = await Preferences.get({ key });
        return value;
      } catch {
        return window.localStorage.getItem(key);
      }
    },
    async set(key, value) {
      try {
        await Preferences.set({ key, value });
      } catch {
        window.localStorage.setItem(key, value);
      }
    },
  };
}
