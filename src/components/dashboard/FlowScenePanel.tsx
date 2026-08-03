import { Waypoints } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { SectionTitle } from "../ui/StatRow";
import { FlowScene } from "../scene/FlowScene";

export function FlowScenePanel() {
  return (
    <GlassCard delay={0.1} className="flex h-full flex-col xl:col-span-8" glowColor="cyan">
      <SectionTitle
        icon={<Waypoints className="h-5 w-5" strokeWidth={2} />}
        title="Flux logistique en temps réel"
        subtitle="Palettes → Silo → Picking → Expéditions"
      />
      <div className="min-h-[300px] flex-1">
        <FlowScene />
      </div>
    </GlassCard>
  );
}
