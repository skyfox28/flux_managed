import {
  Activity,
  Boxes,
  Clock,
  Package,
  RotateCcw,
  SlidersHorizontal,
  Users,
  Wrench,
} from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { SectionTitle } from "../ui/StatRow";
import { SliderField } from "./SliderField";
import { useLogistics } from "../../state/LogisticsContext";
import { formatHoursMinutes } from "../../lib/format";
import { BREAK_HOURS_PER_SHIFT } from "../../lib/calculations";

/** Fenêtre nette = n équipes × (durée du poste − pauses 10+20min), comme pour les équipes humaines. */
function netShiftHours(shifts: number, shiftLength: number): number {
  return shifts * Math.max(0, shiftLength - BREAK_HOURS_PER_SHIFT);
}

export function ControlPanel() {
  const {
    inputs,
    setSiloPalettes,
    setSiloCadence,
    setSiloEfficiencyPct,
    setSiloDowntimeHours,
    setSiloWindowHours,
    setPickingColis,
    setPickingCadence,
    setPickingEfficiencyPct,
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
          SILO · magasin automatique
        </p>
        <SliderField
          label="Palettes à sortir"
          value={inputs.siloPalettes}
          min={0}
          max={3000}
          step={10}
          unit="pal"
          icon={<Package className="h-3.5 w-3.5" />}
          onChange={setSiloPalettes}
        />
        <SliderField
          label="Cadence de sortie"
          value={inputs.siloCadence}
          min={1}
          max={60}
          step={1}
          unit="pal/h"
          icon={<Package className="h-3.5 w-3.5" />}
          onChange={setSiloCadence}
        />
        <SliderField
          label="Efficacité (humain/machine)"
          value={inputs.siloEfficiencyPct}
          min={50}
          max={150}
          step={5}
          unit="%"
          icon={<Activity className="h-3.5 w-3.5" />}
          onChange={setSiloEfficiencyPct}
        />
        <SliderField
          label="Arrêt silo (panne)"
          value={inputs.siloDowntimeHours}
          min={0}
          max={12}
          step={0.5}
          unit="h"
          icon={<Wrench className="h-3.5 w-3.5" />}
          onChange={setSiloDowntimeHours}
        />
        <SliderField
          label="Fenêtre silo (fonctionnement/jour)"
          value={inputs.siloWindowHours}
          min={0}
          max={24}
          step={0.2}
          unit="h/j"
          icon={<Clock className="h-3.5 w-3.5" />}
          onChange={setSiloWindowHours}
        />
        <p className="text-[10px] text-slate-600">Pauses (10+20min) déjà déduites par équipe.</p>
        <div className="flex flex-wrap gap-1.5 pb-1">
          {[
            { label: "2×7h36", hours: netShiftHours(2, 7.6) },
            { label: "2×8h", hours: netShiftHours(2, 8) },
            { label: "3×7h36", hours: netShiftHours(3, 7.6) },
            { label: "3×8h", hours: netShiftHours(3, 8) },
            { label: "+6h samedi", hours: inputs.siloWindowHours + netShiftHours(1, 6) },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => setSiloWindowHours(preset.hours)}
              className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-slate-500 transition-colors hover:border-cyan-300/30 hover:text-cyan-300"
            >
              {preset.label} · {formatHoursMinutes(preset.hours)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 space-y-1 border-t border-white/5 pt-2">
        <p className="pt-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-electric-400">
          Picking
        </p>
        <SliderField
          label="Colis"
          value={inputs.pickingColis}
          min={0}
          max={100000}
          step={100}
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
        <SliderField
          label="Efficacité (humain/machine)"
          value={inputs.pickingEfficiencyPct}
          min={50}
          max={150}
          step={5}
          unit="%"
          icon={<Activity className="h-3.5 w-3.5" />}
          onChange={setPickingEfficiencyPct}
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
