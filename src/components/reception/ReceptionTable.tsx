import type { ReceptionDay, ReceptionTotals } from "../../types/flows";
import { GlassCard } from "../ui/GlassCard";
import { SectionTitle } from "../ui/StatRow";
import { formatDayLabel, formatDecimal } from "../../lib/format";
import { Table2 } from "lucide-react";

function Cell({ pal, cam }: { pal: number; cam: number }) {
  return (
    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
      <span className="text-slate-100">{formatDecimal(pal)}</span>
      <span className="ml-1 text-[11px] text-slate-600">({formatDecimal(cam)} cam.)</span>
    </td>
  );
}

export function ReceptionTable({
  days,
  siteNames,
  totals,
}: {
  days: ReceptionDay[];
  siteNames: string[];
  totals: ReceptionTotals | null;
}) {
  return (
    <GlassCard className="xl:col-span-3">
      <SectionTitle icon={<Table2 className="h-5 w-5" />} title="Détail journalier" subtitle="Palettes et (camions) par site" />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2 text-left">Date</th>
              {siteNames.map((site) => (
                <th key={site} className="px-3 py-2 text-right">
                  {site}
                </th>
              ))}
              <th className="px-3 py-2 text-right">Sous-traitant</th>
              <th className="px-3 py-2 text-right">Rapatriement</th>
              <th className="px-3 py-2 text-right text-cyan-300">Total</th>
              <th className="px-3 py-2 text-right">Cumul</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.dateISO} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                <td className="whitespace-nowrap px-3 py-2 capitalize text-slate-300">{formatDayLabel(day.dateISO)}</td>
                {siteNames.map((site) => (
                  <Cell key={site} pal={day.sites[site]?.palettes ?? 0} cam={day.sites[site]?.camions ?? 0} />
                ))}
                <Cell pal={day.sousTraitant.palettes} cam={day.sousTraitant.camions} />
                <Cell pal={day.rapatriement.palettes} cam={day.rapatriement.camions} />
                <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums text-cyan-300">
                  {formatDecimal(day.totalPalReception.palettes)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-400">
                  {day.cumulPalettes !== null ? formatDecimal(day.cumulPalettes) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          {totals && (
            <tfoot>
              <tr className="border-t border-white/10 text-xs font-semibold uppercase tracking-wide text-slate-300">
                <td className="px-3 py-2">Total semaine</td>
                {siteNames.map((site) => (
                  <Cell key={site} pal={totals.sites[site]?.palettes ?? 0} cam={totals.sites[site]?.camions ?? 0} />
                ))}
                <Cell pal={totals.sousTraitant.palettes} cam={totals.sousTraitant.camions} />
                <Cell pal={totals.rapatriement.palettes} cam={totals.rapatriement.camions} />
                <td className="whitespace-nowrap px-3 py-2 text-right text-cyan-300">
                  {formatDecimal(totals.totalPalReception.palettes)}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </GlassCard>
  );
}
