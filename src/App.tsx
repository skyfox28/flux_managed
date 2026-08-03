import { LogisticsProvider } from "./state/LogisticsContext";
import { Header } from "./components/layout/Header";
import { DayBar } from "./components/dashboard/DayBar";
import { AlertBanner } from "./components/dashboard/AlertBanner";
import { RecommendationsPanel } from "./components/dashboard/RecommendationsPanel";
import { GaugePanel } from "./components/dashboard/GaugePanel";
import { FlowScenePanel } from "./components/dashboard/FlowScenePanel";
import { SiloCard } from "./components/dashboard/SiloCard";
import { PickingCard } from "./components/dashboard/PickingCard";
import { ResourcesCard } from "./components/dashboard/ResourcesCard";
import { CapacitySummaryCard } from "./components/dashboard/CapacitySummaryCard";
import { CongestionForecast } from "./components/dashboard/CongestionForecast";
import { ControlPanel } from "./components/inputs/ControlPanel";
import { LoadCurveChart } from "./components/charts/LoadCurveChart";
import { SiloPickingBarChart } from "./components/charts/SiloPickingBarChart";
import { CapacityHeatmap } from "./components/charts/CapacityHeatmap";
import { CapacityEvolutionChart } from "./components/charts/CapacityEvolutionChart";

function App() {
  return (
    <LogisticsProvider>
      <div className="app-backdrop" />
      <div className="app-grid" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <Header />
        <DayBar />
        <AlertBanner />
        <RecommendationsPanel />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_1fr]">
          <ControlPanel />

          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
              <GaugePanel />
              <FlowScenePanel />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              <SiloCard />
              <PickingCard />
              <ResourcesCard />
              <CapacitySummaryCard />
            </div>

            <CongestionForecast />

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              <LoadCurveChart />
              <SiloPickingBarChart />
              <CapacityHeatmap />
              <CapacityEvolutionChart />
            </div>
          </div>
        </div>

        <footer className="py-4 text-center text-xs text-slate-600">
          FluxCore — Centre de pilotage logistique · Données simulées, recalcul instantané.
        </footer>
      </div>
    </LogisticsProvider>
  );
}

export default App;
