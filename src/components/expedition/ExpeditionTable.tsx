import type { ExpeditionDayTotal, ExpeditionDelivery } from "../../types/flows";
import { GlassCard } from "../ui/GlassCard";
import { SectionTitle } from "../ui/StatRow";
import { formatDayLabel, formatDecimal, formatHoursMinutes, formatInt } from "../../lib/format";
import { Table2 } from "lucide-react";

export function ExpeditionTable({
  deliveries,
  grandTotal,
}: {
  deliveries: ExpeditionDelivery[];
  grandTotal: ExpeditionDayTotal | null;
}) {
  return (
    <GlassCard className="xl:col-span-3">
      <SectionTitle icon={<Table2 className="h-5 w-5" />} title="Livraisons" subtitle="Détail par livraison — SILO et Picking" />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2 text-left">Chargement</th>
              <th className="px-3 py-2 text-left">Livraison</th>
              <th className="px-3 py-2 text-left">Réceptionnaire</th>
              <th className="px-3 py-2 text-right">Codes</th>
              <th className="px-3 py-2 text-right">Pal SILO</th>
              <th className="px-3 py-2 text-right">Hr SILO</th>
              <th className="px-3 py-2 text-right">Colis Picking</th>
              <th className="px-3 py-2 text-right">Hr Pick</th>
              <th className="px-3 py-2 text-right text-cyan-300">Total colis</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((delivery, index) => (
              <tr key={`${delivery.livraison}-${index}`} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                <td className="whitespace-nowrap px-3 py-2 capitalize text-slate-400">
                  {delivery.dateISO ? formatDayLabel(delivery.dateISO) : "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-slate-200">{delivery.livraison}</td>
                <td className="px-3 py-2 text-slate-300">{delivery.receptionnaire || "—"}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-300">{formatInt(delivery.codes)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-100">{formatDecimal(delivery.palSilo)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-400">{formatHoursMinutes(delivery.hrSilo)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-100">{formatInt(delivery.colisPicking)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-400">{formatHoursMinutes(delivery.hrPick)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums text-cyan-300">
                  {formatInt(delivery.totalColis)}
                </td>
              </tr>
            ))}
          </tbody>
          {grandTotal && (
            <tfoot>
              <tr className="border-t border-white/10 text-xs font-semibold uppercase tracking-wide text-slate-300">
                <td className="px-3 py-2" colSpan={3}>
                  Total général
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatInt(grandTotal.codes)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatDecimal(grandTotal.palSilo)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatHoursMinutes(grandTotal.hrSilo)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatInt(grandTotal.colisPicking)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatHoursMinutes(grandTotal.hrPick)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-cyan-300">{formatInt(grandTotal.totalColis)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </GlassCard>
  );
}
