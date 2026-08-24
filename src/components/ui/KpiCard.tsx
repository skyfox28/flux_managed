import type { ReactNode } from "react";
import clsx from "clsx";
import { AnimatedNumber } from "./AnimatedNumber";

interface KpiCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  tone?: "cyan" | "electric" | "amber" | "emerald" | "rose";
  hint?: string;
}

const TONE_CLASS: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  cyan: "text-cyan-300",
  electric: "text-sky-300",
  amber: "text-orange-300",
  emerald: "text-emerald-300",
  rose: "text-rose-300",
};

export function KpiCard({ icon, label, value, decimals = 0, suffix = "", tone = "cyan", hint }: KpiCardProps) {
  return (
    <div className="glass-panel relative flex items-center gap-3 overflow-hidden p-4">
      <div className="glass-sheen" />
      <div className={clsx("relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10", TONE_CLASS[tone])}>
        {icon}
      </div>
      <div className="relative min-w-0">
        <p className="truncate text-xs text-slate-500">{label}</p>
        <p className={clsx("font-display text-xl font-bold tabular-nums", TONE_CLASS[tone])}>
          <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
        </p>
        {hint && <p className="truncate text-[11px] text-slate-600">{hint}</p>}
      </div>
    </div>
  );
}
