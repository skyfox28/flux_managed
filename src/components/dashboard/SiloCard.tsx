import { Package } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { SectionTitle, StatRow } from "../ui/StatRow";
import { AnimatedNumber } from "../ui/AnimatedNumber";
import { useLogistics } from "../../state/LogisticsContext";
import { formatHoursMinutes } from "../../lib/format";

export function SiloCard() {
  const { inputs, derived } = useLogistics();

  return (
    <GlassCard delay={0.05}>
      <SectionTitle
        icon={<Package className="h-5 w-5" strokeWidth={2} />}
        title="Activité SILO"
        subtitle="Réception & stockage palettes"
      />
      <div className="mb-3 flex items-baseline gap-2">
        <span className="font-display text-3xl font-bold tabular-nums text-white">
          <AnimatedNumber value={inputs.siloPalettes} />
        </span>
        <span className="text-sm text-slate-400">palettes</span>
      </div>
      <StatRow label="Cadence" value={`${inputs.siloCadence} pal/h`} />
      <StatRow
        label="Temps estimé"
        value={formatHoursMinutes(derived.siloTimeHours)}
        accent
      />
      <StatRow
        label="Charge (préparateur-h)"
        value={formatHoursMinutes(derived.siloChargeHours)}
      />
    </GlassCard>
  );
}
