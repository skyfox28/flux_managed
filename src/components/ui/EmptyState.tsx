import type { ReactNode } from "react";
import { FileSpreadsheet } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="glass-panel relative flex flex-col items-center gap-3 overflow-hidden p-12 text-center">
      <div className="glass-sheen" />
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400/20 to-cyan-400/10 text-cyan-300 ring-1 ring-cyan-300/20">
        <FileSpreadsheet className="h-7 w-7" />
      </div>
      <h3 className="relative font-display text-base font-semibold text-slate-100">{title}</h3>
      <p className="relative max-w-md text-sm text-slate-500">{description}</p>
      {action && <div className="relative mt-2">{action}</div>}
    </div>
  );
}
