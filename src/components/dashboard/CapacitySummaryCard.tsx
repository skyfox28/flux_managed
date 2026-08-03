import { Gauge } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { SectionTitle, StatRow } from "../ui/StatRow";
import { useLogistics } from "../../state/LogisticsContext";
import { formatHoursMinutes, formatPercent } from "../../lib/format";

export function CapacitySummaryCard() {
  const { derived } = useLogistics();

  return (
    <GlassCard delay={0.2} glowColor={derived.status === "critical" ? "orange" : "cyan"}>
      <SectionTitle
        icon={<Gauge className="h-5 w-5" strokeWidth={2} />}
        title="Charge & capacité"
        subtitle="Bilan préparateur-heures du jour"
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
    </GlassCard>
  );
}
