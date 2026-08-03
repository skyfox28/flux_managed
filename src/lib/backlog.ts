import { computeLogistics, occupancyStatus } from "./calculations";
import { addDaysISO, type DaysStore } from "./storage";
import type { LogisticsInputs } from "../types/logistics";

export interface DayForecast {
  date: string;
  own: ReturnType<typeof computeLogistics>;

  /** Report humain (préparateur-heures) reçu de la veille. */
  backlogIn: number;
  /** Charge humaine totale du jour (silo absorbé + picking + report humain reçu). */
  totalCharge: number;
  /** Taux d'occupation humaine en tenant compte du report. */
  occupancyWithBacklog: number;
  /** Part de charge humaine non absorbée aujourd'hui, reportée au lendemain. */
  backlogOut: number;
  status: ReturnType<typeof occupancyStatus>;
  congested: boolean;

  /** Report silo (heures de fonctionnement en attente) reçu de la veille. */
  siloBacklogIn: number;
  /** Part du besoin silo (propre + report) réellement absorbée aujourd'hui, dans la fenêtre. */
  siloChargeToday: number;
  /** Part du besoin silo qui dépasse encore la fenêtre du jour, reportée au lendemain. */
  siloBacklogOut: number;
  siloCongested: boolean;
}

interface DayStep {
  own: ReturnType<typeof computeLogistics>;
  siloChargeToday: number;
  siloBacklogOut: number;
  totalChargeToday: number;
  humanBacklogOut: number;
  occupancyWithBacklog: number;
}

/**
 * Applique un jour de charge à deux files de report indépendantes :
 *  - le silo, contraint par sa propre fenêtre de fonctionnement quotidienne
 *    (`inputs.siloWindowHours` — 2×7h36 par défaut, mais réglable) ;
 *  - l'équipe humaine, contrainte par les préparateur-heures disponibles.
 * Le silo absorbe d'abord son report + son propre besoin dans sa fenêtre ; ce qui est
 * réellement sorti aujourd'hui mobilise ensuite un préparateur-équivalent, comme le
 * picking, pour former la charge humaine du jour.
 */
function applyDay(
  inputs: LogisticsInputs,
  humanBacklogIn: number,
  siloBacklogIn: number,
): DayStep {
  const own = computeLogistics(inputs);

  const siloNeedTotal = own.siloTimeHours + siloBacklogIn;
  const siloWindowHours = Math.max(0, inputs.siloWindowHours);
  const siloChargeToday = Math.min(siloNeedTotal, siloWindowHours);
  const siloBacklogOut = Math.max(0, siloNeedTotal - siloWindowHours);

  const totalChargeToday = siloChargeToday + own.pickingChargeHours + humanBacklogIn;
  const humanBacklogOut = Math.max(0, totalChargeToday - own.totalCapacityHours);
  const occupancyWithBacklog =
    own.totalCapacityHours > 0 ? (totalChargeToday / own.totalCapacityHours) * 100 : 0;

  return { own, siloChargeToday, siloBacklogOut, totalChargeToday, humanBacklogOut, occupancyWithBacklog };
}

/**
 * Calcule la chaîne de report de charge (effet boule de neige) sur `horizonDays`
 * jours à partir de `startDate`, avec deux files indépendantes (silo / humain).
 * Ne calcule et n'affiche que les jours réellement saisis, chaînés consécutivement
 * depuis `startDate` — dès qu'un jour n'a pas de saisie, la chaîne s'arrête (aucune
 * donnée n'est inventée pour les jours suivants).
 */
export function computeForecastChain(
  store: DaysStore,
  startDate: string,
  horizonDays: number,
): DayForecast[] {
  // 1. Reconstituer les deux reports entrants du jour de départ en remontant la
  //    chaîne contiguë de journées déjà saisies avant startDate.
  const precedingDates: string[] = [];
  let cursor = startDate;
  while (true) {
    const prev = addDaysISO(cursor, -1);
    if (store[prev]) {
      precedingDates.unshift(prev);
      cursor = prev;
    } else break;
  }

  let humanBacklog = 0;
  let siloBacklog = 0;
  for (const d of precedingDates) {
    const step = applyDay(store[d], humanBacklog, siloBacklog);
    humanBacklog = step.humanBacklogOut;
    siloBacklog = step.siloBacklogOut;
  }

  // 2. Avancer jour par jour sur l'horizon demandé.
  const results: DayForecast[] = [];
  let date = startDate;

  for (let i = 0; i < horizonDays; i++) {
    const inputs = store[date];
    if (!inputs) break; // jour non saisi -> on arrête, rien n'est inventé

    const step = applyDay(inputs, humanBacklog, siloBacklog);

    results.push({
      date,
      own: step.own,
      backlogIn: humanBacklog,
      totalCharge: step.totalChargeToday,
      occupancyWithBacklog: step.occupancyWithBacklog,
      backlogOut: step.humanBacklogOut,
      status: occupancyStatus(step.occupancyWithBacklog),
      congested: step.humanBacklogOut > 0,
      siloBacklogIn: siloBacklog,
      siloChargeToday: step.siloChargeToday,
      siloBacklogOut: step.siloBacklogOut,
      siloCongested: step.siloBacklogOut > 0,
    });

    humanBacklog = step.humanBacklogOut;
    siloBacklog = step.siloBacklogOut;
    date = addDaysISO(date, 1);
  }

  return results;
}
