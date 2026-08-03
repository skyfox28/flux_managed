const intFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const oneDecimalFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

export function formatInt(value: number): string {
  return intFormatter.format(Math.round(value));
}

export function formatDecimal(value: number, digits = 1): string {
  if (digits === 1) return oneDecimalFormatter.format(value);
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

/** Formate un nombre d'heures décimal en "Xh MMmin". */
export function formatHoursMinutes(hoursDecimal: number): string {
  if (!Number.isFinite(hoursDecimal)) return "—";
  const sign = hoursDecimal < 0 ? "-" : "";
  const abs = Math.abs(hoursDecimal);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  if (m === 60) return `${sign}${h + 1}h 00min`;
  return `${sign}${h}h ${String(m).padStart(2, "0")}min`;
}

export function formatPercent(value: number, digits = 0): string {
  return `${formatDecimal(value, digits)}%`;
}
