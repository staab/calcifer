import { writable, type Writable } from 'svelte/store';
import type { StorageAdapter } from '$src/adapters/storage';

export type Persisted<T> = Writable<T> & { ready: Promise<void> };

export type Migration = (data: unknown) => unknown;

export interface PersistOptions {
  version?: number;
  /** migrations[n] upgrades data from version n to n + 1 */
  migrations?: Record<number, Migration>;
}

interface Envelope {
  __v: number;
  data: unknown;
}

function isEnvelope(value: unknown): value is Envelope {
  return typeof value === 'object' && value !== null && '__v' in value && 'data' in value;
}

function merge<T>(initial: T, data: unknown): T {
  if (Array.isArray(initial)) return (Array.isArray(data) ? data : initial) as T;
  if (typeof initial === 'object' && initial !== null && typeof data === 'object' && data !== null) {
    return { ...initial, ...data };
  }
  return (data ?? initial) as T;
}

export function persisted<T>(
  storage: StorageAdapter,
  key: string,
  initial: T,
  { version = 1, migrations = {} }: PersistOptions = {}
): Persisted<T> {
  const store = writable<T>(initial);
  let loaded = false;

  const ready = storage.get(key).then((raw) => {
    if (raw !== null) {
      try {
        const parsed: unknown = JSON.parse(raw);
        // unwrapped values predate versioning and are treated as version 1
        let v = isEnvelope(parsed) ? parsed.__v : 1;
        let data = isEnvelope(parsed) ? parsed.data : parsed;
        while (v < version) {
          const migrate = migrations[v];
          if (!migrate) throw new Error(`missing migration from v${v} for ${key}`);
          data = migrate(data);
          v++;
        }
        store.set(merge(initial, data));
      } catch {
        // corrupt value: keep initial
      }
    }
    loaded = true;
  });

  store.subscribe((value) => {
    if (loaded) void storage.set(key, JSON.stringify({ __v: version, data: value }));
  });

  return { ...store, ready };
}
