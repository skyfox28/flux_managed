import type {
  LogisticsDerived,
  LogisticsInputs,
  OccupancyStatus,
  TeamDerived,
} from "../types/logistics";

/** Convertit "HH:MM" en nombre d'heures depuis minuit (décimal). */
export function timeToHours(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h + m / 60;
}

/** Durée d'une équipe en heures, en tenant compte d'un éventuel passage minuit. */
export function teamDurationHours(start: string, end: string): number {
  const s = timeToHours(start);
  const e = timeToHours(end);
  const diff = e - s;
  return diff >= 0 ? diff : diff + 24;
}

/** Pauses réglementaires par poste : une pause de 10 min + une pause de 20 min. */
export const BREAK_MINUTES_PER_SHIFT = 10 + 20;
export const BREAK_HOURS_PER_SHIFT = BREAK_MINUTES_PER_SHIFT / 60;

/** Heure de début conventionnelle de la journée logistique (silo + équipes). */
export const DAY_WINDOW_START = 5;

export const OCCUPANCY_THRESHOLDS = {
  warning: 80,
  critical: 100,
};

export function occupancyStatus(rate: number): OccupancyStatus {
  if (rate >= OCCUPANCY_THRESHOLDS.critical) return "critical";
  if (rate >= OCCUPANCY_THRESHOLDS.warning) return "warning";
  return "ok";
}

function safeDiv(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= 0) return 0;
  return a / b;
}

/**
 * @param asOfHour Si renseigné (heure décimale, ex. 14.5 = 14h30), ne compte que la
 *   capacité et la fenêtre silo *restantes* à partir de cette heure — utilisé quand on
 *   saisit les données de la journée en cours d'après-midi : les heures déjà passées ne
 *   sont plus disponibles, et le surplus se reporte sur le lendemain (cf. lib/backlog.ts).
 *   Laisser à `null` pour un calcul plein jour (jours passés, futurs, ou planification).
 */
export function computeLogistics(
  inputs: LogisticsInputs,
  asOfHour: number | null = null,
): LogisticsDerived {
  const teams: TeamDerived[] = inputs.teams.map((team) => {
    const grossDurationHours = teamDurationHours(team.start, team.end);
    const breakAdjustedDurationHours = Math.max(0, grossDurationHours - BREAK_HOURS_PER_SHIFT);

    let durationHours = breakAdjustedDurationHours;
    if (asOfHour !== null) {
      const start = timeToHours(team.start);
      const rawEnd = timeToHours(team.end);
      const end = rawEnd > start ? rawEnd : rawEnd + 24;
      const remainingGross = Math.max(0, end - Math.max(start, asOfHour));
      const ratio = grossDurationHours > 0 ? remainingGross / grossDurationHours : 0;
      durationHours = breakAdjustedDurationHours * ratio;
    }

    const capacityHours = durationHours * Math.max(0, team.headcount);
    return { ...team, grossDurationHours, breakAdjustedDurationHours, durationHours, capacityHours };
  });

  const totalPreparateurs = teams.reduce(
    (sum, t) => sum + Math.max(0, t.headcount),
    0,
  );
  const totalCapacityHours = teams.reduce((sum, t) => sum + t.capacityHours, 0);

  // SILO : temps de sortie du magasin automatique (ressource dédiée), indépendant des
  // effectifs picking. La cadence nominale est modulée par l'efficacité réelle (aléas
  // humains/machine : pics au-dessus ou en-dessous de la cadence de référence), et un
  // arrêt silo (panne) s'ajoute directement au temps nécessaire. Le silo est une machine
  // avec sa propre fenêtre de fonctionnement quotidienne (par défaut 2×7h36, mais peut
  // tourner davantage — 2×8h, 3×8h, samedi en plus...) : au-delà, le volume restant ne
  // peut pas sortir aujourd'hui et devient un report silo (géré jour après jour dans
  // la vision multi-jours, cf. lib/backlog.ts). Si `asOfHour` est renseigné, on suppose le
  // silo actif depuis `DAY_WINDOW_START` et on ne garde que la fenêtre restante.
  const siloEffectiveCadence = inputs.siloCadence * (Math.max(0, inputs.siloEfficiencyPct) / 100);
  const siloDowntimeHours = Math.max(0, inputs.siloDowntimeHours);
  const siloWindowHoursRaw = Math.max(0, inputs.siloWindowHours);
  const siloWindowHours =
    asOfHour === null
      ? siloWindowHoursRaw
      : Math.max(0, siloWindowHoursRaw - Math.max(0, asOfHour - DAY_WINDOW_START));
  const siloTimeHours = safeDiv(inputs.siloPalettes, siloEffectiveCadence) + siloDowntimeHours;
  const siloChargeHours = Math.min(siloTimeHours, siloWindowHours); // absorbable aujourd'hui
  const siloOverflowHours = Math.max(0, siloTimeHours - siloWindowHours); // à reporter

  // Picking : la cadence (par préparateur) est également modulée par l'efficacité réelle.
  const pickingEffectiveCadence =
    inputs.pickingCadence * (Math.max(0, inputs.pickingEfficiencyPct) / 100);
  const pickingChargeHours = safeDiv(inputs.pickingColis, pickingEffectiveCadence);
  const pickingTimeHours = safeDiv(pickingChargeHours, totalPreparateurs);

  const totalChargeHours = siloChargeHours + pickingChargeHours;

  const occupancyRate =
    totalCapacityHours > 0 ? (totalChargeHours / totalCapacityHours) * 100 : 0;

  const marginHours = totalCapacityHours - totalChargeHours;
  const overloadHours = Math.max(0, -marginHours);

  return {
    totalPreparateurs,
    teams,
    siloEffectiveCadence,
    siloTimeHours,
    siloChargeHours,
    siloOverflowHours,
    pickingEffectiveCadence,
    pickingTimeHours,
    pickingChargeHours,
    totalChargeHours,
    totalCapacityHours,
    occupancyRate,
    marginHours,
    overloadHours,
    status: occupancyStatus(occupancyRate),
  };
}
