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

export function computeLogistics(inputs: LogisticsInputs): LogisticsDerived {
  const teams: TeamDerived[] = inputs.teams.map((team) => {
    const durationHours = teamDurationHours(team.start, team.end);
    const capacityHours = durationHours * Math.max(0, team.headcount);
    return { ...team, durationHours, capacityHours };
  });

  const totalPreparateurs = teams.reduce(
    (sum, t) => sum + Math.max(0, t.headcount),
    0,
  );
  const totalCapacityHours = teams.reduce((sum, t) => sum + t.capacityHours, 0);

  // SILO : temps de traitement du flux (ressource dédiée), indépendant des effectifs picking.
  const siloTimeHours = safeDiv(inputs.siloPalettes, inputs.siloCadence);
  const siloChargeHours = siloTimeHours; // mobilise l'équivalent d'1 préparateur pendant ce temps

  // Picking : la cadence est "par préparateur" -> charge totale en préparateur-heures,
  // et durée réelle si tous les préparateurs disponibles picken en parallèle.
  const pickingChargeHours = safeDiv(inputs.pickingColis, inputs.pickingCadence);
  const pickingTimeHours = safeDiv(pickingChargeHours, totalPreparateurs);

  const totalChargeHours = siloChargeHours + pickingChargeHours;

  const occupancyRate =
    totalCapacityHours > 0 ? (totalChargeHours / totalCapacityHours) * 100 : 0;

  const marginHours = totalCapacityHours - totalChargeHours;
  const overloadHours = Math.max(0, -marginHours);

  return {
    totalPreparateurs,
    teams,
    siloTimeHours,
    siloChargeHours,
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
