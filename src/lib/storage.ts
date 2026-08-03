import type { LogisticsInputs } from "../types/logistics";

const STORAGE_KEY = "fluxcore.days.v1";

export type DaysStore = Record<string, LogisticsInputs>;

export function todayISO(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

/** Additionne `delta` jours à une date calendaire "YYYY-MM-DD", sans effet de fuseau horaire. */
export function addDaysISO(dateISO: string, delta: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

export function loadDays(): DaysStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

export function saveDays(store: DaysStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // stockage indisponible (navigation privée, quota...) — on ignore silencieusement
  }
}
