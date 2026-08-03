import type { ReactNode } from "react";
import clsx from "clsx";

interface StatRowProps {
  label: string;
  value: ReactNode;
  accent?: boolean;
  className?: string;
}

export function StatRow({ label, value, accent, className }: StatRowProps) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between border-b border-white/5 py-2 last:border-0",
        className,
      )}
    >
      <span className="text-sm text-slate-400">{label}</span>
      <span
        className={clsx(
          "font-display tabular-nums text-sm font-semibold",
          accent ? "text-electric-300" : "text-slate-100",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400/20 to-cyan-400/10 text-cyan-300 ring-1 ring-cyan-300/20">
        {icon}
      </div>
      <div>
        <h3 className="font-display text-sm font-semibold tracking-wide text-slate-100">
          {title}
        </h3>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}
