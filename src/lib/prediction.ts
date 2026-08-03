import type { LogisticsInputs } from "../types/logistics";
import type { DaysStore } from "./storage";

export type PredictionConfidence = "low" | "medium" | "high";

export interface DayPrediction {
  inputs: LogisticsInputs;
  confidence: PredictionConfidence;
  /** Nombre de journées historiques utilisées pour construire la prédiction. */
  sampleSize: number;
}

const MS_PER_DAY = 86_400_000;

function dayIndex(dateISO: string): number {
  return Math.floor(new Date(`${dateISO}T00:00:00Z`).getTime() / MS_PER_DAY);
}

function weekday(dateISO: string): number {
  return new Date(`${dateISO}T00:00:00Z`).getUTCDay();
}

/** Moyenne pondérée (poids w[i], valeurs v[i]). */
function weightedMean(values: number[], weights: number[]): number {
  let sumW = 0;
  let sumWV = 0;
  for (let i = 0; i < values.length; i++) {
    sumW += weights[i];
    sumWV += weights[i] * values[i];
  }
  return sumW > 0 ? sumWV / sumW : 0;
}

/**
 * Régression linéaire pondérée (moindres carrés) v ~ a*x + b, puis extrapolation en `xTarget`.
 * Retourne `null` si la variance de x est nulle (pas assez de points distincts).
 */
function weightedLinearProjection(
  x: number[],
  v: number[],
  w: number[],
  xTarget: number,
): number | null {
  const n = x.length;
  const sumW = w.reduce((a, b) => a + b, 0);
  if (sumW === 0) return null;
  const meanX = weightedMean(x, w);
  const meanV = weightedMean(v, w);

  let sxx = 0;
  let sxv = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    sxx += w[i] * dx * dx;
    sxv += w[i] * dx * (v[i] - meanV);
  }
  if (sxx === 0) return null;

  const slope = sxv / sxx;
  const intercept = meanV - slope * meanX;
  return slope * xTarget + intercept;
}

/**
 * Prédit une métrique numérique pour `targetIndex` à partir d'un historique daté,
 * en combinant :
 *  - une moyenne pondérée par récence (poids exponentiel décroissant),
 *  - une régression linéaire pondérée (tendance de fond),
 *  - un facteur de saisonnalité par jour de semaine (si assez d'historique).
 */
function predictMetric(
  history: { index: number; weekday: number; value: number }[],
  targetIndex: number,
  targetWeekday: number,
): number {
  const n = history.length;
  if (n === 0) return 0;
  if (n === 1) return history[0].value;

  // Poids de récence : demi-vie ~10 jours par rapport au jour cible.
  const halfLifeDays = 10;
  const lambda = Math.log(2) / halfLifeDays;
  const weights = history.map((h) => Math.exp(-lambda * Math.max(0, targetIndex - h.index)));

  const x = history.map((h) => h.index);
  const values = history.map((h) => h.value);

  const recencyAverage = weightedMean(values, weights);
  const trend =
    n >= 3 ? weightedLinearProjection(x, values, weights, targetIndex) : null;

  // Mélange moyenne pondérée / tendance : la tendance ne pèse que si on a un peu
  // d'historique, pour ne pas extrapoler bruyamment sur 2-3 points.
  const trendWeight = trend !== null ? Math.min(0.5, n / 20) : 0;
  const base = trend !== null ? recencyAverage * (1 - trendWeight) + trend * trendWeight : recencyAverage;

  // Saisonnalité jour de semaine : ratio (moyenne du même jour de semaine) / (moyenne globale),
  // appliquée seulement si on a au moins 2 échantillons pour ce jour de semaine et 3 jours distincts couverts.
  const sameWeekday = history.filter((h) => h.weekday === targetWeekday);
  const distinctWeekdays = new Set(history.map((h) => h.weekday)).size;
  let seasonalFactor = 1;
  if (sameWeekday.length >= 2 && distinctWeekdays >= 3) {
    const overallMean = values.reduce((a, b) => a + b, 0) / n;
    const sameWeekdayMean =
      sameWeekday.reduce((a, h) => a + h.value, 0) / sameWeekday.length;
    if (overallMean > 0) {
      // Facteur amorti pour rester robuste avec peu d'échantillons.
      const raw = sameWeekdayMean / overallMean;
      seasonalFactor = 1 + (raw - 1) * Math.min(1, sameWeekday.length / 4);
    }
  }

  return Math.max(0, base * seasonalFactor);
}

function confidenceFor(sampleSize: number): PredictionConfidence {
  if (sampleSize >= 7) return "high";
  if (sampleSize >= 3) return "medium";
  return "low";
}

/** Construit l'historique {index, weekday, value} d'une métrique numérique à partir des saisies réelles. */
function metricHistory(
  entries: [string, LogisticsInputs][],
  pick: (inputs: LogisticsInputs) => number,
): { index: number; weekday: number; value: number }[] {
  return entries.map(([date, inputs]) => ({
    index: dayIndex(date),
    weekday: weekday(date),
    value: pick(inputs),
  }));
}

/**
 * Construit une prédiction pour `targetDate` à partir de l'historique réel (`store`)
 * strictement antérieur à cette date. Les volumes (palettes, colis) et les effectifs
 * picking (par équipe) sont estimés par l'algorithme récence + tendance + saisonnalité ;
 * les paramètres plus "de réglage machine" (cadences, efficacité, arrêt silo, fenêtre
 * silo) reprennent la dernière saisie connue, qui reflète mieux une décision
 * opérationnelle qu'une variable à extrapoler.
 */
export function predictDay(store: DaysStore, targetDate: string): DayPrediction | null {
  const entries = Object.entries(store)
    .filter(([date]) => date < targetDate)
    .sort(([a], [b]) => a.localeCompare(b));

  if (entries.length === 0) return null;

  const targetIndex = dayIndex(targetDate);
  const targetWeekday = weekday(targetDate);
  const predict = (history: { index: number; weekday: number; value: number }[]) =>
    predictMetric(history, targetIndex, targetWeekday);

  const siloPalettes = Math.round(
    predict(metricHistory(entries, (i) => i.siloPalettes)),
  );
  const pickingColis = Math.round(
    predict(metricHistory(entries, (i) => i.pickingColis)),
  );

  const lastKnown = entries[entries.length - 1][1];

  // Effectifs picking (par équipe) : mêmes aléas qu'un volume — on prédit chaque
  // équipe séparément à partir de son propre historique de headcount.
  const teams = lastKnown.teams.map((team) => {
    const headcountHistory = entries
      .map(([date, inputs]) => {
        const match = inputs.teams.find((t) => t.id === team.id);
        return match ? { index: dayIndex(date), weekday: weekday(date), value: match.headcount } : null;
      })
      .filter((h): h is { index: number; weekday: number; value: number } => h !== null);

    const headcount = Math.max(0, Math.round(predict(headcountHistory)));
    return { ...team, headcount };
  });

  return {
    inputs: {
      ...lastKnown,
      siloPalettes,
      pickingColis,
      teams,
    },
    confidence: confidenceFor(entries.length),
    sampleSize: entries.length,
  };
}
