import { Boxes } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { SectionTitle, StatRow } from "../ui/StatRow";
import { AnimatedNumber } from "../ui/AnimatedNumber";
import { useLogistics } from "../../state/LogisticsContext";
import { formatHoursMinutes, formatInt } from "../../lib/format";

export function PickingCard() {
  const { inputs, derived } = useLogistics();

  return (
    <GlassCard delay={0.1}>
      <SectionTitle
        icon={<Boxes className="h-5 w-5" strokeWidth={2} />}
        title="Activité Picking"
        subtitle="Préparation de commandes"
      />
      <div className="mb-3 flex items-baseline gap-2">
        <span className="font-display text-3xl font-bold tabular-nums text-white">
          <AnimatedNumber value={inputs.pickingColis} />
        </span>
        <span className="text-sm text-slate-400">colis</span>
      </div>
      <StatRow label="Cadence" value={`${inputs.pickingCadence} colis/h/prépa`} />
      {inputs.pickingEfficiencyPct !== 100 && (
        <StatRow
          label="Efficacité"
          value={`${inputs.pickingEfficiencyPct}% → ${Math.round(derived.pickingEffectiveCadence)} colis/h eff.`}
        />
      )}
      <StatRow label="Préparateurs dispo" value={derived.totalPreparateurs} />
      <StatRow
        label="Colis max / jour"
        value={formatInt(Math.ceil(derived.totalCapacityHours * derived.pickingEffectiveCadence))}
        accent
      />
      <StatRow
        label="Temps estimé (parallèle)"
        value={formatHoursMinutes(derived.pickingTimeHours)}
        accent
      />
      <StatRow
        label="Charge (préparateur-h)"
        value={formatHoursMinutes(derived.pickingChargeHours)}
      />
    </GlassCard>
  );
}
