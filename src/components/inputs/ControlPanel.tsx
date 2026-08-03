import { Boxes, Package, RotateCcw, SlidersHorizontal, Users } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { SectionTitle } from "../ui/StatRow";
import { SliderField } from "./SliderField";
import { useLogistics } from "../../state/LogisticsContext";

export function ControlPanel() {
  const {
    inputs,
    setSiloPalettes,
    setSiloCadence,
    setPickingColis,
    setPickingCadence,
    setTeamHeadcount,
    reset,
  } = useLogistics();

  return (
    <GlassCard delay={0} className="lg:sticky lg:top-6">
      <div className="mb-1 flex items-center justify-between">
        <SectionTitle
          icon={<SlidersHorizontal className="h-5 w-5" strokeWidth={2} />}
          title="Simulateur"
          subtitle="Saisie du jour — recalcul instantané"
        />
        <button
          onClick={reset}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:border-cyan-300/30 hover:text-cyan-300"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Réinitialiser
        </button>
      </div>

      <div className="mt-2 space-y-1 border-t border-white/5 pt-2">
        <p className="pt-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-electric-400">
          SILO
        </p>
        <SliderField
          label="Palettes"
          value={inputs.siloPalettes}
          min={0}
          max={1500}
          step={10}
          unit="pal"
          icon={<Package className="h-3.5 w-3.5" />}
          onChange={setSiloPalettes}
        />
        <SliderField
          label="Cadence SILO"
          value={inputs.siloCadence}
          min={1}
          max={60}
          step={1}
          unit="pal/h"
          icon={<Package className="h-3.5 w-3.5" />}
          onChange={setSiloCadence}
        />
      </div>

      <div className="mt-2 space-y-1 border-t border-white/5 pt-2">
        <p className="pt-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-electric-400">
          Picking
        </p>
        <SliderField
          label="Colis"
          value={inputs.pickingColis}
          min={0}
          max={20000}
          step={50}
          unit="colis"
          icon={<Boxes className="h-3.5 w-3.5" />}
          onChange={setPickingColis}
        />
        <SliderField
          label="Cadence Picking"
          value={inputs.pickingCadence}
          min={50}
          max={1000}
          step={10}
          unit="colis/h"
          icon={<Boxes className="h-3.5 w-3.5" />}
          onChange={setPickingCadence}
        />
      </div>

      <div className="mt-2 space-y-1 border-t border-white/5 pt-2">
        <p className="pt-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-electric-400">
          Effectifs (horaires fixes)
        </p>
        {inputs.teams.map((team) => (
          <SliderField
            key={team.id}
            label={`${team.label} · ${team.start}–${team.end}`}
            value={team.headcount}
            min={0}
            max={30}
            step={1}
            unit="prépa"
            icon={<Users className="h-3.5 w-3.5" />}
            onChange={(v) => setTeamHeadcount(team.id, v)}
          />
        ))}
      </div>
    </GlassCard>
  );
}
