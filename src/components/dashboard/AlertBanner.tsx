import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useLogistics } from "../../state/LogisticsContext";
import { formatHoursMinutes, formatPercent } from "../../lib/format";

const CONFIG = {
  ok: {
    icon: CheckCircle2,
    label: "Capacité suffisante",
    color: "text-alert-ok",
    ring: "ring-emerald-400/25",
    bg: "from-emerald-400/15 via-emerald-400/5 to-transparent",
    dot: "bg-emerald-400",
    text: (marginHours: number) =>
      `L'équipe dispose d'une marge de ${formatHoursMinutes(marginHours)} pour absorber la charge du jour.`,
  },
  warning: {
    icon: AlertTriangle,
    label: "Charge élevée",
    color: "text-alert-warn",
    ring: "ring-orange-400/25",
    bg: "from-orange-400/15 via-orange-400/5 to-transparent",
    dot: "bg-orange-400",
    text: (marginHours: number) =>
      `Le taux d'occupation dépasse 80%. Marge restante limitée : ${formatHoursMinutes(marginHours)}. Surveiller le flux.`,
  },
  critical: {
    icon: XCircle,
    label: "Capacité insuffisante",
    color: "text-alert-crit",
    ring: "ring-rose-400/25",
    bg: "from-rose-400/15 via-rose-400/5 to-transparent",
    dot: "bg-rose-400",
    text: (marginHours: number) =>
      `Déficit de capacité de ${formatHoursMinutes(-marginHours)}. Renfort ou report de charge nécessaire.`,
  },
} as const;

export function AlertBanner() {
  const { derived } = useLogistics();
  const cfg = CONFIG[derived.status];
  const Icon = cfg.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={derived.status}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.35 }}
        className={`glass-panel relative flex items-center gap-4 overflow-hidden p-4 ring-1 ${cfg.ring}`}
      >
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${cfg.bg}`} />
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/5">
          <span className={`absolute h-3 w-3 rounded-full ${cfg.dot} animate-ping`} />
          <Icon className={`relative h-6 w-6 ${cfg.color}`} strokeWidth={2} />
        </div>
        <div className="relative flex-1">
          <p className={`font-display text-sm font-semibold ${cfg.color}`}>
            {cfg.label} · {formatPercent(derived.occupancyRate)}
          </p>
          <p className="text-xs text-slate-400">{cfg.text(derived.marginHours)}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
