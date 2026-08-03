import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Boxes, Pencil, Sparkles, Snowflake } from "lucide-react";
import clsx from "clsx";
import { GlassCard } from "../ui/GlassCard";
import { SectionTitle } from "../ui/StatRow";
import { useLogistics } from "../../state/LogisticsContext";
import { computeForecastChain, type DayForecast } from "../../lib/backlog";
import { formatDayLabel, formatHoursMinutes, formatPercent } from "../../lib/format";

const HORIZON_DAYS = 7;

const STATUS_STYLE: Record<string, { text: string; bar: string; ring: string }> = {
  ok: { text: "text-emerald-300", bar: "bg-emerald-400", ring: "ring-emerald-400/15" },
  warning: { text: "text-orange-300", bar: "bg-orange-400", ring: "ring-orange-400/15" },
  critical: { text: "text-rose-300", bar: "bg-rose-400", ring: "ring-rose-400/15" },
};

const CONFIDENCE_LABEL: Record<string, string> = {
  low: "confiance faible",
  medium: "confiance moyenne",
  high: "confiance haute",
};

function DayCard({ day }: { day: DayForecast }) {
  const { selectDate } = useLogistics();
  const predicted = day.source === "predicted";
  const style = STATUS_STYLE[day.status];
  const capacity = day.own.totalCapacityHours || 1;
  // Au-delà de la capacité, on normalise les deux segments sur le total à traiter
  // (au lieu de plafonner le report seul) pour que la sévérité (couleur du statut)
  // ne soit jamais masquée par le report.
  const denom = Math.max(capacity, day.totalCharge) || 1;
  const backlogPct = (day.backlogIn / denom) * 100;
  const ownPct = (day.own.totalChargeHours / denom) * 100;

  return (
    <div
      className={clsx(
        "group relative flex w-[140px] shrink-0 flex-col gap-1.5 rounded-xl border bg-white/[0.03] p-2.5 ring-1",
        predicted ? "border-dashed border-white/12" : "border-white/8",
        style.ring,
      )}
      title={
        predicted
          ? `Prédiction (${CONFIDENCE_LABEL[day.confidence ?? "low"]}) · ${formatPercent(day.occupancyWithBacklog)} si ~${Math.round(day.own.totalChargeHours)}h de charge`
          : `Charge propre ${formatHoursMinutes(day.own.totalChargeHours)} · Capacité ${formatHoursMinutes(day.own.totalCapacityHours)}`
      }
    >
      <div className="flex items-center justify-between">
        <span
          className={clsx(
            "font-display text-xs font-semibold capitalize",
            predicted ? "text-slate-400" : "text-slate-100",
          )}
        >
          {formatDayLabel(day.date)}
        </span>
        {predicted ? (
          <Sparkles className="h-3 w-3 text-cyan-400/70" />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
        )}
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
        <div className={clsx("flex h-full w-full", predicted && "opacity-60")}>
          {backlogPct > 0 && (
            <div className="h-full bg-orange-400/80" style={{ width: `${backlogPct}%` }} />
          )}
          <div className={`h-full ${style.bar}`} style={{ width: `${Math.max(0, ownPct)}%` }} />
        </div>
      </div>

      <div
        className={clsx(
          "font-display text-lg font-bold tabular-nums",
          predicted ? "text-slate-300" : style.text,
        )}
      >
        {formatPercent(day.occupancyWithBacklog)}
      </div>

      <div className="flex flex-col gap-1">
        {day.backlogIn > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-orange-300">
            <ArrowDownRight className="h-3 w-3 shrink-0" />
            {formatHoursMinutes(day.backlogIn)} reçu
          </span>
        )}
        {day.congested ? (
          <span className="flex items-center gap-1 text-[10px] font-medium text-rose-300">
            <ArrowUpRight className="h-3 w-3 shrink-0" />
            {formatHoursMinutes(day.backlogOut)} reporté
          </span>
        ) : (
          <span className="text-[10px] text-emerald-400/80">Rien à reporter</span>
        )}
        {day.siloCongested && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-sky-300">
            <Boxes className="h-3 w-3 shrink-0" />
            {formatHoursMinutes(day.siloBacklogOut)} silo en attente
          </span>
        )}
      </div>

      {predicted ? (
        <button
          onClick={() => selectDate(day.date)}
          className="mt-0.5 flex items-center justify-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[10px] text-slate-500 transition-colors hover:border-cyan-300/30 hover:text-cyan-300"
        >
          <Pencil className="h-2.5 w-2.5" />
          Prédit · {CONFIDENCE_LABEL[day.confidence ?? "low"]}
        </button>
      ) : (
        <span className="mt-0.5 text-center text-[10px] uppercase tracking-wide text-slate-600">
          Saisi
        </span>
      )}
    </div>
  );
}

export function CongestionForecast() {
  const { store, selectedDate } = useLogistics();
  const chain = useMemo(
    () => computeForecastChain(store, selectedDate, HORIZON_DAYS),
    [store, selectedDate],
  );

  const realCount = chain.filter((d) => d.source === "real").length;
  const predictedCount = chain.length - realCount;
  const lastKnown = chain[chain.length - 1];
  const isSnowballing = Boolean(lastKnown?.congested);
  const isSiloSnowballing = Boolean(lastKnown?.siloCongested);
  const anySnowballing = isSnowballing || isSiloSnowballing;

  const messages: string[] = [];
  if (lastKnown?.congested) {
    messages.push(`${formatHoursMinutes(lastKnown.backlogOut)} humain`);
  }
  if (lastKnown?.siloCongested) {
    messages.push(`${formatHoursMinutes(lastKnown.siloBacklogOut)} silo`);
  }

  return (
    <GlassCard delay={0.15} className="col-span-full" glowColor={anySnowballing ? "orange" : "cyan"}>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <SectionTitle
          icon={<Snowflake className="h-5 w-5" strokeWidth={2} />}
          title="Vision semaine · effet boule de neige"
          subtitle={`${realCount} jour${realCount > 1 ? "s" : ""} saisi${realCount > 1 ? "s" : ""} · ${predictedCount} prédit${predictedCount > 1 ? "s" : ""} à partir de l'historique`}
        />
        <span
          className={clsx(
            "rounded-full px-3 py-1.5 text-xs font-medium",
            anySnowballing ? "bg-rose-500/10 text-rose-300" : "bg-emerald-500/10 text-emerald-300",
          )}
        >
          {anySnowballing
            ? `Congestion — ${messages.join(" + ")} non absorbées après le ${formatDayLabel(lastKnown.date)}`
            : "Aucune accumulation sur l'horizon"}
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="mt-3 flex items-stretch gap-2 overflow-x-auto pb-1"
      >
        {chain.map((day) => (
          <DayCard key={day.date} day={day} />
        ))}
        {chain.length === 0 && (
          <p className="py-4 text-sm text-slate-500">
            Aucune donnée à projeter — saisissez au moins une journée pour démarrer la
            prévision.
          </p>
        )}
      </motion.div>
    </GlassCard>
  );
}
