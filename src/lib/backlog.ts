import type { LogisticsDerived, LogisticsInputs } from "../types/logistics";
import { computeLogistics, occupancyStatus } from "./calculations";
import { addDaysISO, type DaysStore } from "./storage";

export interface DayForecast {
  date: string;
  /** La journée a-t-elle une saisie réelle, ou est-elle projetée depuis la dernière saisie connue ? */
  projected: boolean;
  own: LogisticsDerived;
  /** Report reçu de la veille (préparateur-heures non absorbées). */
  backlogIn: number;
  /** Charge propre du jour + report reçu. */
  totalCharge: number;
  /** Taux d'occupation en tenant compte du report. */
  occupancyWithBacklog: number;
  /** Part non absorbée aujourd'hui, reportée au lendemain. */
  backlogOut: number;
  status: LogisticsDerived["status"];
  congested: boolean;
}

/**
 * Calcule la chaîne de report de charge (effet boule de neige) sur `horizonDays`
 * jours à partir de `startDate`. Les jours sans saisie réelle dans `store` sont
 * projetés à partir de la dernière journée saisie (hypothèse : même volume tant
 * que rien n'est renseigné).
 */
export function computeForecastChain(
  store: DaysStore,
  startDate: string,
  horizonDays: number,
): DayForecast[] {
  // 1. Reconstituer le report entrant du jour de départ en remontant la chaîne
  //    contiguë de journées déjà saisies avant startDate.
  const precedingDates: string[] = [];
  let cursor = startDate;
  while (true) {
    const prev = addDaysISO(cursor, -1);
    if (store[prev]) {
      precedingDates.unshift(prev);
      cursor = prev;
    } else break;
  }

  let backlog = 0;
  for (const d of precedingDates) {
    const own = computeLogistics(store[d]);
    const total = own.totalChargeHours + backlog;
    backlog = Math.max(0, total - own.totalCapacityHours);
  }

  // 2. Construire l'horizon demandé, en projetant les jours non saisis à partir
  //    de la dernière saisie réelle rencontrée (celle du jour de départ au minimum).
  const results: DayForecast[] = [];
  let date = startDate;
  let lastKnownInputs: LogisticsInputs | undefined = store[startDate];

  for (let i = 0; i < horizonDays; i++) {
    const real = store[date];
    const inputs = real ?? lastKnownInputs;
    if (!inputs) break;
    if (real) lastKnownInputs = real;

    const own = computeLogistics(inputs);
    const backlogIn = backlog;
    const totalCharge = own.totalChargeHours + backlogIn;
    const backlogOut = Math.max(0, totalCharge - own.totalCapacityHours);
    const occupancyWithBacklog =
      own.totalCapacityHours > 0 ? (totalCharge / own.totalCapacityHours) * 100 : 0;

    results.push({
      date,
      projected: !real,
      own,
      backlogIn,
      totalCharge,
      occupancyWithBacklog,
      backlogOut,
      status: occupancyStatus(occupancyWithBacklog),
      congested: backlogOut > 0,
    });

    backlog = backlogOut;
    date = addDaysISO(date, 1);
  }

  return results;
}
