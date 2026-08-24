import type { ExpeditionData, ExpeditionDayTotal, ExpeditionDelivery, ParseOutcome } from "../../src/types/flows";
import {
  excelSerialToISODate,
  findHeaderRow,
  headerIndexMap,
  numberAt,
  readDateActualisation,
  readWorkbook,
  sheetToMatrix,
  stringAt,
  type Matrix,
} from "./matrix";

const REQUIRED_HEADERS = ["Date Chargement", "Livraison", "Pal SILO", "Colis Picking"];

function parseTotalLabelDate(label: string): string | null {
  const match = label.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

function readTotalRow(row: Matrix[number], label: string, dateISO: string | null, cols: Record<string, number | undefined>): ExpeditionDayTotal {
  return {
    label,
    dateISO,
    liv: numberAt(row, cols.liv),
    codes: numberAt(row, cols.codes),
    palSilo: numberAt(row, cols.palSilo),
    hrSilo: numberAt(row, cols.hrSilo),
    nbPick: numberAt(row, cols.nbPick),
    colisPicking: numberAt(row, cols.colisPicking),
    hrPick: numberAt(row, cols.hrPick),
    totalColis: numberAt(row, cols.totalColis),
  };
}

export function parseExpeditionFile(path: string): ParseOutcome<ExpeditionData> {
  try {
    const workbook = readWorkbook(path);
    const sheetName = workbook.SheetNames.find((name) => {
      const matrix = sheetToMatrix(workbook, name);
      return matrix ? findHeaderRow(matrix, REQUIRED_HEADERS) !== -1 : false;
    });
    if (!sheetName) {
      return { ok: false, data: null, error: "Aucune feuille avec le détail des livraisons reconnue (colonnes Date Chargement/Livraison/Pal SILO/Colis Picking introuvables)." };
    }
    const matrix = sheetToMatrix(workbook, sheetName) as Matrix;
    const headerRowIndex = findHeaderRow(matrix, REQUIRED_HEADERS);
    const headerRow = matrix[headerRowIndex];
    const map = headerIndexMap(headerRow);

    const colDate = map.get("Date Chargement");
    const colLivraison = map.get("Livraison");
    if (colDate === undefined || colLivraison === undefined) {
      return { ok: false, data: null, error: "Colonnes essentielles manquantes dans le détail des livraisons." };
    }
    const cols = {
      receptionnaire: map.get("Nom réceptionnaire des marchand."),
      liv: map.get("Liv."),
      codes: map.get("Codes"),
      palSilo: map.get("Pal SILO"),
      hrSilo: map.get("Hr SILO"),
      nbPick: map.get("Nb Pick"),
      colisPicking: map.get("Colis Picking"),
      hrPick: map.get("Hr Pick"),
      totalColis: map.get("Total Colis"),
    };

    const deliveries: ExpeditionDelivery[] = [];
    const dayTotals: ExpeditionDayTotal[] = [];
    let grandTotal: ExpeditionDayTotal | null = null;
    let currentDateISO: string | null = null;

    for (let r = headerRowIndex + 1; r < matrix.length; r++) {
      const row = matrix[r];
      const dateCell = row[colDate];

      if (typeof dateCell === "number") {
        currentDateISO = excelSerialToISODate(dateCell);
      } else if (typeof dateCell === "string" && dateCell.trim()) {
        const label = dateCell.trim();
        const lower = label.toLowerCase();
        if (lower === "total général") {
          grandTotal = readTotalRow(row, label, null, cols);
          continue;
        }
        if (lower.startsWith("total")) {
          dayTotals.push(readTotalRow(row, label, parseTotalLabelDate(label) ?? currentDateISO, cols));
          continue;
        }
      }

      const livraisonCell = row[colLivraison];
      const hasDelivery =
        (typeof livraisonCell === "number" && Number.isFinite(livraisonCell)) ||
        (typeof livraisonCell === "string" && livraisonCell.trim());
      if (!hasDelivery) continue;

      deliveries.push({
        dateISO: currentDateISO,
        livraison: stringAt(row, colLivraison),
        receptionnaire: stringAt(row, cols.receptionnaire),
        liv: numberAt(row, cols.liv),
        codes: numberAt(row, cols.codes),
        palSilo: numberAt(row, cols.palSilo),
        hrSilo: numberAt(row, cols.hrSilo),
        nbPick: numberAt(row, cols.nbPick),
        colisPicking: numberAt(row, cols.colisPicking),
        hrPick: numberAt(row, cols.hrPick),
        totalColis: numberAt(row, cols.totalColis),
      });
    }

    const data: ExpeditionData = {
      sourcePath: path,
      readAt: new Date().toISOString(),
      dateActualisation: readDateActualisation(workbook),
      deliveries,
      dayTotals,
      grandTotal,
    };

    return { ok: true, data, error: null };
  } catch (err) {
    return { ok: false, data: null, error: err instanceof Error ? err.message : String(err) };
  }
}
