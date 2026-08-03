import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, CalendarPlus, Snowflake } from "lucide-react";
import clsx from "clsx";
import { GlassCard } from "../ui/GlassCard";
import { SectionTitle } from "../ui/StatRow";
import { useLogistics } from "../../state/LogisticsContext";
import { computeForecastChain, type DayForecast, type PendingDay } from "../../lib/backlog";
import { formatDayLabel, formatHoursMinutes, formatPercent } from "../../lib/format";

const STATUS_STYLE: Record<string, { text: string; bar: string; ring: string }> = {
  ok: { text: "text-emerald-300", bar: "bg-emerald-400", ring: "ring-emerald-400/20" },
  warning: { text: "text-orange-300", bar: "bg-orange-400", ring: "ring-orange-400/20" },
  critical: { text: "text-rose-300", bar: "bg-rose-400", ring: "ring-rose-400/20" },
};

function DayColumn({ day }: { day: DayForecast }) {
  const style = STATUS_STYLE[day.status];
  const capacity = day.own.totalCapacityHours || 1;
  // Au-delà de la capacité, on normalise les deux segments sur le total à traiter
  // (au lieu de plafonner le report seul) pour que la composition reste lisible
  // et que la sévérité (couleur du statut) ne soit jamais masquée par le report.
  const denom = Math.max(capacity, day.totalCharge) || 1;
  const backlogPct = (day.backlogIn / denom) * 100;
  const ownPct = (day.own.totalChargeHours / denom) * 100;
  const overflowPct = Math.max(
    0,
    ((day.totalCharge - day.own.totalCapacityHours) / capacity) * 100,
  );

  return (
    <div className={clsx("flex-1 rounded-xl border border-white/8 bg-white/[0.03] p-3.5 ring-1", style.ring)}>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-display text-sm font-semibold capitalize text-slate-100">
          {formatDayLabel(day.date)}
        </span>
        <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-slate-500">
          Saisi
        </span>
      </div>

      <div className="mb-1 h-2.5 w-full overflow-hidden rounded-full bg-white/5">
        <div className="flex h-full w-full">
          {backlogPct > 0 && (
            <div className="h-full bg-orange-400/80" style={{ width: `${backlogPct}%` }} />
          )}
          <div className={`h-full ${style.bar}`} style={{ width: `${Math.max(0, ownPct)}%` }} />
        </div>
      </div>
      {overflowPct > 0 && (
        <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-rose-500/10">
          <div
            className="h-full animate-pulse bg-rose-500"
            style={{ width: `${Math.min(100, overflowPct)}%` }}
          />
        </div>
      )}

      <dl className="space-y-1 text-xs">
        <div className="flex justify-between">
          <dt className="text-slate-500">Charge propre</dt>
          <dd className="tabular-nums text-slate-300">
            {formatHoursMinutes(day.own.totalChargeHours)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Report reçu</dt>
          <dd
            className={clsx(
              "tabular-nums",
              day.backlogIn > 0 ? "font-semibold text-orange-300" : "text-slate-600",
            )}
          >
            {day.backlogIn > 0 ? formatHoursMinutes(day.backlogIn) : "—"}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Capacité</dt>
          <dd className="tabular-nums text-slate-300">
            {formatHoursMinutes(day.own.totalCapacityHours)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-white/5 pt-1">
          <dt className="text-slate-400">Occupation</dt>
          <dd className={clsx("font-display font-semibold tabular-nums", style.text)}>
            {formatPercent(day.occupancyWithBacklog)}
          </dd>
        </div>
      </dl>

      <div
        className={clsx(
          "mt-2.5 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px]",
          day.congested
            ? "bg-rose-500/10 text-rose-300"
            : "bg-emerald-500/10 text-emerald-300",
        )}
      >
        {day.congested ? (
          <>
            <ArrowRight className="h-3 w-3 shrink-0" />
            Reporte {formatHoursMinutes(day.backlogOut)} au lendemain
          </>
        ) : (
          "Rien à reporter"
        )}
      </div>
    </div>
  );
}

function PendingColumn({ day }: { day: PendingDay }) {
  const { selectDate } = useLogistics();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.015] p-3.5 text-center">
      <span className="font-display text-sm font-semibold capitalize text-slate-400">
        {formatDayLabel(day.date)}
      </span>
      <span className="text-[11px] text-slate-600">Journée non saisie</span>
      {day.backlogIn !== null && day.backlogIn > 0 && (
        <span className="rounded-full bg-orange-400/10 px-2 py-1 text-[11px] font-medium text-orange-300">
          {formatHoursMinutes(day.backlogIn)} en attente
        </span>
      )}
      <button
        onClick={() => selectDate(day.date)}
        className="mt-1 flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-slate-400 transition-colors hover:border-cyan-300/30 hover:text-cyan-300"
      >
        <CalendarPlus className="h-3.5 w-3.5" />
        Saisir ce jour
      </button>
    </div>
  );
}

export function CongestionForecast() {
  const { store, selectedDate } = useLogistics();
  const { days, pending } = useMemo(
    () => computeForecastChain(store, selectedDate, 3),
    [store, selectedDate],
  );

  const lastKnown = days[days.length - 1];
  const isSnowballing = Boolean(lastKnown?.congested);

  return (
    <GlassCard delay={0.15} className="col-span-full" glowColor={isSnowballing ? "orange" : "cyan"}>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <SectionTitle
          icon={<Snowflake className="h-5 w-5" strokeWidth={2} />}
          title="Vision 72h · effet boule de neige"
          subtitle="Report de la charge non absorbée, jour après jour saisi"
        />
        <span
          className={clsx(
            "rounded-full px-3 py-1.5 text-xs font-medium",
            isSnowballing
              ? "bg-rose-500/10 text-rose-300"
              : "bg-emerald-500/10 text-emerald-300",
          )}
        >
          {isSnowballing
            ? `Congestion — ${formatHoursMinutes(lastKnown.backlogOut)} non absorbées après le ${formatDayLabel(lastKnown.date)}`
            : "Aucune accumulation sur les jours saisis"}
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="mt-3 flex flex-col items-stretch gap-2 md:flex-row md:items-center"
      >
        {days.map((day, i) => (
          <div key={day.date} className="flex flex-1 flex-col items-center gap-2 md:flex-row">
            <DayColumn day={day} />
            {(i < days.length - 1 || pending.length > 0) && (
              <div
                className={clsx(
                  "flex shrink-0 items-center justify-center",
                  day.congested ? "text-rose-400" : "text-slate-700",
                )}
              >
                <ArrowDown className="h-4 w-4 md:hidden" />
                <ArrowRight className="hidden h-4 w-4 md:block" />
              </div>
            )}
          </div>
        ))}
        {pending.map((day, i) => (
          <div key={day.date} className="flex flex-1 flex-col items-center gap-2 md:flex-row">
            <PendingColumn day={day} />
            {i < pending.length - 1 && (
              <div className="flex shrink-0 items-center justify-center text-slate-700">
                <ArrowDown className="h-4 w-4 md:hidden" />
                <ArrowRight className="hidden h-4 w-4 md:block" />
              </div>
            )}
          </div>
        ))}
      </motion.div>
    </GlassCard>
  );
}
