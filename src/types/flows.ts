/** Types partagés entre le process principal Electron et le renderer React. */

export type View = "reception" | "expedition" | "settings";

export type FileKind = "reception" | "expedition";

export interface FlowsSettings {
  receptionPath: string | null;
  expeditionPath: string | null;
}

/** Couple palettes / camions pour une colonne donnée (site, sous-traitant, etc.). */
export interface PalCamionFigures {
  palettes: number;
  camions: number;
}

export interface ReceptionDay {
  dateSerial: number;
  dateISO: string;
  /** Colonnes "site" dynamiques telles que trouvées dans le fichier (Monteux1, Carp. Sucré, ...). */
  sites: Record<string, PalCamionFigures>;
  sousTotalIntersites: PalCamionFigures;
  sousTraitant: PalCamionFigures;
  rapatriement: PalCamionFigures;
  totalPalReception: PalCamionFigures;
  cumulPalettes: number | null;
  capacite: number | null;
  reliquatVsCapaJ: number | null;
  estimationNavettes: number | null;
  nbRoulementQuais: number | null;
}

export interface ReceptionTotals {
  sites: Record<string, PalCamionFigures>;
  sousTotalIntersites: PalCamionFigures;
  sousTraitant: PalCamionFigures;
  rapatriement: PalCamionFigures;
  totalPalReception: PalCamionFigures;
}

export interface ReceptionData {
  sourcePath: string;
  readAt: string;
  dateActualisation: string | null;
  siteNames: string[];
  days: ReceptionDay[];
  totals: ReceptionTotals | null;
  capaciteSiloSemaine: number | null;
  solde: number | null;
}

export interface ExpeditionDelivery {
  dateISO: string | null;
  livraison: string;
  receptionnaire: string;
  liv: number;
  codes: number;
  palSilo: number;
  hrSilo: number;
  nbPick: number;
  colisPicking: number;
  hrPick: number;
  totalColis: number;
}

export interface ExpeditionDayTotal {
  label: string;
  dateISO: string | null;
  liv: number;
  codes: number;
  palSilo: number;
  hrSilo: number;
  nbPick: number;
  colisPicking: number;
  hrPick: number;
  totalColis: number;
}

export interface ExpeditionData {
  sourcePath: string;
  readAt: string;
  dateActualisation: string | null;
  deliveries: ExpeditionDelivery[];
  dayTotals: ExpeditionDayTotal[];
  grandTotal: ExpeditionDayTotal | null;
}

export interface ParseOutcome<T> {
  ok: boolean;
  data: T | null;
  error: string | null;
}
