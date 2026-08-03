import { Gauge } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { SectionTitle, StatRow } from "../ui/StatRow";
import { useLogistics } from "../../state/LogisticsContext";
import { formatHoursMinutes, formatPercent } from "../../lib/format";
import { computeFinishEstimate, hoursToClockLabel, LATE_SHIPPING_HOUR } from "../../lib/schedule";
import { nowDecimalHours, todayISO } from "../../lib/storage";

export function CapacitySummaryCard() {
  const { derived, selectedDate } = useLogistics();
  const asOfHour = selectedDate === todayISO() ? nowDecimalHours() : null;
  const finish = computeFinishEstimate(derived, undefined, asOfHour);

  return (
    <GlassCard delay={0.2} glowColor={derived.status === "critical" ? "orange" : "cyan"}>
      <SectionTitle
        icon={<Gauge className="h-5 w-5" strokeWidth={2} />}
        title="Charge & capacité"
        subtitle={
          asOfHour !== null
            ? `Capacité restante à partir de ${hoursToClockLabel(asOfHour)}`
            : "Bilan préparateur-heures du jour"
        }
      />
      <StatRow label="Charge SILO" value={formatHoursMinutes(derived.siloChargeHours)} />
      <StatRow
        label="Charge Picking"
        value={formatHoursMinutes(derived.pickingChargeHours)}
      />
      <StatRow
        label="Charge totale"
        value={formatHoursMinutes(derived.totalChargeHours)}
        accent
      />
      <StatRow
        label="Capacité disponible"
        value={formatHoursMinutes(derived.totalCapacityHours)}
      />
      <StatRow
        label="Taux d'occupation"
        value={formatPercent(derived.occupancyRate)}
        accent
      />
      <StatRow
        label="Marge restante"
        value={
          derived.marginHours >= 0
            ? formatHoursMinutes(derived.marginHours)
            : "0h 00min"
        }
      />
      <StatRow
        label="Surcapacité éventuelle"
        value={
          derived.overloadHours > 0
            ? formatHoursMinutes(derived.overloadHours)
            : "Aucune"
        }
      />
      {finish.overflows ? (
        <StatRow
          label="Fin silo + picking"
          value={`Déborde de ${formatHoursMinutes(finish.overflowHours)} sur le lendemain`}
          tone="critical"
        />
      ) : (
        <StatRow
          label="Fin silo + picking"
          value={
            finish.isLate
              ? `${finish.finishLabel} — après ${LATE_SHIPPING_HOUR}h, chargement peu probable`
              : `${finish.finishLabel} (fin de poste ${finish.dayEndLabel})`
          }
          tone={finish.isLate ? "critical" : undefined}
        />
      )}
    </GlassCard>
  );
}
