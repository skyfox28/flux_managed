import type { LogisticsDerived, TeamDerived } from "../types/logistics";
import { timeToHours } from "./calculations";

export interface HourPoint {
  hour: number;
  label: string;
  capacity: number;
  charge: number;
  occupancy: number;
  cumulativeCapacity: number;
  cumulativeCharge: number;
}

export interface TeamHourCell {
  teamId: string;
  hour: number;
  present: boolean;
  occupancy: number;
}

const DAY_START = 5;
const DAY_END = 20;

function presenceFraction(team: TeamDerived, hour: number): number {
  const start = timeToHours(team.start);
  const end = timeToHours(team.end);
  const overlapStart = Math.max(hour, start);
  const overlapEnd = Math.min(hour + 1, end);
  return Math.max(0, overlapEnd - overlapStart);
}

/** Poids déterministe en forme de cloche, pic vers 11h-13h (activité typique d'entrepôt). */
function demandWeight(hour: number): number {
  const t = (hour + 0.5 - DAY_START) / (DAY_END - DAY_START);
  const bell = Math.sin(Math.PI * Math.min(1, Math.max(0, t)));
  return 0.18 + 0.82 * bell;
}

export function buildDayTimeline(derived: LogisticsDerived): HourPoint[] {
  const hours = Array.from(
    { length: DAY_END - DAY_START },
    (_, i) => DAY_START + i,
  );

  const weights = hours.map(demandWeight);
  const weightSum = weights.reduce((a, b) => a + b, 0) || 1;

  let cumCap = 0;
  let cumCharge = 0;

  return hours.map((hour, i) => {
    const capacity = derived.teams.reduce((sum, t) => {
      // Les pauses (30 min/poste) sont réparties proportionnellement sur les
      // heures de présence de l'équipe, faute de granularité horaire exacte. On
      // utilise volontairement le ratio "pauses seules" (plein jour) et non
      // `durationHours`, qui peut être réduit à l'heure actuelle sur la journée en
      // cours : ce profil horaire reste le profil théorique de la journée entière.
      const breakFactor =
        t.grossDurationHours > 0 ? t.breakAdjustedDurationHours / t.grossDurationHours : 0;
      return sum + presenceFraction(t, hour) * Math.max(0, t.headcount) * breakFactor;
    }, 0);
    const charge = (weights[i] / weightSum) * derived.totalChargeHours;
    const occupancy = capacity > 0 ? (charge / capacity) * 100 : charge > 0 ? 150 : 0;

    cumCap += capacity;
    cumCharge += charge;

    return {
      hour,
      label: `${String(hour).padStart(2, "0")}h`,
      capacity: Number(capacity.toFixed(2)),
      charge: Number(charge.toFixed(2)),
      occupancy: Number(occupancy.toFixed(1)),
      cumulativeCapacity: Number(cumCap.toFixed(2)),
      cumulativeCharge: Number(cumCharge.toFixed(2)),
    };
  });
}

export function buildTeamHeatmap(derived: LogisticsDerived): {
  hours: number[];
  rows: { teamId: string; label: string; cells: TeamHourCell[] }[];
} {
  const hours = Array.from(
    { length: DAY_END - DAY_START },
    (_, i) => DAY_START + i,
  );
  const timeline = buildDayTimeline(derived);
  const occupancyByHour = new Map(timeline.map((p) => [p.hour, p.occupancy]));

  const rows = derived.teams.map((team) => ({
    teamId: team.id,
    label: team.label,
    cells: hours.map((hour) => {
      const frac = presenceFraction(team, hour);
      return {
        teamId: team.id,
        hour,
        present: frac > 0,
        occupancy: frac > 0 ? (occupancyByHour.get(hour) ?? 0) : 0,
      };
    }),
  }));

  return { hours, rows };
}
