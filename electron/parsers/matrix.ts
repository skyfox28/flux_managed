import * as XLSX from "xlsx";

export type Cell = string | number | boolean | null;
export type Matrix = Cell[][];

/** Convertit une date série Excel (système 1900) en ISO "YYYY-MM-DD". */
export function excelSerialToISODate(serial: number): string {
  const utcDays = Math.floor(serial - 25569);
  const utcMs = utcDays * 86400 * 1000;
  return new Date(utcMs).toISOString().slice(0, 10);
}

export function readWorkbook(path: string): XLSX.WorkBook {
  return XLSX.readFile(path, { cellDates: false });
}

export function sheetToMatrix(workbook: XLSX.WorkBook, sheetName: string): Matrix | null {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return null;
  return XLSX.utils.sheet_to_json<Cell[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
  });
}

export function findSheetName(workbook: XLSX.WorkBook, predicate: (name: string) => boolean): string | null {
  return workbook.SheetNames.find(predicate) ?? null;
}

function normalize(value: Cell): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

/** Cherche la première ligne contenant toutes les étiquettes données (comparaison exacte, normalisée). */
export function findHeaderRow(matrix: Matrix, requiredLabels: string[]): number {
  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r];
    const found = requiredLabels.every((label) => row.some((cell) => normalize(cell) === label));
    if (found) return r;
  }
  return -1;
}

/** Construit une correspondance nom d'en-tête (normalisé) -> index de colonne pour une ligne donnée. */
export function headerIndexMap(row: Cell[]): Map<string, number> {
  const map = new Map<string, number>();
  row.forEach((cell, index) => {
    const label = normalize(cell);
    if (label && !map.has(label)) map.set(label, index);
  });
  return map;
}

export function numberAt(row: Cell[] | undefined, col: number | undefined): number {
  if (row === undefined || col === undefined) return 0;
  const value = row[col];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function numberOrNullAt(row: Cell[] | undefined, col: number | undefined): number | null {
  if (row === undefined || col === undefined) return null;
  const value = row[col];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function stringAt(row: Cell[] | undefined, col: number | undefined): string {
  if (row === undefined || col === undefined) return "";
  const value = row[col];
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

/** Cherche une cellule dont le libellé commence par `labelPrefix` puis renvoie la première valeur
 * numérique trouvée à sa droite sur la même ligne (utilisé pour les widgets récapitulatifs en marge
 * des tableaux, ex: "CAPACITE SILO (Sem)", "SOLDE"). */
export function findLabelledNumber(matrix: Matrix, labelPrefix: string): number | null {
  const prefix = labelPrefix.toUpperCase();
  for (const row of matrix) {
    const labelIndex = row.findIndex((cell) => typeof cell === "string" && cell.toUpperCase().startsWith(prefix));
    if (labelIndex === -1) continue;
    for (let c = labelIndex + 1; c < row.length; c++) {
      const value = row[c];
      if (typeof value === "number" && Number.isFinite(value)) return value;
    }
  }
  return null;
}

/** Lit la feuille dédiée "Date_Actualisation" (présente dans les deux formats de fichier),
 * composée d'un en-tête et d'une valeur en série Excel. */
export function readDateActualisation(workbook: XLSX.WorkBook): string | null {
  const matrix = sheetToMatrix(workbook, "Date_Actualisation");
  if (!matrix) return null;
  for (const row of matrix) {
    for (const cell of row) {
      if (typeof cell === "number" && Number.isFinite(cell) && cell > 20000) {
        return excelSerialToISODate(cell);
      }
    }
  }
  return null;
}
