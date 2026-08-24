import { Boxes, Clock, PackageCheck, Truck } from "lucide-react";
import { useFlows } from "../../state/FlowsContext";
import { EmptyState } from "../ui/EmptyState";
import { KpiCard } from "../ui/KpiCard";
import { ExpeditionChart } from "./ExpeditionChart";
import { ExpeditionTable } from "./ExpeditionTable";
import { formatInt } from "../../lib/format";
import type { ExpeditionDayTotal } from "../../types/flows";

function summaryTotal(dayTotals: ExpeditionDayTotal[], grandTotal: ExpeditionDayTotal | null): ExpeditionDayTotal | null {
  if (grandTotal) return grandTotal;
  if (dayTotals.length > 0) {
    return dayTotals.reduce<ExpeditionDayTotal>(
      (acc, day) => ({
        label: "Total",
        dateISO: null,
        liv: acc.liv + day.liv,
        codes: acc.codes + day.codes,
        palSilo: acc.palSilo + day.palSilo,
        hrSilo: acc.hrSilo + day.hrSilo,
        nbPick: acc.nbPick + day.nbPick,
        colisPicking: acc.colisPicking + day.colisPicking,
        hrPick: acc.hrPick + day.hrPick,
        totalColis: acc.totalColis + day.totalColis,
      }),
      { label: "Total", dateISO: null, liv: 0, codes: 0, palSilo: 0, hrSilo: 0, nbPick: 0, colisPicking: 0, hrPick: 0, totalColis: 0 },
    );
  }
  return null;
}

export function ExpeditionView() {
  const { settings, expedition, pickAndSetPath } = useFlows();

  if (!settings.expeditionPath) {
    return (
      <EmptyState
        title="Aucun fichier d'expédition configuré"
        description="Sélectionnez le fichier Excel d'activité de préparation (ex. Analyse_Activité_Préparation.xlsb) pour afficher le flux sortant du jour."
        action={
          <button
            type="button"
            onClick={() => pickAndSetPath("expedition")}
            className="rounded-lg border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200 hover:bg-cyan-400/20"
          >
            Choisir le fichier expédition
          </button>
        }
      />
    );
  }

  if (expedition.error) {
    return <EmptyState title="Impossible de lire le fichier d'expédition" description={expedition.error} />;
  }

  const data = expedition.data;
  if (!data || (data.deliveries.length === 0 && data.dayTotals.length === 0)) {
    return (
      <EmptyState
        title="Aucune donnée trouvée"
        description="Le fichier a été lu mais aucune livraison n'a été détectée dans la feuille d'activité de préparation."
      />
    );
  }

  const total = summaryTotal(data.dayTotals, data.grandTotal);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard icon={<Truck className="h-5 w-5" />} label="Livraisons" value={total?.liv ?? data.deliveries.length} tone="cyan" />
        <KpiCard icon={<Boxes className="h-5 w-5" />} label="Palettes SILO" value={total?.palSilo ?? 0} decimals={1} tone="electric" />
        <KpiCard
          icon={<Clock className="h-5 w-5" />}
          label="Heures SILO"
          value={total?.hrSilo ?? 0}
          decimals={1}
          suffix="h"
          tone="amber"
        />
        <KpiCard
          icon={<PackageCheck className="h-5 w-5" />}
          label="Colis Picking"
          value={total?.colisPicking ?? 0}
          tone="emerald"
          hint={total ? `${formatInt(total.hrPick * 60)} min` : undefined}
        />
        <KpiCard icon={<Boxes className="h-5 w-5" />} label="Total colis expédiés" value={total?.totalColis ?? 0} tone="rose" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {data.dayTotals.length > 0 && <ExpeditionChart dayTotals={data.dayTotals} />}
        <ExpeditionTable deliveries={data.deliveries} grandTotal={data.grandTotal} />
      </div>
    </div>
  );
}
