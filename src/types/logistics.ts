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
  /** Fenêtre de fonctionnement du silo (magasin automatique) ce jour-là, en heures.
   *  Par défaut 2×7h36 (équipes matin + après-midi), mais peut être étendu
   *  (2×8h, 3×8h, 3×7h36, samedi supplémentaire...). */
  siloWindowHours: number;
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
  /** Temps brut nécessaire pour sortir tout le volume du jour (palettes/cadence + panne),
   *  indépendamment de la fenêtre de fonctionnement du silo. */
  siloTimeHours: number;
  /** Part de ce temps réellement absorbable aujourd'hui, plafonnée à `siloWindowHours`. */
  siloChargeHours: number;
  /** Part du besoin du jour qui dépasse la fenêtre silo — à reporter (hors report déjà
   *  reçu d'un jour précédent, qui est géré séparément dans la vision multi-jours). */
  siloOverflowHours: number;

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
