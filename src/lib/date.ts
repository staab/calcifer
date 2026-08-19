export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, days: number): string {
  const d = parseKey(key);
  d.setDate(d.getDate() + days);
  return dateKey(d);
}

export function lastNDays(n: number, endKey: string): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) keys.push(addDays(endKey, -i));
  return keys;
}

export function shortLabel(key: string): string {
  const d = parseKey(key);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
