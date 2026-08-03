import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlarmClockCheck } from "lucide-react";
import clsx from "clsx";
import { GlassCard } from "../ui/GlassCard";
import { SectionTitle } from "../ui/StatRow";
import { useLogistics } from "../../state/LogisticsContext";
import { computeHourlyCongestion } from "../../lib/congestionHours";
import { formatPercent } from "../../lib/format";

/** Couleur de remplissage selon l'occupation moyenne (vert -> orange -> rouge). */
function cellColor(avgOccupancy: number): string {
  if (avgOccupancy >= 100) return "bg-rose-500";
  if (avgOccupancy >= 80) return "bg-orange-400";
  if (avgOccupancy <= 0) return "bg-white/5";
  return "bg-emerald-400";
}

export function CongestionHoursPanel() {
  const { store } = useLogistics();
  const { hours, sampleSize, worstHours } = useMemo(() => computeHourlyCongestion(store), [store]);

  if (sampleSize === 0) return null;

  return (
    <GlassCard delay={0.18} className="col-span-full" glowColor={worstHours.length > 0 ? "orange" : "cyan"}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <SectionTitle
          icon={<AlarmClockCheck className="h-5 w-5" strokeWidth={2} />}
          title="Heures de congestion"
          subtitle={`Occupation moyenne par heure, sur ${sampleSize} journée${sampleSize > 1 ? "s" : ""} saisie${sampleSize > 1 ? "s" : ""} — s'affine à mesure que tu en ajoutes`}
        />
        <span
          className={clsx(
            "rounded-full px-3 py-1.5 text-xs font-medium",
            worstHours.length > 0
              ? "bg-rose-500/10 text-rose-300"
              : "bg-emerald-500/10 text-emerald-300",
          )}
        >
          {worstHours.length > 0
            ? `${worstHours.length} heure${worstHours.length > 1 ? "s" : ""} à risque : ${worstHours.map((h) => h.label).join(", ")}`
            : "Aucune heure en surcharge en moyenne"}
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-end gap-1.5 overflow-x-auto pb-1"
      >
        {hours.map((h) => (
          <div key={h.hour} className="flex flex-1 min-w-[34px] flex-col items-center gap-1.5">
            <div className="flex h-20 w-full items-end overflow-hidden rounded-md bg-white/5">
              <div
                className={clsx("w-full transition-all", cellColor(h.avgOccupancy))}
                style={{ height: `${Math.min(100, Math.max(4, h.avgOccupancy))}%` }}
                title={`${h.label} — moyenne ${formatPercent(h.avgOccupancy)}, pic ${formatPercent(h.maxOccupancy)}${h.daysCongested > 0 ? `, en surcharge ${h.daysCongested}/${sampleSize} j` : ""}`}
              />
            </div>
            <span className="text-[9px] tabular-nums text-slate-500">{h.label}</span>
          </div>
        ))}
      </motion.div>

      <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-emerald-400" /> Sous 80%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-orange-400" /> 80–100%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-rose-500" /> ≥ 100% (congestion)
        </span>
      </div>
    </GlassCard>
  );
}
