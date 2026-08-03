import type { LogisticsDerived, LogisticsInputs } from "../types/logistics";
import { BREAK_HOURS_PER_SHIFT } from "./calculations";
import { formatHoursMinutes, formatInt } from "./format";

export interface Recommendation {
  id: string;
  text: string;
}

const STANDARD_SHIFT_HOURS = 7.6; // 7h36, net d'un poste type
const NET_SHIFT_HOURS = STANDARD_SHIFT_HOURS - BREAK_HOURS_PER_SHIFT;

/**
 * Propose des leviers concrets pour absorber la charge du jour, quand le silo
 * dépasse sa fenêtre de fonctionnement et/ou que l'équipe humaine est en
 * déficit : ajouter une équipe silo (samedi, 3×8...), ajouter des
 * préparateurs, ou réduire le volume du jour pour rester dans la capacité
 * actuelle.
 */
export function computeRecommendations(
  inputs: LogisticsInputs,
  derived: LogisticsDerived,
): Recommendation[] {
  const recs: Recommendation[] = [];

  if (derived.siloOverflowHours > 0.01) {
    const extraShifts = Math.ceil(derived.siloOverflowHours / NET_SHIFT_HOURS);
    recs.push({
      id: "silo-shift",
      text: `Silo : ajouter ${extraShifts} équipe${extraShifts > 1 ? "s" : ""} de 7h36 (ex. samedi, ou passer en 3×8) pour absorber les ${formatHoursMinutes(derived.siloOverflowHours)} hors fenêtre.`,
    });

    const paletteReduction = Math.ceil(derived.siloOverflowHours * derived.siloEffectiveCadence);
    if (paletteReduction > 0) {
      recs.push({
        id: "silo-volume",
        text: `Ou réduire le volume du jour de ~${formatInt(paletteReduction)} palettes pour rentrer dans la fenêtre actuelle (${formatHoursMinutes(inputs.siloWindowHours)}).`,
      });
    }
  }

  if (derived.overloadHours > 0.01) {
    const activeTeams = derived.teams.filter((t) => t.durationHours > 0);
    const avgDuration =
      activeTeams.length > 0
        ? activeTeams.reduce((s, t) => s + t.durationHours, 0) / activeTeams.length
        : NET_SHIFT_HOURS;
    const extraPreparateurs = Math.ceil(derived.overloadHours / Math.max(1, avgDuration));
    recs.push({
      id: "human-headcount",
      text: `Équipe : ajouter ~${extraPreparateurs} préparateur${extraPreparateurs > 1 ? "s" : ""} sur la journée pour combler le déficit de ${formatHoursMinutes(derived.overloadHours)}.`,
    });

    const colisReduction = Math.ceil(derived.overloadHours * derived.pickingEffectiveCadence);
    if (colisReduction > 0) {
      recs.push({
        id: "human-volume",
        text: `Ou réduire le volume picking de ~${formatInt(colisReduction)} colis pour rester dans la capacité actuelle.`,
      });
    }
  }

  return recs;
}
