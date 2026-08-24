import { useFlows } from "../../state/FlowsContext";
import { FileSourceCard } from "./FileSourceCard";

export function SettingsView() {
  const { settings, reception, expedition, pickAndSetPath, clearPath, refresh } = useFlows();

  return (
    <div className="flex flex-col gap-5">
      <div className="glass-panel relative overflow-hidden p-5">
        <div className="glass-sheen" />
        <h2 className="font-display text-base font-semibold text-slate-100">Sources de données</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Sélectionnez le fichier Excel de réception et celui d'expédition utilisés par votre site
          (formats .xlsb / .xlsx / .xlsm). L'application relit automatiquement le fichier dès qu'il
          est enregistré à nouveau — inutile de relancer l'app après chaque actualisation macro.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <FileSourceCard
          title="Flux Réception"
          description="Feuille « Synthèse » : palettes / camions reçus par site et par jour."
          path={settings.receptionPath}
          loading={reception.loading}
          error={reception.error}
          lastReadAt={reception.lastReadAt}
          onPick={() => pickAndSetPath("reception")}
          onClear={() => clearPath("reception")}
          onRefresh={() => refresh("reception")}
        />
        <FileSourceCard
          title="Flux Expédition"
          description="Feuille « Activité Préparat-N° Livraison » : livraisons, SILO et Picking du jour."
          path={settings.expeditionPath}
          loading={expedition.loading}
          error={expedition.error}
          lastReadAt={expedition.lastReadAt}
          onPick={() => pickAndSetPath("expedition")}
          onClear={() => clearPath("expedition")}
          onRefresh={() => refresh("expedition")}
        />
      </div>
    </div>
  );
}
