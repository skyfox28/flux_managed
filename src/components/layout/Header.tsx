import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Radar, PackageSearch, Truck, Settings2 } from "lucide-react";
import clsx from "clsx";
import type { View } from "../../types/flows";

const TABS: { id: View; label: string; icon: typeof Truck }[] = [
  { id: "reception", label: "Réception", icon: Truck },
  { id: "expedition", label: "Expédition", icon: PackageSearch },
  { id: "settings", label: "Réglages", icon: Settings2 },
];

export function Header({
  view,
  onViewChange,
  connected,
}: {
  view: View;
  onViewChange: (view: View) => void;
  connected: boolean;
}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const date = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel relative flex flex-col gap-4 overflow-hidden p-5 lg:flex-row lg:items-center lg:justify-between"
    >
      <div className="glass-sheen" />
      <div className="relative flex items-center gap-3">
        <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400/25 to-cyan-400/10 ring-1 ring-cyan-300/30">
          <Radar className="h-6 w-6 text-cyan-300" strokeWidth={2} />
          <span className="absolute inset-0 animate-pulse rounded-2xl ring-2 ring-cyan-300/20" />
        </div>
        <div>
          <h1 className="font-display text-lg font-bold tracking-tight text-white sm:text-xl">
            FluxCore <span className="text-cyan-300">·</span>{" "}
            <span className="text-slate-400">Réception &amp; Expédition</span>
          </h1>
          <p className="text-xs text-slate-500">
            Pilotage des flux logistiques à partir des fichiers Excel du site
          </p>
        </div>
      </div>

      <nav className="relative flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 p-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.id === view;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onViewChange(tab.id)}
              className={clsx(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/30"
                  : "text-slate-400 hover:text-slate-200",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="relative flex items-center gap-4">
        <div className="hidden text-right sm:block">
          <p className="text-xs capitalize text-slate-500">{date}</p>
          <p className="font-display text-lg font-semibold tabular-nums text-cyan-200">
            {time}
          </p>
        </div>
        <div
          className={clsx(
            "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
            connected
              ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
              : "border-rose-400/25 bg-rose-400/10 text-rose-300",
          )}
        >
          <Activity className="h-3.5 w-3.5 animate-pulse" />
          {connected ? "Sources connectées" : "Sources à configurer"}
        </div>
      </div>
    </motion.header>
  );
}
