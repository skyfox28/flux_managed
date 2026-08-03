import { computeLogistics, occupancyStatus } from "./calculations";
import { addDaysISO, type DaysStore } from "./storage";

export interface DayForecast {
  date: string;
  own: ReturnType<typeof computeLogistics>;
  /** Report reçu de la veille (préparateur-heures non absorbées). */
  backlogIn: number;
  /** Charge propre du jour + report reçu. */
  totalCharge: number;
  /** Taux d'occupation en tenant compte du report. */
  occupancyWithBacklog: number;
  /** Part non absorbée aujourd'hui, reportée au lendemain. */
  backlogOut: number;
  status: ReturnType<typeof occupancyStatus>;
  congested: boolean;
}

export interface PendingDay {
  date: string;
  /** Report qui attendra ce jour dès qu'il sera saisi (uniquement pour le tout
   *  premier jour non saisi, immédiatement après la chaîne connue). */
  backlogIn: number | null;
}

export interface ForecastResult {
  /** Jours réellement saisis, chaînés consécutivement depuis `startDate`. */
  days: DayForecast[];
  /** Jours suivants non saisis dans l'horizon demandé — aucune donnée inventée. */
  pending: PendingDay[];
}

/**
 * Calcule la chaîne de report de charge (effet boule de neige) sur `horizonDays`
 * jours à partir de `startDate`. Seuls les jours réellement saisis dans `store`
 * sont calculés ; dès qu'un jour n'a pas de saisie, la chaîne s'arrête (aucune
 * donnée n'est inventée pour les jours suivants).
 */
export function computeForecastChain(
  store: DaysStore,
  startDate: string,
  horizonDays: number,
): ForecastResult {
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

  // 2. Avancer jour par jour sur l'horizon demandé, en s'arrêtant de calculer
  //    dès qu'un jour n'a pas de saisie réelle.
  const days: DayForecast[] = [];
  const pending: PendingDay[] = [];
  let date = startDate;
  let chainBroken = false;

  for (let i = 0; i < horizonDays; i++) {
    const real = store[date];

    if (!real || chainBroken) {
      pending.push({ date, backlogIn: chainBroken ? null : backlog });
      chainBroken = true;
      date = addDaysISO(date, 1);
      continue;
    }

    const own = computeLogistics(real);
    const backlogIn = backlog;
    const totalCharge = own.totalChargeHours + backlogIn;
    const backlogOut = Math.max(0, totalCharge - own.totalCapacityHours);
    const occupancyWithBacklog =
      own.totalCapacityHours > 0 ? (totalCharge / own.totalCapacityHours) * 100 : 0;

    days.push({
      date,
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

  return { days, pending };
}
