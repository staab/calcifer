import type { Macros } from '$src/domain/types';

export function formatMacrosCompact(m: Macros): string {
  return `${Math.round(m.carbs)}c ${Math.round(m.fat)}f ${Math.round(m.protein)}p`;
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}
