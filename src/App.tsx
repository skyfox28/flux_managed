import { useState } from "react";
import { FlowsProvider, useFlows } from "./state/FlowsContext";
import { Header } from "./components/layout/Header";
import { ReceptionView } from "./components/reception/ReceptionView";
import { ExpeditionView } from "./components/expedition/ExpeditionView";
import { SettingsView } from "./components/settings/SettingsView";
import type { View } from "./types/flows";

function Shell() {
  const [view, setView] = useState<View>("reception");
  const { settings } = useFlows();
  const connected = Boolean(settings.receptionPath || settings.expeditionPath);

  return (
    <>
      <div className="app-backdrop" />
      <div className="app-grid" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <Header view={view} onViewChange={setView} connected={connected} />

        {view === "reception" && <ReceptionView />}
        {view === "expedition" && <ExpeditionView />}
        {view === "settings" && <SettingsView />}

        <footer className="py-4 text-center text-xs text-slate-600">
          FluxCore — Pilotage des flux Réception &amp; Expédition à partir des fichiers Excel du site.
        </footer>
      </div>
    </>
  );
}

function App() {
  return (
    <FlowsProvider>
      <Shell />
    </FlowsProvider>
  );
}

export default App;
