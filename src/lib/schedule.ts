import type { LogisticsDerived } from "../types/logistics";
import { timeToHours } from "./calculations";

/** Passé cette heure, les chargements/expéditions sont rares — finir après doit alerter. */
export const LATE_SHIPPING_HOUR = 17;

export interface FinishEstimate {
  /** Heure de fin estimée dans la journée (ex: "17h42"), ou null si le travail déborde. */
  finishLabel: string | null;
  /** Heure de fin en décimal (ex: 17.7), pour comparaison — null si le travail déborde. */
  finishHour: number | null;
  /** Le travail déborde-t-il sur le jour suivant, faute de capacité aujourd'hui ? */
  overflows: boolean;
  /** Combien d'heures de travail dépassent la fin de journée opérationnelle (0 si tout rentre). */
  overflowHours: number;
  /** Fin de journée opérationnelle (dernière équipe qui plie), pour référence. */
  dayEndLabel: string;
  /** Termine dans la journée mais après l'heure limite de chargement (`LATE_SHIPPING_HOUR`). */
  isLate: boolean;
}

function hoursToClockLabel(hours: number): string {
  const wrapped = ((hours % 24) + 24) % 24;
  const h = Math.floor(wrapped);
  const m = Math.round((wrapped - h) * 60);
  if (m === 60) return `${String((h + 1) % 24).padStart(2, "0")}h00`;
  return `${String(h).padStart(2, "0")}h${String(m).padStart(2, "0")}`;
}

function result(
  finishHour: number | null,
  overflows: boolean,
  overflowHours: number,
  dayEndLabel: string,
): FinishEstimate {
  return {
    finishLabel: finishHour === null ? null : hoursToClockLabel(finishHour),
    finishHour,
    overflows,
    overflowHours,
    dayEndLabel,
    isLate: !overflows && finishHour !== null && finishHour > LATE_SHIPPING_HOUR,
  };
}

/**
 * Détermine l'heure à laquelle tout le travail du jour (silo + picking, éventuellement
 * augmenté d'un report reçu) serait terminé, en tenant compte des horaires réels de
 * chaque équipe (chevauchements inclus, pauses déjà déduites dans `team.durationHours`).
 * Si la capacité cumulée du jour ne suffit jamais, le travail déborde sur le lendemain :
 * `overflows` passe à true et `overflowHours` indique de combien. Une fin après
 * `LATE_SHIPPING_HOUR` (17h) est aussi signalée via `isLate`, même sans débordement —
 * les chargements sont rares passé cette heure.
 */
export function computeFinishEstimate(
  derived: LogisticsDerived,
  totalChargeHours: number = derived.totalChargeHours,
): FinishEstimate {
  const segments = derived.teams
    .filter((t) => t.headcount > 0 && t.grossDurationHours > 0)
    .map((t) => {
      const start = timeToHours(t.start);
      const rawEnd = timeToHours(t.end);
      const end = rawEnd > start ? rawEnd : rawEnd + 24;
      const breakFactor = t.grossDurationHours > 0 ? t.durationHours / t.grossDurationHours : 0;
      return { start, end, rate: t.headcount * breakFactor };
    })
    .sort((a, b) => a.start - b.start);

  const dayEnd = segments.length > 0 ? Math.max(...segments.map((s) => s.end)) : 20;
  const dayEndLabel = hoursToClockLabel(dayEnd);

  if (totalChargeHours <= 0) {
    return result(segments[0]?.start ?? 5, false, 0, dayEndLabel);
  }
  if (segments.length === 0) {
    return result(null, true, totalChargeHours, dayEndLabel);
  }

  const events = Array.from(new Set(segments.flatMap((s) => [s.start, s.end]))).sort(
    (a, b) => a - b,
  );

  let remaining = totalChargeHours;

  for (let i = 0; i < events.length - 1; i++) {
    const t0 = events[i];
    const t1 = events[i + 1];
    const rate = segments
      .filter((s) => s.start <= t0 && s.end >= t1)
      .reduce((sum, s) => sum + s.rate, 0);
    const capacityInInterval = rate * (t1 - t0);

    if (capacityInInterval >= remaining) {
      const finishAt = rate > 0 ? t0 + remaining / rate : t0;
      return result(finishAt, false, 0, dayEndLabel);
    }
    remaining -= capacityInInterval;
  }

  return result(null, true, remaining, dayEndLabel);
}
