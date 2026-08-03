import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Boxes, Clock4, Snowflake } from "lucide-react";
import clsx from "clsx";
import { GlassCard } from "../ui/GlassCard";
import { SectionTitle } from "../ui/StatRow";
import { useLogistics } from "../../state/LogisticsContext";
import { computeForecastChain, type DayForecast } from "../../lib/backlog";
import { computeFinishEstimate } from "../../lib/schedule";
import { formatDayLabel, formatHoursMinutes, formatPercent } from "../../lib/format";

const HORIZON_DAYS = 7;

const STATUS_STYLE: Record<string, { text: string; bar: string; ring: string }> = {
  ok: { text: "text-emerald-300", bar: "bg-emerald-400", ring: "ring-emerald-400/15" },
  warning: { text: "text-orange-300", bar: "bg-orange-400", ring: "ring-orange-400/15" },
  critical: { text: "text-rose-300", bar: "bg-rose-400", ring: "ring-rose-400/15" },
};

function DayCard({ day }: { day: DayForecast }) {
  const style = STATUS_STYLE[day.status];
  const finish = computeFinishEstimate(day.own, day.totalCharge);
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
        "flex w-[140px] shrink-0 flex-col gap-1.5 rounded-xl border border-white/8 bg-white/[0.03] p-2.5 ring-1",
        style.ring,
      )}
      title={`Charge propre ${formatHoursMinutes(day.own.totalChargeHours)} · Capacité ${formatHoursMinutes(day.own.totalCapacityHours)}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-xs font-semibold capitalize text-slate-100">
          {formatDayLabel(day.date)}
        </span>
        <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
        <div className="flex h-full w-full">
          {backlogPct > 0 && (
            <div className="h-full bg-orange-400/80" style={{ width: `${backlogPct}%` }} />
          )}
          <div className={`h-full ${style.bar}`} style={{ width: `${Math.max(0, ownPct)}%` }} />
        </div>
      </div>

      <div className={clsx("font-display text-lg font-bold tabular-nums", style.text)}>
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

      <div
        className={clsx(
          "flex items-center gap-1 border-t border-white/5 pt-1.5 text-[10px] font-medium",
          finish.overflows || finish.isLate ? "text-rose-300" : "text-slate-400",
        )}
      >
        <Clock4 className="h-3 w-3 shrink-0" />
        {finish.overflows
          ? `Empiète +${formatHoursMinutes(finish.overflowHours)} sur demain`
          : `Terminé à ${finish.finishLabel}`}
      </div>
    </div>
  );
}

export function CongestionForecast() {
  const { store, selectedDate } = useLogistics();
  const chain = useMemo(
    () => computeForecastChain(store, selectedDate, HORIZON_DAYS),
    [store, selectedDate],
  );

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
          subtitle={`${chain.length} jour${chain.length > 1 ? "s" : ""} saisi${chain.length > 1 ? "s" : ""} — se complète au fur et à mesure de la saisie`}
        />
        <span
          className={clsx(
            "rounded-full px-3 py-1.5 text-xs font-medium",
            anySnowballing ? "bg-rose-500/10 text-rose-300" : "bg-emerald-500/10 text-emerald-300",
          )}
        >
          {anySnowballing
            ? `Congestion — ${messages.join(" + ")} non absorbées après le ${formatDayLabel(lastKnown.date)}`
            : "Aucune accumulation sur les jours saisis"}
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
            Aucune donnée — saisissez la journée pour démarrer la vision semaine.
          </p>
        )}
      </motion.div>
    </GlassCard>
  );
}
