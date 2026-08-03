import { computeLogistics } from "./calculations";
import { buildDayTimeline } from "./timeline";
import type { DaysStore } from "./storage";

export interface HourRisk {
  hour: number;
  label: string;
  avgOccupancy: number;
  maxOccupancy: number;
  /** Nombre de journées saisies où cette heure est en surcharge (occupation ≥ 100%). */
  daysCongested: number;
}

export interface CongestionHoursResult {
  hours: HourRisk[];
  sampleSize: number;
  /** Heures dont l'occupation moyenne dépasse 100%, triées par sévérité décroissante. */
  worstHours: HourRisk[];
}

/**
 * Identifie, heure par heure, la fréquence et l'intensité de la congestion à partir
 * de toutes les journées réellement saisies (`store`). Le résultat s'affine
 * automatiquement au fur et à mesure que de nouvelles journées sont saisies : avec
 * une seule journée, il reflète simplement son propre profil horaire ; avec
 * plusieurs, il moyenne/maximise sur l'historique disponible.
 */
export function computeHourlyCongestion(store: DaysStore): CongestionHoursResult {
  const entries = Object.values(store);
  const sampleSize = entries.length;

  const buckets = new Map<number, { label: string; sum: number; max: number; over: number }>();

  for (const inputs of entries) {
    const derived = computeLogistics(inputs);
    const timeline = buildDayTimeline(derived);
    for (const point of timeline) {
      const bucket = buckets.get(point.hour) ?? { label: point.label, sum: 0, max: 0, over: 0 };
      bucket.sum += point.occupancy;
      bucket.max = Math.max(bucket.max, point.occupancy);
      if (point.occupancy >= 100) bucket.over += 1;
      buckets.set(point.hour, bucket);
    }
  }

  const hours: HourRisk[] = Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([hour, b]) => ({
      hour,
      label: b.label,
      avgOccupancy: sampleSize > 0 ? b.sum / sampleSize : 0,
      maxOccupancy: b.max,
      daysCongested: b.over,
    }));

  const worstHours = hours
    .filter((h) => h.avgOccupancy >= 100)
    .sort((a, b) => b.avgOccupancy - a.avgOccupancy);

  return { hours, sampleSize, worstHours };
}
