export type TeamId = "matin" | "apresmidi" | "journee";

export interface TeamConfig {
  id: TeamId;
  label: string;
  /** Fixed schedule, "HH:MM" 24h format — not user-editable. */
  start: string;
  end: string;
  /** Only field the user can edit for a team. */
  headcount: number;
}

export interface LogisticsInputs {
  siloPalettes: number;
  siloCadence: number; // palettes / heure
  pickingColis: number;
  pickingCadence: number; // colis / heure / préparateur
  teams: TeamConfig[];
}

export type OccupancyStatus = "ok" | "warning" | "critical";

export interface TeamDerived extends TeamConfig {
  durationHours: number;
  capacityHours: number; // durationHours * headcount
}

export interface LogisticsDerived {
  totalPreparateurs: number;
  teams: TeamDerived[];

  siloTimeHours: number; // palettes / cadenceSilo
  siloChargeHours: number; // person-hours mobilized by SILO

  pickingTimeHours: number; // colis / (cadence * totalPrepa) — durée si tous en picking
  pickingChargeHours: number; // colis / cadence — person-hours mobilized by picking

  totalChargeHours: number;
  totalCapacityHours: number;

  occupancyRate: number; // %
  marginHours: number; // capacity - charge (négatif = déficit)
  overloadHours: number; // max(0, charge - capacity)

  status: OccupancyStatus;
}
