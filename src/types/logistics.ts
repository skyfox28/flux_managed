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
  siloCadence: number; // palettes / heure (nominale)
  /** Efficacité réelle vs cadence nominale (aléas humains/machine) : 100 = nominal. */
  siloEfficiencyPct: number;
  /** Panne(s) magasin automatique : heures d'arrêt du silo ce jour-là. */
  siloDowntimeHours: number;
  pickingColis: number;
  pickingCadence: number; // colis / heure / préparateur (nominale)
  /** Efficacité réelle vs cadence nominale (aléas humains/machine) : 100 = nominal. */
  pickingEfficiencyPct: number;
  teams: TeamConfig[];
}

export type OccupancyStatus = "ok" | "warning" | "critical";

export interface TeamDerived extends TeamConfig {
  /** Durée brute de l'équipe (horaire de prise/fin de poste), sans les pauses. */
  grossDurationHours: number;
  /** Durée effective de travail, pauses déduites (10 + 20 min). */
  durationHours: number;
  capacityHours: number; // durationHours (effective) * headcount
}

export interface LogisticsDerived {
  totalPreparateurs: number;
  teams: TeamDerived[];

  siloEffectiveCadence: number; // cadence nominale × efficacité
  siloTimeHours: number; // palettes / cadence effective + arrêt silo
  siloChargeHours: number; // person-hours mobilized by SILO

  pickingEffectiveCadence: number; // cadence nominale × efficacité
  pickingTimeHours: number; // colis / (cadence effective × totalPrepa) — durée si tous en picking
  pickingChargeHours: number; // colis / cadence effective — person-hours mobilized by picking

  totalChargeHours: number;
  totalCapacityHours: number;

  occupancyRate: number; // %
  marginHours: number; // capacity - charge (négatif = déficit)
  overloadHours: number; // max(0, charge - capacity)

  status: OccupancyStatus;
}
