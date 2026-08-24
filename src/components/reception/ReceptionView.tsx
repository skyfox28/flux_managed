import { Boxes, Gauge, Layers, TrendingUp, Truck } from "lucide-react";
import { useFlows } from "../../state/FlowsContext";
import { EmptyState } from "../ui/EmptyState";
import { KpiCard } from "../ui/KpiCard";
import { ReceptionChart } from "./ReceptionChart";
import { ReceptionTable } from "./ReceptionTable";
import { formatDayLabel, formatInt } from "../../lib/format";

export function ReceptionView() {
  const { settings, reception, pickAndSetPath } = useFlows();

  if (!settings.receptionPath) {
    return (
      <EmptyState
        title="Aucun fichier de réception configuré"
        description="Sélectionnez le fichier Excel de planning réception (ex. Planning_Réception.xlsb) pour afficher le flux entrant par site et par jour."
        action={
          <button
            type="button"
            onClick={() => pickAndSetPath("reception")}
            className="rounded-lg border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200 hover:bg-cyan-400/20"
          >
            Choisir le fichier réception
          </button>
        }
      />
    );
  }

  if (reception.error) {
    return (
      <EmptyState
        title="Impossible de lire le fichier de réception"
        description={reception.error}
      />
    );
  }

  const data = reception.data;
  if (!data || data.days.length === 0) {
    return (
      <EmptyState
        title="Aucune donnée trouvée"
        description="Le fichier a été lu mais aucun jour de réception n'a été détecté dans la feuille Synthèse."
      />
    );
  }

  const lastActiveDay = [...data.days].reverse().find((day) => day.totalPalReception.palettes > 0);
  const lastDay = lastActiveDay ?? data.days[data.days.length - 1];
  const occupancy = lastDay.capacite ? (lastDay.totalPalReception.palettes / lastDay.capacite) * 100 : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          icon={<Boxes className="h-5 w-5" />}
          label={`Palettes reçues — ${formatDayLabel(lastDay.dateISO)}`}
          value={lastDay.totalPalReception.palettes}
          decimals={1}
          tone="cyan"
        />
        <KpiCard
          icon={<Truck className="h-5 w-5" />}
          label="Camions du jour"
          value={lastDay.totalPalReception.camions}
          decimals={1}
          tone="cyan"
        />
        <KpiCard
          icon={<Gauge className="h-5 w-5" />}
          label="Taux d'occupation capacité"
          value={occupancy ?? 0}
          decimals={0}
          suffix="%"
          tone={occupancy && occupancy > 100 ? "rose" : occupancy && occupancy > 80 ? "amber" : "emerald"}
          hint={lastDay.capacite ? `Capacité ${formatInt(lastDay.capacite)} pal./jour` : undefined}
        />
        <KpiCard
          icon={<Layers className="h-5 w-5" />}
          label="Cumul palettes (semaine)"
          value={lastDay.cumulPalettes ?? 0}
          decimals={1}
          tone="cyan"
        />
        <KpiCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Capacité SILO semaine"
          value={data.capaciteSiloSemaine ?? 0}
          decimals={0}
          tone="emerald"
          hint={data.solde !== null ? `Solde ${data.solde >= 0 ? "+" : ""}${data.solde.toFixed(0)}` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <ReceptionChart days={data.days} siteNames={data.siteNames} />
        <ReceptionTable days={data.days} siteNames={data.siteNames} totals={data.totals} />
      </div>
    </div>
  );
}
