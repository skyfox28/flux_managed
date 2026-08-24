import type { ParseOutcome, ReceptionData, ReceptionDay, ReceptionTotals, PalCamionFigures } from "../../src/types/flows";
import {
  excelSerialToISODate,
  findHeaderRow,
  findLabelledNumber,
  headerIndexMap,
  numberAt,
  numberOrNullAt,
  readDateActualisation,
  readWorkbook,
  sheetToMatrix,
  stringAt,
  type Matrix,
} from "./matrix";

const REQUIRED_HEADERS = ["Date", "Unité", "S-TOTAL INTERSITES", "Total Pal. Réception"];

function figuresAt(row: (string | number | boolean | null)[], cols: { site: string; index: number }[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const { site, index } of cols) out[site] = numberAt(row, index);
  return out;
}

function mergeSites(
  palettesRow: (string | number | boolean | null)[],
  camionsRow: (string | number | boolean | null)[] | null,
  cols: { site: string; index: number }[],
): Record<string, PalCamionFigures> {
  const palettes = figuresAt(palettesRow, cols);
  const camions = camionsRow ? figuresAt(camionsRow, cols) : {};
  const out: Record<string, PalCamionFigures> = {};
  for (const { site } of cols) {
    out[site] = { palettes: palettes[site] ?? 0, camions: camions[site] ?? 0 };
  }
  return out;
}

function pair(
  palettesRow: (string | number | boolean | null)[],
  camionsRow: (string | number | boolean | null)[] | null,
  col: number | undefined,
): PalCamionFigures {
  return {
    palettes: numberAt(palettesRow, col),
    camions: camionsRow ? numberAt(camionsRow, col) : 0,
  };
}

export function parseReceptionFile(path: string): ParseOutcome<ReceptionData> {
  try {
    const workbook = readWorkbook(path);
    const sheetName = workbook.SheetNames.find((name) => {
      const matrix = sheetToMatrix(workbook, name);
      return matrix ? findHeaderRow(matrix, REQUIRED_HEADERS) !== -1 : false;
    });
    if (!sheetName) {
      return { ok: false, data: null, error: "Aucune feuille avec un tableau de réception reconnu (colonnes Date/Unité/Total Pal. Réception introuvables)." };
    }
    const matrix = sheetToMatrix(workbook, sheetName) as Matrix;
    const headerRowIndex = findHeaderRow(matrix, REQUIRED_HEADERS);
    const headerRow = matrix[headerRowIndex];
    const map = headerIndexMap(headerRow);

    const colDate = map.get("Date");
    const colUnite = map.get("Unité");
    const colSTotal = map.get("S-TOTAL INTERSITES");
    const colSousTraitant = map.get("Sous-Traitant");
    const colRapatriement = map.get("Rapatriement");
    const colTotalPal = map.get("Total Pal. Réception");
    const colCumul = map.get("Cumul");
    const colCapacite = map.get("Capacité");
    const colReliquat = map.get("Reliquat VS Capa/J");
    const colEstimNavettes = map.get("Estimation navettes");
    const colNbRoulement = map.get("Nb Roulement quais");

    if (colDate === undefined || colUnite === undefined || colSTotal === undefined || colTotalPal === undefined) {
      return { ok: false, data: null, error: "Colonnes essentielles manquantes dans le tableau de réception." };
    }

    const siteCols: { site: string; index: number }[] = [];
    for (let c = colUnite + 1; c < colSTotal; c++) {
      const label = headerRow[c];
      if (typeof label === "string" && label.trim()) {
        siteCols.push({ site: label.replace(/\s+/g, " ").trim(), index: c });
      }
    }

    const days: ReceptionDay[] = [];
    let totalsPalettesRow: (string | number | boolean | null)[] | null = null;
    let totalsCamionsRow: (string | number | boolean | null)[] | null = null;

    for (let r = headerRowIndex + 1; r < matrix.length; r++) {
      const row = matrix[r];
      const dateCell = row[colDate];
      const unite = stringAt(row, colUnite);

      if (typeof dateCell === "number" && unite === "Palettes") {
        const nextRow = matrix[r + 1];
        const isCamionsNext = nextRow && stringAt(nextRow, colUnite) === "Camions" && nextRow[colDate] == null;
        const camionsRow = isCamionsNext ? nextRow : null;

        days.push({
          dateSerial: dateCell,
          dateISO: excelSerialToISODate(dateCell),
          sites: mergeSites(row, camionsRow, siteCols),
          sousTotalIntersites: pair(row, camionsRow, colSTotal),
          sousTraitant: pair(row, camionsRow, colSousTraitant),
          rapatriement: pair(row, camionsRow, colRapatriement),
          totalPalReception: pair(row, camionsRow, colTotalPal),
          cumulPalettes: numberOrNullAt(row, colCumul),
          capacite: numberOrNullAt(row, colCapacite),
          reliquatVsCapaJ: numberOrNullAt(row, colReliquat),
          estimationNavettes: numberOrNullAt(row, colEstimNavettes),
          nbRoulementQuais: numberOrNullAt(row, colNbRoulement),
        });

        if (camionsRow) r++;
        continue;
      }

      if (typeof dateCell === "string") {
        const label = dateCell.trim().toLowerCase();
        if (label === "total palettes") totalsPalettesRow = row;
        else if (label === "total camions") totalsCamionsRow = row;
      }
    }

    const totals: ReceptionTotals | null =
      totalsPalettesRow || totalsCamionsRow
        ? {
            sites: mergeSites(totalsPalettesRow ?? [], totalsCamionsRow, siteCols),
            sousTotalIntersites: pair(totalsPalettesRow ?? [], totalsCamionsRow, colSTotal),
            sousTraitant: pair(totalsPalettesRow ?? [], totalsCamionsRow, colSousTraitant),
            rapatriement: pair(totalsPalettesRow ?? [], totalsCamionsRow, colRapatriement),
            totalPalReception: pair(totalsPalettesRow ?? [], totalsCamionsRow, colTotalPal),
          }
        : null;

    const data: ReceptionData = {
      sourcePath: path,
      readAt: new Date().toISOString(),
      dateActualisation: readDateActualisation(workbook),
      siteNames: siteCols.map((c) => c.site),
      days,
      totals,
      capaciteSiloSemaine: findLabelledNumber(matrix, "CAPACITE SILO"),
      solde: findLabelledNumber(matrix, "SOLDE"),
    };

    return { ok: true, data, error: null };
  } catch (err) {
    return { ok: false, data: null, error: err instanceof Error ? err.message : String(err) };
  }
}
