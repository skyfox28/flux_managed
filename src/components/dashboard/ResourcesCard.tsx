import { Users } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { SectionTitle, StatRow } from "../ui/StatRow";
import { useLogistics } from "../../state/LogisticsContext";
import { formatHoursMinutes } from "../../lib/format";

export function ResourcesCard() {
  const { derived } = useLogistics();

  return (
    <GlassCard delay={0.15}>
      <SectionTitle
        icon={<Users className="h-5 w-5" strokeWidth={2} />}
        title="Ressources humaines"
        subtitle="Effectifs & capacité par équipe (pauses déduites)"
      />
      <div className="space-y-1">
        {derived.teams.map((team) => (
          <StatRow
            key={team.id}
            label={`${team.label} (${team.start}–${team.end})`}
            value={`${team.headcount} · ${formatHoursMinutes(team.capacityHours)}`}
          />
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-slate-600">
        Durée effective = horaire de poste − 30 min de pause (10 + 20 min).
      </p>
      <div className="mt-3 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
        <span className="text-sm font-medium text-slate-300">Total préparateurs</span>
        <span className="font-display text-lg font-bold text-electric-300">
          {derived.totalPreparateurs}
        </span>
      </div>
    </GlassCard>
  );
}
