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

/** Complète les champs ajoutés après coup, pour une saisie déjà stockée localement. */
function normalizeInputs(inputs: Partial<LogisticsInputs>): LogisticsInputs {
  return {
    siloPalettes: inputs.siloPalettes ?? 0,
    siloCadence: inputs.siloCadence ?? 18,
    siloEfficiencyPct: inputs.siloEfficiencyPct ?? 100,
    siloDowntimeHours: inputs.siloDowntimeHours ?? 0,
    pickingColis: inputs.pickingColis ?? 0,
    pickingCadence: inputs.pickingCadence ?? 400,
    pickingEfficiencyPct: inputs.pickingEfficiencyPct ?? 100,
    teams: inputs.teams ?? [],
  };
}

export function loadDays(): DaysStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || !parsed) return {};
    const normalized: DaysStore = {};
    for (const [date, inputs] of Object.entries(parsed as DaysStore)) {
      normalized[date] = normalizeInputs(inputs);
    }
    return normalized;
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
