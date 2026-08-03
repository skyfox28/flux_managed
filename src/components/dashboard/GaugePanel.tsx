import { CircleGauge } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { SectionTitle } from "../ui/StatRow";
import { OccupancyGauge } from "./OccupancyGauge";

export function GaugePanel() {
  return (
    <GlassCard delay={0} className="flex h-full flex-col xl:col-span-4" glowColor="cyan">
      <SectionTitle
        icon={<CircleGauge className="h-5 w-5" strokeWidth={2} />}
        title="Occupation globale"
        subtitle="Charge totale / capacité disponible"
      />
      <div className="flex-1">
        <OccupancyGauge />
      </div>
    </GlassCard>
  );
}
