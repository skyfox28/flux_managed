import { Fragment, useMemo } from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { SectionTitle } from "../ui/StatRow";
import { useLogistics } from "../../state/LogisticsContext";
import { buildTeamHeatmap } from "../../lib/timeline";

// Rampe séquentielle bleue (1 teinte, clair -> foncé) — cf. skill dataviz.
const RAMP = ["#0d1a2e", "#184f95", "#1c5cab", "#256abf", "#2a78d6", "#3987e5", "#5598e7"];

function colorForOccupancy(occupancy: number): string {
  const ratio = Math.min(1, occupancy / 130);
  const idx = Math.round(ratio * (RAMP.length - 1));
  return RAMP[idx];
}

export function CapacityHeatmap() {
  const { derived } = useLogistics();
  const { hours, rows } = useMemo(() => buildTeamHeatmap(derived), [derived]);

  return (
    <GlassCard delay={0.15} className="col-span-full xl:col-span-3">
      <SectionTitle
        icon={<Flame className="h-5 w-5" strokeWidth={2} />}
        title="Heatmap de charge"
        subtitle="Intensité d'occupation par équipe et par heure"
      />
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `104px repeat(${hours.length}, minmax(0,1fr))` }}
          >
            <div />
            {hours.map((h) => (
              <div
                key={h}
                className="text-center text-[10px] text-slate-500"
              >
                {String(h).padStart(2, "0")}h
              </div>
            ))}
            {rows.map((row) => (
              <Fragment key={row.teamId}>
                <div className="flex items-center truncate pr-2 text-xs text-slate-400">
                  {row.label.replace(/^Équipe\s+/, "")}
                </div>
                {row.cells.map((cell) => (
                  <motion.div
                    key={`${row.teamId}-${cell.hour}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    title={
                      cell.present
                        ? `${row.label} · ${cell.hour}h : ${cell.occupancy.toFixed(0)}%`
                        : `${row.label} · ${cell.hour}h : hors service`
                    }
                    className="aspect-square rounded-[4px]"
                    style={{
                      background: cell.present
                        ? colorForOccupancy(cell.occupancy)
                        : "rgba(255,255,255,0.03)",
                    }}
                  />
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
        <span>Faible</span>
        <div className="flex h-2 flex-1 overflow-hidden rounded-full">
          {RAMP.map((c) => (
            <span key={c} className="flex-1" style={{ backgroundColor: c }} />
          ))}
        </div>
        <span>Élevée</span>
      </div>
    </GlassCard>
  );
}
