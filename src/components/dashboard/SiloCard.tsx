import { Package } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { SectionTitle, StatRow } from "../ui/StatRow";
import { AnimatedNumber } from "../ui/AnimatedNumber";
import { useLogistics } from "../../state/LogisticsContext";
import { formatHoursMinutes, formatInt } from "../../lib/format";

export function SiloCard() {
  const { inputs, derived } = useLogistics();

  return (
    <GlassCard delay={0.05}>
      <SectionTitle
        icon={<Package className="h-5 w-5" strokeWidth={2} />}
        title="Activité SILO"
        subtitle="Sorties magasin automatique"
      />
      <div className="mb-3 flex items-baseline gap-2">
        <span className="font-display text-3xl font-bold tabular-nums text-white">
          <AnimatedNumber value={inputs.siloPalettes} />
        </span>
        <span className="text-sm text-slate-400">palettes à sortir</span>
      </div>
      <StatRow label="Cadence de sortie" value={`${inputs.siloCadence} pal/h`} />
      {inputs.siloEfficiencyPct !== 100 && (
        <StatRow
          label="Efficacité"
          value={`${inputs.siloEfficiencyPct}% → ${Math.round(derived.siloEffectiveCadence)} pal/h eff.`}
        />
      )}
      {inputs.siloDowntimeHours > 0 && (
        <StatRow
          label="Arrêt silo (panne)"
          value={`+${formatHoursMinutes(inputs.siloDowntimeHours)}`}
          tone="warning"
        />
      )}
      <StatRow
        label="Fenêtre silo (fonctionnement/j)"
        value={formatHoursMinutes(inputs.siloWindowHours)}
      />
      <StatRow
        label="Palettes max / jour"
        value={formatInt(Math.ceil(inputs.siloWindowHours * derived.siloEffectiveCadence))}
        accent
      />
      <StatRow
        label="Temps nécessaire (brut)"
        value={formatHoursMinutes(derived.siloTimeHours)}
        accent
      />
      <StatRow
        label="Absorbé aujourd'hui"
        value={formatHoursMinutes(derived.siloChargeHours)}
      />
      {derived.siloOverflowHours > 0 && (
        <StatRow
          label="Hors fenêtre (à reporter)"
          value={`+${formatHoursMinutes(derived.siloOverflowHours)}`}
          tone="critical"
        />
      )}
    </GlassCard>
  );
}
